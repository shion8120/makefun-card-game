// The screenshot scenes behind ?shot=title|duel|win|loss (&seed=N). Each plays the real rules
// forward from a dealt duel, both sides choosing with the rival's own strategy (the loss scene's
// player swings recklessly instead), and stops at the moment the scene names: so every frame is
// a real position of a real duel, and the same seed always gives the same frame.

import { describeOutcome, describeTurnStart } from './narration.js';
import { chooseMove } from './opponent.js';
import { FOE, PLAYER, createDuel, endTurn, playCard, playableIndices, rest, startTurn } from './rules.js';

const SEARCH = 400;

/** Play one move for the active side; returns { outcome, move }. */
function playMove(duel, style) {
  const move = chooseMove(duel, style);
  const outcome = move.kind === 'rest' ? rest(duel) : playCard(duel, move.index);
  return { outcome, move };
}

/** A mid-duel position at the player's decision with a full hand, both guards up and a live race. */
function isGoodDuelMoment(duel) {
  const player = duel.sides[PLAYER];
  const foe = duel.sides[FOE];
  const playable = playableIndices(duel).length;
  return (
    duel.round >= 4 &&
    player.hand.length >= 6 &&
    playable >= 4 &&
    player.stance &&
    foe.stance &&
    player.life >= 9 &&
    player.life <= 17 &&
    foe.life >= 7 &&
    foe.life <= 15
  );
}

function duelScene(seed) {
  for (let attempt = 0; attempt < SEARCH; attempt += 1) {
    const duel = createDuel(seed + attempt);
    let last = null;
    while (!duel.winner) {
      const drawn = startTurn(duel);
      if (duel.active === PLAYER && isGoodDuelMoment(duel)) {
        const message = last ? `${describeOutcome(last.outcome, last.move.reason)} <b>Your move.</b>` : describeTurnStart(drawn, duel.sides[PLAYER].energy, true);
        return { duel, message, rule: last?.move.rule ?? -1, phase: 'player-turn' };
      }
      const played = playMove(duel, 'warden');
      if (duel.active === FOE) last = played;
      if (!duel.winner) endTurn(duel);
    }
  }
  return endScene(seed, PLAYER);
}

function endScene(seed, wanted) {
  const playerStyle = wanted === PLAYER ? 'warden' : 'reckless';
  for (let attempt = 0; attempt < SEARCH; attempt += 1) {
    const duel = createDuel(seed + attempt);
    let last = null;
    while (!duel.winner) {
      startTurn(duel);
      last = playMove(duel, duel.active === PLAYER ? playerStyle : 'warden');
      if (!duel.winner) endTurn(duel);
    }
    if (duel.winner === wanted && duel.round >= 7) {
      return { duel, message: describeOutcome(last.outcome, last.move.reason), rule: last.move.rule, phase: wanted === PLAYER ? 'won' : 'lost' };
    }
  }
  throw new Error('no duel ended the wanted way');
}

/** Build the named scene from `seed`: { duel, message, rule, phase } (title has duel null). */
export function stageShot(name, seed) {
  if (name === 'duel') return duelScene(seed);
  if (name === 'win') return endScene(seed, PLAYER);
  if (name === 'loss') return endScene(seed, FOE);
  return { duel: null, message: '', rule: -1, phase: 'title' };
}
