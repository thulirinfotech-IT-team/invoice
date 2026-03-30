from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('invoices', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='invoice',
            name='pdf_file',
            field=models.URLField(blank=True, max_length=500, null=True),
        ),
    ]
