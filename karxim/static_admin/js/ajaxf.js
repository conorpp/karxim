

var AJAXF = {
    makeDiscussion: function() {
        K.loading();
        console.log(K.discValues);
        $.ajax({
            type: 'POST',
            url: '/start/',
            data: K.discValues,
            dataType:'json',
            success: function(data, textStatus,jqXHR) {
                K.loaded();
                console.log('GOT DATA',data);
                if (!data['error']) {
                    K.newDisc.remove();
                    T.newDisc.find('input').val('');
                    console.log(K.newDiscStatus);
                    if (K.newDiscStatus == 'edit') return;
                    M.removeNewMark();
                    K.update(data,{'prepend':true});
                    //if (data['admin']=='True') {
                        //leaving out until registration is available.
                        K.popup('Limited Admin Status',
                                'We can only track your admin status for this discussion for up to twenty days, or until you clear your browser\'s cookies. <br /><br /> The option to register and have permanent admin status will be available soon.');
                    //}
                }else{
                    K.newDisc.html(T.newDisc);
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
    
    send: function(message, name, pk){
        data  = {
            'discussion': pk,
            'pk': pk,
            'username': name,
            'text': message,
            'replyTo': K.replyTo,
            'csrfmiddlewaretoken': $("input[name=csrfmiddlewaretoken]").val()
            }       
        try{
            data.lat = K.userCoords.latitude;
            data.lng = K.userCoords.longitude;
        }catch(e){}
        if (K.file && K.file == K.replyTo) {
            var fileForm = $('#messageFile');
            for (var key in data){
                var input = fileForm.find('input[name="'+key+'"]');
                if (input) input.val(data[key]);
            }
            fileForm.submit();
            //clear files from input file.  hackish
            var fileInput = fileForm.find('#fileUpload').clone();
            fileForm.find('#fileUpload').remove();
            fileForm.append(fileInput);
            return;
        }
        $.ajax({
            type: 'POST',
            url: '/send/',
            data:data,
            dataType:'json',
            success: function(data, textStatus,jqXHR) {
                if (data['error']) {
                    K.popup(data['error']);
                }
            }
        });
    },
    
    cAct:function(clients, action, pk){
        K.loading();
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
    },
    
    edit: function(pk){
        data  = {
            'pk': pk,
            }       
        $.ajax({
            type: 'GET',
            url: '/edit/',
            data:data,
            dataType:'json',
            success: function(data, textStatus,jqXHR) {
                K.loaded();
                console.log('got response back ', data);
                var fields = data[0]['fields'];
                var date1 = new Date(fields['startDate']);
                var date2 = new Date(fields['endDate']);
                var date = (date1.getMonth()+1)+'/'+date1.getDate()+'/'+date1.getFullYear();
                var time1 = Message.time(date1);
                var time2 = Message.time(date2);
                T.newDisc.find('input.pDay').val(date);
                T.newDisc.find('input.pTimeStart').val(time1);
                T.newDisc.find('input.pTimeEnd').val(time2);
                T.newDisc.find('input.dTitle').val(fields['title']);
                T.newDisc.find('input.pw').val(fields['password']);
                if (fields['private']) {
                    $('.private').find('input[type="checkbox"]').trigger('click');
                }
                T.newDisc.find('.location').find('input[type="checkbox"]').attr('checked',fields['location']);
                K.newDiscStatus = 'edit';
                K.initDiscForm('Edit Discussion');
            }
        });
    }
}
