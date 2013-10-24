

var AJAXF = {
    makeDiscussion: function(latlng,title,password) {
        $('#topLoad').html(T.loadIcon);
        if (password==undefined) {
            password = K.password;
        }
        $.ajax({
            type: 'POST',
            url: '/start/',
            data: {
                'lat': latlng.lat,
                'lng': latlng.lng,
                'title': title,
                'password': password,
                'csrfmiddlewaretoken': $("input[name=csrfmiddlewaretoken]").val()
            },
            dataType:'json',
            success: function(data, textStatus,jqXHR) {
                $('#topLoad').html('');
                console.log('GOT DATA',data);
                if (!data['error']) {                
                    data = data[0];
                    K.removeNewMark();
                    K.createMarker({
                        'content':data['html'],
                        'latlng':[data['lat'],data['lng']]
                    });
                    if (data['admin']=='True') {
                        K.popup('Limited Admin Abilities',
                                'Since you do not have an account, we can only track your admin status for up to twenty days, or until you clear your browser\'s cookies. <br /><br /> If you\'d like a permanent status, please log in or sign up.');
                    }
                }else{
                    K.setNewMarkError(data['error']);
                }
            }
        });
    },
    getMessages: function(pk, password){
        $('#topLoad').html(T.loadIcon);
        $.ajax({
            type: 'POST',
            url: '/messages/',
            data: {
                'pk': pk,
                'password': password,
                'csrfmiddlewaretoken': $("input[name=csrfmiddlewaretoken]").val()
                },
            dataType:'json',
            success: function(data, textStatus,jqXHR) {
                $('#topLoad').html('');
                var fill = $('#dFill');
                fill.html('');
                $('#sendWrap').find('textarea').attr('readonly', false);
                
                if (data['error']) {
                    K.popup(data['error'],'',12000);
                    console.log(data['error']);
                    if (data['ban']) {
                        K.ban(pk);
                    }
                    return;
                }
                if (data['admin']) K.admin();
                
                var messages = data['messages'];
                $('#Discussion').show('fast');
                
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
