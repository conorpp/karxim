/*  Namespace and event listeners for node messaging  */


var Message = {
    
    /*
        connect to chat app, make web socket
    */
    connect: function(){
        //$('#topLoad').html(T.loadIcon);
        try {
            Message.socket = io.connect(Settings.simpleHost, {port: Settings.MessagePort});
            Message.socket.on('connect', function(){
                //$('#topLoad').html('');
                if (K.discussion) {
                    K.loadDisc(K.discussion);
                    $('textarea').attr('readonly',false);
                }
            }); 
        } catch(e) {
            Message.socket = $();
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
    getTime: function(){
        var date = new Date();
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
        Message.socket.emit('leave', {pk:pk});
    }
    
};


Message.connect();

Message.socket.on('getMessage', function(data) {
    var pk = data['pk'];
    var message = data['html'];
    if (data['replyTo']) {
        $('#dFill').find('#message'+data['replyTo']).after(message);
    }else $('#dFill').prepend(message);
        
    $('#message'+pk).hide();
    $('#message'+pk).show(100);        
});

Message.socket.on('update', function(data) {
    console.log('data update',data);
    K.announce(data['announcement']);   
});

Message.socket.on('ban', function(data) {
    K.ban(data);   
});

Message.socket.on('admin', function(data) {
    K.admin();
    K.popup('Admin',data['message'],4500);
});

Message.socket.on('private', function(data) {
    K.popup(data['title'],data['message'],8500);
});   
