import uuid

from django.db import migrations, models


def populate_public_ids(apps, schema_editor):
	Form = apps.get_model("forms", "Form")
	for form in Form.objects.filter(public_id__isnull=True):
		form.public_id = uuid.uuid4()
		form.save(update_fields=["public_id"])


class Migration(migrations.Migration):

	dependencies = [
		("forms", "0003_alter_form_id"),
	]

	operations = [
		migrations.AddField(
			model_name="form",
			name="public_id",
			field=models.UUIDField(editable=False, null=True),
		),
		migrations.RunPython(populate_public_ids, migrations.RunPython.noop),
		migrations.AlterField(
			model_name="form",
			name="public_id",
			field=models.UUIDField(default=uuid.uuid4, editable=False, unique=True),
		),
	]
