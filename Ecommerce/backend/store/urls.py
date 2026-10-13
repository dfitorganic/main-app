from django.urls import path
from . import views
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path("", views.api_root, name="api_root"),
    # Auth
    path("register/", views.register_view, name="register"),
    path("password-reset/", views.password_reset_request, name="password_reset_request"),
    path("password-reset/confirm/", views.password_reset_confirm, name="password_reset_confirm"),
    path("token/", views.customer_login, name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("admin/login/", views.admin_login, name="admin_login"),
    path("me/", views.me, name="me"),
    path("addresses/", views.addresses, name="addresses"),
    path("addresses/<int:pk>/", views.address_detail, name="address_detail"),

    # Products
    path("products/", views.get_products, name="products"),
    path("products/<slug:slug>/", views.get_product, name="product_detail"),
    path("products/<int:product_id>/reviews/", views.create_product_review, name="product_review_create"),
    path("categories/", views.get_categories, name="categories"),
    path("admin/products/", views.admin_products, name="admin_products"),
    path("admin/products/<int:pk>/", views.admin_product_detail, name="admin_product_detail"),
    path("admin/products/<int:pk>/archive/", views.admin_product_archive, name="admin_product_archive"),
    path("admin/products/<int:pk>/delete/", views.admin_product_delete, name="admin_product_delete"),
    path("admin/reviews/", views.admin_reviews, name="admin_reviews"),
    path("admin/reviews/<int:pk>/", views.admin_review_detail, name="admin_review_detail"),

    # Cart
    path("cart/", views.get_cart, name="cart"),
    path("cart/add/", views.add_to_cart, name="cart_add"),
    path("cart/remove/", views.remove_from_cart, name="cart_remove"),
    path("cart/update/", views.update_cart_quantity, name="cart_update"),

    # Orders
    path("order/create/", views.create_order, name="order_create"),
    path("orders/my/", views.my_orders, name="my_orders"),
    path("admin/orders/", views.admin_orders, name="admin_orders"),
    path("admin/orders/<int:pk>/", views.admin_order_detail, name="admin_order_detail"),
    path("notifications/my/", views.my_notifications, name="my_notifications"),
    path("notifications/read/", views.mark_notifications_read, name="notifications_read"),
    path("admin/notifications/", views.admin_notifications, name="admin_notifications"),
    path("admin/users/", views.admin_users, name="admin_users"),
]
