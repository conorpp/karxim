import os

from django.db import models, connection
from django.utils import timezone
from django.contrib.auth.models import User
from django.contrib.humanize.templatetags.humanize import naturaltime
from django.contrib.contenttypes import generic

class BannedSession(models.Model):
    user = models.ForeignKey(User, blank=True, null=True)
    sessionid = models.CharField(max_length=100, db_index=True)
    created = models.DateTimeField(auto_now_add=True)

class Admin(models.Model):
    user = models.ForeignKey(User, blank=True, null=True)
    sessionid = models.CharField(max_length=100, db_index=True)
    created = models.DateTimeField(auto_now_add=True)

class Discussion(models.Model):
    user = models.ForeignKey(User, blank=True, null=True)
    bannedsessions = models.ManyToManyField(BannedSession)
    admins = models.ManyToManyField(Admin)
    sessionid = models.CharField(max_length=100, db_index=True)
    
    title = models.CharField(max_length=500)
    admin = models.BooleanField(default=False)
    
    lastActive = models.DateTimeField(auto_now_add=True, db_index=True)
    created = models.DateTimeField(auto_now_add=True, db_index=True)
    usersPosted = models.IntegerField(default=0)
    totalMessages = models.IntegerField(default=0)
    password = models.CharField(max_length=100, default='')
    private = models.BooleanField(default = False)
    startDate = models.DateTimeField(null=True, blank=True, default=None)
    endDate = models.DateTimeField(null=True, blank=True, default=None)
    removed = models.BooleanField(default=False)
    
    lat = models.CharField(max_length=50)
    lng = models.CharField(max_length=50)
    location = models.BooleanField(default = True)
    
    #the following not implemented
    newMessages = models.IntegerField(default=0)
    description = models.TextField(max_length=10000)
    explicit = models.BooleanField(default=False)
    index = models.CharField(max_length=18, db_index=True, default='0')
    distance = models.FloatField(default = 0)
    upVote = models.IntegerField(default=0, db_index=True)
    downVote = models.IntegerField(default=0)
    
    def __unicode__(self):
        return self.title
    
    def schedule(self, ):

        if self.startDate is None:
            if self.endDate: return 'Active.  Ends %s' % naturaltime(self.endDate)
            return ''

        if self.startDate > timezone.now():
            return 'Begins %s '% naturaltime(self.startDate)
        
        elif self.endDate:
            if self.endDate > timezone.now():
                return 'In progress.  Ending %s' % naturaltime(self.endDate)
            
            else:
                return 'This discussion ended %s' % naturaltime(self.endDate)
        
        else:
            return 'Started %s' % naturaltime(self.startDate)
    
    def age(self):
        return naturaltime(self.created)
    def lastAge(self):
        return naturaltime(self.lastActive)
    def changeToOld(self, ):
        self.newComments = 0
        self.save()
    def removeBan(self,sessionid):
        bans = self.bannedsessions.filter(sessionid=sessionid)
        for ban in bans:
            ban.delete()
        return True
        

class Message(models.Model):
    user = models.ForeignKey(User, blank=True, null=True)
    sessionid = models.CharField(max_length=100, db_index=True)
    parent = models.ForeignKey('self', blank=True, null=True)
    discussion = models.ForeignKey(Discussion, blank=True, null=True)

    stem = models.IntegerField(default=0, db_index=True)
    replies = models.IntegerField(default=0)
    newReplies = models.IntegerField(default=0)
    
    text = models.CharField(max_length=1000)
    username = models.CharField(max_length=50)
    distance = models.FloatField(default = 0)
    lastActive = models.DateTimeField(auto_now_add=True, default=timezone.now(), db_index=True)
    created = models.DateTimeField(auto_now_add=True, db_index=True)
    
    #following not implemented
    image = models.ImageField(upload_to='images',blank=True, null=True)
    item = models.FileField(upload_to='images/files',blank=True, null=True)
    caption = models.CharField(max_length=250, default='')
    def __unicode__(self, ):
        return self.text
    
    def age(self):
        return naturaltime(self.created)
    
    def updateActive(self):
        """ updates parent line to be active """
        try:
            parent = self.parent
            safe = 0
            self.discussion.lastActive = timezone.now()
            self.discussion.save()
            while parent:
                parent.lastActive = timezone.now()
                parent.save()
                parent = parent.parent
                safe+=1
                if safe > 50:
                    break
        except Exception as e:
            print 'all done traversing parents'
            
    def imageDict(self):
        images = self.image_set.all()
        dic = {}
        for i in images:
            dic['image']=i.__unicode__()
        return dic
            
    def fileDict(self):
        files = self.file_set.all()
        dic = {}
        for f in files:
            dic['file']=f.__unicode__()
        return dic

class File(models.Model):
    message = models.ForeignKey(Message,blank=True, null=True, related_name='file_set')
    discussion = models.ForeignKey(Discussion,blank=True, null=True)
    item = models.FileField(upload_to='images/files',blank=True, null=True)
    caption = models.CharField(max_length=250, default='')
    description = models.CharField(max_length=2000, default='')
    created = models.DateTimeField(auto_now_add=True, db_index=True)
    def __unicode__(self):
        return os.path.basename(self.item.name)
    
class Image(models.Model):
    message = models.ForeignKey(Message,blank=True, null=True, related_name='image_set')
    discussion = models.ForeignKey(Discussion,blank=True, null=True)
    image = models.ImageField(upload_to='images',blank=True, null=True)
    caption = models.CharField(max_length=250, default='')
    description = models.CharField(max_length=2000, default='')
    created = models.DateTimeField(auto_now_add=True, db_index=True)
    def __unicode__(self):
        return os.path.basename(self.image.name)
    
    
    