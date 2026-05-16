from django.contrib import admin
from .models import Response, ResponseEvent, ResponseSession, FormResponseSettings

# Register your models here.
admin.site.register(Response)
admin.site.register(ResponseEvent)
admin.site.register(ResponseSession)
admin.site.register(FormResponseSettings)