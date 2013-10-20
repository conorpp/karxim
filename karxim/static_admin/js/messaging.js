

var Message = {
    
    /*
        connect to chat app, make web socket
    */
    connect: function(){
        try {
            Message.socket = io.connect('http://localhost', {port: 4000});
            Message.socket.on('connect', function(){

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
    }
    
}

$(document).on('ready', function(){

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
    
});