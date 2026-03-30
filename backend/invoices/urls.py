from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClientViewSet, ServiceViewSet, InvoiceViewSet

router = DefaultRouter()
router.register(r'clients', ClientViewSet, basename='client')
router.register(r'services', ServiceViewSet, basename='service')
router.register(r'invoices', InvoiceViewSet, basename='invoice')

urlpatterns = [
    path('', include(router.urls)),
]
