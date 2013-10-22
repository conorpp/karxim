
from django.contrib import admin
from karxim.apps.messaging.models import Discussion, Message, BannedSession, Admin

admin.site.register(Discussion)
admin.site.register(Message)
admin.site.register(BannedSession)
admin.site.register(Admin)