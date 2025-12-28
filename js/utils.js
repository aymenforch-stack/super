/**
 * ملف الدوال المساعدة العامة
 */

class Utils {
    constructor() {
        this.init();
    }
    
    init() {
        console.log('🛠️ أدوات المساعدة جاهزة');
    }
    
    // ====== دوال التنسيق ======
    
    formatDate(date, format = 'ar-EG') {
        if (!date) return '';
        
        const d = new Date(date);
        
        if (isNaN(d.getTime())) return '';
        
        return d.toLocaleDateString(format, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
    }
    
    formatTime(date, format = 'ar-EG') {
        if (!date) return '';
        
        const d = new Date(date);
        
        if (isNaN(d.getTime())) return '';
        
        return d.toLocaleTimeString(format, {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
    
    formatDateTime(date, format = 'ar-EG') {
        return `${this.formatDate(date, format)} ${this.formatTime(date, format)}`;
    }
    
    formatCurrency(amount, currency = 'DZD') {
        return new Intl.NumberFormat('ar-EG', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }
    
    formatNumber(number) {
        return new Intl.NumberFormat('ar-EG').format(number);
    }
    
    formatPhoneNumber(phone) {
        if (!phone) return '';
        
        const cleaned = phone.replace(/\D/g, '');
        
        if (cleaned.length === 10) {
            return cleaned.replace(/(\d{2})(\d{3})(\d{2})(\d{3})/, '$1 $2 $3 $4');
        }
        
        return phone;
    }
    
    formatCardNumber(cardNumber) {
        if (!cardNumber) return '';
        
        const cleaned = cardNumber.replace(/\D/g, '');
        
        if (cleaned.length === 16) {
            return cleaned.replace(/(\d{4})/g, '$1 ').trim();
        }
        
        return cardNumber;
    }
    
    // ====== دوال التحقق ======
    
    isValidPhone(phone) {
        if (!phone) return false;
        
        const cleaned = phone.replace(/\D/g, '');
        const regex = /^(05|06|07)[0-9]{8}$/;
        
        return regex.test(cleaned);
    }
    
    isValidCardNumber(cardNumber) {
        if (!cardNumber) return false;
        
        const cleaned = cardNumber.replace(/\D/g, '');
        
        if (cleaned.length !== 16) return false;
        
        // Luhn Algorithm
        let sum = 0;
        let shouldDouble = false;
        
        for (let i = cleaned.length - 1; i >= 0; i--) {
            let digit = parseInt(cleaned.charAt(i));
            
            if (shouldDouble) {
                if ((digit *= 2) > 9) digit -= 9;
            }
            
            sum += digit;
            shouldDouble = !shouldDouble;
        }
        
        return (sum % 10) === 0;
    }
    
    isValidExpiryDate(expiry) {
        if (!expiry) return false;
        
        const regex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
        const match = expiry.match(regex);
        
        if (!match) return false;
        
        const month = parseInt(match[1]);
        const year = parseInt('20' + match[2]);
        
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;
        
        if (year < currentYear || (year === currentYear && month < currentMonth)) {
            return false;
        }
        
        return true;
    }
    
    isValidCVV(cvv) {
        if (!cvv) return false;
        return /^\d{3}$/.test(cvv);
    }
    
    isValidEmail(email) {
        if (!email) return false;
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }
    
    // ====== دوال التخزين ======
    
    saveToStorage(key, data) {
        try {
            const dataToSave = typeof data === 'object' ? JSON.stringify(data) : data;
            localStorage.setItem(key, dataToSave);
            return true;
        } catch (error) {
            console.error('❌ خطأ في حفظ البيانات:', error);
            return false;
        }
    }
    
    loadFromStorage(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            
            if (!data) return defaultValue;
            
            try {
                return JSON.parse(data);
            } catch {
                return data;
            }
        } catch (error) {
            console.error('❌ خطأ في تحميل البيانات:', error);
            return defaultValue;
        }
    }
    
    removeFromStorage(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('❌ خطأ في حذف البيانات:', error);
            return false;
        }
    }
    
    clearStorage() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('❌ خطأ في مسح التخزين:', error);
            return false;
        }
    }
    
    getStorageInfo() {
        try {
            let totalSize = 0;
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                totalSize += key.length + value.length;
            }
            
            return {
                totalItems: localStorage.length,
                totalSize: this.formatBytes(totalSize),
                maxSize: '5MB',
                usagePercentage: ((totalSize / (5 * 1024 * 1024)) * 100).toFixed(2) + '%'
            };
        } catch (error) {
            console.error('❌ خطأ في حساب معلومات التخزين:', error);
            return null;
        }
    }
    
    // ====== دوال الملفات ======
    
    downloadFile(filename, content, type = 'text/plain') {
        try {
            const blob = new Blob([content], { type: type });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            return true;
        } catch (error) {
            console.error('❌ خطأ في تحميل الملف:', error);
            return false;
        }
    }
    
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                resolve(e.target.result);
            };
            
            reader.onerror = (e) => {
                reject(e.target.error);
            };
            
            reader.readAsText(file);
        });
    }
    
    // ====== دوال الشبكة ======
    
    async checkInternetConnection() {
        try {
            const response = await fetch('https://www.google.com', { mode: 'no-cors' });
            return true;
        } catch {
            return false;
        }
    }
    
    async getIPAddress() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            console.error('❌ خطأ في الحصول على عنوان IP:', error);
            return 'غير معروف';
        }
    }
    
    async getLocationInfo(ip = '') {
        try {
            const url = ip ? 
                `http://ip-api.com/json/${ip}?fields=country,regionName,city,isp` :
                'http://ip-api.com/json/?fields=country,regionName,city,isp';
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.status === 'success') {
                return {
                    country: data.country,
                    region: data.regionName,
                    city: data.city,
                    isp: data.isp
                };
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('❌ خطأ في الحصول على معلومات الموقع:', error);
            return {
                country: 'غير معروف',
                region: 'غير معروف',
                city: 'غير معروف',
                isp: 'غير معروف'
            };
        }
    }
    
    // ====== دوال الوقت ======
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    countdownTimer(endTime, callback) {
        const timer = setInterval(() => {
            const now = new Date().getTime();
            const distance = endTime - now;
            
            if (distance < 0) {
                clearInterval(timer);
                callback(0, 0, 0, 0);
                return;
            }
            
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            
            callback(days, hours, minutes, seconds);
        }, 1000);
        
        return timer;
    }
    
    // ====== دوال التشفير الأساسية ======
    
    encodeBase64(text) {
        return btoa(unescape(encodeURIComponent(text)));
    }
    
    decodeBase64(base64) {
        return decodeURIComponent(escape(atob(base64)));
    }
    
    // ====== دوال المصفوفات والكائنات ======
    
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
    
    mergeObjects(target, source) {
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!target[key] || typeof target[key] !== 'object') {
                    target[key] = {};
                }
                this.mergeObjects(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
        return target;
    }
    
    filterObject(obj, predicate) {
        return Object.fromEntries(
            Object.entries(obj).filter(([key, value]) => predicate(key, value))
        );
    }
    
    // ====== دوال DOM ======
    
    createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        
        // إضافة الخصائص
        for (const [key, value] of Object.entries(attributes)) {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'textContent') {
                element.textContent = value;
            } else if (key === 'innerHTML') {
                element.innerHTML = value;
            } else if (key.startsWith('on')) {
                element.addEventListener(key.substring(2).toLowerCase(), value);
            } else {
                element.setAttribute(key, value);
            }
        }
        
        // إضافة العناصر الفرعية
        if (Array.isArray(children)) {
            children.forEach(child => {
                if (child instanceof Node) {
                    element.appendChild(child);
                } else if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                }
            });
        }
        
        return element;
    }
    
    removeElement(element) {
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    }
    
    toggleClass(element, className) {
        if (element) {
            element.classList.toggle(className);
        }
    }
    
    // ====== دوال العشوائية ======
    
    randomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    randomString(length = 10) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        return result;
    }
    
    randomItem(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    
    shuffleArray(array) {
        const shuffled = [...array];
        
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        return shuffled;
    }
    
    // ====== دوال المساعدة ======
    
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
    
    truncateText(text, maxLength = 100) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
    
    slugify(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\u0621-\u064A\u0660-\u0669]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    
    // ====== دوال التحقق من المتصفح ======
    
    getBrowserInfo() {
        const ua = navigator.userAgent;
        let browser = 'غير معروف';
        let version = 'غير معروف';
        
        // Chrome
        if (ua.includes('Chrome') && !ua.includes('Edg')) {
            browser = 'Chrome';
            version = ua.match(/Chrome\/([\d.]+)/)?.[1] || 'غير معروف';
        }
        // Firefox
        else if (ua.includes('Firefox')) {
            browser = 'Firefox';
            version = ua.match(/Firefox\/([\d.]+)/)?.[1] || 'غير معروف';
        }
        // Safari
        else if (ua.includes('Safari') && !ua.includes('Chrome')) {
            browser = 'Safari';
            version = ua.match(/Version\/([\d.]+)/)?.[1] || 'غير معروف';
        }
        // Edge
        else if (ua.includes('Edg')) {
            browser = 'Edge';
            version = ua.match(/Edg\/([\d.]+)/)?.[1] || 'غير معروف';
        }
        // IE
        else if (ua.includes('MSIE') || ua.includes('Trident/')) {
            browser = 'Internet Explorer';
            version = ua.match(/(MSIE |rv:)([\d.]+)/)?.[2] || 'غير معروف';
        }
        
        return { browser, version };
    }
    
    getOSInfo() {
        const ua = navigator.userAgent;
        let os = 'غير معروف';
        let version = 'غير معروف';
        
        // Windows
        if (ua.includes('Windows')) {
            os = 'Windows';
            version = ua.match(/Windows NT ([\d.]+)/)?.[1] || 'غير معروف';
        }
        // macOS
        else if (ua.includes('Mac OS')) {
            os = 'macOS';
            version = ua.match(/Mac OS X ([\d_.]+)/)?.[1].replace(/_/g, '.') || 'غير معروف';
        }
        // Android
        else if (ua.includes('Android')) {
            os = 'Android';
            version = ua.match(/Android ([\d.]+)/)?.[1] || 'غير معروف';
        }
        // iOS
        else if (ua.includes('iPhone') || ua.includes('iPad')) {
            os = 'iOS';
            version = ua.match(/OS ([\d_.]+) like Mac OS X/)?.[1].replace(/_/g, '.') || 'غير معروف';
        }
        // Linux
        else if (ua.includes('Linux')) {
            os = 'Linux';
        }
        
        return { os, version };
    }
    
    getDeviceInfo() {
        const ua = navigator.userAgent;
        let device = 'حاسوب';
        
        if (ua.includes('Mobile')) {
            device = 'هاتف';
        } else if (ua.includes('Tablet')) {
            device = 'جهاز لوحي';
        }
        
        return {
            device,
            isMobile: /Mobile|Android|iPhone|iPad|iPod/i.test(ua),
            isTablet: /Tablet|iPad/i.test(ua),
            isDesktop: !/Mobile|Android|iPhone|iPad|iPod|Tablet/i.test(ua)
        };
    }
    
    // ====== دوال الإحصائيات ======
    
    calculateAverage(numbers) {
        if (!numbers.length) return 0;
        const sum = numbers.reduce((a, b) => a + b, 0);
        return sum / numbers.length;
    }
    
    calculatePercentage(part, total) {
        if (total === 0) return 0;
        return (part / total) * 100;
    }
    
    // ====== دوال الأنيميشن ======
    
    animateValue(element, start, end, duration) {
        if (!element) return;
        
        const startTime = performance.now();
        const range = end - start;
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const value = start + range * progress;
            element.textContent = Math.floor(value).toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        
        requestAnimationFrame(update);
    }
    
    fadeIn(element, duration = 300) {
        if (!element) return;
        
        element.style.opacity = 0;
        element.style.display = 'block';
        
        let opacity = 0;
        const interval = 10;
        const increment = interval / duration;
        
        const timer = setInterval(() => {
            opacity += increment;
            element.style.opacity = opacity;
            
            if (opacity >= 1) {
                clearInterval(timer);
            }
        }, interval);
    }
    
    fadeOut(element, duration = 300) {
        if (!element) return;
        
        let opacity = 1;
        const interval = 10;
        const decrement = interval / duration;
        
        const timer = setInterval(() => {
            opacity -= decrement;
            element.style.opacity = opacity;
            
            if (opacity <= 0) {
                clearInterval(timer);
                element.style.display = 'none';
            }
        }, interval);
    }
    
    // ====== دوال التسجيل ======
    
    log(type, message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            type,
            message,
            data,
            timestamp,
            url: window.location.href,
            userAgent: navigator.userAgent
        };
        
        // تسجيل في وحدة التحكم
        const consoleMethod = {
            info: 'log',
            warn: 'warn',
            error: 'error',
            debug: 'debug'
        }[type] || 'log';
        
        console[consoleMethod](`[${type.toUpperCase()}] ${message}`, data || '');
        
        // حفظ في التخزين المحلي
        try {
            const logs = this.loadFromStorage('app_logs', []);
            logs.push(logEntry);
            
            // حفظ فقط آخر 1000 سجل
            if (logs.length > 1000) {
                logs.shift();
            }
            
            this.saveToStorage('app_logs', logs);
        } catch (error) {
            console.error('❌ خطأ في حفظ السجل:', error);
        }
    }
    
    // ====== دوال التصدير ======
    
    exportLogs() {
        try {
            const logs = this.loadFromStorage('app_logs', []);
            const data = {
                logs,
                exportedAt: new Date().toISOString(),
                totalLogs: logs.length
            };
            
            this.downloadFile(
                `logs_${Date.now()}.json`,
                JSON.stringify(data, null, 2),
                'application/json'
            );
            
            return true;
        } catch (error) {
            console.error('❌ خطأ في تصدير السجلات:', error);
            return false;
        }
    }
    
    // ====== دوال النظام ======
    
    getSystemInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            languages: navigator.languages,
            screen: {
                width: screen.width,
                height: screen.height,
                availWidth: screen.availWidth,
                availHeight: screen.availHeight,
                colorDepth: screen.colorDepth,
                pixelRatio: window.devicePixelRatio
            },
            window: {
                innerWidth: window.innerWidth,
                innerHeight: window.innerHeight,
                outerWidth: window.outerWidth,
                outerHeight: window.outerHeight
            },
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            cookiesEnabled: navigator.cookieEnabled,
            online: navigator.onLine,
            memory: navigator.deviceMemory,
            concurrency: navigator.hardwareConcurrency,
            touchPoints: navigator.maxTouchPoints || 0
        };
    }
}

// تهيئة الأداة
let utils = null;

document.addEventListener('DOMContentLoaded', () => {
    utils = new Utils();
    window.UTILS = utils;
    
    console.log('✅ أدوات المساعدة جاهزة للاستخدام!');
});

// تصدير الدوال للاستخدام المباشر
window.Utils = {
    formatDate: (date, format) => utils?.formatDate(date, format) || '',
    formatCurrency: (amount, currency) => utils?.formatCurrency(amount, currency) || '',
    isValidPhone: (phone) => utils?.isValidPhone(phone) || false,
    isValidCardNumber: (cardNumber) => utils?.isValidCardNumber(cardNumber) || false,
    saveToStorage: (key, data) => utils?.saveToStorage(key, data) || false,
    loadFromStorage: (key, defaultValue) => utils?.loadFromStorage(key, defaultValue),
    downloadFile: (filename, content, type) => utils?.downloadFile(filename, content, type) || false,
    delay: (ms) => utils?.delay(ms) || Promise.resolve(),
    getBrowserInfo: () => utils?.getBrowserInfo() || {},
    getOSInfo: () => utils?.getOSInfo() || {},
    getDeviceInfo: () => utils?.getDeviceInfo() || {},
    animateValue: (element, start, end, duration) => utils?.animateValue(element, start, end, duration),
    log: (type, message, data) => utils?.log(type, message, data)
};

console.log('✅ utils.js تم التحميل بنجاح!');