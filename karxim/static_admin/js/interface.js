/* Namespaces */
/*
    Map - the MapBox map object.
    K - main functions + data
    T - templates
    Cookie - managing cookies
    Messaging/Message - Messaging + node functions
*/

var Map;
var K = {
    
    /***data****
        @discussion - pk of current discussion being viewed.
        @userCoords - latlng pair of user if location is found.
        @username - name selected by user.  Will default to cookie if it exists.
        @replyTo - pk of message being replied to.  May not be necessary to track here.
        @cAction - string indication what to do with selected clients.
                'admin' - make them an admin for discussion
                'ban' - ban them from discussion
        @timeout - for clearing timeout on popup animation.

    */
    discussion:0,
    password:null,
    userCoords:null,
    username:'',
    replyTo:null,
    cAction:'',
    timeout:null,
    
    loading:function(){try{$('#topLoad').html(T.loadIcon);}catch(e){}},
    loaded:function(){try{$('#topLoad').html('');}catch(e){}},
    
    create: function(commit){
        if (commit == undefined) commit = true;
        if (!commit) return;

        Map = L.map('map',{
            center: [51.505, -0.09],
            zoom: 13,
            zoomControl:false,
            worldCopyJump:true
        });
        if(commit)L.mapbox.tileLayer('conorpp.map-90s20pgi').addTo(Map);
        Map.addControl(new L.Control.Zoom({ position: 'topright' }));
        //Map.addControl(control);
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
        var popup = new L.Popup({closeOnClick:!options.start, closeButton:!options.start}).setContent(options.content);
        var newMark = L.marker(options.latlng, markOptions);
        if (options.id) {
            newMark.id = options.id;
        }
        newMark.bindPopup(popup);
        newMark.addTo(Map);
        newMark.openPopup();

        if (options.start) {
            Map.newMark = newMark;
            newMark.on('dragstart dragend', function(){
                this.openPopup();
                Map.panTo(this.getLatLng())
            });
            newMark.on('click', function(){
                var popup2 = new L.Popup({closeOnClick:!options.start, closeButton:!options.start}).setContent($('.leaflet-popup-content').html());
                console.log($('.leaflet-popup-content').html());
                newMark.bindPopup(popup2);
            });
            newMark.on('popupclose', function(){
                console.log(this);
                K.removeNewMark();
            });
        }else{
            newMark.on('mouseover', function(){
                if (Map.newMark) return;
                this.openPopup();
                K.selectFeed(this.id);
            });
            newMark.on('click', function(){
                if (Map.newMark) return;
                K.selectFeed(this.id);
            });
        }
    },
    addFeed:function(feed){
        $('#feed').append(feed);
    },
    /* animates to discussion in feed */
    selectFeed:function(id){
        $('html, body').animate({
            scrollTop: $('#dFeed'+id).offset().top
        }, 200);
        $('.dFeed').removeClass('background3');
        $('#dFeed'+id).addClass('background3');
    },
    removeNewMark: function(){
        Map.removeLayer(Map.newMark);
        delete Map.newMark;
    },
    /* display error on new marker */
    setNewMarkError:function(error){
        var popup = new L.Popup().setContent('<div class=\"errors\">'+error+'</div>');
        Map.newMark.bindPopup(popup);
        Map.newMark.addTo(Map);
        Map.newMark.openPopup();
    },
    /* for updating with all discussion markers */
    update:function(data){
        for (i in data) {
            var d = data[i];
            K.createMarker({
                'content':d['popup'],
                'latlng':[d['lat'],d['lng']],
                'id':d['pk']
            })
            K.addFeed(d['feed']);
        }
    },
    /* loads up a discussion for a given pk.  password optional. */
    loadDisc: function(pk, password){
        this.discussion = pk;
        if (password) this.password = password;
        AJAXF.getMessages(pk);
        var title = $('#discussion'+pk).find('h2').html();
        $('#topLoad').html(T.loadIcon);
        $('#dTitle').html(title);
        $('#dLink').val(Settings.nakedHost+'/d/'+pk);
        $('#titleLink').attr('href', Settings.host+'/d/'+pk);
        $('#sendWrap').find('textarea').attr('disabled', false);
    },
    /* IMPORTANT.  this must be called everytime a discussion is closed whilst still on same page. */
    closeDisc: function(){               
        $('#Discussion').hide('fast');
        if(this.discussion)Message.leave(this.discussion);
        this.discussion = null;
        this.password = null;
        
    },
    /* installs admin UI for current discussion */
    admin:function(){
        this.adminOff();
        $('#topSpace').append(T.admin);
    },
    /* removes admin UI */
    adminOff: function(){
        $('#topSpace').find('.admin').remove();
    },
    
    /* displays standard message for miliseconds */
    popup: function(title, message, millis){
        clearTimeout(K.timeout);
        console.log('popupo...');
        var popup = $('#popupSpace');
        popup.html(T.popup);
        popup.find('.popupTitle').html(title);
        popup.find('.popupMessage').html(message);
        popup.show('fast');
        if(millis!=undefined) this.timeout = setTimeout(function(){popup.hide('fast')},millis);
    },

    /* displays error in error locations for miliseconds */
    showError: function(error, millis){
        if (millis==undefined) millis = 1500;
        $('.errors').html(error);
        $('.errors').show('fast');
        setTimeout(function(){
            $('.errors').hide('slow');
        },millis);
    },
    
    /* add checkboxes to messages and show done button */
    cSelect: function(){
        $('#dFill').find('.message').prepend(T.selectClient);
        $('#topSpace').find('.admin .hide').show('fast');
    },
    /* gets pk of message from each selected client */
    cAct: function(){
        var clients = new Array();
        var checks = $('#dFill').find('input[type="checkbox"].cSelect:checked');
        checks.each(function(){
            console.log(this);
            var pk = $(this).parent('.message').attr('id').replace('message', '');
            clients.push(pk);
        });
        $('input[type="checkbox"].cSelect').remove();
        $('#topSpace').find('.admin .hide').hide('fast');
        if(!K.cAction)return;
        if (clients.length) {
            console.log('selected clients', clients);
            AJAXF.cAct(clients, K.cAction, K.discussion);
        }
    },
    
    ban:function(data){
        if(data['pk']==K.discussion){
            $('#dFill').html('');
            K.adminOff();
            $('#sendWrap').find('textarea').attr('disabled', true);
        }
    },
    
    announce:function(message){
        var a = T.announce;
        console.log('announce', a);
        a.find('.announce').html(message);
        $('#dFill').prepend(a.html());
    },
    
    locate:function(){
        if (navigator.geolocation) {
            var pos = function(e){
                K.userCoords = e.coords;
                console.log('got coords', K.userCoords);
            }
            var error = function(e){
                console.log('there was an err getting location ',e);
            }
            navigator.geolocation.getCurrentPosition(pos, error);
        }
    },
    
    addTime:function(){
        K.popup('Start and End time','wee');
    }

};

var T;
$(document).ready(function(){
    T = {
        admin: $('#adminTemplate').html(),
        
        loadIcon: $('#Loader').html(),
        
        newMark: $('#newPopup').html(),
        
        popup: $('#popupTemplate').html(),
        
        selectClient: $('#selectClient').html(),
        
        announce: $('#annouceTemplate')
    }
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