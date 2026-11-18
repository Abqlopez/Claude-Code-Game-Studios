---
tags: [tech]
---
# How it was tested
- Headless Chromium (Playwright, software WebGL) loads the real files; Three.js and Phaser came from npm for testing only.
- A test speed-up (`FR3D.timeScale`) only the tests use, because software rendering runs at ~2 frames a second.
- **Full-day robot:** title → wake → waters → catch 2 fish → afternoon → prep (every tab) → opening → a robot chef runs the whole night → closing → results → bed, for 2-3 days; day 2+ with Host, Dishwasher and Line Cook working alone.
- **Real-controls test:** E at the pantry, number keys to grab, E at the board, HOLD SPACE to chop, plate, serve; HOLD to load the grill, take it off at Perfect.
- **Fight test:** all 15 fight moves forced one by one and screenshotted.
- Checks for: no page errors, the night always ends, the chef can walk after each scene, seated guests face their table (measured).
