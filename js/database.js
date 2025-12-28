// نظام قاعدة البيانات المحلية
class LocalDatabase {
    constructor() {
        this.prefix = CONFIG.STORAGE_PREFIX;
        this.systemHelper = new SystemHelper();
        this.init();
    }
    
    init() {
        // إنشاء جداول النظام إذا لم تكن موجودة
        this.ensureTables();
    }
    
    ensureTables() {
        const tables = ['participants', 'settings', 'logs', 'admin_notifications', 'data_submissions'];
        
        tables.forEach(table => {
            const key = `${this.prefix}${table}`;
            if (!localStorage.getItem(key)) {
                localStorage.setItem(key, JSON.stringify([]));
            }
        });
    }
    
    // إدارة المشاركين
    addParticipant(data) {
        return new Promise((resolve, reject) => {
            try {
                // التحقق من البيانات
                if (!this.validateParticipantData(data)) {
                    throw new Error('بيانات غير صالحة');
                }
                
                // إنشاء معرف فريد
                const participantId = this.systemHelper.generateParticipantId();
                
                // جمع بيانات المشارك
                const participant = {
                    id: participantId,
                    ...data,
                    status: CONFIG.STATUS.COMPLETED,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    deviceInfo: this.systemHelper.getDeviceInfo(),
                    isWinner: false,
                    reviewed: false
                };
                
                // الحصول على القائمة الحالية
                const participants = this.getAllParticipants();
                
                // إضافة المشارك الجديد
                participants.unshift(participant);
                
                // حفظ البيانات
                localStorage.setItem(
                    `${this.prefix}participants`,
                    JSON.stringify(participants)
                );
                
                // تحديث الإحصائيات
                this.updateStats();
                
                // تسجيل الحدث
                this.logEvent('ADD_PARTICIPANT', {
                    participantId,
                    name: data.personalInfo.name
                });
                
                resolve({
                    success: true,
                    participantId,
                    data: participant
                });
                
            } catch (error) {
                console.error('Error adding participant:', error);
                reject({
                    success: false,
                    error: error.message
                });
            }
        });
    }
    
    validateParticipantData(data) {
        const { personalInfo, randomCode } = data;
        
        // التحقق من المعلومات الشخصية
        if (!personalInfo || !personalInfo.name || !personalInfo.phone) {
            return false;
        }
        
        // التحقق من صحة الهاتف
        if (!CONFIG.VALIDATION.PHONE_REGEX.test(personalInfo.phone)) {
            return false;
        }
        
        // التحقق من الرمز العشوائي
        if (!CONFIG.VALIDATION.CODE_REGEX.test(randomCode)) {
            return false;
        }
        
        return true;
    }
    
    getAllParticipants() {
        try {
            const data = localStorage.getItem(`${this.prefix}participants`);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error getting participants:', error);
            return [];
        }
    }
    
    getParticipant(id) {
        const participants = this.getAllParticipants();
        return participants.find(p => p.id === id);
    }
    
    updateParticipant(id, updates) {
        const participants = this.getAllParticipants();
        const index = participants.findIndex(p => p.id === id);
        
        if (index !== -1) {
            participants[index] = {
                ...participants[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            
            localStorage.setItem(
                `${this.prefix}participants`,
                JSON.stringify(participants)
            );
            
            this.logEvent('UPDATE_PARTICIPANT', { participantId: id, updates });
            
            return {
                success: true,
                participant: participants[index]
            };
        }
        
        return {
            success: false,
            error: 'Participant not found'
        };
    }
    
    deleteParticipant(id) {
        const participants = this.getAllParticipants();
        const filtered = participants.filter(p => p.id !== id);
        
        if (filtered.length !== participants.length) {
            localStorage.setItem(
                `${this.prefix}participants`,
                JSON.stringify(filtered)
            );
            
            this.logEvent('DELETE_PARTICIPANT', { participantId: id });
            this.updateStats();
            
            return {
                success: true,
                deletedId: id
            };
        }
        
        return {
            success: false,
            error: 'Participant not found'
        };
    }
    
    markAsWinner(id) {
        return this.updateParticipant(id, {
            isWinner: true,
            winnerDate: new Date().toISOString()
        });
    }
    
    markAsReviewed(id) {
        return this.updateParticipant(id, {
            reviewed: true,
            reviewedAt: new Date().toISOString()
        });
    }
    
    // الإحصائيات
    updateStats() {
        const participants = this.getAllParticipants();
        const today = new Date().toDateString();
        
        const stats = {
            total: participants.length,
            today: participants.filter(p => 
                new Date(p.createdAt).toDateString() === today
            ).length,
            winners: participants.filter(p => p.isWinner).length,
            lastUpdate: new Date().toISOString()
        };
        
        localStorage.setItem(`${this.prefix}stats`, JSON.stringify(stats));
        
        // إشعار التحديث للمدير
        localStorage.setItem(`${this.prefix}stats_updated`, Date.now().toString());
    }
    
    getStats() {
        try {
            const stats = localStorage.getItem(`${this.prefix}stats`);
            return stats ? JSON.parse(stats) : {
                total: 0,
                today: 0,
                winners: 0,
                lastUpdate: null
            };
        } catch (error) {
            return {
                total: 0,
                today: 0,
                winners: 0,
                lastUpdate: null
            };
        }
    }
    
    // التصفية والبحث
    searchParticipants(query, filters = {}) {
        let participants = this.getAllParticipants();
        
        // البحث
        if (query) {
            const searchTerm = query.toLowerCase();
            participants = participants.filter(p => 
                p.personalInfo.name.toLowerCase().includes(searchTerm) ||
                p.id.toLowerCase().includes(searchTerm) ||
                p.personalInfo.phone.includes(searchTerm)
            );
        }
        
        // التصفية حسب الحالة
        if (filters.status && filters.status !== 'all') {
            if (filters.status === 'winner') {
                participants = participants.filter(p => p.isWinner);
            } else {
                participants = participants.filter(p => p.status === filters.status);
            }
        }
        
        // التصفية حسب التاريخ
        if (filters.date) {
            const filterDate = new Date(filters.date).toDateString();
            participants = participants.filter(p => 
                new Date(p.createdAt).toDateString() === filterDate
            );
        }
        
        // الترتيب حسب التاريخ (الأحدث أولاً)
        participants.sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );
        
        return participants;
    }
    
    // التصدير
    exportData(format = 'json', filters = {}) {
        const participants = this.searchParticipants('', filters);
        
        switch (format.toLowerCase()) {
            case 'json':
                return {
                    type: 'json',
                    data: JSON.stringify(participants, null, 2),
                    filename: `participants_${Date.now()}.json`,
                    mimeType: 'application/json'
                };
                
            case 'csv':
                const csv = this.convertToCSV(participants);
                return {
                    type: 'csv',
                    data: csv,
                    filename: `participants_${Date.now()}.csv`,
                    mimeType: 'text/csv'
                };
                
            case 'excel':
                const excelData = this.convertToExcel(participants);
                return {
                    type: 'excel',
                    data: excelData,
                    filename: `participants_${Date.now()}.xlsx`,
                    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                };
                
            default:
                throw new Error('Format not supported');
        }
    }
    
    convertToCSV(participants) {
        const headers = [
            'رقم المشاركة',
            'الاسم',
            'الهاتف',
            'رقم البطاقة',
            'تاريخ الميلاد',
            'الرمز العشوائي',
            'الحالة',
            'تاريخ الإنشاء'
        ];
        
        const rows = participants.map(p => [
            p.id,
            p.personalInfo.name,
            p.personalInfo.phone,
            p.personalInfo.cardNumber,
            p.personalInfo.birthDate,
            p.randomCode,
            p.isWinner ? 'فائز' : 'مكتمل',
            SystemHelper.formatDate(p.createdAt)
        ]);
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        
        return csvContent;
    }
    
    convertToExcel(participants) {
        // في بيئة المتصفح، نستخدم مكتبة SheetJS إذا كانت متوفرة
        // وإلا نرجع CSV كبديل
        if (window.XLSX) {
            const ws = XLSX.utils.json_to_sheet(
                participants.map(p => ({
                    'رقم المشاركة': p.id,
                    'الاسم': p.personalInfo.name,
                    'الهاتف': p.personalInfo.phone,
                    'رقم البطاقة': p.personalInfo.cardNumber,
                    'تاريخ الميلاد': p.personalInfo.birthDate,
                    'الرمز العشوائي': p.randomCode,
                    'الحالة': p.isWinner ? 'فائز' : 'مكتمل',
                    'تاريخ الإنشاء': SystemHelper.formatDate(p.createdAt),
                    'الفائز': p.isWinner ? 'نعم' : 'لا'
                }))
            );
            
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'المشاركين');
            
            return XLSX.write(wb, { type: 'binary', bookType: 'xlsx' });
        } else {
            // Fallback to CSV
            return this.convertToCSV(participants);
        }
    }
    
    // الإشعارات
    getNotifications() {
        try {
            const data = localStorage.getItem(`${this.prefix}admin_notifications`);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            return [];
        }
    }
    
    markNotificationAsRead(id) {
        const notifications = this.getNotifications();
        const notification = notifications.find(n => n.id === id);
        
        if (notification) {
            notification.read = true;
            localStorage.setItem(
                `${this.prefix}admin_notifications`,
                JSON.stringify(notifications)
            );
        }
    }
    
    getUnreadNotifications() {
        const notifications = this.getNotifications();
        return notifications.filter(n => !n.read);
    }
    
    // السجلات
    logEvent(type, data) {
        const log = {
            id: Date.now().toString(),
            type,
            data,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        };
        
        const logs = this.getLogs();
        logs.unshift(log);
        
        // حفظ آخر 1000 سجل فقط
        if (logs.length > 1000) {
            logs.pop();
        }
        
        localStorage.setItem(`${this.prefix}logs`, JSON.stringify(logs));
    }
    
    getLogs() {
        try {
            const data = localStorage.getItem(`${this.prefix}logs`);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            return [];
        }
    }
    
    // النسخ الاحتياطي
    backup() {
        const backup = {
            participants: this.getAllParticipants(),
            settings: this.getSettings(),
            logs: this.getLogs(),
            timestamp: new Date().toISOString(),
            version: CONFIG.VERSION
        };
        
        return SystemHelper.encrypt(JSON.stringify(backup));
    }
    
    restore(backupData) {
        try {
            const decrypted = SystemHelper.decrypt(backupData);
            const backup = JSON.parse(decrypted);
            
            if (backup.version !== CONFIG.VERSION) {
                throw new Error('Incompatible backup version');
            }
            
            localStorage.setItem(
                `${this.prefix}participants`,
                JSON.stringify(backup.participants)
            );
            
            localStorage.setItem(
                `${this.prefix}settings`,
                JSON.stringify(backup.settings)
            );
            
            localStorage.setItem(
                `${this.prefix}logs`,
                JSON.stringify(backup.logs)
            );
            
            this.updateStats();
            
            return {
                success: true,
                message: 'تم استعادة النسخة الاحتياطية بنجاح'
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // الإعدادات
    getSettings() {
        try {
            const data = localStorage.getItem(`${this.prefix}settings`);
            return data ? JSON.parse(data) : {
                autoUpdate: true,
                notifications: true,
                exportFormat: 'excel',
                itemsPerPage: 10
            };
        } catch (error) {
            return {
                autoUpdate: true,
                notifications: true,
                exportFormat: 'excel',
                itemsPerPage: 10
            };
        }
    }
    
    updateSettings(newSettings) {
        const current = this.getSettings();
        const updated = { ...current, ...newSettings };
        
        localStorage.setItem(
            `${this.prefix}settings`,
            JSON.stringify(updated)
        );
        
        return updated;
    }
    
    // الحصول على البيانات المرسلة
    getDataSubmissions() {
        try {
            const data = localStorage.getItem(`${this.prefix}data_submissions`);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            return [];
        }
    }
    
    getTodaySubmissions() {
        const submissions = this.getDataSubmissions();
        const today = new Date().toDateString();
        
        return submissions.filter(s => 
            new Date(s.timestamp).toDateString() === today
        );
    }
}

// تصدير قاعدة البيانات
window.LocalDatabase = new LocalDatabase();