from django import template

register = template.Library()

@register.filter('marginHTML')
def marginHTML(stem):
    if int(stem)%2 == 0:
        return str(stem*18+10)+'px;background:#3A3A3A;'
    return str(stem*18+10)+'px'
    