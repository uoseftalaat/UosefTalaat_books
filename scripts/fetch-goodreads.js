import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';
import { parseStringPromise } from 'xml2js';
import { enrichAllBooks } from './enrich-genres.js';

const USER_ID = process.env.GOODREADS_USER_ID || '116793505';
const DATA_DIR = path.resolve('data');

// Clean HTML tags and excessive whitespace from Goodreads descriptions
function cleanDescription(raw) {
  if (!raw) return '';
  return String(raw)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

// Upgrade Goodreads thumbnail URL to high-resolution
function getHighResCover(item) {
  const large = item.book_large_image_url?.[0] || '';
  const medium = item.book_medium_image_url?.[0] || '';
  const img = item.book_image_url?.[0] || '';

  let candidate = large || medium || img;
  if (!candidate || candidate.includes('nophoto')) {
    return '';
  }

  // If Goodreads image has downsizing token like ._SY75_. or ._SX98_., replace with large SY600
  if (/\._S[XY]\d+_\./i.test(candidate)) {
    return candidate.replace(/\._S[XY]\d+_\./i, '._SY600_.');
  }
  return candidate;
}

// Detect if string contains Arabic characters
function isArabic(text) {
  if (!text) return false;
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text);
}

// Parse single RSS book item
function parseBookItem(item) {
  const id = item.book_id?.[0] || item.book?.[0]?.$?.id || '';
  const title = (item.title?.[0] || '').trim();
  const author = (item.author_name?.[0] || '').trim();
  const userRating = parseInt(item.user_rating?.[0] || '0', 10);
  const avgRating = parseFloat(item.average_rating?.[0] || '0');
  const dateAdded = item.user_date_added?.[0] || item.pubDate?.[0] || '';
  const dateRead = item.user_read_at?.[0] || null;
  const shelves = (item.user_shelves?.[0] || '').split(',').map(s => s.trim()).filter(Boolean);
  const rawDesc = item.book_description?.[0] || '';
  const description = cleanDescription(rawDesc);
  const pages = parseInt(item.book?.[0]?.num_pages?.[0] || '0', 10);
  const publishedYear = item.book_published?.[0] || '';
  const link = item.link?.[0] || `https://www.goodreads.com/book/show/${id}`;
  const coverUrl = getHighResCover(item);

  return {
    id: String(id),
    title,
    author,
    rating: userRating,
    averageRating: avgRating,
    coverUrl,
    dateAdded,
    dateRead,
    shelves,
    description,
    pages,
    publishedYear,
    goodreadsUrl: link,
    isArabic: isArabic(title) || isArabic(author)
  };
}

async function fetchShelf(shelfName) {
  let allItems = [];
  let page = 1;
  const maxPages = 5; // Up to 500 books

  while (page <= maxPages) {
    const url = `https://www.goodreads.com/review/list_rss/${USER_ID}?shelf=${encodeURIComponent(shelfName)}&page=${page}`;
    console.log(`Fetching RSS (page ${page}): ${url}`);
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!res.ok) {
      if (page === 1) throw new Error(`Failed to fetch shelf ${shelfName}: HTTP ${res.status}`);
      break;
    }

    const xmlText = await res.text();
    const parsed = await parseStringPromise(xmlText);
    const items = parsed?.rss?.channel?.[0]?.item || [];
    if (items.length === 0) {
      break;
    }

    allItems.push(...items.map(parseBookItem));

    // If less than 100 items returned, this was the last page
    if (items.length < 100) {
      break;
    }
    page++;
  }

  // Deduplicate by book ID
  const seen = new Set();
  return allItems.filter(b => {
    if (seen.has(b.id)) return false;
    seen.add(b.id);
    return true;
  });
}

async function main() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    // 1. Fetch currently reading
    console.log('Fetching currently-reading...');
    let currentlyReading = [];
    try {
      currentlyReading = await fetchShelf('currently-reading');
    } catch (err) {
      console.warn('Could not fetch currently-reading, fallback to empty array', err.message);
    }
    await fs.writeFile(
      path.join(DATA_DIR, 'currently-reading.json'),
      JSON.stringify(currentlyReading, null, 2),
      'utf-8'
    );
    console.log(`Saved currently-reading.json (${currentlyReading.length} books)`);

    // 2. Fetch all books
    console.log('Fetching all books...');
    const allBooks = await fetchShelf('#ALL#');

    // Filter out currently-reading from all-books list if desired, or keep as full catalog
    await fs.writeFile(
      path.join(DATA_DIR, 'books.json'),
      JSON.stringify(allBooks, null, 2),
      'utf-8'
    );
    console.log(`Saved books.json (${allBooks.length} books)`);

    // 3. Extract 5-star books (last 5)
    const fiveStars = allBooks
      .filter(b => b.rating === 5 && b.coverUrl)
      .slice(0, 5);

    await fs.writeFile(
      path.join(DATA_DIR, 'five-stars.json'),
      JSON.stringify(fiveStars, null, 2),
      'utf-8'
    );
    console.log(`Saved five-stars.json (${fiveStars.length} books)`);

    // 4. Enrich all books with genres and literary classifications
    console.log('Enriching books with genres...');
    try {
      await enrichAllBooks({ fetchOnline: true });
    } catch (genreErr) {
      console.warn('Genre enrichment warning:', genreErr.message);
    }

    // 5. Fetch YouTube Videos via public channel RSS (long-form only)
    console.log('Fetching YouTube videos (long-form only)...');
    try {
      const ytChannelId = 'UCoSrFnmXLkBuSAQLRNmsAsA';
      const ytRes = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${ytChannelId}`);
      if (ytRes.ok) {
        const ytXml = await ytRes.text();
        const ytData = await parseStringPromise(ytXml);
        const entries = ytData?.feed?.entry || [];
        const longFormVideos = [];

        for (const e of entries) {
          const id = e['yt:videoId']?.[0] || '';
          if (!id) continue;

          // Check if video is a Short: YouTube returns 200 for Shorts, 303 for regular videos
          try {
            const checkRes = await fetch(`https://www.youtube.com/shorts/${id}`, {
              method: 'HEAD',
              redirect: 'manual'
            });
            if (checkRes.status === 200) {
              // It's a Short, skip it!
              continue;
            }
          } catch {
            // If check fails, keep video
          }

          const title = e.title?.[0] || '';
          const views = parseInt(e['media:group']?.[0]?.['media:community']?.[0]?.['media:statistics']?.[0]?.$.views || '0', 10);
          const thumbnail = e['media:group']?.[0]?.['media:thumbnail']?.[0]?.$.url || '';

          longFormVideos.push({
            id,
            title,
            url: `https://www.youtube.com/watch?v=${id}`,
            published: e.published?.[0] || '',
            views,
            thumbnail
          });
        }

        // Sort by view count descending
        longFormVideos.sort((a, b) => b.views - a.views);

        await fs.writeFile(
          path.join(DATA_DIR, 'youtube.json'),
          JSON.stringify(longFormVideos, null, 2),
          'utf-8'
        );
        console.log(`Saved youtube.json (${longFormVideos.length} long-form videos)`);
      }
    } catch (ytErr) {
      console.warn('Could not fetch YouTube videos, keeping existing data:', ytErr.message);
    }

    console.log('Goodreads & YouTube sync complete!');
  } catch (error) {
    console.error('Error during Goodreads RSS fetch:', error);
    process.exit(1);
  }
}

main();
