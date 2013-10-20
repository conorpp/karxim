import redis

from django.shortcuts import render, HttpResponse, HttpResponseRedirect, render_to_response
from django.core.urlresolvers import reverse
from django.template.loader import render_to_string
from django.views.decorators.csrf import csrf_exempt
from django.utils import simplejson

from karxim.apps.messaging.models import Discussion
from karxim.apps.messaging.forms import NewDiscussionForm , NewMessageForm
from karxim.apps.messaging.serializers import DiscussionSerializer, MessageSerializer
from karxim.settings import redisPort, webDomain

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
        form = NewDiscussionForm(request.POST)
        if form.is_valid():
            form.save()
            data = DiscussionSerializer(form.discussion).data()
            return HttpResponse(data)
        else:
            print form.error
            return HttpResponse(simplejson.dumps({'error':form.error}))
        
def messages(request):
    """ loads all messages for a discussion """
    pk = request.POST['pk']
    d = Discussion.objects.get(pk=pk)
    messages = d.message_set.all()
    data = MessageSerializer(messages).data()
    return HttpResponse(data)

#@csrf_exempt
def send(request):
    """ recieving and processing messages from chats """
    try:        
        r = redis.StrictRedis(host=webDomain, port=redisPort, db=0)
        pk = request.POST['pk']
        print request.POST
        form = NewMessageForm(request.POST)
        form.setFields(replyTo = request.POST.get('replyTo',None))
        if not form.is_valid():
            data = simplejson.dumps({'error':form.error})
            return HttpResponse(data)
        
        form.save()
        data = {'TYPE':'message','replyTo':form.replyTo,'pk':form.newPk}
        data['html'] = render_to_string('parts/message.html',{
            'm':{
                'pk':form.newPk,
                'username':form.name,
                'text':form.text,
                'stem':form.stem,
                'age':'just now'
            },
            })

        r.publish(pk, simplejson.dumps(data))
        form.commit()
        return HttpResponse("Message processed")
    
    except ArithmeticError:
        print str(e)
        return HttpResponse(status=500)    
            