var Map;
var K = {
    
    init: function(){
        Map = L.map('map',{
            center: [51.505, -0.09],
            zoom: 13
        });
        L.mapbox.tileLayer('conorpp.map-90s20pgi').addTo(Map);				
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
        if (options.content ==undefined) options.content = $('#newPopup').html();
        if(Map.newMark)Map.removeLayer(Map.newMark);
        var markOptions = {    
            draggable:options.draggable,
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
    discussion:0,
    userCoords:null,
    username:'',
    replyTo:null
};


$(document).ready(function(){
    K.init();
    
    K.username = getCookie('username');
    if (K.username) {
        $('input#name').attr('placeholder', K.username);
        $('#yourName').html('Your name is '+K.username);
    }
    
    var Loading = $('#Loader').html();
    $('#start').on('click', function(){
        K.createMarker({'draggable':true,'start':true, 'content':$('#newPopup').html()});
    });
    $(document).on('click', '.submit', function(){
        var name = $(this).siblings('input').val();
        if ($.trim(name)=='') return;
        var latlng = Map.newMark.getLatLng();
        var popup = new L.Popup().setContent(Loading);
        Map.newMark.closePopup();
        Map.newMark.bindPopup(popup);
        Map.newMark.openPopup();
        AJAXF.makeDiscussion(latlng.lat, latlng.lng, name);
    });
    $(document).on('click', '.join', function(){
        $('#dFill').html($('#Loader').html());
        $('#Discussion').show('fast');
        var pk = this.id.replace('join','');
        K.discussion = pk;
        AJAXF.getMessages(pk);
        Message.socket.emit('joinChat', {pk:pk});
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
        setCookie('username', name, 12);
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

var AJAXF = {
    makeDiscussion: function(lat,lng,name) {
        $.ajax({
            type: 'POST',
            url: '/start/',
            data: {
                'lat': lat,
                'lng': lng,
                'name': name,
                'csrfmiddlewaretoken': $("input[name=csrfmiddlewaretoken]").val()
            },
            dataType:'json',
            success: function(data, textStatus,jqXHR) {
                console.log('GOT DATA',data);
                if (!data['error']) {                
                    data = data[0];
                    K.removeNewMark();
                    K.createMarker({
                        'content':data['html'],
                        'latlng':[data['lat'],data['lng']]
                    })
                }else{
                    K.setNewMarkError(data['error']);
                }
            }
        });
    },
    getMessages: function(pk){
        console.log('pk', pk);
        $.ajax({
            type: 'POST',
            url: '/messages/',
            data: {
                'pk': pk,
                'csrfmiddlewaretoken': $("input[name=csrfmiddlewaretoken]").val()
                },
            dataType:'json',
            success: function(data, textStatus,jqXHR) {
                console.log('GOT DATA',data);
                var fill = $('#dFill');
                fill.html('');
                for (i in data) {
                    fill.append(data[i]['html']);
                }

            }
        });
        
    },
    
    send: function(message, name, pk, replyTo){
        data  = {
            'discussion': pk,
            'pk': pk,
            'username': name,
            'text': message,
            'replyTo': replyTo,
            'csrfmiddlewaretoken': $("input[name=csrfmiddlewaretoken]").val()
            }       
        try{
            data.lat = K.userCoords.lat;
            data.lng = K.userCoords.lng;
        }catch(e){}
        $.ajax({
            type: 'POST',
            url: '/send/',
            data:data,
            dataType:'json',
            success: function(data, textStatus,jqXHR) {
                if (data['error']) {
                    $('.errors').html(data['error']);
                    $('.errors').show('fast');
                    setTimeout(function(){
                        $('.errors').hide('slow');
                    },1200);
                }
            }
        });
    },
}


function setCookie(c_name,value,exdays){
    var exdate=new Date();
    exdate.setDate(exdate.getDate() + exdays);
    var c_value=escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
    document.cookie=c_name + "=" + c_value;
}

function getCookie(c_name){
    var c_value = document.cookie;
    var c_start = c_value.indexOf(" " + c_name + "=");
    if (c_start == -1)
      {
      c_start = c_value.indexOf(c_name + "=");
      }
    if (c_start == -1)
      {
      c_value = null;
      }
    else
      {
      c_start = c_value.indexOf("=", c_start) + 1;
      var c_end = c_value.indexOf(";", c_start);
      if (c_end == -1)
      {
    c_end = c_value.length;
    }
    c_value = unescape(c_value.substring(c_start,c_end));
    }
    return c_value;
}