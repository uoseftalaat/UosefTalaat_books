/**
 * 3D Responsive Interactive Book Slider
 * Built for Uosef Talaat's 5-Star Masterworks Showcase
 */

export class BookSlider3D {
  constructor(options = {}) {
    this.container = document.querySelector(options.container || '#slider-container');
    this.track = document.querySelector(options.track || '#slider-track');
    this.detailsBox = document.querySelector(options.detailsBox || '#slider-details');
    this.prevBtn = document.querySelector(options.prevBtn || '#slider-prev');
    this.nextBtn = document.querySelector(options.nextBtn || '#slider-next');
    this.dotsContainer = document.querySelector(options.dotsContainer || '#slider-dots');
    
    this.books = [];
    this.currentIndex = 0;
    this.autoPlayTimer = null;
    this.autoPlayDelay = options.autoPlayDelay || 6000;
    this.touchStartX = 0;
    this.touchEndX = 0;
    
    this.init();
  }

  async init() {
    if (!this.track) return;
    
    try {
      const res = await fetch('data/five-stars.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.books = await res.json();
    } catch (err) {
      console.error('Failed to load 5-star books for 3D slider:', err);
      return;
    }

    if (!this.books || this.books.length === 0) return;

    this.render();
    this.bindEvents();
    this.updatePositions();
    this.startAutoPlay();
  }

  render() {
    this.track.innerHTML = '';
    if (this.dotsContainer) this.dotsContainer.innerHTML = '';

    this.books.forEach((book, index) => {
      // 3D Book Volume Element
      const card = document.createElement('div');
      card.className = 'slider-book-card';
      card.dataset.index = index;
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `${book.title} - ${book.author}`);

      const img = document.createElement('img');
      img.className = 'slider-book-cover';
      img.src = book.coverUrl;
      img.alt = book.title;
      img.loading = index < 3 ? 'eager' : 'lazy';

      card.appendChild(img);
      this.track.appendChild(card);
    });

    // Pagination: Counter pill for large list, dots for small list
    if (this.dotsContainer) {
      if (this.books.length <= 8) {
        this.books.forEach((_, index) => {
          const dot = document.createElement('button');
          dot.className = `slider-dot ${index === 0 ? 'active' : ''}`;
          dot.dataset.index = index;
          dot.setAttribute('aria-label', `انتقل إلى الكتاب رقم ${index + 1}`);
          this.dotsContainer.appendChild(dot);
        });
      } else {
        const counter = document.createElement('div');
        counter.className = 'slider-counter-pill';
        counter.id = 'slider-counter-display';
        counter.textContent = `${this.currentIndex + 1} من ${this.books.length}`;
        this.dotsContainer.appendChild(counter);
      }
    }
  }

  bindEvents() {
    // Controls
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => {
        this.prev();
        this.resetAutoPlay();
      });
    }

    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => {
        this.next();
        this.resetAutoPlay();
      });
    }

    // Direct card click
    this.track.addEventListener('click', (e) => {
      const card = e.target.closest('.slider-book-card');
      if (!card) return;
      const idx = parseInt(card.dataset.index, 10);
      if (idx !== this.currentIndex) {
        this.goTo(idx);
        this.resetAutoPlay();
      }
    });

    // Dots click (if using dot buttons)
    if (this.dotsContainer) {
      this.dotsContainer.addEventListener('click', (e) => {
        const dot = e.target.closest('.slider-dot');
        if (!dot) return;
        const idx = parseInt(dot.dataset.index, 10);
        this.goTo(idx);
        this.resetAutoPlay();
      });
    }

    // Keyboard support
    document.addEventListener('keydown', (e) => {
      // Check if slider is in viewport
      const rect = this.container.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (!inView) return;

      if (e.key === 'ArrowLeft') {
        this.next();
        this.resetAutoPlay();
      } else if (e.key === 'ArrowRight') {
        this.prev();
        this.resetAutoPlay();
      }
    });

    // Touch Swipe support (Reversed per user request)
    this.track.addEventListener('touchstart', (e) => {
      this.touchStartX = e.changedTouches[0].screenX;
      this.stopAutoPlay();
    }, { passive: true });

    this.track.addEventListener('touchend', (e) => {
      this.touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe();
      this.startAutoPlay();
    }, { passive: true });

    // Pause on hover
    this.container.addEventListener('mouseenter', () => this.stopAutoPlay());
    this.container.addEventListener('mouseleave', () => this.startAutoPlay());
  }

  handleSwipe() {
    const diff = this.touchEndX - this.touchStartX;
    if (Math.abs(diff) < 40) return; // Threshold

    // Reversed swipe direction per user request
    if (diff > 0) {
      this.next();
    } else {
      this.prev();
    }
  }

  updatePositions() {
    const total = this.books.length;
    const cards = this.track.querySelectorAll('.slider-book-card');

    cards.forEach((card, idx) => {
      let offset = idx - this.currentIndex;

      if (offset > Math.floor(total / 2)) {
        offset -= total;
      } else if (offset < -Math.floor(total / 2)) {
        offset += total;
      }

      if (offset === 0) {
        card.setAttribute('data-pos', '0');
      } else if (offset === 1) {
        card.setAttribute('data-pos', '1');
      } else if (offset === -1) {
        card.setAttribute('data-pos', '-1');
      } else if (offset === 2) {
        card.setAttribute('data-pos', '2');
      } else if (offset === -2) {
        card.setAttribute('data-pos', '-2');
      } else {
        card.setAttribute('data-pos', 'hidden');
      }
    });

    // Update Dots / Counter
    if (this.dotsContainer) {
      const counterEl = document.querySelector('#slider-counter-display');
      if (counterEl) {
        counterEl.textContent = `${this.currentIndex + 1} من ${this.books.length}`;
      } else {
        const dots = this.dotsContainer.querySelectorAll('.slider-dot');
        dots.forEach((dot, idx) => {
          dot.classList.toggle('active', idx === this.currentIndex);
        });
      }
    }

    // Update Details panel
    this.updateDetails();
  }

  updateDetails() {
    if (!this.detailsBox || !this.books[this.currentIndex]) return;
    const book = this.books[this.currentIndex];
    const fallbackDesc = 'من روائع الكتب اللي أثرت في طريقة تفكيري وتركت بصمة حقيقية.. تجربة قراءة استثنائية تستحق كل دقيقة.';
    const desc = book.description && book.description.trim() ? book.description.trim() : fallbackDesc;

    this.detailsBox.style.opacity = '0';
    setTimeout(() => {
      this.detailsBox.innerHTML = `
        <div class="slider-active-stars" aria-label="تقييم 5 من 5">
          ★★★★★
        </div>
        <h3 class="slider-active-title font-editorial" dir="auto">${book.title}</h3>
        <p class="slider-active-author">${book.author}</p>
        <p class="slider-active-desc" dir="auto">${desc}</p>
        <div class="slider-active-cta-wrap">
          <a href="${book.goodreadsUrl}" target="_blank" rel="noopener noreferrer" class="btn-secondary slider-cta-btn">
            <span>شوف الكتاب على Goodreads</span>
            <svg style="width: 14px; height: 14px; fill: currentColor; transform: scaleX(-1);" viewBox="0 0 24 24">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
        </div>
      `;
      this.detailsBox.style.opacity = '1';
    }, 150);
  }

  next() {
    this.currentIndex = (this.currentIndex + 1) % this.books.length;
    this.updatePositions();
  }

  prev() {
    this.currentIndex = (this.currentIndex - 1 + this.books.length) % this.books.length;
    this.updatePositions();
  }

  goTo(index) {
    this.currentIndex = index;
    this.updatePositions();
  }

  startAutoPlay() {
    this.stopAutoPlay();
    this.autoPlayTimer = setInterval(() => this.next(), this.autoPlayDelay);
  }

  stopAutoPlay() {
    if (this.autoPlayTimer) {
      clearInterval(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
  }

  resetAutoPlay() {
    this.stopAutoPlay();
    this.startAutoPlay();
  }
}
