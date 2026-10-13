from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Address, Cart, CartItem, Category, Notification, Order, OrderItem, Product, ProductImage, ProductReview


class CategorySerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = "__all__"

    def get_image(self, obj):
        request = self.context.get("request")
        if not obj.image:
            return None
        return request.build_absolute_uri(obj.image.url) if request else obj.image.url


class ProductImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ["id", "image", "alt_text", "display_order", "is_primary"]

    def get_image(self, obj):
        request = self.context.get("request")
        return request.build_absolute_uri(obj.image.url) if request else obj.image.url


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductReview
        fields = ["id", "author_name", "rating", "title", "comment", "created_at"]


class AdminReviewSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    user_email = serializers.EmailField(source="user.email", read_only=True, allow_null=True)

    class Meta:
        model = ProductReview
        fields = ["id", "product", "product_name", "user", "user_email", "author_name", "rating", "title", "comment", "is_approved", "created_at", "updated_at"]
        read_only_fields = ["id", "user", "created_at", "updated_at"]


class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    image = serializers.SerializerMethodField()
    gallery = ProductImageSerializer(source="images", many=True, read_only=True)
    discount_percentage = serializers.SerializerMethodField()
    in_stock = serializers.SerializerMethodField()
    reviews = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = "__all__"

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["gallery"] = ProductImageSerializer(
            instance.images.all(), many=True, context=self.context
        ).data
        return data

    def get_discount_percentage(self, obj):
        if not obj.original_price or obj.original_price <= obj.price:
            return 0
        return round((obj.original_price - obj.price) * 100 / obj.original_price)

    def get_in_stock(self, obj):
        return obj.stock_quantity > 0

    def get_image(self, obj):
        request = self.context.get("request")
        if not obj.image:
            return None
        if request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url

    def get_reviews(self, obj):
        return ReviewSerializer(obj.reviews.filter(is_approved=True), many=True).data

    def get_average_rating(self, obj):
        ratings = list(obj.reviews.filter(is_approved=True).values_list("rating", flat=True))
        return round(sum(ratings) / len(ratings), 1) if ratings else 0

    def get_review_count(self, obj):
        return obj.reviews.filter(is_approved=True).count()


class ProductWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            "id", "product_type", "name", "slug", "short_description", "description", "price",
            "original_price", "sku", "stock_quantity", "low_stock_threshold", "weight",
            "unit", "ingredients", "nutrition_information", "allergens",
            "storage_instructions", "benefits", "is_active", "is_featured", "is_new",
            "category", "image",
        ]

    def validate_image(self, value):
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("Images must be 5 MB or smaller.")
        if value.content_type not in {"image/jpeg", "image/png", "image/webp"}:
            raise serializers.ValidationError("Use a JPG, PNG, or WebP image.")
        return value


class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_price = serializers.DecimalField(
        source="product.price", max_digits=10, decimal_places=2, read_only=True
    )
    product_image = serializers.SerializerMethodField()
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = "__all__"

    def get_product_image(self, obj):
        request = self.context.get("request")
        if not obj.product.image:
            return None
        if request:
            return request.build_absolute_uri(obj.product.image.url)
        return obj.product.image.url


class CartSerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Cart
        fields = "__all__"

    def get_items(self, obj):
        request = self.context.get("request")
        return CartItemSerializer(obj.items.all(), many=True, context={"request": request}).data


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "is_staff", "is_superuser"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ["username", "email", "password", "password2"]

    def validate(self, data):
        if data["password"] != data["password2"]:
            raise serializers.ValidationError("Passwords do not match.")
        return data

    def create(self, validated_data):
        username = validated_data["username"]
        email = validated_data.get("email")
        password = validated_data.get("password")
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
        )
        return user


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product_name_snapshot", read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            "id", "product", "product_name", "sku_snapshot", "quantity", "price",
            "price_at_purchase", "subtotal",
        ]


class OrderSerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "name",
            "address",
            "phone",
            "payment_method",
            "total_amount",
            "subtotal",
            "discount",
            "shipping_fee",
            "payment_status",
            "order_status",
            "created_at",
            "items",
        ]

    def get_items(self, obj):
        return OrderItemSerializer(obj.orderitem_set.all(), many=True).data


class AdminOrderSerializer(OrderSerializer):
    customer_email = serializers.SerializerMethodField()
    customer_username = serializers.SerializerMethodField()
    shipping_details = serializers.JSONField(source="shipping_address_snapshot", read_only=True)

    class Meta(OrderSerializer.Meta):
        fields = OrderSerializer.Meta.fields + [
            "user",
            "customer_email",
            "customer_username",
            "shipping_details",
            "updated_at",
        ]

    def get_customer_email(self, obj):
        return obj.user.email if obj.user else ""

    def get_customer_username(self, obj):
        return obj.user.username if obj.user else "Guest"


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "recipient", "title", "message", "created_at", "is_read"]
        read_only_fields = ["id", "created_at", "is_read"]


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = "__all__"
        read_only_fields = ["user", "created_at", "updated_at"]
