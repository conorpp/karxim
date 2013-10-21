import redis

from django.shortcuts import render, HttpResponse, HttpResponseRedirect, render_to_response
from django.core.urlresolvers import reverse
from django.template.loader import render_to_string
from django.views.decorators.csrf import csrf_exempt
from django.utils import simplejson

from karxim.apps.messaging.models import Discussion
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
        'templates':render_to_string('includeTemplates.html')
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
    try:
        adminid = request.get_signed_cookie('admin')
        if pk == adminid:
            admin = True
    except ArithmeticError:pass
    d = Discussion.objects.get(pk=pk)
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
        print 'before json data ',data
        
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
        data['templates'] = render_to_string('includeTemplates.html')
        adminid = request.get_signed_cookie('admin', None)
        admin = False
        print 'id ', adminid
        print 'd id ', d.sessionid
        if adminid is not None:
            if unicode(adminid) == unicode(d.sessionid):
                admin = True
                
        print 'result ' , admin
        
        data['admin'] = admin
            
        return render(request,'discussion.html', data)
    except:
        return HttpResponse(status=404)
    
    
    
    