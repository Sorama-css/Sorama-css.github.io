/**
 * Astro 静态博客增强脚本
 * 设计风格：莫兰迪低饱和配色 + 杂志排版
 *
 * 功能模块：
 *   1. 鼠标跟随光效        initMouseGlow
 *   2. 滚动视差            initParallax
 *   3. 滚动揭示动画        initReveal
 *   4. 标题逐字动画        initTextSplit
 *   5. 卡片 3D 倾斜        initTiltCards
 *   6. 数字滚动计数        initCountUp
 *   7. 页面加载过渡        initPageTransition
 *   8. 平滑锚点滚动        initSmoothScroll
 *   9. 阅读进度条          initReadingProgress
 *
 * 特性：
 *   - 尊重 prefers-reduced-motion，开启时跳过所有动画
 *   - 以 IIFE 包裹，不污染全局
 *   - 不依赖任何框架，兼容性好
 */
(function () {
  'use strict';

  /* ============================================================
   * 0. 公共工具与全局状态
   * ============================================================ */

  /** 用户是否开启了「减少动画」偏好 */
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** 鼠标实时坐标（用于光晕跟随） */
  var mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  /** 光晕当前坐标（平滑插值后） */
  var glow = { x: mouse.x, y: mouse.y };
  /** requestAnimationFrame 句柄 */
  var rafId = null;

  /**
   * 基于 requestAnimationFrame 的节流函数
   * 适用于 scroll / resize / mousemove 等高频事件
   * @param {Function} fn 需要节流的函数
   * @returns {Function}
   */
  function rafThrottle(fn) {
    var scheduled = false;
    return function () {
      if (scheduled) return;
      var ctx = this;
      var args = arguments;
      scheduled = true;
      requestAnimationFrame(function () {
        scheduled = false;
        fn.apply(ctx, args);
      });
    };
  }

  /* ============================================================
   * 1. 鼠标跟随光效
   *    创建一个跟随鼠标的柔和径向渐变光晕，rAF 平滑缓动跟随；
   *    暗色模式下颜色变亮。
   * ============================================================ */

  function initMouseGlow() {
    if (reduceMotion) return;
    // 仅在支持鼠标悬停的设备上启用（移动端无 mousemove，避免光晕卡在屏幕中央）
    if (!window.matchMedia('(hover: hover)').matches) return;

    var glowEl = document.createElement('div');
    glowEl.className = 'mouse-glow';
    glowEl.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:480px',
      'height:480px',
      'margin-left:-240px',
      'margin-top:-240px',
      'border-radius:50%',
      'pointer-events:none',
      'z-index:9999',
      'mix-blend-mode:soft-light',
      'will-change:transform'
    ].join(';');

    /** 根据配色模式更新光晕颜色（暗色模式稍亮） */
    function updateGlowColor() {
      var dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      // 莫兰迪暖灰色系：亮色 0.12，暗色 0.22
      var color = dark ? 'rgba(200,190,180,0.22)' : 'rgba(180,170,160,0.12)';
      glowEl.style.background =
        'radial-gradient(circle, ' + color + ' 0%, rgba(0,0,0,0) 70%)';
    }
    updateGlowColor();

    // 监听配色切换（兼容旧版 addListener）
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) {
      mq.addEventListener('change', updateGlowColor);
    } else if (mq.addListener) {
      mq.addListener(updateGlowColor);
    }

    document.body.appendChild(glowEl);

    // 记录鼠标目标位置
    window.addEventListener('mousemove', function (e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }, { passive: true });

    // 先把光晕放到屏幕中央，避免首帧出现在左上角
    glowEl.style.transform = 'translate3d(' + glow.x + 'px,' + glow.y + 'px,0)';

    // 平滑跟随循环（缓动系数 0.12）
    function loop() {
      glow.x += (mouse.x - glow.x) * 0.12;
      glow.y += (mouse.y - glow.y) * 0.12;
      glowEl.style.transform =
        'translate3d(' + glow.x + 'px,' + glow.y + 'px,0)';
      rafId = requestAnimationFrame(loop);
    }
    loop();
  }

  /* ============================================================
   * 9. 阅读进度条
   *    顶部固定进度条，莫兰迪色 #a8a29e，高度 3px，随滚动更新宽度。
   * ============================================================ */

  function initReadingProgress() {
    if (reduceMotion) return;

    var bar = document.createElement('div');
    bar.className = 'reading-progress';
    bar.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'height:3px',
      'width:0',
      'background:#a8a29e',
      'z-index:9998',
      'box-shadow:0 0 8px rgba(168,162,158,0.45)'
    ].join(';');
    document.body.appendChild(bar);

    var update = rafThrottle(function () {
      var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      var docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      var ratio = docHeight > 0 ? scrollTop / docHeight : 0;
      ratio = Math.max(0, Math.min(1, ratio));
      bar.style.width = (ratio * 100) + '%';
    });

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  }

  /* ============================================================
   * 2. 滚动视差
   *    对带 data-parallax 的元素根据滚动位置做轻微 translateY。
   *    速度系数通过 data-parallax-speed 设置，默认 0.3（可为负）。
   * ============================================================ */

  function initParallax() {
    if (reduceMotion) return;

    var els = document.querySelectorAll('[data-parallax]');
    if (!els.length) return;

    var items = [];
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var speed = parseFloat(el.getAttribute('data-parallax-speed'));
      if (isNaN(speed)) speed = 0.3; // 默认速度
      items.push({ el: el, speed: speed });
    }

    var update = rafThrottle(function () {
      var scrollY = window.pageYOffset || document.documentElement.scrollTop;
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        it.el.style.transform =
          'translate3d(0,' + (scrollY * it.speed) + 'px,0)';
      }
    });

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  }

  /* ============================================================
   * 3. 滚动揭示动画
   *    对 .reveal 元素使用 IntersectionObserver 做淡入上移，
   *    进入视口时添加 .revealed 类；支持 data-delay（毫秒）。
   * ============================================================ */

  function initReveal() {
    var els = document.querySelectorAll('.reveal:not(.revealed)');
    if (!els.length) return;

    // 减少动画 / 不支持 IntersectionObserver：直接全部显示
    if (reduceMotion || !('IntersectionObserver' in window)) {
      for (var i = 0; i < els.length; i++) els[i].classList.add('revealed');
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        if (!entry.isIntersecting) continue;
        var node = entry.target;
        var delay = parseInt(node.getAttribute('data-delay'), 10);
        if (isNaN(delay)) delay = 0;
        (function (n, ms) {
          setTimeout(function () { n.classList.add('revealed'); }, ms);
        })(node, delay);
        observer.unobserve(node);
      }
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    for (var j = 0; j < els.length; j++) observer.observe(els[j]);
  }

  /* ============================================================
   * 4. 标题逐字动画
   *    对 .text-split 元素将文字拆成单个字符的 span，依次淡入，
   *    每个字符有递增的 animation-delay。
   * ============================================================ */

  function initTextSplit() {
    var els = document.querySelectorAll('.text-split');
    if (!els.length) return;

    // 减少动画：保持原始文本，不拆分
    if (reduceMotion) return;

    // 注入关键帧样式（仅注入一次）
    if (!document.getElementById('text-split-style')) {
      var style = document.createElement('style');
      style.id = 'text-split-style';
      style.textContent =
        '@keyframes textSplitFade{' +
        'from{opacity:0;transform:translateY(0.45em)}' +
        'to{opacity:1;transform:translateY(0)}}' +
        '.text-split .char{display:inline-block;opacity:0;' +
        'animation:textSplitFade 0.6s cubic-bezier(0.2,0.7,0.3,1) forwards}';
      document.head.appendChild(style);
    }

    for (var i = 0; i < els.length; i++) splitText(els[i], i * 80);
  }

  /**
   * 将节点内的文本拆分为单字 span
   * 保留子元素（如 <br>、内嵌标签），仅拆分文本节点。
   * @param {Node} node
   * @param {number} baseDelay 起始延迟（毫秒）
   */
  function splitText(node, baseDelay) {
    // 防止重复拆分
    if (node.getAttribute('data-text-split-done') === '1') return;
    node.setAttribute('data-text-split-done', '1');

    var delay = baseDelay || 0;
    var step = 45; // 每个字符递增 45ms

    // 收集所有非空文本节点
    var walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null);
    var textNodes = [];
    var n;
    while ((n = walker.nextNode())) {
      if (n.nodeValue.replace(/\s/g, '').length > 0) textNodes.push(n);
    }

    for (var t = 0; t < textNodes.length; t++) {
      var textNode = textNodes[t];
      var text = textNode.nodeValue;
      var frag = document.createDocumentFragment();

      for (var c = 0; c < text.length; c++) {
        var ch = text.charAt(c);
        // 空白字符保留为文本节点，保证换行正常
        if (/\s/.test(ch)) {
          frag.appendChild(document.createTextNode(ch));
          continue;
        }
        var span = document.createElement('span');
        span.className = 'char';
        span.textContent = ch;
        span.style.animationDelay = delay + 'ms';
        frag.appendChild(span);
        delay += step;
      }
      textNode.parentNode.replaceChild(frag, textNode);
    }
  }

  /* ============================================================
   * 5. 卡片 3D 倾斜
   *    对 .tilt-card 元素，鼠标悬停时根据鼠标位置做轻微的
   *    rotateX/rotateY 倾斜（最大 8 度），离开时回正。
   * ============================================================ */

  function initTiltCards() {
    if (reduceMotion) return;

    var cards = document.querySelectorAll('.tilt-card');
    if (!cards.length) return;

    var MAX = 8; // 最大倾斜角度
    var PERSPECTIVE = 600;

    for (var i = 0; i < cards.length; i++) {
      (function (card) {
        card.style.willChange = 'transform';
        card.style.transition = 'transform 0.25s ease-out';

        card.addEventListener('mousemove', function (e) {
          var rect = card.getBoundingClientRect();
          var px = (e.clientX - rect.left) / rect.width;  // 0~1
          var py = (e.clientY - rect.top) / rect.height;   // 0~1
          var rotateY = (px - 0.5) * 2 * MAX;  // -MAX ~ MAX
          var rotateX = -(py - 0.5) * 2 * MAX; // 上下翻转
          card.style.transform =
            'perspective(' + PERSPECTIVE + 'px) ' +
            'rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg)';
        });

        card.addEventListener('mouseleave', function () {
          // 回正
          card.style.transform =
            'perspective(' + PERSPECTIVE + 'px) rotateX(0deg) rotateY(0deg)';
        });
      })(cards[i]);
    }
  }

  /* ============================================================
   * 6. 数字滚动计数
   *    对 .count-up[data-target="数字"] 元素，进入视口时
   *    从 0 滚动到目标值（easeOutCubic 缓动）。
   *    可选 data-duration 设置时长（毫秒，默认 1600）。
   * ============================================================ */

  function initCountUp() {
    var els = document.querySelectorAll('.count-up[data-target]');
    if (!els.length) return;

    // 减少动画 / 不支持 IntersectionObserver：直接显示目标值
    if (reduceMotion || !('IntersectionObserver' in window)) {
      for (var i = 0; i < els.length; i++) {
        els[i].textContent = els[i].getAttribute('data-target');
      }
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          countUp(entries[i].target);
          observer.unobserve(entries[i].target);
        }
      }
    }, { threshold: 0.5 });

    for (var j = 0; j < els.length; j++) observer.observe(els[j]);
  }

  /**
   * 单个元素从 0 滚动到目标值
   * @param {Element} el
   */
  function countUp(el) {
    var raw = el.getAttribute('data-target');
    var target = parseFloat(raw);
    if (isNaN(target)) target = 0;

    var duration = parseInt(el.getAttribute('data-duration'), 10);
    if (isNaN(duration)) duration = 1600;

    // 根据目标值的小数位决定保留位数
    var dotIndex = String(raw).indexOf('.');
    var decimals = dotIndex === -1 ? 0 : String(raw).length - dotIndex - 1;

    var startTime = null;

    function step(ts) {
      if (startTime === null) startTime = ts;
      var progress = Math.min((ts - startTime) / duration, 1);
      // easeOutCubic 缓动
      var eased = 1 - Math.pow(1 - progress, 3);
      var value = target * eased;
      el.textContent = decimals > 0
        ? value.toFixed(decimals)
        : Math.floor(value).toString();
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        // 终值精确显示
        el.textContent = decimals > 0 ? target.toFixed(decimals) : String(target);
      }
    }
    requestAnimationFrame(step);
  }

  /* ============================================================
   * 7. 页面加载过渡
   *    页面加载时给 body 添加 .loaded 类（配合 CSS 淡入）；
   *    对同源内部链接点击添加退出淡出效果。
   * ============================================================ */

  function initPageTransition() {
    // 添加 .loaded 类（尽早触发淡入）
    function markLoaded() {
      requestAnimationFrame(function () {
        document.body.classList.add('loaded');
      });
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', markLoaded);
    } else {
      markLoaded();
    }

    if (reduceMotion) return;

    // 内部链接点击：退出淡出后再跳转
    var links = document.querySelectorAll('a[href]');
    for (var i = 0; i < links.length; i++) {
      (function (a) {
        var href = a.getAttribute('href');
        // 跳过空链接、锚点、JS 伪协议
        if (!href || href.charAt(0) === '#' ||
            href.charAt(0) === 'j' && href.indexOf('javascript:') === 0) {
          return;
        }
        // 跳过新窗口打开与下载链接
        if (a.target === '_blank' || a.hasAttribute('download')) return;
        // 仅处理同源链接
        try {
          if (a.host && a.host !== window.location.host) return;
        } catch (e) { return; }

        a.addEventListener('click', function (e) {
          // 修饰键 / 非左键 / 已被阻止：交给浏览器默认行为
          if (e.defaultPrevented || e.button !== 0 ||
              e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
            return;
          }
          e.preventDefault();
          document.body.style.transition = 'opacity 0.32s ease';
          document.body.style.opacity = '0';
          setTimeout(function () {
            window.location.href = a.href;
          }, 320);
        });
      })(links[i]);
    }
  }

  /* ============================================================
   * 8. 平滑锚点滚动
   *    对 a[href^="#"] 做平滑滚动到目标元素。
   * ============================================================ */

  function initSmoothScroll() {
    var links = document.querySelectorAll('a[href^="#"]');
    for (var i = 0; i < links.length; i++) {
      (function (a) {
        a.addEventListener('click', function (e) {
          var href = a.getAttribute('href');
          if (!href || href === '#') return;
          var target = document.getElementById(href.slice(1));
          if (!target) return;
          e.preventDefault();
          target.scrollIntoView({
            behavior: reduceMotion ? 'auto' : 'smooth',
            block: 'start'
          });
        });
      })(links[i]);
    }
  }

  /* ============================================================
   * 启动入口
   * ============================================================ */

  function init() {
    initPageTransition();
    initReadingProgress();
    initMouseGlow();
    initParallax();
    initReveal();
    initTextSplit();
    initTiltCards();
    initCountUp();
    initSmoothScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 兼容 Astro View Transitions（客户端导航后重新初始化）；
  // 纯静态 MPA 下该事件不会触发，不影响默认行为。
  document.addEventListener('astro:page-load', init);
})();
