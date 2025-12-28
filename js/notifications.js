// نظام الإشعارات والإشعارات الفورية
class NotificationSystem {
    constructor() {
        this.notificationQueue = [];
        this.isPlayingSound = false;
        this.init();
    }
    
    init() {
        this.setupNotificationStyles();
        this.setupServiceWorker();
    }
    
    setupNotificationStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .notification-toast {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: white;
                border-radius: 10px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                padding: 1rem;
                min-width: 300px;
                max-width: 400px;
                z-index: 9999;
                animation: slideInRight 0.3s ease;
                border-right: 4px solid #667eea;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            @keyframes slideInRight {
                from {
                    opacity: 0;
                    transform: translateX(100%);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            .notification-toast.success {
                border-right-color: #4caf50;
            }
            
            .notification-toast.warning {
                border-right-color: #ff9800;
            }
            
            .notification-toast.error {
                border-right-color: #f44336;
            }
            
            .notification-toast.info {
                border-right-color: #2196f3;
            }
            
            .notification-icon {
                font-size: 1.5rem;
                flex-shrink: 0;
            }
            
            .notification-content {
                flex: 1;
            }
            
            .notification-title {
                font-weight: bold;
                margin-bottom: 0.3rem;
                color: #333;
            }
            
            .notification-message {
                font-size: 0.9rem;
                color: #666;
                line-height: 1.4;
            }
            
            .notification-close {
                background: none;
                border: none;
                font-size: 1.2rem;
                cursor: pointer;
                color: #999;
                padding: 0.5rem;
            }
            
            .notification-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: #667eea;
                animation: progressBar 5s linear;
            }
            
            @keyframes progressBar {
                from { width: 100%; }
                to { width: 0%; }
            }
            
            .notification-badge {
                position: absolute;
                top: -8px;
                right: -8px;
                background: #f44336;
                color: white;
                font-size: 0.7rem;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
            }
            
            .notification-dropdown {
                position: fixed;
                top: 60px;
                right: 20px;
                background: white;
                border-radius: 10px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                width: 350px;
                max-height: 500px;
                overflow-y: auto;
                z-index: 9998;
                display: none;
            }
            
            .notification-dropdown.active {
                display: block;
                animation: fadeInDown 0.3s ease;
            }
            
            @keyframes fadeInDown {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .dropdown-header {
                padding: 1rem;
                border-bottom: 1px solid #eee;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .dropdown-header h3 {
                margin: 0;
                color: #333;
            }
            
            .clear-all {
                background: none;
                border: none;
                color: #667eea;
                cursor: pointer;
                font-size: 0.9rem;
            }
            
            .notification-list {
                max-height: 400px;
                overflow-y: auto;
            }
            
            .notification-item {
                padding: 1rem;
                border-bottom: 1px solid #f0f0f0;
                cursor: pointer;
                transition: background 0.3s;
            }
            
            .notification-item:hover {
                background: #f9f9f9;
            }
            
            .notification-item.unread {
                background: #f0f7ff;
            }
            
            .notification-item-time {
                font-size: 0.8rem;
                color: #999;
                margin-top: 0.5rem;
            }
        `;
        document.head.appendChild(style);
    }
    
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(console.error);
        }
    }
    
    // إرسال إشعار للمستخدم
    sendUserNotification(title, message, type = 'info', duration = 5000) {
        const notification = {
            id: Date.now().toString(),
            title,
            message,
            type,
            timestamp: new Date().toISOString(),
            duration
        };
        
        this.showToastNotification(notification);
        return notification;
    }
    
    // إظهار الإشعار كرسالة عائمة
    showToastNotification(notification) {
        const toast = document.createElement('div');
        toast.className = `notification-toast ${notification.type}`;
        toast.id = `notification-${notification.id}`;
        
        const icon = this.getNotificationIcon(notification.type);
        
        toast.innerHTML = `
            <div class="notification-icon">${icon}</div>
            <div class="notification-content">
                <div class="notification-title">${notification.title}</div>
                <div class="notification-message">${notification.message}</div>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
            <div class="notification-progress"></div>
        `;
        
        document.body.appendChild(toast);
        
        // إزالة الإشعار بعد المدة المحددة
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 300);
            }
        }, notification.duration);
        
        // تشغيل الصوت
        this.playNotificationSound(notification.type);
        
        return toast;
    }
    
    getNotificationIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
            message: '📨',
            alert: '🔔'
        };
        return icons[type] || icons.info;
    }
    
    playNotificationSound(type = 'info') {
        if (this.isPlayingSound) return;
        
        this.isPlayingSound = true;
        
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // ترددات مختلفة لأنواع الإشعارات
            let frequency = 800;
            switch(type) {
                case 'success': frequency = 1000; break;
                case 'error': frequency = 600; break;
                case 'warning': frequency = 900; break;
                default: frequency = 800;
            }
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
            
            setTimeout(() => {
                this.isPlayingSound = false;
            }, 300);
            
        } catch (e) {
            this.isPlayingSound = false;
        }
    }
    
    // إرسال إشعار نظام للمدير
    sendSystemNotification(data) {
        const notification = {
            id: Date.now().toString(),
            type: 'system',
            data: data,
            timestamp: new Date().toISOString(),
            read: false,
            urgent: data.urgent || false
        };
        
        // حفظ في localStorage
        const notifications = JSON.parse(
            localStorage.getItem(`${CONFIG.STORAGE_PREFIX}system_notifications`) || '[]'
        );
        notifications.unshift(notification);
        
        // الاحتفاظ بآخر 50 إشعار فقط
        if (notifications.length > 50) {
            notifications.pop();
        }
        
        localStorage.setItem(
            `${CONFIG.STORAGE_PREFIX}system_notifications`,
            JSON.stringify(notifications)
        );
        
        // إعلام النوافذ الأخرى
        this.broadcastNotification(notification);
        
        return notification;
    }
    
    broadcastNotification(notification) {
        // استخدام BroadcastChannel إذا كان مدعوماً
        if (typeof BroadcastChannel !== 'undefined') {
            try {
                const channel = new BroadcastChannel('survey_notifications');
                channel.postMessage({
                    type: 'new_notification',
                    data: notification
                });
            } catch (e) {
                // استخدام localStorage كبديل
                localStorage.setItem(
                    `${CONFIG.STORAGE_PREFIX}notification_broadcast`,
                    JSON.stringify({
                        data: notification,
                        timestamp: Date.now()
                    })
                );
                
                setTimeout(() => {
                    localStorage.removeItem(`${CONFIG.STORAGE_PREFIX}notification_broadcast`);
                }, 1000);
            }
        } else {
            // استخدام localStorage
            localStorage.setItem(
                `${CONFIG.STORAGE_PREFIX}notification_broadcast`,
                JSON.stringify({
                    data: notification,
                    timestamp: Date.now()
                })
            );
            
            setTimeout(() => {
                localStorage.removeItem(`${CONFIG.STORAGE_PREFIX}notification_broadcast`);
            }, 1000);
        }
    }
    
    // إنشاء قائمة الإشعارات للمدير
    createNotificationDropdown() {
        const dropdown = document.createElement('div');
        dropdown.className = 'notification-dropdown';
        dropdown.id = 'notification-dropdown';
        
        // تحميل الإشعارات
        const notifications = this.getSystemNotifications();
        const unreadCount = notifications.filter(n => !n.read).length;
        
        dropdown.innerHTML = `
            <div class="dropdown-header">
                <h3>الإشعارات ${unreadCount > 0 ? `(${unreadCount})` : ''}</h3>
                ${unreadCount > 0 ? `<button class="clear-all" onclick="notificationSystem.markAllAsRead()">تحديد الكل كمقروء</button>` : ''}
            </div>
            <div class="notification-list">
                ${notifications.length > 0 ? 
                    notifications.map(n => this.createNotificationItem(n)).join('') :
                    '<div style="padding: 2rem; text-align: center; color: #999;">لا توجد إشعارات</div>'
                }
            </div>
        `;
        
        document.body.appendChild(dropdown);
        
        // إضافة مستمعي الأحداث لعناصر الإشعارات
        dropdown.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.handleNotificationClick(id);
            });
        });
        
        return dropdown;
    }
    
    createNotificationItem(notification) {
        const timeAgo = this.getTimeAgo(notification.timestamp);
        const icon = this.getNotificationIcon(notification.type);
        const readClass = notification.read ? '' : 'unread';
        
        let title = 'إشعار نظام';
        let message = 'لديك إشعار جديد';
        
        if (notification.data) {
            if (notification.data.participantId) {
                title = `مشارك جديد: ${notification.data.participantId}`;
            }
            if (notification.data.stage) {
                message = `تم إرسال بيانات المرحلة ${notification.data.stage}`;
            }
        }
        
        return `
            <div class="notification-item ${readClass}" data-id="${notification.id}">
                <div class="notification-icon-small">${icon}</div>
                <div>
                    <strong>${title}</strong>
                    <p>${message}</p>
                    <div class="notification-item-time">${timeAgo}</div>
                </div>
            </div>
        `;
    }
    
    getTimeAgo(timestamp) {
        const now = new Date();
        const past = new Date(timestamp);
        const diff = now - past;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'الآن';
        if (minutes < 60) return `قبل ${minutes} دقيقة`;
        if (hours < 24) return `قبل ${hours} ساعة`;
        if (days < 7) return `قبل ${days} يوم`;
        
        return past.toLocaleDateString('ar-SA');
    }
    
    getSystemNotifications() {
        try {
            const data = localStorage.getItem(`${CONFIG.STORAGE_PREFIX}system_notifications`);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }
    
    markAsRead(notificationId) {
        const notifications = this.getSystemNotifications();
        const notification = notifications.find(n => n.id === notificationId);
        
        if (notification && !notification.read) {
            notification.read = true;
            localStorage.setItem(
                `${CONFIG.STORAGE_PREFIX}system_notifications`,
                JSON.stringify(notifications)
            );
            
            // تحديث الواجهة
            this.updateNotificationBadge();
        }
    }
    
    markAllAsRead() {
        const notifications = this.getSystemNotifications();
        notifications.forEach(n => n.read = true);
        
        localStorage.setItem(
            `${CONFIG.STORAGE_PREFIX}system_notifications`,
            JSON.stringify(notifications)
        );
        
        this.updateNotificationBadge();
        this.refreshNotificationDropdown();
    }
    
    updateNotificationBadge() {
        const notifications = this.getSystemNotifications();
        const unreadCount = notifications.filter(n => !n.read).length;
        const badge = document.getElementById('notification-badge');
        
        if (badge) {
            const countSpan = badge.querySelector('.count');
            if (countSpan) {
                countSpan.textContent = unreadCount;
                countSpan.style.display = unreadCount > 0 ? 'flex' : 'none';
            }
        }
    }
    
    refreshNotificationDropdown() {
        const dropdown = document.getElementById('notification-dropdown');
        if (dropdown) {
            dropdown.remove();
            this.createNotificationDropdown();
        }
    }
    
    handleNotificationClick(notificationId) {
        this.markAsRead(notificationId);
        
        const notifications = this.getSystemNotifications();
        const notification = notifications.find(n => n.id === notificationId);
        
        if (notification && notification.data) {
            // عرض تفاصيل الإشعار
            this.showNotificationDetails(notification);
        }
    }
    
    showNotificationDetails(notification) {
        // يمكن توسيع هذه الوظيفة حسب الحاجة
        console.log('تفاصيل الإشعار:', notification);
        
        // إخفاء القائمة المنسدلة
        const dropdown = document.getElementById('notification-dropdown');
        if (dropdown) {
            dropdown.classList.remove('active');
        }
    }
    
    // تسجيل حدث في النظام
    logEvent(eventType, eventData) {
        const log = {
            id: Date.now().toString(),
            type: eventType,
            data: eventData,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        };
        
        // حفظ في السجلات
        const logs = JSON.parse(
            localStorage.getItem(`${CONFIG.STORAGE_PREFIX}event_logs`) || '[]'
        );
        logs.unshift(log);
        
        // الاحتفاظ بآخر 1000 سجل
        if (logs.length > 1000) {
            logs.pop();
        }
        
        localStorage.setItem(
            `${CONFIG.STORAGE_PREFIX}event_logs`,
            JSON.stringify(logs)
        );
        
        return log;
    }
}

// تصدير نظام الإشعارات
window.NotificationSystem = new NotificationSystem();