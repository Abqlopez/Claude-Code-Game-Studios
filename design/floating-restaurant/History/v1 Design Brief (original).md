---
tags: [history, v1]
---
> Copied from the original Claude Docs brief: https://claude.ai/artifact/TgCnuBGjt27TMsbHSHZ8NL
> Tables were flattened when exported; the doc itself has the clean version.



# Floating Restaurant – Version 1 Design Brief

 · 

## Overview

You run a restaurant on a boat. You fish by day, cook by night, and upgrade the boat so it can sail to new waters with new fish and new customers.
- Genre: cozy fishing + cooking management
- Platform: browser game (desktop first)
- Version 1 goal: one small, fun, complete loop. 1 area, 5 fish, 7 recipes, 3 customer roles, 3 species, a short upgrade path, and the ability to sail to a second area as the "you made it" moment.
- Rule for v1: if a feature isn't listed here, it waits for version 2.

## Core day loop

Every in-game day runs in four phases, then repeats.
- Morning – Fish (about 3 minutes real time): cast from the boat, catch fish, and store them in the fish tank.
- Afternoon – Prep: set tonight's menu from the fish you have, buy side ingredients, and spend money on upgrades or decor.
- Night – Serve (about 4 minutes): customers board, order from the menu, and you cook and serve them.
- End of day – Results: a summary shows money earned, tips, reviews, and which fish spoiled. Then the next day starts.

The key link: what you catch in the morning decides what you can cook at night, and what customers ask for tells you what to catch tomorrow.

## Fishing system

Casting: hold the button to charge a power bar, then release. More power means a farther cast, and farther water holds rarer fish.

Bite: after a random wait of 2–6 seconds, the bobber dips and a "!" appears. Press within 1 second or the fish escapes.

Reeling minigame: there's no generic reel bar. Every fish has its own personality, and you beat it by reading what it does. Sardines swim in schools, so you swipe to scoop several at once before the school scatters. Glowgill blink in and out of sight, so you reel only while they're glowing. Thunder Eels zap the line, so you let go during each zap or it snaps. Bluefin Tuna dive deep, so you pump the rod during their pauses. The Sunscale Dragon Koi breathes a pattern of sparks and you repeat it back, like Simon Says. The way you land a fish matters too: a clean catch gives a Perfect cut for cooking, and a rough fight bruises the fish, which lowers dish quality.

Live catch (the floating-restaurant twist): at night, some customers order "catch of the moment." You cast right off the dining deck while they watch. Their patience bar keeps draining, and a crowd meter fills if you pull off a flashy catch. A big catch in front of guests earns huge tips and boosts your reputation. Lose the fish and the whole deck groans. Fishing turns into dinner theater, which most fishing games never do.

Fish in v1:
| Fish | Type | Rarity | Where | Difficulty | Sell value
| Sardine | Real | Common | Near | Easy | $5
| Glowgill | Fantasy | Common | Near, glows at night | Easy | $8
| Thunder Eel | Fantasy | Uncommon | Mid | Medium | $15
| Bluefin Tuna | Real | Rare | Far | Hard | $30
| Sunscale Dragon Koi | Fantasy | Legendary | Far, 5% chance | Very hard | $100

Fish tank: holds 10 fish to start. Each fish has a freshness level: Fresh on day 1, OK on day 2, and Spoiled on day 3 (spoiled fish get thrown out).

## Cooking and menu system

The menu is the strategy. Each afternoon you choose up to 4 dishes for tonight's menu (6 slots after an upgrade). Customers can only order what's on it. A dish shows "sold out" when you run out of its fish.

Recipes in v1: 2 are known at the start. The rest unlock by buying them or by mixing ingredients in the kitchen to discover them.
| Dish | Ingredients | Cooking steps | Base price | Start
| Grilled Sardine | Sardine | Grill | $12 | Known
| Glowgill Tacos | Glowgill + tortilla | Chop, fry, plate | $18 | Known
| Kelp Wrap | Sea kelp + rice (no fish) | Chop, roll | $20 | Known
| Thunder Eel Soup | Thunder Eel + veggies | Chop, boil | $28 | Unlock
| Tuna Sushi | Bluefin Tuna + rice | Slice, roll, plate | $55 | Unlock
| Seafood Platter | Any 3 fish | Grill, fry, plate | $45 | Unlock
| Dragon Koi Feast | Sunscale Dragon Koi + rice + veggies | Slice, grill, boil, plate | $200 | Unlock

Cooking minigames (each takes 3–5 seconds):
- Chop: tap in rhythm with markers.
- Fry or grill: stop a moving needle in the green zone.
- Boil: wait, then pull the dish off at the right time.
- Slice or roll: trace a line.
- Plate: drag the food onto the plate.

Dish quality comes from fish freshness plus your minigame score: Perfect pays 1.5x, Good pays 1x, Burnt pays 0.5x and makes the customer unhappy.

Kitchen stations: you can only cook one dish at a time at first. Each extra station lets you cook another dish at once.

## Customers

Customers row up to the boat, sit down, and order from your menu. Each one has a patience bar. If it empties, they leave without paying and post a bad review.

Every customer has two parts: a role (how they order and pay) and a species (what they will eat, plus a quirk). Each part shows as its own icon over their head, so you can read a customer at a glance.

Roles:
| Role | How they order | Patience | Pays
| Sailor | Anything cheap and fast | High | Base price
| Foodie | Only Good or Perfect dishes, and leaves if the menu has under 3 items | Medium | 1.3x + big tip for Perfect
| Pirate | The most expensive dish they're willing to eat | Low | 2x, sometimes pays with a treasure map that unlocks a fishing spot

Species:
| Species | What they eat | Quirk
| Human | Trusts real fish, nervous about fantasy fish | Patience drops faster if the only options are fantasy dishes
| Mermaid | Won't eat any fish dish, only kelp dishes | Leaves angry and posts a bad review if served fish
| Sea King | Only fantasy fish dishes | Pays 1.5x on top of their role and is the only one who tips with rare bait

Example mixes: a Human Sailor wants a quick Grilled Sardine. A Mermaid Foodie wants a Perfect Kelp Wrap and tips big for it. A Sea King Pirate orders your priciest fantasy dish and might pay in treasure maps. 3 roles × 3 species gives 9 kinds of customer, and each night's mix is random.

Special requests: about 1 in 5 customers asks for a dish that isn't on the menu. If you add it to the menu tomorrow, they come back and pay double. This is what pushes you to keep updating the menu.

Real meets fantasy: because species decide what's edible, who's on the deck tonight changes what belongs on the menu. A menu with only real fish turns away Sea Kings, and a menu with no kelp dish loses every Mermaid.

Regulars: 2 named characters (for example, Old Gus, a Human Sailor, and Marina, a Mermaid Foodie) show up every few days. They have short lines of dialogue and favorite dishes. Serving their favorite raises a friendship meter, which unlocks a recipe as a reward.

Reputation: a 1–5 star rating made from reviews. More stars bring more customers each night.

## Boat, upgrades, and customization

The boat is both your fishing spot and your restaurant. You start with a small, worn-down boat that has 2 tables.

Upgrades (each has 2 levels in v1):
| Upgrade | Level 1 | Level 2 | What it does
| Fishing rod | $150 | $400 | Stronger line, slower fish zone, farther cast
| Bait | $50 each | — | Better odds of rare fish for one morning
| Fish tank | $200 | $500 | Holds 15, then 25, and keeps fish fresh 1 day longer
| Kitchen station | $250 | $600 | Cook 2, then 3 dishes at once
| Menu board | $300 | — | 6 menu slots instead of 4
| Tables | $100 | $250 | 4, then 6 tables
| Boat engine | $1,000 | — | Unlocks sailing to the second area

Customization: buy decor such as lanterns, plants, a sign, and table styles, and pick from 2 themes (Beach Shack and Pirate Ship). Each decor item adds a small bonus to customer patience.

Second area (end of v1): buying the engine lets you sail to Coral Bay. It has 2 new fish and 1 new species (Octofolk, who have eight arms and order 2 dishes at once). Reaching it is the win moment of version 1.

## Economy and progression

Aim for a player to reach Coral Bay in about 10–14 in-game days (around 1.5–2 hours of play).
- Starting money: $100
- Side ingredients (tortilla, rice, veggies) cost $2–$4 each from the afternoon shop.
- Selling raw fish is allowed but pays much less than cooking it, which pushes the player to cook.
- Customers per night: 4 at 1 star, rising to about 12 at 5 stars.
- A typical early night should earn $80–$150, so the first upgrade comes within 2 days.
- Save automatically at the end of each day.

All prices and numbers should live in one settings file so they're easy to tune after playtesting.

## UI, controls, art, and tech

Screens: Title, Fishing (side view of the boat and water), Prep (menu board, shop, upgrades, decor), Service (top-down view of the deck and kitchen), and End-of-day summary.

HUD: money, day number, time of day, star rating, and how many fish are in the tank.

Controls: mouse plus spacebar for everything. Click to select, and hold or release space for casting, reeling, and minigames.

Art style: bright, cozy pixel art or simple flat shapes. Placeholder shapes are fine for v1. Calm ocean music by day, warm lantern lighting at night.

Tech: HTML5 + JavaScript using Phaser 3, saving with localStorage. Keep fish, recipes, customers, and upgrades as data lists so new ones are easy to add.

Not in v1 (save for later): seasons, staff hiring, the garden, auto-catching nets, more areas past Coral Bay, multiplayer, and a story campaign.

## Prompt to paste into your coding tool

Paste this along with the whole brief above. Build in steps, and test each step before moving on.

# Versions 2–4: make it fun

V1 played well but felt bland. V2 fixes that by making you physically run the boat yourself, like Overcooked, and grow it into a tycoon business, like Roblox Restaurant Tycoon. It stays 2D (top-down) with much better art and feedback. Go 3D only after v2 is fun.

## Release plan

Everything below is split into three versions. Finish and playtest each one before starting the next.
| Version | Focus | Sections it covers
| v2 | Make the core fun | You run the place alone; Fun systems (juice and combo meter only); Fishing v2 (Home Waters fish only); Balanced money system; A restaurant that looks good
| v3 | Deeper restaurant | More customer interaction; More customers (new roles, plus Crabfolk and Sea Witch); Upgrades that are actually needed (except area gear); Customization; Fun systems (random events and daily goals); Hiring staff and growing the business
| v4 | New waters | Coral Bay, Storm Sea, Frozen North, and Sunken City, each with its fish, boss, species (Penguin, Ghost Sailor), theme, and the hull and gear upgrades needed to get there

Why this order: v2 decides whether the game is fun. If running the boat solo and fishing aren't fun, more customers and areas won't fix it.

## You run the place alone (at first)

You control a character who walks around the boat with WASD or arrow keys. Nothing happens unless you go do it.
- Greet and seat: walk to the dock ramp, greet the customer, and lead them to a table.
- Take orders: walk to the table and press E to see what they want.
- Cook: walk to the right station. Grab ingredients from the fish tank and pantry, carry them to the cutting board, then the grill, fryer, or pot. Food can burn if you leave it.
- Serve: pick up the plate and carry it to the right table. You can only carry 2 things at once.
- Clean: customers leave dirty plates. Bus them to the sink and wash them, or you run out of plates.
- Collect payment: walk to the table to take money and tips. A slow pay-up lowers your rating.
- Fish on the side: the rod sits on the edge of the deck. During slow moments at night, you can run over and cast for a Live Catch.

Shorter phases: morning fishing lasts about 90 seconds and night service about 3 minutes. Each night ramps up from calm to rush hour to winding down.

## More customer interaction
- Chat bubbles: customers talk while they wait ("Is the eel safe?", "Best kelp in the sea!"). Answer some questions with a quick 2-choice reply that changes their mood.
- Moods you can see: happy customers bounce and hum, while impatient ones tap the table, then wave at you, then stand up. Mermaids splash water when they're angry.
- Complaints and fixes: a wrong or burnt dish starts a complaint. Fix it fast with a free drink, a remade dish, or an apology to save the review.
- Troublemakers: a Pirate might try to leave without paying, so you chase them to the ramp. Sea Kings might demand a better table.
- Groups: families or crews of 2–4 arrive together, need a big table, and all want their food at the same time.
- Regulars with stories: Old Gus and Marina get short story moments as their friendship grows, and new regulars show up over time.

## Fun systems
- Juice: sound effects for every action, splashes, sizzling, coin pops, little screen shakes, and big "PERFECT!" text.
- Combo meter: serve dishes back to back without mistakes to build a combo that multiplies tips. One mistake resets it.
- Random events (1 per night, sometimes none): a storm tilts the deck so items slide around; a sea monster grabs a table; a rival food boat parks nearby and steals customers unless you're fast; a celebrity Sea King visits and wants perfection; a fish frenzy brings rare fish near the surface.
- Daily goals: 3 small goals each day, such as "Serve 3 Mermaids" or "Catch a Thunder Eel," with cash or decor as rewards.
- Better art: a real top-down art style with animated characters, water, and lighting in place of placeholder shapes.

## Hiring staff and growing the business

The early game is you doing everything and barely keeping up. Hiring is the reward that lets you grow.
| Staff | Takes over | Hire cost | Wage per night
| Host | Greeting, seating, collecting payment | $300 | $20
| Dishwasher | Busing and washing plates | $250 | $15
| Waiter | Taking orders and serving | $500 | $30
| Line Cook | Cooking one station on their own | $800 | $40
| Deckhand | Fishing every morning while you prep | $1,000 | $40
- Staff have stats (speed, skill, mood) that improve with training. Tired or underpaid staff slow down.
- Build out the boat, tycoon style: buy and place new sections (a second deck, a bar, a sushi counter, a VIP lounge, an aquarium wall). Each one adds seats, stations, or bonuses.
- Free placement: you choose where tables, stations, and decor go, so a smart layout saves walking time.
- Goals and milestones: reaching 5 stars, $10,000 earned, or every species served unlocks new areas, recipes, and boat sections.

## Fishing v2: harder and more fun
- Find the fish: fish aren't everywhere. Ripples, diving birds, glowing spots, and bubbles show where schools are. You steer the boat to them before they move.
- The fight: every fish has stamina, and you watch a line-tension meter. Reel when it tires, ease off when it runs, and dodge its special move. A fight is about 10–30 seconds, depending on the fish.
- Gear matters: pick the right tool for each fish. Light rod for small fish, heavy rod for big ones, a net for schools, crab traps you set and come back to, and a harpoon for giants. The wrong gear means a snapped line.
- Bait matching: each fish likes a certain bait (worms, shrimp, glow paste, gold flakes). Learning who likes what is part of the skill.
- Size and quality: each catch rolls a size (small, normal, big, trophy). Bigger fish feed more customers, and trophy fish can be mounted on the wall as decor.
- Fish journal: a collection book of every fish, its best size, where it lives, and its favorite bait. Filling it earns rewards.
- Boss fish: each area has one giant fish that takes a multi-stage fight with the harpoon. Beating it unlocks that area's legendary recipe.

More fish (19 fish plus 5 bosses):
| Area | Real fish | Fantasy fish | Boss
| Home Waters | Sardine, Bluefin Tuna, Crab (trap), Squid (inks your screen) | Glowgill, Thunder Eel, Ghost Shrimp (only visible at night), Sunscale Dragon Koi | Old Whiskers, a giant catfish
| Coral Bay | Coral Snapper, Parrotfish, Lobster (trap) | Bubble Puffer, Starjelly (stings if you reel too fast) | Coral Crown Turtle
| Storm Sea | Swordfish | Storm Eel (pulls harder when lightning strikes) | The Thunderwhale
| Frozen North | Ice Cod | Frostfin Narwhal (freezes your reel for 2 seconds) | Glacier Serpent
| Sunken City | Golden Lobster | Abyss Lantern (lures you into a fake bite) | The Drowned King

## More customers

Keep the role + species mix from v1, and add more of both.

New roles:
| Role | What they do
| Critic | Reviews you secretly. Their visit counts as 5 normal reviews, good or bad
| Royal | Orders a 3-course meal (starter, main, dessert) served in order
| Family | A group of 3–4 that needs a big table and all eats at once
| Influencer | If happy, brings a wave of extra customers the next night

New species (most unlock with new areas):
| Species | What they eat | Quirk
| Crabfolk | Anything cheap | Pays in shells you can trade for rare bait
| Sea Witch | Only dishes with a fantasy fish | Gives a random curse or blessing for the next day
| Penguin (Frozen North) | Only raw or cold dishes | Waddles slowly to the table
| Ghost Sailor (Sunken City) | Real fish only | Only appears at night and pays in old gold coins worth extra

That takes the game from 9 customer combos to 56.

## Balanced money system

V1 swung between too cheap and too expensive because prices were set one by one. V2 uses rules so every number fits together:
- Dish price = about 3x the cost of its ingredients. Raw fish sells for only 40% of what it earns as a dish, so cooking is always worth it.
- Each upgrade should pay for itself in 2–4 nights. If a $400 upgrade adds $50 a night, it's too expensive; cut the price or raise the effect.
- Each tier costs about 2x the last one, and nightly earnings should also grow about 2x per area, so it never feels grindy or too easy.
- Money sinks so cash stays useful: ingredients, staff wages, fuel to sail between areas, plate breakage, and boat repairs after storms.
- Prices scale by area: customers in later areas pay more, but their ingredients and wages cost more too.

Pacing targets (playtest against these):
| Milestone | Target day
| First upgrade | Day 2
| First hire | Day 4–5
| Sail to Coral Bay | Day 8–10
| Each later area | About 6–8 days after the last

Add an earnings screen each night showing income, costs, and profit, so the player can see where money goes.

## Upgrades that are actually needed

In v1 you could skip most upgrades. In v2 each one unlocks something you can't get otherwise:
- Rods and gear: big fish and bosses snap a basic rod every time. You need the heavy rod for Tuna and the harpoon for bosses.
- Stoves: recipes have heat levels. The Dragon Koi Feast needs a Dragon Grill, and Frozen North dishes need an ice box.
- Hull: you can't enter the Storm Sea without a reinforced hull, and you can't reach the Frozen North without an ice-breaker bow.
- Lights: night fishing for Ghost Shrimp and Glowgill needs deck lanterns.
- Fish tank: an insulated tank for Frozen North fish, and a giant tank to keep boss fish fresh.
- Seating and sections: groups and Royals need big tables and a VIP area, or they won't board.

## A restaurant that looks good
- Art direction: cozy, hand-painted top-down style with warm colors, soft shadows, and animated water.
- Living boat: lanterns sway, sails ripple, steam rises from pots, and seagulls land on the railing. Day turns to sunset, then to a lantern-lit night.
- Weather you can see: rain, fog, snow in the Frozen North, and a glowing ocean in the Sunken City.
- The boat changes as you grow: a patched-up raft at the start, then a proper boat, then a multi-deck floating palace. Every upgrade shows on the boat.

## Customization
- Build: floors, railings, walls, sails, roof, and the boat's paint colors.
- Furniture: table and chair sets, booths, bar stools, and a VIP lounge.
- Decor: lights, plants, rugs, aquarium walls, mounted trophy fish, and boss trophies.
- Your brand: name the restaurant, design the sign, and pick staff uniforms.
- Themes: Beach Shack, Pirate Ship, Coral Palace, Ice Lodge, and Ghost Ship. Each one unlocks with its area.
- Style score: decor raises a style rating, and certain species love certain styles (Mermaids love Coral Palace, Ghost Sailors love Ghost Ship). Matching your style to the crowd brings in more of them and makes them more patient.

## Prompts for v2, v3, and v4

Use one prompt at a time, and only move on once the last version works and feels fun.

v2 prompt:

v3 prompt:

v4 prompt:
