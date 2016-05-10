
self.addEventListener('push', function(event) {
  var title = "Time to move";  
  var body = 'Virtual Management System';  
  var icon = 'img/queue-logo.png'; 
  var tag = 'queue-tag';
  var data = {
    position: 10
  };
  event.waitUntil(  
    self.registration.showNotification(title, {  
      body: body,
      icon: icon,
      tag: tag,
      data: data
    })  
  );  
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  var position = event.notification.data.position;
  console.log(position);

  event.waitUntil(clients.matchAll({
    type: "window"
  }).then(function(clientList) {
    for (var i = 0; i < clientList.length; i++) {
      var client = clientList[i];
      if (client.url == '/' && 'focus' in client)
        return client.focus();
    }
    if (clients.openWindow)      
      var url = '/index.html?rank=2';    
      return clients.openWindow(url);
  }));
});