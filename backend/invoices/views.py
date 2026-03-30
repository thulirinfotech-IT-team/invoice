from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count, Q, Prefetch
from django.utils import timezone
from .models import Client, Service, Invoice, InvoiceItem
from .serializers import (
    ClientSerializer, ServiceSerializer,
    InvoiceSerializer, InvoiceListSerializer
)
from .pdf_generator import generate_invoice_pdf, build_pdf_buffer
import datetime


class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.annotate(invoice_count=Count('invoices'))
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'company_name', 'email', 'phone']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    @action(detail=True, methods=['get'])
    def invoices(self, request, pk=None):
        """Return all invoices for a specific client."""
        client = self.get_object()
        invoices = client.invoices.all()
        serializer = InvoiceListSerializer(invoices, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Return client statistics."""
        total = Client.objects.count()
        active = Client.objects.filter(invoices__isnull=False).distinct().count()
        return Response({'total': total, 'active': active})


class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.filter(is_active=True)
    serializer_class = ServiceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'description']


class InvoiceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'client']
    search_fields = ['invoice_number', 'client__name', 'client__company_name']
    ordering_fields = ['created_at', 'total_amount', 'due_date', 'issue_date']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = Invoice.objects.select_related('client').prefetch_related('items').annotate(
            _item_count=Count('items')
        )
        # Date range filter
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(issue_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(issue_date__lte=end_date)
        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return InvoiceListSerializer
        return InvoiceSerializer

    def perform_create(self, serializer):
        invoice = serializer.save()
        try:
            pdf_url = generate_invoice_pdf(invoice)
            Invoice.objects.filter(pk=invoice.pk).update(pdf_file=pdf_url)
            invoice.pdf_file = pdf_url
        except Exception as e:
            import traceback
            print(f"PDF generation error: {e}")
            traceback.print_exc()

    def perform_update(self, serializer):
        invoice = serializer.save()
        try:
            pdf_url = generate_invoice_pdf(invoice)
            Invoice.objects.filter(pk=invoice.pk).update(pdf_file=pdf_url)
            invoice.pdf_file = pdf_url
        except Exception as e:
            print(f"PDF regeneration error: {e}")

    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        invoice = self.get_object()
        invoice.status = 'paid'
        invoice.save(update_fields=['status'])
        return Response({'status': 'paid', 'message': 'Invoice marked as paid.'})

    @action(detail=True, methods=['post'])
    def mark_unpaid(self, request, pk=None):
        invoice = self.get_object()
        invoice.status = 'unpaid'
        invoice.save(update_fields=['status'])
        return Response({'status': 'unpaid', 'message': 'Invoice marked as unpaid.'})

    @action(detail=True, methods=['get'], permission_classes=[])
    def download_pdf(self, request, pk=None):
        """Generate PDF on-the-fly and serve directly. Public so window.open works."""
        from django.http import HttpResponse
        invoice = self.get_object()
        buffer = build_pdf_buffer(invoice)
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="{invoice.invoice_number}.pdf"'
        return response

    @action(detail=True, methods=['post'])
    def regenerate_pdf(self, request, pk=None):
        """Regenerate PDF and return public URL (no signed URL)."""
        invoice = self.get_object()
        try:
            pdf_url = generate_invoice_pdf(invoice)
            Invoice.objects.filter(pk=invoice.pk).update(pdf_file=pdf_url)
            return Response({'pdf_url': pdf_url, 'message': 'PDF regenerated successfully.'})
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """Return stats for the dashboard."""
        now = timezone.now()
        current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        total_invoices = Invoice.objects.count()
        paid_invoices = Invoice.objects.filter(status='paid').count()
        unpaid_invoices = Invoice.objects.filter(status='unpaid').count()
        overdue_invoices = Invoice.objects.filter(
            status='unpaid', due_date__lt=now.date()
        ).count()

        total_revenue = Invoice.objects.filter(status='paid').aggregate(
            total=Sum('total_amount')
        )['total'] or 0

        monthly_revenue = Invoice.objects.filter(
            status='paid', created_at__gte=current_month_start
        ).aggregate(total=Sum('total_amount'))['total'] or 0

        pending_amount = Invoice.objects.filter(status='unpaid').aggregate(
            total=Sum('total_amount')
        )['total'] or 0

        total_clients = Client.objects.count()

        # Recent invoices
        recent = Invoice.objects.select_related('client').prefetch_related('items').order_by('-created_at')[:5]
        recent_data = InvoiceListSerializer(recent, many=True, context={'request': request}).data

        return Response({
            'total_invoices': total_invoices,
            'paid_invoices': paid_invoices,
            'unpaid_invoices': unpaid_invoices,
            'overdue_invoices': overdue_invoices,
            'total_revenue': float(total_revenue),
            'monthly_revenue': float(monthly_revenue),
            'pending_amount': float(pending_amount),
            'total_clients': total_clients,
            'recent_invoices': recent_data,
        })
