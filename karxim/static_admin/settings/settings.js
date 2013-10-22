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
    secretKey:'+fs7yhamybso)nl5g#cwpw-w$1n(@xm+cccq35rag-b#87%t+*',           //do not share with anyone.  Must be same one in settings.py
    
    /* Universal */
    createMap:true
};

try{
    module.exports = Settings;                  //node function  
}catch(e){}
