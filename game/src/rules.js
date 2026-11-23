// The rules of EMBER DUEL, with no drawing and no timing: a duel is plain data, and every move
// (start a turn, play a card, rest) changes it and returns what happened, so the table view,
// the opponent, the sounds and the screenshot scenes all read the same outcome.
//
// A turn: draw a card, gain 2 energy, then play ONE card you can afford (or rest for +1 energy).
// The card's attack hits the rival, minus the guard of the rival's last card (their stance);
// the card you played then becomes your own stance, guarding you until your next play.
// Pierce: an element that beats the stance's element halves that guard (Tide > Ember > Thorn > Gale > Tide).
// Kindred: playing the same element as your previous card adds +2 attack.
// Barb: attacking into a Thorn stance with barb hurts the attacker.

import { buildDeck, pierces } from './cards.js';
import { createRandom, shuffleInPlace } from './random.js';

export const START_LIFE = 20;
export const MAX_LIFE = 20;
export const OPENING_HAND = 4;
export const MAX_HAND = 7;
export const ENERGY_PER_TURN = 2;
export const REST_BONUS = 1;
export const MAX_ENERGY = 9;
export const KINDRED_BONUS = 2;

export const PLAYER = 'player';
export const FOE = 'foe';

/** The other side's key. */
export function rivalOf(side) {
  return side === PLAYER ? FOE : PLAYER;
}

function createSide(key, random, energy) {
  return {
    key,
    life: START_LIFE,
    energy,
    deck: shuffleInPlace(buildDeck(key), random),
    hand: [],
    discard: [],
    stance: null,
    lastElement: null,
    dealt: 0,
  };
}

/** A new duel dealt from `seed`: both decks shuffled, opening hands drawn, the player to move first. */
export function createDuel(seed) {
  const random = createRandom(seed);
  const duel = {
    seed,
    random,
    round: 0,
    active: PLAYER,
    winner: null,
    sides: { [PLAYER]: createSide(PLAYER, random, 0), [FOE]: createSide(FOE, random, 1) },
  };
  for (let count = 0; count < OPENING_HAND; count += 1) {
    drawCard(duel, PLAYER);
    drawCard(duel, FOE);
  }
  return duel;
}

/** Move the top card of `side`'s deck to its hand (reshuffling the discard when the deck runs out). */
export function drawCard(duel, sideKey) {
  const side = duel.sides[sideKey];
  if (side.hand.length >= MAX_HAND) return null;
  if (side.deck.length === 0) {
    side.deck = shuffleInPlace(side.discard, duel.random);
    side.discard = [];
  }
  const card = side.deck.pop() ?? null;
  if (card) side.hand.push(card);
  return card;
}

/** Begin the active side's turn: count the round, gain energy, draw one. Returns the drawn card. */
export function startTurn(duel) {
  const side = duel.sides[duel.active];
  if (duel.active === PLAYER) duel.round += 1;
  side.energy = Math.min(MAX_ENERGY, side.energy + ENERGY_PER_TURN);
  return drawCard(duel, duel.active);
}

/** True when `sideKey` has the energy for `card`. */
export function canAfford(duel, sideKey, card) {
  return duel.sides[sideKey].energy >= card.cost;
}

/** The guard a stance offers against an attack of `element`, and whether that attack pierces it. */
export function guardAgainst(stance, element) {
  if (!stance) return { guard: 0, pierced: false };
  const pierced = pierces(element, stance.element);
  return { guard: pierced ? Math.floor(stance.guard / 2) : stance.guard, pierced };
}

/**
 * What playing `card` from `sideKey` would do right now, without doing it: the attack after
 * Kindred, the guard it meets, the damage through, the barb it takes back, heal and draw.
 */
export function previewPlay(duel, sideKey, card) {
  const side = duel.sides[sideKey];
  const rival = duel.sides[rivalOf(sideKey)];
  const kindred = card.attack > 0 && side.lastElement === card.element;
  const attack = card.attack > 0 ? card.attack + (kindred ? KINDRED_BONUS : 0) : 0;
  const { guard, pierced } = attack > 0 ? guardAgainst(rival.stance, card.element) : { guard: 0, pierced: false };
  const damage = Math.max(0, attack - guard);
  const barb = attack > 0 && rival.stance?.barb ? rival.stance.barb : 0;
  const heal = Math.min(card.heal ?? 0, MAX_LIFE - side.life + barb);
  return { attack, kindred, guard, pierced, damage, blocked: attack - damage, barb, heal: Math.max(0, heal), draw: card.draw ?? 0 };
}

/** Play the card at `handIndex` for the active side. Returns the outcome, or null when it cannot be played. */
export function playCard(duel, handIndex) {
  if (duel.winner) return null;
  const sideKey = duel.active;
  const side = duel.sides[sideKey];
  const rival = duel.sides[rivalOf(sideKey)];
  const card = side.hand[handIndex];
  if (!card || !canAfford(duel, sideKey, card)) return null;

  const outcome = { kind: 'play', side: sideKey, card, ...previewPlay(duel, sideKey, card), drawn: [], winner: null };
  side.energy -= card.cost;
  side.hand.splice(handIndex, 1);

  rival.life -= outcome.damage;
  side.dealt += outcome.damage;
  side.life -= outcome.barb;
  if (rival.life > 0 && side.life > 0) side.life = Math.min(MAX_LIFE, side.life + (card.heal ?? 0));
  for (let count = 0; count < outcome.draw; count += 1) {
    const drawn = drawCard(duel, sideKey);
    if (drawn) outcome.drawn.push(drawn);
  }

  if (side.stance) side.discard.push(side.stance);
  side.stance = card;
  side.lastElement = card.element;

  if (rival.life <= 0) duel.winner = sideKey;
  else if (side.life <= 0) duel.winner = rival.key;
  outcome.winner = duel.winner;
  return outcome;
}

/** The active side passes its play: it keeps its stance and banks +1 energy. */
export function rest(duel) {
  const side = duel.sides[duel.active];
  side.energy = Math.min(MAX_ENERGY, side.energy + REST_BONUS);
  side.lastElement = null;
  return { kind: 'rest', side: duel.active, winner: null };
}

/** Hand the turn to the other side. */
export function endTurn(duel) {
  duel.active = rivalOf(duel.active);
}

/** Indices of the active side's cards it can afford this turn. */
export function playableIndices(duel) {
  const side = duel.sides[duel.active];
  return side.hand.map((card, index) => (side.energy >= card.cost ? index : -1)).filter((index) => index >= 0);
}
