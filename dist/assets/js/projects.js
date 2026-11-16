/* borBeHR — project filtering and search. */

const grid = document.querySelector('[data-project-grid]');

if (grid) {
  const cards = [...grid.querySelectorAll('[data-project-card]')];
  const chips = [...document.querySelectorAll('[data-filter-category]')];
  const search = document.querySelector('[data-project-search]');
  const clear = document.querySelector('[data-project-clear]');
  const count = document.querySelector('[data-project-count]');
  const empty = document.querySelector('[data-project-empty]');
  const reset = document.querySelector('[data-project-reset]');

  const total = cards.length;
  let activeCategory = 'all';
  let query = '';

  function normalize(value) {
    return String(value || '')
      .trim()
      .toLocaleLowerCase('ru');
  }

  function applyFilters() {
    const needle = normalize(query);
    let visible = 0;

    cards.forEach((card) => {
      const category = normalize(card.dataset.category);
      const haystack = normalize(card.dataset.search);
      const matchesCategory = activeCategory === 'all' || category === activeCategory;
      const matchesQuery = !needle || haystack.includes(needle);
      const show = matchesCategory && matchesQuery;

      card.classList.toggle('is-hidden', !show);
      if (show) visible += 1;
    });

    if (count) {
      count.textContent = `Показано ${String(visible).padStart(2, '0')} из ${String(total).padStart(2, '0')}`;
    }
    if (empty) empty.hidden = visible !== 0;
    if (clear) clear.hidden = !needle;
  }

  function setCategory(category) {
    activeCategory = category || 'all';

    chips.forEach((chip) => {
      const active = chip.dataset.filterCategory === activeCategory;
      chip.classList.toggle('is-active', active);
      chip.setAttribute('aria-pressed', String(active));
    });

    applyFilters();
  }

  chips.forEach((chip) => {
    chip.addEventListener('click', () => setCategory(chip.dataset.filterCategory));
  });

  search?.addEventListener('input', () => {
    query = search.value;
    applyFilters();
  });

  clear?.addEventListener('click', () => {
    if (!search) return;
    search.value = '';
    query = '';
    applyFilters();
    search.focus();
  });

  reset?.addEventListener('click', () => {
    if (search) search.value = '';
    query = '';
    setCategory('all');
    search?.focus();
  });

  applyFilters();
}
