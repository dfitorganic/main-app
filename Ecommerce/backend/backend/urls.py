
# from django.contrib import admin
# from django.urls import path,include

# urlpatterns = [
#     path('admin/', admin.site.urls),
#     path('api/',include('store.urls'))
# ]


from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.urls import include, path, re_path


def frontend_hint(_request):
    return JsonResponse(
        {
            "message": "This is the Django API server.",
            "api_root": "http://127.0.0.1:8000/api/",
            "admin": "http://127.0.0.1:5174/",
            "frontend_dev": "http://localhost:5173/",
        }
    )

urlpatterns = [
    path('', lambda request: JsonResponse({"message": "Backend is running. Use /api/ or the admin frontend at http://127.0.0.1:5174/"})),
    path('api/', include('store.urls')),  # your app urls
    re_path(r"^(?:login|signup|cart|checkout|orders|product/.*)$", frontend_hint),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
