

$(document).ready(function(){
    
    K.create(Settings.createMap);

    //K.popup('testing out the pop up.','this is the message',2000);
    K.username = Cookie.get('username');
    if (K.username) {
        $('input#name').attr('placeholder', K.username);
        $('#yourName').html('Your name is '+K.username);
    }
    
    $('#start').on('click', function(){
        console.log('new mark ',T.newMark);
        K.createMarker({'draggable':true,'start':true, 'content':T.newMark});
    });
    $(document).on('click', '.dSubmit', function(){
        var title = $(this).siblings('input[type="text"]').val();
        var admin = $(this).siblings("div.checkbox").find('input[type="checkbox"]').is(':checked') ? "True" : "False";
        if ($.trim(title)=='') return;
        var latlng = Map.newMark.getLatLng();
        var popup = new L.Popup().setContent(T.loadIcon);
        Map.newMark.closePopup();
        Map.newMark.bindPopup(popup);
        Map.newMark.openPopup();
        AJAXF.makeDiscussion(latlng, title,admin);
    });
    $(document).on('click', '.join', function(){
        
        $('#dFill').html(T.loadIcon);
        $('#Discussion').show('fast');
        var pk = this.id.replace('join','');
        var title = $('#discussion'+pk).find('h2').html();
        $('#dTitle').html(title);
        $('#dLink').val(Settings.host+'/d/'+pk);
        $('#titleLink').attr('href', Settings.host+'/d/'+pk);
        K.discussion = pk;
        AJAXF.getMessages(pk);
        Message.subscribe(pk);
        
    });
    $('#dX, #map').click(function(){
        $('#Discussion').hide('fast');
    });
    
    $('#send').click(function(){
        var message = $.trim($(this).siblings('textarea').val());
        if (message == '') return;
        var name = K.username;
        if ($.trim(name)=='') {
            $('.errors').html('Please enter a name');
            $('.errors').show('fast');
            setTimeout(function(){$('.errors').hide('slow');},1200);
            return;
        }
        AJAXF.send(message,name,K.discussion);
        $(this).siblings('textarea').val('');
        setTimeout(function(){$("#dFill").animate({ scrollTop: "0px" });},200);
    });
    $('#dLink').click(function(){
        $(this).select();
    });
    Map.on('locationfound', function(e){
        K.userCoords = e.latlng;
    });
    
    $('#nameSave').click(function(){
        var name = $.trim($('input#name').val());
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
        $('#reply'+replyTo).show('fast');
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
        K.cSelect();
    });
    $(document).on('click','.removeClient',function(){
        K.cAction = 'ban';
        K.cSelect();
    });
    $(document).on('click', '.doneAdmin',function(){
        K.cAct();
    });
});




