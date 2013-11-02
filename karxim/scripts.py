from karxim.apps.messaging.models import Image,File

def migrateFiles():
    images = Image.objects.all()
    for i in images:
        i.name = i.__unicode__()
        i.save()
        
    files  = File.objects.all()
    for f in files:
        f.name = f.__unicode__()
        f.save()
    
    