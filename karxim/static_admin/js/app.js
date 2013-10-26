

$(document).ready(function(){
    
    K.create(Settings.createMap);
    K.locate();
    K.username = Cookie.get('username');
    if (K.username) {
        $('input#name').attr('placeholder', K.username);
        $('#yourName').html('Your name is '+K.username);
    }
    
    $('#start').on('click', function(){
        $('.pDay').datepicker('destroy');
        K.createMarker({'draggable':true,'start':true, 'content':T.newMark});
        K.popup('New Discussion',T.newDisc,{left:'1%',clone:true,id:'newDiscPopup'});
        $('.pDay').datepicker({ altFormat: "mm-dd", minDate: new Date().toLocaleString()});
    });
    
    $(document).on('click','.private > input',function(){
        $('input.pw').toggle();
    });
    $(document).on('click', '.dCancel', function(){
        K.removeNewMark();
    });
    $(document).on('click', '.dSubmit', function(){
        var title = $(this).siblings('input[type="text"]').val();
        var priv = $(this).siblings("div.private").find('input[type="checkbox"]').is(':checked') ? "True" : "False";
        var loc = $(this).siblings("div.location").find('input[type="checkbox"]').is(':checked') ? "True" : "False";
        var pw = $.trim($(this).siblings('input.pw').val());
        if ($.trim(title)=='') {
            K.popup('Title','We require that every discussion at least have a name. That\'s it.',{millis:2300});
            return
        };
        if (priv=='True' && pw == '') {
            K.popup('Password','Did you mean to enter a password?  If not, then please deselect private.',{millis:2300});
            $('input.pw').focus();
            return;
        }
        $('.pDay').datepicker('destroy');
        K.newDisc = $(this).parents('.popupSpace');

        var latlng = Map.newMark.getLatLng();
        var date = K.newDisc.find('input.pDay').val();
        var time = K.newDisc.find('input.pTime').val();
        
        K.newDisc.html(T.loadIcon);
        AJAXF.makeDiscussion(latlng, title, pw, loc, date, time);
    });
    $(document).on('click', '.join', function(){
        var pk = this.id.replace('join','');
        K.loadDisc(pk);
    });
    $(document).on('click','.joinPriv',function(){
        var pk = this.id.replace('joinPriv','');
        var pw = $.trim($(this).siblings('input[type="text"].pw').val());
        if (pw == '') {
            K.popup('Private','You must enter the correct password for this discussion to get in.',{millis:3500});
            return;
        }
        K.loadDisc(pk,pw);
    });
    $('#dX, #map,#feedWrap').click(function(){
        K.closeDisc();
    });
    
    $(document).on('click','.pX',function(){      //popup X
        var parent = $(this).parents('.popupSpace');
        parent.hide();
        if (parent.attr('id') == 'newDiscPopup') {
            K.removeNewMark();
        }
    });
    $('#newThread').click(function(){
        $('#startThread').show('fast');
        $('#startThread').find('textarea').focus();
        $(this).hide();
    });
    $('#send').click(function(){
        var message = $.trim($(this).siblings('textarea').val());
        if (message == '') return;
        var name = K.username;
        if ($.trim(name)=='') {
            $('#name').focus();
            K.popup('Please enter a name','There is a field in the bottom right corner.',{millis:4500});
            return;
        }
        AJAXF.send(message,name,K.discussion);
        $(this).siblings('textarea').val('');
        setTimeout(function(){$("#dFill").animate({ scrollTop: "0px" });},200);
        $('#startThread').hide('fast');
        $('#newThread').show();
    });
    $('#dLink').click(function(){
        $(this).select();
    });
    
    $('#nameSave').click(function(){
        var name = $.trim($('input#name').val()).slice(0,39);
        if (name == '') return;
        K.username = name;
        $('input#name').val('');
        $('input#name').attr('placeholder', name);
        $('#yourName').html('Your name is '+name);
        Cookie.set('username', name, 12);
    });
    
    $(document).on('click','.replyTo', function(){
        var replyTo = this.id.replace('replyTo', '');
        K.replyTo = replyTo;
        $(this).hide('fast');
        var reply = $('#reply'+replyTo);
        reply.show('fast');
        reply.find('textarea').focus();
    });
    $(document).on('click','.replyX', function(){
        var pk = $(this).parent('.replyContainer')[0].id.replace('reply','');
        $('#reply'+pk).hide('fast');
        $('#replyTo'+pk).show('fast');
        K.replyTo = null;
    });
    
    $(document).on('click','.reply', function(){
        var pk = this.id.replace('replied', '');
        K.replyTo = pk;
        var text = $.trim($(this).siblings('textarea').val());
        console.log('reply!', text);
        if (text == '') return;
        if (!K.username) {
            $(this).siblings('.errors').html('Please set a name');
            $(this).siblings('.errors').show('fast');
            setTimeout(function(){$('.errors').hide('slow');},1200);
            return;
        }
        AJAXF.send(text, K.username, K.discussion, K.replyTo)
        $('#reply'+pk).hide('fast');
        $('#replyTo'+pk).show('fast');
        $('#reply'+pk).find('textarea').val('');
        $(this).siblings('textarea').val('')
        K.replyTo = null;
    });
    
    /* admin capabilities */
    
    $(document).on('click','.addAdmin',function(){
        K.cAction = 'admin';
        $('.adminAction').html('Adding an admin . . .');
        K.cSelect();
    });
    $(document).on('click','.removeClient',function(){
        K.cAction = 'ban';
        $('.adminAction').html('Removing a client . . .');
        K.cSelect();
    });
    $(document).on('click', '.doneAdmin',function(){
        K.cAct();
    });
    $(document).on('click', '.cancelAdmin',function(){
        K.cAction=null;
        K.cAct();
    });
    
});




