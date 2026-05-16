from django.contrib import admin
from .models import FormAccessSettings, FormAccessToken, FormRole

# Register your models here.
admin.site.register(FormAccessSettings)
admin.site.register(FormAccessToken)
admin.site.register(FormRole)