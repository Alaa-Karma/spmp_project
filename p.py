import requests
import json

KEY = "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"
MODEL = "meta-llama/llama-3.2-3b-instruct:free"

print("=" * 50)
print("🧪 اختبار المفتاح والنموذج في التيرمينال")
print("=" * 50)

# 1. اختبار الاتصال
print("\n1️⃣ اختبار الاتصال الأساسي...")
headers = {"Authorization": f"Bearer {KEY}"}

try:
    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers=headers,
        json={
            "model": MODEL,
            "messages": [{"role": "user", "content": "مرحبا"}],
            "max_tokens": 5
        },
        timeout=10
    )
    
    print(f"📡 حالة الاتصال: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        reply = data['choices'][0]['message']['content']
        print(f"✅ الاتصال ناجح!")
        print(f"📝 الرد: {reply}")
    elif response.status_code == 429:
        print("⚠️  تجاوزت الحد المسموح")
        print("💡 انتظر 60 ثانية وحاول مرة أخرى")
    elif response.status_code == 401:
        print("❌ المفتاح غير صالح")
    else:
        print(f"❌ خطأ: {response.text[:100]}")
        
except Exception as e:
    print(f"❌ فشل الاتصال: {e}")

# 2. اختبار خطة مشروع
print("\n" + "=" * 50)
print("2️⃣ اختبار توليد خطة مشروع...")

project_desc = "تطبيق لإدارة المهام اليومية"

try:
    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers=headers,
        json={
            "model": MODEL,
            "messages": [
                {
                    "role": "system", 
                    "content": "أنت مساعد متخصص في تطوير البرمجيات. أجب باللغة العربية."
                },
                {
                    "role": "user", 
                    "content": f"أنشئ خطة مشروع مختصرة لـ: {project_desc}"
                }
            ],
            "max_tokens": 300
        },
        timeout=15
    )
    
    if response.status_code == 200:
        data = response.json()
        plan = data['choices'][0]['message']['content']
        
        print("✅ تم توليد خطة المشروع بنجاح!")
        print("\n" + "=" * 50)
        print("📋 خطة المشروع:")
        print("=" * 50)
        print(plan)
    else:
        print(f"❌ فشل: {response.status_code}")
        
except Exception as e:
    print(f"❌ خطأ: {e}")

# 3. النتيجة النهائية
print("\n" + "=" * 50)
print("🎯 النتيجة النهائية:")
print("=" * 50)

if 'response' in locals() and response.status_code == 200:
    print("✅ المفتاح والنموذج فعالين وجاهزين للاستخدام!")
    print(f"\n🔑 المفتاح: صالح")
    print(f"🤖 النموذج: {MODEL}")
    print(f"⚡ الحالة: نشط")
else:
    print("❌ هناك مشكلة في المفتاح أو النموذج")
    print("\n🔧 الحلول المقترحة:")
    print("1. انتظر دقيقة وحاول مرة أخرى")
    print("2. تأكد من صلاحية المفتاح")
    print("3. جرب نموذجاً آخر")

print("\n" + "=" * 50)