from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Q
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Address, Cart, CartItem, Category, Notification, Order, OrderItem, Product, ProductReview
from .serializers import (
    CartItemSerializer,
    CartSerializer,
    CategorySerializer,
    OrderSerializer,
    ProductSerializer,
    ProductWriteSerializer,
    AdminReviewSerializer,
    RegisterSerializer,
    AddressSerializer,
    AdminOrderSerializer,
    NotificationSerializer,
    UserSerializer,
)


@api_view(["GET"])
@permission_classes([AllowAny])
def api_root(request):
    return Response(
        {
            "message": "D'FIT Organic API is running",
            "endpoints": {
                "products": "/api/products/",
                "categories": "/api/categories/",
                "register": "/api/register/",
                "token": "/api/token/",
                "admin_login": "/api/admin/login/",
                "cart": "/api/cart/",
                "create_order": "/api/order/create/",
                "my_orders": "/api/orders/my/",
            },
        }
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def get_products(request):
    products = Product.objects.select_related("category").filter(is_active=True)

    search = request.GET.get("search", "").strip()
    category = request.GET.get("category", "").strip()
    product_type = request.GET.get("product_type", "").strip().upper()
    min_price = request.GET.get("min_price")
    max_price = request.GET.get("max_price")
    sort = request.GET.get("sort", "newest")

    if search:
        products = products.filter(
            Q(name__icontains=search)
            | Q(description__icontains=search)
            | Q(category__name__icontains=search)
        )

    if category:
        if category.isdigit():
            products = products.filter(category_id=int(category))
        else:
            products = products.filter(category__slug__iexact=category)

    if product_type:
        if product_type not in {"ELITE", "ESSENTIAL"}:
            return Response({"error": "Invalid product_type"}, status=400)
        products = products.filter(product_type=product_type)

    if min_price:
        try:
            products = products.filter(price__gte=min_price)
        except ValueError:
            return Response({"error": "Invalid min_price"}, status=400)

    if max_price:
        try:
            products = products.filter(price__lte=max_price)
        except ValueError:
            return Response({"error": "Invalid max_price"}, status=400)

    sort_map = {
        "price-low": "price",
        "price-high": "-price",
        "newest": "-created_at",
        "oldest": "created_at",
        "name": "name",
    }
    products = products.order_by(sort_map.get(sort, "-created_at"))

    serializer = ProductSerializer(products, many=True, context={"request": request})
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([AllowAny])
def get_product(request, slug):
    try:
        lookup = {"slug": slug}
        if slug.isdigit():
            lookup = {"id": int(slug)}
        product = Product.objects.select_related("category").get(**lookup, is_active=True)
    except Product.DoesNotExist:
        return Response({"error": "Product not found"}, status=404)

    serializer = ProductSerializer(product, context={"request": request})
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_product_review(request, product_id):
    try:
        product = Product.objects.get(pk=product_id, is_active=True)
    except Product.DoesNotExist:
        return Response({"error": "Product not found"}, status=404)

    if not OrderItem.objects.filter(order__user=request.user, product=product).exists():
        return Response({"error": "You can review products you have purchased."}, status=403)
    if ProductReview.objects.filter(product=product, user=request.user).exists():
        return Response({"error": "You have already reviewed this product."}, status=400)

    rating = request.data.get("rating")
    try:
        rating = int(rating)
    except (TypeError, ValueError):
        return Response({"error": "Rating must be between 1 and 5."}, status=400)
    if rating < 1 or rating > 5:
        return Response({"error": "Rating must be between 1 and 5."}, status=400)

    comment = (request.data.get("comment") or "").strip()
    if not comment:
        return Response({"error": "Review comment is required."}, status=400)

    review = ProductReview.objects.create(
        product=product,
        user=request.user,
        author_name=request.user.get_full_name() or request.user.username,
        rating=rating,
        title=(request.data.get("title") or "").strip(),
        comment=comment,
        is_approved=True,
    )
    return Response(AdminReviewSerializer(review).data, status=201)


@api_view(["GET"])
@permission_classes([AllowAny])
def get_categories(request):
    categories = Category.objects.filter(is_active=True).order_by("display_order", "name")
    serializer = CategorySerializer(categories, many=True, context={"request": request})
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_cart(request):
    cart, _ = Cart.objects.get_or_create(user=request.user)
    serializer = CartSerializer(cart, context={"request": request})
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_to_cart(request):
    product_id = request.data.get("product_id")
    quantity = request.data.get("quantity", 1)

    if not product_id:
        return Response({"error": "Product ID is required"}, status=400)

    try:
        quantity = int(quantity)
    except (TypeError, ValueError):
        return Response({"error": "Quantity must be a number"}, status=400)

    if quantity < 1:
        return Response({"error": "Quantity must be at least 1"}, status=400)

    try:
        product = Product.objects.get(id=product_id, is_active=True)
    except Product.DoesNotExist:
        return Response({"error": "Product is not available"}, status=404)

    if product.stock_quantity < quantity:
        return Response({"error": "Requested quantity exceeds available stock."}, status=400)

    cart, _ = Cart.objects.get_or_create(user=request.user)

    item, created = CartItem.objects.get_or_create(cart=cart, product=product)
    if not created:
        item.quantity += quantity
    else:
        item.quantity = quantity
    if item.quantity > product.stock_quantity:
        return Response({"error": "Requested quantity exceeds available stock."}, status=400)
    item.save()

    return Response(
        {
            "message": "Product added to cart",
            "cart": CartSerializer(cart, context={"request": request}).data,
        },
        status=200,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def admin_login(request):
    email = (request.data.get("email") or "").strip().lower()
    password = request.data.get("password") or ""

    if not email or not password:
        return Response({"detail": "Email and password are required."}, status=400)

    user = User.objects.filter(email__iexact=email).first()
    authenticated_user = authenticate(
        request=request,
        username=user.username if user else "",
        password=password,
    )
    if not authenticated_user or not (authenticated_user.is_staff or authenticated_user.is_superuser):
        return Response({"detail": "Invalid admin credentials."}, status=401)

    refresh = RefreshToken.for_user(authenticated_user)
    return Response({"refresh": str(refresh), "access": str(refresh.access_token)})


@api_view(["POST"])
@permission_classes([AllowAny])
def customer_login(request):
    email = (request.data.get("email") or "").strip().lower()
    password = request.data.get("password") or ""

    if not email or not password:
        return Response({"detail": "Email and password are required."}, status=400)

    user = User.objects.filter(email__iexact=email, is_active=True).first()
    authenticated_user = authenticate(
        request=request,
        username=user.username if user else "",
        password=password,
    )
    if not authenticated_user:
        return Response({"detail": "Invalid email or password."}, status=401)

    refresh = RefreshToken.for_user(authenticated_user)
    return Response({"refresh": str(refresh), "access": str(refresh.access_token)})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def update_cart_quantity(request):
    item_id = request.data.get("item_id")
    quantity = request.data.get("quantity")

    if not item_id or quantity is None:
        return Response({"error": "Item ID and quantity are required"}, status=400)

    try:
        quantity = int(quantity)
    except (TypeError, ValueError):
        return Response({"error": "Quantity must be a number"}, status=400)

    try:
        item = CartItem.objects.get(id=item_id, cart__user=request.user)
    except CartItem.DoesNotExist:
        return Response({"error": "Cart item not found"}, status=404)

    if quantity < 1:
        item.delete()
        return Response({"message": "Item removed"}, status=200)

    if not item.product.is_active:
        return Response({"error": "This product is no longer available."}, status=400)

    if quantity > item.product.stock_quantity:
        return Response({"error": "Requested quantity exceeds available stock."}, status=400)

    item.quantity = quantity
    item.save()

    return Response(
        CartItemSerializer(item, context={"request": request}).data,
        status=200,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def remove_from_cart(request):
    item_id = request.data.get("item_id")

    if not item_id:
        return Response({"error": "Item ID required"}, status=400)

    deleted_count, _ = CartItem.objects.filter(
        id=item_id,
        cart__user=request.user,
    ).delete()

    if not deleted_count:
        return Response({"error": "Cart item not found"}, status=404)

    return Response({"message": "Product removed"}, status=200)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_order(request):
    data = request.data

    name = (data.get("name") or "").strip()
    address = (data.get("address") or "").strip()
    phone = (data.get("phone") or "").strip()
    payment_method = (data.get("payment_method") or "COD").strip()

    if not name:
        return Response({"error": "Name is required"}, status=400)
    if not address:
        return Response({"error": "Address is required"}, status=400)
    if not phone or not phone.isdigit() or len(phone) < 10:
        return Response({"error": "Invalid phone number"}, status=400)

    allowed_payment_methods = {"COD", "CreditCard", "UPI"}
    if payment_method not in allowed_payment_methods:
        return Response({"error": "Invalid payment method"}, status=400)

    cart = Cart.objects.filter(user=request.user).first()
    if not cart or not cart.items.exists():
        return Response({"error": "Cart is empty"}, status=400)

    with transaction.atomic():
        cart_items = list(cart.items.select_related("product"))
        for item in cart_items:
            item.product = Product.objects.select_for_update().get(pk=item.product_id)
            if not item.product.is_active:
                return Response(
                    {"error": f"{item.product.name} is no longer available."}, status=400
                )
            if item.quantity > item.product.stock_quantity:
                return Response(
                    {"error": f"Not enough stock for {item.product.name}."}, status=400
                )

        subtotal = sum(item.product.price * item.quantity for item in cart_items)
        shipping_fee = 0
        total = subtotal + shipping_fee

        order = Order.objects.create(
            user=request.user,
            name=name,
            address=address,
            phone=phone,
            payment_method=payment_method,
            subtotal=subtotal,
            shipping_fee=shipping_fee,
            total_amount=total,
            shipping_address_snapshot={"name": name, "address": address, "phone": phone},
        )

        OrderItem.objects.bulk_create(
            [
                OrderItem(
                    order=order,
                    product=item.product,
                    quantity=item.quantity,
                    price=item.product.price,
                    price_at_purchase=item.product.price,
                    product_name_snapshot=item.product.name,
                    sku_snapshot=item.product.sku or "",
                    subtotal=item.product.price * item.quantity,
                )
                for item in cart_items
            ]
        )

        for item in cart_items:
            item.product.stock_quantity -= item.quantity
            item.product.save(update_fields=["stock_quantity", "updated_at"])

        cart.items.all().delete()

    return Response(
        {
            "message": "Order created successfully",
            "order_id": order.id,
        },
        status=201,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_orders(request):
    orders = Order.objects.filter(user=request.user).order_by("-created_at")
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_orders(request):
    orders = Order.objects.select_related("user").prefetch_related("orderitem_set").order_by("-created_at")
    return Response(AdminOrderSerializer(orders, many=True).data)


@api_view(["GET", "PATCH"])
@permission_classes([IsAdminUser])
def admin_order_detail(request, pk):
    try:
        order = Order.objects.select_related("user").prefetch_related("orderitem_set").get(pk=pk)
    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=404)

    if request.method == "PATCH":
        allowed_order_statuses = {"PENDING", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"}
        allowed_payment_statuses = {"PENDING", "PAID", "FAILED", "REFUNDED"}
        order_status = request.data.get("order_status")
        payment_status = request.data.get("payment_status")
        if order_status is not None:
            if order_status not in allowed_order_statuses:
                return Response({"error": "Invalid order status"}, status=400)
            order.order_status = order_status
        if payment_status is not None:
            if payment_status not in allowed_payment_statuses:
                return Response({"error": "Invalid payment status"}, status=400)
            order.payment_status = payment_status
        order.save(update_fields=["order_status", "payment_status", "updated_at"])

    return Response(AdminOrderSerializer(order).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_notifications(request):
    notifications = Notification.objects.filter(recipient=request.user)
    return Response(NotificationSerializer(notifications, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mark_notifications_read(request):
    updated_count = Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
    return Response({"message": "Notifications marked as read", "updated_count": updated_count})


@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def admin_notifications(request):
    if request.method == "GET":
        notifications = Notification.objects.select_related("recipient")[:100]
        return Response(NotificationSerializer(notifications, many=True).data)

    title = (request.data.get("title") or "").strip()
    message = (request.data.get("message") or "").strip()
    recipient_id = request.data.get("recipient_id")
    if not title or not message:
        return Response({"error": "Title and message are required."}, status=400)

    recipients = User.objects.filter(pk=recipient_id) if recipient_id else User.objects.filter(is_staff=False)
    if recipient_id and not recipients.exists():
        return Response({"error": "Recipient not found."}, status=404)
    Notification.objects.bulk_create(
        [Notification(recipient=user, title=title, message=message) for user in recipients]
    )
    return Response({"message": "Notification sent", "recipient_count": recipients.count()}, status=201)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_users(request):
    users = User.objects.filter(is_staff=False).order_by("username")
    return Response(UserSerializer(users, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(UserSerializer(request.user).data)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def addresses(request):
    if request.method == "GET":
        serializer = AddressSerializer(Address.objects.filter(user=request.user), many=True)
        return Response(serializer.data)

    serializer = AddressSerializer(data=request.data)
    if serializer.is_valid():
        address = serializer.save(user=request.user)
        if address.is_default:
            Address.objects.filter(user=request.user).exclude(pk=address.pk).update(is_default=False)
        return Response(AddressSerializer(address).data, status=201)
    return Response(serializer.errors, status=400)


@api_view(["PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def address_detail(request, pk):
    try:
        address = Address.objects.get(pk=pk, user=request.user)
    except Address.DoesNotExist:
        return Response({"error": "Address not found"}, status=404)

    if request.method == "DELETE":
        address.delete()
        return Response(status=204)

    serializer = AddressSerializer(address, data=request.data, partial=True)
    if serializer.is_valid():
        address = serializer.save()
        if address.is_default:
            Address.objects.filter(user=request.user).exclude(pk=address.pk).update(is_default=False)
        return Response(AddressSerializer(address).data)
    return Response(serializer.errors, status=400)


@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def admin_products(request):
    if request.method == "GET":
        products = Product.objects.select_related("category").order_by("-created_at")
        serializer = ProductSerializer(products, many=True, context={"request": request})
        return Response(serializer.data)

    serializer = ProductWriteSerializer(data=request.data)
    if serializer.is_valid():
        product = serializer.save()
        response_serializer = ProductSerializer(product, context={"request": request})
        return Response(response_serializer.data, status=201)
    return Response(serializer.errors, status=400)


@api_view(["PATCH", "DELETE"])
@permission_classes([IsAdminUser])
def admin_product_detail(request, pk):
    try:
        product = Product.objects.get(pk=pk)
    except Product.DoesNotExist:
        return Response({"error": "Product not found"}, status=404)

    remove_image = str(request.data.get("remove_image", "")).lower() in {"1", "true", "yes"}
    if remove_image and product.image:
        product.image.delete(save=False)
        product.image = None
        product.save(update_fields=["image"])

    serializer = ProductWriteSerializer(product, data=request.data, partial=True)
    if serializer.is_valid():
        product = serializer.save()
        response_serializer = ProductSerializer(product, context={"request": request})
        return Response(response_serializer.data)
    return Response(serializer.errors, status=400)


@api_view(["POST"])
@permission_classes([IsAdminUser])
def admin_product_archive(request, pk):
    try:
        product = Product.objects.get(pk=pk)
    except Product.DoesNotExist:
        return Response({"error": "Product not found"}, status=404)

    product.is_active = False
    product.save(update_fields=["is_active", "updated_at"])
    return Response({"message": "Product archived"})


@api_view(["DELETE"])
@permission_classes([IsAdminUser])
def admin_product_delete(request, pk):
    try:
        product = Product.objects.get(pk=pk)
    except Product.DoesNotExist:
        return Response({"error": "Product not found"}, status=404)

    if product.orderitem_set.exists():
        return Response(
            {"error": "This product is referenced by an order and can only be archived."},
            status=400,
        )

    product.delete()
    return Response({"message": "Product deleted"})


@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def admin_reviews(request):
    if request.method == "GET":
        reviews = ProductReview.objects.select_related("product", "user").all()
        return Response(AdminReviewSerializer(reviews, many=True).data)

    serializer = AdminReviewSerializer(data=request.data)
    if serializer.is_valid():
        review = serializer.save()
        return Response(AdminReviewSerializer(review).data, status=201)
    return Response(serializer.errors, status=400)


@api_view(["PATCH", "DELETE"])
@permission_classes([IsAdminUser])
def admin_review_detail(request, pk):
    try:
        review = ProductReview.objects.get(pk=pk)
    except ProductReview.DoesNotExist:
        return Response({"error": "Review not found"}, status=404)

    if request.method == "DELETE":
        review.delete()
        return Response({"message": "Review deleted"})

    serializer = AdminReviewSerializer(review, data=request.data, partial=True)
    if serializer.is_valid():
        review = serializer.save()
        return Response(AdminReviewSerializer(review).data)
    return Response(serializer.errors, status=400)


@api_view(["POST"])
@permission_classes([AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response(
            {
                "message": "User created successfully",
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([AllowAny])
def password_reset_request(request):
    email = (request.data.get("email") or "").strip().lower()
    if not email:
        return Response({"email": ["Email is required."]}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.filter(email__iexact=email, is_active=True).first()
    if user:
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        reset_url = f"{settings.FRONTEND_URL.rstrip('/')}/reset-password/{uid}/{token}"
        send_mail(
            "Reset your D'FIT password",
            f"Use this link to choose a new password: {reset_url}",
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=not settings.DEBUG,
        )

    return Response({"message": "If an account exists for that email, password reset instructions have been sent."})


@api_view(["POST"])
@permission_classes([AllowAny])
def password_reset_confirm(request):
    uid = request.data.get("uid") or ""
    token = request.data.get("token") or ""
    password = request.data.get("password") or ""
    password2 = request.data.get("password2") or ""

    if not uid or not token or not password or not password2:
        return Response({"detail": "All password reset fields are required."}, status=status.HTTP_400_BAD_REQUEST)
    if password != password2:
        return Response({"detail": "Passwords do not match."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id, is_active=True)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return Response({"detail": "This password reset link is invalid or expired."}, status=status.HTTP_400_BAD_REQUEST)

    if not default_token_generator.check_token(user, token):
        return Response({"detail": "This password reset link is invalid or expired."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        validate_password(password, user)
    except ValidationError as error:
        return Response({"detail": " ".join(error.messages)}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(password)
    user.save(update_fields=["password"])
    return Response({"message": "Password updated successfully. You can now sign in."})
