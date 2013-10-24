import redis

from django.shortcuts import render, HttpResponse, HttpResponseRedirect, render_to_response
from django.core.urlresolvers import reverse
from django.template.loader import render_to_string
from django.views.decorators.csrf import csrf_exempt
from django.utils import simplejson, timezone

from karxim.apps.messaging.models import Discussion, BannedSession, Admin
from karxim.apps.messaging.forms import NewDiscussionForm , NewMessageForm
from karxim.apps.messaging.serializers import DiscussionSerializer, MessageSerializer
from karxim.functions import set_cookie,cookieValue, validKey, pubLog, REDIS
from karxim.settings import WEB_DOMAIN, REDIS_PORT

if REDIS.get('users') is None:      #for session id's
    REDIS.set('users','0')


def home(request):
    context = {
        'markers': DiscussionSerializer(Discussion.objects.order_by('-lastActive')[:250]).data(),
    }
    return render(request, 'index.html', context)

def start(request):
    """ creates discussion and returns it """
    if request.method == 'POST':
        print 'POST ',request.POST
        form = NewDiscussionForm(request.POST)
        form.setFields(chatsession=validKey(request.COOKIES.get('chatsession',None),None))
        if form.is_valid():
            form.save()
            data = DiscussionSerializer(form.discussion).data()
            return HttpResponse(data)
        else:
            print form.error
            return HttpResponse(simplejson.dumps({'error':form.error}))

def messages(request):
    """ loads all messages for a discussion pk.  rejects if invalid session or password."""
    pk = request.POST['pk']
    admin=False
    error=None
    d = Discussion.objects.get(pk=pk)
    
    try:
        sessionid = validKey(request.COOKIES['chatsession'])
        if d.admins.filter(sessionid = sessionid).count():
            print 'ADMIN!'
            admin = True
    except:pass
    
    try:
        sessionid = validKey(request.COOKIES['chatsession'])
        if d.bannedsessions.filter(sessionid=sessionid).count():
            error = 'You have been banned from this discussion'
            return HttpResponse(simplejson.dumps({'error':error,'ban':True}))
    except:
        error = 'Please allow cookies or refresh the page'
        
    if d.private and not admin:
        if d.password != request.POST['password']: error = 'Incorrect password'
        
    if error is not None:
        return HttpResponse(simplejson.dumps({'error':error}))
    
    messages = d.message_set.all()

    data = MessageSerializer(messages).data(admin=admin)

    REDIS.publish(0, simplejson.dumps({'TYPE':'subscribe','pk':d.pk, 'sessionid':sessionid}))
    
    return HttpResponse(data)
        

def send(request):
    """ recieving and processing messages from chats """
    try:
        pk = request.POST['pk']
        print 'request : ',request.POST
        form = NewMessageForm(request.POST, request.COOKIES)
        form.setFields(replyTo = request.POST.get('replyTo',None),
                       chatsession=validKey(request.COOKIES.get('chatsession',None),None))

        if not form.is_valid():
            data = simplejson.dumps({'error':form.error})
            return HttpResponse(data)
        
        form.save()
        data = {'TYPE':'message',
                'replyTo':form.replyTo,
                'pk':form.newPk
                }
        data['html'] = render_to_string('parts/message.html',{
            'm':{
                'pk':form.newPk,
                'username':form.name,
                'text':form.text,
                'stem':form.stem,
                'distance': form.distance,
                'age':timezone.now().strftime('%I:%M %p')
            },
            })

        REDIS.publish(pk, simplejson.dumps(data))
        form.commit()   #moved as many db hits until after publish so clients get message quicker.
        return HttpResponse(status=200)
    
    except Exception as e:
        pubLog('VIEW \'send\' ERROR : '+str(e) )
        print str(e)
        return HttpResponse(status=500)    
            
def admin(request):pass

def discussion(request,pk='0'):
    try:
        print 'got pk', pk
        pk = int(pk)
        admin = False
        d = Discussion.objects.get(pk=pk)
            
        try:
            sessionid = validKey(request.COOKIES['chatsession'])
            if d.admins.filter(sessionid = sessionid).count():admin = True
        except:pass
        
        data = {'title':d.title, 'private':d.private, 'admin':admin, 'pk' : pk}
            
        return render(request,'discussion.html', data)
    except:
        return HttpResponse(status=404)
    
def client(request):
    """ for changing status of client (admin, banning, ect) """
    
    pk = request.POST['pk']
    messages = simplejson.loads(request.POST['clients'])
    action = request.POST['action']
    data = None
    print 'GOT CLIENT CHANGE REQUEST ', request.POST

    d = Discussion.objects.get(pk=pk)
    try:
        key = validKey(request.COOKIES['chatsession'])
        d.admins.get(sessionid=key)
    except:return HttpResponse(status=403)
    
    messages = d.message_set.filter(pk__in = messages)
    
    if action == 'ban':
        for m in messages:
            sessionid = m.sessionid
            if sessionid == key: #don't ban yourself
                continue
            b = BannedSession.objects.create(sessionid=sessionid)
            d.bannedsessions.add(b)
            data = {'TYPE':'ban', 'sessionid':sessionid,'announcement':'User %s has been removed' % (m.username)}
            REDIS.publish(pk, simplejson.dumps(data))
            d.save()
    elif action == 'admin':
        for m in messages:
            sessionid = m.sessionid
            a = Admin.objects.create(sessionid=sessionid)
            d.admins.add(a)
            try:
                d.bannedsessions.get(sessionid=sessionid).delete()
                data2 = {'TYPE':'private','sessionid':key,'title':'Warning:','message':'You just made the banned user %s an admin.  That user is no longer banned.' % m.username}
                REDIS.publish(pk, simplejson.dumps(data2))
                print 'Ban removed'
            except:pass
            data = {'TYPE':'admin', 'sessionid':sessionid,'announcement':'User %s has been made an Admin' % (m.username)}
            REDIS.publish(pk, simplejson.dumps(data))
            d.save()
            
    
    done = simplejson.dumps({'status':'sent'})
    return HttpResponse(done)
    
    
    

    
    
    
    