// The rival duelist, Vesk the Ash Warden, and the readable strategy it plays by. Its rule list is
// shown on the table, and every play it makes is announced with the rule that chose it, so a
// player can see what it wants and play around it (keep a guard up when it can finish you,
// pressure it before it heals, lead with an element that pierces its stance).

import { ELEMENTS } from './cards.js';
import { canAfford, playableIndices, previewPlay, rivalOf } from './rules.js';

export const FOE_NAME = 'Vesk, the Ash Warden';

/** The Warden's rules, in the order it checks them; the table shows these. */
export const FOE_STRATEGY = [
  'Finishes you the moment it can',
  'Heals when below 8 life',
  'Else hits hardest past your guard',
];

const LOW_LIFE = 8;

/** Score of a play for the 'warden' style: damage first, then the guard it leaves up, then value. */
function wardenScore(preview, card) {
  return preview.damage * 2 + card.guard + preview.heal + preview.draw * 1.5 - preview.barb * 2;
}

/**
 * Choose the active side's move. `style` 'warden' is the Ash Warden's strategy (and a sound
 * autopilot for the player in screenshot scenes); 'reckless' swings its biggest attack and ignores guards.
 * Returns { kind: 'play', index, rule, reason } or { kind: 'rest', rule: -1, reason }, where `rule`
 * indexes FOE_STRATEGY (the line the table lights up).
 */
export function chooseMove(duel, style = 'warden') {
  const sideKey = duel.active;
  const side = duel.sides[sideKey];
  const rival = duel.sides[rivalOf(sideKey)];
  const options = playableIndices(duel).map((index) => {
    const card = side.hand[index];
    return { index, card, preview: previewPlay(duel, sideKey, card) };
  });
  if (options.length === 0) return { kind: 'rest', rule: -1, reason: 'cannot pay for a card and rests' };

  if (style === 'reckless') {
    options.sort((a, b) => b.card.attack - a.card.attack);
    return { kind: 'play', rule: 2, index: options[0].index, reason: 'swings its biggest card' };
  }

  const lethal = options.filter((option) => option.preview.damage >= rival.life && option.preview.barb < side.life);
  if (lethal.length > 0) {
    lethal.sort((a, b) => b.card.guard - a.card.guard);
    return { kind: 'play', rule: 0, index: lethal[0].index, reason: 'sees a finishing blow' };
  }

  if (side.life < LOW_LIFE) {
    const heals = options.filter((option) => option.preview.heal >= 3);
    if (heals.length > 0) {
      heals.sort((a, b) => b.preview.heal - a.preview.heal || b.card.guard - a.card.guard);
      return { kind: 'play', rule: 1, index: heals[0].index, reason: 'is hurt and heals' };
    }
  }

  options.sort((a, b) => wardenScore(b.preview, b.card) - wardenScore(a.preview, a.card));
  const best = options[0];
  return { kind: 'play', rule: 2, index: best.index, reason: reasonFor(best, rival) };
}

function reasonFor(option, rival) {
  const { preview } = option;
  if (preview.pierced) return `pierces your ${ELEMENTS[rival.stance.element].name} guard`;
  if (preview.kindred) return 'chains its element for +2';
  if (preview.damage === 0 && option.card.guard >= 3) return 'raises a heavy guard';
  return 'hits hardest past your guard';
}

/** True when the active side has nothing it can afford. */
export function mustRest(duel) {
  const side = duel.sides[duel.active];
  return !side.hand.some((card) => canAfford(duel, duel.active, card));
}
