

var AJAXF = {
    makeDiscussion: function(funcArray) {
        K.loading();
        console.log(K.discValues);
        K.deleteDiscForm();
        $.ajax({
            type: 'POST',
            url: '/start/',
            data: K.discValues,
            dataType:'json',
            success: function(data, textStatus,jqXHR) {
                K.loaded();
                console.log('GOT DATA',data);
                for (i in funcArray) funcArray[i](data);
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
    
    send: function(message){        //jquery object of message being replied to
        message.data('discussion',K.discussion);
        message.data('csrfmiddlewaretoken',$("input[name=csrfmiddlewaretoken]").val());
        try{
            message.data('lat',K.userCoords.latitude);
            message.data('lng',K.userCoords.longitude);
        }catch(e){}
        var data = message.data();
        console.log(data);
        if (message.data('files')) {        //set K.file to current reply to keep files in correct replies.
            var fileForm = $('#messageFileForm'+data.replyTo);
            for (var key in data){
                var input = $(document.createElement('input')).attr({
                    type: 'hidden',
                    name: key,
                    value: data[key]
                });
                fileForm.append(input);
            }
            fileForm.submit();
            console.log('form submitted');
            fileForm.remove();
            message.removeData();
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
        message.removeData();
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
                K.loaded();
                console.log('got response back ', data);
            }
        });
    },
    
    info: function(pk){
        K.loading();
        data  = {
            'pk': pk,
            }       
        $.ajax({
            type: 'GET',
            url: '/info/',
            data:data,
            dataType:'json',
            success: function(data, textStatus,jqXHR) {
                K.loaded();
                console.log('got response back ', data);
                var fields = data[0]['fields'];
                var date1 = new Date(fields['startDate']);
                if (fields['startDate']) {
                    var date1 = new Date(fields['startDate']);
                    var time1 = Message.time(date1);
                    var date = (date1.getMonth()+1)+'/'+date1.getDate()+'/'+date1.getFullYear();
                    T.newDisc.find('input.pDay').val(date);
                    T.newDisc.find('input.pTimeStart').val(time1);
                    if (fields['endDate']) {
                        var date2 = new Date(fields['endDate']);
                        var time2 = Message.time(date2);
                        T.newDisc.find('input.pTimeEnd').val(time2);
                    }
                }
                T.newDisc.find('input.dTitle').val(fields['title']);
                T.newDisc.find('input.pw').val(fields['password']);
                if (fields['private']) {
                    $('.private').find('input[type="checkbox"]').trigger('click');
                }
                T.newDisc.find('.location').find('input[type="checkbox"]').attr('checked',fields['location']);
                K.newDiscStatus = 'edit';
                K.initDiscForm('Edit Discussion');
                $('.delete').show();
            }
        });
    }
}
function dataURItoBlob(dataURI) {
    // convert base64 to raw binary data held in a string
    // doesn't handle URLEncoded DataURIs
    var byteString = atob(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

    // write the bytes of the string to an ArrayBuffer
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    // write the ArrayBuffer to a blob, and you're done
    var bb = new Blob([ab]);
    return bb;
}