# Image manifest & art direction

Generator: **Nodal MCP · Nano Banana 2 – Lite** (photographs). Use **GPT Image** only for assets that need transparency (none are required in v1). Save every file to `assets/img/` **with the exact filename below**. The page picks it up automatically, and until then a warm salt-gradient placeholder labelled with the filename is shown.

## Art direction (applies to every prompt)
- **Genre:** organic wellness editorial with a documentary feel. Quiet, intimate, unposed. It must not read as a spa stock photo.
- **World:** a Himalayan salt cave. Pink and amber salt-brick walls, backlit, with fine white salt covering the floor like sand, zero-gravity recliners in natural oak and oatmeal linen, and a faint visible haze of dry salt aerosol in the light.
- **Light:** low-key, warm 2700K glow coming *from* the salt walls, soft falloff and deep but clean shadows. No harsh flash and no neon.
- **People:** real-looking adults aged 28–65 and children aged 3–10 of diverse ethnicities. Natural skin texture, no retouching gloss, relaxed or eyes-closed expressions, no smiling at the camera. Clothing in undyed cotton and linen (oatmeal, ecru, stone, soft grey), with white cotton socks inside the cave. No logos, jewelry kept minimal.
- **Camera:** 35mm or 50mm feel, f/2–f/2.8 shallow depth, eye-level or slightly lower, generous negative space where text will sit.
- **Grade:** warm highlights (amber, peach), slightly lifted blacks, low saturation in the shadows, fine film grain. The UI around the images is cool navy, so keep the images warm for contrast.
- **Never:** text, logos, watermarks, UI, candles on fire near salt, exaggerated poses, plastic skin, extra fingers, or any medical or hospital props.

## Slots
| File | Ratio | Section · purpose | Prompt |
|---|---|---|---|
| `hero.jpg` | **21:9 (2520×1080)** | Hero, full-bleed. Text sits bottom-left, so keep the **left 45% and the bottom calm and dark**. Subject at about 68% from the left (the mobile crop keeps the center-right) | Ultra-wide 21:9 cinematic photograph inside a Himalayan salt cave: a woman in her 40s reclines on an oak zero-gravity lounger on the right of the frame, eyes closed, oatmeal linen blanket and white cotton socks, backlit pink-amber salt brick wall glowing behind her, fine white salt floor, delicate visible salt haze in the warm light, deep soft shadows on the left side, 35mm, f/2.8, editorial wellness documentary style, warm film grade, photorealistic, no text |
| `benefit-respiratory.jpg` | 4:5 (1200×1500) | Benefits › Respiratorio | Close profile portrait of a man in his 50s with a grey-flecked beard taking a slow deep breath through his nose, eyes closed, inside a salt cave, amber backlight from salt bricks catching floating salt particles, soft rim light on his face, ecru linen shirt, 50mm f/2, intimate documentary, photorealistic natural skin |
| `benefit-skin.jpg` | 4:5 | Benefits › Piel | Macro detail of a forearm resting on rough pink Himalayan salt crystals, natural skin texture with fine hairs, warm side light from backlit salt, shallow depth of field, a few fine salt grains on the skin, tactile and calm, editorial beauty-documentary, photorealistic |
| `benefit-stress.jpg` | 4:5 | Benefits › Estrés | Woman in her 30s lying under an oatmeal linen blanket on a reclined lounger, seen from a slightly high angle, eyes closed, hands resting on her chest, the salt wall behind lit with a very soft lavender-to-amber chromotherapy gradient, quiet stillness, 35mm f/2.8, low-key, photorealistic |
| `benefit-kids.jpg` | 4:5 | Benefits › Niños | Two children aged 4 and 7 kneeling on fine white salt floor inside a salt cave, filling small wooden buckets with wooden shovels, absorbed in play, seen at their eye level, warm backlit salt walls, soft haze, an adult's legs in linen trousers and white socks partly visible at the edge, candid documentary, photorealistic |
| `breath-cave.jpg` | 21:9 (2400×1030) | Breathing section A, full-bleed, almost no text | Empty salt cave interior at dusk, symmetrical wide shot, row of oak loungers with folded linen blankets, glowing pink-amber salt brick walls and ceiling stalactites of salt, fine salt haze catching beams of warm light, cinematic, atmospheric, deep shadows, anamorphic feel, photorealistic, no people |
| `how-arrival.jpg` | 4:5 and 16:10 crop | How it works › 01 | Close-up of feet in clean white cotton socks stepping onto fine white salt floor at the entrance of a salt cave, ankles in oatmeal linen trousers, warm light spilling from inside, shallow depth, calm and inviting, photorealistic |
| `how-halogenerator.jpg` | 4:5 and 16:10 | How it works › 02 | Macro shot of a discreet brushed stainless steel wall vent releasing a fine dry salt aerosol mist, mist backlit by amber light against a pink salt brick wall, particles visible, no branding, technical yet serene, photorealistic |
| `how-session.jpg` | 4:5 and 16:10 | How it works › 03 and booking summary | Three adults of different ages resting on oak loungers inside a softly lit salt cave, wrapped in linen blankets, eyes closed, one reading nothing, phones absent, calm group atmosphere, warm haze, 35mm, documentary wellness, photorealistic |
| `how-ambient.jpg` | 4:5 and 16:10 | How it works › 04 | Straight-on texture of a backlit Himalayan salt brick wall, gradient from deep amber to pale peach, irregular mortar lines, subtle salt crust, abstract and clean, ideal as background, photorealistic macro architecture |
| `g-cave-wide.jpg` | 2:1 | Gallery · Sala | Wide view of the main salt cave room with loungers and a person resting in the far corner, salt stalactites, warm glow, editorial interior photography |
| `g-salt-wall.jpg` | 1:2 | Gallery · Texturas | Vertical detail of a pink salt brick column backlit, crystalline translucency, deep amber core, abstract texture |
| `g-kids-play.jpg` | 1:1 | Gallery · Niños | Little girl aged 5 pouring salt from a wooden bucket, salt grains falling in warm backlight, candid, top-down three-quarter angle |
| `g-lounge.jpg` | 1:1 | Gallery · Sala | Still life of an empty oak lounger with a folded oatmeal linen blanket on a salt floor, soft amber light, minimal |
| `g-crystal-macro.jpg` | 1:1 | Gallery · Texturas | Macro of a single translucent salt crystal held between fingertips against warm light, refraction and inclusions visible |
| `g-parent-child.jpg` | 1:2 | Gallery · Niños | Mother and son aged 6 reclined together under one linen blanket inside the salt cave, his head on her shoulder, both eyes closed, warm haze, tender and unposed |
| `g-lamp.jpg` | 1:1 | Gallery · Texturas | Natural Himalayan salt lamp glowing on a ledge of salt bricks, shallow depth, bokeh of other warm lights behind |
| `g-chromo.jpg` | 2:1 | Gallery · Sala | Salt cave room with gentle chromotherapy lighting shifting from amber to soft lilac across the walls, two people resting, dreamy but realistic |
| `og.jpg` | 1200×630 | Social share | Same scene as hero, centered composition, room for nothing else |

## Video (not available from Nano Banana)
`hero.mp4` (optional, 8–12 s loop, 1920×1080, under 4 MB). It would show a slow push-in on the hero scene with drifting salt haze. To enable it, replace the hero `<img>` with `<video autoplay muted loop playsinline poster="assets/img/hero.jpg">`.
