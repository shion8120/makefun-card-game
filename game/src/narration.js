// The message line's words: turns each outcome the rules return into one short sentence that
// shows the sum (attack minus guard), the element tricks that changed it, and the effects.

import { ELEMENTS, PIERCE_VERB } from './cards.js';
import { FOE_NAME } from './opponent.js';
import { PLAYER } from './rules.js';

const FOE_SHORT = FOE_NAME.split(',')[0];

function attackSum(outcome) {
  if (outcome.attack === 0) return '';
  const guardWord = outcome.pierced ? `${outcome.guard} pierced guard` : `${outcome.guard} guard`;
  const kindred = outcome.kindred ? ' (Kindred +2)' : '';
  return `${outcome.attack} attack${kindred} − ${guardWord} = <span class="dmg">${outcome.damage} damage</span>`;
}

function effects(outcome, mover) {
  const parts = [];
  if (outcome.heal > 0) parts.push(`<span class="heal">+${outcome.heal} life</span>`);
  if (outcome.drawn.length > 0) parts.push(`draws ${outcome.drawn.length}`);
  if (outcome.barb > 0) parts.push(`barbs hurt ${mover === 'You' ? 'you' : FOE_SHORT} for ${outcome.barb}`);
  return parts.join(', ');
}

/** One sentence for a play or a rest; `reason` is the rival's rule, shown for its moves. */
export function describeOutcome(outcome, reason = '') {
  const mover = outcome.side === PLAYER ? 'You' : FOE_SHORT;
  if (outcome.kind === 'rest') {
    return outcome.side === PLAYER ? 'You rest and bank <b>+1 energy</b>; your guard stays up.' : `${FOE_SHORT} ${reason}: <b>+1 energy</b>.`;
  }
  const verb = outcome.side === PLAYER ? 'play' : 'plays';
  const why = outcome.side === PLAYER || !reason ? '' : ` (${reason})`;
  const sum = attackSum(outcome);
  const extra = effects(outcome, mover);
  const pierce = outcome.pierced ? ` ${ELEMENTS[outcome.card.element].name} ${PIERCE_VERB[outcome.card.element]}!` : '';
  const body = [sum, extra].filter(Boolean).join('; ');
  return `${mover} ${verb} <b>${outcome.card.name}</b>${why}${body ? ': ' + body : ''}.${pierce}`;
}

/** The line that opens the player's turn. */
export function describeTurnStart(drawn, energy, canPlay) {
  const draw = drawn ? `You draw <b>${drawn.name}</b>. ` : 'Your hand is full. ';
  return canPlay ? `${draw}Your move: <b>${energy} energy</b> to spend on one card.` : `${draw}Nothing you can pay for: <b>Rest</b> to bank energy.`;
}
