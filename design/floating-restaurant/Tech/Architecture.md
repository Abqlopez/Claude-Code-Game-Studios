---
tags: [tech]
---
# How the 3D game is built
Runs in the browser with **Three.js r128** (from cdnjs). The page is split into files (full copies in `Code/`):

| File | Job |
|---|---|
| `index.html` | The page, styles, and the 3D world: renderer, sea, boat, kitchen, dining room, cabin, dock, skiff, chef, camera, zoom, day/night, walking and collisions, modes (walk / fish / night / cut) |
| `js/data.js` | **All tunable game data** (shared with the 2D game): fish, recipes, guests, upgrades, events, goals, every config number |
| `js/state.js` | The save, money ledger, day roll, fishing odds, booking, ingredient reservation, quality, end of day (shared with 2D) |
| `js/fishart.js` / `js/dishart.js` | The v3 fish and dish pictures, copied from the 2D art code and drawn onto canvases |
| `js/fishing3d.js` | Mornings: skiff steering, signs, mini map, casting, the per-fish fights, crab traps, catch summary |
| `js/service3d.js` | Night service: guests, queue, seating, orders, the v3 kitchen (tank/pantry panels, board, heat, sink, bin, pass), staff brains, labels, ticket rail, results data |
| `js/prep3d.js` | The afternoon panel: Guests, Menu, Shop, Gear + bait, Upgrades, Staff + stations, Journal |
| `js/day3d.js` | The day loop and cutscene runner, title screen, picking waters, results, bed |

The 2D game (v3.2) is Phaser 3.90 with `data.js`, `state.js`, `art*.js`, `ui.js`, `fight.js`, `fishing.js`, `prep.js`, `service.js`, `scenes.js`.

**Tune the game by editing `data.js`**: nothing else needs to change for numbers.
