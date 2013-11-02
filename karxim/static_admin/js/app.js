

$(document).ready(function(){

    M.create(Settings.createMap);
    K.locate();K.locate();
    K.loadScripts();
    K.username = Cookie.get('username');
    if (K.username) {
        $('input#name').attr('placeholder', K.username);
        $('#yourName').html('Your name is '+K.username);
    }
    K.userId = $('#userId').val();
    
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
        
        var stack = S[K.newDiscStatus+'DStack'];
        console.log(K.newDiscStatus+'DStack');
        console.log(S.newStack);
        console.log(stack);
        
        AJAXF.makeDiscussion(stack);
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
            try{M.removeNewMark();}catch(e){}
        }
    
    });
    $('#newThread').click(function(){
        $('#message0').find('.replyContainer').show('fast');
        $('#message0').find('textarea').focus();
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
        var pk = K.getMessagePk(this);
        $(this).hide('fast');
        if(!$(this).siblings('.replyContainer').length)$(this).after(T.replyTemplate);
        $('#message'+pk).find('.replyContainer').show('fast');
        $('#message'+pk).find('textarea').focus();
    });
    $(document).on('click','.replyX', function(){
        $(this).parents('.replyContainer').hide('fast');
        $(this).parents('.replyContainer').siblings('.replyTo').show('fast');
        $('#newThread').show();
        K.replyTo = null;
    });
    
    $(document).on('click','.send', function(){
        console.log('clciked');
        var pk = K.getMessagePk(this);
        var message = $('#message'+pk);
        message.data('status', 'new');
        message.data('replyTo', pk);
        message.data('text', $.trim(message.find('textarea').val()));
        message.data('username', K.username);
        if (message.data('text') == '' && !message.data('fileCount') && !message.data('canvas')) return;
        if (!K.username) {
            K.popup('Please set a name','The field is in the lower right corner.',{millis:3500});
            $('#name').focus();
            return;
        }
        if (message.data('fileCount')) {
            if (message.data('fileCount') > 5) {
                K.popup('File limit', 'You can\'t upload more than five files at a time.',{millis:4000});
                return;
            }
        }
        AJAXF.send(message);
        if (pk == 0) {
            setTimeout(function(){$("#dFill").animate({ scrollTop: "0px" });},200);
            $('#startThread').hide('fast');
            $('#newThread').show();
            console.log('discussion 12', K.discussion);
        }else{
            var pk = $(this).parents('.replyContainer').hide('fast');
            $(this).parents('.replyContainer').siblings('.replyTo').show('fast');
            K.replyTo = null;
        }
        $(this).parents('.replyContainer').find('.attachments').html('');
        $(this).siblings('textarea').val('')
        $(this).parents('.replyContainer').hide();
        $('#newThread').show();
    });
    
    $(document).on('click', '.attach', function(){
        var pk = K.getMessagePk(this);   //track reply these files are for.
        K.replyTo = pk;
        var message = $('#message'+pk);
        if (!$('#messageFileForm'+pk).length) {
            K.createFileForm(pk);
        }
        $('#fileUpload'+pk).trigger('click');
        $('#fileUpload'+pk).change(function(){
            var files = $(this).prop("files");
            var names = $.map(files, function(val) { return ' '+val.name; });
            if (message.data('canvas'))names.push(' CanvasPic.png')
            $('#message'+pk).find('.attachments').html('Attached: '+names);
            message.data('fileCount',files.length);
            console.log('file upload changed for pk'+pk+'.  heres the data', message.data());
        });
    });
    
    $(document).on('click','.draw', function(){
        if (!$('.drawing-board-controls').length) K.createBoard();
        K.replyTo = K.getMessagePk(this);
        T.draw.toggle('fast');
    });
    $(document).on('click', '.uploadCanvas', function(){
        var pk = K.replyTo;
        var message = $('#message'+pk);
        var imageUrl = $('canvas').get()[0].toDataURL("image/png");
        message.data('canvas',imageUrl);
        console.log(message.data());
        files = $('#fileUpload'+pk).prop("files");
        if(files) {        
            var names = $.map(files, function(val) { return ' '+val.name; });
            names.push(' CanvasPic.png');
        }else names = 'CanvasPic.png'
        $('#message'+pk).find('.attachments').html('Attached: '+names);
        T.draw.hide('fast');
    });
    $(document).on('click', '.closeCanvas', function(){
        T.draw.hide('fast');
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
        AJAXF.info(K.discussion);
    });
    $(document).on('click', '.doneAdmin',function(){
        K.cAct();
    });
    $(document).on('click', '.cancelAdmin',function(){
        K.cAction=null;
        K.cAct();
    });
    $(document).on('click','.delete',function(){
        K.popup('Delete',T.deletePrompt);
    });
    $(document).on('click','#deleteCommit',function(){
        K.newDiscStatus = 'delete';
        $('.dSubmit').trigger('click');
    });
    $(document).on('click', '.edit', function(){
        K.performEdit(false);
        var pk = K.getMessagePk(this);
        K.editMessage(pk);
       // AJAXF.editMessage(pk);    //unnecessary for now.
    });
    $(document).on('click', '.cancelEdit', function(){
        K.performEdit(false);
    });
    $(document).on('click', '.saveEdit', function(){
        var pk = K.getMessagePk(this);
        K.performEdit(true, $('#message'+pk));
    });

});




