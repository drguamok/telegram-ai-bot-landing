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

// === Telegram Chat Renderer ===
const TgChat = {
  render(translations, lang) {
    const t = translations[lang];
    if (!t) return;

    document.querySelectorAll('[data-i18n-chat]').forEach((chatEl) => {
      const key = chatEl.dataset.i18nChat;
      const messages = t[key];
      if (!Array.isArray(messages)) return;

      chatEl.innerHTML = '';

      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        const prev = messages[i - 1];
        const next = messages[i + 1];

        const isUser = msg.role === 'user';
        const sameAsPrev = prev && prev.role === msg.role;
        const sameAsNext = next && next.role === msg.role;
        const isFirstInGroup = !sameAsPrev;
        const isLastInGroup = !sameAsNext;

        // Bot name label (first message in bot group)
        if (!isUser && isFirstInGroup) {
          const nameEl = document.createElement('div');
          nameEl.className = 'tg-bot-name';
          nameEl.textContent = 'Smart Assistant';
          chatEl.appendChild(nameEl);
        }

        // Row
        const row = document.createElement('div');
        row.className = `tg-row tg-row--${msg.role}`;
        if (isLastInGroup) row.classList.add('tg-row--gap');

        // Bot avatar or spacer
        if (!isUser) {
          if (isLastInGroup) {
            const avatar = document.createElement('div');
            avatar.className = 'tg-avatar';
            avatar.textContent = '🤖';
            row.appendChild(avatar);
          } else {
            const spacer = document.createElement('div');
            spacer.className = 'tg-avatar--spacer';
            row.appendChild(spacer);
          }
        }

        // Bubble
        const bubble = document.createElement('div');
        let bubbleClass = `tg-bubble tg-bubble--${msg.role}`;

        if (isUser) {
          if (!isFirstInGroup && !isLastInGroup) bubbleClass = 'tg-bubble tg-bubble--user-group';
          else if (!isFirstInGroup && isLastInGroup) bubbleClass = 'tg-bubble tg-bubble--user-last';
          else if (isFirstInGroup && !isLastInGroup) bubbleClass = 'tg-bubble tg-bubble--user tg-bubble--user-group';
        } else {
          if (!isFirstInGroup && !isLastInGroup) bubbleClass = 'tg-bubble tg-bubble--bot-group';
          else if (!isFirstInGroup && isLastInGroup) bubbleClass = 'tg-bubble tg-bubble--bot-last';
          else if (isFirstInGroup && !isLastInGroup) bubbleClass = 'tg-bubble tg-bubble--bot tg-bubble--bot-group';
        }

        bubble.className = bubbleClass;

        const textP = document.createElement('p');
        textP.className = 'tg-bubble__text';
        textP.textContent = msg.text;
        bubble.appendChild(textP);

        // Meta: time + checkmarks
        const meta = document.createElement('div');
        meta.className = 'tg-bubble__meta';
        const timeSpan = document.createElement('span');
        timeSpan.className = 'tg-bubble__time';
        timeSpan.textContent = msg.time;
        meta.appendChild(timeSpan);

        if (isUser) {
          const check = document.createElement('span');
          check.className = 'tg-bubble__check';
          check.textContent = '✓✓';
          meta.appendChild(check);
        }

        bubble.appendChild(meta);
        row.appendChild(bubble);
        chatEl.appendChild(row);
      }

      // Scroll to top initially
      chatEl.scrollTop = 0;
    });
  }
};

// === Carousel Dot Indicators ===
const TgCarousel = {
  init() {
    const carousel = document.getElementById('tg-carousel');
    const dotsContainer = document.getElementById('tg-dots');
    if (!carousel || !dotsContainer) return;

    const cards = carousel.querySelectorAll('.tg-card');
    const dots = dotsContainer.querySelectorAll('.tg-dot');

    const observerOptions = {
      root: carousel,
      threshold: 0.5
    };

    const carouselObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = entry.target.dataset.dialog;
          dots.forEach((dot) => dot.classList.remove('tg-dot--active'));
          const activeDot = dotsContainer.querySelector(`[data-index="${index}"]`);
          if (activeDot) activeDot.classList.add('tg-dot--active');
        }
      });
    }, observerOptions);

    cards.forEach((card) => carouselObserver.observe(card));

    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        const index = dot.dataset.index;
        const targetCard = carousel.querySelector(`[data-dialog="${index}"]`);
        if (targetCard) {
          targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      });
    });
  }
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

    // Render Telegram chat dialogs
    TgChat.render(this.translations, this.currentLang);

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
  TgCarousel.init();
});