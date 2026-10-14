/**
 * Genre Enrichment Module
 * Classifies books into coherent Arabic literary genres using Goodreads community genres,
 * author/title heuristics, and an Arabic literary taxonomy.
 */

import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';

const DATA_DIR = path.resolve('data');
const CACHE_FILE = path.join(DATA_DIR, 'genres-cache.json');

// Standard Arabic Genre Categories
export const GENRE_CATEGORIES = {
  HORROR: 'رعب وإثارة',
  CRIME: 'جريمة وغموض',
  ROMANCE: 'رومانسي وعلاقات',
  PSYCHOLOGY: 'علم نفس وتطوير ذات',
  LITERATURE: 'روايات وأدب',
  SCIFI: 'خيال علمي وفانتازيا',
  HISTORY: 'تاريخ وسير',
  PHILOSOPHY: 'فلسفة وفكر وعلوم'
};

// Goodreads Genre Name -> Arabic Category Mapping
const GOODREADS_GENRE_MAP = {
  // Horror & Thriller
  'horror': GENRE_CATEGORIES.HORROR,
  'thriller': GENRE_CATEGORIES.HORROR,
  'psychological thriller': GENRE_CATEGORIES.HORROR,
  'suspense': GENRE_CATEGORIES.HORROR,
  'gothic': GENRE_CATEGORIES.HORROR,
  'supernatural': GENRE_CATEGORIES.HORROR,
  'paranormal': GENRE_CATEGORIES.HORROR,
  'ghosts': GENRE_CATEGORIES.HORROR,

  // Crime & Mystery
  'crime': GENRE_CATEGORIES.CRIME,
  'mystery': GENRE_CATEGORIES.CRIME,
  'detective': GENRE_CATEGORIES.CRIME,
  'mystery thriller': GENRE_CATEGORIES.CRIME,
  'true crime': GENRE_CATEGORIES.CRIME,
  'murder mystery': GENRE_CATEGORIES.CRIME,

  // Romance
  'romance': GENRE_CATEGORIES.ROMANCE,
  'contemporary romance': GENRE_CATEGORIES.ROMANCE,
  'love': GENRE_CATEGORIES.ROMANCE,
  'relationships': GENRE_CATEGORIES.ROMANCE,

  // Psychology & Self Help
  'psychology': GENRE_CATEGORIES.PSYCHOLOGY,
  'self help': GENRE_CATEGORIES.PSYCHOLOGY,
  'personal development': GENRE_CATEGORIES.PSYCHOLOGY,
  'personal growth': GENRE_CATEGORIES.PSYCHOLOGY,
  'productivity': GENRE_CATEGORIES.PSYCHOLOGY,
  'mental health': GENRE_CATEGORIES.PSYCHOLOGY,
  'business': GENRE_CATEGORIES.PSYCHOLOGY,
  'economics': GENRE_CATEGORIES.PSYCHOLOGY,
  'finance': GENRE_CATEGORIES.PSYCHOLOGY,
  'money': GENRE_CATEGORIES.PSYCHOLOGY,
  'leadership': GENRE_CATEGORIES.PSYCHOLOGY,
  'management': GENRE_CATEGORIES.PSYCHOLOGY,
  'communication': GENRE_CATEGORIES.PSYCHOLOGY,

  // Sci-Fi & Fantasy
  'science fiction': GENRE_CATEGORIES.SCIFI,
  'sci fi': GENRE_CATEGORIES.SCIFI,
  'fantasy': GENRE_CATEGORIES.SCIFI,
  'dystopia': GENRE_CATEGORIES.SCIFI,
  'post apocalyptic': GENRE_CATEGORIES.SCIFI,
  'time travel': GENRE_CATEGORIES.SCIFI,
  'space': GENRE_CATEGORIES.SCIFI,
  'magic': GENRE_CATEGORIES.SCIFI,
  'magical realism': GENRE_CATEGORIES.SCIFI,

  // History & Biography
  'history': GENRE_CATEGORIES.HISTORY,
  'biography': GENRE_CATEGORIES.HISTORY,
  'memoir': GENRE_CATEGORIES.HISTORY,
  'autobiography': GENRE_CATEGORIES.HISTORY,
  'historical': GENRE_CATEGORIES.HISTORY,
  'war': GENRE_CATEGORIES.HISTORY,
  'world war ii': GENRE_CATEGORIES.HISTORY,
  'egypt': GENRE_CATEGORIES.HISTORY,
  'middle east': GENRE_CATEGORIES.HISTORY,
  'politics': GENRE_CATEGORIES.HISTORY,

  // Philosophy & Science & Thought
  'philosophy': GENRE_CATEGORIES.PHILOSOPHY,
  'science': GENRE_CATEGORIES.PHILOSOPHY,
  'physics': GENRE_CATEGORIES.PHILOSOPHY,
  'astronomy': GENRE_CATEGORIES.PHILOSOPHY,
  'essays': GENRE_CATEGORIES.PHILOSOPHY,
  'sociology': GENRE_CATEGORIES.PHILOSOPHY,
  'social science': GENRE_CATEGORIES.PHILOSOPHY,
  'religion': GENRE_CATEGORIES.PHILOSOPHY,
  'islam': GENRE_CATEGORIES.PHILOSOPHY,
  'spirituality': GENRE_CATEGORIES.PHILOSOPHY,
  'theology': GENRE_CATEGORIES.PHILOSOPHY,
  'nonfiction': GENRE_CATEGORIES.PHILOSOPHY,

  // Novels & Literature
  'novels': GENRE_CATEGORIES.LITERATURE,
  'fiction': GENRE_CATEGORIES.LITERATURE,
  'literature': GENRE_CATEGORIES.LITERATURE,
  'classics': GENRE_CATEGORIES.LITERATURE,
  'short stories': GENRE_CATEGORIES.LITERATURE,
  'poetry': GENRE_CATEGORIES.LITERATURE,
  'drama': GENRE_CATEGORIES.LITERATURE,
  'historical fiction': GENRE_CATEGORIES.LITERATURE,
  'contemporary': GENRE_CATEGORIES.LITERATURE,
  'arabic literature': GENRE_CATEGORIES.LITERATURE,
  'egyptian literature': GENRE_CATEGORIES.LITERATURE
};

// Specific Author & Title Overrides for precision in Arabic library
const CURATED_BOOK_OVERRIDES = {
  // Mirna El-Mahdy series & detective novels
  'قضية السنوات السبع': [GENRE_CATEGORIES.CRIME],
  'قضية مخالب القط': [GENRE_CATEGORIES.CRIME],
  'قضية ذيل القط': [GENRE_CATEGORIES.CRIME],
  'قضية عنب الثعلب': [GENRE_CATEGORIES.CRIME],
  'قضية لوز مُر': [GENRE_CATEGORIES.CRIME],
  'قضية ست الحسن': [GENRE_CATEGORIES.CRIME],
  'چاز وروك': [GENRE_CATEGORIES.CRIME, GENRE_CATEGORIES.HORROR],
  'قنبلة للاستخدام الشخصي': [GENRE_CATEGORIES.CRIME],
  'دليل جدتي لقتل الأوغاد': [GENRE_CATEGORIES.CRIME],
  'صديقي السيكوباتي': [GENRE_CATEGORIES.CRIME, GENRE_CATEGORIES.PSYCHOLOGY],

  // Ahmed Khaled Towfik - Horror & Thriller
  'سر الغرفة 207': [GENRE_CATEGORIES.HORROR],
  'الهول': [GENRE_CATEGORIES.HORROR],
  'لست وحدك': [GENRE_CATEGORIES.HORROR],
  'موسوعة الظلام': [GENRE_CATEGORIES.HORROR],
  'عقل بلا جسد': [GENRE_CATEGORIES.HORROR, GENRE_CATEGORIES.SCIFI],
  'الآن أفهم': [GENRE_CATEGORIES.HORROR],
  'أفراح المقبرة': [GENRE_CATEGORIES.HORROR],
  'الآن نفتح الصندوق': [GENRE_CATEGORIES.HORROR],
  'حظك اليوم': [GENRE_CATEGORIES.HORROR],
  'قصة تكملها انت': [GENRE_CATEGORIES.HORROR],

  // Ahmed Khaled Towfik - Sci-Fi & Dystopia
  'يوتوبيا': [GENRE_CATEGORIES.SCIFI, GENRE_CATEGORIES.LITERATURE],
  'في ممر الفئران': [GENRE_CATEGORIES.SCIFI],
  'شآبيب': [GENRE_CATEGORIES.SCIFI],
  'السنجة': [GENRE_CATEGORIES.SCIFI, GENRE_CATEGORIES.LITERATURE],
  'مثل إيكاروس': [GENRE_CATEGORIES.SCIFI],
  'WWW': [GENRE_CATEGORIES.SCIFI],

  // Other Horror / Thriller
  'جنينة المحروقي': [GENRE_CATEGORIES.HORROR, GENRE_CATEGORIES.CRIME],
  'الهامس في الظلمات': [GENRE_CATEGORIES.HORROR, GENRE_CATEGORIES.SCIFI],
  'نفوس معقدة': [GENRE_CATEGORIES.HORROR, GENRE_CATEGORIES.CRIME],
  'المنزل قبل الظلام': [GENRE_CATEGORIES.HORROR, GENRE_CATEGORIES.CRIME],
  'نيكروفيليا': [GENRE_CATEGORIES.HORROR],
  'أنتيخريستوس': [GENRE_CATEGORIES.HORROR, GENRE_CATEGORIES.HISTORY],
  'أرض السافلين': [GENRE_CATEGORIES.HORROR, GENRE_CATEGORIES.SCIFI],
  'ملائك نصيبين': [GENRE_CATEGORIES.HORROR, GENRE_CATEGORIES.HISTORY],

  // Crime & Mystery
  'تراب الماس': [GENRE_CATEGORIES.CRIME, GENRE_CATEGORIES.HORROR],
  'جريمة في الصحراء': [GENRE_CATEGORIES.CRIME],
  'جريمة في الفضاء': [GENRE_CATEGORIES.CRIME],
  'كأس السم': [GENRE_CATEGORIES.CRIME],
  'العطر: قصة قاتل': [GENRE_CATEGORIES.CRIME, GENRE_CATEGORIES.LITERATURE],
  'شيفرة دافنشي': [GENRE_CATEGORIES.CRIME, GENRE_CATEGORIES.HISTORY],
  'لن ننسى أبداً': [GENRE_CATEGORIES.CRIME],
  'من يستطيع قتل جاك ريتشر؟': [GENRE_CATEGORIES.CRIME],
  'جريمة الحي اللاتيني': [GENRE_CATEGORIES.CRIME],
  'شرلوك هولمز يقابل سيجموند فرويد': [GENRE_CATEGORIES.CRIME, GENRE_CATEGORIES.PSYCHOLOGY],

  // Romance & Relationships
  'هيبتا': [GENRE_CATEGORIES.ROMANCE],
  'Maybe Now': [GENRE_CATEGORIES.ROMANCE],
  'إلى ما لا نهاية': [GENRE_CATEGORIES.ROMANCE],
  'أزمة تعلق': [GENRE_CATEGORIES.ROMANCE, GENRE_CATEGORIES.PSYCHOLOGY],
  'بئر الحرمان': [GENRE_CATEGORIES.ROMANCE, GENRE_CATEGORIES.LITERATURE],
  'صاحب الظل الطويل': [GENRE_CATEGORIES.ROMANCE, GENRE_CATEGORIES.LITERATURE],
  'إيكادولي': [GENRE_CATEGORIES.ROMANCE, GENRE_CATEGORIES.SCIFI],
  'شيطنات الطفلة الخبيثة': [GENRE_CATEGORIES.ROMANCE, GENRE_CATEGORIES.LITERATURE],
  'سحر ليلى': [GENRE_CATEGORIES.ROMANCE, GENRE_CATEGORIES.LITERATURE],
  'كازانوفا': [GENRE_CATEGORIES.ROMANCE, GENRE_CATEGORIES.LITERATURE],

  // Sci-Fi & Fantasy
  'أرض زيكولا': [GENRE_CATEGORIES.SCIFI],
  'أماريتا': [GENRE_CATEGORIES.SCIFI],
  'قواعد جارتين': [GENRE_CATEGORIES.SCIFI],
  'دقات الشامو': [GENRE_CATEGORIES.SCIFI],
  'أمواج أكما': [GENRE_CATEGORIES.SCIFI],
  'فتاة الياقة الزرقاء': [GENRE_CATEGORIES.SCIFI],
  'يوميات آخر البشر': [GENRE_CATEGORIES.SCIFI],
  'مزرعة الحيوان': [GENRE_CATEGORIES.SCIFI, GENRE_CATEGORIES.LITERATURE],
  'في بلاد الأشياء الأخيرة': [GENRE_CATEGORIES.SCIFI, GENRE_CATEGORIES.LITERATURE],
  'النمل': [GENRE_CATEGORIES.SCIFI, GENRE_CATEGORIES.LITERATURE],

  // Psychology & Self-Help
  'العادات الذرية': [GENRE_CATEGORIES.PSYCHOLOGY],
  'سيكولوجية الجماهير': [GENRE_CATEGORIES.PSYCHOLOGY, GENRE_CATEGORIES.PHILOSOPHY],
  'سيكولوجية المال': [GENRE_CATEGORIES.PSYCHOLOGY],
  'فن اللامبالاة': [GENRE_CATEGORIES.PSYCHOLOGY],
  'خراب: كتاب عن الأمل': [GENRE_CATEGORIES.PSYCHOLOGY],
  'The Courage to Be Disliked': [GENRE_CATEGORIES.PSYCHOLOGY, GENRE_CATEGORIES.PHILOSOPHY],
  'فكر كأنك طبيب نفسي': [GENRE_CATEGORIES.PSYCHOLOGY],
  'توقف عن إرضاء الآخرين': [GENRE_CATEGORIES.PSYCHOLOGY],
  'الأب الغني والأب الفقير': [GENRE_CATEGORIES.PSYCHOLOGY],
  'الفرصة الثانية': [GENRE_CATEGORIES.PSYCHOLOGY],
  'أغني رجل في بابل': [GENRE_CATEGORIES.PSYCHOLOGY],
  'من الذي حرك قطعة الجبن الخاصة بي؟': [GENRE_CATEGORIES.PSYCHOLOGY],
  'مت فارغا': [GENRE_CATEGORIES.PSYCHOLOGY],
  'لماذا ننام': [GENRE_CATEGORIES.PSYCHOLOGY, GENRE_CATEGORIES.PHILOSOPHY],
  'أول 20 ساعة': [GENRE_CATEGORIES.PSYCHOLOGY],
  'دليل النجاة الفردية': [GENRE_CATEGORIES.PSYCHOLOGY],
  'Don\'t Believe Everything You Think': [GENRE_CATEGORIES.PSYCHOLOGY],
  'وهم المقارنة': [GENRE_CATEGORIES.PSYCHOLOGY],
  'Outwitting the Devil': [GENRE_CATEGORIES.PSYCHOLOGY],
  'فلسفة النفس والشذوذ': [GENRE_CATEGORIES.PSYCHOLOGY, GENRE_CATEGORIES.PHILOSOPHY],
  'ظلام مرئي: مذكرات الجنون': [GENRE_CATEGORIES.PSYCHOLOGY, GENRE_CATEGORIES.HISTORY],

  // History & Biography
  'Sapiens': [GENRE_CATEGORIES.HISTORY, GENRE_CATEGORIES.PHILOSOPHY],
  '22 Cells in Nuremberg': [GENRE_CATEGORIES.HISTORY, GENRE_CATEGORIES.CRIME],
  'أفيون وبنادق': [GENRE_CATEGORIES.HISTORY, GENRE_CATEGORIES.CRIME],
  'مذكرات هدى شعراوي': [GENRE_CATEGORIES.HISTORY],
  'البحث عن الذات': [GENRE_CATEGORIES.HISTORY],
  'روما هي أنا': [GENRE_CATEGORIES.HISTORY, GENRE_CATEGORIES.LITERATURE],
  'ستيف جوبز': [GENRE_CATEGORIES.HISTORY],
  'إيلون ماسك': [GENRE_CATEGORIES.HISTORY],
  'الدحيح: ما وراء الكواليس': [GENRE_CATEGORIES.HISTORY],
  'اسمه خالد: سيرة أحمد خالد توفيق': [GENRE_CATEGORIES.HISTORY],
  'موجز سيرتي الذاتية': [GENRE_CATEGORIES.HISTORY, GENRE_CATEGORIES.PHILOSOPHY],
  'الشعراوي الذي لا نعرفه': [GENRE_CATEGORIES.HISTORY],
  'أوراق شمعون المصري': [GENRE_CATEGORIES.HISTORY, GENRE_CATEGORIES.LITERATURE],
  'الزيني بركات': [GENRE_CATEGORIES.HISTORY, GENRE_CATEGORIES.LITERATURE],
  'القطائع: ثلاثية ابن طولون': [GENRE_CATEGORIES.HISTORY, GENRE_CATEGORIES.LITERATURE],
  'ماريو وأبو العباس': [GENRE_CATEGORIES.HISTORY, GENRE_CATEGORIES.LITERATURE],
  'مقامرة على شرف الليدي ميتسي': [GENRE_CATEGORIES.HISTORY, GENRE_CATEGORIES.LITERATURE],
  'أرض الإله': [GENRE_CATEGORIES.HISTORY, GENRE_CATEGORIES.LITERATURE],
  'نابليون بين المغامرة والمقامرة': [GENRE_CATEGORIES.HISTORY],
  'أحجار على رقعة الشطرنج': [GENRE_CATEGORIES.HISTORY, GENRE_CATEGORIES.PHILOSOPHY],

  // Philosophy, Science & Thought
  'تاريخ موجز للزمان': [GENRE_CATEGORIES.PHILOSOPHY],
  'The Theory of Everything': [GENRE_CATEGORIES.PHILOSOPHY],
  'The God Equation': [GENRE_CATEGORIES.PHILOSOPHY],
  'الثقوب السوداء وتمدد الزمن': [GENRE_CATEGORIES.PHILOSOPHY],
  'أينشتين والنسبية': [GENRE_CATEGORIES.PHILOSOPHY],
  'حوار مع صديقي الملحد': [GENRE_CATEGORIES.PHILOSOPHY],
  'القرآن كائن حي': [GENRE_CATEGORIES.PHILOSOPHY],
  'البدائع والطرائف': [GENRE_CATEGORIES.PHILOSOPHY, GENRE_CATEGORIES.LITERATURE],
  'المجنون': [GENRE_CATEGORIES.PHILOSOPHY, GENRE_CATEGORIES.LITERATURE],
  'النبي': [GENRE_CATEGORIES.PHILOSOPHY, GENRE_CATEGORIES.LITERATURE],
  'المدينة الفاضلة عند فلاسفة القرن الثامن عشر': [GENRE_CATEGORIES.PHILOSOPHY],
  'عندما بكى نيتشه': [GENRE_CATEGORIES.PHILOSOPHY, GENRE_CATEGORIES.LITERATURE],
  'إلى الله: رحلة في خمسة أيام': [GENRE_CATEGORIES.PHILOSOPHY],
  'تحرير المرأة': [GENRE_CATEGORIES.PHILOSOPHY, GENRE_CATEGORIES.HISTORY],
  'شربة الحاج داود': [GENRE_CATEGORIES.PHILOSOPHY],
  'عالم المعرفة: لكل سؤال جواب': [GENRE_CATEGORIES.PHILOSOPHY],
  'من عجائب الخلق في الكون العظيم': [GENRE_CATEGORIES.PHILOSOPHY],
  'الألياف البصرية الحاضر والمستقبل': [GENRE_CATEGORIES.PHILOSOPHY],
  'رحلات الفضاء: تاريخ موجز': [GENRE_CATEGORIES.PHILOSOPHY, GENRE_CATEGORIES.HISTORY],
  'موعد مع فيلسوف': [GENRE_CATEGORIES.PHILOSOPHY],

  // Literature & Fiction
  'ظل الريح': [GENRE_CATEGORIES.LITERATURE, GENRE_CATEGORIES.CRIME],
  'لعبة الملاك': [GENRE_CATEGORIES.LITERATURE, GENRE_CATEGORIES.HORROR],
  'سجين السماء': [GENRE_CATEGORIES.LITERATURE],
  'متاهة الأرواح': [GENRE_CATEGORIES.LITERATURE, GENRE_CATEGORIES.CRIME],
  'أمير الضباب': [GENRE_CATEGORIES.LITERATURE, GENRE_CATEGORIES.HORROR],
  'الغابة النرويجية': [GENRE_CATEGORIES.LITERATURE, GENRE_CATEGORIES.ROMANCE],
  'مقتل الكومنداتور': [GENRE_CATEGORIES.LITERATURE],
  'الطنطورية': [GENRE_CATEGORIES.LITERATURE, GENRE_CATEGORIES.HISTORY],
  'أم سعد': [GENRE_CATEGORIES.LITERATURE, GENRE_CATEGORIES.HISTORY],
  'القميص المسروق': [GENRE_CATEGORIES.LITERATURE],
  'بداية ونهاية': [GENRE_CATEGORIES.LITERATURE],
  'الغريب': [GENRE_CATEGORIES.LITERATURE, GENRE_CATEGORIES.PHILOSOPHY],
  'التحول': [GENRE_CATEGORIES.LITERATURE, GENRE_CATEGORIES.PHILOSOPHY],
  'الخوف': [GENRE_CATEGORIES.LITERATURE],
  'لاعب الشطرنج': [GENRE_CATEGORIES.LITERATURE],
  'عاصفة في الجنة': [GENRE_CATEGORIES.LITERATURE],
  'الخيميائي': [GENRE_CATEGORIES.LITERATURE, GENRE_CATEGORIES.PHILOSOPHY],
  'حفلة التيس': [GENRE_CATEGORIES.LITERATURE, GENRE_CATEGORIES.HISTORY],
  'زوربا اليوناني': [GENRE_CATEGORIES.LITERATURE, GENRE_CATEGORIES.PHILOSOPHY],
  'الحسون': [GENRE_CATEGORIES.LITERATURE, GENRE_CATEGORIES.CRIME],
  'الجدار': [GENRE_CATEGORIES.LITERATURE],
  'بنات الباشا': [GENRE_CATEGORIES.LITERATURE],
  'مثل الأفلام الساذجة': [GENRE_CATEGORIES.LITERATURE],
  'خرائط التيه': [GENRE_CATEGORIES.LITERATURE],
  'دار خولة': [GENRE_CATEGORIES.LITERATURE],
  'السندباد الأعمى': [GENRE_CATEGORIES.LITERATURE],
  'حارس سطح العالم': [GENRE_CATEGORIES.LITERATURE, GENRE_CATEGORIES.SCIFI],
  'ربع الرز': [GENRE_CATEGORIES.LITERATURE, GENRE_CATEGORIES.HISTORY],
  'ماكيت القاهرة': [GENRE_CATEGORIES.LITERATURE],
  'حادثة كلب منتصف الليل المثيرة': [GENRE_CATEGORIES.LITERATURE, GENRE_CATEGORIES.CRIME],
  'مصباح الذكريات المفقودة': [GENRE_CATEGORIES.LITERATURE],
  'شيفرة بلال': [GENRE_CATEGORIES.LITERATURE, GENRE_CATEGORIES.PHILOSOPHY],
  'ابنة الحظ': [GENRE_CATEGORIES.LITERATURE, GENRE_CATEGORIES.HISTORY],
  'ما وراء الشتاء': [GENRE_CATEGORIES.LITERATURE],
  'حرائق صغيرة في كل مكان': [GENRE_CATEGORIES.LITERATURE],
  'أنقذني': [GENRE_CATEGORIES.LITERATURE, GENRE_CATEGORIES.ROMANCE],
  'غدا': [GENRE_CATEGORIES.LITERATURE, GENRE_CATEGORIES.ROMANCE],
  'حجرتان وصالة': [GENRE_CATEGORIES.LITERATURE],
  'خلو البال': [GENRE_CATEGORIES.LITERATURE]
};

/**
 * Load Goodreads Cache
 */
async function loadCache() {
  try {
    const data = await fs.readFile(CACHE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

/**
 * Save Goodreads Cache
 */
async function saveCache(cache) {
  await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
}

/**
 * Fetch Goodreads Apollo state genres for a book ID with retries
 */
export async function fetchGoodreadsGenres(bookId, cache = {}) {
  if (cache[bookId]) {
    return cache[bookId];
  }

  const url = `https://www.goodreads.com/book/show/${bookId}`;
  let attempts = 0;
  const maxAttempts = 2;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8'
        },
        timeout: 8000
      });

      if (!res.ok) {
        if (res.status === 404) {
          cache[bookId] = [];
          return [];
        }
        throw new Error(`HTTP ${res.status}`);
      }

      const html = await res.text();
      const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
      if (!nextDataMatch) {
        cache[bookId] = [];
        return [];
      }

      const json = JSON.parse(nextDataMatch[1]);
      const apolloState = json?.props?.pageProps?.apolloState || {};
      const bookKeys = Object.keys(apolloState).filter(k => k.startsWith('Book:'));

      const rawGenres = [];
      for (const bk of bookKeys) {
        const bg = apolloState[bk]?.bookGenres;
        if (Array.isArray(bg)) {
          for (const item of bg) {
            const name = item?.genre?.name;
            if (name && name.toLowerCase() !== 'audiobook') {
              rawGenres.push(name);
            }
          }
        }
      }

      const uniqueRaw = [...new Set(rawGenres)];
      cache[bookId] = uniqueRaw;
      return uniqueRaw;
    } catch (err) {
      if (attempts >= maxAttempts) {
        return [];
      }
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  return [];
}

/**
 * Classify a book into Arabic genres
 */
export function classifyBook(book, rawGoodreadsGenres = []) {
  const matchedGenres = new Set();
  const title = (book.title || '').trim();
  const author = (book.author || '').trim();
  const desc = (book.description || '').toLowerCase();

  // 1. Check curated overrides by title prefix / key
  for (const [key, genres] of Object.entries(CURATED_BOOK_OVERRIDES)) {
    if (title.includes(key) || key.includes(title)) {
      genres.forEach(g => matchedGenres.add(g));
    }
  }

  // 2. Map Goodreads genres
  if (Array.isArray(rawGoodreadsGenres)) {
    for (const g of rawGoodreadsGenres) {
      const lower = g.toLowerCase().trim();
      if (GOODREADS_GENRE_MAP[lower]) {
        matchedGenres.add(GOODREADS_GENRE_MAP[lower]);
      }
    }
  }

  // 3. Keyword heuristics from title & description if still sparse
  if (matchedGenres.size === 0 || (matchedGenres.size === 1 && matchedGenres.has(GENRE_CATEGORIES.LITERATURE))) {
    if (desc.includes('رعب') || desc.includes('أشباح') || desc.includes('جريمة قتل') || desc.includes('دموية')) {
      if (desc.includes('رعب') || desc.includes('أشباح') || desc.includes('جحيم')) matchedGenres.add(GENRE_CATEGORIES.HORROR);
      if (desc.includes('جريمة') || desc.includes('سفاح') || desc.includes('تحقيق') || desc.includes('لغز')) matchedGenres.add(GENRE_CATEGORIES.CRIME);
    }
    if (desc.includes('حب') || desc.includes('عشق') || desc.includes('رومانس') || desc.includes('علاقة عاطفية') || desc.includes('زواج')) {
      matchedGenres.add(GENRE_CATEGORIES.ROMANCE);
    }
    if (desc.includes('علم نفس') || desc.includes('تطوير') || desc.includes('عادات') || desc.includes('نجاح') || desc.includes('تحفيز')) {
      matchedGenres.add(GENRE_CATEGORIES.PSYCHOLOGY);
    }
    if (desc.includes('خيال علمي') || desc.includes('فضاء') || desc.includes('ديستوبيا') || desc.includes('نهاية العالم') || desc.includes('كوكب')) {
      matchedGenres.add(GENRE_CATEGORIES.SCIFI);
    }
    if (desc.includes('تاريخ') || desc.includes('سيرة') || desc.includes('مذكرات') || desc.includes('وثائق')) {
      matchedGenres.add(GENRE_CATEGORIES.HISTORY);
    }
    if (desc.includes('فلسف') || desc.includes('فكر') || desc.includes('فيزياء') || desc.includes('كون') || desc.includes('إلحاد') || desc.includes('إيمان')) {
      matchedGenres.add(GENRE_CATEGORIES.PHILOSOPHY);
    }
  }

  // Author-based general fallbacks
  if (matchedGenres.size === 0) {
    if (author.includes('ميرنا المهدي')) matchedGenres.add(GENRE_CATEGORIES.CRIME);
    else if (author.includes('أحمد خالد توفيق')) matchedGenres.add(GENRE_CATEGORIES.HORROR);
    else if (author.includes('عمرو عبدالحميد')) matchedGenres.add(GENRE_CATEGORIES.SCIFI);
    else if (author.includes('أغاثا') || author.includes('Agatha Christie')) matchedGenres.add(GENRE_CATEGORIES.CRIME);
    else if (author.includes('Carlos Ruiz Zafón')) matchedGenres.add(GENRE_CATEGORIES.LITERATURE);
    else if (author.includes('مصطفى محمود')) matchedGenres.add(GENRE_CATEGORIES.PHILOSOPHY);
    else if (author.includes('Stephen') || author.includes('Hawking') || author.includes('Kaku')) matchedGenres.add(GENRE_CATEGORIES.PHILOSOPHY);
  }

  // Default fallback if completely untagged: روايات وأدب for novels/stories, or فلسفة وفكر
  if (matchedGenres.size === 0) {
    if (book.pages > 100) {
      matchedGenres.add(GENRE_CATEGORIES.LITERATURE);
    } else {
      matchedGenres.add(GENRE_CATEGORIES.PHILOSOPHY);
    }
  }

  // Priority order for primaryGenre
  const priority = [
    GENRE_CATEGORIES.HORROR,
    GENRE_CATEGORIES.CRIME,
    GENRE_CATEGORIES.ROMANCE,
    GENRE_CATEGORIES.PSYCHOLOGY,
    GENRE_CATEGORIES.SCIFI,
    GENRE_CATEGORIES.HISTORY,
    GENRE_CATEGORIES.PHILOSOPHY,
    GENRE_CATEGORIES.LITERATURE
  ];

  const genresList = Array.from(matchedGenres);
  const primaryGenre = priority.find(p => genresList.includes(p)) || genresList[0];

  return {
    genres: genresList,
    primaryGenre
  };
}

/**
 * Main enrichment pipeline
 */
export async function enrichAllBooks({ fetchOnline = true, limit = Infinity } = {}) {
  const booksPath = path.join(DATA_DIR, 'books.json');
  const rawBooks = JSON.parse(await fs.readFile(booksPath, 'utf-8'));
  const cache = await loadCache();

  console.log(`Enriching ${rawBooks.length} books with genres...`);

  let fetchedCount = 0;
  const enrichedBooks = [];

  for (let i = 0; i < rawBooks.length; i++) {
    const book = rawBooks[i];
    let goodreadsGenres = cache[book.id] || [];

    if (fetchOnline && !cache[book.id] && fetchedCount < limit) {
      goodreadsGenres = await fetchGoodreadsGenres(book.id, cache);
      fetchedCount++;
      if (fetchedCount % 10 === 0) {
        await saveCache(cache);
        console.log(`Progress: fetched ${fetchedCount} books from Goodreads...`);
      }
      await new Promise(r => setTimeout(r, 200));
    }

    const { genres, primaryGenre } = classifyBook(book, goodreadsGenres);

    enrichedBooks.push({
      ...book,
      genres,
      primaryGenre
    });
  }

  await saveCache(cache);

  await fs.writeFile(booksPath, JSON.stringify(enrichedBooks, null, 2), 'utf-8');
  console.log(`Saved enriched books.json (${enrichedBooks.length} books)`);

  // Update five-stars.json
  const fiveStarsPath = path.join(DATA_DIR, 'five-stars.json');
  try {
    const fiveStars = JSON.parse(await fs.readFile(fiveStarsPath, 'utf-8'));
    const enrichedFiveStars = fiveStars.map(fb => {
      const match = enrichedBooks.find(b => b.id === fb.id);
      return match ? { ...fb, genres: match.genres, primaryGenre: match.primaryGenre } : fb;
    });
    await fs.writeFile(fiveStarsPath, JSON.stringify(enrichedFiveStars, null, 2), 'utf-8');
    console.log(`Updated five-stars.json`);
  } catch (err) {
    console.warn('Could not update five-stars.json:', err.message);
  }

  // Update currently-reading.json
  const currentlyPath = path.join(DATA_DIR, 'currently-reading.json');
  try {
    const currently = JSON.parse(await fs.readFile(currentlyPath, 'utf-8'));
    const enrichedCurrently = currently.map(cb => {
      const match = enrichedBooks.find(b => b.id === cb.id);
      return match ? { ...cb, genres: match.genres, primaryGenre: match.primaryGenre } : cb;
    });
    await fs.writeFile(currentlyPath, JSON.stringify(enrichedCurrently, null, 2), 'utf-8');
    console.log(`Updated currently-reading.json`);
  } catch (err) {
    console.warn('Could not update currently-reading.json:', err.message);
  }

  return enrichedBooks;
}

// Allow direct CLI execution
if (process.argv[1] && process.argv[1].endsWith('enrich-genres.js')) {
  enrichAllBooks({ fetchOnline: true })
    .then(books => {
      console.log('Enrichment complete!');
      const counts = {};
      books.forEach(b => {
        b.genres.forEach(g => {
          counts[g] = (counts[g] || 0) + 1;
        });
      });
      console.log('Genre Distribution:', counts);
    })
    .catch(err => {
      console.error('Enrichment failed:', err);
      process.exit(1);
    });
}
