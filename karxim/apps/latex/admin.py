
from django.contrib import admin
from karxim.apps.latex.models import Formula

admin.site.register(Formula)

#class EventPictureInline(admin.TabularInline):
#    model = File
    #
#class FileAdmin(admin.ModelAdmin):
#    inlines=[EventPictureInline]
#    search_fields = ['title']
#    ordering = ['-created']

#class GalleryAdmin(admin.ModelAdmin):
#    inlines = [ ImageInline, ]
#    list_filter = ('explicit',)
#    search_fields = ['subject','description']

