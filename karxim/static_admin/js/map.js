var Map;
var K = {
    
    /***data****
        @discussion - pk of current discussion being viewed.
        @userCoords - latlng pair of user if location is found.
        @username - name selected by user.  Will default to cookie if it exists.
        @replyTo - pk of message being replied to.  May not be necessary to track here.
    */
    discussion:0,
    userCoords:null,
    username:'',
    replyTo:null,
    
    create: function(commit){
        if (commit == undefined) commit = true;
        Map = L.map('map',{
            center: [51.505, -0.09],
            zoom: 13
        });
        if(commit)L.mapbox.tileLayer('conorpp.map-90s20pgi').addTo(Map);				
        Map.locate({setView: true, timeout:1500});
    },
    
    createMarker: function(options){
        if (options ==undefined) options = {};
        if (options.draggable ==undefined) options.draggable = false;
        if (options.start ==undefined) options.start = false;
        if (options.start) {
            var iconURL = '/static/images/newMarker.png';
        }else var iconURL = '/static/images/marker.png';
        if (options.latlng ==undefined) options.latlng = Map.getCenter();
        if (options.content ==undefined) options.content = T.newMark;
        if(Map.newMark)Map.removeLayer(Map.newMark);
        var markOptions = {    
            draggable:options.draggable,
            riseOnHover:true,
            icon: L.icon({
                iconUrl:iconURL,
                iconAnchor:[15, 35],
                popupAnchor:[0, -35],
            })
        };
        var popup = new L.Popup().setContent(options.content);
        var newMark = L.marker(options.latlng, markOptions);
        if (options.id) {
            newMark.id = options.id;
        }
        newMark.bindPopup(popup);
        newMark.addTo(Map);
        newMark.openPopup();
        if (options.start) {
            Map.newMark = newMark;
            newMark.on('dragend', function(){
                this.openPopup();
                Map.panTo(this.getLatLng())
            });
            popup.on('popupclose', function(){
                console.log('FIRED');
                K.removeNewMark();
            });
        }
    },
    removeNewMark: function(){
        Map.removeLayer(Map.newMark);
    },
    setNewMarkError:function(error){
        var popup = new L.Popup().setContent('<div class=\"errors\">'+error+'</div>');
        Map.newMark.bindPopup(popup);
        Map.newMark.addTo(Map);
        Map.newMark.openPopup();
    },
    /* for updating with all discussions */
    update:function(data){
        for (i in data) {
            var marker = data[i];
            K.createMarker({
                'content':marker['html'],
                'latlng':[marker['lat'],marker['lng']],
                'id':marker['pk']
            })
        }
    },
    /* installs admin UI for current discussion */
    admin:function(){
        console.log('admin ', T.admin);
        $('#topSpace').append(T.admin);
    },
    /* removes admin UI */
    adminOff: function(){
        $('#topSpace').find('.admin').remove();
    },
    /* displays standard message for miliseconds */
    popup: function(title, message, millis){
        if (message == undefined) message = title;
        if (millis == undefined) millis = 2500;
        var popup = $('#popupSpace');
        popup.html(T.popup);
        popup.find('.popupTitle').html(title);
        popup.find('.popupMessage').html(message);
        popup.show('fast');
        //setTimeout(function(){popup.hide('fast')},millis);
    }

};

var T;
$(document).ready(function(){
    T = {
        admin: $('#adminTemplate').html(),
        
        loadIcon: $('#Loader').html(),
        
        newMark: $('#newPopup').html(),
        
        popup: $('#popupTemplate').html()
    }
});

var COMMIT = true;
$(document).ready(function(){
    
    K.create(COMMIT);
    
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
        var title = $(this).sblings('input[type="text"]').val();
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
});


var Cookie = {
    
    set: function(c_name,value,exdays){
        var exdate=new Date();
        exdate.setDate(exdate.getDate() + exdays);
        var c_value=escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
        document.cookie=c_name + "=" + c_value;
    },
    
    get: function(c_name){
        var c_value = document.cookie;
        var c_start = c_value.indexOf(" " + c_name + "=");
        if (c_start == -1) c_start = c_value.indexOf(c_name + "=");
        if (c_start == -1) c_value = null;
        else{
            c_start = c_value.indexOf("=", c_start) + 1;
            var c_end = c_value.indexOf(";", c_start);
            if (c_end == -1) c_end = c_value.length;
            c_value = unescape(c_value.substring(c_start,c_end));
        }
        return c_value;
    }
};
