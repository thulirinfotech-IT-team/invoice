from django.contrib import admin
from .models import Client, Service, Invoice, InvoiceItem


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ['name', 'company_name', 'email', 'phone', 'created_at']
    search_fields = ['name', 'company_name', 'email']
    list_filter = ['created_at']


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ['name', 'base_price', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name']


class InvoiceItemInline(admin.TabularInline):
    model = InvoiceItem
    extra = 0
    readonly_fields = ['total']


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'client', 'issue_date', 'due_date',
                    'total_amount', 'status', 'created_at']
    list_filter = ['status', 'issue_date', 'created_at']
    search_fields = ['invoice_number', 'client__name', 'client__company_name']
    readonly_fields = ['invoice_number', 'subtotal', 'tax_amount', 'total_amount', 'created_at']
    inlines = [InvoiceItemInline]
    date_hierarchy = 'issue_date'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('client')
