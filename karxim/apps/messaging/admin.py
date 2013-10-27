
from django.contrib import admin
from karxim.apps.messaging.models import Discussion, Message, BannedSession, Admin, File


class EventPictureInline(admin.TabularInline):
    model = File
    
class FileAdmin(admin.ModelAdmin):
    inlines=[EventPictureInline]
    search_fields = ['title']
    ordering = ['-created']
    
#reference
"""
class GalleryAdmin(admin.ModelAdmin):
    inlines = [ ImageInline, ]
    list_filter = ('explicit',)
    search_fields = ['subject','description']
"""

admin.site.register(Discussion,FileAdmin)
admin.site.register(Message,FileAdmin)
admin.site.register(BannedSession)
admin.site.register(Admin)