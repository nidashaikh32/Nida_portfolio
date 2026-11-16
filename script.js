/* =========================================================
   Nida Shaikh – Portfolio  |  script.js
   What this file does:
   1. Marks the page as "JS enabled" (used by the CSS reveal effect)
   2. Mobile menu open / close
   3. Navbar background on scroll + highlights the current section
   4. Fades sections in as you scroll
   5. Hero panels gently follow the mouse (desktop only)
   6. Animated "connected nodes" background
   7. Updates the footer year
   Smooth scrolling itself is done in style.css (scroll-behavior: smooth).
   ========================================================= */

(() => {
  'use strict';

  // 1. Tell the CSS that JavaScript is running
  document.documentElement.classList.add('js');

  // Does the visitor prefer reduced motion? (accessibility setting)
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 2. MOBILE MENU ---------- */
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('nav-links');

  function setMenu(open) {
    menu.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  toggle.addEventListener('click', () => setMenu(!menu.classList.contains('open')));

  // Close the menu after tapping a link, or when pressing Escape
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- 3. NAVBAR STATE + ACTIVE LINK ---------- */
  const header = document.querySelector('.site-header');
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 20);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Highlight the nav link of the section currently in view
  const navLinks = document.querySelectorAll('.nav-links a');
  const sections = document.querySelectorAll('main section[id]');

  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(s => spy.observe(s));
  }

  /* ---------- 4. SCROLL REVEAL ---------- */
  const revealEls = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window && !reduceMotion) {
    // Small stagger so cards in the same row appear one after another
    revealEls.forEach((el, i) => { el.style.transitionDelay = (i % 3) * 90 + 'ms'; });

    const revealer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target); // animate only once
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => revealer.observe(el));
  } else {
    // Older browsers or reduced motion: just show everything
    revealEls.forEach(el => el.classList.add('visible'));
  }

  /* ---------- 5. HERO PANEL PARALLAX ---------- */
  const holo = document.getElementById('holo');
  const canHover = window.matchMedia('(hover: hover)').matches;

  if (holo && canHover && !reduceMotion) {
    const hero = document.getElementById('home');
    hero.addEventListener('mousemove', e => {
      const r = hero.getBoundingClientRect();
      // Values from -1 to 1 depending on where the mouse is
      holo.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5) * 2);
      holo.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5) * 2);
    });
    hero.addEventListener('mouseleave', () => {
      holo.style.setProperty('--mx', 0);
      holo.style.setProperty('--my', 0);
    });
  }

  /* ---------- 6. CONNECTED-NODES BACKGROUND ---------- */
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  let w, h, dots = [], rafId = null;

  const COLORS = ['34,229,255', '139,92,246', '79,140,255']; // cyan, violet, blue
  const LINK_DISTANCE = 130;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Fewer dots on small screens keeps it light and uncluttered
    const count = Math.min(70, Math.floor((w * h) / 20000));
    dots = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.4 + 0.6,
      c: COLORS[Math.floor(Math.random() * COLORS.length)]
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < dots.length; i++) {
      const a = dots[i];

      // Move and bounce off the edges
      a.x += a.vx; a.y += a.vy;
      if (a.x < 0 || a.x > w) a.vx *= -1;
      if (a.y < 0 || a.y > h) a.vy *= -1;

      // Dot
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${a.c},0.7)`;
      ctx.fill();

      // Lines to nearby dots
      for (let j = i + 1; j < dots.length; j++) {
        const b = dots[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < LINK_DISTANCE) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(${a.c},${0.16 * (1 - dist / LINK_DISTANCE)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
  }

  function loop() {
    draw();
    rafId = requestAnimationFrame(loop);
  }

  resize();
  if (reduceMotion) {
    draw(); // one still frame only
  } else {
    loop();
    // Pause the animation when the tab isn't visible (saves battery)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { cancelAnimationFrame(rafId); rafId = null; }
      else if (!rafId) loop();
    });
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { resize(); if (reduceMotion) draw(); }, 200);
  });

  /* ---------- 7. FOOTER YEAR ---------- */
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
