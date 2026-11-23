// Builds the DOM for one card: the face (cost gem, name, element sigil art, effect line, big
// attack and guard numbers, corner pip) and the back (the Ash Warden's ember-knot pattern).
// Styling lives in styles/cards.css; each element tints the frame by its own colour.

import { ELEMENTS, effectText } from './cards.js';
import { bladeSvg, gemSvg, shieldSvg, sigilSvg } from './icons.js';

/** A face-up card element for `card`. */
export function createCardFace(card) {
  const element = ELEMENTS[card.element];
  const node = document.createElement('div');
  node.className = `card face el-${card.element}`;
  node.dataset.uid = card.uid;
  node.setAttribute('aria-label', `${card.name}, ${element.name}, cost ${card.cost}, attack ${card.attack}, guard ${card.guard}${effectText(card) ? ', ' + effectText(card) : ''}`);
  const effect = effectText(card);
  node.innerHTML = `
    <div class="card-inner">
      <div class="card-cost">${gemSvg(34)}<span>${card.cost}</span></div>
      <div class="card-pip">${sigilSvg(card.element, 18)}</div>
      <div class="card-art">${sigilSvg(card.element, 64)}</div>
      <div class="card-name">${card.name}</div>
      <div class="card-effect${effect ? '' : ' empty'}">${effect || element.name}</div>
      <div class="card-stats">
        <span class="stat stat-attack">${bladeSvg(16)}<b>${card.attack}</b></span>
        <span class="stat stat-guard">${shieldSvg(16)}<b>${card.guard}</b></span>
      </div>
    </div>`;
  return node;
}

/** A face-down card element (the rival's hand, the decks). */
export function createCardBack() {
  const node = document.createElement('div');
  node.className = 'card back';
  node.innerHTML = '<div class="card-inner"><div class="back-knot"></div></div>';
  return node;
}
