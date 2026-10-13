from django.db.models import Sum
from .models import Order, Product, UserProfile

def get_admin_stats():
    return {
        "total_revenue": Order.objects.aggregate(Sum("total_amount"))["total_amount__sum"] or 0,
        "total_orders": Order.objects.count(),
        "total_products": Product.objects.count(),
        "total_users": UserProfile.objects.count(),
    }
