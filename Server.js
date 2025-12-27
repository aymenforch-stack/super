const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// تخزين الغرف
const rooms = new Map();

// خدمة الملفات الثابتة
app.use(express.static(__dirname));
app.use(express.json());

// الصفحة الرئيسية
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API للصحة
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        rooms: rooms.size,
        totalConnections: Array.from(rooms.values()).reduce((sum, room) => sum + room.users.size, 0)
    });
});

// API لإنشاء غرفة
app.get('/api/create-room', (req, res) => {
    const roomId = generateRoomId();
    rooms.set(roomId, {
        users: new Map(),
        created: new Date(),
        host: null
    });
    
    res.json({
        success: true,
        roomId: roomId,
        link: `/?room=${roomId}`,
        message: 'تم إنشاء الغرفة بنجاح'
    });
});

// API للتحقق من وجود غرفة
app.get('/api/room/:roomId', (req, res) => {
    const roomId = req.params.roomId;
    
    if (rooms.has(roomId)) {
        const room = rooms.get(roomId);
        res.json({
            exists: true,
            roomId: roomId,
            users: Array.from(room.users.keys()),
            created: room.created,
            host: room.host
        });
    } else {
        res.json({
            exists: false,
            message: 'الغرفة غير موجودة'
        });
    }
});

// WebSocket للاتصال المباشر
wss.on('connection', (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const roomId = url.searchParams.get('room');
    const userId = generateUserId();
    
    console.log(`🔗 اتصال جديد: ${userId} في غرفة ${roomId || 'بدون غرفة'}`);
    
    if (!roomId) {
        ws.close();
        return;
    }
    
    // إنشاء غرفة إذا لم تكن موجودة
    if (!rooms.has(roomId)) {
        rooms.set(roomId, {
            users: new Map(),
            created: new Date(),
            host: userId
        });
        console.log(`🆕 غرفة جديدة: ${roomId}`);
    }
    
    const room = rooms.get(roomId);
    
    // إضافة المستخدم للغرفة
    room.users.set(userId, ws);
    
    // إذا كان أول مستخدم، اجعله مضيفاً
    if (room.users.size === 1) {
        room.host = userId;
    }
    
    // إرسال تأكيد الاتصال
    ws.send(JSON.stringify({
        type: 'connected',
        userId: userId,
        roomId: roomId,
        isHost: userId === room.host,
        usersCount: room.users.size,
        timestamp: new Date().toISOString()
    }));
    
    // إعلام الآخرين بانضمام مستخدم جديد
    broadcastToRoom(roomId, userId, {
        type: 'user-joined',
        userId: userId,
        roomId: roomId,
        usersCount: room.users.size,
        timestamp: new Date().toISOString()
    });
    
    console.log(`👤 ${userId} انضم لغرفة ${roomId} (${room.users.size} مستخدم)`);
    
    // استقبال الرسائل
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            data.sender = userId;
            data.timestamp = new Date().toISOString();
            
            console.log(`📩 رسالة من ${userId}: ${data.type}`);
            
            // توجيه الرسالة حسب النوع
            switch(data.type) {
                case 'offer':
                case 'answer':
                case 'ice-candidate':
                    // توجيه رسائل WebRTC لمستخدم محدد
                    if (data.target) {
                        sendToUser(roomId, data.target, data);
                    }
                    break;
                    
                case 'screen-sharing-started':
                case 'screen-sharing-stopped':
                case 'control-request':
                case 'chat-message':
                    // بث الرسائل للجميع
                    broadcastToRoom(roomId, userId, data);
                    break;
                    
                default:
                    // توجيه عام
                    broadcastToRoom(roomId, userId, data);
            }
            
        } catch (error) {
            console.error('❌ خطأ في معالجة الرسالة:', error);
        }
    });
    
    // عند إغلاق الاتصال
    ws.on('close', () => {
        if (rooms.has(roomId)) {
            const room = rooms.get(roomId);
            room.users.delete(userId);
            
            console.log(`👋 ${userId} غادر غرفة ${roomId} (${room.users.size} مستخدم باقي)`);
            
            // إعلام الآخرين بخروج المستخدم
            broadcastToRoom(roomId, userId, {
                type: 'user-left',
                userId: userId,
                roomId: roomId,
                usersCount: room.users.size,
                timestamp: new Date().toISOString()
            });
            
            // إذا كان المغادر هو المضيف، عيّن مضيفاً جديداً
            if (userId === room.host && room.users.size > 0) {
                const newHost = Array.from(room.users.keys())[0];
                room.host = newHost;
                
                // إعلام المستخدم الجديد أنه أصبح مضيفاً
                const newHostWs = room.users.get(newHost);
                if (newHostWs) {
                    newHostWs.send(JSON.stringify({
                        type: 'host-promoted',
                        userId: newHost,
                        roomId: roomId,
                        timestamp: new Date().toISOString()
                    }));
                }
            }
            
            // حذف الغرفة إذا كانت فارغة
            if (room.users.size === 0) {
                rooms.delete(roomId);
                console.log(`🗑️ حذفت غرفة ${roomId} (فارغة)`);
            }
        }
    });
    
    // معالجة الأخطاء
    ws.on('error', (error) => {
        console.error(`❌ خطأ WebSocket للمستخدم ${userId}:`, error);
    });
});

// دالة البث للغرفة
function broadcastToRoom(roomId, senderId, message) {
    if (rooms.has(roomId)) {
        const room = rooms.get(roomId);
        room.users.forEach((client, userId) => {
            if (userId !== senderId && client.readyState === WebSocket.OPEN) {
                try {
                    client.send(JSON.stringify(message));
                } catch (error) {
                    console.error(`❌ خطأ في إرسال الرسالة لـ ${userId}:`, error);
                }
            }
        });
    }
}

// إرسال رسالة لمستخدم معين
function sendToUser(roomId, targetUserId, message) {
    if (rooms.has(roomId)) {
        const room = rooms.get(roomId);
        const client = room.get(targetUserId);
        if (client && client.readyState === WebSocket.OPEN) {
            try {
                client.send(JSON.stringify(message));
            } catch (error) {
                console.error(`❌ خطأ في إرسال الرسالة لـ ${targetUserId}:`, error);
            }
        }
    }
}

// توليد كود غرفة
function generateRoomId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// توليد معرف مستخدم
function generateUserId() {
    return 'user_' + Math.random().toString(36).substring(2, 10);
}

// إعادة توجيه جميع المسارات الأخرى للصفحة الرئيسية
app.get('*', (req, res) => {
    res.redirect('/');
});

// بدء الخادم
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log(`🚀 تطبيق مشاركة الشاشة يعمل على:`);
    console.log(`   📍 http://localhost:${PORT}`);
    console.log('='.repeat(60));
    console.log('\n📋 معلومات الخادم:');
    console.log(`   Port: ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   WebSocket: ws://localhost:${PORT}`);
    console.log('='.repeat(60));
    console.log('\n🎯 كيفية الاستخدام:');
    console.log('   1. افتح الموقع ← يبدأ مشاركة الشاشة تلقائياً');
    console.log('   2. انسخ الرابط ← أرسله للطرف الآخر');
    console.log('   3. الطرف الآخر يفتح الرابط ← يرى الشاشة مباشرة');
    console.log('='.repeat(60));
});

// إدارة إيقاف الخادم بشكل نظيف
process.on('SIGINT', () => {
    console.log('\n\n🛑 إيقاف الخادم...');
    wss.close();
    server.close(() => {
        console.log('✅ تم إيقاف الخادم بنجاح');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n\n🛑 إيقاف الخادم (SIGTERM)...');
    wss.close();
    server.close(() => {
        console.log('✅ تم إيقاف الخادم بنجاح');
        process.exit(0);
    });
});
