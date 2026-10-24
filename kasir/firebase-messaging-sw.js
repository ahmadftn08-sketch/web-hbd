// Keep this handler before importing Firebase Messaging so FCM does not replace it.
self.addEventListener("notificationclick", event => {
    event.notification.close();
    const targetUrl = new URL(event.notification.data?.url || "./index.html", self.location.href).href;
    event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(clientList => {
        for (const client of clientList) {
            if ("focus" in client) {
                client.navigate(targetUrl);
                return client.focus();
            }
        }
        return self.clients.openWindow(targetUrl);
    }));
});

importScripts("https://www.gstatic.com/firebasejs/13.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/13.0.0/firebase-messaging-compat.js");

firebase.initializeApp({
    apiKey: "AIzaSyBmpfHRnn53JeedUa5mb_6eQHNgTKirfqo",
    authDomain: "kasir-arsyla-v2.firebaseapp.com",
    projectId: "kasir-arsyla-v2",
    storageBucket: "kasir-arsyla-v2.firebasestorage.app",
    messagingSenderId: "91708664773",
    appId: "1:91708664773:web:1d8f1c123dfd1f5d1279ac",
    measurementId: "G-L76Q7CDGZS",
    databaseURL: "https://kasir-arsyla-v2-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const messaging = firebase.messaging();
messaging.onBackgroundMessage(payload => {
    const data = payload.data || {};
    const title = data.title || "Kedai Arsyla";
    const options = {
        body: data.body || "Ada pembaruan pesanan.",
        icon: "./logo2.svg",
        badge: "./logo2.svg",
        tag: data.tag || `kasir-${Date.now()}`,
        data: { url: "./index.html" },
        requireInteraction: data.type === "crowd"
    };
    return self.registration.showNotification(title, options);
});
