var isPushEnabled = false;

// Once the service worker is registered set the initial state  
function initialiseState() {  
  // Are Notifications supported in the service worker?  
  if (!('showNotification' in ServiceWorkerRegistration.prototype)) {  
    console.warn('Notifications aren\'t supported.');  
    return;  
  }

  // Check the current Notification permission.  
  // If its denied, it's a permanent block until the  
  // user changes the permission  
  if (Notification.permission === 'denied') {  
    console.warn('The user has blocked notifications.');  
    return;  
  }

  // Check if push messaging is supported  
  if (!('PushManager' in window)) {  
    console.warn('Push messaging isn\'t supported.');  
    return;  
  }

  
  // We need the service worker registration to check for a subscription  
  navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {  
    // Do we already have a push message subscription?  
    serviceWorkerRegistration.pushManager.getSubscription()  
      .then(function(subscription) {  
        // Enable any UI which subscribes / unsubscribes from  
        // push messages.  
        var pushButton = document.querySelector('.js-push-button');  
        pushButton.disabled = false;

        if (!subscription) {  
          // We aren't subscribed to push, so set UI  
          // to allow the user to enable push  
          return;  
        }

        // Keep your server in sync with the latest subscriptionId
        sendSubscriptionToServer(subscription);

        // Set your UI to show they have subscribed for  
        // push messages  
        pushButton.textContent = 'Unsubscribe';  
        isPushEnabled = true;  
      })  
      .catch(function(err) {  
        console.warn('Error during getSubscription()', err);  
      });  
  });  
}

window.addEventListener('load', function() {  
  var pushButton = document.querySelector('.js-push-button');  
  var resetButton = document.querySelector('.reset-button');  
  pushButton.addEventListener('click', function() {  
    if (isPushEnabled) {  
      unsubscribe();  
    } else {  
      subscribe();  
    }  
  });
  resetButton.addEventListener('click', function() {  
    unsubscribe();
  });

  // Check that service workers are supported, if so, progressively  
  // enhance and add push messaging support, otherwise continue without it.  
  if ('serviceWorker' in navigator) {  
    navigator.serviceWorker.register('/service-worker.js')  
    .then(initialiseState);  
  } else {  
    console.warn('Service workers aren\'t supported in this browser.');  
  }  

  var host = location.origin.replace(/^http/, 'ws')
  var ws = new WebSocket(host);
  ws.onmessage = function (event) {
    var result = JSON.parse(event.data);
    console.log(result)
    if(result.pass) {
      var queueStorage = localStorage.getItem('queue');
      if(queueStorage) {
        queueStorage = JSON.parse(queueStorage);
        document.querySelector('#queuerank').textContent=queueStorage.token - result.pass;
        document.querySelector('#queuetime').textContent=(queueStorage.token - result.pass) *result.time;
      }
      if(queueStorage.token-result.pass<=0) {
        showWelcome();
      }
      if((queueStorage.token - result.pass)<3)
        hidePromo();
      else
        showPromo();
    }
    if(result.promo) {
      for(var key in result.promo){
        if(result.promo.hasOwnProperty(key)){
          var promo = result.promo[key];
          var parentul= document.querySelector('.swiper-wrapper');
          var source   = document.querySelector("#entry-template").innerHTML;
          var template = Handlebars.compile(source);
          var html    = template(promo);
          parentul.innerHTML += html;
          document.querySelector('.promos').classList.remove('hidden');
          var mySwiper = new Swiper ('.swiper-container', {
              // Optional parameters
              direction: 'horizontal',
              loop: true,
              
              // If we need pagination
              pagination: '.swiper-pagination',
              
              // Navigation arrows
              nextButton: '.swiper-button-next',
              prevButton: '.swiper-button-prev',
              
              // And if we need scrollbar
              scrollbar: '.swiper-scrollbar',
            });   
        }
      }
    }
  };
  if(getQueryVariable('rank')<3)
    hidePromo();
});

function getQueryVariable(variable) {
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
    if (pair[0] == variable) {
      return pair[1];
    }
  } 
}

function subscribe() {  
  // Disable the button so it can't be changed while  
  // we process the permission request  
  var pushButton = document.querySelector('.js-push-button');  
  pushButton.disabled = true;

  var data = {};
  data.lname=document.querySelector("#lname").value;
  data.recloc=document.querySelector("#recloc").value;
  localStorage.setItem("regInput", JSON.stringify(data));

  navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {  
    serviceWorkerRegistration.pushManager.subscribe({userVisibleOnly:true})  
      .then(function(subscription) {  
        // The subscription was successful  
        isPushEnabled = true;  
        pushButton.textContent = 'Unsubscribe';  
        pushButton.disabled = false;

        // TODO: Send the subscription.endpoint to your server  
        // and save it to send a push message at a later date
        return sendSubscriptionToServer(subscription);  
      })  
      .catch(function(e) {  
        if (Notification.permission === 'denied') {  
          // The user denied the notification permission which  
          // means we failed to subscribe and the user will need  
          // to manually change the notification permission to  
          // subscribe to push messages  
          console.warn('Permission for Notifications was denied');  
          pushButton.disabled = true;  
        } else {  
          // A problem occurred with the subscription; common reasons  
          // include network errors, and lacking gcm_sender_id and/or  
          // gcm_user_visible_only in the manifest.  
          console.error('Unable to subscribe to push.', e);  
          pushButton.disabled = false;  
          pushButton.textContent = 'Register';  
        }  
      });  
  });  
}

function unsubscribe() {  
  var pushButton = document.querySelector('.js-push-button');  
  pushButton.disabled = true;

  navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {  
    // To unsubscribe from push messaging, you need get the  
    // subscription object, which you can call unsubscribe() on.  
    serviceWorkerRegistration.pushManager.getSubscription().then(  
      function(pushSubscription) {  
        // Check we have a subscription to unsubscribe  
        if (!pushSubscription) {  
          // No subscription object, so set the state  
          // to allow the user to subscribe to push  
          isPushEnabled = false;  
          pushButton.disabled = false;  
          pushButton.textContent = 'Register';  
          return;  
        }  

        var subscriptionId = pushSubscription.subscriptionId;  
        // TODO: Make a request to your server to remove  
        // the subscriptionId from your data store so you
        // don't attempt to send them push messages anymore

        // We have a subscription, so call unsubscribe on it  
        pushSubscription.unsubscribe().then(function(successful) {  
          pushButton.disabled = false;  
          pushButton.textContent = 'Register';  
          isPushEnabled = false;  

          return sendUnsubscriptionToServer(pushSubscription);  

        }).catch(function(e) {  
          // We failed to unsubscribe, this can lead to  
          // an unusual state, so may be best to remove
          // the users data from your data store and
          // inform the user that you have done so

          console.log('Unsubscription error: ', e);  
          pushButton.disabled = false;
          pushButton.textContent = 'Register';
        });  
      }).catch(function(e) {  
        console.error('Error thrown while unsubscribing from push messaging.', e);  
      });  
  });  
}

function sendSubscriptionToServer(subscription){
  console.log(subscription);
  var regInput = localStorage.getItem("regInput");
  var regInput = regInput ?JSON.parse(regInput) :{};
  regInput.endpoint = subscription.endpoint;
  httprequest("/register", JSON.stringify(regInput), true);
  var titleTpl = document.querySelector('.title').innerHTML;
  document.querySelector('.title').innerHTML = titleTpl.replace('#lname', regInput.lname);
}

function sendUnsubscriptionToServer(subscription){
  console.log(subscription);
  var regInput = localStorage.getItem("regInput");
  var regInput = regInput ?JSON.parse(regInput) :{};
  regInput.endpoint = subscription.endpoint;
  httprequest("/unregister", JSON.stringify(regInput), false);
}

function httprequest(url, params, showqueue){
  var http = new XMLHttpRequest();
  http.open("POST", url, true);

  //Send the proper header information along with the request
  http.setRequestHeader("Content-Type", "application/json");
  //http.setRequestHeader("Content-length", params.length);
  //http.setRequestHeader("Connection", "close");

  http.onreadystatechange = function() {//Call a function when the state changes.
      if(http.readyState == 4 && http.status == 200) {
          //alert(http.responseText);
          var resultjson = JSON.parse(http.responseText);
          if(showqueue) {
            var queue = resultjson.result;
            localStorage.setItem('queue', JSON.stringify(queue));
            document.querySelector('#queuetoken').textContent=queue.token;
            document.querySelector('#queuerank').textContent=queue.token-queue.pass;
            document.querySelector('#queuetime').textContent=(queue.token-queue.pass) * queue.time;
            if(queue.token-queue.pass<=0) {
              showWelcome();
            } else 
              showQueue();
          } else{
            showRegister();
          }
      }
  }
  http.send(params);
}

function showQueue(){
  document.querySelector('.register').classList.add('hidden');
  document.querySelector('.queue').classList.remove('hidden');                
  document.querySelector('.title').classList.remove('hidden');
  document.querySelector('.reset-button').classList.remove('hidden');   
  document.querySelector('.welcome').classList.add('hidden');    
}

function showRegister(){
  document.querySelector('.register').classList.remove('hidden');
  document.querySelector('.queue').classList.add('hidden'); 
  document.querySelector('.promo').classList.add('hidden'); 
  document.querySelector('.title').classList.add('hidden');   
  document.querySelector('.reset-button').classList.add('hidden');   
  document.querySelector('.welcome').classList.add('hidden');    
}

function showWelcome(){
  document.querySelector('.register').classList.add('hidden');
  document.querySelector('.queue').classList.add('hidden');                
  document.querySelector('.title').classList.add('hidden');
  document.querySelector('.reset-button').classList.remove('hidden');    
  document.querySelector('.welcome').classList.remove('hidden');    
}

function hidePromo() {        
  document.querySelector('.promo').classList.add('hidden');     
}

function showPromo() {        
  document.querySelector('.promo').classList.remove('hidden');     
}
     