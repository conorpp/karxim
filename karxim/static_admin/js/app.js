

$(document).ready(function(){

    M.create(Settings.createMap);
    K.locate();
    K.username = Cookie.get('username');
    if (K.username) {
        $('input#name').attr('placeholder', K.username);
        $('#yourName').html('Your name is '+K.username);
    }
    
    $('#start').on('click', function(){
        K.newDiscStatus = 'new';
        K.initDiscForm('New Discussion');
    });
    
    $(document).on('click','.private > input',function(){
        $('input.pw').toggle();
    });
    $(document).on('click', '.dCancel', function(){
        M.removeNewMark();
    });
    $(document).on('click', '.dSubmit', function(){
        var selector = $(this).parents('.popupSpace');
        if (!K.getDiscValues(selector))return;
        AJAXF.makeDiscussion();
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
            M.removeNewMark();
        }
    });
    $('#newThread').click(function(){
        $('#startThread').show('fast');
        $('#startThread').find('textarea').focus();
        $(this).hide();
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
    var files = new Array();
    $(document).on('click','.send', function(){
        console.log('clciked');
        var pk = this.id.replace('send', '');
        K.replyTo = pk;
        var text = $.trim($(this).siblings('textarea').val());
        if (text == '') return;
        if (!K.username) {
            K.popup('Please set a name','The field is in the lower right corner.',{millis:3500});
            $('#name').focus();
            return;
        }
        if (files.length>5) {
            K.popup('File limit', 'You can\'t upload more than five files at a time.',{millis:4000});
            return;
        }
        AJAXF.send(text, K.username, K.discussion)
        if (pk == 0) {
            setTimeout(function(){$("#dFill").animate({ scrollTop: "0px" });},200);
            $('#startThread').hide('fast');
            $('#newThread').show();
            console.log('discussion 12', K.discussion);
        }else{
            $('#reply'+pk).hide('fast');
            $('#replyTo'+pk).show('fast');
            $('#reply'+pk).find('textarea').val('');
            K.replyTo = 0;
        }
        $(this).siblings('textarea').val('')
    });
    
    $(document).on('click', '.attach', function(){
        var replyTo = this.id.replace('attach','');
        var button = this;
        $('#fileUpload').trigger('click');
        $('#fileUpload').change(function(){
            files = $(this).prop("files");
            var names = $.map(files, function(val) { return ' '+val.name; });
            $(button).siblings('.attachments').html('Attached: '+names);
            if ($(this).val()) K.file = replyTo;
            else K.file = null;
        });
    });
    
    $(document).on('click', 'img', function(){
        $(this).toggleClass('thumbnail full');
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
    $(document).on('click','.editAdmin',function(){
        AJAXF.edit(K.discussion);
    });
    $(document).on('click', '.doneAdmin',function(){
        K.cAct();
    });
    $(document).on('click', '.cancelAdmin',function(){
        K.cAction=null;
        K.cAct();
    });
    
});




