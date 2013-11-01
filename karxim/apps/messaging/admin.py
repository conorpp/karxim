
from django.contrib import admin
from karxim.apps.messaging.models import Discussion, Message, BannedSession, Admin, File


class EventPictureInline(admin.TabularInline):
    model = File
class ReplyInline(admin.TabularInline):
    model = Message
    name = 'Replies'
    class Meta():
        verbose_name = 'Replies'
    
class MessageAdmin(admin.ModelAdmin):
    inlines=[EventPictureInline, ReplyInline]
    search_fields = ['username','text']
    ordering = ['-lastActive']

class DiscussionAdmin(admin.ModelAdmin):
    inlines=[EventPictureInline, ReplyInline]
    list_filter = ('explicit','removed','private','location')
    search_fields = ['username','text']
    ordering = ['-lastActive']

admin.site.register(Discussion,DiscussionAdmin)
admin.site.register(Message,MessageAdmin)
admin.site.register(BannedSession)
admin.site.register(Admin)