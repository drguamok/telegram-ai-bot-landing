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
      { q: 'Is my data safe?', a: 'Yes. Messages are encrypted with AES-256 and we never read your private chats.' },
      { q: 'Can it send reminders?', a: 'Yes. Set one-time or recurring reminders, and the bot will message you at the right time.' },
      { q: 'How does memory work?', a: 'The bot remembers your context between chats — preferences, plans, and ongoing tasks. Memory is the same for Free and Pro.' },
      { q: 'What are the message limits?', a: 'Free: 30 messages, 3 photos, and 3 voice messages per day. Pro: 150 messages, 15 photos, and 15 voice messages per day.' },
      { q: 'Can I send photos and voice messages?', a: 'Yes! The bot understands photos and voice messages. Limits depend on your plan.' },
      { q: 'How do I pay for Pro?', a: 'Pro costs 150 Telegram Stars per month (~$2.50). You pay directly inside Telegram — no credit card needed.' },
      { q: 'What happens if I stop paying?', a: 'You revert to the Free tier. Your data stays encrypted and accessible.' }
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