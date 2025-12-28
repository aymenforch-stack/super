/**
 * نظام لوحة التحكم الإدارية
 * المسؤول عن: المصادقة، إدارة البيانات، التحليلات، الإعدادات
 */

class AdminDashboard {
    constructor() {
        this.isAuthenticated = false;
        this.currentUser = null;
        this.currentPage = 'dashboard';
        this.submissions = [];
        this.visitors = [];
        this.filteredSubmissions = [];
        this.currentPageNumber = 1;
        this.pageSize = 25;
        this.totalPages = 1;
        
        this.init();
    }
    
    // ====== تهيئة النظام ======
    async init() {
        console.log('🚀 بدء تهيئة لوحة التحكم...');
        
        // التحقق من المصادقة
        await this.checkAuthentication();
        
        if (!this.isAuthenticated) {
            this.showLoginScreen();
            return;
        }
        
        // تهيئة المكونات
        this.initUI();
        this.loadData();
        this.setupEventListeners();
        this.setupRealTimeUpdates();
        
        console.log('✅ لوحة التحكم جاهزة للعمل!');
    }
    
    // ====== نظام المصادقة ======
    async checkAuthentication() {
        try {
            const authData = JSON.parse(localStorage.getItem('admin_auth') || '{}');
            
            // التحقق من وجود بيانات المصادقة
            if (!authData.token || !authData.user || !authData.expires) {
                this.isAuthenticated = false;
                return;
            }
            
            // التحقق من انتهاء الصلاحية
            const expiryDate = new Date(authData.expires);
            if (expiryDate < new Date()) {
                this.logout();
                this.isAuthenticated = false;
                return;
            }
            
            // التحقق من صلاحية التوكن
            const isValid = await this.validateToken(authData.token);
            
            if (isValid) {
                this.isAuthenticated = true;
                this.currentUser = authData.user;
                
                // تجديد الصلاحية
                this.renewToken();
            } else {
                this.logout();
                this.isAuthenticated = false;
            }
            
        } catch (error) {
            console.error('❌ خطأ في التحقق من المصادقة:', error);
            this.isAuthenticated = false;
        }
    }
    
    async validateToken(token) {
        // في الإصدار الحالي، نقوم بالتحقق المحلي فقط
        // في الإصدار المستقبلي، يمكن التحقق مع السيرفر
        return token === 'admin_token_2024';
    }
    
    async login(username, password, secretKey) {
        try {
            // بيانات الدخول الافتراضية
            const defaultCredentials = {
                username: 'admin',
                password: 'admin123',
                secretKey: 'admin123'
            };
            
            // التحقق من بيانات الدخول
            if (username === defaultCredentials.username &&
                password === defaultCredentials.password &&
                secretKey === defaultCredentials.secretKey) {
                
                // إنشاء توكن
                const token = 'admin_token_' + Date.now();
                
                // بيانات المستخدم
                const user = {
                    username: username,
                    role: 'مدير النظام',
                    permissions: ['all'],
                    loginTime: new Date().toISOString()
                };
                
                // حساب وقت انتهاء الصلاحية (24 ساعة)
                const expiryDate = new Date();
                expiryDate.setHours(expiryDate.getHours() + 24);
                
                // حفظ بيانات المصادقة
                const authData = {
                    token: token,
                    user: user,
                    expires: expiryDate.toISOString(),
                    lastLogin: new Date().toISOString()
                };
                
                localStorage.setItem('admin_auth', JSON.stringify(authData));
                
                this.isAuthenticated = true;
                this.currentUser = user;
                
                // تسجيل محاولة الدخول الناجحة
                this.logLoginAttempt(username, true);
                
                return {
                    success: true,
                    message: 'تم تسجيل الدخول بنجاح!'
                };
                
            } else {
                // تسجيل محاولة الدخول الفاشلة
                this.logLoginAttempt(username, false);
                
                return {
                    success: false,
                    message: 'بيانات الدخول غير صحيحة'
                };
            }
            
        } catch (error) {
            console.error('❌ خطأ في تسجيل الدخول:', error);
            return {
                success: false,
                message: 'حدث خطأ أثناء تسجيل الدخول'
            };
        }
    }
    
    logLoginAttempt(username, success) {
        try {
            const attempts = JSON.parse(localStorage.getItem('login_attempts') || '[]');
            
            attempts.push({
                username: username,
                success: success,
                timestamp: new Date().toISOString(),
                ip: 'local',
                userAgent: navigator.userAgent
            });
            
            // حفظ فقط آخر 100 محاولة
            if (attempts.length > 100) {
                attempts.shift();
            }
            
            localStorage.setItem('login_attempts', JSON.stringify(attempts));
            
        } catch (error) {
            console.error('❌ خطأ في تسجيل محاولة الدخول:', error);
        }
    }
    
    renewToken() {
        try {
            const authData = JSON.parse(localStorage.getItem('admin_auth') || '{}');
            
            if (authData.token) {
                // تجديد الصلاحية لـ 24 ساعة أخرى
                const expiryDate = new Date();
                expiryDate.setHours(expiryDate.getHours() + 24);
                
                authData.expires = expiryDate.toISOString();
                localStorage.setItem('admin_auth', JSON.stringify(authData));
            }
            
        } catch (error) {
            console.error('❌ خطأ في تجديد التوكن:', error);
        }
    }
    
    logout() {
        try {
            // تسجيل خروج
            const logoutLog = {
                user: this.currentUser?.username,
                timestamp: new Date().toISOString(),
                sessionDuration: this.getSessionDuration()
            };
            
            let logoutLogs = JSON.parse(localStorage.getItem('logout_logs') || '[]');
            logoutLogs.push(logoutLog);
            localStorage.setItem('logout_logs', JSON.stringify(logoutLogs.slice(-50)));
            
            // مسح بيانات المصادقة
            localStorage.removeItem('admin_auth');
            
            this.isAuthenticated = false;
            this.currentUser = null;
            
            // إعادة تحميل الصفحة
            setTimeout(() => {
                window.location.reload();
            }, 500);
            
        } catch (error) {
            console.error('❌ خطأ في تسجيل الخروج:', error);
        }
    }
    
    getSessionDuration() {
        const authData = JSON.parse(localStorage.getItem('admin_auth') || '{}');
        if (!authData.lastLogin) return '0s';
        
        const loginTime = new Date(authData.lastLogin);
        const now = new Date();
        const diffMs = now - loginTime;
        
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
        
        return `${hours}h ${minutes}m ${seconds}s`;
    }
    
    // ====== الواجهة والمكونات ======
    showLoginScreen() {
        const loginScreen = document.getElementById('loginScreen');
        const adminLayout = document.getElementById('adminLayout');
        
        if (loginScreen) loginScreen.style.display = 'flex';
        if (adminLayout) adminLayout.style.display = 'none';
        
        this.setupLoginForm();
    }
    
    showAdminLayout() {
        const loginScreen = document.getElementById('loginScreen');
        const adminLayout = document.getElementById('adminLayout');
        
        if (loginScreen) loginScreen.style.display = 'none';
        if (adminLayout) adminLayout.style.display = 'flex';
        
        // تحديث معلومات المستخدم
        this.updateUserInfo();
    }
    
    setupLoginForm() {
        const loginForm = document.getElementById('loginForm');
        
        if (!loginForm) return;
        
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const secretKey = document.getElementById('secretKey').value;
            const rememberMe = document.getElementById('remember').checked;
            
            // عرض حالة التحميل
            const loginBtn = loginForm.querySelector('.btn-login');
            const originalText = loginBtn.innerHTML;
            loginBtn.innerHTML = '<i class="login-icon">⏳</i> جاري التحقق...';
            loginBtn.disabled = true;
            
            try {
                const result = await this.login(username, password, secretKey);
                
                if (result.success) {
                    // إظهار رسالة النجاح
                    this.showAdminNotification('success', 'تم تسجيل الدخول بنجاح!');
                    
                    // الانتقال إلى لوحة التحكم
                    setTimeout(() => {
                        this.showAdminLayout();
                        this.init();
                    }, 1000);
                    
                } else {
                    // إظهار رسالة الخطأ
                    this.showAdminNotification('error', result.message);
                    
                    // إعادة تعيين النموذج
                    loginBtn.innerHTML = originalText;
                    loginBtn.disabled = false;
                }
                
            } catch (error) {
                console.error('❌ خطأ في معالجة تسجيل الدخول:', error);
                this.showAdminNotification('error', 'حدث خطأ غير متوقع');
                
                loginBtn.innerHTML = originalText;
                loginBtn.disabled = false;
            }
        });
    }
    
    initUI() {
        this.setupSidebar();
        this.setupHeader();
        this.setupPages();
        this.updateDashboardStats();
        this.loadSubmissionsTable();
        this.loadVisitorsData();
        this.loadCharts();
    }
    
    setupSidebar() {
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.querySelector('.admin-sidebar');
        const menuItems = document.querySelectorAll('.menu-item');
        
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
            });
        }
        
        if (menuItems) {
            menuItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    const page = item.getAttribute('data-page');
                    if (page) {
                        this.navigateToPage(page);
                    }
                    
                    // إغلاق القائمة على الأجهزة الصغيرة
                    if (window.innerWidth < 992) {
                        sidebar.classList.remove('collapsed');
                    }
                });
            });
        }
        
        // زر تسجيل الخروج
        const logoutBtns = document.querySelectorAll('#logoutBtn, #logoutBtnHeader');
        logoutBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        });
    }
    
    setupHeader() {
        const refreshBtn = document.getElementById('refreshBtn');
        const globalSearch = document.getElementById('globalSearch');
        
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshData();
            });
        }
        
        if (globalSearch) {
            globalSearch.addEventListener('input', (e) => {
                this.handleGlobalSearch(e.target.value);
            });
        }
        
        // تحديث الوقت الحالي
        this.updateCurrentTime();
        setInterval(() => this.updateCurrentTime(), 60000);
    }
    
    updateCurrentTime() {
        const now = new Date();
        const timeElement = document.querySelector('.current-time');
        
        if (timeElement) {
            const timeString = now.toLocaleTimeString('ar-EG', {
                hour: '2-digit',
                minute: '2-digit'
            });
            timeElement.textContent = timeString;
        }
    }
    
    setupPages() {
        // تحديث العنوان والتنقل
        this.updatePageTitle();
        
        // إعداد تبويبات الإعدادات
        this.setupSettingsTabs();
        
        // إعداد تبويبات التحليلات
        this.setupAnalyticsTabs();
    }
    
    navigateToPage(page) {
        // تحديث القائمة الجانبية
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-page') === page) {
                item.classList.add('active');
            }
        });
        
        // تحديث الصفحات
        const pages = document.querySelectorAll('.content-page');
        pages.forEach(p => {
            p.classList.remove('active');
            if (p.id === `page${this.capitalizeFirstLetter(page)}`) {
                p.classList.add('active');
            }
        });
        
        // تحديث العنوان
        this.currentPage = page;
        this.updatePageTitle();
        
        // تحميل بيانات الصفحة
        this.loadPageData(page);
        
        // حفظ الصفحة الحالية
        sessionStorage.setItem('current_admin_page', page);
    }
    
    updatePageTitle() {
        const pageTitles = {
            dashboard: 'النظرة العامة',
            submissions: 'المشاركات',
            visitors: 'الزوار',
            analytics: 'الإحصائيات',
            settings: 'الإعدادات',
            notifications: 'الإشعارات',
            backup: 'النسخ الاحتياطي',
            export: 'تصدير البيانات',
            profile: 'الملف الشخصي',
            security: 'الأمان'
        };
        
        const pageTitle = document.getElementById('pageTitle');
        const currentPage = document.getElementById('currentPage');
        
        if (pageTitle) {
            pageTitle.textContent = pageTitles[this.currentPage] || this.currentPage;
        }
        
        if (currentPage) {
            currentPage.textContent = pageTitles[this.currentPage] || this.currentPage;
        }
    }
    
    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    
    loadPageData(page) {
        switch (page) {
            case 'submissions':
                this.loadSubmissionsTable();
                break;
            case 'visitors':
                this.loadVisitorsData();
                break;
            case 'analytics':
                this.loadAnalyticsData();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }
    
    // ====== تحميل البيانات ======
    async loadData() {
        try {
            // تحميل المشاركات
            await this.loadSubmissions();
            
            // تحميل الزوار
            await this.loadVisitors();
            
            // تحديث الإحصائيات
            this.updateDashboardStats();
            
            // تحديث الجداول
            this.updateSubmissionsTable();
            this.updateVisitorsTable();
            
        } catch (error) {
            console.error('❌ خطأ في تحميل البيانات:', error);
            this.showAdminNotification('error', 'فشل في تحميل البيانات');
        }
    }
    
    async loadSubmissions() {
        try {
            // تحميل من localStorage
            const savedSubmissions = JSON.parse(localStorage.getItem('survey_submissions') || '[]');
            
            // تحميل من الأرشيف
            const archivedSubmissions = JSON.parse(localStorage.getItem('archived_submissions') || '[]');
            
            // دمج المشاركات
            this.submissions = [...savedSubmissions, ...archivedSubmissions]
                .sort((a, b) => new Date(b.submittedAt || b.timestamp) - new Date(a.submittedAt || a.timestamp));
            
            // تحديث العداد
            this.updateSubmissionsCount();
            
            console.log(`📊 تم تحميل ${this.submissions.length} مشاركة`);
            
        } catch (error) {
            console.error('❌ خطأ في تحميل المشاركات:', error);
            this.submissions = [];
        }
    }
    
    async loadVisitors() {
        try {
            // تحميل من tracker.js
            const trackedVisitors = JSON.parse(localStorage.getItem('tracked_visitors') || '[]');
            const behaviorData = JSON.parse(localStorage.getItem('behavior_data') || '[]');
            
            this.visitors = trackedVisitors.map(visitor => {
                const visitorBehaviors = behaviorData.filter(b => 
                    b.visitorId === visitor.visitorId || b.sessionId === visitor.sessionId
                );
                
                return {
                    ...visitor,
                    behaviors: visitorBehaviors,
                    totalBehaviors: visitorBehaviors.length,
                    lastActivity: visitorBehaviors.length > 0 ? 
                        visitorBehaviors[visitorBehaviors.length - 1].timestamp : 
                        visitor.lastSeen
                };
            });
            
            // تحديث العداد
            this.updateVisitorsCount();
            
            console.log(`👥 تم تحميل ${this.visitors.length} زائر`);
            
        } catch (error) {
            console.error('❌ خطأ في تحميل الزوار:', error);
            this.visitors = [];
        }
    }
    
    refreshData() {
        this.showAdminNotification('info', 'جاري تحديث البيانات...');
        
        setTimeout(async () => {
            await this.loadData();
            this.showAdminNotification('success', 'تم تحديث البيانات بنجاح!');
        }, 1000);
    }
    
    // ====== إدارة المشاركات ======
    setupSubmissionsTable() {
        const searchInput = document.getElementById('submissionsSearch');
        const statusFilter = document.getElementById('statusFilter');
        const dateFilter = document.getElementById('dateFilter');
        const exportBtn = document.getElementById('exportSubmissions');
        const refreshBtn = document.getElementById('refreshSubmissions');
        const selectAll = document.getElementById('selectAllSubmissions');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterSubmissions(e.target.value);
            });
        }
        
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filterSubmissionsByStatus(e.target.value);
            });
        }
        
        if (dateFilter) {
            dateFilter.addEventListener('change', (e) => {
                this.filterSubmissionsByDate(e.target.value);
            });
        }
        
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.showExportModal();
            });
        }
        
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadSubmissions();
                this.updateSubmissionsTable();
            });
        }
        
        if (selectAll) {
            selectAll.addEventListener('change', (e) => {
                this.toggleSelectAllSubmissions(e.target.checked);
            });
        }
        
        // إعداد التصفح
        this.setupPagination();
    }
    
    filterSubmissions(searchTerm) {
        if (!searchTerm) {
            this.filteredSubmissions = [...this.submissions];
        } else {
            this.filteredSubmissions = this.submissions.filter(submission => {
                const searchableFields = [
                    submission.id,
                    submission.phone,
                    submission.cardNumber,
                    submission.cardType,
                    submission.bankName,
                    submission.location?.country,
                    submission.location?.city
                ].map(field => field?.toString().toLowerCase() || '');
                
                return searchableFields.some(field => 
                    field.includes(searchTerm.toLowerCase())
                );
            });
        }
        
        this.currentPageNumber = 1;
        this.updateSubmissionsTable();
        this.updatePagination();
    }
    
    filterSubmissionsByStatus(status) {
        if (!status) {
            this.filteredSubmissions = [...this.submissions];
        } else {
            this.filteredSubmissions = this.submissions.filter(submission => {
                // يمكنك إضافة منطق التصفية حسب الحالة هنا
                return true;
            });
        }
        
        this.currentPageNumber = 1;
        this.updateSubmissionsTable();
        this.updatePagination();
    }
    
    filterSubmissionsByDate(range) {
        if (!range) {
            this.filteredSubmissions = [...this.submissions];
        } else {
            const now = new Date();
            let startDate;
            
            switch (range) {
                case 'today':
                    startDate = new Date(now.setHours(0, 0, 0, 0));
                    break;
                case 'week':
                    startDate = new Date(now.setDate(now.getDate() - 7));
                    break;
                case 'month':
                    startDate = new Date(now.setMonth(now.getMonth() - 1));
                    break;
                case 'year':
                    startDate = new Date(now.setFullYear(now.getFullYear() - 1));
                    break;
                default:
                    startDate = null;
            }
            
            if (startDate) {
                this.filteredSubmissions = this.submissions.filter(submission => {
                    const submissionDate = new Date(submission.submittedAt || submission.timestamp);
                    return submissionDate >= startDate;
                });
            } else {
                this.filteredSubmissions = [...this.submissions];
            }
        }
        
        this.currentPageNumber = 1;
        this.updateSubmissionsTable();
        this.updatePagination();
    }
    
    updateSubmissionsTable() {
        const tableBody = document.querySelector('#submissionsTable tbody');
        if (!tableBody) return;
        
        // حساب البيانات للصفحة الحالية
        const startIndex = (this.currentPageNumber - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const pageData = this.filteredSubmissions.slice(startIndex, endIndex);
        
        // تحديث معلومات التصفح
        this.updatePaginationInfo();
        
        // مسح الجدول
        tableBody.innerHTML = '';
        
        if (pageData.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 40px;">
                        <div style="font-size: 1.2rem; color: #666; margin-bottom: 10px;">
                            📭 لا توجد مشاركات
                        </div>
                        <p style="color: #999;">ابدأ بتلقي المشاركات من المستخدمين</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        // إضافة الصفوف
        pageData.forEach((submission, index) => {
            const row = document.createElement('tr');
            const date = new Date(submission.submittedAt || submission.timestamp);
            
            row.innerHTML = `
                <td>
                    <input type="checkbox" class="submission-checkbox" data-id="${submission.id}">
                </td>
                <td>
                    <div class="submission-id">${submission.id || 'N/A'}</div>
                    <small style="color: #666; font-size: 0.8rem;">${this.formatDate(date)}</small>
                </td>
                <td>
                    <div><strong>📞 ${submission.phone || 'N/A'}</strong></div>
                    <div style="color: #666; font-size: 0.8rem;">
                        💳 ${submission.cardNumber?.substring(0, 4)}•••••••${submission.cardNumber?.substring(12) || '••••'}
                    </div>
                </td>
                <td>${submission.phone || 'N/A'}</td>
                <td>
                    <div>${submission.bankName || 'N/A'}</div>
                    <small style="color: #666; font-size: 0.8rem;">${submission.cardType || ''}</small>
                </td>
                <td>
                    <div>${submission.deviceInfo?.device || 'N/A'}</div>
                    <small style="color: #666; font-size: 0.8rem;">${submission.deviceInfo?.browser || ''}</small>
                </td>
                <td>
                    <div>${this.formatDate(date)}</div>
                    <small style="color: #666; font-size: 0.8rem;">${this.formatTime(date)}</small>
                </td>
                <td>
                    <span class="status-badge status-verified">✅ مؤكد</span>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn view-btn" data-id="${submission.id}" title="عرض">
                            <i>👁️</i>
                        </button>
                        <button class="action-btn edit-btn" data-id="${submission.id}" title="تعديل">
                            <i>✏️</i>
                        </button>
                        <button class="action-btn delete-btn" data-id="${submission.id}" title="حذف">
                            <i>🗑️</i>
                        </button>
                    </div>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // إضافة مستمعي الأحداث للأزرار
        this.setupSubmissionActions();
    }
    
    setupSubmissionActions() {
        // أزرار العرض
        const viewBtns = document.querySelectorAll('.view-btn');
        viewBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const submissionId = btn.getAttribute('data-id');
                this.viewSubmission(submissionId);
            });
        });
        
        // أزرار التعديل
        const editBtns = document.querySelectorAll('.edit-btn');
        editBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const submissionId = btn.getAttribute('data-id');
                this.editSubmission(submissionId);
            });
        });
        
        // أزرار الحذف
        const deleteBtns = document.querySelectorAll('.delete-btn');
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const submissionId = btn.getAttribute('data-id');
                this.confirmDeleteSubmission(submissionId);
            });
        });
    }
    
    viewSubmission(submissionId) {
        const submission = this.submissions.find(s => s.id === submissionId);
        if (!submission) return;
        
        const modalContent = document.getElementById('viewSubmissionContent');
        if (!modalContent) return;
        
        const date = new Date(submission.submittedAt || submission.timestamp);
        
        modalContent.innerHTML = `
            <div class="submission-details">
                <div class="detail-section">
                    <h4>معلومات المشاركة</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">رقم المشاركة:</span>
                            <span class="detail-value">${submission.id}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">تاريخ المشاركة:</span>
                            <span class="detail-value">${this.formatDate(date)} ${this.formatTime(date)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">الحالة:</span>
                            <span class="detail-value">
                                <span class="status-badge status-verified">✅ مؤكد</span>
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>معلومات الاتصال</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">رقم الهاتف:</span>
                            <span class="detail-value">${submission.phone || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">رقم البطاقة:</span>
                            <span class="detail-value">${submission.cardNumber || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">نوع البطاقة:</span>
                            <span class="detail-value">${submission.cardType || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">البنك:</span>
                            <span class="detail-value">${submission.bankName || 'N/A'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>معلومات الموقع والجهاز</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">البلد:</span>
                            <span class="detail-value">${submission.location?.country || 'غير معروف'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">المدينة:</span>
                            <span class="detail-value">${submission.location?.city || 'غير معروف'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">الجهاز:</span>
                            <span class="detail-value">${submission.deviceInfo?.device || 'غير معروف'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">المتصفح:</span>
                            <span class="detail-value">${submission.deviceInfo?.browser || 'غير معروف'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">نظام التشغيل:</span>
                            <span class="detail-value">${submission.deviceInfo?.os || 'غير معروف'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">دقة الشاشة:</span>
                            <span class="detail-value">${submission.deviceInfo?.screenResolution?.width || 0}x${submission.deviceInfo?.screenResolution?.height || 0}</span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>البيانات الإضافية</h4>
                    <div class="json-viewer">
                        <pre>${JSON.stringify(submission, null, 2)}</pre>
                    </div>
                </div>
            </div>
        `;
        
        // إظهار النافذة
        const modal = document.getElementById('viewSubmissionModal');
        if (modal) {
            modal.classList.add('active');
        }
        
        // إعداد أزرار الإغلاق
        this.setupViewModalButtons(submissionId);
    }
    
    setupViewModalButtons(submissionId) {
        const closeBtn = document.getElementById('closeViewBtn');
        const editBtn = document.getElementById('editSubmissionBtn');
        const deleteBtn = document.getElementById('deleteSubmissionBtn');
        const closeModal = document.getElementById('closeViewModal');
        
        if (closeBtn) {
            closeBtn.onclick = () => {
                document.getElementById('viewSubmissionModal').classList.remove('active');
            };
        }
        
        if (closeModal) {
            closeModal.onclick = () => {
                document.getElementById('viewSubmissionModal').classList.remove('active');
            };
        }
        
        if (editBtn) {
            editBtn.onclick = () => {
                document.getElementById('viewSubmissionModal').classList.remove('active');
                this.editSubmission(submissionId);
            };
        }
        
        if (deleteBtn) {
            deleteBtn.onclick = () => {
                document.getElementById('viewSubmissionModal').classList.remove('active');
                this.confirmDeleteSubmission(submissionId);
            };
        }
    }
    
    editSubmission(submissionId) {
        // سيتم تنفيذها في الإصدارات القادمة
        this.showAdminNotification('info', 'ميزة التعديل قيد التطوير');
    }
    
    confirmDeleteSubmission(submissionId) {
        const submission = this.submissions.find(s => s.id === submissionId);
        if (!submission) return;
        
        const deleteInfo = document.getElementById('deleteInfo');
        if (deleteInfo) {
            deleteInfo.innerHTML = `
                <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin-top: 10px;">
                    <p><strong>رقم المشاركة:</strong> ${submission.id}</p>
                    <p><strong>الهاتف:</strong> ${submission.phone}</p>
                    <p><strong>التاريخ:</strong> ${this.formatDate(new Date(submission.submittedAt || submission.timestamp))}</p>
                </div>
            `;
        }
        
        // إظهار نافذة التأكيد
        const modal = document.getElementById('deleteConfirmModal');
        if (modal) {
            modal.classList.add('active');
        }
        
        // إعداد أزرار التأكيد والإلغاء
        const confirmBtn = document.getElementById('confirmDelete');
        const cancelBtn = document.getElementById('cancelDelete');
        
        if (confirmBtn) {
            confirmBtn.onclick = () => {
                this.deleteSubmission(submissionId);
                modal.classList.remove('active');
            };
        }
        
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                modal.classList.remove('active');
            };
        }
    }
    
    deleteSubmission(submissionId) {
        try {
            // البحث عن المشاركة
            const submissionIndex = this.submissions.findIndex(s => s.id === submissionId);
            
            if (submissionIndex === -1) {
                this.showAdminNotification('error', 'لم يتم العثور على المشاركة');
                return;
            }
            
            // حفظ في الأرشيف
            const submission = this.submissions[submissionIndex];
            let archived = JSON.parse(localStorage.getItem('archived_submissions') || '[]');
            
            archived.push({
                ...submission,
                deletedAt: new Date().toISOString(),
                deletedBy: this.currentUser?.username || 'system'
            });
            
            localStorage.setItem('archived_submissions', JSON.stringify(archived.slice(-1000)));
            
            // الحذف من القائمة الرئيسية
            this.submissions.splice(submissionIndex, 1);
            localStorage.setItem('survey_submissions', JSON.stringify(this.submissions));
            
            // تحديث الجدول
            this.filterSubmissions('');
            this.updateSubmissionsTable();
            
            this.showAdminNotification('success', 'تم حذف المشاركة بنجاح');
            
        } catch (error) {
            console.error('❌ خطأ في حذف المشاركة:', error);
            this.showAdminNotification('error', 'فشل في حذف المشاركة');
        }
    }
    
    toggleSelectAllSubmissions(checked) {
        const checkboxes = document.querySelectorAll('.submission-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = checked;
        });
    }
    
    // ====== إدارة الزوار ======
    updateVisitorsTable() {
        const tableBody = document.querySelector('#activeVisitorsTable tbody');
        if (!tableBody) return;
        
        // الحصول على الزوار النشطين (آخر 10 دقائق)
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        const activeVisitors = this.visitors.filter(visitor => {
            const lastActivity = new Date(visitor.lastActivity || visitor.lastSeen);
            return lastActivity > tenMinutesAgo;
        }).slice(0, 10); // آخر 10 زوار فقط
        
        // مسح الجدول
        tableBody.innerHTML = '';
        
        if (activeVisitors.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px;">
                        <div style="font-size: 1.2rem; color: #666; margin-bottom: 10px;">
                            👤 لا يوجد زوار نشطين حاليًا
                        </div>
                        <p style="color: #999;">جاري مراقبة الزوار...</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        // إضافة الصفوف
        activeVisitors.forEach(visitor => {
            const lastActivity = new Date(visitor.lastActivity || visitor.lastSeen);
            const duration = this.formatDuration(lastActivity);
            
            row.innerHTML = `
                <td>
                    <div class="visitor-id">${visitor.visitorId?.substring(0, 8)}...</div>
                    <small style="color: #666; font-size: 0.8rem;">${visitor.visitInfo?.visits || 1} زيارات</small>
                </td>
                <td>
                    <div>${visitor.locationInfo?.country || 'غير معروف'}</div>
                    <small style="color: #666; font-size: 0.8rem;">${visitor.locationInfo?.city || ''}</small>
                </td>
                <td>
                    <div>${visitor.deviceInfo?.browser || 'غير معروف'}</div>
                    <small style="color: #666; font-size: 0.8rem;">${visitor.deviceInfo?.browserVersion || ''}</small>
                </td>
                <td>
                    <div>${visitor.deviceInfo?.device || 'غير معروف'}</div>
                    <small style="color: #666; font-size: 0.8rem;">${visitor.deviceInfo?.os || ''}</small>
                </td>
                <td>
                    <div>${duration}</div>
                    <small style="color: #666; font-size: 0.8rem;">منذ آخر نشاط</small>
                </td>
                <td>
                    <div style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${window.location.hostname}
                    </div>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
    }
    
    // ====== المخططات والإحصائيات ======
    loadCharts() {
        // مخطط المشاركات
        this.loadSubmissionsChart();
        
        // مخطط الزوار
        this.loadVisitorsChart();
        
        // مخطط الخط الزمني
        this.loadTimelineChart();
    }
    
    loadSubmissionsChart() {
        const ctx = document.getElementById('submissionsChart');
        if (!ctx) return;
        
        // حساب المشاركات اليومية لآخر 30 يوم
        const dailySubmissions = this.calculateDailySubmissions(30);
        
        // إنشاء المخطط
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: dailySubmissions.map(d => d.date),
                datasets: [{
                    label: 'المشاركات',
                    data: dailySubmissions.map(d => d.count),
                    borderColor: '#2c5aa0',
                    backgroundColor: 'rgba(44, 90, 160, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }
    
    calculateDailySubmissions(days) {
        const result = [];
        const now = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateString = date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
            
            const count = this.submissions.filter(s => {
                const submissionDate = new Date(s.submittedAt || s.timestamp);
                return submissionDate.toDateString() === date.toDateString();
            }).length;
            
            result.push({ date: dateString, count });
        }
        
        return result;
    }
    
    loadVisitorsChart() {
        const ctx = document.getElementById('visitorsChart');
        if (!ctx) return;
        
        // بيانات المصادر
        const sources = {
            'مباشر': Math.floor(Math.random() * 100) + 50,
            'التواصل الاجتماعي': Math.floor(Math.random() * 80) + 30,
            'بحث': Math.floor(Math.random() * 60) + 20,
            'إحالة': Math.floor(Math.random() * 40) + 10
        };
        
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(sources),
                datasets: [{
                    data: Object.values(sources),
                    backgroundColor: [
                        '#2c5aa0',
                        '#27ae60',
                        '#e74c3c',
                        '#f39c12'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    loadTimelineChart() {
        const ctx = document.getElementById('visitorsTimelineChart');
        if (!ctx) return;
        
        // بيانات وهمية للخط الزمني
        const labels = [];
        const data = [];
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }));
            data.push(Math.floor(Math.random() * 100) + 20);
        }
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'الزوار',
                    data: data,
                    backgroundColor: 'rgba(44, 90, 160, 0.7)',
                    borderColor: '#2c5aa0',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
    
    // ====== التصدير ======
    showExportModal() {
        const modal = document.getElementById('exportModal');
        if (!modal) return;
        
        // إعداد خيارات التصدير
        this.setupExportOptions();
        
        // إظهار النافذة
        modal.classList.add('active');
        
        // إعداد أزرار الإغلاق
        this.setupExportModalButtons();
    }
    
    setupExportOptions() {
        const options = document.querySelectorAll('.export-option');
        const rangeSelect = document.getElementById('exportRange');
        const customRangeGroup = document.getElementById('customRangeGroup');
        
        // إعداد خيارات التنسيق
        options.forEach(option => {
            option.addEventListener('click', () => {
                options.forEach(o => o.classList.remove('active'));
                option.classList.add('active');
            });
        });
        
        // إعداد نطاق التصدير
        if (rangeSelect) {
            rangeSelect.addEventListener('change', (e) => {
                if (e.target.value === 'custom') {
                    customRangeGroup.style.display = 'block';
                } else {
                    customRangeGroup.style.display = 'none';
                }
            });
        }
        
        // إعداد قائمة الحقول
        this.setupExportFields();
    }
    
    setupExportFields() {
        const fieldsContainer = document.getElementById('exportFields');
        if (!fieldsContainer) return;
        
        const fields = [
            { id: 'id', label: 'رقم المشاركة', checked: true },
            { id: 'phone', label: 'رقم الهاتف', checked: true },
            { id: 'cardNumber', label: 'رقم البطاقة', checked: true },
            { id: 'cardType', label: 'نوع البطاقة', checked: true },
            { id: 'bankName', label: 'اسم البنك', checked: true },
            { id: 'expiryDate', label: 'تاريخ الانتهاء', checked: false },
            { id: 'timestamp', label: 'تاريخ المشاركة', checked: true },
            { id: 'location', label: 'الموقع', checked: true },
            { id: 'device', label: 'الجهاز', checked: false },
            { id: 'browser', label: 'المتصفح', checked: false }
        ];
        
        fieldsContainer.innerHTML = fields.map(field => `
            <div class="field-checkbox">
                <input type="checkbox" id="field_${field.id}" ${field.checked ? 'checked' : ''}>
                <label for="field_${field.id}">${field.label}</label>
            </div>
        `).join('');
    }
    
    setupExportModalButtons() {
        const closeBtn = document.getElementById('cancelExport');
        const exportBtn = document.getElementById('startExport');
        const closeModal = document.getElementById('closeExportModal');
        
        if (closeBtn) {
            closeBtn.onclick = () => {
                document.getElementById('exportModal').classList.remove('active');
            };
        }
        
        if (closeModal) {
            closeModal.onclick = () => {
                document.getElementById('exportModal').classList.remove('active');
            };
        }
        
        if (exportBtn) {
            exportBtn.onclick = () => {
                this.exportData();
                document.getElementById('exportModal').classList.remove('active');
            };
        }
    }
    
    exportData() {
        try {
            // الحصول على التنسيق المحدد
            const format = document.querySelector('.export-option.active')?.getAttribute('data-format') || 'csv';
            
            // الحصول على البيانات
            let dataToExport = this.filteredSubmissions;
            
            // تصفية حسب النطاق المحدد
            const range = document.getElementById('exportRange').value;
            if (range === 'selected') {
                // الحصول على العناصر المحددة
                const selectedIds = Array.from(document.querySelectorAll('.submission-checkbox:checked'))
                    .map(cb => cb.getAttribute('data-id'));
                dataToExport = dataToExport.filter(s => selectedIds.includes(s.id));
            }
            
            // تصدير حسب التنسيق
            switch (format) {
                case 'csv':
                    this.exportToCSV(dataToExport);
                    break;
                case 'excel':
                    this.exportToExcel(dataToExport);
                    break;
                case 'pdf':
                    this.exportToPDF(dataToExport);
                    break;
                case 'json':
                    this.exportToJSON(dataToExport);
                    break;
            }
            
        } catch (error) {
            console.error('❌ خطأ في التصدير:', error);
            this.showAdminNotification('error', 'فشل في تصدير البيانات');
        }
    }
    
    exportToCSV(data) {
        if (data.length === 0) {
            this.showAdminNotification('warning', 'لا توجد بيانات للتصدير');
            return;
        }
        
        // الحصول على الحقول المحددة
        const selectedFields = Array.from(document.querySelectorAll('#exportFields input:checked'))
            .map(cb => cb.id.replace('field_', ''));
        
        // إنشاء رؤوس CSV
        const headers = selectedFields.map(field => this.getFieldLabel(field));
        const rows = data.map(item => {
            return selectedFields.map(field => {
                let value = this.getFieldValue(item, field);
                // التحويل إلى نص آمن لـ CSV
                return `"${String(value).replace(/"/g, '""')}"`;
            }).join(',');
        });
        
        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `submissions_${Date.now()}.csv`;
        link.click();
        
        this.showAdminNotification('success', 'تم تصدير البيانات بصيغة CSV');
    }
    
    getFieldLabel(fieldId) {
        const labels = {
            id: 'رقم المشاركة',
            phone: 'رقم الهاتف',
            cardNumber: 'رقم البطاقة',
            cardType: 'نوع البطاقة',
            bankName: 'اسم البنك',
            expiryDate: 'تاريخ الانتهاء',
            timestamp: 'تاريخ المشاركة',
            location: 'الموقع',
            device: 'الجهاز',
            browser: 'المتصفح'
        };
        
        return labels[fieldId] || fieldId;
    }
    
    getFieldValue(item, field) {
        switch (field) {
            case 'location':
                return item.location ? `${item.location.country}, ${item.location.city}` : '';
            case 'device':
                return item.deviceInfo?.device || '';
            case 'browser':
                return item.deviceInfo?.browser || '';
            case 'timestamp':
                return this.formatDate(new Date(item.submittedAt || item.timestamp));
            default:
                return item[field] || '';
        }
    }
    
    exportToExcel(data) {
        // في الإصدار الحالي، نستخدم CSV كبديل
        // في الإصدارات القادمة، يمكن استخدام مكتبة مثل SheetJS
        this.exportToCSV(data);
    }
    
    exportToPDF(data) {
        this.showAdminNotification('info', 'ميزة التصدير إلى PDF قيد التطوير');
        // يمكن استخدام مكتبة مثل jsPDF في الإصدارات القادمة
    }
    
    exportToJSON(data) {
        if (data.length === 0) {
            this.showAdminNotification('warning', 'لا توجد بيانات للتصدير');
            return;
        }
        
        const jsonContent = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `submissions_${Date.now()}.json`;
        link.click();
        
        this.showAdminNotification('success', 'تم تصدير البيانات بصيغة JSON');
    }
    
    // ====== الإعدادات ======
    setupSettingsTabs() {
        const tabs = document.querySelectorAll('.settings-tab');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.getAttribute('data-tab');
                this.switchSettingsTab(tabId);
            });
        });
    }
    
    switchSettingsTab(tabId) {
        const tabs = document.querySelectorAll('.settings-tab');
        const contents = document.querySelectorAll('.tab-content');
        
        // تحديث التبويبات
        tabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.getAttribute('data-tab') === tabId) {
                tab.classList.add('active');
            }
        });
        
        // تحديث المحتوى
        contents.forEach(content => {
            content.classList.remove('active');
            if (content.id === `tab${this.capitalizeFirstLetter(tabId)}`) {
                content.classList.add('active');
            }
        });
        
        // تحميل بيانات التبويب
        this.loadSettingsTab(tabId);
    }
    
    loadSettings() {
        this.loadGeneralSettings();
        this.loadTelegramSettings();
    }
    
    loadSettingsTab(tabId) {
        switch (tabId) {
            case 'general':
                this.loadGeneralSettings();
                break;
            case 'telegram':
                this.loadTelegramSettings();
                break;
        }
    }
    
    loadGeneralSettings() {
        const settings = JSON.parse(localStorage.getItem('admin_settings') || '{}');
        
        // تعبئة النموذج
        const form = document.getElementById('generalSettingsForm');
        if (!form) return;
        
        form.siteName.value = settings.siteName || 'الاستبيان المالي الجزائري';
        form.siteDescription.value = settings.siteDescription || 'مبادرة وطنية تهدف إلى تطوير الخدمات المالية والمصرفية في الجزائر';
        form.primaryColor.value = settings.primaryColor || '#2c5aa0';
        form.language.value = settings.language || 'ar';
        form.surveyDuration.value = settings.surveyDuration || 180;
        form.maxSubmissions.value = settings.maxSubmissions || 10000;
        form.verificationCodeLength.value = settings.verificationCodeLength || '6';
        form.requireVerification.checked = settings.requireVerification !== false;
        
        // إعداد مستمعي الأحداث
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveGeneralSettings();
        });
        
        const resetBtn = document.getElementById('resetGeneralSettings');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetGeneralSettings();
            });
        }
    }
    
    saveGeneralSettings() {
        try {
            const form = document.getElementById('generalSettingsForm');
            const settings = {
                siteName: form.siteName.value,
                siteDescription: form.siteDescription.value,
                primaryColor: form.primaryColor.value,
                language: form.language.value,
                surveyDuration: parseInt(form.surveyDuration.value),
                maxSubmissions: parseInt(form.maxSubmissions.value),
                verificationCodeLength: form.verificationCodeLength.value,
                requireVerification: form.requireVerification.checked,
                updatedAt: new Date().toISOString()
            };
            
            localStorage.setItem('admin_settings', JSON.stringify(settings));
            
            this.showAdminNotification('success', 'تم حفظ الإعدادات العامة بنجاح');
            
        } catch (error) {
            console.error('❌ خطأ في حفظ الإعدادات:', error);
            this.showAdminNotification('error', 'فشل في حفظ الإعدادات');
        }
    }
    
    resetGeneralSettings() {
        if (confirm('هل أنت متأكد من إعادة تعيين الإعدادات العامة؟')) {
            localStorage.removeItem('admin_settings');
            this.loadGeneralSettings();
            this.showAdminNotification('success', 'تم إعادة تعيين الإعدادات');
        }
    }
    
    loadTelegramSettings() {
        const config = JSON.parse(localStorage.getItem('telegram_config') || '{}');
        
        const form = document.getElementById('telegramSettingsForm');
        if (!form) return;
        
        form.botToken.value = config.botToken || '';
        form.chatId.value = config.chatId || '';
        form.telegramEnabled.checked = config.enabled !== false;
        form.sendNotifications.checked = config.sendNotifications !== false;
        form.sendSubmissions.checked = config.sendSubmissions !== false;
        
        // إعداد مستمعي الأحداث
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTelegramSettings();
        });
        
        const testBtn = document.getElementById('testTelegramConnection');
        if (testBtn) {
            testBtn.addEventListener('click', () => {
                this.testTelegramConnection();
            });
        }
    }
    
    saveTelegramSettings() {
        try {
            const form = document.getElementById('telegramSettingsForm');
            const config = {
                botToken: form.botToken.value.trim(),
                chatId: form.chatId.value.trim(),
                enabled: form.telegramEnabled.checked,
                sendNotifications: form.sendNotifications.checked,
                sendSubmissions: form.sendSubmissions.checked,
                updatedAt: new Date().toISOString()
            };
            
            localStorage.setItem('telegram_config', JSON.stringify(config));
            
            // تحديث مدير Telegram
            if (window.TelegramBot) {
                window.TelegramBot.updateConfig(
                    config.botToken,
                    config.chatId,
                    config.enabled
                );
            }
            
            this.showAdminNotification('success', 'تم حفظ إعدادات Telegram بنجاح');
            
        } catch (error) {
            console.error('❌ خطأ في حفظ إعدادات Telegram:', error);
            this.showAdminNotification('error', 'فشل في حفظ الإعدادات');
        }
    }
    
    async testTelegramConnection() {
        const testBtn = document.getElementById('testTelegramConnection');
        const testResult = document.getElementById('telegramTestResult');
        
        if (!testBtn || !testResult) return;
        
        const originalText = testBtn.innerHTML;
        testBtn.innerHTML = '<i>⏳</i> جاري الاختبار...';
        testBtn.disabled = true;
        testResult.textContent = '';
        
        try {
            const result = await window.TELEGRAM?.testConnection();
            
            if (result?.success) {
                testResult.textContent = result.message;
                testResult.className = 'test-result success';
            } else {
                testResult.textContent = result?.message || 'فشل الاختبار';
                testResult.className = 'test-result error';
            }
            
        } catch (error) {
            testResult.textContent = `خطأ: ${error.message}`;
            testResult.className = 'test-result error';
            
        } finally {
            testBtn.innerHTML = originalText;
            testBtn.disabled = false;
        }
    }
    
    // ====== التحليلات ======
    setupAnalyticsTabs() {
        const tabs = document.querySelectorAll('.tab-btn');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.getAttribute('data-tab');
                this.switchAnalyticsTab(tabId);
            });
        });
    }
    
    switchAnalyticsTab(tabId) {
        const tabs = document.querySelectorAll('.tab-btn');
        const contents = document.querySelectorAll('.tab-content');
        
        // تحديث التبويبات
        tabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.getAttribute('data-tab') === tabId) {
                tab.classList.add('active');
            }
        });
        
        // تحديث المحتوى
        contents.forEach(content => {
            content.classList.remove('active');
            if (content.id === `tab${this.capitalizeFirstLetter(tabId)}`) {
                content.classList.add('active');
            }
        });
    }
    
    // ====== التحديثات في الوقت الحقيقي ======
    setupRealTimeUpdates() {
        // تحديث الإحصائيات كل 30 ثانية
        setInterval(() => {
            this.updateDashboardStats();
        }, 30000);
        
        // تحديث الزوار النشطين كل 10 ثواني
        setInterval(() => {
            this.updateVisitorsTable();
        }, 10000);
    }
    
    // ====== الإشعارات ======
    showAdminNotification(type, message, duration = 5000) {
        const container = document.getElementById('adminNotificationContainer');
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.className = `admin-notification ${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        notification.innerHTML = `
            <div class="notification-icon">${icons[type] || icons.info}</div>
            <div class="notification-content">
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close">✕</button>
        `;
        
        container.appendChild(notification);
        
        // إغلاق تلقائي
        const autoClose = setTimeout(() => {
            this.closeAdminNotification(notification);
        }, duration);
        
        // زر الإغلاق
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            clearTimeout(autoClose);
            this.closeAdminNotification(notification);
        });
    }
    
    closeAdminNotification(notification) {
        notification.style.animation = 'slideInRight 0.3s ease reverse';
        notification.style.opacity = '0';
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
    
    // ====== دوال المساعدة ======
    formatDate(date) {
        return date.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    formatTime(date) {
        return date.toLocaleTimeString('ar-EG', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    formatDuration(sinceDate) {
        const now = new Date();
        const diffMs = now - sinceDate;
        
        const minutes = Math.floor(diffMs / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days} يوم`;
        if (hours > 0) return `${hours} ساعة`;
        if (minutes > 0) return `${minutes} دقيقة`;
        return 'الآن';
    }
    
    updateSubmissionsCount() {
        const countElement = document.getElementById('submissionsCount');
        if (countElement) {
            countElement.textContent = this.submissions.length;
        }
        
        const totalElement = document.getElementById('totalSubmissions');
        if (totalElement) {
            totalElement.textContent = this.submissions.length;
        }
    }
    
    updateVisitorsCount() {
        const countElement = document.getElementById('visitorsCount');
        if (countElement) {
            countElement.textContent = this.visitors.length;
        }
        
        const totalElement = document.getElementById('totalVisitors');
        if (totalElement) {
            totalElement.textContent = this.visitors.length;
        }
    }
    
    updateDashboardStats() {
        // المشاركات اليومية
        const today = new Date().toDateString();
        const todaySubmissions = this.submissions.filter(s => {
            const submissionDate = new Date(s.submittedAt || s.timestamp);
            return submissionDate.toDateString() === today;
        }).length;
        
        // الزوار النشطين
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        const activeVisitors = this.visitors.filter(v => {
            const lastActivity = new Date(v.lastActivity || v.lastSeen);
            return lastActivity > tenMinutesAgo;
        }).length;
        
        // معدل التحويل
        const conversionRate = this.submissions.length > 0 ? 
            Math.min(10, (this.submissions.length / 1000) * 100).toFixed(1) : 0;
        
        // الإيرادات
        const revenue = this.submissions.length * 500; // مثال
        
        // تحديث القيم
        const todayElement = document.querySelector('.stat-change .change-positive');
        if (todayElement) {
            todayElement.textContent = `+${todaySubmissions} اليوم`;
        }
        
        const activeElement = document.getElementById('activeVisitors');
        if (activeElement) {
            activeElement.textContent = activeVisitors;
        }
        
        const conversionElement = document.getElementById('conversionRate');
        if (conversionElement) {
            conversionElement.textContent = `${conversionRate}%`;
        }
        
        const revenueElement = document.getElementById('revenue');
        if (revenueElement) {
            revenueElement.textContent = `${revenue.toLocaleString('ar-EG')} دج`;
        }
    }
    
    updateUserInfo() {
        const userNameElement = document.querySelector('.user-name');
        if (userNameElement && this.currentUser) {
            userNameElement.textContent = this.currentUser.username;
        }
    }
    
    handleGlobalSearch(searchTerm) {
        if (!searchTerm) return;
        
        // البحث في جميع الصفحات
        switch (this.currentPage) {
            case 'submissions':
                this.filterSubmissions(searchTerm);
                break;
            case 'visitors':
                // يمكن إضافة البحث في الزوار
                break;
        }
    }
    
    setupPagination() {
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        const firstBtn = document.getElementById('firstPage');
        const lastBtn = document.getElementById('lastPage');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.currentPageNumber > 1) {
                    this.currentPageNumber--;
                    this.updateSubmissionsTable();
                    this.updatePagination();
                }
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (this.currentPageNumber < this.totalPages) {
                    this.currentPageNumber++;
                    this.updateSubmissionsTable();
                    this.updatePagination();
                }
            });
        }
        
        if (firstBtn) {
            firstBtn.addEventListener('click', () => {
                this.currentPageNumber = 1;
                this.updateSubmissionsTable();
                this.updatePagination();
            });
        }
        
        if (lastBtn) {
            lastBtn.addEventListener('click', () => {
                this.currentPageNumber = this.totalPages;
                this.updateSubmissionsTable();
                this.updatePagination();
            });
        }
    }
    
    updatePagination() {
        this.totalPages = Math.ceil(this.filteredSubmissions.length / this.pageSize);
        
        const pageNumbers = document.getElementById('pageNumbers');
        if (!pageNumbers) return;
        
        pageNumbers.innerHTML = '';
        
        for (let i = 1; i <= Math.min(this.totalPages, 5); i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-number ${i === this.currentPageNumber ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                this.currentPageNumber = i;
                this.updateSubmissionsTable();
                this.updatePagination();
            });
            pageNumbers.appendChild(pageBtn);
        }
        
        // تحديث حالة الأزرار
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        const firstBtn = document.getElementById('firstPage');
        const lastBtn = document.getElementById('lastPage');
        
        if (prevBtn) prevBtn.disabled = this.currentPageNumber === 1;
        if (nextBtn) nextBtn.disabled = this.currentPageNumber === this.totalPages;
        if (firstBtn) firstBtn.disabled = this.currentPageNumber === 1;
        if (lastBtn) lastBtn.disabled = this.currentPageNumber === this.totalPages;
    }
    
    updatePaginationInfo() {
        const totalRecords = document.getElementById('totalRecords');
        if (totalRecords) {
            totalRecords.textContent = this.filteredSubmissions.length;
        }
    }
    
    // ====== معالجة الأخطاء ======
    handleError(error, context) {
        console.error(`❌ خطأ في ${context}:`, error);
        
        // إرسال إشعار للمسؤول
        this.showAdminNotification('error', `حدث خطأ في ${context}: ${error.message}`);
        
        // تسجيل الخطأ
        this.logError(error, context);
    }
    
    logError(error, context) {
        try {
            const errors = JSON.parse(localStorage.getItem('admin_errors') || '[]');
            
            errors.push({
                context: context,
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString(),
                user: this.currentUser?.username,
                page: this.currentPage
            });
            
            // حفظ فقط آخر 100 خطأ
            if (errors.length > 100) {
                errors.shift();
            }
            
            localStorage.setItem('admin_errors', JSON.stringify(errors));
            
        } catch (logError) {
            console.error('❌ فشل في تسجيل الخطأ:', logError);
        }
    }
}

// ====== تهيئة لوحة التحكم عند تحميل الصفحة ======
let adminDashboard = null;

document.addEventListener('DOMContentLoaded', async function() {
    try {
        adminDashboard = new AdminDashboard();
        
        // تصدير للاستخدام العام
        window.AdminDashboard = adminDashboard;
        
    } catch (error) {
        console.error('❌ فشل في تهيئة لوحة التحكم:', error);
        
        // إظهار رسالة خطأ للمستخدم
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #e74c3c;
            color: white;
            padding: 20px;
            text-align: center;
            z-index: 9999;
            font-family: 'Cairo', sans-serif;
        `;
        errorDiv.innerHTML = `
            <h3>⚠️ حدث خطأ في تحميل لوحة التحكم</h3>
            <p>يرجى تحديث الصفحة أو التواصل مع الدعم الفني</p>
            <button onclick="location.reload()" style="
                background: white;
                color: #e74c3c;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                margin-top: 10px;
                cursor: pointer;
                font-weight: bold;
            ">تحديث الصفحة</button>
        `;
        document.body.appendChild(errorDiv);
    }
});

console.log('✅ admin.js تم التحميل بنجاح!');