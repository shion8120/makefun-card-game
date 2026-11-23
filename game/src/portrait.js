// Canvas portraits drawn in code: Vesk the Ash Warden (a horned, hooded figure with ember eyes)
// whose face changes with the duel (calm, hurt, gloating, beaten), and the player's sigil crest.

const MOODS = {
  calm: { eye: '#ffb347', pupil: 6, brow: 0 },
  hurt: { eye: '#ff5a3a', pupil: 3, brow: -6 },
  gloat: { eye: '#ffe07a', pupil: 7, brow: 6 },
  beaten: { eye: '#5a4a44', pupil: 2, brow: -10 },
};

function fitCanvas(canvas) {
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  const width = canvas.clientWidth || canvas.width;
  const height = canvas.clientHeight || canvas.height;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  const context = canvas.getContext('2d');
  context.setTransform((ratio * width) / 100, 0, 0, (ratio * height) / 100, 0, 0);
  return context;
}

/** Draw the Ash Warden into `canvas` (any size; drawn on a 100x100 grid) in the given mood. */
export function drawWardenPortrait(canvas, mood = 'calm') {
  const face = MOODS[mood] ?? MOODS.calm;
  const g = fitCanvas(canvas);
  g.clearRect(0, 0, 100, 100);

  const back = g.createRadialGradient(50, 42, 6, 50, 50, 60);
  back.addColorStop(0, mood === 'beaten' ? '#3a3a40' : '#ff7a2a');
  back.addColorStop(0.45, mood === 'beaten' ? '#22222a' : '#7a1d08');
  back.addColorStop(1, '#16090a');
  g.fillStyle = back;
  g.fillRect(0, 0, 100, 100);

  // Horns of cinder.
  g.fillStyle = '#2b2125';
  for (const side of [-1, 1]) {
    g.beginPath();
    g.moveTo(50 + side * 16, 30);
    g.quadraticCurveTo(50 + side * 38, 18, 50 + side * 34, 2);
    g.quadraticCurveTo(50 + side * 30, 20, 50 + side * 10, 26);
    g.closePath();
    g.fill();
  }
  g.fillStyle = '#ff9d3a';
  for (const side of [-1, 1]) {
    g.beginPath();
    g.arc(50 + side * 34, 4, 2.2, 0, Math.PI * 2);
    g.fill();
  }

  // Hood and shoulders.
  const cloth = g.createLinearGradient(0, 20, 0, 100);
  cloth.addColorStop(0, '#5b4f52');
  cloth.addColorStop(1, '#1d1719');
  g.fillStyle = cloth;
  g.beginPath();
  g.moveTo(50, 14);
  g.bezierCurveTo(76, 14, 80, 46, 76, 62);
  g.lineTo(98, 100);
  g.lineTo(2, 100);
  g.lineTo(24, 62);
  g.bezierCurveTo(20, 46, 24, 14, 50, 14);
  g.fill();

  // The shadowed face inside the hood.
  g.fillStyle = '#0d0809';
  g.beginPath();
  g.ellipse(50, 48, 17, 21, 0, 0, Math.PI * 2);
  g.fill();

  // Ember eyes with glow, set by mood.
  for (const side of [-1, 1]) {
    const x = 50 + side * 8;
    const glow = g.createRadialGradient(x, 45, 0, x, 45, 10);
    glow.addColorStop(0, face.eye);
    glow.addColorStop(1, 'rgba(255,120,40,0)');
    g.fillStyle = glow;
    g.beginPath();
    g.arc(x, 45, 10, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = face.eye;
    g.beginPath();
    g.ellipse(x, 45, 4.5, face.pupil / 2 + 0.5, 0, 0, Math.PI * 2);
    g.fill();
    // Brow: tilts in when hurt, lifts when gloating.
    g.strokeStyle = '#3a2e31';
    g.lineWidth = 2.4;
    g.beginPath();
    g.moveTo(x - side * 6, 38 - face.brow * 0.3);
    g.lineTo(x + side * 6, 38 + face.brow * 0.3);
    g.stroke();
  }

  // Mouth: a thin ember line that curls up when gloating, down when hurt.
  g.strokeStyle = mood === 'beaten' ? '#55474a' : '#ff6a2b';
  g.lineWidth = 1.8;
  g.beginPath();
  g.moveTo(43, 60);
  g.quadraticCurveTo(50, 60 + face.brow * 0.6, 57, 60);
  g.stroke();

  // Clasp at the collar.
  g.fillStyle = '#ffb02e';
  g.beginPath();
  g.moveTo(50, 78);
  g.lineTo(55, 84);
  g.lineTo(50, 90);
  g.lineTo(45, 84);
  g.closePath();
  g.fill();
}

/** Draw the player's crest: a shield split into the four element colours, a flame at its heart. */
export function drawPlayerCrest(canvas) {
  const g = fitCanvas(canvas);
  g.clearRect(0, 0, 100, 100);
  const back = g.createRadialGradient(50, 50, 4, 50, 50, 60);
  back.addColorStop(0, '#3b4a6a');
  back.addColorStop(1, '#0b0f1a');
  g.fillStyle = back;
  g.fillRect(0, 0, 100, 100);

  const shield = new Path2D('M50 10L84 22V48C84 70 68 86 50 94C32 86 16 70 16 48V22Z');
  g.save();
  g.clip(shield);
  const quarters = [
    ['#ff6a2b', 0, 0],
    ['#2f9bff', 50, 0],
    ['#3fc46a', 0, 52],
    ['#c9b6ff', 50, 52],
  ];
  for (const [color, x, y] of quarters) {
    g.fillStyle = color;
    g.fillRect(x, y, 50, 52);
  }
  g.restore();
  g.strokeStyle = '#f6e7c8';
  g.lineWidth = 3;
  g.stroke(shield);
  g.fillStyle = '#fff4d6';
  g.beginPath();
  g.moveTo(50, 34);
  g.bezierCurveTo(60, 46, 62, 54, 58, 62);
  g.bezierCurveTo(54, 70, 46, 70, 42, 62);
  g.bezierCurveTo(38, 54, 44, 50, 46, 44);
  g.bezierCurveTo(48, 50, 50, 50, 50, 34);
  g.fill();
}
