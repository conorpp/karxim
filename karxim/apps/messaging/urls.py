from django.conf.urls import patterns, include, url

urlpatterns = patterns('karxim.apps.messaging.views',


    url(r'^$', 'home'),
    url(r'^start/$', 'start'),
    url(r'^messages/$', 'messages'),
    url(r'^send/$', 'send'),
    url(r'^d/(?P<pk>[0-9]*)/$', 'discussion'),
    url(r'^clients/change/$', 'client'),
    url(r'^discussion/info/$', 'dInfo'),
    url(r'^message/info/$', 'mInfo')
)
