// Code-drawn SVG icons: the four element sigils (each its own shape as well as its own colour,
// so they read apart even in greyscale: flame, droplet, thorned leaf, spiral gust) and the stat
// marks on every card (energy gem for cost, blade for attack, shield for guard).

import { ELEMENTS } from './cards.js';

const SIGIL_SHAPES = {
  ember: (c) => `
    <path d="M50 4C60 24 80 34 80 60C80 81 66 95 50 95C34 95 20 81 20 60C20 45 29 36 36 27C38 40 44 46 49 46C44 31 46 17 50 4Z" fill="${c.color}" stroke="${c.deep}" stroke-width="3"/>
    <path d="M50 44C56 56 66 62 66 74C66 85 59 91 50 91C41 91 34 85 34 74C34 66 40 61 43 55C45 62 48 64 51 64C49 57 49 51 50 44Z" fill="${c.glow}"/>`,
  tide: (c) => `
    <path d="M50 4C62 27 82 44 82 65C82 83 67 95 50 95C33 95 18 83 18 65C18 44 38 27 50 4Z" fill="${c.color}" stroke="${c.deep}" stroke-width="3"/>
    <path d="M26 66C34 58 42 58 50 66C58 74 66 74 74 66" fill="none" stroke="${c.glow}" stroke-width="6" stroke-linecap="round"/>
    <path d="M32 80C38 75 44 75 50 80C56 85 62 85 68 80" fill="none" stroke="${c.glow}" stroke-width="4" stroke-linecap="round" opacity=".7"/>
    <ellipse cx="38" cy="42" rx="5" ry="9" fill="#fff" opacity=".55" transform="rotate(25 38 42)"/>`,
  thorn: (c) => `
    <path d="M24 36L10 30L22 46ZM76 36L90 30L78 46ZM20 62L6 64L22 72ZM80 62L94 64L78 72Z" fill="${c.deep}"/>
    <path d="M50 4C80 24 88 58 50 96C12 58 20 24 50 4Z" fill="${c.color}" stroke="${c.deep}" stroke-width="3"/>
    <path d="M50 14V88M50 40L36 30M50 40L64 30M50 60L34 50M50 60L66 50M50 78L40 70M50 78L60 70" stroke="${c.glow}" stroke-width="4" stroke-linecap="round" fill="none"/>`,
  gale: (c) => `
    <path d="M14 38C14 14 58 6 74 26C88 44 74 66 54 62C40 59 40 42 52 40C60 39 62 48 56 50" fill="none" stroke="${c.color}" stroke-width="10" stroke-linecap="round"/>
    <path d="M14 38C14 14 58 6 74 26C88 44 74 66 54 62C40 59 40 42 52 40" fill="none" stroke="${c.glow}" stroke-width="3" stroke-linecap="round"/>
    <path d="M8 74H66C76 74 80 84 72 88M18 88H48" fill="none" stroke="${c.color}" stroke-width="8" stroke-linecap="round"/>`,
};

/** An SVG sigil for `element` sized `size` CSS pixels. */
export function sigilSvg(element, size = 48) {
  const colors = ELEMENTS[element];
  return `<svg class="sigil sigil-${element}" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true">${SIGIL_SHAPES[element](colors)}</svg>`;
}

/** The blade mark beside a card's attack value. */
export function bladeSvg(size = 18) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true"><path d="M20 2L22 4L10 16L8 14Z" fill="#ffe2c8"/><path d="M6 13L11 18L9 20L7 18L4 21L3 20L6 17L4 15Z" fill="#c9a27a"/></svg>`;
}

/** The shield mark beside a card's guard value. */
export function shieldSvg(size = 18) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true"><path d="M12 2L21 5V11C21 17 17 21 12 23C7 21 3 17 3 11V5Z" fill="#d6e6ff" stroke="#5b7aa6" stroke-width="1.5"/><path d="M12 5V20" stroke="#5b7aa6" stroke-width="1.5"/></svg>`;
}

/** The faceted gem that holds a card's energy cost. */
export function gemSvg(size = 34) {
  return `<svg viewBox="0 0 40 40" width="${size}" height="${size}" aria-hidden="true"><path d="M20 2L36 14L30 36H10L4 14Z" fill="#ffb02e" stroke="#5a2a00" stroke-width="2"/><path d="M20 2L26 14H14ZM4 14H36L20 22Z" fill="#ffe08a" opacity=".75"/></svg>`;
}

/** The pierce wheel drawn as four sigils round a ring, arrows pointing at what each one beats. */
export function wheelSvg(size = 220) {
  const order = ['tide', 'ember', 'thorn', 'gale'];
  const points = [
    [110, 30],
    [190, 110],
    [110, 190],
    [30, 110],
  ];
  const arrows = points
    .map(([x, y], index) => {
      const [nx, ny] = points[(index + 1) % 4];
      const mx = (x + nx) / 2;
      const my = (y + ny) / 2;
      const bendX = mx + (mx - 110) * 0.18;
      const bendY = my + (my - 110) * 0.18;
      return `<path d="M${x + (nx - x) * 0.28} ${y + (ny - y) * 0.28}Q${bendX} ${bendY} ${x + (nx - x) * 0.72} ${y + (ny - y) * 0.72}" fill="none" stroke="#f3d9b0" stroke-width="4" marker-end="url(#wheel-head)" opacity=".85"/>`;
    })
    .join('');
  const sigils = points
    .map(([x, y], index) => `<g transform="translate(${x - 26} ${y - 26}) scale(.52)">${SIGIL_SHAPES[order[index]](ELEMENTS[order[index]])}</g>`)
    .join('');
  return `<svg class="wheel" viewBox="0 0 220 220" width="${size}" height="${size}" aria-label="Pierce wheel: Tide beats Ember beats Thorn beats Gale beats Tide">
    <defs><marker id="wheel-head" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#f3d9b0"/></marker></defs>
    <circle cx="110" cy="110" r="80" fill="none" stroke="#ffffff22" stroke-width="2" stroke-dasharray="4 8"/>
    ${arrows}${sigils}</svg>`;
}
