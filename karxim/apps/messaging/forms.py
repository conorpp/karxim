from django import forms
from django.utils import timezone
from karxim.apps.messaging.models import Discussion, Message, BannedSession, Admin
from karxim.functions import cleanHtml, getDistance
from django.core import signing

class NewDiscussionForm(forms.ModelForm):
    admin = forms.CharField(max_length = 120, required = False)
    title = forms.CharField(max_length = 120, required = False)
    lat = forms.FloatField(required = False)
    lng = forms.FloatField(required = False)

    class Meta:
        model = Discussion
        fields = ('lat', 'lng', 'admin','title')
        
    def setFields(self, **kwargs):
        """
        set fields manually.
        session must be decrypted
        """
        self.session = kwargs.get('chatsession',None)

    def clean(self):
        """validation"""
        #print 'cleaned',self.cleaned_data
        if any(self.errors):
            return
        self.error = False
        self.admin = self.cleaned_data.get('admin', True)
        print 'ADMIN',self.admin
        self.title = self.cleaned_data.get('title', 'hacker talk')
        self.lat = self.cleaned_data['lat']
        self.lng =self.cleaned_data['lng']
        if not self.lat or not self.lng:
            self.error = 'Try redragging the marker.  We failed to get the location.  We\'re  sorry.'
        elif self.session is None:
            self.error = 'Please allow cookies or refresh the page to continue.'
        else:
            try:
                c = Discussion.objects.filter(
                    sessionid = self.session,
                    created__gte = timezone.now() - timezone.timedelta(minutes=1)
                ).count()
                if c>2:
                    self.error = 'Please take your time and try again in one minute'
            except:pass
        
        if self.error:
            raise forms.ValidationError(self.error)
        
        return self.cleaned_data
    
        
    def save(self, ):
        self.discussion = Discussion.objects.create(
            lat = self.lat,
            lng = self.lng,
            title = self.title,
            sessionid = self.session,
            admin = self.admin
        )
        if self.admin:
            a = Admin.objects.create(sessionid = self.session)
            self.discussion.admins.add(a)
            self.discussion.save()
        return self.discussion
    
 
class NewMessageForm(forms.ModelForm):
    lat = forms.FloatField(required=False)
    lng = forms.FloatField(required=False)
    username = forms.CharField(max_length=50, required = False)
    
    class Meta:
        model = Message
        fields = ('discussion','text','username','lat', 'lng')
    
    def setFields(self,**kwargs):
        self.replyTo = kwargs.get('replyTo', None)
        self.session = kwargs.get('chatsession',None)
        
    def clean(self):
        """validation"""
        if any(self.errors):
            return
        self.error = None
        print 'cleaned data',self.cleaned_data
        message = self.cleaned_data['text']
        if not message: return
        
        if self.session is None:
            self.error = 'Please allow cookies or refresh the page to continue.'
            
        self.name = self.cleaned_data.get('username', 'hacker')
        if self.name.strip() == '': self.name = 'hacker'
        self.discussion = self.cleaned_data['discussion']
        self.lat = self.cleaned_data.get('lat',None)
        self.lng = self.cleaned_data.get('lng',None)
        
        if self.session is None:
            self.error = 'Please allow cookies or refresh your page to continue.'
        else:
            try:
                c = Message.objects.filter(
                    sessionid = self.session,
                    created__gte = timezone.now() - timezone.timedelta(seconds=10)
                ).count()
                if c>2:
                    self.error = 'Please take your time with those messages.'
            except:pass
            
        if self.error is None:
            
            try:
                self.distance = getDistance(self.lat,self.lng,self.discussion.lat, self.discussion.lng)
            except:
                self.distance = None
                
            self.text = cleanHtml(message)
            
            if self.replyTo:
                self.parent = self.discussion.message_set.get(pk=self.replyTo)
                self.stem = self.parent.stem +1
            else:
                self.stem = 0
                self.parent = None
        
        else:
            raise forms.ValidationError(self.error)
        
        return self.cleaned_data
        
    def getError(self, ):
        return self.error
    
    
    def save(self ):
        """ creates message and increments new message count in convo """
        self.discussion.totalMessages += 1
        if self.replyTo:
            self.parent.replies += 1
            self.parent.newReplies += 1
            self.parent.save()
            self.message = Message.objects.create()
            self.message.updateActive()
        else:
            self.message = Message.objects.create()
        self.newPk = self.message.pk        #need pk before returning
        
        return self.message

    def commit(self):                       #for speed
        self.message.discussion = self.discussion
        self.message.username = self.name
        self.message.text = self.text
        self.message.stem = self.stem
        self.message.parent = self.parent
        self.message.sessionid = self.session
        if self.distance: self.message.distance = self.distance
        self.message.save()
        self.discussion.save()
        return self.message

#client spam bot tester (currently protected from this)
"""

var i = 0;
    setInterval(
        function(){
            i++;
            $('#send').siblings('textarea').val('spam'+i);
            $('#name').val('spamky'+i);
            $('#nameSave').trigger('click');
            $('#send').trigger('click');
        }, 300);

"""

        
