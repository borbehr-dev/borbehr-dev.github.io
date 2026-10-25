(function () {
  // Закрываемые алерты. Список берётся из config.yaml -> alerts и рендерится
  // в layout.ejs при сборке (generate.js). Здесь только логика "закрыть и запомнить".
  var STORAGE_KEY = 'borbehr_dismissed_alerts';

  function getDismissed() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function dismiss(id) {
    var dismissed = getDismissed();
    if (dismissed.indexOf(id) === -1) {
      dismissed.push(id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dismissed));
      } catch (e) {
        /* localStorage недоступен — просто скроет на этот раз */
      }
    }
  }

  var dismissed = getDismissed();
  var banners = document.querySelectorAll('.alert-banner[data-alert-id]');

  banners.forEach(function (banner) {
    var id = banner.getAttribute('data-alert-id');
    if (dismissed.indexOf(id) !== -1) {
      banner.classList.add('alert-hidden');
    }
  });

  document.querySelectorAll('.alert-close[data-alert-id]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = btn.getAttribute('data-alert-id');
      dismiss(id);
      var banner = document.querySelector('.alert-banner[data-alert-id="' + id + '"]');
      if (banner) banner.classList.add('alert-hidden');
    });
  });
})();
