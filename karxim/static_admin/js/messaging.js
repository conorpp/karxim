/*  Namespace and event listeners for node messaging  */


var Message = {
    /*
        connect to chat app, make web socket.
        connection issues UI.
    */
    connect: function(){
        try {
            this.socket = io.connect(Settings.simpleHost, {port: Settings.MessagePort});
            this.socket.on('connecting', function () {K.loading()});
            this.socket.on('connect', function(){
                K.loaded();
                if (K.discussion) {
                    K.loadDisc(K.discussion,K.password);
                    $('textarea').attr('readonly',false);
                }
            });
            this.socket.on('reconnecting', function(){
                K.popup('Lost connection','Attempting to reconnect . . .');
                K.loading();
            });
            this.socket.on('reconnect_failed', function () {
                K.loaded();
                K.popup('Disconnected','We failed to reconnect you.  Sorry about that.',{millis:4000});
            });
            this.socket.on('reconnect', function () {
                K.loaded();
                K.popup('Connected','We successfully reconnected you.',{millis:4100});
                $('textarea').attr('disabled',false);
            });
            this.socket.on('disconnect', function () {
                $('textarea').attr('disabled',true);
                K.popup('','disconnected');
            });
        } catch(e) {
            this.socket = $();
            console.log("Failed connecting to socket.  Chat.js probably isn't running. ", e);
        }

    },

    /*
        Send message to everyone in conversation Cpk
    */
    sendMessage: function(pk, message, name){
        var data = {'pk':pk, 'message':message, 'name':name}
        $.ajax({
            type: "POST", 
            url: HOST + '/message/messageSocket/', 
            dataType:'json',
            data:data,
            success: function(){/* Message has been sent */}
        }); 
    },


    /* returns time like '9:06 pm' */
    time: function(date){
        if(date == undefined) date = new Date();
        var hours = date.getHours();
        var half = 'am';
        var minutes = date.getMinutes();
        if (hours >= 12) {
            if (hours !=12) hours -= 12;
            half = 'pm';
        }else if (hours==0) {
            hours='12';
        }
        if (minutes<10) {
            minutes = '0' + minutes;
        }
        return hours + ':' + minutes + ' ' + half;
    },

    /* leaves a discussion subscription */
    leave:function(pk){
        this.socket.emit('leave', {pk:pk});
    }
    
};

Message.connect();

Message.socket.on('getMessage', function(data) {
    if (data['discussion'] != K.discussion) return;
    var pk = data['pk'];
    var message = data['html'];
    if (data['replyTo']) {
        $('#dFill').find('#message'+data['replyTo']).after(message);
    }else $('#dFill').prepend(message);
    var select = $('#message'+pk);
    select.find('.time').html(Message.time());
    select.hide();
    select.show(100);        
});

Message.socket.on('update', function(data) {
    console.log('data update',data);
    K.announce(data['announcement']);   
});

Message.socket.on('ban', function(data) {
    if(data['pk'] == K.discussion) K.ban(data);
    K.popup('Removal',data['message'],{millis:3500});
});

Message.socket.on('admin', function(data) {
    K.admin();
    K.popup('Admin',data['message'],{millis:4500});
});

Message.socket.on('private', function(data) {
    K.popup(data['title'],data['message']);
});   
