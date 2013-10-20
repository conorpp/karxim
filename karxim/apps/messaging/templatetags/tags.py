from django import template

register = template.Library()

@register.filter('marginHTML')
def marginHTML(stem):
    if int(stem)%2 == 0:
        return 'margin-left:'+str(stem*8+10)+'px;background:#3A3A3A;'
    else: return 'margin-left:'+str(stem*8+10)+'px'
    
    