from django.conf.urls import patterns, include, url

urlpatterns = patterns('karxim.apps.messaging.views',
    # Examples:
    # url(r'^$', 'karxim.views.home', name='home'),
    url(r'^$', 'home'),
    url(r'^start/$', 'start'),
    url(r'^messages/$', 'messages'),
    url(r'^send/$', 'send'),

)
