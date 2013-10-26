

var AJAXF = {
    makeDiscussion: function(latlng,title,password,loc, date, time) {
        K.loading();
        console.log('date ', date);
        console.log('time ', time);
        $.ajax({
            type: 'POST',
            url: '/start/',
            data: {
                'lat': latlng.lat,
                'lng': latlng.lng,
                'title': title,
                'password': password,
                'location': loc,
                'date': date,
                'time': time,
                'csrfmiddlewaretoken': $("input[name=csrfmiddlewaretoken]").val()
            },
            dataType:'json',
            success: function(data, textStatus,jqXHR) {
                K.loaded();
                console.log('GOT DATA',data);
                if (!data['error']) {
                    K.newDisc.remove();
                    T.newDisc.find('input').val('');
                    K.removeNewMark();
                    K.update(data,{'prepend':true});
                    if (data['admin']=='True') {
                        K.popup('Limited Admin Abilities',
                                'Since you do not have an account, we can only track your admin status for up to twenty days, or until you clear your browser\'s cookies. <br /><br /> If you\'d like a permanent status, please log in or sign up.');
                    }
                }else{
                    $('#start').trigger('click');
                    K.popup(data['error']);
                }
            }
        });
    },
    getMessages: function(pk){
        K.loading();
        $.ajax({
            type: 'POST',
            url: '/messages/',
            data: {
                'pk': pk,
                'password': K.password,
                'csrfmiddlewaretoken': $("input[name=csrfmiddlewaretoken]").val()
                },
            dataType:'json',
            success: function(data, textStatus,jqXHR) {
                K.loaded();
                var fill = $('#dFill');
                fill.html('');
                
                if (data['error']) {
                    K.popup(data['error'],data['message'],{millis:5000});
                    console.log(data['error']);
                    if (data['ban']) {
                        K.ban(pk);
                    }
                    return;
                }
                if (data['admin']) K.admin();
                
                var messages = data['messages'];
                $('#Discussion').show('fast');
                $('#hidePW').hide('fast');

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
            data.lat = K.userCoords.latitude;
            data.lng = K.userCoords.longitude;
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
