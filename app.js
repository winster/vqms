var WebSocketServer = require("ws").Server;
var gcm = require('node-gcm');
var express = require('express');
var http = require('http');
var https = require('https');
var bodyParser = require('body-parser');
var Firebase = require("firebase");
var app = express();
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));
var Q = require("q");
var soap = require('soap');

var port = process.env.PORT || 5000;
var gcmKey = 'AIzaSyCEEkwC2sW4SZfl2cjPfaJS3Cl5hvsYNew';
// Set up the sender with you API key
var sender = new gcm.Sender(gcmKey);

var ref = new Firebase('https://travelhackearth.firebaseio.com/');
var profilesRef = ref.child("profiles");
var queueRef = ref.child("queue/");
var passRef = ref.child("queue/passCount");
var regRef = ref.child("queue/regCount");
var promoRef = ref.child("promo/");

var firstTime = true;
passRef.on('value', function(snapshot){
  var passCount = snapshot.val();
  console.log('firstTime::'+firstTime);
  if(firstTime) {
    firstTime=false;
    return;
  }
  profilesRef.orderByChild("token").startAt(passCount).endAt(passCount+3).on("value", function(snapshot) {
    var regids = [];
    snapshot.forEach(function(data) {
      console.log(data.key() + " :: " + data.val());
      var profile = data.val();
      regids.push(profile.regId);  
    });
    var message = new gcm.Message();
    message.addData('data', passCount);
    sendnotifs(message, regids); 
  });
});
regRef.on('value', function(snapshot){
  console.log('reg count listener');
});
app.get('/', function(request, response) {
  response.render('public/index.html');
});

app.post('/register', function(request, response) {
  var result={};
  var req = request.body;
  console.log(req);
  if(!req.name) {
    response.send({'result':'invalid input'});
    return;
  }
  var endpointParts=req.endpoint.split('/');
  var registrationId = endpointParts[endpointParts.length - 1];  
  req.regId = registrationId;
  var profileRef = profilesRef.child(req.recloc);

  broadcastAds();

  queueRef.once('value', function(snapshot){
    var queue = snapshot.val();
    profileRef.once('value', function(snapshot){
      var profile = snapshot.val();
      if(!profile) {
        queue.regCount += 1;
        req.token = queue.regCount;
        profileRef.set(req);
        queueRef.set(queue);
        result.token = queue.regCount;
        result.pass = queue.passCount;
        result.time = queue.avgTime;
        response.send({'result':result});
      } else{
        result.token = profile.token; 
        result.pass = queue.passCount;
        result.time = queue.avgTime;
        response.send({'result':result});
      }
    });
  });
});

app.post('/unregister', function(request, response) {
  var req = request.body;
  console.log(req);
  var endpointParts=req.endpoint.split('/');
  var registrationId = endpointParts[endpointParts.length - 1];  
  req.regId = registrationId;  
  queueRef.once('value', function(snapshot){
    var queue = snapshot.val();
    queue.passCount += 1;
    queueRef.set(queue);        
  });
  profilesRef.once('value', function(snapshot){
    var profiles = snapshot.val();
    delete profiles[req.recloc];
    profilesRef.set(profiles);
  });  
  response.send({'result':'success'});
});

app.post('/notify', function(request, response) {
  var message = new gcm.Message();
  message.addData('key1', 'msg1');
  sendnotifs(message);
});

app.post('/initqueue', function(request, response) {
  var req = request.body;
  queueRef.once('value', function(snapshot){
    var queue = snapshot.val();
    queue.passCount = req.passCount;
    queue.regCount = req.regCount;
    queue.avgTime = req.avgTime;
    queueRef.set(queue);        
    response.send('updated');
    broadcast(queue);
  });
});

app.post('/exit', function(request, response) {
  queueRef.once('value', function(snapshot){
    var queue = snapshot.val();
    queue.passCount += 1;
    queueRef.set(queue);     
    broadcast(queue);
  });  
  response.send('updated');
  console.log('queue updated');
});

app.get('/token', function(request, response) {
  getQueueData()
  .then(function(count){
    response.send(''+count);
  });
});

var getQueueData = function(){
  var q = Q.defer();
  queueRef.once('value', function(snapshot){
    var queue = snapshot.val();
    q.resolve(queue.passCount);  
  });
  return q.promise;
};

/*app.listen(port, function() {
  console.log('Node app is running on port', port);
});*/
var server = http.createServer(app)
server.listen(port)
console.log("http server listening on %d", port)

var wss = new WebSocketServer({server: server})
console.log("websocket server created")
var websocket;
wss.on("connection", function(ws) {
  websocket = ws;
  var result = {'status':'connected'}
  ws.send(JSON.stringify(result), function() {  })
  console.log("websocket connection open");
  ws.on("close", function() {
    console.log("websocket connection close");    
  });
})

var sendnotifs = function(message, regids){
  sender.send(message, { registrationTokens: regids }, function (err, res) {
    if(err) 
      console.error(err);
    else    
      console.log(res);
    console.log('notifications sent to '+regids);
  });    
}

var broadcast=function(queue){
  debugger;
  var data = {pass:queue.passCount, time:queue.avgTime};
  if(websocket)
  websocket.send(JSON.stringify(data), function() {});
}

var broadcastAds = function(){
  debugger;
  promoRef.once('value', function(snapshot){
    var promos = snapshot.val();
    var result = {promo: promos};
    if(websocket)
    websocket.send(JSON.stringify(result), function() {  });
  });  
}