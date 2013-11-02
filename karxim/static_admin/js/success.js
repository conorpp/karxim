/*
    Name space for ajax success functions and messaging
*/
$(document).ready(function(){
    S.newDStack = new Array(S._Discussion.creation);        //new discussion
    S.editDStack = new Array(S._Discussion.edit);           //edit discussion
    S.deletDeStack = new Array(S._Discussion.del);       //delete discussion
    
    S.announceStack = new Array(S._Message.announce);   //announcement message to discussion
    S.newMStack = new Array(S._Message.creation);                  //new message to current discussion
    S.editMStack = new Array(S._Message.edit);                 //edit message in current discussion
});

var S = {
    _Discussion: {
        creation: function(data){
           console.log('creation called');
            if (!data['error']) {
                K.deleteDiscForm();
                console.log(K.newDiscStatus);
                M.removeNewMark();
                K.update(data,{'prepend':true});
                //if (data['admin']=='True') {
                //leaving out until registration is available.
                    K.popup('Limited Admin Status',
                    'We can only track your admin status for this discussion for up to twenty days, or until you clear your browser\'s cookies. <br /><br /> The option to register and have permanent admin status will be available soon.');
                //}
                K.loadDisc(data[0]['pk']);
            }else this._error(data['error']);
        },
        
        edit: function(data){
            if (!data['error']) {
                K.deleteDiscForm();
                console.log(K.newDiscStatus);
            }else this._error(data['error']);
        },
        
        del: function(data){
            if(data['pk']==K.discussion){
                K.popup('Discussion has ended','An admin has ended the discussion and it is no longer available.');
                $('#sendWrap').find('textarea').attr('disabled', true);
                Message.leave(data['pk']);
                K.deleteDiscForm();
                K.adminOff();
                console.log(K.newDiscStatus);
            }
        },
    },
    
    _Message: {
    
        announce: function(data){
            K.announce(data['announcement']);
        },
        
        creation: function(data){
            var pk = data['pk'];
            var message = data['html'];
            if (data['replyTo']) {
                $('#dFill').find('#message'+data['replyTo']).after(message);
            }else $('#dFill').prepend(message);
            var select = $('#message'+pk);
            select.find('.time').html(Message.time());
            select.hide();
            select.show(100);
            K.findCreated();
        },
        
        edit: function(data){
            console.log('EDITED!', data);
            var pk = data['pk'];
            $('#message'+pk).replaceWith(data['html']);
            K.findCreated();
        }
        
    },
    _error: function(error){
        K.newDisc.html(T.newDisc);
        $('#start').trigger('click');
        K.popup(error);
    }
};


