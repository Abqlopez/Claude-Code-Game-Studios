---
tags: [system, tech]
---
# Saving
- The game saves to the browser (localStorage key `floating-restaurant-save-v1`) after each night and after purchases.
- Each artifact has its own storage, so the 2D and 3D games keep separate saves; a save lives only in that browser on that device.
- Old saves are migrated forward (v1 → v2 → v3 fields, missing sides filled in v3.1).
- 3D title screen: **Continue (Day N, $money)** appears once you have progress; **New game** asks you to tap twice before erasing a save.
