from flask import Flask, request, jsonify
import requests
import json
from datetime import datetime
import re
import math

app = Flask(__name__)

# يضيف رؤوس CORS للسماح لمواقع الويب الأخرى بالاتصال بهذا الخادم
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS'
    return response

class ProjectAnalyzer:
    def __init__(self, api_key: str):
        self.api_key = api_key #api
        self.model = "nex-agi/deepseek-v3.1-nex-n1:free"  #تحديد الموديل 
        self.base_url = "https://openrouter.ai/api/v1"
         
    def _is_valid_project_description(self, description: str) -> bool: 
        description_lower = description.lower()
        software_keywords = [
            'تطبيق', 'برنامج', 'نظام', 'موقع', 'ويب', 'موبايل',
            'برمج', 'برمجة', 'تطوير', 'مشروع', 'قاعدة بيانات',
            'software', 'app', 'website', 'web', 'mobile',
            'application', 'system', 'development', 'database'
        ]
        
        for keyword in software_keywords: 
            if keyword.lower() in description_lower:
                return True
        #
        programming_patterns = [
            r'\b(تطوير|بناء|إنشاء|تصميم)\s+(نظام|تطبيق|موقع|برنامج)',
            r'\b\d+\s*(ساعة|أسبوع|شهر|يوم)\s*(تطوير|برمجة)',
            r'\.(js|py|java|php|html|css|sql)\b',
            r'\b(api|rest|database|server)\b',
            r'واجهة\s+(مستخدم|برمجة)',
            r'قاعدة\s+بيانات'
        ]
        
        for pattern in programming_patterns:
            if re.search(pattern, description_lower, re.IGNORECASE):
                return True
        
        return False
    
    def _extract_team_size(self, description: str) -> int:
        description_lower = description.lower()
        #
        patterns = [
            r'فريق\s+من\s+(\d+)\s+(أفراد|أشخاص|مطورين)',
            r'(\d+)\s+(مبرمج|مطور|عضو|فرد)',
            r'team\s+of\s+(\d+)',
            r'(\d+)\s+(person|member|developer)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, description_lower)
            if match:
                try:
                    team_size = int(match.group(1))
                    if 1 <= team_size <= 50:
                        return team_size
                except:
                    continue
        
        if re.search(r'(فريق صغير|مطور واحد|مطورين اثنين)', description_lower):
            return 3
        elif re.search(r'(فريق متوسط|عدة مطورين)', description_lower):
            return 5
        elif re.search(r'(فريق كبير|عدة فرق)', description_lower):
            return 8
        
        return 0
    
    def _extract_project_type(self, description: str) -> str:
        description_lower = description.lower()
        
        if any(word in description_lower for word in ['موقع', 'ويب', 'website', 'web']):
            return 'تطبيق ويب'
        elif any(word in description_lower for word in ['موبايل', 'جوال', 'mobile', 'app', 'أندرويد', 'ios']):
            return 'تطبيق جوال'
        elif any(word in description_lower for word in ['نظام', 'system', 'إدارة']):
            return 'نظام إدارة'
        elif any(word in description_lower for word in ['منصة', 'platform']):
            return 'منصة إلكترونية'
        else:
            return 'مشروع برمجي'
    
    def _calculate_pert_expected(self, optimistic: float, likely: float, pessimistic: float) -> float:
        return (optimistic + 4 * likely + pessimistic) / 6
    
    def generate_comprehensive_project_plan(self, project_description: str):
        # التحقق مما إذا كان المشروع متعلقاً بالبرمجيات
        if not self._is_valid_project_description(project_description):
            return {
                "success": False,
                "error": "أنا متخصص في توليد خطط المشاريع البرمجية فقط.",
                "detail": "برجاء تقديم وصف لمشروع برمجي (تطبيق، موقع، نظام، برنامج، إلخ)",
                "tip": "استخدم كلمات مثل: تطبيق، موقع، نظام، برنامج، تطوير برمجي، تطوير تطبيق، موقع ويب، نظام إدارة",
                "timestamp": datetime.now().isoformat()
            }
        
        team_size = self._extract_team_size(project_description)
        project_type = self._extract_project_type(project_description)
        
        team_info = f"فريق من {team_size} أفراد" if team_size > 0 else "حجم الفريق غير محدد"
        
        prompt = f"""اعتبر نفسك مهندس برمجيات متخصص في إدارة المشاريع البرمجية وتوليد خطة المشروع الكاملة وأنت مساعد متخصص حصرياً في إدارة المشاريع البرمجية وتخطيطها. مهمتك فقط هي توليد خطط المشاريع البرمجية التي تتألف من مخطط wbsو جدول زمني للمشروع و غانت تشارت(Gantt chart) و جدول إدارة المخاطر.
             2. **التركيز الحصري:** أنت مخصص فقط لتخطيط المشاريع البرمجية. إذا كان الوصف لا يتعلق بإدارة المشاريع البرمجية، أو إذا تم سؤالك عن أي موضوع آخر غير تخطيط المشاريع البرمجية، يجب أن ترفض الرد وتذكر أنك متخصص فقط في توليد خطط المشاريع البرمجية.

            وصف المشروع:
            {project_description[:800]}

            معلومات:
            - نوع المشروع: {project_type}
            - حجم الفريق: {team_info}

            المطلوب:
            1. اسم المشروع والمنهجية
            2. 5-7 أهداف الاساسية قابلة للقياس
            3. 8-10 متطلبات وظيفية الأساسية
                            
            4. هيكل تقسيم العمل (WBS) مفصل حسب المنهجية المختارة:
            أ) **إذا كانت منهجية Waterfall:**
                - المرحلة 1: التحليل والمتطلبات
                - المرحلة 2: التصميم
                - المرحلة 3: التطوير
                - المرحلة 4: الاختبار
                - المرحلة 5: النشر والصيانة


                ب) **إذا كانت منهجية Agile/Scrum:**
                - Sprint 0: الإعداد والتخطيط و التحليل الا,لي
                - Sprint 1: تطوير الميزات الأساسية في المشروع و حدده حسب النواة الرئيسية في النظام  

                و باقي السبرينتات حسب ميزات المشروع يتم بكل sprint تطوير وحدة متكاملة من النظام (Sprint 1, Sprint 2, ...)
                - لكل سبرينت، قم بتحديد المهام.

                ج) **إذا كانت منهجية أخرى:** قم بتقسيم المشروع حسب المراحل المناسبة لتلك المنهجية.
            4. 5-8 مراحل مع:
            - المهام
            - الموارد
            - تقدير PERT (أيام)
            - المخرجات

            5. 5-7 مخاطر اساسية ذات احتمالية خطير عند حدوثها مع خطط تخفيف
            6. تخطيط الموارد

            أرجع JSON فقط بهذا الهيكل:
            {{
            "project_info": {{
                "name": "اسم",
                "type": "{project_type}",
                "methodology": "المنهجية",
                "team_size": {team_size if team_size > 0 else 0}
            }},
            "scope": {{
                "objectives": ["الهدف 1"],
                "requirements": ["المتطلب 1"]
            }},
            "wbs": [
                {{
                "phase": "اسم المرحلة",
                "tasks": ["المهمة 1"],
                "resources": ["الدور 1"],
                "time_estimation": {{
                    "optimistic": 5,
                    "likely": 7,
                    "pessimistic": 10,
                    "expected": 7.2
                }},
                "deliverables": ["المخرج 1"]
                }}
            ],
            "timeline": {{
                "total_duration": "المدة",
                "critical_path": ["المرحلة 1"]
            }},
            "risk_management": [
                {{
                "risk": "وصف الخطر",
                "priority": "عالي",
                "mitigation": "خطة التخفيف"
                }}
            ],
            "resource_plan": {{
                "total_effort": "الجهد",
                "roles_needed": ["مطور"],
                "peak_team_size": {team_size if team_size > 0 else 4}
            }}
            }}

            تعليمات:
            - استخدم الأيام كوحدة زمنية
            - استخدم صيغة PERT: (متفائل + 4×محتمل + متشائم) ÷ 6
            - كن واقعياً"""
        
        if not self.api_key or self.api_key == "YOUR_API_KEY_HERE":
            return {
                "success": False,
                "error": "مفتاح API غير صحيح أو غير موجود",
                "detail": "برجاء التحقق من مفتاح OpenRouter API الخاص بك",
                "timestamp": datetime.now().isoformat()
            }
        
        # إرسال الطلب إلى OpenRouter API
        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://project-planner.com",
            "X-Title": "Project Planning Assistant"
        }
        
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": "أنت خبير في إدارة المشاريع البرمجية. استجب فقط بتنسيق JSON المطلوب."},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 3000,  
            "temperature": 0.1  
        }
        
        try:
            print(f"🤖 الاتصال بـ {self.model}...")
            response = requests.post(url, headers=headers, json=payload, timeout=60)
            
            if response.status_code == 200:
                data = response.json()
                text = data["choices"][0]["message"]["content"]
                
                json_data = self._extract_json(text)
                
                if json_data:
                    processed_data = self._process_and_enhance_data(json_data, team_size, project_type)
                    return {
                        "success": True,
                        "data": processed_data,
                        "timestamp": datetime.now().isoformat()
                    }
                else:
                    print("⚠️ لم يتم استخراج JSON")
                    return {
                        "success": False,
                        "error": "فشل في معالجة الاستجابة من النموذج",
                        "detail": "لم يتمكن النظام من تحليل الرد من الذكاء الاصطناعي",
                        "timestamp": datetime.now().isoformat()
                    }
            else:
                print(f"❌ خطأ API: {response.status_code}")
                error_msg = f"خطأ في الاتصال بمنصة OpenRouter (رمز: {response.status_code})"
                
                if response.status_code == 401:
                    error_msg = "مفتاح API غير صحيح أو منتهي الصلاحية"
                elif response.status_code == 429:
                    error_msg = "تم تجاوز حد الاستخدام المسموح به"
                elif response.status_code == 500:
                    error_msg = "خطأ داخلي في منصة OpenRouter"
                
                return {
                    "success": False,
                    "error": error_msg,
                    "detail": response.text[:200] if response.text else "لا توجد تفاصيل إضافية",
                    "timestamp": datetime.now().isoformat()
                }
                
        except requests.exceptions.Timeout:
            return {
                "success": False,
                "error": "انتهت مهلة الاتصال بالنموذج",
                "detail": "تأخر النموذج في الرد. برجاء المحاولة مرة أخرى",
                "timestamp": datetime.now().isoformat()
            }
        except requests.exceptions.ConnectionError:
            return {
                "success": False,
                "error": "تعذر الاتصال بخدمة النموذج",
                "detail": "برجاء التحقق من اتصال الإنترنت لديك",
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            print(f"⚠️ خطأ: {e}")
            return {
                "success": False,
                "error": "حدث خطأ غير متوقع أثناء معالجة الطلب",
                "detail": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    def _process_and_enhance_data(self, json_data: dict, team_size: int, project_type: str) -> dict:
        if "project_info" not in json_data:
            json_data["project_info"] = {
                "name": "مشروع برمجي",
                "type": project_type,
                "methodology": "Agile/Scrum",
                "team_size": team_size
            }
        
        if "scope" not in json_data:
            json_data["scope"] = {
                "objectives": ["تطوير نظام برمجي متكامل"],
                "requirements": ["تطوير واجهة مستخدم", "بناء قاعدة بيانات"]
            }
        
        if "wbs" in json_data and isinstance(json_data["wbs"], list):
            for phase in json_data["wbs"]:
                if "time_estimation" in phase:
                    time_est = phase["time_estimation"]
                    
                    for key in ["optimistic", "likely", "pessimistic"]:
                        if key in time_est:
                            if isinstance(time_est[key], str):
                                match = re.search(r'(\d+)', str(time_est[key]))
                                if match:
                                    time_est[key] = int(match.group(1))
                            
                            if not isinstance(time_est[key], (int, float)):
                                time_est[key] = 5 if key == "optimistic" else 7 if key == "likely" else 10
                    
                    if "expected" not in time_est:
                        try:
                            o = time_est.get("optimistic", 5)
                            l = time_est.get("likely", 7)
                            p = time_est.get("pessimistic", 10)
                            time_est["expected"] = round(self._calculate_pert_expected(o, l, p), 1)
                        except:
                            time_est["expected"] = 7.0
        
        total_duration = 0
        if "wbs" in json_data:
            for phase in json_data["wbs"]:
                if "time_estimation" in phase and "expected" in phase["time_estimation"]:
                    total_duration += phase["time_estimation"]["expected"]
        
        if "timeline" not in json_data:
            json_data["timeline"] = {
                "total_duration": f"{math.ceil(total_duration/5)} أسابيع",
                "total_days": round(total_duration),
                "critical_path": ["جميع المراحل المتسلسلة"]
            }
        
        if "resource_plan" not in json_data:
            total_effort = total_duration * (team_size if team_size > 0 else 4)
            
            roles = set()
            for phase in json_data.get("wbs", []):
                if "resources" in phase:
                    for resource in phase["resources"]:
                        roles.add(resource.split()[0] if isinstance(resource, str) else str(resource))
            
            json_data["resource_plan"] = {
                "total_effort": f"{round(total_effort)} يوم عمل",
                "roles_needed": list(roles)[:5],
                "peak_team_size": team_size if team_size > 0 else 4
            }
        
        return json_data
    
    def _extract_project_name(self, description: str) -> str:
        patterns = [
            r'تطبيق\s+(.*?)\s+(لـ|لل|لإ|ل)',
            r'نظام\s+(.*?)\s+(لـ|لل|لإ|ل)',
            r'موقع\s+(.*?)\s+(لـ|لل|لإ|ل)',
            r'برنامج\s+(.*?)\s+(لـ|لل|لإ|ل)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, description[:100])
            if match:
                name = match.group(1).strip()
                if len(name) > 3 and len(name) < 30:
                    return name
        
        words = description.split()
        if len(words) >= 3:
            return f"{words[0]} {words[1]} {words[2]}"
        
        return "مشروع برمجي متكامل"
    
    def _extract_json(self, text: str):
        try:
            text = text.strip()
            
            if text.startswith('```'):
                lines = text.split('\n')
                if lines[0].startswith('```'):
                    lines = lines[1:]
                if lines[-1].startswith('```'):
                    lines = lines[:-1]
                text = '\n'.join(lines)
            
            start = text.find('{')
            end = text.rfind('}')
            
            if start == -1 or end == -1:
                return None
            
            json_str = text[start:end+1]
            json_str = json_str.replace("'", '"')
            json_str = re.sub(r',\s*}', '}', json_str)
            json_str = re.sub(r',\s*]', ']', json_str)
            
            return json.loads(json_str)
            
        except json.JSONDecodeError as e:
            print(f"❌ خطأ في JSON: {e}")
            return None
        except Exception as e:
            print(f"❌ خطأ عام: {e}")
            return None

# ==============================================
# تهيئة المحلل مع مفتاح OpenRouter
# ==============================================
API_KEY = "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"
analyzer = ProjectAnalyzer(API_KEY)

# ==============================================
# Endpoints
# ==============================================

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        "message": "🚀 نظام توليد خطط المشاريع البرمجية",
        "version": "2.0.0",
        "model": "nex-agi/deepseek-v3.1-nex-n1:free",
        "description": "متخصص في توليد خطط المشاريع البرمجية فقط",
        "endpoints": {
            "GET /": "صفحة البداية",
            "POST /generate-plan": "توليد خطة مشروع",
            "GET /demo": "عرض نموذج تجريبي"
        },
        "tip": "💡 أرسل وصف مشروع برمجي إلى /generate-plan",
        "examples": [
            "تطبيق جوال للمطاعم مع فريق من 3 أفراد",
            "موقع ويب للتجارة الإلكترونية لمتجر ملابس",
            "نظام إدارة علاقات عملاء (CRM) لشركة",
            "منصة تعليمية عبر الإنترنت مع محتوى تفاعلي"
        ]
    })

@app.route('/demo', methods=['GET'])
def demo():
    demo_desc = "تطبيق ويب لإدارة المهام للفرق البرمجية مع فريق من 5 أفراد"
    team_size = 5
    project_type = "تطبيق ويب"
    
    result = analyzer._get_demo_data(demo_desc, team_size, project_type)
    
    return jsonify({
        "success": True,
        "message": "🎯 نموذج تجريبي",
        "description": demo_desc,
        "data": result["data"],
        "timestamp": datetime.now().isoformat()
    })

def _get_demo_data(self, description: str, team_size: int, project_type: str):
    project_name = self._extract_project_name(description)
    
    wbs_data = [
        {
            "phase": "التحليل والتخطيط",
            "tasks": ["جمع المتطلبات", "تحليل المنافسين", "تحديد المعمارية"],
            "resources": ["محلل نظم", "مدير مشروع"],
            "time_estimation": {
                "optimistic": 5,
                "likely": 7,
                "pessimistic": 10,
                "expected": 7.2
            },
            "deliverables": ["وثيقة المتطلبات", "خطة المشروع"]
        },
        {
            "phase": "التصميم والتطوير",
            "tasks": ["تصميم الواجهات", "تطوير الواجهة الأمامية", "تطوير الواجهة الخلفية"],
            "resources": ["مصمم UX/UI", "مطور Frontend", "مطور Backend"],
            "time_estimation": {
                "optimistic": 15,
                "likely": 20,
                "pessimistic": 25,
                "expected": 20.0
            },
            "deliverables": ["تصاميم الواجهات", "كود المصدر"]
        },
        {
            "phase": "الاختبار والتكامل",
            "tasks": ["اختبار الوحدة", "اختبار التكامل", "اختبار الأداء"],
            "resources": ["مهندس جودة", "مختبر أداء"],
            "time_estimation": {
                "optimistic": 8,
                "likely": 10,
                "pessimistic": 12,
                "expected": 10.0
            },
            "deliverables": ["تقارير الاختبار", "نظام مستقر"]
        },
        {
            "phase": "النشر والدعم",
            "tasks": ["نشر النظام", "تدريب المستخدمين", "الدعم الفني"],
            "resources": ["مسؤول نظام", "مدرب", "دعم فني"],
            "time_estimation": {
                "optimistic": 4,
                "likely": 5,
                "pessimistic": 7,
                "expected": 5.2
            },
            "deliverables": ["نظام منشور", "دليل المستخدم"]
        }
    ]
    
    total_days = sum(phase["time_estimation"]["expected"] for phase in wbs_data)
    
    return {
        "success": True,
        "data": {
            "project_info": {
                "name": project_name,
                "type": project_type,
                "methodology": "Agile/Scrum",
                "team_size": team_size if team_size > 0 else 6
            },
            "scope": {
                "objectives": [
                    "تطوير نظام برمجي متكامل يلبي احتياجات العمل",
                    "تحسين كفاءة العمليات بنسبة 40%",
                    "توفير واجهة مستخدم سهلة الاستخدام"
                ],
                "requirements": [
                    "نظام تسجيل دخول آمن",
                    "واجهة إدارة رئيسية",
                    "إدارة المستخدمين والصلاحيات",
                    "نظام التقارير والإحصائيات",
                    "دعم متعدد اللغات",
                    "توافق مع الأجهزة المحمولة"
                ]
            },
            "wbs": wbs_data,
            "timeline": {
                "total_duration": f"{math.ceil(total_days/5)} أسابيع",
                "total_days": total_days,
                "critical_path": ["التحليل والتخطيط", "التصميم والتطوير", "الاختبار والتكامل"]
            },
            "risk_management": [
                {
                    "risk": "تغيير متطلبات العميل",
                    "priority": "عالي",
                    "mitigation": "اجتماعات أسبوعية + وثيقة متطلبات"
                },
                {
                    "risk": "تأخر التسليم",
                    "priority": "عالي",
                    "mitigation": "تتبع أسبوعي + احتياطي زمني"
                },
                {
                    "risk": "مشاكل أداء النظام",
                    "priority": "متوسط",
                    "mitigation": "اختبار أداء مبكر"
                },
                {
                    "risk": "مشاكل أمنية",
                    "priority": "عالي",
                    "mitigation": "مراجعة أمنية دورية"
                }
            ],
            "resource_plan": {
                "total_effort": f"{total_days * (team_size if team_size > 0 else 6)} يوم عمل",
                "roles_needed": ["مدير مشروع", "محلل نظم", "مطور", "مصمم", "مهندس جودة"],
                "peak_team_size": team_size if team_size > 0 else 6
            }
        },
        "note": "بيانات تجريبية",
        "timestamp": datetime.now().isoformat(),
        "demo": True
    }

# إضافة الدالة كطريقة للمحلل
ProjectAnalyzer._get_demo_data = _get_demo_data

@app.route('/generate-plan', methods=['POST', 'OPTIONS'])
def generate_plan():
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        
        if not data or 'description' not in data:
            return jsonify({
                "success": False,
                "error": "يرجى إرسال وصف المشروع في حقل 'description'"
            }), 400
        
        project_description = data['description'].strip()
        
        if len(project_description) < 30:
            return jsonify({
                "success": False,
                "error": "وصف المشروع قصير جداً. الرجاء تقديم وصف مفصل."
            }), 400
        
        words = project_description.split()
        if len(words) < 10:
            return jsonify({
                "success": False,
                "error": "يجب أن يحتوي وصف المشروع على 10 كلمات على الأقل"
            }), 400
        
        print(f"📋 معالجة مشروع: {project_description[:80]}...")
        
        result = analyzer.generate_comprehensive_project_plan(project_description)
        
        return jsonify(result)
        
    except Exception as e:
        print(f"❌ خطأ في الخادم: {e}")
        return jsonify({
            "success": False,
            "error": f"خطأ في الخادم: {str(e)}"
        }), 500

# ==============================================
# تشغيل الخادم
# ==============================================
if __name__ == '__main__':
    print("=" * 60)
    print("🚀 مشروع Project Plan Generator - OpenRouter Edition")
    print("=" * 60)
    print(f"🤖 النموذج: {analyzer.model}")
    print("🎯 التخصص: إدارة المشاريع البرمجية فقط")
    print("🌐 http://localhost:5000")
    print("📊 /demo - نموذج تجريبي")
    print("📝 /generate-plan - توليد خطة")
    print("⚠️  ملاحظة: النظام متخصص في المشاريع البرمجية فقط")
    print("=" * 60)
    
    app.run(debug=True, host='0.0.0.0', port=5000)