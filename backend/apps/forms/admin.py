from django.contrib import admin
from .models import Form, FormVersion

# Register your models here.
admin.site.register(Form)
admin.site.register(FormVersion)