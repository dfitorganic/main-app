from django.contrib.auth.models import User
from django.db import models
from django.utils.text import slugify


# Create your models here.
class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to="categories/", blank=True, null=True)
    is_active = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.name


class Product(models.Model):
    PRODUCT_TYPE_CHOICES = [
        ("ESSENTIAL", "Essential"),
        ("ELITE", "Elite"),
    ]

    category = models.ForeignKey(
        Category, related_name="products", on_delete=models.CASCADE
    )
    product_type = models.CharField(
        max_length=10, choices=PRODUCT_TYPE_CHOICES, default="ESSENTIAL"
    )
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, blank=True, null=True)
    short_description = models.CharField(max_length=280, blank=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    original_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    sku = models.CharField(max_length=80, unique=True, blank=True, null=True)
    stock_quantity = models.PositiveIntegerField(default=0)
    low_stock_threshold = models.PositiveIntegerField(default=5)
    weight = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    unit = models.CharField(max_length=30, blank=True)
    ingredients = models.TextField(blank=True)
    nutrition_information = models.TextField(blank=True)
    allergens = models.TextField(blank=True)
    storage_instructions = models.TextField(blank=True)
    benefits = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    is_new = models.BooleanField(default=True)
    image = models.ImageField(upload_to="products/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["is_active", "is_featured"]),
            models.Index(fields=["category", "created_at"]),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name) or "product"
            candidate = base_slug
            counter = 2
            while Product.objects.filter(slug=candidate).exclude(pk=self.pk).exists():
                candidate = f"{base_slug}-{counter}"
                counter += 1
            self.slug = candidate
        if not self.sku:
            self.sku = f"DFIT-{self.slug[:56].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class ProductImage(models.Model):
    product = models.ForeignKey(Product, related_name="images", on_delete=models.CASCADE)
    image = models.ImageField(upload_to="products/gallery/")
    alt_text = models.CharField(max_length=200, blank=True)
    display_order = models.PositiveIntegerField(default=0)
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["display_order", "created_at"]


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    phone = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)

    def __str__(self):
        return self.user.username


class Address(models.Model):
    user = models.ForeignKey(User, related_name="addresses", on_delete=models.CASCADE)
    full_name = models.CharField(max_length=120)
    phone = models.CharField(max_length=20)
    address_line_1 = models.CharField(max_length=200)
    address_line_2 = models.CharField(max_length=200, blank=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    country = models.CharField(max_length=80, default="India")
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-is_default", "-updated_at"]


class Order(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)

    name = models.CharField(max_length=100)
    address = models.TextField()
    phone = models.CharField(max_length=15)
    payment_method = models.CharField(max_length=20, default="COD")
    order_number = models.CharField(max_length=30, unique=True, blank=True, null=True)
    shipping_address_snapshot = models.JSONField(default=dict, blank=True)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    shipping_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_status = models.CharField(max_length=20, default="PENDING")
    order_status = models.CharField(max_length=20, default="PENDING")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = f"DFIT-{self.user_id or 'GUEST'}-{self.pk or 'NEW'}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Order {self.id}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    product_name_snapshot = models.CharField(max_length=200, blank=True)
    sku_snapshot = models.CharField(max_length=80, blank=True)
    price_at_purchase = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def save(self, *args, **kwargs):
        if self.product_id:
            if not self.product_name_snapshot:
                self.product_name_snapshot = self.product.name
            if not self.sku_snapshot:
                self.sku_snapshot = self.product.sku or ""
            if self.price_at_purchase is None:
                self.price_at_purchase = self.price
            if not self.subtotal:
                self.subtotal = self.price * self.quantity
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Order {self.quantity} x {self.product.name}"


class Cart(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    session_key = models.CharField(max_length=40, null=True, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Cart {self.id} ({self.user or self.session_key})"

    @property
    def total(self):
        return sum(item.subtotal for item in self.items.all())


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        unique_together = ("cart", "product")

    @property
    def subtotal(self):
        return self.product.price * self.quantity


class Notification(models.Model):
    recipient = models.ForeignKey(
        User, related_name="notifications", on_delete=models.CASCADE, null=True, blank=True
    )
    title = models.CharField(max_length=160)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]


class ProductReview(models.Model):
    product = models.ForeignKey(Product, related_name="reviews", on_delete=models.CASCADE)
    user = models.ForeignKey(User, related_name="product_reviews", on_delete=models.SET_NULL, null=True, blank=True)
    author_name = models.CharField(max_length=120)
    rating = models.PositiveSmallIntegerField(default=5)
    title = models.CharField(max_length=160, blank=True)
    comment = models.TextField()
    is_approved = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.product.name} review by {self.author_name}"

