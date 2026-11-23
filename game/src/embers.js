// The particle layer on the full-window effects canvas: spark bursts where a hit lands, and the
// rising storm of embers (in all four element colours) that crowns a victory.

const COLORS = ['#ff6a2b', '#ffb02e', '#ffe08a', '#2f9bff', '#3fc46a', '#c9b6ff'];

let canvas = null;
let context = null;
let particles = [];
let running = false;
let lastTime = 0;

/** Attach the particle layer to `target` (the #fx-canvas element). */
export function initEmbers(target) {
  canvas = target;
  context = canvas.getContext('2d');
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);
}

function spawn(x, y, count, { speed = 6, colors = COLORS, gravity = 0.18, life = 1, size = 4 } = {}) {
  for (let index = 0; index < count; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const velocity = speed * (0.35 + Math.random());
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity - speed * 0.4,
      gravity,
      life: life * (0.6 + Math.random() * 0.6),
      age: 0,
      size: size * (0.5 + Math.random()),
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }
  if (!running) {
    running = true;
    lastTime = performance.now();
    requestAnimationFrame(tick);
  }
}

function tick(now) {
  const step = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.globalCompositeOperation = 'lighter';
  particles = particles.filter((particle) => particle.age < particle.life);
  for (const particle of particles) {
    particle.age += step;
    particle.vy += particle.gravity;
    particle.vx *= 0.985;
    particle.x += particle.vx;
    particle.y += particle.vy;
    const fade = 1 - particle.age / particle.life;
    context.globalAlpha = Math.max(0, fade);
    context.fillStyle = particle.color;
    context.beginPath();
    context.arc(particle.x, particle.y, particle.size * (0.4 + fade * 0.6), 0, Math.PI * 2);
    context.fill();
  }
  context.globalAlpha = 1;
  context.globalCompositeOperation = 'source-over';
  if (particles.length > 0) requestAnimationFrame(tick);
  else running = false;
}

/** Sparks at a screen point, tinted by the hit's element colour. */
export function burstAt(x, y, color, strength = 1) {
  spawn(x, y, Math.round(18 + strength * 14), { speed: 4 + strength * 3, colors: [color, '#ffe08a', '#ffffff'], life: 0.7 });
}

/** The victory flourish: several waves of embers from the bottom and the centre. */
export function celebrate() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  for (let wave = 0; wave < 6; wave += 1) {
    setTimeout(() => {
      spawn(width * (0.15 + Math.random() * 0.7), height * (0.25 + Math.random() * 0.35), 70, { speed: 9, gravity: 0.12, life: 1.8, size: 5 });
      spawn(width * Math.random(), height + 10, 30, { speed: 12, gravity: 0.05, life: 2.2, size: 3 });
    }, wave * 260);
  }
}

/** Grey ash drifting down, for a defeat. */
export function ashfall() {
  const width = window.innerWidth;
  for (let wave = 0; wave < 4; wave += 1) {
    setTimeout(() => spawn(width * Math.random(), -10, 40, { speed: 2, gravity: 0.04, life: 3, size: 3, colors: ['#6b6470', '#8a8290', '#4a4450'] }), wave * 300);
  }
}
