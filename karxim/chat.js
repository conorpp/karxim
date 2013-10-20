
//dependents for websockets with python:
//$ sudo apt-get install redis-server
//$ sudo pip install redis
//$ sudo apt-get install python-software-properties 
//$ sudo add-apt-repository ppa:chris-lea/node.js
//$ sudo apt-get update
//$ sudo apt-get install nodejs
//$ npm install socket.io
//$ npm install cookie 

var http = require('http');
var server = http.createServer().listen(4000);
var io = require('socket.io').listen(server);
var cookie_reader = require('cookie');
var querystring = require('querystring');

var redis = require('socket.io/node_modules/redis');
var sub = redis.createClient();
var SOCKETS = {};

//Configure socket.io to store cookie set by Django
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
    
    /* keep running array of connected sockets NOT USED
    socket.on('setId', function(data){
        console.log('USER ID : ', data['userId']);
        this.userId = data['userId'];
        SOCKETS['socket'+data['userId']] = this;
    });*/
    
    /* subscribe redis (sub) and socket to chatroom (Cpk) */
    socket.rooms = [];
    socket.on('joinChat', function(data){
        try{
            var pk = data['pk'];
        }catch(e){
            console.log('join chat failed: ', e); return;
        }
	if (socket.rooms.indexOf(pk) != -1) return;
	for (i in this.rooms) {
	    socket.leave(this.rooms[i])
	}
	sub.subscribe(pk); 
        socket.join(pk);
	socket.rooms.push(pk);
	
	console.log('room ' + pk + ' saved');
    });
    
    socket.on('disconnect', function(data){
        console.log('User disconnected.');
    });

    
}); // end io.sockets.on

//This is what sends data back to client
sub.on('message', publish);
function publish(channel, data){ 
    data = JSON.parse(data);
    
    switch(data['TYPE']){
	
	case 'update':
	    if (data['update']['status'] == 'GLOBAL') {
		GLOBAL_UPDATE(channel, data);
	    }else{
		//CLIENT_UPDATE(channel, data);
	    }
	break;
	
	case 'message':
	    SEND_MESSAGE(channel, data);
	break;
    
	default:
	    console.log('None of cases were met.  sending message anyway.');
	    SEND_MESSAGE(channel, data);
    }

        
}
/* actions for sending data to connected clients. */
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

function SEND_MESSAGE(channel, data){
    console.log('sending "' +data['message']+ '" through channel', channel);
    io.sockets.in(channel).emit('getMessage', data);
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

function GLOBAL_UPDATE(channel, data){
    console.log('GLOBAL update "' +data['update']['message']+ '" through channel', channel);
    io.sockets.in(channel).emit('update', data);
}