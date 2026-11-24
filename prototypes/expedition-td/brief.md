# Game Brief: Expedition TD

## In your words
From the doc "Expedition Tower Defense — Game Design Doc" (Alpha v1 parts, word for word):

A tower defense game where the towers are people you meet on an adventure, and the main tower is your own customizable hero.
- Visuals: 2.5D, 3D-looking environments, fixed camera.
- MC in battle: Free, and always placed first. A build must change what the player does, not just numbers: active abilities, where the MC stands, and stances. Levels up a little during each battle from kills (like Bloons heroes). These levels reset after the battle. Cannot die in battle. If downed, the MC is out for 10 to 15 seconds, then gets back up.
- Companions have HP and enemies can attack them.
- Every smart behavior has a tell (ground rumbling, a shadow overhead). Players lose because they missed the sign, never because there wasn't one.
- Placement: Free placement anywhere that makes sense. Blocked only in obvious places: deep water, cliffs, inside buildings. While placing, show range and terrain bonuses (e.g. "+range: high ground").
- First build: Build one small, fun battle first with placeholder shapes, then grow it. 1 map: a small village with 1 entry point. The MC with a basic attack and 1 ability. 3 companions: Archer, Shield Fighter, Support. 4 enemy types: Walker, Swarm, Burrower, Alpha (boss). 10 waves.
- Win and lose: Protect the village gate (100 HP). Win by surviving all 10 waves; lose when the gate falls. Gate damage: Walker 2, Swarm 1, Burrower 5. Bonus objective: villagers flee along a path in some waves; saving them pays 25 each.
- Economy: start 300, MC free, Archer 150, Shield Fighter 200, Support 175, kills 5/2/15, wave clear 50 + 10 × wave, selling refunds 70%.
- Upgrades: 2 paths × 4 tiers per companion; tier 4 in one path, only tier 2 in the other. Archer: Rapid / Precision. Shield Fighter: Wall / Bash. Support: Healing / Inspire.
- MC: medium-range basic attack, weapon and armor, 1 ability: an area strike that damages and knocks back. Tougher than any companion.
- Enemies: Walker slow, medium HP, attacks whatever blocks it. Swarm groups of 8 to 12, fast, fragile, ignores companions; tell: visible group at the entry. Burrower surfaces near the back line, attacks companions, then heads for the gate; tell: ground rumbles and cracks for 2 to 3 seconds. Alpha: huge walker that slams groups of companions; tell: wind-up before each slam.
- Waves: 1-3 Walkers; 4 Swarm; 5-6 mixed; 7 Burrower; 8-9 everything; 10 the Alpha.
- Done when: a full 10-wave battle is fun with just shapes.

**Pitch:** Defend a village gate with the people you met on the road, around a hero you built yourself.
**Genre:** tower defense
**Controls:** mouse to aim and click; 1 hero / 2 Archer / 3 Shield / 4 Support to pick, click or Enter to place; click a unit, then U / I upgrade path A / B, X sell; Q hero strike; Space next wave; F speed; P pause; M mute.
**Question:** Is a 10-wave battle fun when the towers are people and the main tower is your own hero?
**Hooks:** towers are people with HP who get downed; the hero is the main tower, free and placed first; smart creatures with readable tells.

## Look and references
- Look: 2.5D painted-flat village on a green valley, fixed camera at a three-quarter angle; figures stand up off the ground with soft shadows, sorted by depth; simple shapes as placeholders but each figure its own silhouette.
- References: Bloons TD 6 (hero levels from kills, two-path upgrade cap).
- View: 2.5D · Camera: fixed three-quarter top-down.

## First minute
Hero ghost follows the mouse; place it free. Buy an Archer with the starting gold, see "+range: high ground" on the hill. Space starts wave 1: walkers come down the road and stop at whoever blocks them.

## Challenge
Wave 4 swarm rushes past blockers; wave 7 burrowers surface behind the line after a rumble; wave 10 Alpha slams clumps. Gate at 0 is a loss.

## Core loop
- Place and upgrade people between waves → survive the wave → earn gold → spend on the next threat.

## Goal & fail state
Survive 10 waves. Gate HP 0 = loss.

## Features
- Hero placed first and free, basic attack, Q area strike with knockback, levels from kills, downed 12 s not dead.
- Archer, Shield Fighter, Support with 2 × 4 upgrade paths and the 4 / 2 cap.
- Walker, Swarm, Burrower, Alpha with tells.
- 10 waves, gold economy, selling, win and lose.
- Free placement blocked by water, cliffs, buildings; range and terrain bonus while placing.
- Villager bonus objective.

## Out of scope
Campaign, node map, bonds, permanent gear, more maps, flyers, line of sight, co-op.

## Build order
1. The full 10-wave battle.
