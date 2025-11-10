importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging.js');

firebase.initializeApp({
  apiKey: 'AIzaSyC7okV3xate-uZ66xJbgTnLLbvMCW3mgrM',
  projectId: 'calender-64b1f',
  messagingSenderId: '247920601279',
  appId: '1:247920601279:web:a388b69bc73e486fc83e0a',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: '/favicon.ico',
  });
});
