
from django.contrib import admin
from karxim.apps.messaging.models import Discussion, Message, BannedSession, Admin, File, Image


class FileInline(admin.TabularInline):
    model = File
    fk_name = 'message'
    
class ImageInline(admin.TabularInline):
    model = Image
    fk_name = 'message'
    
class ReplyInline(admin.TabularInline):
    model = Message
    name = 'Replies'
    class Meta():
        verbose_name = 'Replies'
    
class MessageAdmin(admin.ModelAdmin):
    inlines=[ImageInline, ReplyInline,FileInline]
    search_fields = ['username','text']
    ordering = ['-lastActive']

class DiscussionAdmin(admin.ModelAdmin):
    inlines=[ReplyInline]
    list_filter = ('explicit','removed','private','location')
    search_fields = ['username','text']
    ordering = ['-lastActive']

admin.site.register(Discussion,DiscussionAdmin)
admin.site.register(Message,MessageAdmin)
admin.site.register(BannedSession)
admin.site.register(Admin)