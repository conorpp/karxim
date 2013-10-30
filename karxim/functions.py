# -*- coding: utf-8 -*-

from math import radians, cos, sin, asin, sqrt
import datetime , re, hmac, redis, hashlib

from lxml.html.clean import Cleaner, autolink_html, clean_html
from BeautifulSoup import BeautifulSoup 

from django.core.context_processors import csrf 
from django.utils import timezone , simplejson
from django.utils.html import escape
from django.contrib import auth
from karxim.settings import SECRET_KEY, REDIS_PORT
from karxim.apps.latex.models import Formula

KEY = hashlib.sha1(SECRET_KEY).digest()
REDIS = redis.StrictRedis(host='127.0.0.1', port=REDIS_PORT, db=0)

def pubLog(msg=''):
    """ sends log statement to node so you can monitor live
        logs from node in terminal.
    """
    REDIS.publish(0,simplejson.dumps({'TYPE':'log', 'log':msg}))
    return msg
        
def getDistance(lat1, lng1, lat2, lng2):
    """Calculate the great circle distance between two points 
        on the earth (specified in decimal degrees).  Returns miles"""
        
    # convert decimal degrees to radians 
    lng1, lat1, lng2, lat2 = map(radians, [float(lng1), float(lat1), float(lng2), float(lat2)])
    # haversine formula 
    dlon = lng2 - lng1 
    dlat = lat2 - lat1 
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a)) 
    miles = 3956 * c
    if miles< 1:
        miles = round(miles, 2) 
    else:
        miles = round(miles, 1)
    if miles < 0.01:
        miles = 0.01
    return miles


def set_cookie(response, key, value, days_expire = 20, signed=True):
    """ sets a signed cookie. returns value and sign unless specified not signed"""
    if days_expire is None:
      max_age = 365 * 24 * 60 * 60  #one year
    else:
      max_age = days_expire * 24 * 60 * 60 
    expires = datetime.datetime.strftime(datetime.datetime.utcnow() + datetime.timedelta(seconds=max_age), "%a, %d-%b-%Y %H:%M:%S GMT")
    if signed:
        response.set_signed_cookie(key, value, max_age=max_age, expires=expires)
    else: response.set_cookie(key, value, max_age=max_age, expires=expires)
    
  
reg_b = re.compile(r"(android|bb\\d+|meego).+mobile|avantgo|bada\\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino", re.I|re.M)
reg_v = re.compile(r"1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\\-(n|u)|c55\\/|capi|ccwa|cdm\\-|cell|chtm|cldc|cmd\\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\\-s|devi|dica|dmob|do(c|p)o|ds(12|\\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\\-|_)|g1 u|g560|gene|gf\\-5|g\\-mo|go(\\.w|od)|gr(ad|un)|haie|hcit|hd\\-(m|p|t)|hei\\-|hi(pt|ta)|hp( i|ip)|hs\\-c|ht(c(\\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\\-(20|go|ma)|i230|iac( |\\-|\\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\\/)|klon|kpt |kwc\\-|kyo(c|k)|le(no|xi)|lg( g|\\/(k|l|u)|50|54|\\-[a-w])|libw|lynx|m1\\-w|m3ga|m50\\/|ma(te|ui|xo)|mc(01|21|ca)|m\\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\\-2|po(ck|rt|se)|prox|psio|pt\\-g|qa\\-a|qc(07|12|21|32|60|\\-[2-7]|i\\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\\-|oo|p\\-)|sdk\\/|se(c(\\-|0|1)|47|mc|nd|ri)|sgh\\-|shar|sie(\\-|m)|sk\\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\\-|v\\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\\-|tdg\\-|tel(i|m)|tim\\-|t\\-mo|to(pl|sh)|ts(70|m\\-|m3|m5)|tx\\-9|up(\\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\\-|your|zeto|zte\\-", re.I|re.M)
def detectMobile(request):
    """ returns bool indicating if request is from mobile """
    request.mobile = False
    if request.META.has_key('HTTP_USER_AGENT'):
        user_agent = request.META['HTTP_USER_AGENT']
        b = reg_b.search(user_agent)
        v = reg_v.search(user_agent[0:4])
        if b or v:
            return True 
        return False

class Format():
    """
        General functions for formating html and math.  Best to initialize
        once and use methods as you need them.
    """
    def __init__(self, ):    
        self.url_regex = re.compile(r"""(?i)\b(?P<body>(?:[a-z][\w-]+:(?:/{1,3}|[a-z0-9%])|www\d{0,3}[.]|(?P<host>[a-z0-9.\-]+[.][a-z]{2,4}/))(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))""")
        self.latex_regex = re.compile(r'\{\{[\s\S.]*\}\}')
        self.cleaner = Cleaner(style=False, links=True, page_structure=False)
        
    def cleanHtml(self, text, **kwargs):
        """ cleans up html and auto links with target=_blank for forms """
        add_target = kwargs.get('add_target',True)
        text = self.cleaner.clean_html(autolink_html(text, [self.url_regex], avoid_hosts=[]))
        if add_target:
            text = BeautifulSoup(''.join(text))
            for atag in text.findAll('a'):                          #open in new tab
                atag['target'] = '_blank'
                if atag['href'].find('http',0,5) == -1:
                    atag['href'] = 'http://'+atag['href']
            text = ''.join(map(str,text.contents))
        return text.replace('\n', '<br />')

    def latexify(self, content):
        """  grabs occurances of {{ ..math.. }} and creates latix png from it.
            then replaces each {{ ..math.. }}  occurance with an img tag"""
        return self.latex_regex.sub(self.addFormula, content)
    
    def addFormula(self,match):
        match = match.group()
        latex = match[2:len(match)-2]
        f = Formula.objects.create(formula = latex)
        return u'<img src="/static/static_site/%s" alt="%s" />' % (f.image.url, escape(f.formula))





