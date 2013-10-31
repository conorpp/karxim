import base64,uuid

from tempfile import TemporaryFile
from dateutil import parser

from django import forms
from django.utils import timezone
from karxim.apps.messaging.models import Discussion, Message, BannedSession, Admin, File
from karxim.functions import Format, getDistance
from karxim.settings import TIME_ZONE
from django.core import signing
from django.core.files import File as DjangoFile
F = Format()
class NewDiscussionForm(forms.ModelForm):
    title = forms.CharField(max_length = 120, required = False)
    password = forms.CharField(max_length = 120, required = False)
    lat = forms.FloatField(required = False)
    lng = forms.FloatField(required = False)
    location = forms.BooleanField(required = False)
    date = forms.CharField(required = False)
    startTime = forms.CharField(required = False)
    endTime = forms.CharField(required = False)
    status = forms.CharField(required = False)
    pk = forms.CharField(required = False)

    class Meta:
        model = Discussion
        fields = ('lat', 'lng', 'title','password','location','date','startTime','endTime','status','pk')
        
    def setFields(self, **kwargs):
        """
        set fields manually.
        session must be decrypted before set
        """
        self.session = kwargs.get('chatsession',None)

    def clean(self):
        """validation"""
        #print 'cleaned',self.cleaned_data
        if any(self.errors):
            return
        self.error = False
        self.title = self.cleaned_data.get('title', 'hacker talk')
        self.lat = self.cleaned_data['lat']
        self.lng =self.cleaned_data['lng']
        self.password = self.cleaned_data.get('password','').strip()
        self.status = self.cleaned_data.get('status')
        self.location =self.cleaned_data.get('location',True)
        print 'STATUS' , self.status
        if self.status == 'delete': return self.cleaned_data
        if not self.status:
            try:
                pk = self.cleaned_data['pk']
                d = Discussion.objects.get(pk=pk)
                self.status = 'edit'
            except:self.status = 'new'
        if self.status == 'new':
            if not self.lat or not self.lng:
                self.error = 'Try redragging the marker.  We failed to get the location. Sorry about that.'
        if not self.session:
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

        try:        #parse the times
            time1 = str(self.cleaned_data.get('startTime',''))
            time2 = str(self.cleaned_data.get('endTime',''))
            if time1:
                date1 = (str(self.cleaned_data['date'])+' '+time1).lower()
                if date1.find('am') == -1 and date1.find('pm') == -1:
                    date1 += 'pm'
                self.date1 = (parser.parse(date1))
            else: self.date1 = None
            if time2:
                date2 = (str(self.cleaned_data['date'])+' '+time2).lower()
                if date2.find('am') == -1 and date2.find('pm') == -1:
                    date2 += 'pm'
                self.date2 = (parser.parse(date2))
            else: self.date2 = None
            if self.date1 and self.date2 and self.date1 > self.date2:
                self.date2 += timezone.timedelta(days=1)
        except ArithmeticError:
            print 'EXCEPTION getting start date ',e
            self.date1, self.date2 = None,None
        if self.error:
            raise forms.ValidationError(self.error)
        
        return self.cleaned_data
    
        
    def save(self, ):
        if self.status == 'new':
            self.discussion = Discussion.objects.create(
                lat = self.lat,
                lng = self.lng,
                title = self.title,
                sessionid = self.session,
                location = self.location,
                startDate = self.date1,
                endDate = self.date2
            )
            a=Admin.objects.create(sessionid = self.session)
            self.discussion.admins.add(a)

        elif self.status == 'edit':
            self.discussion = Discussion.objects.get(pk=self.cleaned_data['pk'])
            self.discussion.title = self.title
            self.discussion.location = self.location
            self.discussion.startDate = self.date1
            self.discussion.endDate = self.date2
        elif self.status == 'delete':
            self.discussion = Discussion.objects.get(pk=self.cleaned_data['pk'])
            self.discussion.removed = True
        else: raise forms.ValidationError('No status specified for saving.')
        
        if self.password:
            self.discussion.private=True
        else:
            self.discussion.private = False
        self.discussion.password=self.password
        self.discussion.save()
        return self.discussion
    
 
class NewMessageForm(forms.ModelForm):
    text = forms.CharField(required=False)
    lat = forms.FloatField(required=False)
    lng = forms.FloatField(required=False)
    username = forms.CharField(max_length=50, required = False)
    canvas = forms.CharField(required=False)
    class Meta:
        model = Message
        fields = ('discussion','text','username','lat', 'lng','canvas')
    
    def setFields(self,**kwargs):
        try:self.replyTo = int(kwargs.get('replyTo', 0))
        except: self.replyTo = 0
        self.session = kwargs.get('chatsession',None)
        
    def setFiles(self, files):
        print 'GOT FILES', files
        self.rawFiles = files
        
    def clean(self):
        """validation"""
        if any(self.errors):
            return
        self.error = None
        #print 'cleaned data',self.cleaned_data
        self.text = self.cleaned_data['text']
        
        if not self.session:
            self.error = 'Please allow cookies or refresh the page to continue.'
            
        self.name = self.cleaned_data.get('username', 'hacker')[:40]
        if self.name.strip() == '': self.name = 'hacker'
        self.discussion = self.cleaned_data['discussion']
        self.lat = self.cleaned_data.get('lat',None)
        self.lng = self.cleaned_data.get('lng',None)
        self.canvas = self.cleaned_data.get('canvas',None)
        
        if not self.text and not self.canvas and not self.rawFiles:
            self.error = 'You need to send a message'
            
        if self.session is None:
            self.error = 'Please allow cookies or refresh your page to continue.'
        elif self.discussion.bannedsessions.filter(sessionid=self.session).count():
            self.error = 'You have been banned from this discussion'
        else:
            try:
                c = Message.objects.filter(
                    sessionid = self.session,
                    created__gte = timezone.now() - timezone.timedelta(seconds=10)
                ).count()
                if c>2:
                    self.error = 'Please take your time with those messages.'
            except:pass
        if self.rawFiles:
            self.pics = []
            self.files = []
            if len(self.rawFiles) <6:
                for f in self.rawFiles:
                    try:
                        ext = f.name.rsplit('.',1)[1]
                        if ext.lower() in ['jpg', 'jpeg', 'gif', 'png']:
                            self.pics.append(f)
                        else: self.files.append(f)
                    except: self.files.append(f)
            else: self.error = 'You can only upload up to 5 files at a time.'
        else:
            self.pics, self.files,self.allFiles =None,None,None
            
        if self.canvas:     #canvas pics passed as DataURL so it must have special process.
            try:
                if self.pics is None: self.pics = []
                code = base64.b64decode(self.canvas.split(',')[1])
                with open('image.png', 'w') as f:
                    f.write(code)
                img = DjangoFile(open('image.png'))
                img.name = '%s.png' % uuid.uuid4()
                self.pics.append(img)
            except: self.canvas = None

        if self.error is None:
            try:
                self.distance = getDistance(self.lat,self.lng,self.discussion.lat, self.discussion.lng)
            except:
                self.distance = None
            if self.text:
                self.text = F.cleanHtml(self.text, add_target=True)
                self.text = F.latexify(self.text).replace('\n', '<br />')
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
        self.message = Message.objects.create()
        self.newPk = self.message.pk        #need pk before returning
        if self.pics and self.canvas:       #canvas pics need to be created first.
            print 'saving pics'
            for pic in self.pics:
                File.objects.create(image = pic, message = self.message)
        return self.message

    def commit(self):                       #for speed
        if self.replyTo:
            self.parent.replies += 1
            self.parent.newReplies += 1
            self.parent.save()
        self.discussion.totalMessages += 1
        self.message.discussion = self.discussion
        self.message.username = self.name
        self.message.text = self.text
        self.message.stem = self.stem
        self.message.parent = self.parent
        self.message.sessionid = self.session
        if self.distance: self.message.distance = self.distance
        self.message.updateActive()
        self.message.save()
        self.discussion.save()
        if self.pics and not self.canvas:
            print 'saving pics'
            for pic in self.pics:
                File.objects.create(image = pic, message = self.message)
        if self.files:
            for f in self.files:
                File.objects.create(item = f, message = self.message)
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

        
