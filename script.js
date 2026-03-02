// Scroll reveal animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active');
    }
  });
}, observerOptions);

const observeRevealElements = (root = document) => {
  root.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
};

// === i18n Module ===
const I18N = {
  translations: null,
  currentLang: 'en',

  async init() {
    try {
      const response = await fetch('lang/translations.json');
      if (!response.ok) {
        throw new Error(`Failed to load translations: ${response.status}`);
      }

      this.translations = await response.json();

      const savedLang = localStorage.getItem('lang');
      const browserLang = navigator.language?.slice(0, 2).toLowerCase();
      this.currentLang = savedLang || (this.translations[browserLang] ? browserLang : 'en');

      this.apply();
      this.initSwitcher();
    } catch (error) {
      console.error('i18n init failed:', error);
      this.renderFallbackFAQ();
      observeRevealElements();
    }
  },

  apply() {
    if (!this.translations) {
      return;
    }

    const t = this.translations[this.currentLang];
    if (!t) {
      return;
    }

    document.documentElement.lang = this.currentLang;

    if (t['meta.title']) {
      document.title = t['meta.title'];
    }

    if (t['meta.description']) {
      document
        .querySelector('meta[name="description"]')
        ?.setAttribute('content', t['meta.description']);
    }

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n;
      if (key && t[key] !== undefined) {
        el.textContent = t[key];
      }
    });

    document.querySelectorAll('[data-i18n-html]').forEach((el) => {
      const key = el.dataset.i18nHtml;
      if (key && t[key] !== undefined) {
        el.innerHTML = t[key];
      }
    });

    document.querySelectorAll('[data-i18n-list]').forEach((el) => {
      const key = el.dataset.i18nList;
      const items = key ? t[key] : null;
      if (!Array.isArray(items)) {
        return;
      }

      el.innerHTML = items.map((item) => `<li>${item}</li>`).join('');
    });

    document.querySelectorAll('[data-i18n-faq]').forEach((el) => {
      const key = el.dataset.i18nFaq;
      const items = key ? t[key] : null;
      if (!Array.isArray(items)) {
        return;
      }

      el.innerHTML = items
        .map(
          (item) => `
            <details class="faq__item reveal">
              <summary>${item.q}</summary>
              <p>${item.a}</p>
            </details>
          `
        )
        .join('');

      observeRevealElements(el);
    });

    document.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.classList.toggle('lang-btn--active', btn.dataset.lang === this.currentLang);
    });

    localStorage.setItem('lang', this.currentLang);
  },

  initSwitcher() {
    document.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const lang = btn.dataset.lang;
        if (!lang || !this.translations?.[lang]) {
          return;
        }

        this.currentLang = lang;
        this.apply();
      });
    });
  },

  renderFallbackFAQ() {
    const fallbackFAQs = [
      { q: 'Is my data safe?', a: 'Yes. All messages are encrypted with AES-256. We use zero-knowledge architecture — even we can\'t read your conversations.' },
      { q: 'Do you store my messages?', a: 'Only encrypted summaries for memory. Raw messages are discarded after processing. You can delete everything anytime with /delete.' },
      { q: 'Can I use my own API key?', a: 'Yes. BYOK (Bring Your Own Key) mode lets you connect your OpenAI or Anthropic key. We add no markup.' },
      { q: 'What happens if I stop paying?', a: 'You revert to Free tier. Your data stays encrypted and you can export anything before canceling.' },
      { q: 'Is it open source?', a: 'The core is open source. You can self-host or audit the code on GitHub.' }
    ];

    document.querySelectorAll('[data-i18n-faq]').forEach((el) => {
      el.innerHTML = fallbackFAQs
        .map(
          (item) => `
            <details class="faq__item reveal">
              <summary>${item.q}</summary>
              <p>${item.a}</p>
            </details>
          `
        )
        .join('');

      observeRevealElements(el);
    });
  }
};

// Smooth scroll for anchor links
const initSmoothScroll = () => {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (event) {
      event.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
};

document.addEventListener('DOMContentLoaded', () => {
  observeRevealElements();
  initSmoothScroll();
  I18N.init();
});