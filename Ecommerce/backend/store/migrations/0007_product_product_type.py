from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("store", "0006_notification"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="product_type",
            field=models.CharField(
                choices=[("ESSENTIAL", "Essential"), ("ELITE", "Elite")],
                default="ESSENTIAL",
                max_length=10,
            ),
        ),
    ]