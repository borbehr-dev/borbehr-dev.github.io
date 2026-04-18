document.addEventListener('DOMContentLoaded', function() {
    const preloader = document.getElementById('preloader');

    const timerPromise = new Promise(resolve => setTimeout(resolve, 5000));
    timerPromise.then(() => {
        if (preloader) preloader.classList.add('hidden');
    });

    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    const sideMenu = document.getElementById('side-menu');

    if (menuToggleBtn && sideMenu) {
        menuToggleBtn.addEventListener('click', function() {
            sideMenu.classList.toggle('closed');
        });

        sideMenu.querySelectorAll('a.menu-item').forEach(a => {
            a.addEventListener('click', function() {
                sideMenu.classList.add('closed');
            });
        });

        document.addEventListener('click', function(e) {
            if (!sideMenu.classList.contains('closed')) {
                const target = e.target;
                if (!sideMenu.contains(target) && !menuToggleBtn.contains(target)) {
                    sideMenu.classList.add('closed');
                }
            }
        });
    }

    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const body = document.body;

    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        body.style.background = '#ffffff';
        body.style.color = '#1a1a2e';
        if (themeIcon) {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        }
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const isLight = body.style.background === '#ffffff';

            if (isLight) {
                body.style.background = '';
                body.style.color = '';
                if (themeIcon) {
                    themeIcon.classList.remove('fa-sun');
                    themeIcon.classList.add('fa-moon');
                }
                localStorage.setItem('theme', 'dark');
            } else {
                body.style.background = '#ffffff';
                body.style.color = '#1a1a2e';
                if (themeIcon) {
                    themeIcon.classList.remove('fa-moon');
                    themeIcon.classList.add('fa-sun');
                }
                localStorage.setItem('theme', 'light');
            }
        });
    }

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
});
