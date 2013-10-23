

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
                console.log('got messages',data);
                K.adminOff();
                if (data['error']) {
                    K.showError(data['error'],20000);
                    console.log(data['error']);
                    if (data['error']['ban']) {
                        //ban user from chat subscription somehow
                    }
                    return;
                }
                if (data['admin'] && Cookie.get('admin') ) K.admin();
                
                var messages = data['messages'];
                
                for (var i = 0; i < messages.length; i++) {
                    fill.append(messages[i]['html']);
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
                    K.showError(data['error']);
                }
            }
        });
    },
    
    cAct:function(clients, action, pk){
        data  = {
            'clients': JSON.stringify(clients),
            'action': action,
            'pk': pk,
            'csrfmiddlewaretoken': $("input[name=csrfmiddlewaretoken]").val()
            }       
        $.ajax({
            type: 'POST',
            url: '/clients/change/',
            data:data,
            dataType:'json',
            success: function(data, textStatus,jqXHR) {
                console.log('got response back ', data);
            }
        });
    }
}