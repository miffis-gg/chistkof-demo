const controls = document.querySelector('.catalog-controls');
const category = document.querySelector('#catalog-category');
const sort = document.querySelector('#catalog-sort');
const collator = new Intl.Collator('ru', { numeric: true });
function readCatalogPrice(card) {
  const text = card.dataset.price ?? '';
  const amount = text.match(/\d[\d\s]*/)?.[0].replace(/\s/g, '');
  return {
    amount: amount ? Number(amount) : null,
    from: text.startsWith('от '),
    byArea: text.includes('м²'),
    byWeight: text.includes('кг'),
  };
}
const groups = [...document.querySelectorAll('[data-catalog-group]')].map(group => {
  const list = group.querySelector('.service-list');
  const items = [...list.children].map(element => {
    return {
      element,
      price: readCatalogPrice(element).amount,
      name: element.querySelector('.service-title').textContent,
    };
  });
  return { group, list, items };
});

category?.addEventListener('change', () => {
  for (const { group } of groups) {
    group.hidden = category.value !== '' && category.value !== group.dataset.catalogGroup;
  }
});

sort.addEventListener('change', () => {
  for (const { list, items } of groups) {
    const ordered = [...items];
    if (sort.value === 'name') {
      ordered.sort((a, b) => collator.compare(a.name, b.name));
    } else if (sort.value !== 'default') {
      const direction = sort.value === 'price-asc' ? 1 : -1;
      ordered.sort((a, b) => {
        if (a.price === null) return b.price === null ? 0 : 1;
        if (b.price === null) return -1;
        return direction * (a.price - b.price);
      });
    }
    list.append(...ordered.map(item => item.element));
  }
});

controls.hidden = false;
