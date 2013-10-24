
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
sub.subscribe('logs'); 
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
	socket.sessionid = PARSE_SESSION(socket.handshake.cookie.chatsession);
    } catch(e) {
	console.log('session validation fail: ',e);
    }
    
    /* subscribe redis (sub) and socket to chatroom (pk) */
    socket.rooms = [];
    socket.on('joinChat', function(data){
        try{
            var pk = data['pk'];
        }catch(e){
            console.log('join chat failed: ', e); return;
        }
	if (socket.rooms.indexOf(pk) != -1) return;  //don't bother if already subscribed
	
	for (i in this.rooms) {
	    socket.leave(this.rooms[i])		//ensure only subscribed to one room
	    this.rooms.splice(i,1);		
	}
	sub.subscribe(pk); 	//subscribe redis to room
        socket.join(pk);	//subscribe new user to room
	socket.rooms.push(pk);	//add room id to user's socket for us to track
	
	console.log('room ' + pk + ' saved');
    });
    
    socket.on('leave', function(data){
	console.log('user left room', data.pk);
        this.leave(data.pk);
    });
    
    socket.on('disconnect', function(data){
        console.log('User disconnected.');
    });

    
}); // end io.sockets.on

//This is what sends data back to client
sub.on('message', publish);
function publish(channel, data){ 
    data = JSON.parse(data);
    //console.log('data', data);
    switch(data['TYPE']){
	
	case 'update':
	    GLOBAL_UPDATE(channel, data);
	break;
	
	case 'message':
	    SEND_MESSAGE(channel, data);
	break;
    
	case 'ban':
	    BAN(channel, data);
	    GLOBAL_UPDATE(channel, data);
	break;
    
	case 'admin':
	    ADMIN(channel, data);
	    GLOBAL_UPDATE(channel, data);
	break;
    
	case 'private':
	    PRIVATE(channel, data);
	break;
    
	case 'log':
	    console.log('LOG : ', data['log']);
	break;
    
	default:
	    console.log('None of cases were met.  sending message anyway.');
	    SEND_MESSAGE(channel, data);
    }

        
}
/* actions for sending data to connected clients. */

function SEND_MESSAGE(channel, data){
    console.log('sending message through channel', channel);
    io.sockets.in(channel).emit('getMessage', data);
}

//not implemented yet
function GLOBAL_UPDATE(channel, data){
    console.log('GLOBAL update through channel', channel);
    io.sockets.in(channel).emit('update', data);
}

function BAN(channel, data) {
    var sockets = io.sockets.clients(channel);
    for (s in sockets) {
	if (sockets[s].sessionid == data['sessionid']) {
	    console.log('BANNED!');
	    sockets[s].leave(channel);
	    sockets[s].emit('ban',data);
	}
    }
}
function ADMIN(channel, data) {
    var sockets = io.sockets.clients(channel);
    for (s in sockets) {
	if (sockets[s].sessionid == data['sessionid']) {
	    console.log('ADMIN!');
	    sockets[s].emit('admin',data);
	}
    }
}
function PRIVATE(channel, data) {
    var sockets = io.sockets.clients(channel);
    for (s in sockets) {
	if (sockets[s].sessionid == data['sessionid']) {
	    console.log('PRIVATE!');
	    sockets[s].emit('private',data);
	}
    }
}
/* NOT USED
function CLIENT_UPDATE(channel, data){
    for (var id in data['update']['users']) {
	console.log('USER '+data['update']['users'][id]+' update "' +data['update']['message']+ '" through channel', channel);
	try{
	    var socket = SOCKETS['socket'+data['update']['users'][id]];
	    socket.emit('update', data);
	}catch(e){
	    console.log('FAILED sending client update : ', e);
	}
    }
}*/
/*function SUBSCRIBE_USER(channel, data){
    //subscribe the recipient if not already
    try {
	if (! 'socket'+data['recipientId'] in SOCKETS) return;
	
        var socket = SOCKETS['socket'+data['recipientId']];
	
	if (socket.rooms.indexOf(channel) != -1) return;	//recipient already subscribed
	
        socket.emit('createChat', data);
	socket.rooms.push(channel);
	socket.join(channel);
	
	console.log('recipient ' + data['recipientId'] + ' added to channel '+channel);
    } catch(e) {
        console.log('FAILED subscribing recipient: ', e);
    }
}*/