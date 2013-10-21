

var AJAXF = {
    makeDiscussion: function(latlng,title,admin) {
        console.log('admin ', admin)
        $.ajax({
            type: 'POST',
            url: '/start/',
            data: {
                'lat': latlng.lat,
                'lng': latlng.lng,
                'title': title,
                'admin': admin,
                'csrfmiddlewaretoken': $("input[name=csrfmiddlewaretoken]").val()
            },
            dataType:'json',
            success: function(data, textStatus,jqXHR) {
                console.log('GOT DATA',data);
                if (!data['error']) {                
                    data = data[0];
                    K.removeNewMark();
                    K.createMarker({
                        'content':data['html'],
                        'latlng':[data['lat'],data['lng']]
                    })
                }else{
                    K.setNewMarkError(data['error']);
                }
            }
        });
    },
    getMessages: function(pk){
        
        $.ajax({
            type: 'POST',
            url: '/messages/',
            data: {
                'pk': pk,
                'csrfmiddlewaretoken': $("input[name=csrfmiddlewaretoken]").val()
                },
            dataType:'json',
            success: function(data, textStatus,jqXHR) {

                var fill = $('#dFill');
                fill.html('');
                console.log('admin cookie ', Cookie.get('admin'));
                console.log('admin data ', data['admin']);
                if (data['admin'] && Cookie.get('admin') ) K.admin();
                else K.adminOff();
                
                data = data['messages'];
                for (i in data) {
                    fill.append(data[i]['html']);
                }

            }
        });
        
    },
    
    send: function(message, name, pk, replyTo){
        data  = {
            'discussion': pk,
            'pk': pk,
            'username': name,
            'text': message,
            'replyTo': replyTo,
            'csrfmiddlewaretoken': $("input[name=csrfmiddlewaretoken]").val()
            }       
        try{
            data.lat = K.userCoords.lat;
            data.lng = K.userCoords.lng;
        }catch(e){}
        $.ajax({
            type: 'POST',
            url: '/send/',
            data:data,
            dataType:'json',
            success: function(data, textStatus,jqXHR) {
                if (data['error']) {
                    $('.errors').html(data['error']);
                    $('.errors').show('fast');
                    setTimeout(function(){
                        $('.errors').hide('slow');
                    },1200);
                }
            }
        });
    },
}
