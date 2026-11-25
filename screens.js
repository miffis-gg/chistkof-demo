const storefront = document.querySelector('#main');
const screens = [...document.querySelectorAll('[data-site-screen]')];
const skip = document.querySelector('.skip');
let shown = storefront;

function showCurrentScreen() {
  const hash = location.hash.slice(1);
  const next = screens.find(screen => screen.id === hash) ?? storefront;
  if (next === shown) return;
  storefront.hidden = next !== storefront;
  for (const screen of screens) {
    screen.hidden = screen !== next;
    const link = document.querySelector(`.site-header a[href="#${screen.id}"]`);
    if (screen === next) link?.setAttribute('aria-current', 'page');
    else link?.removeAttribute('aria-current');
  }
  skip.href = `#${next.id}`;
  shown = next;
  const destination = next === storefront ? document.getElementById(hash) ?? storefront : next;
  requestAnimationFrame(() => {
    if (shown !== next) return;
    destination.scrollIntoView({ behavior: next === storefront ? 'auto' : 'instant' });
    const heading = destination.querySelector('h1, h2') ?? destination;
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  });
}

window.addEventListener('hashchange', showCurrentScreen);
showCurrentScreen();
