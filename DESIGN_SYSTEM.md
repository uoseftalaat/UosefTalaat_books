# 🎨 نظام التصميم — موقع يوسف طلعت للقراءة

> موقع عربي كامل (RTL) بأسلوب تحريري راقٍ مستوحى من مراجع التصميم المقدمة.

---

## 1. الاتجاه والغة

```css
html {
  direction: rtl;
  lang: ar;
}
```

- الموقع **كاملاً بالعربية**
- `dir="rtl"` على عنصر `<html>`
- كل عناوين عربية الاتجاه بشكل افتراضي
- عناوين الكتب الإنجليزية تُلف بـ `<span dir="ltr" lang="en">`

---

## 2. لوحة الألوان

### الألوان الأساسية (مستوحاة من مراجع التصميم)

```css
:root {
  /* خلفيات */
  --color-bg:        #F5F1EB;   /* أوف-وايت دافئ — خلفية الصفحة */
  --color-surface:   #FFFFFF;   /* أبيض نقي — البطاقات */
  --color-dark:      #1C1A17;   /* أسود دافئ — الأقسام الداكنة */
  --color-dark-2:    #2A2520;   /* داكن ثانوي — hover، overlays */

  /* نصوص */
  --color-text:      #1C1A17;   /* نص رئيسي */
  --color-text-muted:#7A7367;   /* نص ثانوي، تسميات توضيحية */
  --color-text-faint:#B5AFA5;   /* نص خافت، metadata */
  --color-on-dark:   #F5F1EB;   /* نص على خلفية داكنة */

  /* تمييز */
  --color-accent:    #C0392B;   /* أحمر داكن — نجوم، تمييز */
  --color-accent-warm:#D4956A;  /* ذهبي دافئ — حدود، عناصر فاخرة */
  --color-accent-light:#F0E6D3; /* ذهبي فاتح — تعبئة خافتة */

  /* فائدية */
  --color-border:    #DDD8CF;   /* حدود بطاقات */
  --color-shadow:    rgba(28,26,23,0.08); /* ظل ناعم */
  --color-overlay:   rgba(28,26,23,0.55); /* تعتيم على الصور */
}
```

### توزيع الألوان على الأقسام

| القسم                  | الخلفية           | النص              |
|------------------------|-------------------|-------------------|
| هيرو                   | صورة + overlay    | `--color-on-dark` |
| عني                    | `--color-bg`      | `--color-text`    |
| وسائل التواصل          | `--color-surface` | `--color-text`    |
| أقرأ حالياً           | `--color-accent-light` | `--color-text` |
| كتب 5 نجوم (slider)   | `--color-dark`    | `--color-on-dark` |
| كل الكتب               | `--color-bg`      | `--color-text`    |

---

## 3. الطباعة (Typography)

### خط العناوين الرئيسية — Hero Font

المرجع: https://www.behance.net/gallery/36109373/Arabic-Typography/modules/536981629  
**الأسلوب:** خط عربي تحريري / إبداعي بضربات خطية سميكة وشكل درامي.  
**أقرب مكافئ ويب مجاني:** **Reem Kufi** (Google Fonts) — Fatimid Kufic revival بنفس الطاقة البصرية.

### نظام الخطوط الكامل

```css
/* استيراد الخطوط */
@import url('https://fonts.googleapis.com/css2?family=Reem+Kufi:wght@400;500;600;700&family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Tajawal:wght@300;400;500;700&display=swap');

:root {
  /* Hero / Display — Reem Kufi */
  /* الاستخدام: عناوين الهيرو الكبيرة، قسم العنوان الرئيسي */
  --font-display: 'Reem Kufi', 'Cairo', serif;

  /* Editorial / Headings — Amiri */
  /* الاستخدام: عناوين الأقسام، أسماء الكتب، اقتباسات */
  --font-editorial: 'Amiri', 'Georgia', serif;

  /* Body / UI — Tajawal */
  /* الاستخدام: نص الجسم، عناوين البطاقات، أزرار، واجهة */
  --font-body: 'Tajawal', 'Arial', sans-serif;
}
```

### منطق اختيار كل خط

| الخط       | السبب |
|------------|-------|
| **Reem Kufi**  | أقرب مكافئ للخط التحريري بالمرجع — هندسي، جريء، عربي أصيل، يناسب العناوين الكبيرة على الهيرو |
| **Amiri**      | خط نسخي كلاسيكي مستوحى من مطبعة بولاق — يمنح طابعاً أدبياً راقياً لعناوين أسماء الكتب والاقتباسات |
| **Tajawal**    | sans-serif عربي حديث، هندسي خفيف — يوازن الرسمية الكلاسيكية بسهولة القراءة في الواجهة |

### تدرج الأحجام (Type Scale)

```css
:root {
  --text-xs:    0.75rem;   /* 12px — metadata، labels */
  --text-sm:    0.875rem;  /* 14px — captions، tags */
  --text-base:  1rem;      /* 16px — نص الجسم */
  --text-md:    1.125rem;  /* 18px — نص بارز */
  --text-lg:    1.25rem;   /* 20px — عناوين بطاقات */
  --text-xl:    1.5rem;    /* 24px — عناوين فرعية */
  --text-2xl:   2rem;      /* 32px — عناوين أقسام */
  --text-3xl:   2.5rem;    /* 40px — عناوين كبيرة */
  --text-4xl:   3.5rem;    /* 56px — hero subtitle */
  --text-hero:  5rem;      /* 80px — hero display */
  --text-mega:  7rem;      /* 112px — hero خاص */
}
```

### استخدام الخطوط حسب الدور

| العنصر                         | الخط              | الحجم          | الوزن |
|--------------------------------|-------------------|----------------|-------|
| عنوان الهيرو الكبير            | Reem Kufi         | `--text-mega`  | 700   |
| tagline الهيرو                 | Reem Kufi         | `--text-4xl`   | 500   |
| عناوين الأقسام                 | Amiri             | `--text-3xl`   | 700   |
| اسم الكتاب (featured)          | Amiri             | `--text-2xl`   | 700   |
| اسم الكتاب (card)              | Tajawal           | `--text-lg`    | 700   |
| اسم المؤلف                     | Tajawal           | `--text-sm`    | 400   |
| نص الجسم / وصف                 | Tajawal           | `--text-base`  | 400   |
| Label / Tag / Meta             | Tajawal (uppercase) | `--text-xs`  | 500   |
| اقتباس                         | Amiri Italic      | `--text-xl`    | 400   |

### خصائص الطباعة العربية

```css
/* إعدادات عالمية للنص العربي */
body {
  font-family: var(--font-body);
  font-size: var(--text-base);
  line-height: 1.8;          /* مسافة بين الأسطر أكبر للعربية */
  letter-spacing: 0;          /* لا تباعد للعربية */
  text-align: right;
  direction: rtl;
  font-feature-settings: 'kern' 1, 'liga' 1, 'calt' 1;
}

/* ضبط خاص للعناوين الكبيرة */
.font-display {
  font-family: var(--font-display);
  line-height: 1.15;
  font-kerning: normal;
}

/* خط تحريري للاقتباسات وأسماء الكتب */
.font-editorial {
  font-family: var(--font-editorial);
  line-height: 1.5;
}
```

---

## 4. المسافات والتخطيط

```css
:root {
  /* spacing scale */
  --space-1:   4px;
  --space-2:   8px;
  --space-3:   12px;
  --space-4:   16px;
  --space-5:   20px;
  --space-6:   24px;
  --space-8:   32px;
  --space-10:  40px;
  --space-12:  48px;
  --space-16:  64px;
  --space-20:  80px;
  --space-24:  96px;
  --space-32: 128px;

  /* containers */
  --container-max:  1200px;
  --container-lg:   960px;
  --container-sm:   720px;

  /* section padding */
  --section-py:     var(--space-20);
  --section-px:     var(--space-6);

  /* card */
  --card-radius:    4px;
  --card-padding:   var(--space-6);
  --card-shadow:    0 2px 12px var(--color-shadow);
  --card-shadow-hover: 0 8px 32px rgba(28,26,23,0.15);
}
```

---

## 5. أنماط المكونات

### 5.1 بطاقة الكتاب

```css
.book-card {
  position: relative;
  background: var(--color-surface);
  border-radius: var(--card-radius);
  overflow: hidden;
  box-shadow: var(--card-shadow);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  aspect-ratio: 2 / 3;
  cursor: pointer;
}

.book-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--card-shadow-hover);
}

.book-card__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, var(--color-dark) 60%, transparent);
  opacity: 0;
  transition: opacity 0.25s ease;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.book-card:hover .book-card__overlay { opacity: 1; }
```

### 5.2 السلايدر ثلاثي الأبعاد

```css
.slider-stage {
  perspective: 1200px;
  perspective-origin: 50% 50%;
  height: 520px;
  position: relative;
}

.slider-item {
  position: absolute;
  width: 280px;
  transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              opacity 0.6s ease,
              filter 0.6s ease;
  transform-origin: center center;
  transform-style: preserve-3d;
}

/* المركز */
.slider-item[data-pos="0"] {
  transform: translateX(-50%) translateZ(0) rotateY(0deg);
  opacity: 1;
  filter: brightness(1);
  z-index: 5;
}
/* جانب 1 */
.slider-item[data-pos="1"] {
  transform: translateX(calc(-50% + 260px)) translateZ(-180px) rotateY(-25deg);
  opacity: 0.85;
  filter: brightness(0.75);
  z-index: 4;
}
.slider-item[data-pos="-1"] {
  transform: translateX(calc(-50% - 260px)) translateZ(-180px) rotateY(25deg);
  opacity: 0.85;
  filter: brightness(0.75);
  z-index: 4;
}
/* جانب 2 */
.slider-item[data-pos="2"] {
  transform: translateX(calc(-50% + 440px)) translateZ(-340px) rotateY(-40deg);
  opacity: 0.5;
  filter: brightness(0.5);
  z-index: 3;
}
.slider-item[data-pos="-2"] {
  transform: translateX(calc(-50% - 440px)) translateZ(-340px) rotateY(40deg);
  opacity: 0.5;
  filter: brightness(0.5);
  z-index: 3;
}
```

### 5.3 النجوم

```css
.stars {
  display: flex;
  gap: var(--space-1);
  flex-direction: row-reverse; /* RTL: النجوم تبدأ من اليمين */
  color: var(--color-accent);
  font-size: var(--text-md);
}
```

### 5.4 أزرار

```css
/* زر رئيسي */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-8);
  background: var(--color-text);
  color: var(--color-on-dark);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 500;
  border: none;
  border-radius: var(--card-radius);
  cursor: pointer;
  transition: background 0.2s ease;
  text-decoration: none;
}
.btn-primary:hover { background: var(--color-dark-2); }

/* زر ثانوي */
.btn-outline {
  border: 1.5px solid var(--color-text);
  color: var(--color-text);
  background: transparent;
  padding: var(--space-3) var(--space-8);
  border-radius: var(--card-radius);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}
.btn-outline:hover {
  background: var(--color-text);
  color: var(--color-on-dark);
}

/* زر على خلفية داكنة */
.btn-light {
  border: 1.5px solid var(--color-on-dark);
  color: var(--color-on-dark);
  background: transparent;
}
.btn-light:hover {
  background: var(--color-on-dark);
  color: var(--color-text);
}
```

---

## 6. نقاط التوقف (Breakpoints)

```css
/* Mobile First */
:root {
  --bp-sm:  640px;
  --bp-md:  768px;
  --bp-lg:  1024px;
  --bp-xl:  1280px;
}

/* الاستخدام */
@media (min-width: 640px)  { /* tablet صغير */ }
@media (min-width: 768px)  { /* tablet */ }
@media (min-width: 1024px) { /* desktop */ }
@media (min-width: 1280px) { /* wide */ }
```

### تغيرات التخطيط

| القسم          | موبايل        | تابلت          | ديسكتوب       |
|----------------|---------------|----------------|---------------|
| هيرو           | عمود واحد     | عمود واحد      | عمود واحد     |
| عني + يوتيوب   | عمود واحد     | عمود واحد      | عمودان 50/50  |
| السوشيال       | عمود واحد     | عمودان         | 3 أعمدة       |
| شبكة الكتب    | عمودان        | 3–4 أعمدة      | 5–6 أعمدة    |
| السلايدر 3D   | عمود واحد بدون 3D | 3 كتب      | 5 كتب         |

---

## 7. الحركة والتحولات

```css
:root {
  --duration-fast:   150ms;
  --duration-base:   250ms;
  --duration-slow:   500ms;
  --duration-slider: 600ms;

  --ease-default: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --ease-bounce:  cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-in-out:  cubic-bezier(0.4, 0, 0.2, 1);
}

/* إلغاء الحركات للمستخدمين الذين يفضلون ذلك */
@media (prefers-reduced-motion: reduce) {
  .slider-item { transition: none; }
  * { animation-duration: 0.01ms !important; }
}
```

---

## 8. نصوص الواجهة بالعربية

```js
// i18n strings
const UI_TEXT = {
  nav: {
    about:          'عني',
    currentlyReading: 'أقرأ الآن',
    topBooks:       'أفضل كتبي',
    allBooks:       'كل الكتب',
  },
  hero: {
    name:      'يوسف طلعت',
    tagline:   'قارئ · مفكر · مستكشف بين السطور',
    scrollCta: 'اكتشف المزيد',
  },
  sections: {
    about:           'عني',
    youtubeLabel:    'شاهدني أيضاً على يوتيوب',
    social:          'تواجدي الرقمي',
    currentlyReading:'أقرأ حالياً',
    fiveStars:       'كتب تركت أثراً',
    allBooks:        'كل ما قرأت',
    totalBooks:      'كتاباً قرأتها حتى الآن',
  },
  filters: {
    all:       'الكل',
    fiveStars: '٥ نجوم',
    fourStars: '٤ نجوم',
    threeStars:'٣ نجوم',
    arabic:    'عربي',
    english:   'إنجليزي',
  },
  book: {
    viewOnGoodreads: 'عرض على Goodreads',
    pages:           'صفحة',
    published:       'نُشر:',
  },
  social: {
    youtube: {
      name:  'يوتيوب',
      desc:  'أفكار عن الكتب والأفكار والحياة',
      cta:   'اشترك في القناة',
    },
    goodreads: {
      name:  'Goodreads',
      desc:  '٢١٧ كتاباً في مكتبتي',
      cta:   'تابعني على Goodreads',
    },
    instagram: {
      name:  'إنستجرام',
      desc:  'لحظات من القراءة واليومي',
      cta:   'تابعني على إنستجرام',
    },
  },
  currentlyReading: {
    label: 'أقرأ حالياً',
    badge: '◉ جارٍ القراءة',
  },
  loadMore: 'تحميل المزيد',
};
```

---

## 9. نص البيو (مسودة عربية)

```
بقرأ كتير.
مش لأني ذكي — لأني فضولي.

٢١٧ كتاب في التاريخ والفكر والأدب والجريمة،
وكل كتاب علّمني إن في أكتر مما أعرفه.

بشارككم اللي بقرأه على يوتيوب وإنستجرام —
بعيون حد بيتعلم، مش حد بيحاضر.
```

---

## 10. ملاحظات RTL التقنية

### قواعد يجب اتباعها
1. `margin-right` → `margin-inline-start` (أو استخدم logical properties)
2. `float: right` → `float: inline-start`
3. `text-align: left` → `text-align: start`
4. أيقونات السهم: اعكسها في RTL باستخدام `transform: scaleX(-1)`
5. السلايدر: عكس اتجاه الزر (السابق/التالي)

### Logical Properties (مفضّلة)
```css
/* بدل left/right */
margin-inline-start: auto;
padding-inline-end: 1rem;
border-inline-start: 2px solid var(--color-accent);
inset-inline-start: 0;
```

---

## 11. الأيقونات

جميع الأيقونات **SVG inline** لا icon fonts:

| الأيقونة    | الاستخدام |
|-------------|-----------|
| ★ ☆         | تقييم النجوم |
| ⟩ ⟨         | تنقل السلايدر (معكوسة في RTL) |
| ↓           | scroll indicator |
| YouTube SVG | بطاقة يوتيوب |
| Goodreads SVG | بطاقة Goodreads |
| Instagram SVG | بطاقة إنستجرام |
| ◉           | مؤشر "جارٍ القراءة" |

---

## 12. صورة البروفايل

- **الملف:** `assets/images/profile.png`
- **النمط:** film strip selfie بإطار سينمائي
- **الاستخدام في الهيرو:** full-bleed خلفية + gradient overlay داكن
- **الاستخدام في "عني":** صورة دائرية `border-radius: 50%` + حد `3px solid var(--color-accent-warm)`
- **filter اختياري:** `filter: contrast(1.05) saturate(0.95)` لتنسجم مع الطابع التحريري

---

## 13. لقطات التصميم المرجعية

**Image 1 (Murakami.lab):** الهيرو الكبير مع الصورة + العنوان التحريري، قسم الكتاب المميز، معرض أغلفة الكتب الداكن.  
**Image 2 (Authore Theme):** بطاقات الكتب النظيفة، الشبكة المنظمة، الاقتباسات.

**الاتجاه المدمج:** خلفية كريمية دافئة، عناوين خط Reem Kufi الجريء، أقسام داكنة للكتب المميزة، وطابع تحريري أنيق.
