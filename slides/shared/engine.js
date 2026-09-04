/**
 * Speed of Thought — Shared Slide Engine
 *
 * Reusable slide engine for all three presentation decks.
 * Handles keyboard/touch navigation, progress bar, slide counter,
 * speaker notes, hash-based deep linking, and transitions.
 *
 * Usage:
 *   <script src="../shared/engine.js"></script>
 *   <script>
 *     const deck = new SlideEngine({
 *       transition: 'slide-up',   // fade | slide-up | scale | crossfade
 *       autoAdvance: 0,           // ms between slides (0 = disabled)
 *     });
 *   </script>
 */

class SlideEngine {
  /**
   * @param {Object} options
   * @param {string} [options.transition='fade'] - Transition type
   * @param {number} [options.autoAdvance=0] - Auto-advance interval in ms (0 = off)
   * @param {Function} [options.onSlideChange] - Callback(index, slide) on change
   */
  constructor(options = {}) {
    this.transition = options.transition ?? 'fade';
    this.autoAdvance = options.autoAdvance ?? 0;
    this.onSlideChange = options.onSlideChange ?? null;

    this.current = 0;
    this.slides = [];
    this.notesVisible = false;
    this.hintTimeout = null;
    this.autoTimer = null;
    this.touchStartX = 0;
    this.touchStartY = 0;

    // Wait for DOM
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this._init());
    } else {
      this._init();
    }
  }

  /** Initialize the engine after DOM is ready */
  _init() {
    // Find slide deck container
    this.deck = document.querySelector('.slide-deck');
    if (!this.deck) {
      console.warn('[SlideEngine] No .slide-deck element found');
      return;
    }

    // Apply transition class
    this.deck.classList.add(`transition-${this.transition}`);

    // Collect slides
    this.slides = Array.from(this.deck.querySelectorAll('.slide'));
    if (this.slides.length === 0) {
      console.warn('[SlideEngine] No .slide elements found');
      return;
    }

    // Build UI components
    this._createProgressBar();
    this._createCounter();
    this._createNotesPanel();
    this._createHint();

    // Bind events
    this._bindKeyboard();
    this._bindTouch();
    this._bindHash();
    this._bindControls();

    // Read initial slide from hash or default to 0
    const hashIndex = this._getHashIndex();
    this.current = hashIndex >= 0 ? hashIndex : 0;

    // Show initial slide
    this._showSlide(this.current, false);

    // Start auto-advance if configured
    if (this.autoAdvance > 0) {
      this._startAutoAdvance();
    }

    // Auto-hide hint after 5 seconds
    this.hintTimeout = setTimeout(() => {
      const hint = document.querySelector('.slide-hint');
      if (hint) hint.classList.add('hidden');
    }, 5000);
  }

  /* ===========================================================
     SLIDE NAVIGATION
     =========================================================== */

  /** Navigate to the next slide */
  next() {
    if (this.current < this.slides.length - 1) {
      this.current++;
      this._showSlide(this.current);
      this._resetAutoAdvance();
    }
  }

  /** Navigate to the previous slide */
  prev() {
    if (this.current > 0) {
      this.current--;
      this._showSlide(this.current);
      this._resetAutoAdvance();
    }
  }

  /** Jump to a specific slide index */
  goTo(index) {
    const clamped = Math.max(0, Math.min(index, this.slides.length - 1));
    if (clamped !== this.current) {
      this.current = clamped;
      this._showSlide(this.current);
      this._resetAutoAdvance();
    }
  }

  /** Show a specific slide */
  _showSlide(index, updateHash = true) {
    this.slides.forEach((slide, i) => {
      const isActive = i === index;
      slide.classList.toggle('active', isActive);

      // Reset entrance animations when leaving a slide
      if (!isActive) {
        const animEls = slide.querySelectorAll('[class*="anim-fade"]');
        animEls.forEach((el) => {
          el.style.animation = 'none';
          // Trigger reflow
          el.offsetHeight; // eslint-disable-line no-unused-expressions
          el.style.animation = '';
        });
      }
    });

    // Update progress bar
    this._updateProgress();

    // Update counter
    this._updateCounter();

    // Update notes
    this._updateNotes();

    // Update hash
    if (updateHash) {
      this._setHash(index);
    }

    // Callback
    if (this.onSlideChange) {
      this.onSlideChange(index, this.slides[index]);
    }
  }

  /* ===========================================================
     PROGRESS BAR
     =========================================================== */

  _createProgressBar() {
    const bar = document.createElement('div');
    bar.className = 'slide-progress';
    bar.id = 'slide-progress';
    document.body.appendChild(bar);
    this.progressBar = bar;
  }

  _updateProgress() {
    const pct = this.slides.length <= 1
      ? 100
      : (this.current / (this.slides.length - 1)) * 100;
    this.progressBar.style.width = `${pct}%`;
  }

  /* ===========================================================
     SLIDE COUNTER
     =========================================================== */

  _createCounter() {
    const counter = document.createElement('div');
    counter.className = 'slide-counter';
    counter.id = 'slide-counter';
    document.body.appendChild(counter);
    this.counter = counter;
  }

  _updateCounter() {
    this.counter.textContent = `${this.current + 1} / ${this.slides.length}`;
  }

  /* ===========================================================
     SPEAKER NOTES PANEL
     =========================================================== */

  _createNotesPanel() {
    const panel = document.createElement('div');
    panel.className = 'slide-notes-panel';
    panel.id = 'slide-notes-panel';
    panel.innerHTML = `
      <div class="notes-label">Speaker Notes</div>
      <div class="notes-content" id="notes-content">No notes for this slide.</div>
    `;
    document.body.appendChild(panel);
    this.notesPanel = panel;
    this.notesContent = panel.querySelector('#notes-content');
  }

  _updateNotes() {
    const slide = this.slides[this.current];
    const notes = slide?.getAttribute('data-notes') ?? '';
    this.notesContent.textContent = notes || 'No notes for this slide.';
  }

  toggleNotes() {
    this.notesVisible = !this.notesVisible;
    this.notesPanel.classList.toggle('visible', this.notesVisible);
  }

  /* ===========================================================
     KEYBOARD HINT
     =========================================================== */

  _createHint() {
    // Only show if no existing hint
    if (document.querySelector('.slide-hint')) return;

    const hint = document.createElement('div');
    hint.className = 'slide-hint';
    hint.textContent = '← → Navigate  •  N Notes  •  P Export PDF  •  Esc Overview';
    document.body.appendChild(hint);
  }

  /* ===========================================================
     KEYBOARD NAVIGATION
     =========================================================== */

  _bindKeyboard() {
    document.addEventListener('keydown', (e) => {
      // Don't capture when typing in inputs
      if (e.target.matches('input, textarea, select')) return;

      switch (e.key) {
        case 'ArrowRight':
        case ' ':
        case 'PageDown':
          e.preventDefault();
          this.next();
          break;

        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          this.prev();
          break;

        case 'Home':
          e.preventDefault();
          this.goTo(0);
          break;

        case 'End':
          e.preventDefault();
          this.goTo(this.slides.length - 1);
          break;

        case 'n':
        case 'N':
          e.preventDefault();
          this.toggleNotes();
          break;

        case 'p':
        case 'P':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            this.exportPdf();
          }
          break;

        case 'Escape':
          if (this.notesVisible) {
            this.toggleNotes();
          }
          break;
      }
    });
  }

  /* ===========================================================
     TOUCH / SWIPE NAVIGATION
     =========================================================== */

  _bindTouch() {
    document.addEventListener('touchstart', (e) => {
      this.touchStartX = e.changedTouches[0].screenX;
      this.touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      const deltaX = e.changedTouches[0].screenX - this.touchStartX;
      const deltaY = e.changedTouches[0].screenY - this.touchStartY;
      const minSwipe = 50;

      // Only handle horizontal swipes (ignore vertical scrolling)
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipe) {
        if (deltaX < 0) {
          this.next();
        } else {
          this.prev();
        }
      }
    }, { passive: true });
  }

  /* ===========================================================
     HASH-BASED DEEP LINKING
     =========================================================== */

  _bindHash() {
    window.addEventListener('hashchange', () => {
      const index = this._getHashIndex();
      if (index >= 0 && index !== this.current) {
        this.current = index;
        this._showSlide(this.current, false);
      }
    });
  }

  _getHashIndex() {
    const hash = window.location.hash;
    const match = hash.match(/^#slide-(\d+)$/);
    if (match) {
      const index = parseInt(match[1], 10) - 1; // 1-based to 0-based
      if (index >= 0 && index < this.slides.length) {
        return index;
      }
    }
    return -1;
  }

  _setHash(index) {
    const newHash = `#slide-${index + 1}`;
    if (window.location.hash !== newHash) {
      history.replaceState(null, '', newHash);
    }
  }

  exportPdf() {
    window.print();
  }

  /* ===========================================================
     NAV BUTTON BINDINGS
     =========================================================== */

  _bindControls() {
    // Bind prev/next buttons if they exist
    const prevBtn = document.querySelector('[data-slide-prev]');
    const nextBtn = document.querySelector('[data-slide-next]');
    let exportBtn = document.querySelector('[data-slide-export]');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.prev());
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.next());
    }

    // Auto-inject export button if slide-controls exists but no export button yet
    const controls = document.querySelector('.slide-controls');
    if (controls && !exportBtn) {
      exportBtn = document.createElement('button');
      exportBtn.setAttribute('data-slide-export', '');
      exportBtn.setAttribute('title', 'Export PDF / Print (P)');
      exportBtn.textContent = 'PDF';
      controls.appendChild(exportBtn);
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportPdf());
    }
  }

  /* ===========================================================
     AUTO-ADVANCE TIMER
     =========================================================== */

  _startAutoAdvance() {
    this.autoTimer = setInterval(() => {
      if (this.current < this.slides.length - 1) {
        this.next();
      } else {
        clearInterval(this.autoTimer);
      }
    }, this.autoAdvance);
  }

  _resetAutoAdvance() {
    if (this.autoAdvance > 0 && this.autoTimer) {
      clearInterval(this.autoTimer);
      this._startAutoAdvance();
    }
  }
}

// Export for ES modules (optional, works without)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SlideEngine;
}
