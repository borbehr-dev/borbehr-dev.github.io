// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all modules
    initNavigation();
    initThemeToggle();
    initProjects();
    initMusicPlayer();
    initScrollEffects();
});

// Navigation
function initNavigation() {
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Mobile menu toggle
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            this.classList.toggle('active');
        });
    }
    
    // Close mobile menu when clicking on links
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navMenu.classList.remove('active');
            mobileMenuToggle.classList.remove('active');
        });
    });
    
    // Smooth scrolling for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
}

// Theme Toggle
function initThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle.querySelector('i');
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    }
    
    themeToggle.addEventListener('click', function() {
        document.body.classList.toggle('light-theme');
        const isLight = document.body.classList.contains('light-theme');
        
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
}

// Projects Section
function initProjects() {
    const projectsGrid = document.getElementById('projects-grid');
    const refreshBtn = document.getElementById('refresh-projects');
    
    // Load projects on page load
    loadProjects();
    
    // Refresh button
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadProjects);
    }
    
    async function loadProjects() {
        try {
            projectsGrid.innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Loading projects...</p>
                </div>
            `;
            
            const response = await fetch('https://gitlab.com/api/v4/users/borbehr/projects?order_by=updated_at&sort=desc&per_page=20');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const projects = await response.json();
            
            if (projects.length === 0) {
                projectsGrid.innerHTML = `
                    <div class="status-message">
                        <p>Public repositories not found</p>
                    </div>
                `;
                return;
            }
            
            const projectsHTML = projects.map(project => {
                const description = project.description || 'No description available';
                const lastActivity = new Date(project.last_activity_at).toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
                
                return `
                    <div class="project-card">
                        <div class="project-header">
                            <div class="project-icon">
                                <i class="fas fa-code-branch"></i>
                            </div>
                            <div class="project-title">
                                <a href="${project.web_url}" target="_blank" rel="noopener">${project.name}</a>
                            </div>
                        </div>
                        <div class="project-description">
                            ${description}
                        </div>
                        <div class="project-stats">
                            <div class="project-stat">
                                <i class="fas fa-star"></i>
                                <span>${project.star_count}</span>
                            </div>
                            <div class="project-stat">
                                <i class="fas fa-code-branch"></i>
                                <span>${project.forks_count}</span>
                            </div>
                            <div class="project-stat">
                                <i class="fas fa-calendar"></i>
                                <span>${lastActivity}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            projectsGrid.innerHTML = projectsHTML;
            
        } catch (error) {
            console.error('Error loading projects:', error);
            projectsGrid.innerHTML = `
                <div class="status-message" style="color: #f87171;">
                    <p>Error loading projects: ${error.message}</p>
                </div>
            `;
        }
    }
}

// Music Player
function initMusicPlayer() {
    const playBtn = document.getElementById('play-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const progressFill = document.getElementById('progress-fill');
    const currentTimeEl = document.getElementById('current-time');
    const totalTimeEl = document.getElementById('total-time');
    const volumeSlider = document.getElementById('volume-slider');
    const trackTitle = document.getElementById('track-title');
    const musicPlaylist = document.getElementById('music-playlist');
    
    let audio = new Audio();
    let currentTrackIndex = 0;
    let isPlaying = false;
    let tracks = [];
    
    // Load music files
    loadMusicFiles();
    
    async function loadMusicFiles() {
        try {
            // Load music configuration from JSON file
            const response = await fetch('music-config.json');
            const config = await response.json();
            
            tracks = config.tracks.map((track, index) => ({
                id: index,
                name: track.file,
                title: track.title,
                artist: track.artist,
                url: `music/${track.file}`
            }));
            
            renderPlaylist();
            
            // Auto-select first track
            if (tracks.length > 0) {
                selectTrack(0);
            }
            
        } catch (error) {
            console.error('Error loading music files:', error);
            musicPlaylist.innerHTML = `
                <div class="status-message">
                    <p>Error loading music configuration</p>
                </div>
            `;
        }
    }
    
    function renderPlaylist() {
        const playlistHTML = tracks.map((track, index) => `
            <div class="playlist-item ${index === currentTrackIndex ? 'active' : ''}" data-index="${index}">
                <div class="playlist-number">${index + 1}</div>
                <div class="playlist-info">
                    <div class="playlist-title">${track.title}</div>
                    <div class="playlist-artist">${track.artist}</div>
                </div>
                <div class="playlist-duration">--:--</div>
            </div>
        `).join('');
        
        musicPlaylist.innerHTML = playlistHTML;
        
        // Add click events to playlist items
        document.querySelectorAll('.playlist-item').forEach(item => {
            item.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                selectTrack(index);
                if (isPlaying) {
                    playTrack();
                }
            });
        });
    }
    
    function selectTrack(index) {
        currentTrackIndex = index;
        const track = tracks[index];
        
        audio.src = track.url;
        trackTitle.textContent = track.title;
        
        // Update active state in playlist
        document.querySelectorAll('.playlist-item').forEach((item, i) => {
            item.classList.toggle('active', i === index);
        });
    }
    
    function playTrack() {
        audio.play();
        isPlaying = true;
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
    }
    
    function pauseTrack() {
        audio.pause();
        isPlaying = false;
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
    
    // Play/Pause button
    playBtn.addEventListener('click', function() {
        if (isPlaying) {
            pauseTrack();
        } else {
            playTrack();
        }
    });
    
    // Previous button
    prevBtn.addEventListener('click', function() {
        currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
        selectTrack(currentTrackIndex);
        if (isPlaying) {
            playTrack();
        }
    });
    
    // Next button
    nextBtn.addEventListener('click', function() {
        currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
        selectTrack(currentTrackIndex);
        if (isPlaying) {
            playTrack();
        }
    });
    
    // Update progress bar
    audio.addEventListener('timeupdate', function() {
        const progress = (audio.currentTime / audio.duration) * 100;
        progressFill.style.width = progress + '%';
        
        currentTimeEl.textContent = formatTime(audio.currentTime);
        totalTimeEl.textContent = formatTime(audio.duration);
    });
    
    // Auto-play next track
    audio.addEventListener('ended', function() {
        currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
        selectTrack(currentTrackIndex);
        playTrack();
    });
    
    // Volume control
    volumeSlider.addEventListener('input', function() {
        audio.volume = this.value / 100;
    });
    
    // Set initial volume
    audio.volume = 0.7;
    
    function formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
}

// Scroll Effects
function initScrollEffects() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Update active navigation link on scroll
    window.addEventListener('scroll', function() {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (pageYOffset >= sectionTop - 100) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    });
    
    // Add fade-in animation to sections
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add active state styles for navigation
const style = document.createElement('style');
style.textContent = `
    .nav-link.active {
        color: var(--primary-color) !important;
    }
    
    #mobile-menu-toggle.active span:nth-child(1) {
        transform: rotate(45deg) translate(5px, 5px);
    }
    
    #mobile-menu-toggle.active span:nth-child(2) {
        opacity: 0;
    }
    
    #mobile-menu-toggle.active span:nth-child(3) {
        transform: rotate(-45deg) translate(7px, -6px);
    }
    
    @media (max-width: 768px) {
        .nav-menu.active {
            display: flex;
            position: absolute;
            top: 70px;
            left: 0;
            width: 100%;
            background: var(--bg-dark);
            flex-direction: column;
            padding: 2rem;
            border-bottom: 1px solid var(--border-color);
        }
    }
`;
document.head.appendChild(style);
