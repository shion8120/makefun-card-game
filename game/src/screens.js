// The title screen (logo, how-to, one showcase card per element, Start) and the result screen
// over the final table (the Warden's beaten or gloating face, VICTORY or DEFEAT, the duel's
// numbers, Play Again).

import { cardById } from './cards.js';
import { createCardFace } from './card-view.js';
import { drawWardenPortrait } from './portrait.js';
import { FOE, PLAYER } from './rules.js';

const byId = (id) => document.getElementById(id);
const SHOWCASE = ['inferno-wyrm', 'leviathan-tide', 'elder-briar', 'storm-roc'];

/** Build the title screen's showcase fan and hook up Start. */
export function setupTitle(onStart) {
  const fan = byId('title-cards');
  fan.innerHTML = '';
  SHOWCASE.forEach((id, index) => {
    const node = createCardFace({ ...cardById(id), uid: `title-${id}` });
    node.style.setProperty('--i', String(index));
    fan.appendChild(node);
  });
  byId('start-button').addEventListener('click', onStart);
}

/** Show or hide the title screen. */
export function showTitle(visible) {
  byId('screen-title').hidden = !visible;
}

/** Show the result of a finished duel; `animate` plays the slam-in. */
export function showResult(duel, { animate = true } = {}) {
  const won = duel.winner === PLAYER;
  const player = duel.sides[PLAYER];
  const foe = duel.sides[FOE];
  const screen = byId('screen-result');
  screen.classList.toggle('won', won);
  screen.classList.toggle('lost', !won);
  screen.classList.remove('enter');
  if (animate) {
    void screen.offsetWidth;
    screen.classList.add('enter');
  }
  byId('result-title').textContent = won ? 'VICTORY' : 'DEFEAT';
  byId('result-subtitle').textContent = won ? "Vesk's embers gutter out. The table is yours." : 'Vesk buries your flame in ash. Rise and duel again.';
  const stats = [
    ['Rounds', duel.round],
    ['Damage dealt', player.dealt],
    ['Damage taken', foe.dealt],
    ['Life left', Math.max(0, won ? player.life : foe.life)],
  ];
  if (!won) stats[3][0] = "Vesk's life";
  byId('result-stats').innerHTML = stats.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('');
  scatterSparks(duel.round + player.dealt);
  screen.hidden = false;
  drawWardenPortrait(byId('result-portrait'), won ? 'beaten' : 'gloat');
}

/** Scatter the result screen's drifting sparks (or ash) in a fixed pattern from `seed`. */
function scatterSparks(seed) {
  let value = seed * 7919;
  const next = () => ((value = (value * 48271) % 2147483647) / 2147483647);
  let html = '';
  for (let index = 0; index < 46; index += 1) {
    const size = 3 + next() * 6;
    html += `<i style="left:${(next() * 100).toFixed(1)}%;top:${(8 + next() * 84).toFixed(1)}%;width:${size.toFixed(1)}px;height:${size.toFixed(1)}px;animation-delay:${(-next() * 3.2).toFixed(2)}s"></i>`;
  }
  byId('result-sparks').innerHTML = html;
}

/** Hide the result screen. */
export function hideResult() {
  byId('screen-result').hidden = true;
}

/** Hook up Play Again. */
export function onPlayAgain(handler) {
  byId('again-button').addEventListener('click', handler);
}
