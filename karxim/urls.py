from django.conf.urls import patterns, include, url
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'karxim.views.home', name='home'),
    url(r'^', include('karxim.apps.messaging.urls')),
    url(r'^', include('karxim.apps.latex.urls')),

    url(r'^admin/doc/', include('django.contrib.admindocs.urls')),
    url(r'^admin/', include(admin.site.urls)),
)
