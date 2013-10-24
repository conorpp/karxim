
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
console.log('------------------------------------------------\n');
console.log('Starting up Node.  Here is the config : \n',Settings);
console.log('\n------------------------------------------------\n');

var http = require('http');
var server = http.createServer().listen(Settings.MessagePort, Settings.hostIP);
var io = require('socket.io').listen(server);
var cookie_reader = require('cookie');
var querystring = require('querystring');

var redis = require('socket.io/node_modules/redis');
var sub = redis.createClient(Settings.RedisPort);
sub.subscribe(0); 	//general function channel
var SOCKETS = {};

var crypto = require('crypto');
var hash = crypto.createHash('sha1');		//for unsigning chat sessionid's
if (Settings.development) var secretKey = '+fs7yhamybso)nl5g#cwpw-w$1n(@xm+cccq35rag-b#87%t+*';
else var secretKey = 'afd7yhamy4so)nd6ggcwp)-wrd~(@xm+rcc31jrag-k#87%t-#';
hash.update(secretKey);
const unsign_key = hash.digest();

function PARSE_SESSION(session) {
    var hmac = crypto.createHmac('sha1', unsign_key);
    var values = session.split(':');
    
    hmac.update(values[0]);
    
    if (values[1] == (hmac.digest('hex'))) {
	console.log('Valid user connected! id: ', values[0]);
	return values[0];
    }else{
	console.log('Warning: Invalid user connected! ');
	return false;
    }
}

//Configure socket.io to store cookies
io.configure(function(){
    io.set('authorization', function(data, accept){
        
	if (data.headers.cookie) {
            data.cookie = cookie_reader.parse(data.headers.cookie);
            return accept(null, true);
        }
        return accept('error',false);
    });
    io.set('log level',1);
});

io.sockets.on('connection', function(socket){

    try {
	var sessionid = PARSE_SESSION(socket.handshake.cookie.chatsession);
	socket.sessionid = sessionid;
	S.addSocket(sessionid, socket);
    } catch(e) {
	console.log('session validation fail: ',e);
    }
    
    /* subscribe redis (sub) and socket to chatroom (pk) */
    socket.rooms = [];
    
    socket.on('leave', function(data){
	console.log('user left room', data.pk);
        this.leave(data.pk);
    });
    
    socket.on('disconnect', function(data){
	S.removeSocket(this.sessionid);
        console.log('User disconnected.');
    });

    
}); // end io.sockets.on

//This is what sends data back to client
sub.on('message', publish);
function publish(channel, data){ 
    data = JSON.parse(data);
    //console.log('data', data);
    switch(data['TYPE']){
	
	case 'message':
	    S.message(channel, data);
	break;
    
	case 'subscribe':
	    S.subscribe(data)
	break;
    
	case 'ban':
	    S.ban(data);
	    S.globalUpdate(channel, data);
	break;
    
	case 'admin':
	    S.admin(data);
	    S.globalUpdate(channel, data);
	break;
    
	case 'private':
	    S.priv(data);
	break;
    
	case 'update':
	    S.globalUpdate(channel, data);
	break;
    
	case 'log':
	    console.log('LOG : ', data['log']);
	break;
    
	default:
	    console.log('None of cases were met.  sending message anyway.');
	    S.message(channel, data);
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
	var pk = data['pk'];
	var s = S.getSocket(data['sessionid'])
	if (s==undefined)return;
	if (s.rooms.indexOf(pk) != -1) return;  //don't bother if already subscribed
	for (i in this.rooms) {
	    s.leave(this.rooms[i])		//ensure only subscribed to one room
	    this.rooms.splice(i,1);		
	}
	sub.subscribe(pk); 	//subscribe redis to room
        s.join(pk);		//subscribe new user to room
	s.rooms.push(pk);	//add room id to user's socket for us to track
	
	console.log('room ' + pk + ' saved');
    },
    
    /* notifies socket of ban and removes him */
    ban: function(data) {
	var s = S.getSocket(data['sessionid']);
	if (s) {
	    console.log('BANNED!');
	    s.emit('ban',data);
	}
    },
    
    /* notifies socket of admin status and installs UI */
    admin: function(data) {
	var s = S.getSocket(data['sessionid']);
	if (s) {
	    console.log('ADMIN!');
	    s.emit('admin',data);
	}
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
