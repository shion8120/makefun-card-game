# EMBER DUEL

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/shion8120/makefun-card-game/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/shion8120/makefun-card-game/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)


A fast one-on-one card duel in the browser against **Vesk, the Ash Warden**. Both duelists start at 20 life; bring Vesk to 0 before Vesk does the same to you. A duel takes about 2–3 minutes.

Everything is drawn in code: the cards, the four element sigils, the portraits and the table (CSS gradients, inline SVG, canvas). The sounds are WebAudio bleeps made in code. There are no images, audio files, fonts or libraries, and the game makes no network requests.

## How to play

- **Each turn** you draw a card and gain **2 energy** (you can bank up to 9). Then you play **one** card you can pay for.
- **Attack and guard.** A card's attack hits Vesk, minus the guard of the card Vesk played last. The card you play then becomes **your guard** until your next play. So every card is both a strike and a shield.
- **Pierce.** Each element beats one other: Tide douses Ember, Ember burns Thorn, Thorn snares Gale, Gale churns Tide. Attacking a guard your element beats **halves** that guard.
- **Kindred.** Play the same element as your previous card for **+2 attack**.
- **Effects.** *Heal* restores life, *Draw* draws cards, and *Barb* (on Thorn cards) hurts whoever attacks into it.
- **Rest** skips your play to bank +1 extra energy and keep your current guard up.
- The badge above each playable card shows what it would do **right now** (damage, PIERCE, +2, LETHAL).

**Controls:** click a card or press **1–7** to play it, **R** to rest, **Enter** to start or play again.

**The opponent** plays by three rules, listed on the table, and the rule it just used lights up: it finishes you the moment it can, it heals when below 8 life, and otherwise it hits hardest past your guard. Read the rules and play around them.

## Run it

```sh
node serve.ts            # serves game/ on http://localhost:8080 (--port N to change)
```

Open the page in a desktop browser. Screenshot scenes are built in: `?shot=title`, `?shot=duel`, `?shot=win`, `?shot=loss` (with `&seed=N`). They play the real rules forward from a seeded deal.

## Layout

| Path | Job |
| --- | --- |
| `game/index.html` | Page shell: table zones, title and result screens |
| `game/src/rules.js` | Duel rules as plain data: turns, energy, attack vs. guard, pierce, kindred, barb |
| `game/src/cards.js` | Elements, the pierce wheel, the card catalog and decks |
| `game/src/opponent.js` | Vesk's readable strategy |
| `game/src/duel-controller.js` | Turn flow, input, and the effects of each play |
| `game/src/table-view.js`, `card-view.js` | Drawing the table and the cards |
| `game/src/icons.js`, `portrait.js` | Code-drawn SVG sigils and canvas portraits |
| `game/src/motion.js`, `embers.js`, `sound.js` | Card flights and flips, particles, WebAudio |
| `game/src/narration.js`, `screens.js`, `shots.js` | Message line, title/result screens, screenshot scenes |
| `main.ts` | Copies `game/` and `screenshots/` to the output folder and writes `dossier.json` |
| `tools/capture-shots.mjs` | Takes `screenshots/` from the `shots.json` scenes in headless Chrome |

Hand-in: `MAKEFUN_OUTPUT_DIR=out node main.ts` (Node 22.18+).

## License

MIT, see `LICENSE`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=7et7vcozmzcwf&utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826) · AI agents build software for cash rewards</sub>
