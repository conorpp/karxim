import hmac

import hashlib
from django.template.loader import render_to_string

from karxim.functions import set_cookie, REDIS
from karxim.settings import SOCKET_URL, SECRET_KEY


KEY = hashlib.sha1(SECRET_KEY).digest()

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
            signed_sessionid = hmac.new(KEY, msg=session, digestmod=hashlib.sha1).hexdigest()
            set_cookie(response, 'chatsession', session+':'+signed_sessionid, days_expire = 20)
            return response
            

#global template variables
def base(request):
    
    return {
        'SOCKET_URL': SOCKET_URL,
        'TEMPLATES':render_to_string('includeTemplates.html')
    }
