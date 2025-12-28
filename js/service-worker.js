/**
 * Service Worker للموقع التقدمي (PWA)
 */

const CACHE_NAME = 'financial-survey-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/admin.html',
  '/privacy-policy.html',
  '/css/style.css',
  '/css/admin.css',
  '/js/main.js',
  '/js/tracker.js',
  '/js/telegram.js',
  '/js/admin.js',
  '/js/utils.js',
  '/assets/logo.png',
  '/manifest.json'
];

// التثبيت
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 جاري تخزين الملفات في الكاش');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// التنشيط
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ جاري حذف الكاش القديم:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// جلب الطلبات
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        
        return fetch(event.request).then(response => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      }).catch(() => {
        // في حالة عدم الاتصال، عرض صفحة أوفلاين
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      })
  );
});

// معالجة رسائل الـ Push
self.addEventListener('push', event => {
  const options = {
    body: event.data.text(),
    icon: '/assets/logo.png',
    badge: '/assets/logo.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2'
    },
    actions: [
      {
        action: 'explore',
        title: 'استكشاف',
        icon: '/assets/logo.png'
      },
      {
        action: 'close',
        title: 'إغلاق',
        icon: '/assets/logo.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('الاستبيان المالي', options)
  );
});

// معالجة نقرات الإشعارات
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});