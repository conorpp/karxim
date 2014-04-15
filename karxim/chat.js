
//dependents for websockets with python:
//$ sudo apt-get install redis-server
//$ sudo pip install redis
//$ sudo apt-get install python-software-properties 
//$ sudo add-apt-repository ppa:chris-lea/node.js
//$ sudo apt-get update
//$ sudo apt-get install nodejs
//$ npm install socket.io
//$ npm install cookie
//$ npm install crypto

var Settings = require('./static_admin/settings/settings');
var fs = require('fs');
var asettings = JSON.parse(fs.readFileSync('/home/ubuntu/web_apps/CORE/apps.json'));
Settings.RedisPort = asettings.services.redis;
console.log('------------------------------------------------\n');
console.log('Starting up Node.  Here is the config : \n',Settings);
console.log('\n------------------------------------------------\n');

var http = require('http');
//r server = http.createServer().listen(Settings.MessagePort,'localhost');
var io = require('socket.io').listen(Settings.MessagePort);
var cookie_reader = require('cookie');
var querystring = require('querystring');

var redis = require('socket.io/node_modules/redis');
var store = redis.createClient(Settings.RedisPort);	//db checking redis.
var sub = redis.createClient(Settings.RedisPort);	//chatroom specific redis.
var gen = redis.createClient(Settings.RedisPort);	//general functions redis. Channel 0 only.
gen.subscribe(0); 	
var SOCKETS = {};

io.configure(function(){
    io.set('authorization', function(data, accept){
	//console.log(data.headers);        
	if (data.headers.cookie) {
          data.cookie = cookie_reader.parse(data.headers.cookie);
          return accept(null, true);
        }
        return accept('error',false);
	//return accept(null, true);    
	});
    io.set('log level',1);
});

io.sockets.on('connection', function(socket){

    var sessionid = socket.handshake.cookie.sessionid;
    store.get(sessionid, function(err, reply){
	if (reply) {
	    socket.sessionid = reply;
	    S.addSocket(reply, socket);
	    console.log('user successfully validated: ', reply);
	}
	else console.log('session validation fail.  sessionid: ',reply);
    });
    
    socket.rooms = [];
    
    socket.on('leave', function(data){
	console.log('user left room', data.pk);
        this.leave(data.pk);
	var i = this.rooms.indexOf(data.pk);
	this.rooms.splice(i,1);
    });
    
    socket.on('disconnect', function(data){
	S.removeSocket(this.sessionid);
        console.log('User disconnected.');
    });

    
}); // end io.sockets.on

//This is what sends data back to client
sub.on('message', Discussion);			//channel is pk of discussion
gen.on('message', General);			//channel 0 only.

function Discussion(channel, data){ 
    data = JSON.parse(data);
    //console.log('data', data);
    switch(data['TYPE']){
	
	case 'message':
	    S.message(channel, data);
	break;
    
	case 'ban':
	    S.ban(channel,data);
	    S.globalUpdate(channel, data);
	break;
    
	case 'admin':
	    S.admin(channel,data);
	    S.globalUpdate(channel, data);
	break;
    
	case 'update':
	    S.globalUpdate(channel, data);
	break;
    
	default:
	    console.log('None of cases were met for discussion publish.  sending message anyway.');
	    S.message(channel, data);
    }
        
}
function General(channel, data){
    if (channel != 0 ) return; 
    data = JSON.parse(data);
    //console.log('data', data);
    switch(data['TYPE']){
	
	case 'subscribe':
	    S.subscribe(data)
	break;
	
	case 'private':
	    S.priv(data);
	break;
    
	case 'log':
	    console.log('LOG : ', data['log']);
	break;
    
	default:
	    console.log('None of cases were met for general publish. Nothing was done.');
    }
}

/* namespace for working with sockets */
var S = {
    sockets:{},
    
    addSocket: function(sessionid, socket){
	S.sockets[''+sessionid] = socket;
    },
    
    getSocket: function(sessionid){
	
	return S.sockets[''+sessionid];
    },
    
    removeSocket: function(sessionid){
	delete S.sockets[''+sessionid];
    },
    
    /* sends message from socket to all subscribed to channel (d pk) */
    message: function (channel, data){
	console.log('sending message through channel', channel);
	io.sockets.in(channel).emit('getMessage', data);
    },
    
    /* sends annoucement to everyone in a channel (discussion pk) */
    globalUpdate:function(channel, data){
	io.sockets.in(channel).emit('update', data);
    },
    
    /* subscribe socket to recieve all messages sent through channel (discussion pk) */
    subscribe: function(data) {
	console.log('subscribing!', data);
	var pk = data['pk'];
	var s = S.getSocket(data['sessionid'])
	if (s==undefined)return;
	if (s.rooms.indexOf(pk) != -1) return;  //don't bother if already subscribed
	sub.subscribe(pk); 	//subscribe redis to room
        s.join(pk);		//subscribe new user to room
	s.rooms.push(pk);	//add room id to user's socket for us to track
	
	console.log('room ' + pk + ' saved');
    },
    
    /* notifies socket of ban and removes him */
    ban: function(channel, data) {
	var s = S.getSocket(data['sessionid']);
	//if (s.rooms.indexOf(channel) != -1) {
	    console.log('BANNED!');
	    s.emit('ban',data);
	//}
    },
    
    /* notifies socket of admin status and installs UI */
    admin: function(channel,data) {
	var s = S.getSocket(data['sessionid']);
	//if (s.rooms.indexOf(channel) != -1) {
	    console.log('ADMIN!');
	    s.emit('admin',data);
	//}
    },
    
    /* sends popup to one socket */
    priv: function(data) {
	var s = S.getSocket(data['sessionid']);
	if (s) {
	    console.log('PRIVATE!');
	    s.emit('private',data);
	}
    }
    
};
