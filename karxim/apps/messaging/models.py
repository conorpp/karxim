from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User
from django.contrib.humanize.templatetags.humanize import naturaltime
from django.contrib.contenttypes import generic


class Discussion(models.Model):
    user = models.ForeignKey(User, blank=True, null=True)
    
    name = models.CharField(max_length=500)
    description = models.TextField(max_length=10000)
    username = models.CharField(max_length=50, default='default')
    explicit = models.BooleanField(default=False)
    
    lastActive = models.DateTimeField(auto_now_add=True)
    created = models.DateTimeField(auto_now_add=True)
    upVote = models.IntegerField(default=0, db_index=True)
    downVote = models.IntegerField(default=0)
    usersPosted = models.IntegerField(default=0)
    totalMessages = models.IntegerField(default=0)
    newMessages = models.IntegerField(default=0)
    
    index = models.CharField(max_length=18, db_index=True, default='0')
    lat = models.CharField(max_length=50)
    lng = models.CharField(max_length=50)
    distance = models.FloatField(default = 0)
    
    def __unicode__(self):
        return self.name

    def votes(self):
        return (self.upVote - self.downVote)
    
    def age(self):
        return naturaltime(self.created)
    def lastAge(self):
        return naturaltime(self.lastActive)
    def changeToOld(self, ):
        self.newComments = 0
        self.save()
        

        
    

class Message(models.Model):
    user = models.ForeignKey(User, blank=True, null=True)
    parent = models.ForeignKey('self', blank=True, null=True)
    discussion = models.ForeignKey(Discussion)

    stem = models.IntegerField(default=0, db_index=True)
    replies = models.IntegerField(default=0)
    newReplies = models.IntegerField(default=0)
    
    text = models.CharField(max_length=1000)
    username = models.CharField(max_length=50)
    distance = models.FloatField(default = 0)
    lastActive = models.DateTimeField(auto_now_add=True, default=timezone.now(), db_index=True)
    created = models.DateTimeField(auto_now_add=True)
    
    def __unicode__(self, ):
        return self.text
    
    def age(self):
        return naturaltime(self.created)
    
    def updateActive(self):
        """ updates parent line to be active """
        try:
            parent = self.parent
            safe = 100
            self.discussion.lastActive = timezone.now()
            self.discussion.save()
            while parent:
                parent.lastActive = timezone.now()
                parent.save()
                parent = parent.parent
                safe+=1
                if safe > 100:
                    break
        except:
            print 'all done traversing parents'

    