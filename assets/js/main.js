import { BookSlider3D } from './slider.js';
import { BooksCatalog } from './books.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize 5-Star 3D Slider
  new BookSlider3D({
    container: '#slider-container',
    track: '#slider-track',
    detailsBox: '#slider-details',
    prevBtn: '#slider-prev',
    nextBtn: '#slider-next',
    dotsContainer: '#slider-dots'
  });

  // 2. Initialize All Books Catalog
  new BooksCatalog({
    grid: '#books-grid',
    filterContainer: '#filter-chips',
    secondaryContainer: '#filter-chips-secondary',
    searchInput: '#archive-search',
    loadMoreBtn: '#load-more-books',
    counterEl: '#total-books-counter'
  });

  // 3. Load Currently Reading Shelf
  loadCurrentlyReading();

  // 4. Load Featured YouTube Videos
  loadYouTubeVideos();

  // 5. Setup Header & Navigation
  setupNavigation();
});

/**
 * Load Currently Reading data
 */
async function loadCurrentlyReading() {
  const container = document.querySelector('#currently-reading-content');
  if (!container) return;

  try {
    const res = await fetch('data/currently-reading.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const items = await res.json();

    container.className = 'currently-reading-track';
    container.dataset.count = items ? items.length : 0;

    if (!items || items.length === 0) {
      container.innerHTML = `
        <div class="currently-reading-card" style="text-align: center; padding: var(--space-8); color: var(--color-text-muted); width: 100%;">
          <p>مفيش كتاب شغال فيه حالياً، مستني الاختيار الجاي.</p>
        </div>
      `;
      return;
    }

    const fallbackCover = "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D'240'%20height%3D'360'%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'%231C1A17'%2F%3E%3Ctext%20x%3D'50%25'%20y%3D'50%25'%20fill%3D'%23F6F3EE'%20font-size%3D'16'%20text-anchor%3D'middle'%20dy%3D'.3em'%3E%D8%BA%D9%84%D8%A7%D9%81%20%D8%A7%D9%84%D9%83%D8%AA%D8%A7%D8%A8%3C%2Ftext%3E%3C%2Fsvg%3E";

    container.innerHTML = items.map(current => {
      const coverSrc = current.coverUrl || fallbackCover;
      return `
        <article class="currently-reading-card">
          <div class="currently-card-body">
            <div class="book-cover-3d-wrapper">
              <div class="book-volume compact" onclick="window.open('${current.goodreadsUrl}', '_blank')" title="افتح ${current.title} على Goodreads">
                <img src="${coverSrc}" alt="${current.title}" onerror="this.src='${fallbackCover}'">
              </div>
            </div>
            <div class="currently-info compact">
              <div class="reading-badge compact">
                <span class="reading-badge-marker"></span>
                <span>في إيدي دلوقتي</span>
              </div>
              <h3 class="currently-title compact font-editorial" dir="auto">${current.title}</h3>
              <p class="currently-author compact">بقلم: <span dir="auto">${current.author}</span></p>
              ${current.description ? `<p class="currently-desc compact" dir="auto">${current.description}</p>` : ''}
              <div class="currently-meta-row compact">
                ${current.pages ? `<span>${current.pages} صفحة</span>` : ''}
                ${current.publishedYear ? `<span>سنة النشر: ${current.publishedYear}</span>` : ''}
                ${current.primaryGenre ? `<span>التصنيف: ${current.primaryGenre}</span>` : ''}
              </div>
              <div class="currently-actions">
                <a href="${current.goodreadsUrl}" target="_blank" rel="noopener noreferrer" class="btn-primary btn-sm">
                  <span>شوف على Goodreads</span>
                  <svg style="width: 12px; height: 12px; fill: currentColor; transform: scaleX(-1);" viewBox="0 0 24 24">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </article>
      `;
    }).join('');

    setupCurrentlyNav(container);
  } catch (err) {
    console.error('Failed to load currently reading:', err);
  }
}

/**
 * Setup navigation arrows for currently reading track
 */
function setupCurrentlyNav(container) {
  const nav = document.querySelector('#currently-nav');
  const prevBtn = document.querySelector('#currently-prev');
  const nextBtn = document.querySelector('#currently-next');

  function checkOverflow() {
    if (!nav) return;
    const isOverflowing = container.scrollWidth > container.clientWidth + 12;
    nav.style.display = isOverflowing ? 'inline-flex' : 'none';
  }

  // Check overflow after rendering
  setTimeout(checkOverflow, 120);
  window.addEventListener('resize', checkOverflow);

  if (prevBtn && nextBtn) {
    prevBtn.addEventListener('click', () => {
      container.scrollBy({ left: 380, behavior: 'smooth' });
    });
    nextBtn.addEventListener('click', () => {
      container.scrollBy({ left: -380, behavior: 'smooth' });
    });
  }
}

/**
 * Load YouTube Videos
 */
async function loadYouTubeVideos() {
  const grid = document.querySelector('#youtube-grid');
  if (!grid) return;

  try {
    const res = await fetch('data/youtube.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const videos = await res.json();

    if (!videos || videos.length === 0) return;

    // Display top 4 videos with real view counts
    const topFour = videos.slice(0, 4);
    grid.innerHTML = '';

    topFour.forEach(video => {
      const card = document.createElement('a');
      card.href = video.url;
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
      card.className = 'yt-card';
      card.setAttribute('aria-label', `مشاهدة فيديو: ${video.title}`);

      card.innerHTML = `
        <div class="yt-thumb-wrapper">
          <img src="${video.thumbnail}" alt="${video.title}" loading="lazy">
          <div class="yt-play-btn">
            <div class="yt-play-icon">
              <svg style="width: 18px; height: 18px; fill: currentColor;" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
        </div>
        <div class="yt-info">
          <h4 class="yt-title">${video.title}</h4>
          <div class="yt-meta">
            <span>${video.views > 0 ? `${video.views.toLocaleString('ar-EG')} مشاهدة` : 'شاهد على يوتيوب'}</span>
            <span style="color: var(--color-accent); font-weight: 600;">شوف الفيديو ↗</span>
          </div>
        </div>
      `;

      grid.appendChild(card);
    });
  } catch (err) {
    console.error('Failed to load YouTube videos:', err);
  }
}

/**
 * Setup Fixed Header, Navigation Scrollspy, and Mobile Menu
 */
function setupNavigation() {
  const header = document.querySelector('#site-header');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');
  const mobileToggle = document.querySelector('#mobile-nav-toggle');
  const navMenu = document.querySelector('#nav-menu');

  // Header scroll shadow
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    // Scrollspy active class
    let currentId = '';
    sections.forEach(sec => {
      const top = sec.offsetTop - 120;
      const height = sec.offsetHeight;
      if (window.scrollY >= top && window.scrollY < top + height) {
        currentId = sec.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${currentId}`);
    });
  });

  // Mobile menu toggle
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      const isExpanded = navMenu.style.display === 'flex';
      navMenu.style.display = isExpanded ? 'none' : 'flex';
      if (!isExpanded) {
        navMenu.style.position = 'absolute';
        navMenu.style.top = '72px';
        navMenu.style.right = '0';
        navMenu.style.left = '0';
        navMenu.style.flexDirection = 'column';
        navMenu.style.backgroundColor = 'var(--color-bg)';
        navMenu.style.padding = 'var(--space-6)';
        navMenu.style.borderBottom = '1px solid var(--color-border)';
        navMenu.style.boxShadow = 'var(--shadow-lift)';
      }
    });

    // Close mobile menu on link click
    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          navMenu.style.display = 'none';
        }
      });
    });
  }
}
