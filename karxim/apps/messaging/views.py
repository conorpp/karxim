import redis

from django.shortcuts import render, HttpResponse, HttpResponseRedirect, render_to_response
from django.core.urlresolvers import reverse
from django.template.loader import render_to_string
from django.views.decorators.csrf import csrf_exempt
from django.utils import simplejson

from karxim.apps.messaging.models import Discussion, BannedSession, Admin
from karxim.apps.messaging.forms import NewDiscussionForm , NewMessageForm
from karxim.apps.messaging.serializers import DiscussionSerializer, MessageSerializer
from karxim.functions import set_cookie
from karxim.settings import redisPort, webDomain

REDIS = redis.StrictRedis(host=webDomain, port=redisPort, db=0)

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
        print 'cookie', request.COOKIES.get('chatsession',None)
        form = NewDiscussionForm(request.POST)
        form.setFields(chatsession=request.get_signed_cookie('chatsession',None))
        if form.is_valid():
            form.save()
            data = DiscussionSerializer(form.discussion).data()
            response = HttpResponse(data)
            if form.admin:
                set_cookie(response, 'admin', form.session, days_expire=7, signed=True)
            return response
        else:
            print form.error
            return HttpResponse(simplejson.dumps({'error':form.error}))

def messages(request):
    """ loads all messages for a discussion pk"""
    
    pk = request.POST['pk']
    admin=False
    d = Discussion.objects.get(pk=pk)
    
    try:
        adminid = request.get_signed_cookie('admin')
        if adminid == d.sessionid:
            admin = True
    except:pass
    
    try:
        sessionid = request.get_signed_cookie('chatsession')
        if d.bannedsessions.filter(sessionid=sessionid).count():
            error = 'You have been banned from this discussion'
            return HttpResponse(simplejson.dumps({'error':error}))
    except:
        error = 'Please allow cookies or refresh the page'
        return HttpResponse(simplejson.dumps({'error':error}))
    
    messages = d.message_set.all()
    print 'admin status: ', admin
    if admin:
        data = MessageSerializer(messages).data(json=False)
        data['admin'] = admin
        data = simplejson.dumps(data)
    else:
        data = MessageSerializer(messages).data()
    response = HttpResponse(data)
    
    return response
        

def send(request):
    """ recieving and processing messages from chats """
    try:        
        pk = request.POST['pk']
        print 'request : ',request.POST
        form = NewMessageForm(request.POST, request.COOKIES)
        form.setFields(replyTo = request.POST.get('replyTo',None),
                       chatsession=request.get_signed_cookie('chatsession',None))
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
                'age':'just now'
            },
            })
        
        REDIS.publish(pk, simplejson.dumps(data))
        
        form.commit()   #moved as many db hits until after publish so clients get message quicker.
        return HttpResponse(status=200)
    
    except ArithmeticError:
        print str(e)
        return HttpResponse(status=500)    
            
def admin(request):pass

def discussion(request,pk='0'):
    try:
        print 'got pk', pk
        pk = int(pk)
        d = Discussion.objects.get(pk=pk)
        messages = d.message_set.all()
        data = data = MessageSerializer(messages).data(json = False)
        data['title'] = d.title
        data['pk'] = pk
        adminid = request.get_signed_cookie('admin', None)
        admin = False

        if adminid is not None:
            if adminid == d.sessionid:
                admin = True
                
        print 'result ' , admin
        
        data['admin'] = admin
            
        return render(request,'discussion.html', data)
    except:
        return HttpResponse(status=404)
    
def client(request):
    """ for changing status of client (admin, banning, ect) """
    pk = request.POST['pk']
    messages = simplejson.loads(request.POST['clients'])
    action = request.POST['action']
    print 'GOT CLIENT CHANGE REQUEST ', request.POST
    d = Discussion.objects.get(pk=pk)
    
    messages = d.message_set.filter(pk__in = messages)
    
    sessions = []
    if action == 'ban':
        for m in messages:
            sessionid = m.sessionid
            b = BannedSession.objects.create(sessionid=sessionid)
            d.bannedsessions.add(b)
            d.save()
            data = {'TYPE':'ban', 'sessionid':sessionid}
            REDIS.publish(pk, simplejson.dumps(data))
    #do something with redis pub sub and sessionid attribute in node
    
    return HttpResponse()
    
    
    

    
    
    
    