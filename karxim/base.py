from karxim.functions import set_cookie
from karxim.apps.messaging.views import REDIS

class ChatMiddleware():
    """
        automatically check/add cookie id
        for spam protection.  Increment redis store.
    """
    def process_response(self, request, response):
        try:
            request.COOKIES['chatsession']
            return response
        except Exception as e:
            session = REDIS.get('users')
            REDIS.set('users',int(session)+1)
            set_cookie(response, 'chatsession', session, days_expire = 20, signed=True)
            return response
            