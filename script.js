(function() {
  const container = document.getElementById('repos-container');
  const username = 'borBeHR';
  const preloader = document.getElementById('preloader');

  // Функция загрузки репозиториев (возвращает промис)
  async function fetchRepos() {
    try {
      const response = await fetch(`https://gitlab.com/api/v4/users/${username}/projects?order_by=updated_at&sort=desc&per_page=20`);
      if (!response.ok) throw new Error(`GitLab API: ${response.status}`);
      const repos = await response.json();

      if (!repos.length) {
        container.innerHTML = '<div class="status-message">📭 Публичных репозиториев пока нет</div>';
      } else {
        const cards = repos.map(repo => {
          const desc = repo.description || '—';
          const updated = new Date(repo.last_activity_at).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric', year: 'numeric' });
          return `
            <div class="repo-card">
              <div class="repo-name">
                <a href="${repo.web_url}" target="_blank" rel="noopener">${repo.name}</a>
              </div>
              <div class="repo-desc">${desc}</div>
              <div class="repo-meta">
                <span><i class="fas fa-star"></i> ${repo.star_count}</span>
                <span><i class="fas fa-code-branch"></i> ${repo.forks_count}</span>
                <span><i class="far fa-calendar-alt"></i> ${updated}</span>
              </div>
            </div>
          `;
        }).join('');
        container.innerHTML = cards;
      }
    } catch (err) {
      container.innerHTML = `<div class="status-message" style="color: #f87171;">❌ Ошибка загрузки: ${err.message}</div>`;
    }
  }

  // Таймер на 5 секунд
  const timerPromise = new Promise(resolve => setTimeout(resolve, 5000));

  // Первоначальная загрузка + таймер
  Promise.all([fetchRepos(), timerPromise]).then(() => {
    if (preloader) preloader.classList.add('hidden');
  });

  // Кнопка обновления (без перезагрузки страницы)
  document.getElementById('refresh-repos').addEventListener('click', function(e) {
    e.preventDefault();
    container.innerHTML = '<div class="status-message"><i class="fas fa-spinner fa-pulse"></i> Обновление...</div>';
    fetchRepos();
  });

  // Переключатель темы
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  const body = document.body;

  // Проверяем сохраненную тему
  const savedTheme = localStorage.getItem('theme') || 'dark';
  if (savedTheme === 'light') {
    body.classList.add('light-theme');
    themeIcon.classList.remove('fa-moon');
    themeIcon.classList.add('fa-sun');
  }

  themeToggle.addEventListener('click', function() {
    body.classList.toggle('light-theme');
    const isLight = body.classList.contains('light-theme');
    
    if (isLight) {
      themeIcon.classList.remove('fa-moon');
      themeIcon.classList.add('fa-sun');
      localStorage.setItem('theme', 'light');
    } else {
      themeIcon.classList.remove('fa-sun');
      themeIcon.classList.add('fa-moon');
      localStorage.setItem('theme', 'dark');
    }
  });

  // Плавный скролл для якорей меню
  document.querySelectorAll('.menu-item[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      if (targetId === '#') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Анимация навыков при прокрутке
  const observerOptions = {
    threshold: 0.5,
    rootMargin: '0px'
  };

  const skillObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const skillBars = entry.target.querySelectorAll('.skill-bar-fill');
        skillBars.forEach(bar => {
          const width = bar.style.width;
          bar.style.width = '0%';
          setTimeout(() => {
            bar.style.width = width;
          }, 200);
        });
      }
    });
  }, observerOptions);

  const skillsSection = document.getElementById('skills');
  if (skillsSection) {
    skillObserver.observe(skillsSection);
  }
})();
