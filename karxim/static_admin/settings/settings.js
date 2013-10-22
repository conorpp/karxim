/*
    Settings file for both node.js and client.
    
    So no need to keep deployment versions of any JS file except this one.
*/

var Settings = {
    /* Deployment Sensitive */
    host:'http://localhost:8000',
    simplehost:'http://localhost',
    hostIP:'127.0.0.1',
    MessagePort:4000,
    RedisPort: 6379,
    
    /* Universal */
    createMap:true
};

try{
    module.exports = Settings;      
}catch(e){}
