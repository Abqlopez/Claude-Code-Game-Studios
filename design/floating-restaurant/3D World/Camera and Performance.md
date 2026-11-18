---
tags: [3d, v4, tech]
---
# Camera and performance
- **Camera:** angled top-down (like Overcooked / Animal Crossing), follows the chef; higher and further back while fishing. 6 zoom steps (0.35x-1.5x distance), remembered between visits.
- **Performance fixes:** 3 real lights (dining, kitchen, cabin); every other light is a cheap glow sprite. Waves are moved on the graphics card. Tiny objects do not cast shadows; shadow maps 1024. Static objects skip per-frame matrix updates. Pixel ratio capped at 1.5x.
- **Auto quality:** if the frame rate stays under 40 for 2 s, drop to 1x resolution, then turn shadows off.
