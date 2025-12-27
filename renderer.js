// Renderer principal (versión limpia y definitiva)
// Nota: este archivo centraliza estilos en `styles.css` y usa clases en lugar de estilos inline.

// Estado
let state = {
  mode: 'pomodoro',
  timeLeft: 25 * 60,
  isRunning: false,
  pomodorosCompleted: 0,
  sessionsCompleted: 0,
  isCompact: false,
  isAlwaysOnTop: false,
  interval: null,
  // Flags para notificaciones durante un pomodoro
  notified10: false, // notificó al pasar 10 minutos
  notified20: false  // notificó al pasar 20 minutos
};

// Modos y tiempos por defecto
const modes = {
  pomodoro: { time: 25 * 60, label: 'Pomodoro', emoji: '🍓' },
  descanso: { time: 5 * 60, label: 'Descanso', emoji: '☕' },
  descansoLargo: { time: 15 * 60, label: 'Descanso Largo', emoji: '✨' }
};

// Depuración: indicar que el script del renderer se cargó
console.log('renderer.js cargado');

// Pedir permiso de notificaciones al iniciar la app
requestNotificationPermission();

// Capturar errores no manejados en el renderer y promesas rechazadas
window.addEventListener('error', (ev) => {
  console.error('Error en renderer:', ev.message || ev.error, ev.error || ev);
});
window.addEventListener('unhandledrejection', (ev) => {
  console.error('Unhandled rejection en renderer:', ev.reason);
});

// Formatear tiempo
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Calcular progreso
function getProgress() {
  const total = modes[state.mode].time;
  const elapsed = total - state.timeLeft;
  return (elapsed / total) * 100;
}

// Iniciar/Pausar timer
function toggleTimer() {
  state.isRunning = !state.isRunning;

  if (state.isRunning) {
    state.interval = setInterval(() => {
      if (state.timeLeft > 0) {
        state.timeLeft--;

        // Notificaciones motivacionales durante Pomodoro
        if (state.mode === 'pomodoro') {
          // 10 minutos pasados -> quedan 900s
          if (state.timeLeft === 900 && !state.notified10) {
            showMotivationalNotification();
            state.notified10 = true;
          }
          // 20 minutos pasados -> quedan 300s
          if (state.timeLeft === 300 && !state.notified20) {
            showMotivationalNotification();
            state.notified20 = true;
          }
        }

        render();
      } else {
        handleTimerComplete();
      }
    }, 1000);
    
    try { document.documentElement.style.setProperty('--progress-fill', '#bd9570ff'); } catch(e) {}
    try { document.documentElement.style.setProperty('--svg-stroke', '#bd9570ff'); } catch(e) {}
  } else {
    clearInterval(state.interval);
   
    try { document.documentElement.style.setProperty('--progress-fill', 'linear-gradient(90deg, var(--royal-orange), var(--coral))'); } catch(e) {}
    try { document.documentElement.style.setProperty('--svg-stroke', 'var(--royal-orange)'); } catch(e) {}
  }

  render();
}

// Reiniciar timer
function resetTimer() {
  state.isRunning = false;
  clearInterval(state.interval);
  state.timeLeft = modes[state.mode].time;
  // reset notificación motivacional para este ciclo
  state.notified10 = false;
  state.notified20 = false;
  // Revertir colores del relleno y anillo SVG al estado por defecto
  try { document.documentElement.style.setProperty('--progress-fill', 'linear-gradient(90deg, var(--royal-orange), var(--coral))'); } catch(e) {}
  try { document.documentElement.style.setProperty('--svg-stroke', 'var(--royal-orange)'); } catch(e) {}
  render();
}

// Cambiar modo
function changeMode(newMode) {
  state.mode = newMode;
  state.isRunning = false;
  clearInterval(state.interval);
  state.timeLeft = modes[newMode].time;
  // resetear notificaciones motivacionales al cambiar de modo
  state.notified10 = false;
  state.notified20 = false;
  // Revertir colores del relleno y anillo SVG al cambiar de modo
  try { document.documentElement.style.setProperty('--progress-fill', 'linear-gradient(90deg, var(--royal-orange), var(--coral))'); } catch(e) {}
  try { document.documentElement.style.setProperty('--svg-stroke', 'var(--royal-orange)'); } catch(e) {}
  render();
}

// Timer completado
function handleTimerComplete() {
  state.isRunning = false;
  clearInterval(state.interval);

  if (state.mode === 'pomodoro') {
    state.pomodorosCompleted++;
  }
  state.sessionsCompleted++;

  // Asegurar que los colores del relleno y anillo SVG vuelvan al estado por defecto al completar
  try { document.documentElement.style.setProperty('--progress-fill', 'linear-gradient(90deg, var(--royal-orange), var(--coral))'); } catch(e) {}
  try { document.documentElement.style.setProperty('--svg-stroke', 'var(--royal-orange)'); } catch(e) {}

  // Reproducir sonido al completar
  playCompletionSound();

  // Mostrar notificación final (permanente hasta que el usuario la cierre)
  try { showFinalNotification(); } catch(e) { console.error('No se pudo mostrar notificación final:', e); }

  // Resetear banderas de notificación para la próxima sesión
  state.notified10 = false;
  state.notified20 = false;

  render();
}

//  sonido de finalización
function playCompletionSound() {
  try {
    console.log('🔊 Reproduciendo sonido...');
    
    const audio = new Audio('./sounds/sonido-final.wav');
    audio.volume = 0.7;
    
    audio.play()
      .then(() => {
        console.log('✅ Sonido reproducido');
        
        // Detener el sonido después de 10 segundos
        setTimeout(() => {
          audio.pause();
          audio.currentTime = 0; // Resetear a inicio
          console.log('⏹ Sonido detenido a los 10 segundos');
        }, 10000); // 10000 ms = 10 segundos
      })
      .catch(error => console.error('❌ Error al reproducir:', error));
      
  } catch(error) {
    console.error('❌ Error al crear audio:', error);
  }
}

// --- Notificaciones del sistema (API Notification) ---
function requestNotificationPermission() {
  try {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => console.log('Notification permission:', permission)).catch(e => console.error('Error requestNotificationPermission:', e));
    }
  } catch (e) {
    console.error('No se pudo pedir permiso de notificaciones:', e);
  }
}

function showMotivationalNotification() {
  try {
    if (Notification.permission !== 'granted') return;
    const notif = new Notification('¡Sigue así! 🔋', {
      body: 'Bien, sigue así, ¡ Lo estás logrando!!!',
      silent: true
    });
    // cerrar automáticamente después de 4 segundos
    setTimeout(() => {
      try { notif.close(); } catch(e) {}
    }, 4000);
  } catch (e) {
    console.error('Error mostrando notificación motivacional:', e);
  }
}

function showFinalNotification() {
  try {
    if (Notification.permission !== 'granted') return;
    new Notification('¡Pomodoro Completado! 🎆', {
      body: '¡Buen trabajo! Has completado el Pomodoro.',
      silent: true,
      requireInteraction: true
    });
  } catch (e) {
    console.error('Error mostrando notificación final:', e);
  }
}


function toggleCompactView() {
  state.isCompact = !state.isCompact;
  render();
}


function toggleAlwaysOnTop() {
  state.isAlwaysOnTop = !state.isAlwaysOnTop;

  if (window.electron) {
    window.electron.setAlwaysOnTop(state.isAlwaysOnTop);
  }

  render();
}


function minimizeWindow() {
  if (window.electron && window.electron.minimizeWindow) {
    window.electron.minimizeWindow();
  }
}



function render() {
  const root = document.getElementById('root');
  const progress = getProgress();

  if (state.isCompact) {
    root.innerHTML = `
      <div class="fade-in app">
        <div class="header">
          <div class="logo">🌸</div>
          <div class="controls">
            <button onclick="toggleAlwaysOnTop()" class="control-btn ${state.isAlwaysOnTop ? 'active' : ''}">${state.isAlwaysOnTop ? '📌' : '📍'}</button>
            <button onclick="minimizeWindow()" class="control-btn">🗕</button>
            <button onclick="toggleCompactView()" class="control-btn">⛶</button>
          </div>
        </div>

        <div class="card">
          <div class="timer-wrap">
            <div class="time-display">${formatTime(state.timeLeft)}</div>
            <div class="emoji">${modes[state.mode].emoji}</div>
            <div class="time-caption">${state.mode==='pomodoro' ? 'Tiempo de Enfoque' : state.mode==='descanso' ? 'Tiempo de Descanso' : 'Descanso Largo'}</div>
          </div>

          <div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>

          <div class="mode-selector">
            <button onclick="changeMode('pomodoro')" class="mode-btn ${state.mode==='pomodoro' ? 'active':''}"><div class="mode-icon">${modes.pomodoro.emoji}</div><div class="mode-label">${modes.pomodoro.label}</div></button>
            <button onclick="changeMode('descanso')" class="mode-btn ${state.mode==='descanso' ? 'active':''}"><div class="mode-icon">${modes.descanso.emoji}</div><div class="mode-label">${modes.descanso.label}</div></button>
            <button onclick="changeMode('descansoLargo')" class="mode-btn ${state.mode==='descansoLargo' ? 'active':''}"><div class="mode-icon">${modes.descansoLargo.emoji}</div><div class="mode-label">${modes.descansoLargo.label}</div></button>
          </div>

          <div class="actions">
            <button onclick="toggleTimer()" class="btn primary">${state.isRunning ? '⏸' : '▶'}</button>
            <button onclick="resetTimer()" class="btn secondary small">↻</button>
          </div>

          <div class="stats">
            <div class="stat pomo">
              <div class="stat-icon">❤️</div>
              <div class="stat-number">${state.pomodorosCompleted}</div>
              <div class="stat-label">Pomodoros</div>
            </div>
            <div class="stat sessions">
              <div class="stat-icon">⭐</div>
              <div class="stat-number">${state.sessionsCompleted}</div>
              <div class="stat-label">Sesiones</div>
            </div>
          </div>
        </div>
      </div>
    `;
  } else {
    root.innerHTML = `
      <div class="fade-in app">
        <div class="header">
          <div class="logo"> 🏵 </div>
          <div class="controls">
            <button onclick="toggleAlwaysOnTop()" class="control-btn ${state.isAlwaysOnTop ? 'active' : ''}">${state.isAlwaysOnTop ? '📌' : '📍'}</button>
            <button onclick="minimizeWindow()" class="control-btn">🗕</button>
            <button onclick="toggleCompactView()" class="control-btn">⊟</button>
          </div>
        </div>

        <p style="text-align:center; color:var(--muted-brown);">¡Enfocado!</p>

        <div class="card">
          <div class="mode-selector">
            <button onclick="changeMode('pomodoro')" class="mode-btn ${state.mode==='pomodoro' ? 'active':''}"><div class="mode-icon">${modes.pomodoro.emoji}</div><div class="mode-label">${modes.pomodoro.label}</div></button>
            <button onclick="changeMode('descanso')" class="mode-btn ${state.mode==='descanso' ? 'active':''}"><div class="mode-icon">${modes.descanso.emoji}</div><div class="mode-label">${modes.descanso.label}</div></button>
            <button onclick="changeMode('descansoLargo')" class="mode-btn ${state.mode==='descansoLargo' ? 'active':''}"><div class="mode-icon">${modes.descansoLargo.emoji}</div><div class="mode-label">${modes.descansoLargo.label}</div></button>
          </div>

          <div style="display:flex; justify-content:center; margin:18px 0;">
            <div style="position:relative; width:220px; height:220px;">
              <svg style="width:100%; height:100%; transform:rotate(-90deg);">
                <circle cx="50%" cy="50%" r="40%" stroke="rgba(232,212,196,0.95)" stroke-width="12" fill="none" />
                <circle cx="50%" cy="50%" r="40%" stroke="var(--svg-stroke, var(--royal-orange))" stroke-width="12" fill="none"
                  stroke-dasharray="${2 * Math.PI * 130}"
                  stroke-dashoffset="${2 * Math.PI * 130 * (1 - progress / 100)}"
                  stroke-linecap="round" style="transition:stroke-dashoffset 1s linear;" />
              </svg>
              <div style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                <div class="inner-circle">
                  <span style="font-size:32px">${modes[state.mode].emoji}</span>
                </div>
                <div class="time-display">${formatTime(state.timeLeft)}</div>
                <div class="time-caption">${state.mode==='pomodoro' ? 'Tiempo de Enfoque' : state.mode==='descanso' ? 'Tiempo de Descanso' : 'Descanso Largo'}</div>
              </div>
            </div>
          </div>

          <div class="actions">
            <button onclick="toggleTimer()" class="btn primary">${state.isRunning ? '⏸' : '▶'}</button>
            <button onclick="resetTimer()" class="btn secondary small">↻</button>
          </div>

          <div class="stats">
            <div class="stat pomo">
              <div class="stat-icon">❤️</div>
              <div style="font-size:20px; font-weight:700">${state.pomodorosCompleted}</div>
              <div class="stat-label" style="font-size:12px; opacity:0.95; margin-top:6px;">Pomodoros</div>
            </div>
            <div class="stat sessions">
              <div class="stat-icon">⭐</div>
              <div style="font-size:20px; font-weight:700">${state.sessionsCompleted}</div>
              <div class="stat-label" style="font-size:12px; opacity:0.95; margin-top:6px;">Sesiones</div>
            </div>
          </div>
        </div>

        <div class="footer-note"> 🍥 25m • 5m • 15m 🍥 </div>
      </div>
    `;
  }
}

// Inicializar render
render();

