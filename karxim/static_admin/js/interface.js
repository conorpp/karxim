/* Namespaces */
/*
    K - main functions + data
    T - templates
    Map - the MapBox map object.
    M - namespace for working with map.
    Cookie - managing cookies
    messaging.js/Message - Messaging + node functions
    success.js/S - success functions to call for after ajax requests.
*/

var K = {
    
    /***data****
        @discussion - pk of current discussion being viewed.
        @userCoords - latlng pair of user if location is found.
        @username - name selected by user.  Will default to cookie if it exists.
        @replyTo - pk of message being replied to.  May not be necessary to track here.
        @discValues - data ajax sends for creating/editing a discussion
        @newDiscStatus - indication 'edit' or 'new' for new/existing discussions
        @cAction - string indication what to do with selected clients.
                'admin' - make them an admin for discussion
                'ban' - ban them from discussion
        @timeout - for clearing timeout on popup animation.
        @prepend - indicate to prepend to feed or otherwise append.
        @newDisc - reference to popup form for new disc so it can be removed after valid submission.

    */
    discussion:0,
    password:null,
    userCoords:null,
    username:'',
    replyTo:null,
    file:null,
    discValues:{},
    newDiscStatus:'new',
    cAction:'',
    timeout:null,
    prepend:false,
    newDisc:null,
    
    loading:function(){try{$('#topLoad').html(T.loadIcon);}catch(e){}},
    loaded:function(){try{$('#topLoad').html('');}catch(e){}},
    
    addFeed:function(feed){
        if(this.prepend) $('#feed').prepend(feed);
        else $('#feed').append(feed);
    },
    /* animates to discussion in feed */
    selectFeed:function(id){
        $('.dFeed').removeClass('background3');
        if (!id) return;
        $('html, body').animate({
            scrollTop: $('#dFeed'+id).offset().top
        }, 200);
        $('#dFeed'+id).addClass('background3');
    },

    /* for updating with all discussion markers */
    update:function(data, options){
        if (options == undefined) options = {};
        if (options.prepend) {
            this.prepend = true;
        }else this.prepend = false;
        for (i in data) {
            var d = data[i];
            M.createMarker({
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
        console.log('new d is pk ',pk);
        console.log('new d is pk 2',this.discussion);
        if (password) this.password = password;
        AJAXF.getMessages(pk);
        var title = $('#discussion'+pk).find('h2').html();
        $('#topLoad').html(T.loadIcon);
        $('#dTitle').html(title);
        $('#dLink').val(Settings.nakedHost+'/d/'+pk);
        if($('#schedule'+pk).length)$('#info').html($('#schedule'+pk).html());
        $('#titleLink').attr('href', Settings.host+'/d/'+pk);
        $('#sendWrap').find('textarea').attr('disabled', false);
    },
    
    initDiscForm: function(title){
        if (title == undefined) title = 'New Discussion';
        try{$('.pDay').datepicker('destroy');}catch(e){}
        K.popup(title,T.newDisc,{left:'1%',clone:true,id:'newDiscPopup'});
        $('.delete').hide();
        try{
            $('.pDay').datepicker({ altFormat: "yyyy-mm-dd", minDate:0});
            console.log(new Date().toLocaleString());
            M.createMarker({'draggable':true,'start':true, 'content':T.newMark});
        }catch(e){}
        console.log('k new disc',K.newDisc);
    },
    
    deleteDiscForm: function(){
        $('#newDiscPopup').remove();
        console.log('removing ', K.newDisc);
        T.newDisc.find('input').val('');
        try{M.removeNewMark();}catch(e){}
    },
    /* get values of new disc form and validates with popup. */
    getDiscValues: function(selector){
        this.discValues.title = T.newDisc.find('input[type="text"].dTitle').val();
        this.discValues['private'] = T.newDisc.find("div.private").find('input[type="checkbox"]').is(':checked') ? "True" : "False";
        this.discValues.location = T.newDisc.find("div.location").find('input[type="checkbox"]').is(':checked') ? "True" : "False";
        this.discValues.password = $.trim(T.newDisc.find('input.pw').val());
        this.discValues.status = K.newDiscStatus;
        this.discValues.pk = this.discussion;
        this.discValues.csrfmiddlewaretoken = $("input[name=csrfmiddlewaretoken]").val();
        if (this.newDiscStatus == 'delete') return true;
        if ($.trim(this.discValues.title)=='') {
            this.popup('Title','We require that every discussion at least have a name. That\'s it.',{millis:2300});
            return false;
        };
        if (this.discValues['private']=='True' && this.discValues.password == '') {
            this.popup('Password','Did you mean to enter a password?  If not, then please deselect private.',{millis:2300});
            $('input.pw').focus();
            return false;
        }
        try{$('.pDay').datepicker('destroy');}catch(e){}
        console.log(this.newDiscStatus);
        if (this.newDiscStatus == 'new') {
            var latlng = Map.newMark.getLatLng();
            this.discValues.lat = latlng.lat;
            this.discValues.lng = latlng.lng;
        }
        this.discValues.date = T.newDisc.find('input.pDay').val();
        this.discValues.startTime = T.newDisc.find('input.pTimeStart').val();
        this.discValues.endTime = T.newDisc.find('input.pTimeEnd').val();
        return true;
    },
    /* IMPORTANT.  this must be called everytime a discussion is closed whilst still on same page. */
    closeDisc: function(){               
        $('#Discussion').hide('fast');
        this.selectFeed();
        if(this.discussion) Message.leave(this.discussion);
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
    popup: function(title, message, options){
        if (options == undefined) options = {};
        clearTimeout(K.timeout);
        console.log('popupo...');
        var popup = $('#popupSpace');
        if(options.clone){
            var popup = popup.clone();
            $('#'+options.id).remove();
            popup.attr('id',options.id);
            popup.toggleClass('level5 level4');
            $('body').append(popup);
        }
        popup.html(T.popup);
        popup.find('.popupTitle').html(title);
        popup.find('.popupMessage').html(message);
        if (options.right) popup.css('right', options.right);
        else if (options.left) popup.css('left', options.left).css('right','initial');
        else popup.css('left', 'inherit').css('right','inherit');
        popup.show('fast');
        if(options.millis!=undefined) this.timeout = setTimeout(function(){popup.hide('fast')},options.millis);
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
    /*  sends bans user from discussion if pk matches displayed discussion  */
    ban:function(data){
        if(data['pk']==K.discussion){
            $('#dFill').html('');
            K.adminOff();
            $('#sendWrap').find('textarea').attr('disabled', true);
        }
    },
    /*  sends announcement to current discussion  */
    announce:function(message){
        var a = T.announce;
        console.log('announce', a);
        a.find('.announce').html(message);
        $('#dFill').prepend(a.html());
    },
    
    /*  get user location.  Independent of map. */
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
        //K.popup('Start and End time','wee');
    }

};
var Map;
M = {
    create: function(commit){
        if (commit == undefined) commit = true;
        if (!commit) return;

        Map = L.map('map',{
            center: [51.505, -0.09],
            zoom: 13,
            zoomControl:false
        });
        if(commit)L.mapbox.tileLayer('conorpp.map-90s20pgi').addTo(Map);
        Map.addControl(new L.Control.Zoom({ position: 'topright' }));
        Map.locate({setView: true, timeout:1500});
    },
    
    createMarker: function(options){
        if (options ==undefined) options = {};
        if (options.draggable ==undefined) options.draggable = false;
        if (options.start ==undefined) options.start = false;
        if (options.start) {
            var iconURL = '/static/images/new_Marker.png';
        }else var iconURL = '/static/images/marker.png';
        if (options.latlng ==undefined) options.latlng = Map.getCenter();
        if (options.content ==undefined) options.content = '';
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
            newMark.on('dragend', function(){
                this.openPopup();
                Map.panTo(this.getLatLng())
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
    
    removeNewMark: function(){
        try {
            Map.removeLayer(Map.newMark);
            delete Map.newMark;
        } catch(e) {
            console.log('new mark was not removed',e);
        }
    },
    /* display error on new marker */
    setNewMarkError:function(error){
        var popup = new L.Popup().setContent('<div class=\"errors\">'+error+'</div>');
        Map.newMark.bindPopup(popup);
        Map.newMark.addTo(Map);
        Map.newMark.openPopup();
    },
};

var T;
$(document).ready(function(){
    T = {
        admin: $('#adminTemplate').html(),
        
        loadIcon: $('#Loader').html(),
        
        newMark: $('#newPopup').html(),
        
        popup: $('#popupTemplate').html(),
        
        selectClient: $('#selectClient').html(),
        
        announce: $('#annouceTemplate'),
        
        newDisc: $('#newDisc'),
        
        deletePrompt: $('#deletePrompt')
                
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