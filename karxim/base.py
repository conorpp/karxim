
from django.template.loader import render_to_string

from karxim.functions import REDIS, pubLog
from karxim.settings import SOCKET_URL


class ChatMiddleware():
    
    def process_view(self, request, view_func, *view_args, **view_kwargs):
        try:
            pubLog('current SESH :'+str(request.session.session_key)+' = '+str(request.session['chatsession']))
            if REDIS.get(request.session.session_key) != request.session['chatsession']:
                REDIS.set(request.session.session_key, request.session['chatsession'])
        except Exception as e:
            chatsession = REDIS.get('users')
            REDIS.set('users',int(chatsession)+1)
            request.session['chatsession'] = chatsession
            request.session.save()
            pubLog('NEW SESH : '+str(request.session.session_key)+' = '+ chatsession)
            pubLog('the exception '+str(e))
            print str(request.session.session_key)+' = '+ chatsession
            REDIS.set(request.session.session_key, chatsession)
        return None

    def XXXprocess_response(self, request, response):
        """
            automatically check/add cookie id
            for spam protection.  Increment redis store.
        """
        try:
            request.COOKIES['chatsession']
            return response
        except Exception as e:
            session = REDIS.get('users')
            print session
            REDIS.set('users',int(session)+1)
            set_cookie(response, 'chatsession', session)
            return response
            

#global template variables
def base(request):
    
    return {
        'SOCKET_URL': SOCKET_URL,
        'TEMPLATES':render_to_string('includeTemplates.html')
    }
