/*
    Settings file for both node.js and client.
    
    So no need to keep deployment versions of any JS file except this one.
*/

var Settings = {
    
    /* Deployment Sensitive */
    development:true,
    host:'http://karxim.com:8000',
    nakedHost:'karxim.com:8000',
    simpleHost:'http://54.84.252.234',
    hostIP:'54.84.252.234',
    MessagePort:4000,
    secretKey:'',           //do not share with anyone.  Must be same one in settings.py
    
    /* Universal */
    createMap:true
};

try{
    module.exports = Settings;                  //node function  
}catch(e){}
