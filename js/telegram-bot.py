import telebot
import json
import os
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

# معالجة الأوامر
@bot.message_handler(commands=['start'])
def start_command(message):
    if str(message.chat.id) != ADMIN_CHAT_ID:
        bot.send_message(message.chat.id, "⛔ هذا البوت للمدير فقط")
        return
    
    keyboard = telebot.types.ReplyKeyboardMarkup(resize_keyboard=True)
    keyboard.add("📋 الاستبيانات المعلقة", "✅ المقبولة")
    keyboard.add("📊 الإحصائيات", "🔄 تحديث")
    
    welcome = """
🛠️ *لوحة تحكم نظام الاستبيانات*

📌 *معلومات النظام:*
• نظام استبيانات مفتوح
• لا يوجد سحب أو هدايا
• كل استبيان يصل كرسالة مباشرة
• يمكنك الموافقة أو الرفض

📋 *الأوامر المتاحة:*
/pending - عرض الاستبيانات المعلقة
/approved - عرض المقبولة
/stats - الإحصائيات

⚡ *ملاحظة:* عندما يرسل مستخدم استبياناً، ستصل لك رسالة مع أزرار للموافقة/الرفض
"""
    
    bot.send_message(message.chat.id, welcome, 
                     parse_mode='Markdown', reply_markup=keyboard)

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
        survey_text = format_survey_message(survey)
        
        keyboard = telebot.types.InlineKeyboardMarkup()
        keyboard.row(
            telebot.types.InlineKeyboardButton("✅ قبول", callback_data=f"approve_{survey['surveyId']}"),
            telebot.types.InlineKeyboardButton("❌ رفض", callback_data=f"reject_{survey['surveyId']}")
        )
        
        bot.send_message(message.chat.id, survey_text, 
                         parse_mode='Markdown', reply_markup=keyboard)

@bot.message_handler(commands=['stats'])
def show_stats(message):
    if str(message.chat.id) != ADMIN_CHAT_ID:
        return
    
    surveys = load_surveys()
    
    total = len(surveys)
    pending = len([s for s in surveys if s.get('status') == 'pending'])
    approved = len([s for s in surveys if s.get('status') == 'approved'])
    rejected = len([s for s in surveys if s.get('status') == 'rejected'])
    
    stats_text = f"""
📈 *إحصائيات النظام*

📊 *الأرقام:*
• إجمالي الاستبيانات: {total}
• بانتظار المراجعة: {pending}
• المقبولة: {approved}
• المرفوضة: {rejected}

⏰ *آخر تحديث:* {datetime.now().strftime('%Y-%m-%d %H:%M')}
"""
    
    bot.send_message(message.chat.id, stats_text, parse_mode='Markdown')

# معالجة الاستبيانات الجديدة
@bot.message_handler(regexp=r'🎉 \*استبيان مكتمل')
def handle_complete_survey(message):
    # استخراج surveyId من الرسالة
    import re
    survey_id_match = re.search(r'رقم الاستبيان.*`([^`]+)`', message.text)
    
    if survey_id_match:
        survey_id = survey_id_match.group(1)
        
        # حفظ الاستبيان
        surveys = load_surveys()
        
        new_survey = {
            'surveyId': survey_id,
            'message_id': message.message_id,
            'status': 'pending',
            'received_at': datetime.now().isoformat(),
            'raw_message': message.text
        }
        
        surveys.append(new_survey)
        save_surveys(surveys)
        
        # إضافة أزرار التحكم للرسالة الأصلية
        keyboard = telebot.types.InlineKeyboardMarkup()
        keyboard.row(
            telebot.types.InlineKeyboardButton("✅ قبول", callback_data=f"approve_{survey_id}"),
            telebot.types.InlineKeyboardButton("❌ رفض", callback_data=f"reject_{survey_id}")
        )
        
        try:
            bot.edit_message_reply_markup(
                chat_id=message.chat.id,
                message_id=message.message_id,
                reply_markup=keyboard
            )
        except:
            pass

# معالجة أزرار الموافقة/الرفض
@bot.callback_query_handler(func=lambda call: call.data.startswith(('approve_', 'reject_')))
def handle_approval(call):
    action, survey_id = call.data.split('_', 1)
    
    surveys = load_surveys()
    
    for survey in surveys:
        if survey.get('surveyId') == survey_id:
            survey['status'] = 'approved' if action == 'approve' else 'rejected'
            survey['reviewed_by'] = call.from_user.username or "مدير"
            survey['reviewed_at'] = datetime.now().isoformat()
            
            if save_surveys(surveys):
                # تحديث رسالة البوت
                status_text = "مقبول ✅" if action == 'approve' else "مرفوض ❌"
                
                try:
                    bot.edit_message_text(
                        chat_id=call.message.chat.id,
                        message_id=call.message.message_id,
                        text=call.message.text + f"\n\n📌 *الحالة:* {status_text}",
                        parse_mode='Markdown'
                    )
                except:
                    pass
                
                bot.answer_callback_query(call.id, f"✅ تم {status_text} الاستبيان")
            break

# تنسيق رسالة الاستبيان
def format_survey_message(survey):
    # يمكن إضافة المزيد من التنسيق هنا
    return survey.get('raw_message', '📄 استبيان')

# معالجة الأزرار النصية
@bot.message_handler(func=lambda m: m.text in ["📋 الاستبيانات المعلقة", "✅ المقبولة", "📊 الإحصائيات", "🔄 تحديث"])
def handle_buttons(message):
    if message.text == "📋 الاستبيانات المعلقة":
        show_pending(message)
    elif message.text == "✅ المقبولة":
        show_approved(message)
    elif message.text == "📊 الإحصائيات":
        show_stats(message)
    elif message.text == "🔄 تحديث":
        bot.send_message(message.chat.id, "🔄 *تم تحديث البيانات*", parse_mode='Markdown')

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
        approved_text += f"{i}. `{survey.get('surveyId', 'N/A')}`\n"
    
    bot.send_message(message.chat.id, approved_text, parse_mode='Markdown')

# بدء البوت
if __name__ == "__main__":
    print("🤖 بوت نظام الاستبيانات يعمل...")
    print("📝 نظام مفتوح - بلا سحب أو هدايا")
    print(f"👤 المدير: {ADMIN_CHAT_ID}")
    print("⏳ في انتظار الاستبيانات...")
    
    try:
        bot.polling(none_stop=True, interval=1)
    except Exception as e:
        print(f"❌ خطأ في تشغيل البوت: {e}")