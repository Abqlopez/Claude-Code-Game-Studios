<!-- PROTOTYPE - NOT FOR PRODUCTION -->
# Floating Restaurant: style spike

**Hypothesis:** a low-poly toon look (faceted models, flat 3-tone shading, thick outlines, faceted sea) with tycoon-cartoon game feel (big-headed guests, order tickets, cash counter, coin bursts) reads better than the v4.1 look.

**How to run:** open `index.html` in a browser (it loads three.js r128 from cdnjs). Drag to orbit, scroll or pinch to zoom. Buttons toggle outlines and sunset.

**Status:** in progress (v6: every guest and the chef are our own, built in `guests.js` from Guests.md; Quaternius models are used only for props, food and fish).

**Findings:** none yet.

Version 3: real models from Quaternius (CC0 1.0, public domain): Pirate Kit, Sushi Restaurant Kit,
Cute Animated Monsters, Ultimate Animated Character Pack, Cute Fish Pack and Ultimate Food Pack.
They live in `models/` as glTF JSON with embedded data (artifacts cannot serve .glb). The boat hull,
sea, clouds and coins are still built in code. Models are recoloured in toon shading at load time
and get a screen-space ink outline, which also works on the animated characters.
