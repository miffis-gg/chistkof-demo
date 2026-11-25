const form = document.querySelector('.cart-form');
const items = new Map();
const areas = new Map();
const serviceButtons = [...document.querySelectorAll('[data-service]')];
const prices = new Map(serviceButtons.map(button => [button.dataset.service, readCatalogPrice(button.closest('li'))]));
const number = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 });
const list = form.querySelector('[data-cart-items]');
const empty = form.querySelector('[data-cart-empty]');
const count = document.querySelector('[data-cart-count]');
const orderCount = document.querySelector('[data-order-count]');
const estimate = form.querySelector('[data-estimate]');
const estimateNote = form.querySelector('[data-estimate-note]');
const plural = new Intl.PluralRules('ru');
const details = form.querySelector('#order-details');
const draft = form.querySelector('#order-draft');
const copy = form.querySelector('[data-copy-draft]');
const status = form.querySelector('[data-cart-status]');
const destinations = [...form.querySelectorAll('[data-draft-url]')];
details.value = '';

function updateDraft() {
  const note = details.value.trim();
  const lines = [...items].map(([service, quantity]) => {
    const area = areas.get(service);
    if (area > 0) return `• ${service}, ${number.format(area)} м²`;
    if (prices.get(service)?.byWeight) return `• ${service}, ${quantity} кг`;
    return `• ${service}${quantity > 1 ? ` × ${quantity}` : ''}`;
  });
  draft.value = lines.length || note ? [
    'Здравствуйте! Хочу уточнить стоимость и доступность.',
    lines.join('\n'),
    note ? `Детали: ${note}` : '',
  ].filter(Boolean).join('\n\n') : '';
  for (const button of [copy, ...destinations]) button.disabled = !draft.value;
}

function updateEstimate() {
  let subtotal = 0;
  let from = false;
  let missingArea = false;
  let unpriced = false;
  for (const [service, quantity] of items) {
    const price = prices.get(service);
    if (price?.amount == null) { unpriced = true; continue; }
    const units = price.byArea ? areas.get(service) : quantity;
    if (!units) { missingArea = true; continue; }
    subtotal += price.amount * units;
    from ||= price.from;
  }
  estimate.textContent = subtotal ? `${from ? 'от ' : ''}${number.format(subtotal)} ₽` : '—';
  const notes = [
    missingArea ? 'Укажите площадь для расчёта по м².' : '',
    unpriced ? 'Позиции без цены в сумму не вошли.' : '',
    subtotal ? 'Окончательную цену уточняйте у компании.' : '',
  ].filter(Boolean);
  estimateNote.textContent = notes.join(' ') || 'Выберите позиции, чтобы увидеть расчёт.';
}

function updateCart() {
  const total = [...items.values()].reduce((sum, quantity) => sum + quantity, 0);
  count.textContent = total;
  count.hidden = total === 0;
  orderCount.textContent = `${total} ${{ one: 'позиция', few: 'позиции', many: 'позиций', other: 'позиции' }[plural.select(total)]}`;
  empty.hidden = total > 0;
  list.replaceChildren(...[...items].map(([service, quantity]) => {
    const row = document.createElement('li');
    const label = document.createElement('span');
    label.textContent = service;
    const price = prices.get(service);
    const stepper = document.createElement('div');
    stepper.className = 'quantity-stepper';
    const value = document.createElement('span');
    value.textContent = price?.byWeight ? `${quantity} кг` : quantity;
    value.setAttribute('aria-label', `Количество: ${quantity}`);
    const stepButton = delta => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = delta < 0 ? 'remove-item' : 'increase-item';
      button.textContent = price?.byArea ? 'Убрать' : delta < 0 ? '−' : '+';
      button.setAttribute('aria-label', `${delta < 0 ? 'Убрать' : 'Добавить'} одну позицию: ${service}`);
      button.addEventListener('click', () => {
        const next = quantity + delta;
        if (next > 0) items.set(service, next);
        else { items.delete(service); areas.delete(service); }
        const index = [...list.children].indexOf(row);
        updateCart();
        status.textContent = next ? `${service}: ${next}` : `Убрано: ${service}`;
        const target = list.children[Math.min(index, list.children.length - 1)];
        (target?.querySelector(`.${button.className}`) || details).focus({ preventScroll: true });
      });
      return button;
    };
    if (price?.byArea) {
      const areaLabel = document.createElement('label');
      areaLabel.className = 'cart-area';
      areaLabel.textContent = 'Площадь, м²';
      const area = document.createElement('input');
      area.type = 'number';
      area.min = '0.01';
      area.max = '1000000';
      area.step = 'any';
      area.inputMode = 'decimal';
      area.value = areas.get(service) ?? '';
      area.addEventListener('input', () => {
        if (area.validity.valid && area.valueAsNumber > 0) areas.set(service, area.valueAsNumber);
        else areas.delete(service);
        updateEstimate();
        updateDraft();
      });
      areaLabel.append(area);
      stepper.append(areaLabel, stepButton(-1));
    } else {
      stepper.append(stepButton(-1), value, stepButton(1));
    }
    row.append(label, stepper);
    return row;
  }));
  updateDraft();
  updateEstimate();
}

for (const button of serviceButtons) {
  const addPosition = (event) => {
    if (button.disabled) return;
    const service = button.dataset.service;
    const selected = event.type === 'catalog:add' ? event.detail : null;
    const quantity = Number.isInteger(selected?.quantity) && selected.quantity >= 1 && selected.quantity <= 99
      ? selected.quantity : 1;
    if (prices.get(service)?.byArea) {
      items.set(service, 1);
      if (Number.isFinite(selected?.area) && selected.area >= .01 && selected.area <= 1000000) areas.set(service, selected.area);
    } else {
      items.set(service, (items.get(service) ?? 0) + quantity);
    }
    updateCart();
    status.textContent = `Добавлено: ${service}`;
    button.textContent = 'Добавлено ✓';
    clearTimeout(button.resetLabel);
    button.resetLabel = setTimeout(() => { button.textContent = 'В корзину'; }, 1000);
  };
  button.addEventListener('click', addPosition);
  button.addEventListener('catalog:add', addPosition);
}

form.addEventListener('submit', event => event.preventDefault());
details.addEventListener('input', updateDraft);
for (const button of destinations) {
  button.addEventListener('click', () => {
    if (!draft.value) return;
    const destination = new URL(button.dataset.draftUrl);
    if (destination.hostname === 'telegram.me') destination.hostname = 't.me';
    destination.searchParams.set('text', draft.value);
    window.open(destination.href, '_blank', 'noopener,noreferrer');
  });
}
copy.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(draft.value);
    status.textContent = 'Текст скопирован.';
  } catch {
    draft.focus();
    draft.select();
    status.textContent = 'Текст выделен. Скопируйте его сочетанием Ctrl+C или через меню.';
  }
});
updateCart();
