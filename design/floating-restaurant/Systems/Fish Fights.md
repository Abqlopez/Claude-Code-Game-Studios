---
tags: [system, fishing, fights]
---
# Fish fights

## The core (since v2)
Line **tension** vs fish **stamina**. The fish alternates between RUNNING and TIRED.
- Reel while it is tired: you gain line (0.26/s ÷ fish stamina) and tension rises slowly (0.22/s).
- Reel while it runs: tension climbs fast (0.75/s x power) but it tires (0.22/s).
- Let go: tension drops (0.65/s); a running fish takes line back.
- Tension 1.0 = the line snaps. Distance 1.4 = it swims off. Heavy rod and harpoon take 75% of the tension.
- A special move fires every 4-7 s.

## v3 (2D) specials
blink, zap, dive, ink, phase, sparks, and a 3-round boss.

## v4 (3D): a move of its own for every fish (step 3)
| Fish | Move | What to do |
|---|---|---|
| [[Sardine]] | DART | It zig-zags. Ease off a little while it darts (tension builds 1.6x faster). |
| [[Mackerel]] | SURGE | Sudden sprints with almost no warning (0.25 s). Let go fast. |
| [[Flounder]] | SAND CLOUD | The tension needle hides. Watch the line shake: shaking means it is running. |
| [[Glowgill]] | BLINK | It vanishes. Stop reeling until it comes back. |
| [[Frostfin Cod]] | FREEZE | Ices your reel. Tap SPACE 6 times to crack it before 3 s are up. |
| [[Squid]] | INK + TENTACLE | Ink blobs cover the meters; a tentacle pull means let go. |
| [[Thunder Eel]] | ZAP | A charge bar fills for 1.4 s, then it zaps. Let go when the charge is full. |
| [[Ember Trout]] | HEAT | Reeling heats the line; rest before the heat bar fills or a strand burns through. |
| [[Moon Ray]] | GLIDE + FADE | Glides toward you: REEL fast (no tension). Also fades into the dark. |
| [[Ghost Shrimp]] | FADE + BLINK | Hard to see. Trust the line. |
| [[Bluefin Tuna]] | DEEP DIVE + SECOND WIND | Long runs; when it gets tired it recovers to 60% stamina once. |
| [[Swordfish]] | LEAP + SLASH | Leaps out: tap SPACE when the rings meet (perfect hook-set). Slash: let go. |
| [[Abyss Angler]] | LURE + FADE | Two lights in the dark: pick the one that pulses (left or right). |
| [[Bubble Puffer]] | PUFF + BLINK | Puffs up big and heavy (tension x3). Wait for it to shrink. |
| [[Coral Snapper]] | REEF RUN + DIVE | Rocks appear on one side: pull the other way. |
| [[Sunscale Dragon Koi]] | SPARKS | Copy each arrow; the patterns get longer as it tires (3 to 5). |
| [[Old Whiskers]] | 3 ROUNDS | Round 1 tail slams; round 2 adds a mud cloud; round 3 adds a wild thrash and deep dives. |

The fight panel shows the fish's **v3 artwork**, the move hint, a warning before each move, tension and stamina bars (plus a heat bar for the Ember Trout). Hold SPACE or the REEL button; a tap on REEL also counts as a SPACE tap on touch screens.

## v4.1: so no two fights feel the same
- **A mood for every bite** (shown on the fight screen). Chance by rarity: common / uncommon / rare / legendary / boss.

| Mood | What it does | Weight |
|---|---|---|
| Lazy | tires fast | 40 / 25 / 15 / 5 / 0 |
| Feisty | long runs, more tricks | 25 / 30 / 30 / 35 / 50 |
| Sneaky | fakes being tired | 20 / 25 / 30 / 30 / 30 |
| Strong | pulls hard, but it is a big one | 15 / 20 / 25 / 30 / 20 |

- **Pull against it.** When the fish runs, it runs LEFT or RIGHT (a red arrow shows which). Hold the other way (A / D, or ◀ Pull / Pull ▶) and tension builds only 45% as fast while it tires 1.6x faster. Pulling the same way makes tension 1.3x worse. So a run no longer just means "let go".
- **A late trick.** Below 50% stamina the fish learns one extra move from another fish (dart, surge, blink, leap, reef, dive or puff), different every time. Moves also come faster as it tires.
- **Landing it.** When it reaches the boat a timing bar appears: tap SPACE with the marker in the green to land it, in the gold for a clean catch. A miss lets it thrash back out to 0.4 and you bring it in again. The green zone is narrower and the marker faster for rarer fish.
- **Quick catch.** Once you have caught a common or uncommon fish 5 times, it skips the fight: just the timing bar. Miss and the fight starts.

![[m_leap.png]]
*Fight: Swordfish LEAP (tap when the rings meet)*
![[m_lure.png]]
*Fight: Abyss Angler LURE (pick the light that pulses)*
![[m_freeze.png]]
*Fight: Frostfin Cod FREEZE*
