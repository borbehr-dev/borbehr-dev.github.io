(function () {
  const list = document.getElementById('project-list');
  if (!list || !list.dataset.githubUser) return; // проекты заданы вручную, фетч не нужен

  const user = list.dataset.githubUser;
  const status = document.getElementById('fetch-status');

  fetch(`https://api.github.com/users/${user}/repos?sort=updated&per_page=12`)
    .then((res) => {
      if (!res.ok) throw new Error('GitHub API вернул ' + res.status);
      return res.json();
    })
    .then((repos) => {
      const visible = repos.filter((r) => !r.fork);
      if (status) status.remove();

      if (visible.length === 0) {
        list.innerHTML = '<li class="label-row"><div class="label-body"><p class="label-desc">Публичных репозиториев не найдено.</p></div></li>';
        return;
      }

      list.innerHTML = visible
        .map((r) => {
          const desc = r.description ? escapeHtml(r.description) : 'без описания';
          return `
            <li class="label-row">
              <div class="label-barcode" aria-hidden="true"></div>
              <div class="label-body">
                <div class="label-top">
                  <a class="label-title" href="${r.html_url}" target="_blank" rel="noopener">${escapeHtml(r.name)}</a>
                  <span class="tag tag-github">github</span>
                </div>
                <p class="label-desc">${desc}</p>
              </div>
            </li>`;
        })
        .join('');
    })
    .catch((err) => {
      if (status) {
        status.textContent = 'ошибка запроса';
        status.classList.add('fetch-error');
      }
      list.innerHTML = `<li class="label-row"><div class="label-body"><p class="label-desc fetch-error">Не удалось получить репозитории: ${escapeHtml(err.message)}</p></div></li>`;
    });

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();
