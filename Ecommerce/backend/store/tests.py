from decimal import Decimal

from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Cart, CartItem, Category, Order, Product


class StoreApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testuser", password="testpass123")
        self.category = Category.objects.create(name="Phones", slug="phones")
        self.product = Product.objects.create(
            category=self.category,
            name="Pixel",
            description="Phone",
            price=Decimal("100.00"),
        )

    def authenticate(self):
        self.client.force_authenticate(user=self.user)

    def test_create_order_uses_checkout_fields_and_clears_cart(self):
        self.authenticate()
        cart, _ = Cart.objects.get_or_create(user=self.user)
        CartItem.objects.create(cart=cart, product=self.product, quantity=2)

        response = self.client.post(
            reverse("order_create"),
            {
                "name": "Alice",
                "address": "221B Baker Street",
                "phone": "9876543210",
                "payment_method": "COD",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Order.objects.count(), 1)

        order = Order.objects.first()
        self.assertEqual(order.total_amount, Decimal("200.00"))
        self.assertEqual(order.name, "Alice")
        self.assertEqual(cart.items.count(), 0)

    def test_products_endpoint_supports_search(self):
        self.authenticate()
        response = self.client.get(reverse("products"), {"search": "pixel"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["name"], "Pixel")

    def test_products_endpoint_filters_by_product_type(self):
        Product.objects.create(
            category=self.category,
            name="Elite Mix",
            price=Decimal("150.00"),
            product_type="ELITE",
        )

        response = self.client.get(reverse("products"), {"product_type": "elite"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([product["name"] for product in response.data], ["Elite Mix"])

    def test_product_detail_accepts_slug(self):
        response = self.client.get(reverse("product_detail", args=[self.product.slug]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["slug"], self.product.slug)

    def test_cart_rejects_out_of_stock_product(self):
        self.authenticate()
        self.product.stock_quantity = 0
        self.product.save(update_fields=["stock_quantity", "updated_at"])

        response = self.client.post(
            reverse("cart_add"), {"product_id": self.product.id, "quantity": 1}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("stock", response.data["error"])

    def test_cart_returns_subtotal_and_total(self):
        self.authenticate()
        cart, _ = Cart.objects.get_or_create(user=self.user)
        CartItem.objects.create(cart=cart, product=self.product, quantity=3)

        response = self.client.get(reverse("cart"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Decimal(response.data["total"]), Decimal("300.00"))
        self.assertEqual(Decimal(response.data["items"][0]["subtotal"]), Decimal("300.00"))
