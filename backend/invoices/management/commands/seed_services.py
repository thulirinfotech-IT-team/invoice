"""
Management command: python manage.py seed_services
Seeds the database with default Thulirinfo Tech services.
"""
from django.core.management.base import BaseCommand
from invoices.models import Service


SERVICES = [
    ('Web Development', 'Custom website design and development', 15000),
    ('Web Application', 'Full-stack web application development', 50000),
    ('Landing Page', 'High-converting landing page design', 8000),
    ('Dynamic Website', 'CMS-powered dynamic website', 20000),
    ('Software Development', 'Custom software development and deployment', 75000),
    ('Mobile App Development', 'iOS and Android mobile app development', 80000),
    ('Billing Software', 'Custom billing and invoicing software', 40000),
    ('CRM System', 'Customer relationship management system', 60000),
    ('Custom IT Solution', 'Tailored IT solutions for your business', 30000),
    ('UI/UX Design', 'User interface and experience design', 12000),
    ('API Integration', 'Third-party API integration services', 10000),
    ('Database Design', 'Database architecture and optimization', 15000),
    ('Cloud Deployment', 'Cloud infrastructure setup and deployment', 20000),
    ('Maintenance & Support', 'Ongoing maintenance and technical support', 5000),
]


class Command(BaseCommand):
    help = 'Seed the database with default Thulirinfo Tech services'

    def handle(self, *args, **kwargs):
        created = 0
        for name, description, base_price in SERVICES:
            _, was_created = Service.objects.get_or_create(
                name=name,
                defaults={'description': description, 'base_price': base_price}
            )
            if was_created:
                created += 1

        self.stdout.write(self.style.SUCCESS(
            f'Successfully seeded {created} services ({len(SERVICES) - created} already existed).'
        ))
