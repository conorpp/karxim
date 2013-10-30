/*
    Name space for ajax success functions and messaging
*/
$(document).ready(function(){
    S.newStack = new Array(S._creation);
    S.editStack = new Array(S._edit);
    
    S.deleteStack = new Array(S._delete);
    S.announceStack = new Array(S._announce);
});

var S = {
    
    _creation: function(data){
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
    
    _edit: function(data){
        if (!data['error']) {
            K.deleteDiscForm();
            console.log(K.newDiscStatus);
        }else this._error(data['error']);
    },
    
    _delete: function(data){
        if(data['pk']==K.discussion){
            K.popup('Discussion has ended','An admin has ended the discussion and it is no longer available.');
            $('#sendWrap').find('textarea').attr('disabled', true);
            Message.leave(data['pk']);
            K.deleteDiscForm();
            K.adminOff();
            console.log(K.newDiscStatus);
        }
    },
    
    _announce: function(data){
        K.announce(data['announcement']);
    },
    
    _error: function(error){
        K.newDisc.html(T.newDisc);
        $('#start').trigger('click');
        K.popup(error);
    }
};


