# Virtual Queue Management System

Mobile Web App to virtual queue management.

### Features
  - Automatic Queue Management
  - Chrome Web notifications
  - Websocket based instant updates

### Raspberry PI code
  This is server repo. For client(IOT), please visit [Git Repo][site]

It is complete JavaScript solution. Starting from bluetooth and GSM operations in raspberry pi, JavaScript is used in nodejs and even for database integration.

> The goal of Virtual Queue Management solution is the hassle free airport experience for the traveler.
> It also helps Airport authority to easily handle big crowd in security gates.

### Version
0.0.1

### Tech

VQMS uses a number of open source projects to work properly:

* [service worker] - enable local notification
* [Websockets] - 2 way communication between client and server
* [Twitter Bootstrap] - great UI boilerplate for modern web apps
* [node.js] - evented I/O for the backend
* [Express] - fast node.js network app framework [@tjholowaychuk]
* [GCM] - Google Cloud Messaging for Chrome
* [Firebase] - Database as a Service from Google

And of course Virtual Queue Management System itself is open source on GitHub.

License
----

MIT



   [site]: <https://github.com/winster/vqms_iot.git>
   [bootstrap]: <http://getbootstrap.com/>
   [service worker]: <https://www.w3.org/TR/service-workers/>
   [Websockets]: <https://html.spec.whatwg.org/multipage/comms.html#network>
   [node.js]: <http://nodejs.org>
   [Twitter Bootstrap]: <http://twitter.github.com/bootstrap/>
   [express]: <http://expressjs.com>
   [GCM]: <https://developers.google.com/cloud-messaging/>
   [Firebase]: <https://www.firebase.com/>
