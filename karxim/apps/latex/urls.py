from django.conf.urls import patterns, include, url

urlpatterns = patterns('karxim.apps.latex.views',

    url(r'^latex/$', 'test'),
)
