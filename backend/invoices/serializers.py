from rest_framework import serializers
from .models import Client, Service, Invoice, InvoiceItem
from decimal import Decimal


class ClientSerializer(serializers.ModelSerializer):
    invoice_count = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Client
        fields = ['id', 'name', 'company_name', 'email', 'phone', 'address',
                  'invoice_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_invoice_count(self, obj):
        # Use annotated value if available (avoids N+1 query)
        if hasattr(obj, 'invoice_count'):
            return obj.invoice_count
        return obj.invoices.count()

    def validate_email(self, value):
        return value.lower().strip()


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ['id', 'name', 'description', 'base_price', 'is_active']


class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = ['id', 'service_name', 'description', 'quantity', 'price', 'total']
        read_only_fields = ['id', 'total']

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantity must be greater than zero.")
        return value

    def validate_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Price cannot be negative.")
        return value


class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True)
    client_name = serializers.CharField(source='client.name', read_only=True)
    client_company = serializers.CharField(source='client.company_name', read_only=True)
    client_email = serializers.CharField(source='client.email', read_only=True)
    pdf_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'client', 'client_name', 'client_company',
            'client_email', 'issue_date', 'due_date', 'subtotal', 'tax_percentage',
            'tax_amount', 'discount', 'total_amount', 'status', 'notes',
            'pdf_file', 'pdf_url', 'items', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'invoice_number', 'subtotal', 'tax_amount',
            'total_amount', 'pdf_file', 'created_at', 'updated_at'
        ]

    def get_pdf_url(self, obj):
        request = self.context.get('request')
        if obj.pdf_file and request:
            return request.build_absolute_uri(obj.pdf_file.url)
        return None

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("At least one item is required.")
        return value

    def validate_discount(self, value):
        if value < 0:
            raise serializers.ValidationError("Discount cannot be negative.")
        return value

    def validate_tax_percentage(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError("Tax percentage must be between 0 and 100.")
        return value

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        invoice = Invoice(**validated_data)
        invoice.save()

        for item_data in items_data:
            item_data['total'] = item_data['quantity'] * item_data['price']
            InvoiceItem.objects.create(invoice=invoice, **item_data)

        invoice.calculate_totals()
        invoice.save(update_fields=['subtotal', 'tax_amount', 'total_amount'])
        return invoice

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                item_data['total'] = item_data['quantity'] * item_data['price']
                InvoiceItem.objects.create(invoice=instance, **item_data)

        instance.calculate_totals()
        instance.save()
        return instance


class InvoiceListSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)
    client_company = serializers.CharField(source='client.company_name', read_only=True)
    pdf_url = serializers.SerializerMethodField(read_only=True)
    item_count = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'client', 'client_name', 'client_company',
            'issue_date', 'due_date', 'total_amount', 'status', 'pdf_url',
            'item_count', 'created_at'
        ]

    def get_pdf_url(self, obj):
        request = self.context.get('request')
        if obj.pdf_file and request:
            return request.build_absolute_uri(obj.pdf_file.url)
        return None

    def get_item_count(self, obj):
        # Use prefetch cache if available (avoids N+1 query)
        if hasattr(obj, '_prefetched_objects_cache') and 'items' in obj._prefetched_objects_cache:
            return len(obj._prefetched_objects_cache['items'])
        return obj.items.count()
