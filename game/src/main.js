// EMBER DUEL's entry point: scales the 1280x720 stage to the window, draws the portraits and the
// rules card, then either opens the title screen for a real duel or, with ?shot=title|duel|win|loss,
// lays out a screenshot scene with motion and sound off.

import { createDuelController } from './duel-controller.js';
import { initEmbers } from './embers.js';
import { wheelSvg } from './icons.js';
import { initMotion } from './motion.js';
import { drawPlayerCrest, drawWardenPortrait } from './portrait.js';
import { seedFromClock } from './random.js';
import { hideResult, onPlayAgain, setupTitle, showResult, showTitle } from './screens.js';
import { stageShot } from './shots.js';
import { muteAudio, unlockAudio } from './sound.js';
import { markStrategy, renderTable, setMessage, setupTable } from './table-view.js';

const STAGE_WIDTH = 1280;
const STAGE_HEIGHT = 720;

function fitStage() {
  const scale = Math.min(window.innerWidth / STAGE_WIDTH, window.innerHeight / STAGE_HEIGHT);
  document.documentElement.style.setProperty('--scale', String(scale));
}

function drawStaticArt() {
  drawWardenPortrait(document.getElementById('foe-portrait'), 'calm');
  drawPlayerCrest(document.getElementById('player-crest'));
  document.getElementById('mini-wheel').innerHTML = wheelSvg(118);
}

function startShotMode(name, seed) {
  document.body.classList.add('no-motion');
  muteAudio();
  initMotion(document.getElementById('table'), true);
  const scene = stageShot(name, seed);
  setupTitle(() => {});
  if (!scene.duel) {
    showTitle(true);
    document.body.dataset.phase = 'title';
    return;
  }
  showTitle(false);
  renderTable(scene.duel, { locked: scene.phase !== 'player-turn' });
  setMessage(scene.message);
  markStrategy(scene.rule);
  if (scene.phase === 'won' || scene.phase === 'lost') {
    drawWardenPortrait(document.getElementById('foe-portrait'), scene.phase === 'won' ? 'beaten' : 'gloat');
    showResult(scene.duel, { animate: false });
  }
  document.body.dataset.phase = scene.phase;
}

function startPlayMode() {
  initMotion(document.getElementById('table'), false);
  initEmbers(document.getElementById('fx-canvas'));
  const controller = createDuelController();
  const begin = () => {
    unlockAudio();
    showTitle(false);
    hideResult();
    controller.start(seedFromClock());
  };
  setupTitle(begin);
  onPlayAgain(begin);
  showTitle(true);
  document.body.dataset.phase = 'title';
  window.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    const phase = document.body.dataset.phase;
    if (phase === 'title' || phase === 'won' || phase === 'lost') begin();
  });
}

fitStage();
window.addEventListener('resize', fitStage);
setupTable();
drawStaticArt();

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) startShotMode(shot, Number(params.get('seed')) || 1);
else startPlayMode();
