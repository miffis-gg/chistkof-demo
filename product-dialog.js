const catalog = document.querySelector('#services');
const dialog = document.querySelector('#product-dialog');
const media = dialog.querySelector('[data-product-media]');
const productRelated = dialog.querySelector('[data-product-related]');
const title = dialog.querySelector('#product-title');
const description = dialog.querySelector('#product-description');
const price = dialog.querySelector('[data-product-price]');
const priceNote = dialog.querySelector('[data-product-price-note]');
const productSelection = dialog.querySelector('[data-product-selection]');
const productQuantity = dialog.querySelector('.product-quantity');
const productUnit = dialog.querySelector('[data-product-unit]');
const productCount = dialog.querySelector('[data-product-count]');
const productSteps = [...dialog.querySelectorAll('[data-product-step]')];
const productArea = dialog.querySelector('.product-area');
const productAreaInput = productArea.querySelector('input');
const productTotal = dialog.querySelector('[data-product-total]');
const productNumber = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 });
const add = dialog.querySelector('[data-product-add]');
const productStatus = dialog.querySelector('[data-product-status]');
let addedFromCard = null;
let openedFrom = null;
let backdropPointer = false;
let selectedProduct = null;
let productRate = null;
let selectedQuantity = 1;

function selectedArea() {
  return productAreaInput.validity.valid && productAreaInput.valueAsNumber > 0
    ? productAreaInput.valueAsNumber : null;
}

function updateProductEstimate() {
  productCount.textContent = selectedQuantity;
  productSteps[0].disabled = selectedQuantity <= 1;
  productSteps[1].disabled = selectedQuantity >= 99;
  const units = productRate.byArea ? selectedArea() : selectedQuantity;
  if (productRate.amount === null) productTotal.textContent = 'По запросу';
  else if (!units) productTotal.textContent = 'Укажите площадь';
  else productTotal.textContent = `${productRate.from ? 'от ' : ''}${productNumber.format(units * productRate.amount)} ₽`;
  add.disabled = productRate.byArea && productAreaInput.value !== '' && !selectedArea();
}

function renderProduct(card) {
  const trigger = card.querySelector('.service-detail-trigger');
  selectedProduct = card;
  addedFromCard = card.querySelector('[data-service]:not(:disabled)');
  productRate = readCatalogPrice(card);
  selectedQuantity = 1;
  productAreaInput.value = '';
  const art = card.querySelector('.service-art');
  media.replaceChildren(...(art ? [art.cloneNode(true)] : []));
  media.hidden = !art;
  title.textContent = trigger.textContent;
  description.textContent = trigger.dataset.description || 'Подробного описания в доступном каталоге нет. Уточните детали у компании.';
  price.textContent = card.dataset.price || card.dataset.availability || 'Цена по запросу';
  priceNote.hidden = !card.dataset.price;
  productSelection.hidden = !addedFromCard;
  productQuantity.hidden = productRate.byArea;
  productUnit.textContent = productRate.byWeight ? 'Вес, кг' : 'Количество';
  productArea.hidden = !productRate.byArea;
  add.hidden = !addedFromCard;
  productStatus.textContent = '';
  updateProductEstimate();
}

catalog.addEventListener('click', event => {
  if (event.target.closest('[data-service]') || dialog.open) return;
  const card = event.target.closest('.service-list li');
  const trigger = card?.querySelector('.service-detail-trigger');
  if (!trigger) return;
  openedFrom = trigger;
  const siblings = [...card.parentElement.children];
  productRelated.hidden = siblings.length < 2;
  productRelated.replaceChildren(...(siblings.length < 2 ? [] : siblings.map(sibling => {
    const option = document.createElement('button');
    option.type = 'button';
    option.textContent = sibling.querySelector('.service-detail-trigger').textContent;
    option.setAttribute('aria-pressed', String(card === sibling));
    option.addEventListener('click', () => {
      if (selectedProduct === sibling) return;
      productRelated.querySelector('[aria-pressed="true"]')?.setAttribute('aria-pressed', 'false');
      option.setAttribute('aria-pressed', 'true');
      renderProduct(sibling);
    });
    return option;
  })));
  renderProduct(card);
  backdropPointer = false;
  dialog.showModal();
});

for (const button of productSteps) {
  button.addEventListener('click', () => {
    selectedQuantity = Math.min(99, Math.max(1, selectedQuantity + Number(button.dataset.productStep)));
    updateProductEstimate();
  });
}
productAreaInput.addEventListener('input', updateProductEstimate);

dialog.querySelector('.product-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('pointerdown', event => { backdropPointer = event.target === dialog; });
dialog.addEventListener('click', event => {
  if (backdropPointer && event.target === dialog) dialog.close();
  backdropPointer = false;
});
dialog.addEventListener('close', () => {
  if (openedFrom?.getClientRects().length) openedFrom.focus({ preventScroll: true });
});
window.addEventListener('hashchange', () => {
  if (dialog.open) dialog.close();
});
add.addEventListener('click', () => {
  addedFromCard?.dispatchEvent(new CustomEvent('catalog:add', {
    detail: { quantity: selectedQuantity, area: selectedArea() },
  }));
  productStatus.textContent = 'Добавлено в корзину.';
});
