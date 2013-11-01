
from django.template.loader import render_to_string

from karxim.functions import REDIS, pubLog, set_cookie


class ChatMiddleware():

    def process_view(self, request, view_func, *view_args, **view_kwargs):
        try:
            #pubLog('current SESH :'+str(request.session.session_key)+' = '+str(request.session['chatsession']))
            chatsession = request.session['chatsession']
            if REDIS.get(request.session.session_key) != chatsession:
                REDIS.set(request.session.session_key, chatsession)
            username = request.COOKIES.get('username')
            if username:
                request.session['username'] = username
        except Exception as e:
            chatsession = REDIS.get('users')
            REDIS.set('users',int(chatsession)+1)
            request.session['chatsession'] = chatsession
            request.session.save()
            #pubLog('NEW SESH : '+str(request.session.session_key)+' = '+ chatsession)
            #pubLog('the exception '+str(e))
            print str(request.session.session_key)+' = '+ chatsession
            REDIS.set(request.session.session_key, chatsession)

        return None

    def process_response(self, request, response):
        """
            add username to make it cross domain.
        """
        try:
            request.COOKIES['username']
            return response
        except:
            try:
                username = request.session.get('username')
                if username:
                    set_cookie(response, 'username', username,signed=False)
                return response
            except:return response
            

#global template variables
def base(request):
    return {
        'SESSIONID': request.session.get('chatsession'),
        'TEMPLATES':render_to_string('includeTemplates.html')
    }
