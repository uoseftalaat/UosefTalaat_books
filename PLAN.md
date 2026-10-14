# 📚 يوسف طلعت — موقع القراءة الشخصي

## نظرة عامة

موقع شخصي ثابت مستضاف على **GitHub Pages** يعرض حياة القراءة ليوسف طلعت.  
بيانات الكتب تُسحب من Goodreads RSS عبر **GitHub Actions شهري** يحلل البيانات ويحفظها ملفات JSON في المستودع — لا يحتاج سيرفر.  
الموقع **بالكامل بالعربية** مع اتجاه RTL.

---

## روابط المشروع

| المنصة     | الرابط |
|------------|--------|
| YouTube    | https://www.youtube.com/uoseftalaat |
| Goodreads  | https://www.goodreads.com/user/show/116793505-uosef-talaat |
| Instagram  | https://www.instagram.com/uoseftalaat/ |

---

## هيكل المستودع

```
Uosef_talaat_books/
├── .github/
│   └── workflows/
│       └── fetch-books.yml          # GitHub Actions cron شهري
├── data/
│   ├── books.json                   # كل الكتب (من RSS)
│   ├── currently-reading.json       # أقرأ حالياً
│   ├── five-stars.json              # كتب 5 نجوم (آخر 5)
│   └── youtube.json                 # أشهر فيديوهات يوتيوب (hardcoded)
├── assets/
│   ├── css/
│   │   └── styles.css               # ملف CSS الرئيسي
│   ├── js/
│   │   ├── main.js                  # تهيئة الصفحة
│   │   ├── slider.js                # السلايدر ثلاثي الأبعاد
│   │   └── books.js                 # عرض الكتب من JSON
│   └── images/
│       └── profile.png              # صورة البروفايل (من إنستجرام)
├── scripts/
│   └── fetch-goodreads.js           # سكريبت Node.js لـ GitHub Actions
├── index.html                       # الموقع الرئيسي (صفحة واحدة)
├── DESIGN_SYSTEM.md                 # دليل نظام التصميم
├── package.json                     # تبعيات Node.js
└── PLAN.md                          # هذا الملف
```

---

## أقسام الموقع

### 1. الهيرو / التنقل
- **شريط تنقل ثابت:** الاسم كشعار، روابط (عني، أقرأ حالياً، كتب ⭐⭐⭐⭐⭐، كل الكتب)
- **قسم هيرو بملء الشاشة:**
  - صورة يوسف (film strip style) + تدرج لوني داكن
  - عنوان عرض كبير: "يوسف طلعت" + الوصف: "قارئ. مفكر. مستكشف بين السطور."
  - سهم تمرير متحرك

### 2. عني + يوتيوب
- عمودان (نص يمين، فيديوهات يسار على RTL)
- نص بيو بالعربية + صورة دائرية
- شبكة أشهر 4 فيديوهات (hardcoded في youtube.json بدون API)

### 3. وسائل التواصل الاجتماعي
- 3 بطاقات: يوتيوب، Goodreads، إنستجرام
- كل بطاقة: أيقونة المنصة، وصف قصير، زر CTA

### 4. أقرأ حالياً
- بيانات من `data/currently-reading.json`
- الكتاب الحالي: *22 Cells in Nuremberg* — Douglas M. Kelley
- غلاف كبير + عنوان + مؤلف + وصف + رابط Goodreads

### 5. كتب ⭐⭐⭐⭐⭐ — سلايدر ثلاثي الأبعاد
- آخر 5 كتب حصلت على 5 نجوم
- خلفية داكنة درامية
- CSS perspective slider + touch/keyboard support

### 6. كل الكتب المقروءة
- شبكة متجاوبة مع فلتر (الكل / بالتقييم / بالغة)
- تحميل 20 كتاباً في كل مرة
- عدد إجمالي: 217 كتاب

---

## سير عمل GitHub Actions

```yaml
# يعمل في اليوم الأول من كل شهر الساعة 6 صباحاً UTC
on:
  schedule:
    - cron: '0 6 1 * *'
  workflow_dispatch:
```

### ما يفعله السكريبت
1. جلب RSS لكل الكتب → `data/books.json`
2. جلب RSS للأقرأ حالياً → `data/currently-reading.json`
3. تصفية كتب 5 نجوم (آخر 5) → `data/five-stars.json`
4. حفظ التغييرات وpush للمستودع

> ملاحظة: فيديوهات يوتيوب hardcoded في `data/youtube.json` (بدون API key)

---

## GitHub Pages

1. رفع المستودع على GitHub
2. Settings → Pages → Source: `main` / `/ (root)`
3. الموقع يعمل على: `https://uoseftalaat.github.io/Uosef_talaat_books/`
4. كل المسارات نسبية (relative URLs)

---

## المكدس التقني

| الطبقة      | التقنية |
|-------------|---------|
| HTML        | HTML5 دلالي، صفحة واحدة `index.html` |
| CSS         | Vanilla CSS + Custom Properties + Grid + Flexbox |
| JavaScript  | Vanilla ES6+، بلا فريمووك |
| الاتجاه    | RTL كامل (`dir="rtl"` على `<html>`) |
| الخطوط     | راجع `DESIGN_SYSTEM.md` |
| البيانات    | ملفات JSON ثابتة، تُحمّل بـ `fetch()` |
| CI/CD       | GitHub Actions (شهري + يدوي) |
| الاستضافة  | GitHub Pages |

---

## مراحل التنفيذ

### المرحلة 1 — البنية والبيانات
- [ ] `package.json` مع `node-fetch`، `xml2js`
- [ ] `scripts/fetch-goodreads.js` — جلب وتحليل وحفظ
- [ ] `.github/workflows/fetch-books.yml`
- [ ] تشغيل السكريبت محلياً → إنشاء ملفات JSON الأولية
- [ ] `data/youtube.json` hardcoded بأشهر الفيديوهات

### المرحلة 2 — HTML وCSS
- [ ] `index.html` (كل الأقسام، RTL كامل)
- [ ] `assets/css/styles.css` (tokens، typography، layouts)
- [ ] تحميل الخطوط العربية
- [ ] نظام الشبكة المتجاوب

### المرحلة 3 — JavaScript
- [ ] `books.js` — عرض الكتب + فلتر + pagination
- [ ] `slider.js` — السلايدر 3D + touch + keyboard
- [ ] `main.js` — smooth scroll، nav states

### المرحلة 4 — الصقل والنشر
- [ ] meta tags للـ SEO + Open Graph
- [ ] اختبار Lighthouse (هدف ≥ 90)
- [ ] إعداد GitHub Pages
- [ ] اختبار على المتصفحات والموبايل
