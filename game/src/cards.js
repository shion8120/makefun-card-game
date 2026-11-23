// The card catalog of EMBER DUEL: the four elements, the wheel that says which element pierces
// which, every card's cost / attack / guard / effect, and the 20-card deck each duelist shuffles.

export const ELEMENTS = {
  ember: { key: 'ember', name: 'Ember', color: '#ff6a2b', deep: '#7a1d08', glow: '#ffc25a' },
  tide: { key: 'tide', name: 'Tide', color: '#2f9bff', deep: '#0b2f66', glow: '#9fe3ff' },
  thorn: { key: 'thorn', name: 'Thorn', color: '#3fc46a', deep: '#0f4a24', glow: '#b8f59a' },
  gale: { key: 'gale', name: 'Gale', color: '#c9b6ff', deep: '#3b2b78', glow: '#f3ecff' },
};

/**
 * The elemental wheel: each element pierces the next one's guard (halves it).
 * Tide douses Ember, Ember burns Thorn, Thorn snares Gale, Gale churns Tide.
 */
export const PIERCES = { tide: 'ember', ember: 'thorn', thorn: 'gale', gale: 'tide' };
export const PIERCE_VERB = { tide: 'douses', ember: 'burns', thorn: 'snares', gale: 'churns' };

/** True when an attack of element `attacker` pierces a guard of element `defender`. */
export function pierces(attacker, defender) {
  return PIERCES[attacker] === defender;
}

/**
 * Every card: cost in energy, attack dealt when played, guard it raises until your next play,
 * and an optional effect: heal (restore life), draw (cards), barb (hurts whoever attacks into it).
 */
export const CATALOG = [
  { id: 'spark-imp', name: 'Spark Imp', element: 'ember', cost: 1, attack: 3, guard: 0 },
  { id: 'cinder-lance', name: 'Cinder Lance', element: 'ember', cost: 2, attack: 4, guard: 1 },
  { id: 'blaze-hound', name: 'Blaze Hound', element: 'ember', cost: 3, attack: 6, guard: 1 },
  { id: 'inferno-wyrm', name: 'Inferno Wyrm', element: 'ember', cost: 5, attack: 9, guard: 2 },
  { id: 'hearth-ember', name: 'Hearth Ember', element: 'ember', cost: 2, attack: 1, guard: 2, heal: 3 },

  { id: 'brine-shell', name: 'Brine Shell', element: 'tide', cost: 1, attack: 1, guard: 4 },
  { id: 'undertow', name: 'Undertow', element: 'tide', cost: 3, attack: 4, guard: 4 },
  { id: 'leviathan-tide', name: 'Leviathan Tide', element: 'tide', cost: 5, attack: 6, guard: 6 },
  { id: 'mending-rain', name: 'Mending Rain', element: 'tide', cost: 2, attack: 0, guard: 3, heal: 5 },

  { id: 'bramble-pup', name: 'Bramble Pup', element: 'thorn', cost: 1, attack: 2, guard: 2, barb: 1 },
  { id: 'thornback', name: 'Thornback', element: 'thorn', cost: 3, attack: 3, guard: 4, barb: 2 },
  { id: 'elder-briar', name: 'Elder Briar', element: 'thorn', cost: 4, attack: 5, guard: 5, barb: 2 },
  { id: 'sap-bloom', name: 'Sap Bloom', element: 'thorn', cost: 2, attack: 0, guard: 2, heal: 3, draw: 1 },

  { id: 'zephyr-kite', name: 'Zephyr Kite', element: 'gale', cost: 0, attack: 1, guard: 1, draw: 1 },
  { id: 'squall-harrier', name: 'Squall Harrier', element: 'gale', cost: 2, attack: 5, guard: 0 },
  { id: 'storm-roc', name: 'Storm Roc', element: 'gale', cost: 4, attack: 7, guard: 2, draw: 1 },
  { id: 'windscry', name: 'Windscry', element: 'gale', cost: 1, attack: 0, guard: 1, draw: 2 },
];

/** The extra copies that round each deck up to 20: one cheap card of three elements. */
const DECK_EXTRAS = ['spark-imp', 'brine-shell', 'bramble-pup'];

const BY_ID = new Map(CATALOG.map((card) => [card.id, card]));

/** The catalog entry for `id`. */
export function cardById(id) {
  const card = BY_ID.get(id);
  if (!card) throw new Error(`unknown card ${id}`);
  return card;
}

/** One unshuffled 20-card deck of card instances; `owner` keeps every uid unique across both decks. */
export function buildDeck(owner) {
  const ids = CATALOG.map((card) => card.id).concat(DECK_EXTRAS);
  return ids.map((id, index) => ({ ...cardById(id), uid: `${owner}-${index}` }));
}

/** A one-line rules text for a card's effect, empty when it has none. */
export function effectText(card) {
  const parts = [];
  if (card.heal) parts.push(`Heal ${card.heal}`);
  if (card.draw) parts.push(`Draw ${card.draw}`);
  if (card.barb) parts.push(`Barb ${card.barb}`);
  return parts.join(' · ');
}
