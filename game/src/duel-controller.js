// Runs a live duel: the player's turn (draw, pick a card by click or key 1-7, or rest with R),
// then the Ash Warden's turn on a short timer, with the flights, sounds, sparks and messages
// that show each play, until one side reaches 0 life and the result screen comes up.

import { ELEMENTS } from './cards.js';
import { createCardBack } from './card-view.js';
import { ashfall, burstAt, celebrate } from './embers.js';
import { centreOf, flyAndFlip, flyFrom, floatText, pulse, wait } from './motion.js';
import { describeOutcome, describeTurnStart } from './narration.js';
import { chooseMove } from './opponent.js';
import { drawPlayerCrest, drawWardenPortrait } from './portrait.js';
import { FOE, PLAYER, createDuel, endTurn, playCard, playableIndices, rest, startTurn } from './rules.js';
import { showResult } from './screens.js';
import { blockSound, drawSound, healSound, hitSound, loseSound, playCardSound, winSound } from './sound.js';
import { foeHandNode, handNode, lifeNode, markStrategy, renderTable, setMessage, stanceNode } from './table-view.js';

const byId = (id) => document.getElementById(id);

/** Create the controller that owns the live duel and the table's input. */
export function createDuelController() {
  let duel = null;
  let accepting = false;
  let generation = 0;

  const portrait = byId('foe-portrait');
  const setPhase = (phase) => (document.body.dataset.phase = phase);
  const live = (token) => token === generation;

  function setWardenMood(mood) {
    drawWardenPortrait(portrait, mood);
  }

  /** Show what an outcome did to the table: sparks, floaters, shakes and sounds. */
  async function showImpact(outcome) {
    const target = outcome.side === PLAYER ? FOE : PLAYER;
    const color = ELEMENTS[outcome.card.element].color;
    if (outcome.damage > 0) {
      const life = lifeNode(target);
      hitSound(outcome.damage);
      floatText(life, `-${outcome.damage}`, 'damage');
      pulse(life, 'bump');
      const { x, y } = centreOf(life);
      burstAt(x, y, color, Math.min(2, outcome.damage / 4));
      if (outcome.damage >= 6) pulse(byId('table'), 'shake');
      if (target === FOE) {
        pulse(portrait, 'hit');
        setWardenMood('hurt');
      } else {
        setWardenMood('gloat');
      }
    } else if (outcome.attack > 0) {
      blockSound();
    }
    if (outcome.attack > 0 && outcome.blocked > 0) {
      const guard = stanceNode(target);
      if (guard) {
        pulse(guard, 'struck');
        guard.classList.toggle('pierced-mark', outcome.pierced);
      }
    }
    if (outcome.barb > 0) {
      await wait(220);
      floatText(lifeNode(outcome.side), `-${outcome.barb} barb`, 'barb');
      pulse(lifeNode(outcome.side), 'bump');
      hitSound(outcome.barb);
    }
    if (outcome.heal > 0) {
      await wait(200);
      floatText(lifeNode(outcome.side), `+${outcome.heal}`, 'heal');
      healSound();
    }
    outcome.drawn.forEach((card, index) => drawSound(index));
  }

  async function finish(token) {
    accepting = false;
    renderTable(duel, { locked: true });
    await wait(700);
    if (!live(token)) return;
    const won = duel.winner === PLAYER;
    setPhase(won ? 'won' : 'lost');
    setWardenMood(won ? 'beaten' : 'gloat');
    showResult(duel);
    if (won) {
      winSound();
      celebrate();
    } else {
      loseSound();
      ashfall();
    }
  }

  async function beginPlayerTurn(token) {
    const drawn = startTurn(duel);
    const canPlay = playableIndices(duel).length > 0;
    renderTable(duel, { dealt: new Set(drawn ? [drawn.uid] : []) });
    if (drawn) drawSound();
    setMessage(describeTurnStart(drawn, duel.sides[PLAYER].energy, canPlay));
    markStrategy(-1);
    setPhase('player-turn');
    accepting = live(token);
  }

  async function runFoeTurn(token) {
    setPhase('foe-turn');
    const drawn = startTurn(duel);
    renderTable(duel, { locked: true, dealt: new Set(drawn ? [drawn.uid] : []) });
    setMessage('Vesk draws and weighs the table…');
    await wait(850);
    if (!live(token)) return;

    const move = chooseMove(duel);
    markStrategy(move.rule);
    if (move.kind === 'rest') {
      setMessage(describeOutcome(rest(duel), move.reason));
      renderTable(duel, { locked: true });
    } else {
      const card = duel.sides[FOE].hand[move.index];
      const from = foeHandNode(card.uid)?.getBoundingClientRect() ?? null;
      const outcome = playCard(duel, move.index);
      renderTable(duel, { locked: true });
      const face = stanceNode(FOE);
      playCardSound();
      await flyAndFlip(face, createCardBack(), from);
      if (!live(token)) return;
      setMessage(describeOutcome(outcome, move.reason));
      await showImpact(outcome);
      if (duel.winner) return finish(token);
    }
    await wait(900);
    if (!live(token)) return;
    setWardenMood('calm');
    endTurn(duel);
    beginPlayerTurn(token);
  }

  async function playerPlays(index) {
    if (!accepting || duel.active !== PLAYER || duel.winner) return;
    const card = duel.sides[PLAYER].hand[index];
    if (!card) return;
    if (duel.sides[PLAYER].energy < card.cost) {
      setMessage(`<b>${card.name}</b> costs ${card.cost} energy; you have ${duel.sides[PLAYER].energy}. Pick another card or <b>Rest</b>.`);
      return;
    }
    const token = generation;
    accepting = false;
    setPhase('resolving');
    const from = handNode(card.uid)?.getBoundingClientRect() ?? null;
    const outcome = playCard(duel, index);
    renderTable(duel, { locked: true });
    playCardSound();
    await flyFrom(stanceNode(PLAYER), from);
    if (!live(token)) return;
    setMessage(describeOutcome(outcome));
    await showImpact(outcome);
    if (duel.winner) return finish(token);
    await wait(750);
    if (!live(token)) return;
    endTurn(duel);
    runFoeTurn(token);
  }

  function playerRests() {
    if (!accepting || duel.active !== PLAYER || duel.winner) return;
    const token = generation;
    accepting = false;
    setPhase('resolving');
    setMessage(describeOutcome(rest(duel)));
    renderTable(duel, { locked: true });
    wait(700).then(() => {
      if (!live(token)) return;
      endTurn(duel);
      runFoeTurn(token);
    });
  }

  byId('player-hand').addEventListener('click', (event) => {
    const node = event.target.closest('.card');
    if (node) playerPlays(Number(node.dataset.index));
  });
  byId('rest-button').addEventListener('click', playerRests);
  window.addEventListener('keydown', (event) => {
    if (!duel || event.repeat) return;
    if (event.key >= '1' && event.key <= '7') playerPlays(Number(event.key) - 1);
    else if (event.key === 'r' || event.key === 'R') playerRests();
  });

  return {
    /** Deal a new duel from `seed` and open the player's first turn. */
    async start(seed) {
      generation += 1;
      const token = generation;
      accepting = false;
      duel = createDuel(seed);
      setWardenMood('calm');
      drawPlayerCrest(byId('player-crest'));
      const opening = new Set([...duel.sides[PLAYER].hand, ...duel.sides[FOE].hand].map((card) => card.uid));
      renderTable(duel, { locked: true, dealt: opening });
      setMessage('The cards are dealt. Vesk, the Ash Warden, raises a hand of ash…');
      setPhase('dealing');
      await wait(900);
      if (live(token)) beginPlayerTurn(token);
    },
    get duel() {
      return duel;
    },
  };
}
