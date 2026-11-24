// PROTOTYPE - NOT FOR PRODUCTION
// Question: Is a 10-wave battle fun when the towers are people and the main tower is your own hero?
// Date: 2026-11-24
// Every tuning value lives here, each with value, min, max and step. The game reads them live
// through tune.<name> (index.html); the tweak panel, an add-on, writes them back here.
window.CONFIG = {
  seed: 1, // every gameplay random call reads rng(), seeded from this (or ?seed= in the address)
  volume: { value: 0.5, min: 0, max: 1, step: 0.05 },

  // Economy (gold) — from the doc
  start_gold: { value: 300, min: 0, max: 1000, step: 10 },
  gate_hp: { value: 100, min: 10, max: 300, step: 5 },
  cost_archer: { value: 150, min: 50, max: 400, step: 5 },
  cost_shield: { value: 200, min: 50, max: 400, step: 5 },
  cost_support: { value: 175, min: 50, max: 400, step: 5 },
  bounty_walker: { value: 5, min: 0, max: 30, step: 1 },
  bounty_swarm: { value: 2, min: 0, max: 30, step: 1 },
  bounty_burrower: { value: 15, min: 0, max: 60, step: 1 },
  bounty_alpha: { value: 100, min: 0, max: 300, step: 5 },
  wave_clear_base: { value: 50, min: 0, max: 200, step: 5 },
  wave_clear_per_wave: { value: 10, min: 0, max: 50, step: 1 },
  villager_gold: { value: 25, min: 0, max: 100, step: 5 },
  sell_refund: { value: 0.7, min: 0, max: 1, step: 0.05 },
  upgrade_t1: { value: 90, min: 10, max: 500, step: 5 },
  upgrade_t2: { value: 140, min: 10, max: 500, step: 5 },
  upgrade_t3: { value: 220, min: 10, max: 800, step: 5 },
  upgrade_t4: { value: 350, min: 10, max: 1000, step: 5 },

  // Gate damage by size — from the doc (Alpha's is guessed)
  gate_dmg_walker: { value: 2, min: 0, max: 20, step: 1 },
  gate_dmg_swarm: { value: 1, min: 0, max: 20, step: 1 },
  gate_dmg_burrower: { value: 5, min: 0, max: 30, step: 1 },
  gate_dmg_alpha: { value: 40, min: 0, max: 100, step: 5 },

  // Hero (MC). Guessed starting values; px = logical pixels on a 1280x720 field
  mc_hp: { value: 240, min: 50, max: 600, step: 10 },
  mc_range: { value: 175, min: 80, max: 320, step: 5 },       // px
  mc_damage: { value: 8, min: 1, max: 40, step: 1 },
  mc_rate: { value: 1.2, min: 0.2, max: 4, step: 0.1 },       // shots per second
  mc_down_time: { value: 12, min: 10, max: 15, step: 0.5 },    // seconds, doc: 10 to 15
  strike_radius: { value: 120, min: 40, max: 250, step: 5 },  // px
  strike_damage: { value: 35, min: 5, max: 150, step: 5 },
  strike_knockback: { value: 70, min: 0, max: 200, step: 5 }, // px back along the road
  strike_cooldown: { value: 14, min: 2, max: 40, step: 1 },   // seconds
  mc_xp_level: { value: 30, min: 5, max: 200, step: 5 },      // xp per battle level; xp = bounty
  mc_level_bonus: { value: 0.08, min: 0, max: 0.3, step: 0.01 }, // + damage and rate per level
  mc_max_level: { value: 10, min: 1, max: 20, step: 1 },

  // Companions
  companion_down_time: { value: 15, min: 3, max: 40, step: 1 }, // seconds downed before getting up
  archer_hp: { value: 70, min: 10, max: 300, step: 5 },
  archer_range: { value: 190, min: 80, max: 350, step: 5 },
  archer_damage: { value: 9, min: 1, max: 50, step: 1 },
  archer_rate: { value: 1.0, min: 0.2, max: 4, step: 0.1 },
  shield_hp: { value: 170, min: 20, max: 500, step: 10 },
  shield_range: { value: 48, min: 20, max: 120, step: 2 },
  shield_damage: { value: 6, min: 1, max: 40, step: 1 },
  shield_rate: { value: 1.0, min: 0.2, max: 4, step: 0.1 },
  shield_block: { value: 2, min: 1, max: 6, step: 1 },        // enemies held at once
  support_hp: { value: 80, min: 10, max: 300, step: 5 },
  support_range: { value: 135, min: 50, max: 300, step: 5 },
  support_heal: { value: 10, min: 1, max: 60, step: 1 },
  support_rate: { value: 0.5, min: 0.1, max: 3, step: 0.05 }, // heals per second
  high_ground_range: { value: 0.25, min: 0, max: 1, step: 0.05 }, // + range on a hill

  // Enemies
  enemy_hp_growth: { value: 0.12, min: 0, max: 0.5, step: 0.01 }, // + HP per wave after the first
  walker_hp: { value: 45, min: 5, max: 300, step: 5 },
  walker_speed: { value: 42, min: 10, max: 150, step: 2 },   // px per second
  walker_dps: { value: 8, min: 0, max: 50, step: 1 },        // damage per second to a blocker
  swarm_hp: { value: 9, min: 1, max: 60, step: 1 },
  swarm_speed: { value: 95, min: 20, max: 250, step: 5 },
  swarm_gather: { value: 1.6, min: 0, max: 5, step: 0.1 },   // tell: seconds the group waits at the entry
  burrower_hp: { value: 110, min: 10, max: 500, step: 5 },
  burrower_speed: { value: 40, min: 10, max: 150, step: 2 },
  burrower_dps: { value: 14, min: 0, max: 60, step: 1 },
  burrower_tell: { value: 2.5, min: 2, max: 3, step: 0.1 },   // seconds of rumble, doc: 2 to 3
  burrower_attack_time: { value: 4, min: 1, max: 10, step: 0.5 },
  alpha_hp: { value: 1700, min: 200, max: 6000, step: 50 },
  alpha_speed: { value: 22, min: 5, max: 80, step: 1 },
  alpha_slam_damage: { value: 60, min: 0, max: 300, step: 5 },
  alpha_slam_radius: { value: 100, min: 30, max: 250, step: 5 },
  alpha_slam_windup: { value: 1.4, min: 0.3, max: 4, step: 0.1 },  // the tell
  alpha_slam_every: { value: 5, min: 1, max: 15, step: 0.5 },
  mud_slow: { value: 0.45, min: 0, max: 0.9, step: 0.05 },   // share of speed lost in mud
  villager_speed: { value: 34, min: 10, max: 100, step: 2 },
  villagers_per_wave: { value: 4, min: 0, max: 12, step: 1 },

  // Waves: groups of { kind, count, gap (s between spawns), delay (s after wave start) }.
  // Villager waves set villagers: true. Not sliders.
  waves: [
    { groups: [{ kind: 'walker', count: 6, gap: 1.7, delay: 0 }] },
    { groups: [{ kind: 'walker', count: 9, gap: 1.3, delay: 0 }] },
    { villagers: true, groups: [{ kind: 'walker', count: 12, gap: 1.1, delay: 0 }] },
    { groups: [{ kind: 'swarm', count: 10, delay: 0 }, { kind: 'swarm', count: 10, delay: 9 }] },
    { groups: [{ kind: 'walker', count: 8, gap: 1.4, delay: 0 }, { kind: 'swarm', count: 10, delay: 6 }] },
    { villagers: true, groups: [{ kind: 'walker', count: 10, gap: 1.2, delay: 0 }, { kind: 'swarm', count: 10, delay: 4 }, { kind: 'swarm', count: 12, delay: 12 }] },
    { groups: [{ kind: 'walker', count: 8, gap: 1.5, delay: 0 }, { kind: 'burrower', count: 2, gap: 8, delay: 4 }] },
    { groups: [{ kind: 'walker', count: 12, gap: 1.1, delay: 0 }, { kind: 'swarm', count: 10, delay: 5 }, { kind: 'burrower', count: 2, gap: 6, delay: 8 }, { kind: 'swarm', count: 12, delay: 15 }] },
    { villagers: true, groups: [{ kind: 'walker', count: 14, gap: 1.0, delay: 0 }, { kind: 'swarm', count: 12, delay: 4 }, { kind: 'burrower', count: 3, gap: 5, delay: 7 }, { kind: 'swarm', count: 12, delay: 14 }, { kind: 'swarm', count: 10, delay: 20 }] },
    { groups: [{ kind: 'walker', count: 8, gap: 1.4, delay: 0 }, { kind: 'alpha', count: 1, delay: 6 }, { kind: 'swarm', count: 10, delay: 12 }, { kind: 'burrower', count: 2, gap: 6, delay: 16 }] },
  ],
};
