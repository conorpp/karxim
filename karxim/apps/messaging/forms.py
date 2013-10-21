from django import forms
from django.utils import timezone
from karxim.apps.messaging.models import Discussion, Message
from karxim.functions import cleanHtml, getDistance

class NewDiscussionForm(forms.ModelForm):
    name = forms.CharField(max_length = 120, required = False)
    class Meta:
        model = Discussion
        fields = ('lat', 'lng', 'name')
    
    def clean(self):
        """validation"""
        print self.cleaned_data
        if any(self.errors):
            return
        self.error = False
        self.name = self.cleaned_data.get('name', 'hacker')
        try:
            c = Discussion.objects.filter(name = self.cleaned_data['name'], created__gte=timezone.now()-timezone.timedelta(hours=1)).count()
            if c>4: self.error = 'This same discussion has been made 4 times recently'
        except:pass
        
        if self.error:
            raise forms.ValidationError(self.error)
        
        return self.cleaned_data
    
        
    def save(self, ):
        self.discussion = Discussion.objects.create(
            lat = self.cleaned_data['lat'],
            lng = self.cleaned_data['lng'],
            name = self.name
        )

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
        
    def clean(self):
        """validation"""
        if any(self.errors):
            return
        self.error = False
        print 'cleaned data',self.cleaned_data
        message = self.cleaned_data['text']
        if not message: return
        
        self.name = self.cleaned_data.get('username', 'hacker')
        if self.name.strip() == '': self.name = 'hacker'
        self.discussion = self.cleaned_data['discussion']
        self.lat = self.cleaned_data.get('lat',None)
        self.lng = self.cleaned_data.get('lng',None)
        
        try:
            self.distance = getDistance(self.lat,self.lng,self.discussion.lat, self.discussion.lng)
        except:
            self.distance = None
            
        self.text = cleanHtml(message)
        
        try:
            c = Message.objects.filter(
                username = self.name,
                text=self.text,
                created__gte=timezone.now()-timezone.timedelta(hours=2),
                discussion = self.discussion
                )
            print 'SPAMM',c.count()
            if c.count()>4:
                self.error = 'You\'re sending the same message too much'
        except ValueError:pass
        
        if self.replyTo:
            self.parent = self.discussion.message_set.get(pk=self.replyTo)
            self.stem = self.parent.stem +1
        else:
            self.stem = 0
        
        if self.error:
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
            self.message = Message.objects.create(text=self.text, discussion=self.discussion, stem=self.stem, parent=self.parent )
            self.message.updateActive()
        else:
            self.message = Message.objects.create(text=self.text, discussion=self.discussion, stem=0)
        self.newPk = self.message.pk
        
        return self.message

    def commit(self):
        self.message.username = self.name
            
        if self.distance: self.message.distance = self.distance
        self.message.save()
        self.discussion.save()
        return self.message




        
