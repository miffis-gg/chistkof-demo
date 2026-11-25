const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const marquee = document.querySelector('.review-window');

if ('IntersectionObserver' in window) {
  const reveals = new IntersectionObserver(entries => {
    for (const { target, isIntersecting } of entries) {
      if (!isIntersecting) continue;
      reveals.unobserve(target);
      if (reducedMotion.matches || !target.animate) continue;
      const isHero = target.matches('.hero-copy, .hero-about');
      target.animate(
        [{ opacity: .68, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: isHero ? 540 : 360, easing: 'cubic-bezier(.16, 1, .3, 1)' },
      );
    }
  }, { threshold: .04 });
  document.querySelectorAll([
    '.hero-copy', '.hero-about', '.services > h2', '.catalog-note', '.catalog-controls',
    '.service-group h3', '.service-list li', '.review-heading', '.review-footer',
    '.contact h2', '.contact-actions', '.contact-map', '.order-heading', '.cart-panel', '.footer',
  ].join(',')).forEach(element => reveals.observe(element));

  if (marquee) {
    new IntersectionObserver(([entry]) => {
      marquee.classList.toggle('offscreen', !entry.isIntersecting);
    }).observe(marquee);
    document.addEventListener('visibilitychange', () => {
      marquee.classList.toggle('inactive-tab', document.hidden);
    });
  }
}

let frame = 0;
let targetY = 0;
let renderedY = 0;
let lastTime = 0;

function stopWheelMotion() {
  cancelAnimationFrame(frame);
  frame = 0;
}

function moveWheel(time) {
  if (reducedMotion.matches || Math.abs(window.scrollY - renderedY) > 2) {
    stopWheelMotion();
    return;
  }
  const elapsed = lastTime ? Math.min(time - lastTime, 50) : 16;
  lastTime = time;
  const distance = targetY - renderedY;
  const done = Math.abs(distance) < 1;
  renderedY = done ? targetY : renderedY + distance * (1 - Math.exp(-elapsed / 88));
  window.scrollTo({ top: renderedY, behavior: 'instant' });
  if (done) stopWheelMotion();
  else frame = requestAnimationFrame(moveWheel);
}

window.addEventListener('wheel', event => {
  // Discrete mouse-wheel ticks get inertia. Trackpad gestures and native controls keep their own scrolling.
  const discrete = event.deltaMode !== 0 || (Math.abs(event.deltaY) >= 60 && event.deltaY % 10 === 0);
  if (reducedMotion.matches || !discrete || !event.cancelable || event.defaultPrevented
    || event.ctrlKey || event.shiftKey || !event.deltaY || Math.abs(event.deltaX) > Math.abs(event.deltaY)
    || event.target.closest?.('textarea, input, select, [contenteditable], .review-window, .product-dialog')) {
    stopWheelMotion();
    return;
  }
  const maxY = document.documentElement.scrollHeight - innerHeight;
  const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1;
  const start = frame ? targetY : window.scrollY;
  targetY = Math.max(0, Math.min(maxY, start + event.deltaY * unit));
  if (targetY === start && !frame) return;
  event.preventDefault();
  if (frame) return;
  renderedY = window.scrollY;
  lastTime = 0;
  frame = requestAnimationFrame(moveWheel);
}, { passive: false });

for (const event of ['hashchange', 'keydown', 'pointerdown', 'resize']) {
  window.addEventListener(event, stopWheelMotion);
}
reducedMotion.addEventListener('change', () => {
  stopWheelMotion();
  if (reducedMotion.matches) document.getAnimations().forEach(animation => {
    if (animation.effect?.target?.matches('.review-track')) return;
    animation.cancel();
  });
});
