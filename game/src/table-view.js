// Draws a duel onto the table: life totals and bars (the shared scoreboard), the round, both
// energy bars, the rival's face-down hand, both guard slots, and the player's fanned hand with
// a badge on each card saying what it would do if played now. Reads the duel, never changes it.

import { createCardBack, createCardFace } from './card-view.js';
import { FOE_STRATEGY } from './opponent.js';
import { MAX_ENERGY, MAX_LIFE, FOE, PLAYER, previewPlay } from './rules.js';

const byId = (id) => document.getElementById(id);

/** Width the player's hand may fan across, and one card's width, in stage pixels. */
const HAND_SPAN = 680;
const CARD_WIDTH = 128;

/** Fill the parts of the table that never change during a duel (the rival's rule list). */
export function setupTable() {
  byId('foe-strategy').innerHTML = FOE_STRATEGY.map((line) => `<li>${line}</li>`).join('');
}

function renderEnergy(container, energy, spentPreview = 0) {
  let pips = '';
  for (let index = 0; index < MAX_ENERGY; index += 1) {
    const lit = index < energy - spentPreview;
    const spent = !lit && index < energy;
    pips += `<i class="${lit ? 'lit' : spent ? 'spent' : ''}"></i>`;
  }
  container.innerHTML = pips;
}

function renderLife(side, prefix) {
  const value = byId(`${prefix}-life`);
  const shown = Math.max(0, side.life);
  if (value.textContent !== String(shown)) value.textContent = String(shown);
  byId(`${prefix}-life-bar`).style.width = `${(Math.max(0, side.life) / MAX_LIFE) * 100}%`;
}

function renderStance(slot, card) {
  const current = slot.firstElementChild;
  if (!card) {
    slot.innerHTML = '';
    slot.classList.remove('filled');
    return null;
  }
  if (current && current.dataset.uid === card.uid) return current;
  slot.innerHTML = '';
  const node = createCardFace(card);
  slot.appendChild(node);
  slot.classList.add('filled');
  return node;
}

/** The badge text for what `card` would do now, with a class: lethal, weak or plain. */
export function previewBadge(duel, card) {
  const preview = previewPlay(duel, PLAYER, card);
  const foeLife = duel.sides[FOE].life;
  const tags = [];
  if (preview.pierced) tags.push('PIERCE');
  if (preview.kindred) tags.push('+2');
  if (preview.attack > 0) {
    if (preview.damage >= foeLife) return { text: `LETHAL ${preview.damage}`, kind: 'lethal' };
    return { text: [`${preview.damage} DMG`, ...tags].join(' · '), kind: preview.damage === 0 ? 'weak' : '' };
  }
  if (preview.heal > 0) return { text: `+${preview.heal} LIFE`, kind: '' };
  if (preview.draw > 0) return { text: `DRAW ${preview.draw}`, kind: '' };
  return { text: 'GUARD', kind: 'weak' };
}

function renderPlayerHand(duel, { locked, dealt }) {
  const hand = duel.sides[PLAYER].hand;
  const container = byId('player-hand');
  container.classList.toggle('locked', locked);
  container.innerHTML = '';
  const middle = (hand.length - 1) / 2;
  const step = hand.length > 1 ? Math.min(CARD_WIDTH + 8, (HAND_SPAN - CARD_WIDTH) / (hand.length - 1)) : 0;
  hand.forEach((card, index) => {
    const node = createCardFace(card);
    if (index > 0) node.style.marginLeft = `${step - CARD_WIDTH}px`;
    const offset = index - middle;
    node.style.setProperty('--fan-tilt', `${offset * 3.2}deg`);
    node.style.setProperty('--fan-lift', `${Math.abs(offset) * Math.abs(offset) * 2.4}px`);
    node.dataset.index = String(index);
    if (duel.sides[PLAYER].energy < card.cost) node.classList.add('unaffordable');
    if (!locked && duel.sides[PLAYER].energy >= card.cost) {
      const badge = previewBadge(duel, card);
      node.insertAdjacentHTML('beforeend', `<div class="card-preview ${badge.kind}">${badge.text}</div>`);
    }
    node.insertAdjacentHTML('beforeend', `<div class="card-key">${index + 1}</div>`);
    if (dealt.has(card.uid)) {
      node.classList.add('deal');
      node.style.setProperty('--i', String([...dealt].indexOf(card.uid)));
    }
    container.appendChild(node);
  });
}

function renderFoeHand(duel, dealt) {
  const hand = duel.sides[FOE].hand;
  const container = byId('foe-hand');
  container.innerHTML = '';
  const middle = (hand.length - 1) / 2;
  hand.forEach((card, index) => {
    const node = createCardBack();
    node.dataset.uid = card.uid;
    node.style.transform = `rotate(${(index - middle) * -4}deg) translateY(${Math.abs(index - middle) * 3}px)`;
    if (dealt.has(card.uid)) node.classList.add('deal');
    container.appendChild(node);
  });
}

/**
 * Redraw the whole table from `duel`. `locked` hides the badges while it is not the player's
 * move; `dealt` holds uids of cards just drawn, which slide in from the deck.
 */
export function renderTable(duel, { locked = false, dealt = new Set() } = {}) {
  const player = duel.sides[PLAYER];
  const foe = duel.sides[FOE];
  renderLife(player, 'player');
  renderLife(foe, 'foe');
  byId('round-label').textContent = `ROUND ${Math.max(1, duel.round)}`;
  renderEnergy(byId('player-energy'), player.energy);
  renderEnergy(byId('foe-energy'), foe.energy);
  byId('player-energy-label').textContent = `Energy ${player.energy} / ${MAX_ENERGY}`;
  byId('player-deck').textContent = `Deck ${player.deck.length} · Spent ${player.discard.length}`;
  byId('foe-deck').textContent = `Deck ${foe.deck.length} · Hand ${foe.hand.length}`;
  renderStance(byId('foe-stance'), foe.stance);
  renderStance(byId('player-stance'), player.stance);
  renderFoeHand(duel, dealt);
  renderPlayerHand(duel, { locked, dealt });
  byId('rest-button').disabled = locked || Boolean(duel.winner);
}

/** Set the message line (trusted HTML from the game's own strings) and flash it. */
export function setMessage(html) {
  const line = byId('message-line');
  line.innerHTML = html;
  line.classList.remove('flash');
  void line.offsetWidth;
  line.classList.add('flash');
}

/** Light the rival's rule that chose its last move (-1 for none). */
export function markStrategy(index) {
  [...byId('foe-strategy').children].forEach((item, at) => item.classList.toggle('active', at === index));
}

/** The guard-slot card node of `side`, if any. */
export function stanceNode(side) {
  return byId(side === PLAYER ? 'player-stance' : 'foe-stance').firstElementChild;
}

/** The card node in the player's hand for `uid`. */
export function handNode(uid) {
  return byId('player-hand').querySelector(`[data-uid="${uid}"]`);
}

/** The face-down node in the rival's hand for `uid`. */
export function foeHandNode(uid) {
  return byId('foe-hand').querySelector(`[data-uid="${uid}"]`);
}

/** The node standing for `side`'s life (to aim floaters and sparks at). */
export function lifeNode(side) {
  return byId(side === PLAYER ? 'player-life' : 'foe-life');
}
