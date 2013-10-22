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
    */
    discussion:0,
    userCoords:null,
    username:'',
    replyTo:null,
    cAction:'',
    
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
        newMark.on('mouseover', function(){
            this.openPopup();
        });
        if (options.start) {
            Map.newMark = newMark;
            newMark.on('dragend', function(){
                this.openPopup();
                Map.panTo(this.getLatLng())
            });
            popup.on('popupclose', function(){
                K.removeNewMark();
            });
        }
    },
    removeNewMark: function(){
        Map.removeLayer(Map.newMark);
    },
    /* display error on new marker */
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
        var messages = $('#dFill').find('.message');
        messages.each(function(){
            $(this).prepend(T.selectClient);
            
        });
        $('#topSpace').find('.doneAdmin').show('fast');
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
        $('#topSpace').find('.doneAdmin').hide('fast');
        console.log('selected clients', clients);
        if (clients.length) {
            AJAXF.cAct(clients, K.cAction, K.discussion);
        }
    }

};

var T;
$(document).ready(function(){
    T = {
        admin: $('#adminTemplate').html(),
        
        loadIcon: $('#Loader').html(),
        
        newMark: $('#newPopup').html(),
        
        popup: $('#popupTemplate').html(),
        
        selectClient: $('#selectClient').html()
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