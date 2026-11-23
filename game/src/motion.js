// Card motion on the 1280x720 stage: FLIP flights from hand to guard slot (measure where a card
// was, place it where it goes, animate the difference), the rival's face-down card flying out
// and flipping face-up, floating damage and heal numbers, and restartable CSS pulses.

let stage = null;
let instant = false;

/** Use `table` as the stage that cards fly across; `noMotion` makes every move instant. */
export function initMotion(table, noMotion = false) {
  stage = table;
  instant = noMotion;
}

/** The stage's current scale (it is scaled to fit the window). */
function stageScale() {
  return stage.getBoundingClientRect().width / stage.offsetWidth || 1;
}

/** A viewport rect turned into stage coordinates. */
function toStage(rect) {
  const box = stage.getBoundingClientRect();
  const scale = stageScale();
  return { left: (rect.left - box.left) / scale, top: (rect.top - box.top) / scale, width: rect.width / scale, height: rect.height / scale };
}

/** Resolve after `ms` milliseconds (at once when motion is off). */
export function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, instant ? 0 : ms));
}

/** Animate `node` (already in its final place) from the viewport rect `from`: the FLIP step. */
export function flyFrom(node, from, duration = 420) {
  if (instant || !from) return Promise.resolve();
  const to = node.getBoundingClientRect();
  const scale = stageScale();
  const dx = (from.left + from.width / 2 - (to.left + to.width / 2)) / scale;
  const dy = (from.top + from.height / 2 - (to.top + to.height / 2)) / scale;
  const size = from.width / to.width;
  const animation = node.animate(
    [
      { transform: `translate(${dx}px, ${dy}px) scale(${size}) rotate(-8deg)`, offset: 0 },
      { transform: `translate(${dx * 0.35}px, ${dy * 0.35 - 30}px) scale(${(size + 1.15) / 2}) rotate(4deg)`, offset: 0.55 },
      { transform: 'translate(0, 0) scale(1.08) rotate(0deg)', offset: 0.85 },
      { transform: 'none', offset: 1 },
    ],
    { duration, easing: 'cubic-bezier(.3,.7,.2,1)' },
  );
  return animation.finished.catch(() => {});
}

/**
 * The rival's play: a face-down `back` card flies from the viewport rect `from` to `face`'s
 * place, then turns over to show `face`.
 */
export async function flyAndFlip(face, back, from, duration = 520) {
  if (instant || !from) return;
  const target = toStage(face.getBoundingClientRect());
  const start = toStage(from);
  back.style.position = 'absolute';
  back.style.left = `${target.left}px`;
  back.style.top = `${target.top}px`;
  back.style.zIndex = '20';
  back.style.fontSize = '16px';
  stage.appendChild(back);
  face.style.visibility = 'hidden';
  const dx = start.left + start.width / 2 - (target.left + target.width / 2);
  const dy = start.top + start.height / 2 - (target.top + target.height / 2);
  const size = start.width / target.width;
  await back
    .animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(${size}) rotate(10deg)` },
        { transform: `translate(${dx * 0.3}px, ${dy * 0.3 + 30}px) scale(1.1) rotate(-4deg)`, offset: 0.6 },
        { transform: 'scaleX(1)' },
      ],
      { duration, easing: 'cubic-bezier(.3,.7,.2,1)' },
    )
    .finished.catch(() => {});
  await back.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], { duration: 120, easing: 'ease-in' }).finished.catch(() => {});
  back.remove();
  face.style.visibility = '';
  await face.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1.06)', offset: 0.7 }, { transform: 'scaleX(1)' }], { duration: 170, easing: 'ease-out' }).finished.catch(() => {});
}

/** Restart the CSS animation that `className` gives `node`. */
export function pulse(node, className) {
  if (instant || !node) return;
  node.classList.remove(className);
  void node.offsetWidth;
  node.classList.add(className);
}

/** A number (or word) that rises and fades above `target`; kind is damage, heal or barb. */
export function floatText(target, text, kind) {
  if (instant || !target) return;
  const rect = toStage(target.getBoundingClientRect());
  const floater = document.createElement('div');
  floater.className = `floater ${kind}`;
  floater.textContent = text;
  floater.style.left = `${rect.left + rect.width / 2}px`;
  floater.style.top = `${rect.top + rect.height * 0.2}px`;
  stage.appendChild(floater);
  setTimeout(() => floater.remove(), 1200);
}

/** The viewport centre of `node`, for particle bursts. */
export function centreOf(node) {
  const rect = node.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}
