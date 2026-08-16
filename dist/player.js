(function () {
  // Список треков подтягивается автоматически из audio/tracks.json,
  // который генерирует generate.go, сканируя static/audio/ при сборке.
  // Просто кидай mp3/ogg/wav/m4a/flac в static/audio/ и пересобирай (go run generate.go).
  let TRACKS = [];

  const btn = document.getElementById('playBtn');
  const iconPlay = document.getElementById('iconPlay');
  const iconPause = document.getElementById('iconPause');
  const trackName = document.getElementById('trackName');
  const waveform = document.getElementById('waveform');
  const timeDisplay = document.getElementById('timeDisplay');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const tracklist = document.getElementById('tracklist');

  if (!btn) return;

  const BAR_COUNT = 40;
  for (let i = 0; i < BAR_COUNT; i++) {
    const bar = document.createElement('span');
    bar.style.height = (10 + Math.random() * 60) + '%';
    waveform.appendChild(bar);
  }
  const bars = Array.from(waveform.children);

  const audio = new Audio();
  let current = 0;
  let animId = null;

  function loadTrack(i, autoplay) {
    if (!TRACKS[i]) {
      trackName.textContent = 'треков нет — закинь файлы в static/audio/ и пересобери';
      btn.disabled = true;
      return;
    }
    btn.disabled = false;
    current = i;
    audio.src = TRACKS[i].src;
    trackName.textContent = TRACKS[i].title;
    highlightActive();
    if (prevBtn) prevBtn.disabled = TRACKS.length < 2;
    if (nextBtn) nextBtn.disabled = TRACKS.length < 2;
    if (autoplay) audio.play().catch(() => {});
  }

  function highlightActive() {
    if (!tracklist) return;
    Array.from(tracklist.children).forEach((row, i) => {
      row.classList.toggle('active', i === current);
    });
  }

  function renderTracklist() {
    if (!tracklist) return;
    tracklist.innerHTML = TRACKS.map((t, i) => `
      <li>
        <button class="track-row" data-index="${i}">
          <span class="track-idx">${String(i + 1).padStart(2, '0')}</span>
          <span>${t.title}</span>
        </button>
      </li>`).join('');
    tracklist.querySelectorAll('.track-row').forEach((row) => {
      row.addEventListener('click', () => {
        loadTrack(Number(row.dataset.index), true);
      });
    });
    highlightActive();
  }

  fetch('audio/tracks.json')
    .then((res) => (res.ok ? res.json() : []))
    .then((tracks) => {
      TRACKS = tracks || [];
      renderTracklist();
      loadTrack(current);
    })
    .catch(() => {
      trackName.textContent = 'не удалось загрузить список треков';
      btn.disabled = true;
    });

  function formatTime(sec) {
    if (!isFinite(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function animateBars() {
    bars.forEach((bar) => {
      const h = 15 + Math.random() * 85;
      bar.style.height = h + '%';
    });
    animId = requestAnimationFrame(() => setTimeout(animateBars, 90));
  }

  function stopAnimation() {
    cancelAnimationFrame(animId);
    bars.forEach((bar) => (bar.style.height = '20%'));
  }

  btn.addEventListener('click', () => {
    if (audio.paused) {
      audio.play().catch(() => {
        trackName.textContent = 'не удалось воспроизвести файл';
      });
    } else {
      audio.pause();
    }
  });

  audio.addEventListener('play', () => {
    iconPlay.style.display = 'none';
    iconPause.style.display = '';
    waveform.classList.add('playing');
    animateBars();
  });

  audio.addEventListener('pause', () => {
    iconPlay.style.display = '';
    iconPause.style.display = 'none';
    waveform.classList.remove('playing');
    stopAnimation();
  });

  audio.addEventListener('timeupdate', () => {
    timeDisplay.textContent = formatTime(audio.currentTime);
  });

  audio.addEventListener('ended', () => {
    loadTrack((current + 1) % TRACKS.length, true);
  });

  prevBtn && prevBtn.addEventListener('click', () => {
    loadTrack((current - 1 + TRACKS.length) % TRACKS.length, true);
  });

  nextBtn && nextBtn.addEventListener('click', () => {
    loadTrack((current + 1) % TRACKS.length, true);
  });
})();
