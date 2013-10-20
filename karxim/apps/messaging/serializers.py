from django.utils import simplejson
from django.template.loader import render_to_string

class DiscussionSerializer():
    def __init__(self, discs):
        try:
            discs.count()
            self.discs = discs
        except:
            self.discs = [discs]
        self.fields = (     #for json
            'lat','lng','pk'
        )
        #( 'key','methodname' )
        self.methods = (
            
        )
        
    def data(self, kind='html'):
        data = []
        for i,dis in enumerate(self.discs):
            fields = self.assignFields(dis)
            if kind == 'html':
                html =  render_to_string('parts/marker.html', {'d':dis})
                fields['html'] = html
            data.append(fields)
            
        return simplejson.dumps(data)
    
    def assignFields(self, instance):
        fields = {}
        for field in self.fields:
            fields[field] = getattr(instance, field)
        for method in self.methods:
            fields[method[0]] = getattr(instance, method[1])()
        return fields
        
    
class MessageSerializer():
    def __init__(self,messages,**kwargs):
        """ custom serializer for threaded comments. Can add kwargs for properties if needed.
        
            @self.fields - model fields to serialize
            @self.methods - model methods to serialize. set ('keyName','methodName').
                            could be modified to take args
            @self.nests - how many nests deep to serialize
            @kwarg 'order_by' : specify field to rank by. uses same django order_by filter.
        """
        self.messages = messages
        self.order_by = kwargs.get('order_by','-lastActive')
        self.nests = 20
        self.kind = kwargs.get('kind', 'html')
        self.fields =()
        self.methods=(
            
            )
        
    def data(self, **kwargs):
        
        try:
            messages = self.serialize(self.messages.filter(stem=0))    #queryset
        except AttributeError:
            messages = [self.assignFields(self.messages)]                  #object
        
        kind = kwargs.get('kind', 'json')
        if kind=='json': return simplejson.dumps(messages)
        else: return comments
    
    def serialize(self, nestedMessages):
        parents = nestedMessages.order_by(self.order_by)
        i = 0
        threads = []
        for parent in parents:
            fields = self.assignFields(parent)
            threads.append(fields)
            if parent.message_set.all() and parent.stem <= self.nests:
                threads += self.serialize(parent.message_set.all())
            i+=1
        return threads
    
    def assignFields(self, instance):
        fields = {}
        for field in self.fields:
            fields[field] = getattr(instance, field)
        for method in self.methods:
            fields[method[0]] = getattr(instance, method[1])()
        if self.kind == 'html':
            fields['html'] = render_to_string('parts/message.html', {'m':instance})
        return fields
    
    
    
    
    
    
    
    
    
    