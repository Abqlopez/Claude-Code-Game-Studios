---
tags: [roadmap, index]
---
# Roadmap

## Done in v4.1
See [[v4.1]]: the whole 2D game is now in 3D ([[Not Yet in 3D]] is all ticked).

## Done in v4.2 (new look)
- Every guest and the staff are built by our own guest kit (`js/guests.js`): the species and role outfits in [[Guests]], plus Old Gus and Marina. No guest carries a weapon (no trident, no staff: the Sea Witch carries a glowing lantern).
- Toon look (`js/toonkit.js`): flat three-tone shading on everything and ink outlines on guests and the chef.
- Look test with every guest on one raft: `prototypes/floating-restaurant-style-spike/`.
- The chef in the new style: the old chef parts stay as the rig the cutscenes pose, and the new chef copies them (toque, nightcap, sitting, yawning all still work).
- Cartoon sea: the same waves, drawn in three flat tones with white wave streaks; day, night and storm colours unchanged.
- Ink outlines on props too (anything bigger than a cup).
- Watch: outlines double the number of things drawn (about 2,700 at a busy dinner). If phones struggle, raise the size limit in `outlineAll`.

## Next ideas
1. ~~**Booking after the morning** + a **"Catch of the Day"** recipe~~ Done in v4.2: see [[Catch of the Day]]. (Guests are already booked in the afternoon, after the morning, so only the recipe was missing.)
2. **The Deep Trench**: a third sea (teased on the chart), with new fish, baits and lures.
3. Build mode for kitchen stations and decor, not just tables.
4. A second skiff you can see when the Deckhand works.

## Ideas mentioned along the way
- Balance tuning after real play: patience, cooking time, arrival speed, how hard each fish move is, bait prices now that bait is required.
- Menu vs. random fish (v4.1 item 4): bait now lets you aim for the fish your menu needs; a new game starts with fish in the tank.

## Open questions
- [ ] Is "no bait, no bite" too harsh on day 2+, when the menu needs a fish you have no bait for?
- [ ] Should a new game start with more decor (it starts plain now)?
- [ ] Does the Deep Trench need a bigger boat, or just the engine?
