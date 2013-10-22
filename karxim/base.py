
from django.template.loader import render_to_string

from karxim.functions import set_cookie
from karxim.apps.messaging.views import REDIS
from karxim.settings import SOCKET_URL


class ChatMiddleware():

    def process_response(self, request, response):
        """
            automatically check/add cookie id
            for spam protection.  Increment redis store.
        """
        try:
            request.COOKIES['chatsession']
            return response
        except Exception as e:
            session = REDIS.get('users')
            REDIS.set('users',int(session)+1)
            set_cookie(response, 'chatsession', session, days_expire = 20, signed=True)
            return response
            

#global template variables
def base(request):
    
    return {
        'SOCKET_URL': SOCKET_URL,
        'TEMPLATES':render_to_string('includeTemplates.html')
    }
