/* borBeHR — audio archive player. */

const STORAGE = {
  track: 'borbehr_last_track',
  volume: 'borbehr_volume',
  shuffle: 'borbehr_shuffle',
  repeat: 'borbehr_repeat',
};

const dataNode = document.getElementById('tracks-data');
const player = document.querySelector('[data-player]');

if (dataNode && player) {
  let tracks = [];

  try {
    tracks = JSON.parse(dataNode.textContent || '[]');
  } catch (error) {
    console.warn('[audio] Не удалось прочитать данные треков.', error);
  }

  if (Array.isArray(tracks) && tracks.length) {
    initPlayer(tracks);
  }
}

function initPlayer(tracks) {
  const $ = (selector) => player.querySelector(selector);

  const art = $('[data-player-art]');
  const artNumber = $('[data-player-number]');
  const artTitle = $('[data-player-art-title]');
  const stateLabel = $('[data-player-state]');
  const titleNode = $('[data-player-title]');
  const metaNode = $('[data-player-meta]');
  const counter = $('[data-player-counter]');
  const currentTimeNode = $('[data-player-current]');
  const durationNode = $('[data-player-duration]');
  const seek = $('[data-player-seek]');
  const toggle = $('[data-player-toggle]');
  const prev = $('[data-player-prev]');
  const next = $('[data-player-next]');
  const shuffleButton = $('[data-player-shuffle]');
  const repeatButton = $('[data-player-repeat]');
  const muteButton = $('[data-player-mute]');
  const volume = $('[data-player-volume]');
  const download = $('[data-player-download]');
  const announcer = document.querySelector('[data-player-announcer]');

  const rows = [...document.querySelectorAll('[data-track-row]')];
  const filterInput = document.querySelector('[data-track-filter]');
  const filterClear = document.querySelector('[data-track-clear]');
  const trackCount = document.querySelector('[data-track-count]');
  const emptyState = document.querySelector('[data-track-empty]');

  const audio = new Audio();
  audio.preload = 'metadata';

  const state = {
    index: 0,
    shuffle: false,
    repeat: 'off',
    volume: 0.85,
    muted: false,
  };

  /* Persistence ------------------------------------------------------- */
  function read(key, fallback) {
    try {
      const value = window.localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      window.localStorage.setItem(key, String(value));
    } catch {
      /* Storage can be unavailable — the player still works for this visit. */
    }
  }

  /* Helpers ----------------------------------------------------------- */
  function formatTime(value) {
    const total = Number(value);
    if (!Number.isFinite(total) || total <= 0) return '0:00';

    const minutes = Math.floor(total / 60);
    const seconds = Math.floor(total % 60)
      .toString()
      .padStart(2, '0');

    return `${minutes}:${seconds}`;
  }

  function announce(message) {
    if (!announcer) return;
    announcer.textContent = '';
    window.setTimeout(() => {
      announcer.textContent = message;
    }, 40);
  }

  function setRangeProgress(input, ratio) {
    const value = Math.min(1, Math.max(0, Number(ratio) || 0));
    input.style.setProperty('--range-progress', `${(value * 100).toFixed(2)}%`);
  }

  function currentTrack() {
    return tracks[state.index];
  }

  function findTrackIndex(slug) {
    return tracks.findIndex((track) => track.slug === slug);
  }

  /* UI ---------------------------------------------------------------- */
  function renderTrack({ announceTrack = false } = {}) {
    const track = currentTrack();
    if (!track) return;

    if (art) {
      art.style.setProperty('--track-hue', track.hue);
      art.style.setProperty('--track-hue-2', track.hue2);
    }

    if (artNumber) artNumber.textContent = track.numberLabel;
    if (artTitle) artTitle.textContent = track.title;
    if (titleNode) titleNode.textContent = track.title;
    if (metaNode) {
      metaNode.innerHTML = `borBeHR <span aria-hidden="true">·</span> ${track.durationLabel}`;
    }
    if (counter) counter.textContent = `${track.numberLabel} / ${String(tracks.length).padStart(2, '0')}`;
    if (durationNode) durationNode.textContent = track.durationLabel;
    if (currentTimeNode) currentTimeNode.textContent = '0:00';
    if (seek) {
      seek.value = '0';
      setRangeProgress(seek, 0);
    }
    if (download) {
      download.href = track.src;
      download.setAttribute('download', track.file);
      download.setAttribute('aria-label', `Скачать трек «${track.title}»`);
    }

    rows.forEach((row, index) => {
      const active = index === state.index;
      row.classList.toggle('is-active', active);
      const button = row.querySelector('[data-track-play]');
      if (button) {
        if (active) button.setAttribute('aria-current', 'true');
        else button.removeAttribute('aria-current');
      }
    });

    updateMediaSession(track);

    if (announceTrack) {
      announce(`Выбран трек «${track.title}». ${audio.paused ? 'Нажмите воспроизведение.' : ''}`);
    }
  }

  function updatePlayState() {
    const playing = !audio.paused && !audio.ended;
    player.classList.toggle('is-playing', playing);
    art?.classList.toggle('is-playing', playing);

    if (toggle) {
      toggle.setAttribute('aria-label', playing ? 'Пауза' : 'Воспроизвести');
      toggle.setAttribute('title', playing ? 'Пауза' : 'Воспроизвести');
    }

    if (stateLabel) stateLabel.textContent = playing ? 'playing' : audio.currentTime > 0 ? 'paused' : 'standby';
  }

  function updateVolumeUI() {
    const effective = state.muted ? 0 : state.volume;
    if (volume) {
      volume.value = String(effective);
      setRangeProgress(volume, effective);
    }
    if (muteButton) {
      const muted = state.muted || state.volume === 0;
      muteButton.classList.toggle('is-muted', muted);
      muteButton.setAttribute('aria-label', muted ? 'Включить звук' : 'Выключить звук');
      muteButton.setAttribute('title', muted ? 'Включить звук' : 'Выключить звук');
    }
  }

  function updateShuffleUI() {
    if (!shuffleButton) return;
    shuffleButton.setAttribute('aria-pressed', String(state.shuffle));
    shuffleButton.setAttribute('aria-label', state.shuffle ? 'Случайный порядок включён' : 'Случайный порядок выключен');
  }

  function updateRepeatUI() {
    if (!repeatButton) return;
    repeatButton.dataset.repeat = state.repeat;
    repeatButton.setAttribute('aria-pressed', String(state.repeat !== 'off'));
    const label =
      state.repeat === 'one'
        ? 'Повтор одного трека'
        : state.repeat === 'all'
          ? 'Повтор всех треков'
          : 'Повтор выключен';
    repeatButton.setAttribute('aria-label', `${label}. Нажмите, чтобы изменить.`);
    repeatButton.setAttribute('title', label);
  }

  function updateMediaSession(track) {
    if (!('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: 'borBeHR',
        album: 'Audio archive',
        artwork: [
          { src: '/favicon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
        ],
      });
    } catch {
      /* Media Session metadata is an enhancement. */
    }
  }

  /* Track selection --------------------------------------------------- */
  function selectTrack(index, { autoplay = false, announceTrack = true, syncUrl = true } = {}) {
    if (!tracks.length) return;
    state.index = ((index % tracks.length) + tracks.length) % tracks.length;
    const track = currentTrack();

    audio.pause();
    audio.src = track.src;
    audio.load();
    audio.volume = state.muted ? 0 : state.volume;

    renderTrack({ announceTrack });
    updatePlayState();
    write(STORAGE.track, track.slug);

    if (syncUrl) {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('track', track.slug);
        window.history.replaceState(null, '', url);
      } catch {
        /* URL syncing is optional. */
      }
    }

    if (autoplay) play();
  }

  function shuffleIndex() {
    if (tracks.length < 2) return state.index;
    let candidate = state.index;
    while (candidate === state.index) {
      candidate = Math.floor(Math.random() * tracks.length);
    }
    return candidate;
  }

  function nextIndex(step = 1) {
    if (state.shuffle) return shuffleIndex();
    return (state.index + step + tracks.length) % tracks.length;
  }

  function goNext({ autoplay = true } = {}) {
    selectTrack(nextIndex(1), { autoplay, announceTrack: true });
  }

  function goPrev() {
    if (audio.currentTime > 4) {
      audio.currentTime = 0;
      announce('Начало трека.');
      return;
    }
    selectTrack(nextIndex(-1), { autoplay: true, announceTrack: true });
  }

  function play() {
    const promise = audio.play();
    if (promise && typeof promise.catch === 'function') {
      promise.catch(() => {
        updatePlayState();
        announce('Не удалось начать воспроизведение. Попробуйте ещё раз.');
      });
    }
  }

  function togglePlay() {
    if (audio.paused) play();
    else audio.pause();
  }

  /* Audio events ------------------------------------------------------ */
  audio.addEventListener('play', () => {
    updatePlayState();
    announce(`Воспроизведение: «${currentTrack().title}».`);
  });

  audio.addEventListener('pause', updatePlayState);

  audio.addEventListener('ended', () => {
    if (state.repeat === 'one') {
      audio.currentTime = 0;
      play();
      return;
    }

    const isLast = state.index === tracks.length - 1;

    if (state.repeat === 'all' || state.shuffle || !isLast) {
      selectTrack(nextIndex(1), { autoplay: true });
      return;
    }

    updatePlayState();
    announce('Плейлист завершён.');
  });

  audio.addEventListener('loadedmetadata', () => {
    if (durationNode) durationNode.textContent = formatTime(audio.duration);
  });

  audio.addEventListener('timeupdate', () => {
    if (currentTimeNode) currentTimeNode.textContent = formatTime(audio.currentTime);

    if (seek && Number.isFinite(audio.duration) && audio.duration > 0) {
      const ratio = audio.currentTime / audio.duration;
      if (!seek.matches(':active')) {
        seek.value = String(ratio * 100);
      }
      setRangeProgress(seek, ratio);
    }
  });

  audio.addEventListener('volumechange', updateVolumeUI);
  audio.addEventListener('error', () => {
    announce('Не удалось загрузить аудиофайл.');
    updatePlayState();
  });

  /* Controls ---------------------------------------------------------- */
  toggle?.addEventListener('click', togglePlay);
  next?.addEventListener('click', () => goNext());
  prev?.addEventListener('click', goPrev);

  shuffleButton?.addEventListener('click', () => {
    state.shuffle = !state.shuffle;
    write(STORAGE.shuffle, state.shuffle);
    updateShuffleUI();
    announce(state.shuffle ? 'Случайный порядок включён.' : 'Случайный порядок выключен.');
  });

  repeatButton?.addEventListener('click', () => {
    state.repeat = state.repeat === 'off' ? 'all' : state.repeat === 'all' ? 'one' : 'off';
    write(STORAGE.repeat, state.repeat);
    updateRepeatUI();
    announce(
      state.repeat === 'one'
        ? 'Повтор одного трека включён.'
        : state.repeat === 'all'
          ? 'Повтор всех треков включён.'
          : 'Повтор выключен.'
    );
  });

  seek?.addEventListener('input', () => {
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
    const ratio = Number(seek.value) / 100;
    audio.currentTime = ratio * audio.duration;
    setRangeProgress(seek, ratio);
    if (currentTimeNode) currentTimeNode.textContent = formatTime(audio.currentTime);
  });

  volume?.addEventListener('input', () => {
    state.volume = Math.min(1, Math.max(0, Number(volume.value)));
    state.muted = state.volume === 0;
    audio.volume = state.volume;
    audio.muted = state.muted;
    write(STORAGE.volume, state.volume);
    updateVolumeUI();
  });

  muteButton?.addEventListener('click', () => {
    if (audio.volume === 0) {
      state.volume = 0.7;
      state.muted = false;
      audio.volume = state.volume;
      audio.muted = false;
      write(STORAGE.volume, state.volume);
    } else {
      state.muted = !state.muted;
      audio.muted = state.muted;
    }
    updateVolumeUI();
    announce(audio.muted || audio.volume === 0 ? 'Звук выключен.' : 'Звук включён.');
  });

  rows.forEach((row) => {
    row.querySelector('[data-track-play]')?.addEventListener('click', () => {
      const index = Number(row.dataset.index);
      if (!Number.isFinite(index)) return;

      if (index === state.index && !audio.paused) {
        audio.pause();
        return;
      }

      if (index === state.index && audio.src) {
        play();
        return;
      }

      selectTrack(index, { autoplay: true });
    });
  });

  /* Filter ------------------------------------------------------------ */
  function applyFilter() {
    const query = (filterInput?.value || '').trim().toLocaleLowerCase('ru');
    let visible = 0;

    rows.forEach((row) => {
      const haystack = (row.dataset.search || '').toLocaleLowerCase('ru');
      const match = !query || haystack.includes(query);
      row.classList.toggle('is-hidden', !match);
      if (match) visible += 1;
    });

    if (trackCount) {
      trackCount.textContent = `${String(visible).padStart(2, '0')} / ${String(tracks.length).padStart(2, '0')}`;
    }
    if (emptyState) emptyState.hidden = visible !== 0;
    if (filterClear) filterClear.hidden = !query;
  }

  filterInput?.addEventListener('input', applyFilter);

  filterClear?.addEventListener('click', () => {
    if (!filterInput) return;
    filterInput.value = '';
    applyFilter();
    filterInput.focus();
  });

  /* Keyboard shortcuts ------------------------------------------------ */
  function isInteractiveTarget(target) {
    if (!(target instanceof HTMLElement)) return false;
    return Boolean(
      target.closest('input, textarea, select, button, a, [contenteditable="true"], [role="textbox"]')
    );
  }

  document.addEventListener('keydown', (event) => {
    if (isInteractiveTarget(event.target)) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    if (event.code === 'Space') {
      event.preventDefault();
      togglePlay();
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      if (Number.isFinite(audio.duration)) {
        audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
      }
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      audio.currentTime = Math.max(0, audio.currentTime - 5);
      return;
    }

    if (event.key.toLowerCase() === 'm') {
      event.preventDefault();
      muteButton?.click();
      return;
    }

    if (event.key.toLowerCase() === 'n') {
      event.preventDefault();
      goNext();
      return;
    }

    if (event.key.toLowerCase() === 'p') {
      event.preventDefault();
      goPrev();
    }
  });

  /* Media Session actions --------------------------------------------- */
  if ('mediaSession' in navigator) {
    const actions = {
      play: () => play(),
      pause: () => audio.pause(),
      previoustrack: () => goPrev(),
      nexttrack: () => goNext(),
      seekbackward: (details) => {
        audio.currentTime = Math.max(0, audio.currentTime - (details.seekOffset || 5));
      },
      seekforward: (details) => {
        audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + (details.seekOffset || 5));
      },
      seekto: (details) => {
        if (Number.isFinite(details.seekTime)) audio.currentTime = details.seekTime;
      },
    };

    Object.entries(actions).forEach(([action, handler]) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        /* Unsupported action. */
      }
    });
  }

  /* Initial state ----------------------------------------------------- */
  const storedVolume = Number(read(STORAGE.volume, '0.85'));
  state.volume = Number.isFinite(storedVolume) ? Math.min(1, Math.max(0, storedVolume)) : 0.85;
  state.muted = state.volume === 0;
  state.shuffle = read(STORAGE.shuffle, 'false') === 'true';
  state.repeat = read(STORAGE.repeat, 'off');
  if (!['off', 'all', 'one'].includes(state.repeat)) state.repeat = 'off';

  audio.volume = state.volume;
  audio.muted = state.muted;

  const params = new URLSearchParams(window.location.search);
  const requested = params.get('track');
  const storedTrack = read(STORAGE.track, '');
  const initialIndex = requested
    ? findTrackIndex(requested)
    : storedTrack
      ? findTrackIndex(storedTrack)
      : 0;

  state.index = initialIndex >= 0 ? initialIndex : 0;

  updateVolumeUI();
  updateShuffleUI();
  updateRepeatUI();
  selectTrack(state.index, { autoplay: false, announceTrack: false, syncUrl: Boolean(requested) });
  applyFilter();

  /* Keep the player in sync if the tab is restored. */
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) updatePlayState();
  });
}
