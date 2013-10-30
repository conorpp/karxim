import redis

from django.core import serializers
from django.shortcuts import render, HttpResponse, HttpResponseRedirect, render_to_response
from django.core.urlresolvers import reverse
from django.template.loader import render_to_string
from django.views.decorators.csrf import csrf_exempt
from django.utils import simplejson, timezone

from karxim.apps.messaging.models import Discussion, BannedSession, Admin
from karxim.apps.messaging.forms import NewDiscussionForm , NewMessageForm
from karxim.apps.messaging.serializers import DiscussionSerializer, MessageSerializer
from karxim.functions import pubLog, REDIS
from karxim.settings import REDIS_PORT

if REDIS.get('users') is None:      #for session id's
    REDIS.set('users','0')


def home(request):

    context = {
        'markers': DiscussionSerializer(Discussion.objects.filter(location = True,removed=False).order_by('-lastActive')[:250]).data(),
    }
    return render(request, 'index.html', context)

def start(request):
    """ creates discussion and returns it """
    print 'POST ',request.POST
    if request.method == 'POST':
        print 'POST ',request.POST
        form = NewDiscussionForm(request.POST)
        form.setFields(chatsession=request.session.get('chatsession',None))
        if form.is_valid():
            form.save()
            data = DiscussionSerializer(form.discussion).data()
            title = 'Status'
            message = ''
            if form.status=='edit':
                title = 'Edit'
                message = 'Your discussion information has been updated successfully.'
            elif form.status == 'delete':
                data = simplejson.dumps({'TYPE':'update','stack':'delete','pk':form.discussion.pk})
                REDIS.publish(form.discussion.pk, data)
                return HttpResponse(data)
            #Leaving out until user registration is available.
            #elif not request.user.is_authenticated():
            #    title ='Limited Admin:'
            #    message = 'Since you do not have an account, we can only track your admin status for up to twenty days, or until you clear your browser\'s cookies. <br /><br /> If you\'d like a permanent status, please log in or sign up.'
            elif form.location: return HttpResponse(data)
            if not form.location: message = message + '<br /><br /> Your discussion cannot be seen on the map.  Please save the link <a href="http://karxim.com/d/%s" >%s</a>' % (form.discussion.pk, form.discussion.title )
            msg = {'TYPE':'private','sessionid':request.session['chatsession'],'title':title,'message':message}
            REDIS.publish(0,simplejson.dumps(msg))
            return HttpResponse(data)
        else:
            print form.error
            return HttpResponse(simplejson.dumps({'error':form.error}))

def messages(request):
    """ loads all messages for a discussion pk.  rejects if invalid session or password."""
    pk = request.POST['pk']
    admin=False
    error=None
    try:d = Discussion.objects.filter(removed=False).get(pk=pk)
    except: return HttpResponse(status=404)
    try:
        sessionid = request.session['chatsession']
        if d.admins.filter(sessionid = sessionid).count():
            print 'ADMIN!'
            admin = True
    except:pass
    
    try:
        sessionid = request.session['chatsession']
        if d.bannedsessions.filter(sessionid=sessionid).count():
            error = 'You have been banned from this discussion'
            return HttpResponse(simplejson.dumps({'error':error,'ban':True}))
    except:
        error = 'Please allow cookies or refresh the page'
        
    if d.private and not admin:
        if d.password != request.POST['password']: error = 'Incorrect password'
        else:
            try:                                                #remember you got the password right.
                arr = request.session['validDiscs']
                try: arr.index(d.id)
                except:
                    arr.append(d.id)
                    print 'arr final ', arr
                    request.session['validDiscs'] = arr
                    request.session.save()
            except Exception as e:
                request.session['validDiscs'] = [d.pk]
        
    if error is not None:
        return HttpResponse(simplejson.dumps({'error':error}))
    
    messages = d.message_set.all()

    data = MessageSerializer(messages).data(admin=admin)

    REDIS.publish(0, simplejson.dumps({'TYPE':'subscribe','pk':pk, 'sessionid':sessionid}))
    
    return HttpResponse(data)
        

def send(request):
    """ recieving and processing messages from chats """
    try:
        pk = request.POST['pk']
        print 'request : ',request.POST
        form = NewMessageForm(request.POST)
        chatsession = request.session.get('chatsession',None)
        form.setFields(replyTo = request.POST.get('replyTo',None),
                       chatsession=chatsession)
        form.setFiles(request.FILES.getlist('files'))
        if not form.is_valid():
            data = simplejson.dumps({'error':form.error,'TYPE':'private','sessionid':chatsession,'title':'Error','message':form.error})
            REDIS.publish(0,data)
            return HttpResponse()
        form.save()
        data = {'TYPE':'message',
                'replyTo':form.replyTo,
                'pk':form.newPk,
                'discussion':form.discussion.pk
            }
        m ={
            'pk':form.newPk,
            'username':form.name,
            'text':form.text,
            'stem':form.stem,
            'distance': form.distance,
            'age':timezone.now().strftime('%I:%M %p'),
            'file_set2':{'images':form.pics, 'files':form.files}
            }
                
        data['html'] = render_to_string('parts/message.html',{
            'm':m,
            })
        REDIS.publish(pk, simplejson.dumps(data))
        form.commit()   #moved as many db hits until after publish so clients get message quicker.
        return HttpResponse(status=200)
    
    except ArithmeticError:
        pubLog('VIEW \'send\' ERROR : '+str(e) )
        print str(e)
        return HttpResponse(status=500)    
            
def admin(request):pass

def discussion(request,pk='0'):
    try:
        print 'got pk', pk
        pk = int(pk)
        d = Discussion.objects.filter(removed=False).get(pk=pk)
            
        sessionid = request.session['chatsession']
        if d.admins.filter(sessionid = sessionid).count():
            admin = True
            private = None
        else:
            admin = False
            if d.private:
                try:
                    request.session.get('validDiscs',[]).index(d.id)
                    private = False
                except: private = True
            else: private=False
        
        data = {'title':d.title, 'private':private, 'admin':admin, 'pk' : pk,'password':d.password, 'schedule':d.schedule()}
            
        return render(request,'discussion.html', data)
    except Exception as e:
        print('error loading discussion',e)
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
        key = request.session['chatsession']
        d.admins.get(sessionid=key)
    except:return HttpResponse(status=403)
    
    messages = d.message_set.filter(pk__in = messages)
    
    if action == 'ban':
        for m in messages:
            sessionid = m.sessionid
            if sessionid == key: #don't ban yourself
                REDIS.publish(0,simplejson.dumps({'TYPE':'private','sessionid':sessionid, 'title':'That\'s funny', 'message':'You just tried to ban yourself.'}))
                continue
            b = BannedSession.objects.create(sessionid=sessionid)
            d.bannedsessions.add(b)
            data = {'TYPE':'ban','pk':pk, 'sessionid':sessionid,'stack':'announce','announcement':'User %s has been removed' % (m.username), 'message':'You have been removed from discussion %s' % d.title}
            REDIS.publish(pk, simplejson.dumps(data))
            d.save()
    elif action == 'admin':
        for m in messages:
            sessionid = m.sessionid
            a = Admin.objects.create(sessionid=sessionid)
            d.admins.add(a)
            try:
                d.removeBan(sessionid)
                data2 = {'TYPE':'private','sessionid':key,'title':'Warning:','message':'You just made the banned user %s an admin.  That user is no longer banned.' % m.username}
                REDIS.publish(0, simplejson.dumps(data2))
                print 'Ban removed'
            except Exception as e: pubLog('removing ban error'+str(e))
            data = {'TYPE':'admin', 'sessionid':sessionid,'stack':'announce','announcement':'User %s has been made an Admin' % (m.username), 'message':'You have been made an admin for discussion %s' % d.title}
            REDIS.publish(pk, simplejson.dumps(data))
            d.save()
            
    
    done = simplejson.dumps({'status':'sent'})
    return HttpResponse(done)
    
    
def info(request):
    """ returns info in json about one discussion.  for editing. """
    pk = request.GET.get('pk')
    try:
        d = Discussion.objects.filter(pk=pk)
    except:
        return HttpResponse(status=404)
    fields = (
        'startDate', 'endDate', 'private', 'password', 'title', 'location'
    )
    data = serializers.serialize('json', d, fields=fields)
    return HttpResponse(data)
    

    
    
    
    