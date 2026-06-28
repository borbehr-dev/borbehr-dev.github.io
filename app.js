document.addEventListener("DOMContentLoaded", () => {
    const enterScreen = document.getElementById("enter-screen");
    const card = document.getElementById("profile-card");
    const audio = document.getElementById("bg-music");

    fetch('config.json', { cache: 'no-cache' })
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            // ---- Данные профиля ----
            const avatar = document.getElementById("avatar");
            if (avatar) {
                avatar.src = data.profile?.avatarUrl || data.profile?.avatar || '';
            }

            const username = document.getElementById("username");
            if (username) username.textContent = data.profile?.username || '';

            const bio = document.getElementById("bio");
            if (bio) bio.textContent = data.profile?.bio || '';

            // ---- Музыка ----
            if (audio) {
                audio.src = data.audio?.src || data.music?.audioUrl || '';
                if (data.audio?.volume != null) audio.volume = data.audio.volume;
            }

            // ---- Задний фон ----
            const bgOverlay = document.getElementById("bg-overlay");
            if (bgOverlay && data.profile?.backgroundUrl) {
                bgOverlay.style.backgroundImage = `url('${data.profile.backgroundUrl}')`;
            }

            // ---- Бейдж (с проверками) ----
            if (data.profile?.badge) {
                const badgeWrapper = document.getElementById('badge-wrapper');
                const badgeIcon = document.getElementById('badge-icon');
                const badgeTooltip = document.getElementById('badge-tooltip');

                if (badgeWrapper && badgeIcon && badgeTooltip) {
                    if (data.profile.badge.iconUrl) {
                        badgeIcon.src = data.profile.badge.iconUrl;
                        badgeTooltip.textContent = data.profile.badge.tooltip || '';
                        badgeWrapper.style.display = 'flex';
                    }
                } else {
                    console.warn('Элементы бейджа не найдены в DOM');
                }
            }

            // ---- Социальные кнопки ----
            const socialsContainer = document.getElementById("socials");
            if (socialsContainer && Array.isArray(data.socials)) {
                // Очищаем контейнер (на случай повторной загрузки)
                socialsContainer.innerHTML = '';
                data.socials.forEach(social => {
                    if (!social.url || !social.icon) return; // пропускаем неполные
                    const a = document.createElement("a");
                    a.href = social.url;
                    a.className = "social-btn";
                    a.target = "_blank";
                    a.title = social.name || '';
                    const icon = document.createElement("i");
                    icon.className = social.icon;
                    a.appendChild(icon);
                    socialsContainer.appendChild(a);
                });
            } else {
                console.warn('Контейнер socials не найден или data.socials отсутствует');
            }
        })
        .catch(err => {
            console.error("Ошибка при загрузке config.json:", err);
            // Можно показать сообщение пользователю
        });

    // Анимация клика и запуск плеера
    enterScreen?.addEventListener("click", () => {
        enterScreen.style.opacity = "0";
        setTimeout(() => {
            enterScreen.style.display = "none";
            if (card) card.classList.add("loaded");
            if (audio) {
                audio.play().catch(e => console.log("Браузер заблокировал музыку:", e));
            }
        }, 500);
    });
});