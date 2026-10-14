/**
 * Books Archive Catalog Manager
 * Handles multi-filtering by ratings (5, 4, 3 stars), genres (Horror, Romance, Crime, etc.),
 * language (Arabic / English), book card genre tags, and progressive pagination.
 */

export class BooksCatalog {
  constructor(options = {}) {
    this.grid = document.querySelector(options.grid || '#books-grid');
    this.filterContainer = document.querySelector(options.filterContainer || '#filter-chips');
    this.searchInput = document.querySelector(options.searchInput || '#archive-search');
    this.loadMoreBtn = document.querySelector(options.loadMoreBtn || '#load-more-books');
    this.counterEl = document.querySelector(options.counterEl || '#total-books-counter');

    this.allBooks = [];
    this.filteredBooks = [];
    this.currentFilter = 'all';
    this.searchQuery = '';
    this.pageSize = 24;
    this.visibleCount = 24;

    this.init();
  }

  async init() {
    if (!this.grid) return;

    try {
      const res = await fetch('data/books.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.allBooks = await res.json();
    } catch (err) {
      console.error('Failed to load books catalog:', err);
      return;
    }

    this.updateCounter();
    this.filteredBooks = [...this.allBooks];
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    // Filter chips (Ratings, Genres, Language)
    if (this.filterContainer) {
      this.filterContainer.addEventListener('click', (e) => {
        const chip = e.target.closest('.filter-chip');
        if (!chip) return;

        this.filterContainer.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        this.currentFilter = chip.dataset.filter || 'all';
        this.applyFilters();
      });
    }

    // Instant Search
    if (this.searchInput) {
      let debounceTimer = null;
      this.searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          this.searchQuery = e.target.value.trim().toLowerCase();
          this.applyFilters();
        }, 150);
      });
    }

    // Load More Button
    if (this.loadMoreBtn) {
      this.loadMoreBtn.addEventListener('click', () => {
        this.visibleCount += this.pageSize;
        this.render();
      });
    }
  }

  /**
   * Programmatically set any active filter (genre, rating, language)
   */
  setFilter(filterValue) {
    this.currentFilter = filterValue;
    if (this.filterContainer) {
      const chips = this.filterContainer.querySelectorAll('.filter-chip');
      chips.forEach(c => {
        c.classList.toggle('active', c.dataset.filter === filterValue);
      });
    }
    this.applyFilters();
  }

  applyFilters() {
    this.visibleCount = this.pageSize;

    this.filteredBooks = this.allBooks.filter(book => {
      // 1. Rating, Language, or Genre match
      let matchesFilter = true;
      if (this.currentFilter === 'all') {
        matchesFilter = true;
      } else if (this.currentFilter === '5-stars') {
        matchesFilter = book.rating === 5;
      } else if (this.currentFilter === '4-stars') {
        matchesFilter = book.rating === 4;
      } else if (this.currentFilter === '3-stars') {
        matchesFilter = book.rating === 3;
      } else if (this.currentFilter === 'arabic') {
        matchesFilter = book.isArabic === true;
      } else if (this.currentFilter === 'english') {
        matchesFilter = book.isArabic === false;
      } else {
        // Genre match (checks genres array and primaryGenre)
        matchesFilter = (Array.isArray(book.genres) && book.genres.includes(this.currentFilter)) ||
                        book.primaryGenre === this.currentFilter;
      }

      // 2. Search query match
      let matchesSearch = true;
      if (this.searchQuery) {
        const titleMatch = (book.title || '').toLowerCase().includes(this.searchQuery);
        const authorMatch = (book.author || '').toLowerCase().includes(this.searchQuery);
        matchesSearch = titleMatch || authorMatch;
      }

      return matchesFilter && matchesSearch;
    });

    this.updateCounter();
    this.render();
  }

  updateCounter() {
    if (!this.counterEl) return;

    if (this.currentFilter === 'all') {
      this.counterEl.textContent = `${this.allBooks.length} كتاباً`;
    } else if (this.currentFilter === '5-stars') {
      this.counterEl.textContent = `${this.filteredBooks.length} كتب (تقييم ٥ نجوم)`;
    } else if (this.currentFilter === '4-stars') {
      this.counterEl.textContent = `${this.filteredBooks.length} كتب (تقييم ٤ نجوم)`;
    } else if (this.currentFilter === '3-stars') {
      this.counterEl.textContent = `${this.filteredBooks.length} كتب (تقييم ٣ نجوم)`;
    } else if (this.currentFilter === 'arabic') {
      this.counterEl.textContent = `${this.filteredBooks.length} كتاب عربي`;
    } else if (this.currentFilter === 'english') {
      this.counterEl.textContent = `${this.filteredBooks.length} كتاب إنجليزي`;
    } else {
      this.counterEl.textContent = `${this.filteredBooks.length} كتاباً في ${this.currentFilter}`;
    }
  }

  renderStars(rating) {
    if (!rating || rating <= 0) return '';
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  render() {
    const toShow = this.filteredBooks.slice(0, this.visibleCount);
    this.grid.innerHTML = '';

    if (toShow.length === 0) {
      this.grid.innerHTML = `
        <div class="catalog-empty-notice">
          <p style="font-size: var(--text-base); color: var(--color-text-secondary);">ملقتش كتب مطابقة لاختيارك.. جرب تختار فلتر تاني أو اضغط على «الكل»!</p>
        </div>
      `;
      if (this.loadMoreBtn) this.loadMoreBtn.style.display = 'none';
      return;
    }

    const fragment = document.createDocumentFragment();

    toShow.forEach(book => {
      const card = document.createElement('article');
      card.className = 'catalog-book-card';
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'region');
      card.setAttribute('aria-label', `${book.title} تأليف ${book.author}`);

      const fallbackCover = "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D'200'%20height%3D'300'%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'%23121417'%2F%3E%3Ctext%20x%3D'50%25'%20y%3D'50%25'%20fill%3D'%23F1F3F5'%20font-size%3D'14'%20text-anchor%3D'middle'%20dy%3D'.3em'%3E%D8%BA%D9%84%D8%A7%D9%81%20%D8%A7%D9%84%D9%83%D8%AA%D8%A7%D8%A8%3C%2Ftext%3E%3C%2Fsvg%3E";
      const coverSrc = book.coverUrl || fallbackCover;
      const excerpt = book.description ? book.description.trim() : '';

      card.innerHTML = `
        <!-- Floating Bookmark Ribbon Badge (Top Left in RTL) -->
        <div class="catalog-bookmark-badge" title="علامة قراءة">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        </div>

        <!-- Cover Column (3D Book Volume) -->
        <div class="catalog-cover-col">
          <div class="catalog-cover-wrapper">
            <img src="${coverSrc}" alt="${book.title}" loading="lazy" onerror="this.src='${fallbackCover}'">
          </div>
        </div>

        <!-- Info Column -->
        <div class="catalog-info-col">
          <div class="catalog-header-content">
            <h4 class="catalog-book-title" dir="auto">${book.title}</h4>
            <p class="catalog-book-author" dir="auto">بقلم: ${book.author}</p>
            
            <div class="catalog-meta-tags">
              ${book.pages ? `<span class="catalog-meta-tag">${book.pages} صفحة</span>` : ''}
              ${book.publishedYear ? `<span class="catalog-meta-tag">نشر ${book.publishedYear}</span>` : ''}
              <span class="catalog-meta-tag catalog-meta-lang">${book.isArabic ? 'كتاب عربي' : 'كتاب إنجليزي'}</span>
            </div>

            <!-- Personal Rating Stars Only -->
            ${book.rating > 0 ? `
              <div class="catalog-rating-row">
                <div class="catalog-stars" aria-label="تقييمك: ${book.rating} من 5">${this.renderStars(book.rating)}</div>
              </div>
            ` : ''}

            <!-- Excerpt -->
            ${excerpt ? `<p class="catalog-excerpt" dir="auto">${excerpt}</p>` : ''}
          </div>

          <!-- Card Footer: Metric & Pill Button -->
          <div class="catalog-card-footer">
            ${book.averageRating ? `
              <div class="catalog-readers-indicator">
                <span class="catalog-readers-star">★</span>
                <span>تقييم القراء: ${book.averageRating} / 5</span>
              </div>
            ` : '<div></div>'}
            <a href="${book.goodreadsUrl}" target="_blank" rel="noopener noreferrer" class="catalog-pill-btn">
              <span>شوف الكتاب</span>
            </a>
          </div>
        </div>
      `;

      fragment.appendChild(card);
    });

    this.grid.appendChild(fragment);

    // Update Load More button state
    if (this.loadMoreBtn) {
      if (this.visibleCount >= this.filteredBooks.length) {
        this.loadMoreBtn.style.display = 'none';
      } else {
        this.loadMoreBtn.style.display = 'inline-flex';
        this.loadMoreBtn.innerHTML = `
          <span>وريني كتب تانية (${this.filteredBooks.length - this.visibleCount} كتاب متبقي)</span>
          <svg style="width: 14px; height: 14px; fill: currentColor;" viewBox="0 0 24 24">
            <path d="M7 10l5 5 5-5z"/>
          </svg>
        `;
      }
    }
  }
}
