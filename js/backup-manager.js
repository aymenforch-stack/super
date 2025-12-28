/**
 * نظام النسخ الاحتياطي
 */

class BackupManager {
    constructor() {
        this.backupInterval = 24 * 60 * 60 * 1000; // 24 ساعة
        this.maxBackups = 30;
        this.init();
    }
    
    init() {
        console.log('💾 نظام النسخ الاحتياطي جاهز');
        this.setupAutoBackup();
        this.cleanupOldBackups();
    }
    
    // ====== إنشاء نسخة احتياطية ======
    
    async createBackup(name = null) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupName = name || `backup_${timestamp}`;
            
            const backupData = {
                name: backupName,
                timestamp: new Date().toISOString(),
                data: {
                    submissions: this.getSubmissionsData(),
                    visitors: this.getVisitorsData(),
                    adminData: this.getAdminData(),
                    systemData: this.getSystemData(),
                    logs: this.getLogsData()
                },
                metadata: {
                    version: '1.0.0',
                    itemsCount: this.getTotalItemsCount(),
                    size: this.calculateDataSize()
                }
            };
            
            // حفظ محلياً
            this.saveBackupLocally(backupData);
            
            // إرسال إشعار
            this.sendBackupNotification(backupData);
            
            console.log(`✅ تم إنشاء نسخة احتياطية: ${backupName}`);
            
            return {
                success: true,
                name: backupName,
                timestamp: backupData.timestamp,
                size: backupData.metadata.size
            };
            
        } catch (error) {
            console.error('❌ خطأ في إنشاء نسخة احتياطية:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    getSubmissionsData() {
        try {
            return JSON.parse(localStorage.getItem('survey_submissions') || '[]');
        } catch {
            return [];
        }
    }
    
    getVisitorsData() {
        try {
            return JSON.parse(localStorage.getItem('tracked_visitors') || '[]');
        } catch {
            return [];
        }
    }
    
    getAdminData() {
        try {
            return {
                auth: JSON.parse(localStorage.getItem('admin_auth') || '{}'),
                settings: JSON.parse(localStorage.getItem('admin_settings') || '{}'),
                logs: JSON.parse(localStorage.getItem('login_attempts') || '[]')
            };
        } catch {
            return {};
        }
    }
    
    getSystemData() {
        try {
            return {
                config: JSON.parse(localStorage.getItem('telegram_config') || '{}'),
                logs: JSON.parse(localStorage.getItem('telegram_logs') || '[]'),
                queue: JSON.parse(localStorage.getItem('telegram_queue') || '[]')
            };
        } catch {
            return {};
        }
    }
    
    getLogsData() {
        try {
            return {
                appLogs: JSON.parse(localStorage.getItem('app_logs') || '[]'),
                errorLogs: JSON.parse(localStorage.getItem('admin_errors') || '[]'),
                behaviorLogs: JSON.parse(localStorage.getItem('behavior_data') || '[]')
            };
        } catch {
            return {};
        }
    }
    
    getTotalItemsCount() {
        const submissions = this.getSubmissionsData().length;
        const visitors = this.getVisitorsData().length;
        const logs = this.getLogsData().appLogs.length;
        
        return {
            submissions,
            visitors,
            logs,
            total: submissions + visitors + logs
        };
    }
    
    calculateDataSize() {
        const data = {
            submissions: this.getSubmissionsData(),
            visitors: this.getVisitorsData(),
            system: this.getSystemData(),
            logs: this.getLogsData()
        };
        
        const jsonString = JSON.stringify(data);
        const bytes = new Blob([jsonString]).size;
        
        return this.formatBytes(bytes);
    }
    
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
    
    // ====== حفظ النسخ الاحتياطية ======
    
    saveBackupLocally(backupData) {
        try {
            let backups = JSON.parse(localStorage.getItem('system_backups') || '[]');
            
            backups.push(backupData);
            
            // حفظ فقط العدد المحدد من النسخ
            if (backups.length > this.maxBackups) {
                backups = backups.slice(-this.maxBackups);
            }
            
            localStorage.setItem('system_backups', JSON.stringify(backups));
            
            // تحديث تاريخ آخر نسخة احتياطية
            localStorage.setItem('last_backup', backupData.timestamp);
            
            return true;
            
        } catch (error) {
            console.error('❌ خطأ في حفظ النسخة الاحتياطية:', error);
            return false;
        }
    }
    
    // ====== استعادة النسخ الاحتياطية ======
    
    async restoreBackup(backupName) {
        try {
            const backups = JSON.parse(localStorage.getItem('system_backups') || '[]');
            const backup = backups.find(b => b.name === backupName);
            
            if (!backup) {
                throw new Error('النسخة الاحتياطية غير موجودة');
            }
            
            // تأكيد الاستعادة
            if (!confirm(`هل أنت متأكد من استعادة النسخة الاحتياطية "${backupName}"؟ سيتم استبدال جميع البيانات الحالية.`)) {
                return { success: false, message: 'تم الإلغاء' };
            }
            
            // حفظ البيانات الحالية كنسخة احتياطية قبل الاستعادة
            await this.createBackup(`pre_restore_${Date.now()}`);
            
            // استعادة البيانات
            this.restoreData(backup.data);
            
            console.log(`✅ تم استعادة النسخة الاحتياطية: ${backupName}`);
            
            return {
                success: true,
                message: 'تم استعادة النسخة الاحتياطية بنجاح',
                backup: backupName,
                timestamp: backup.timestamp
            };
            
        } catch (error) {
            console.error('❌ خطأ في استعادة النسخة الاحتياطية:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    restoreData(data) {
        try {
            // استعادة المشاركات
            if (data.submissions) {
                localStorage.setItem('survey_submissions', JSON.stringify(data.submissions));
            }
            
            // استعادة الزوار
            if (data.visitors) {
                localStorage.setItem('tracked_visitors', JSON.stringify(data.visitors));
            }
            
            // استعادة بيانات الإدارة
            if (data.adminData) {
                if (data.adminData.auth) {
                    localStorage.setItem('admin_auth', JSON.stringify(data.adminData.auth));
                }
                if (data.adminData.settings) {
                    localStorage.setItem('admin_settings', JSON.stringify(data.adminData.settings));
                }
                if (data.adminData.logs) {
                    localStorage.setItem('login_attempts', JSON.stringify(data.adminData.logs));
                }
            }
            
            // استعادة بيانات النظام
            if (data.systemData) {
                if (data.systemData.config) {
                    localStorage.setItem('telegram_config', JSON.stringify(data.systemData.config));
                }
                if (data.systemData.logs) {
                    localStorage.setItem('telegram_logs', JSON.stringify(data.systemData.logs));
                }
                if (data.systemData.queue) {
                    localStorage.setItem('telegram_queue', JSON.stringify(data.systemData.queue));
                }
            }
            
            // استعادة السجلات
            if (data.logs) {
                if (data.logs.appLogs) {
                    localStorage.setItem('app_logs', JSON.stringify(data.logs.appLogs));
                }
                if (data.logs.errorLogs) {
                    localStorage.setItem('admin_errors', JSON.stringify(data.logs.errorLogs));
                }
                if (data.logs.behaviorLogs) {
                    localStorage.setItem('behavior_data', JSON.stringify(data.logs.behaviorLogs));
                }
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ خطأ في استعادة البيانات:', error);
            throw error;
        }
    }
    
    // ====== إدارة النسخ الاحتياطية ======
    
    getBackupList() {
        try {
            const backups = JSON.parse(localStorage.getItem('system_backups') || '[]');
            
            return backups.map(backup => ({
                name: backup.name,
                timestamp: backup.timestamp,
                size: backup.metadata?.size || 'غير معروف',
                items: backup.metadata?.itemsCount?.total || 0,
                submissions: backup.metadata?.itemsCount?.submissions || 0,
                visitors: backup.metadata?.itemsCount?.visitors || 0
            }));
            
        } catch (error) {
            console.error('❌ خطأ في جلب قائمة النسخ الاحتياطية:', error);
            return [];
        }
    }
    
    deleteBackup(backupName) {
        try {
            let backups = JSON.parse(localStorage.getItem('system_backups') || '[]');
            const initialLength = backups.length;
            
            backups = backups.filter(backup => backup.name !== backupName);
            
            if (backups.length === initialLength) {
                throw new Error('النسخة الاحتياطية غير موجودة');
            }
            
            localStorage.setItem('system_backups', JSON.stringify(backups));
            
            console.log(`🗑️ تم حذف النسخة الاحتياطية: ${backupName}`);
            
            return {
                success: true,
                message: 'تم حذف النسخة الاحتياطية',
                name: backupName
            };
            
        } catch (error) {
            console.error('❌ خطأ في حذف النسخة الاحتياطية:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    cleanupOldBackups() {
        try {
            const backups = JSON.parse(localStorage.getItem('system_backups') || '[]');
            
            if (backups.length <= this.maxBackups) {
                return;
            }
            
            // حفظ فقط آخر maxBackups نسخة
            const recentBackups = backups.slice(-this.maxBackups);
            
            localStorage.setItem('system_backups', JSON.stringify(recentBackups));
            
            console.log(`🧹 تم تنظيف النسخ الاحتياطية القديمة، بقي ${recentBackups.length} نسخة`);
            
        } catch (error) {
            console.error('❌ خطأ في تنظيف النسخ القديمة:', error);
        }
    }
    
    // ====== النسخ التلقائي ======
    
    setupAutoBackup() {
        // التحقق إذا كان قد مضى أكثر من 24 ساعة منذ آخر نسخة
        const lastBackup = localStorage.getItem('last_backup');
        
        if (!lastBackup) {
            // إنشاء أول نسخة احتياطية
            setTimeout(() => this.createBackup(), 60000); // بعد دقيقة
            return;
        }
        
        const lastBackupTime = new Date(lastBackup).getTime();
        const currentTime = new Date().getTime();
        const timeSinceLastBackup = currentTime - lastBackupTime;
        
        if (timeSinceLastBackup > this.backupInterval) {
            // إنشاء نسخة احتياطية جديدة
            setTimeout(() => this.createBackup(), 30000); // بعد 30 ثانية
        }
        
        // جدولة النسخ التالية
        const timeUntilNextBackup = this.backupInterval - timeSinceLastBackup;
        
        if (timeUntilNextBackup > 0) {
            setTimeout(() => {
                this.createBackup();
                this.setupAutoBackup(); // جدولة التالية
            }, timeUntilNextBackup);
        } else {
            // إذا كان الوقت قد انقضى بالفعل
            setTimeout(() => {
                this.createBackup();
                this.setupAutoBackup();
            }, this.backupInterval);
        }
    }
    
    // ====== تصدير واستيراد ======
    
    exportBackup(backupName) {
        try {
            const backups = JSON.parse(localStorage.getItem('system_backups') || '[]');
            const backup = backups.find(b => b.name === backupName);
            
            if (!backup) {
                throw new Error('النسخة الاحتياطية غير موجودة');
            }
            
            const dataStr = JSON.stringify(backup, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            
            const exportFileDefaultName = `${backupName}.json`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            
            return {
                success: true,
                message: 'تم تصدير النسخة الاحتياطية',
                fileName: exportFileDefaultName
            };
            
        } catch (error) {
            console.error('❌ خطأ في تصدير النسخة الاحتياطية:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    importBackup(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const backupData = JSON.parse(event.target.result);
                    
                    // التحقق من صحة البيانات
                    if (!this.validateBackupData(backupData)) {
                        reject(new Error('ملف النسخة الاحتياطية غير صالح'));
                        return;
                    }
                    
                    // إضافة إلى النسخ المحلية
                    let backups = JSON.parse(localStorage.getItem('system_backups') || '[]');
                    backups.push(backupData);
                    localStorage.setItem('system_backups', JSON.stringify(backups));
                    
                    console.log(`✅ تم استيراد النسخة الاحتياطية: ${backupData.name}`);
                    
                    resolve({
                        success: true,
                        message: 'تم استيراد النسخة الاحتياطية بنجاح',
                        backup: backupData.name
                    });
                    
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = (error) => {
                reject(error);
            };
            
            reader.readAsText(file);
        });
    }
    
    validateBackupData(data) {
        return data &&
               data.name &&
               data.timestamp &&
               data.data &&
               data.metadata;
    }
    
    // ====== الإشعارات ======
    
    sendBackupNotification(backupData) {
        // إرسال إشعار للمستخدم
        if (window.UTILS) {
            UTILS.log('info', `تم إنشاء نسخة احتياطية: ${backupData.name}`, {
                size: backupData.metadata.size,
                items: backupData.metadata.itemsCount.total
            });
        }
        
        // إرسال إشعار Telegram
        if (window.TELEGRAM) {
            const message = `💾 تم إنشاء نسخة احتياطية جديدة\n\n` +
                           `الاسم: ${backupData.name}\n` +
                           `الحجم: ${backupData.metadata.size}\n` +
                           `العناصر: ${backupData.metadata.itemsCount.total}\n` +
                           `التاريخ: ${new Date(backupData.timestamp).toLocaleString('ar-EG')}`;
            
            window.TELEGRAM.sendNotification('نسخة احتياطية', message, 'info');
        }
    }
    
    // ====== إحصائيات النسخ الاحتياطية ======
    
    getBackupStatistics() {
        const backups = this.getBackupList();
        
        if (backups.length === 0) {
            return {
                totalBackups: 0,
                lastBackup: null,
                totalSize: '0 Bytes',
                averageSize: '0 Bytes',
                submissionsCount: 0,
                visitorsCount: 0
            };
        }
        
        const lastBackup = backups[backups.length - 1];
        const totalSize = this.calculateTotalBackupSize(backups);
        const averageSize = this.calculateAverageBackupSize(backups);
        
        const submissionsCount = backups.reduce((sum, backup) => sum + (backup.submissions || 0), 0);
        const visitorsCount = backups.reduce((sum, backup) => sum + (backup.visitors || 0), 0);
        
        return {
            totalBackups: backups.length,
            lastBackup: lastBackup.timestamp,
            lastBackupName: lastBackup.name,
            totalSize,
            averageSize,
            submissionsCount,
            visitorsCount,
            daysSinceFirstBackup: this.getDaysSinceFirstBackup()
        };
    }
    
    calculateTotalBackupSize(backups) {
        // هذه دالة مبسطة، في التطبيق الحقيقي يجب حساب الحجم الفعلي
        return `${backups.length * 10} KB`;
    }
    
    calculateAverageBackupSize(backups) {
        // هذه دالة مبسطة
        return '10 KB';
    }
    
    getDaysSinceFirstBackup() {
        const backups = this.getBackupList();
        
        if (backups.length === 0) return 0;
        
        const firstBackup = new Date(backups[0].timestamp);
        const today = new Date();
        const diffTime = Math.abs(today - firstBackup);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays;
    }
}

// تهيئة مدير النسخ الاحتياطية
let backupManager = null;

document.addEventListener('DOMContentLoaded', () => {
    backupManager = new BackupManager();
    window.BackupManager = backupManager;
    
    console.log('✅ نظام النسخ الاحتياطي جاهز!');
});

// واجهة برمجة التطبيقات للاستخدام العام
window.BACKUP = {
    createBackup: (name) => backupManager?.createBackup(name) || Promise.resolve({ success: false }),
    restoreBackup: (name) => backupManager?.restoreBackup(name) || Promise.resolve({ success: false }),
    getBackupList: () => backupManager?.getBackupList() || [],
    deleteBackup: (name) => backupManager?.deleteBackup(name) || { success: false },
    exportBackup: (name) => backupManager?.exportBackup(name) || { success: false },
    importBackup: (file) => backupManager?.importBackup(file) || Promise.resolve({ success: false }),
    getStatistics: () => backupManager?.getBackupStatistics() || {}
};

console.log('✅ backup-manager.js تم التحميل بنجاح!');