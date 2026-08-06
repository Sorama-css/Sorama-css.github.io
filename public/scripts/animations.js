// 页面滚动动画 & 交互增强
(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -60px 0px',
    threshold: 0.05,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  function initScrollAnimations() {
    const targets = document.querySelectorAll(
      '.post-item, .search-result-item, .tag-cloud .tag, .post-content h2, .post-content h3, .post-content pre, .post-content blockquote, .post-content img'
    );

    targets.forEach((el, index) => {
      el.classList.add('scroll-reveal');
      el.style.transitionDelay = `${Math.min(index * 30, 300)}ms`;
      observer.observe(el);
    });
  }

  const style = document.createElement('style');
  style.textContent = `
    .scroll-reveal {
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
                  transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
      will-change: opacity, transform;
    }
    .scroll-reveal.is-visible {
      opacity: 1;
      transform: translateY(0);
    }
    .post-item-title a {
      background-image: linear-gradient(currentColor, currentColor);
      background-size: 0% 1px;
      background-repeat: no-repeat;
      background-position: 0 100%;
      transition: background-size 0.3s ease;
    }
    .post-item-title a:hover {
      background-size: 100% 1px;
    }
  `;
  document.head.appendChild(style);

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId && targetId.length > 1) {
        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollAnimations);
  } else {
    initScrollAnimations();
  }
})();
