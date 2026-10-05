# THE NIGHT SHIFT — design notes

The card game that runs between SECWATCH days. It combines the
Nightmare Wood (bwp) with the SECWATCH card prototypes
(`remco.html`, `nightmares.html`, `nightmare.html`, `rem.html`).

Play it: `dream.html?night=1` (or 2, 3). It also comes up on its own
at the end of Day 2, Day 4 and Day 5.

---

## The pitch in one line

**What you dig up during the day becomes your deck at night, and
digging also makes the night worse.**

The days are an investigation (terminal, phone, tapes, records). The
nights are a lane deckbuilder. Everything you `type`, `play` or `dial`
during the day is logged by `SW.find()`. When you fall asleep, each
logged file that maps to a card comes with you: BADGE.LOG becomes
**DEAD BADGE**, TAPE_03 becomes **TAPE 03** (silences a Terror),
the deed with your name on it becomes **THE DEED** (claim every lane).

The same reading raises the threat bars (HARGROVE, LKCO, SYSTEM,
EAST WALL). The bars feed the nightmare:

| Bar | Effect at night |
|---|---|
| every 4 points in a bar | that bar's Terrors hit +1 |
| East Wall ÷ 2 | +HP on every Terror, −max Lucidity |
| East Wall ≥ 7 | OBSERVER LOGGED. The wall pulses for 1 unblockable damage every 3 turns |

So a player who reads everything has a strong deck against a
stronger nightmare, and one who reads nothing has a weak deck against a
quiet one. That's the Lovecraft bargain the lore is about: knowledge
protects you and exposes you at the same time.

## How a night plays

```
CASE FILE  ->  DESCENT MAP  ->  pick one node per depth  ->  ...  ->  last feed
 (bars,         FEED        fight, then pick 1 of 3 cards
  evidence,     STRONG      harder, more Clarity, pick 2
  threats)      TAPE DECK   heal, or erase a card permanently
                ARCHIVE     spend Clarity on cards
  -> win:  waking video (videos/night_N.mp4, optional) -> next day. East Wall −1
  -> lose: CLOSE YOUR EYES AGAIN (retry the night)  or  WAKE UP (stay up all night):
           East Wall +2, next night you're tired (−1 Focus). The story keeps going.
```

Losing never ends the game: *You wake up. You always wake up. Boots still
on, on top of the covers, the motel heater ticking.*

## The feed (battle)

This is bwp's table, reskinned so each lane is a camera feed.

- **3 lanes = 3 camera feeds** (CAM A/B/C). Terrors stand on bwp's stump podiums
  with a CRT tag and scanlines over them, because they're on camera.
- **Anchors** (bwp wards): absorb a Terror's attack in that lane first.
- **Focus** (the bwp candles): 3 per turn.
- **Lucidity** is your HP.
- **Intents cycle.** Each Terror has a `pattern`, and the badge shows its next move:
  - `attack n`: hits its lane
  - `guard n`: shield until its next action
  - `extend n`: its attacks get permanently stronger
  - `whisper n`: shuffles **STATIC** into your discard. STATIC is a dead card that costs 1 Focus to clear, so the thing gets in your head and clogs your deck.
  - `watch`: nothing. It's aware of you. (THE SHAPE watches, then hits for 7.)
- **Entity canvas** (from remco): the more HP you strip from a feed,
  the more of *it* shows in the background.

## Where each piece came from

| Piece | Source |
|---|---|
| Look: parchment cards, wax-seal costs, candles, stump podiums | bwp/lts (`css/dream.css` §1-3 is bwp's CSS as-is) |
| Lanes, wards, deck/draw/discard math, rewards, video interludes | bwp/lts `game.js` |
| Descent map, Clarity currency, rest nodes | `nightmares.html` |
| East Wall scaling Terror HP, entity canvas, per-night win/lose text, next-day routing | `remco.html` |
| "Stay up all night" on loss (`sw_tired`), JAM adaptive music, screen shake | `nightmare.html` + `JAMengine.js` |
| Terror roster (INTRUSION, WARMTH, SHAPE, WITNESS.TXT, RICKY, EARL...) | remco + nightmares |
| Evidence cards, intent patterns, STATIC, wall pulse | new |

The old prototypes are still in the folder, untouched apart from link
fixes, in case you want to pull more from them.

## Adding content (no code)

Everything is in `js/dreamData.js`:

- **A card**: add to `NS_CARDS` with an existing `effect`:
  `damage damage_all drain heal recall ward ward_all swap draw energy expose silence purge claim register`
  (`claim`: stake a lane, or every lane with target `'all'`; `register`: LET IT KNOW, claimed lanes only)
- **A reward**: add its id to `NS_REWARDS`.
- **An evidence card**: add the card, then map the day's filename to it in
  `NS_EVIDENCE` (`'FOO.TXT':'foo'`). The day just needs to call
  `SW.find('FOO.TXT')`, which `type`/`play`/`dial` already do on Days 1, 2 and 4, and
  which Day 3's records do too.
- **A Terror**: add to `NS_ENEMIES` with a `bar` and a `pattern`.
- **A night**: append to `NS_NIGHTS` and link a day's ending to
  `dream.html?night=N`.
- **Tuning**: `NS_CONFIG` (hand size, Focus, Lucidity, prices, penalties).

A new *effect* is one function in `EFFECTS` in `js/dreamEngine.js`, and a new
*intent* is one branch in `act()`.

## The shared save (`js/swState.js`)

The day pages used different keys (`sw_name` in localStorage,
`sw_player` in sessionStorage, East Wall in two places, and Day 1 never
saved its bars at all). `swState.js` keeps one save, `secwatch_save`,
and syncs the old keys both ways. That way every day page keeps working
unchanged, and the bars, name, evidence, deck and flags survive across
days, tabs and reloads. `day1.html` (Day 1) starts a fresh run, but the
wall remembers your name.

## Ideas for the next pass

- **Flags back into the days.** `SW.save.flags.night_1` is `'held'` or
  `'taken'`. Days could react: if taken, the Day 3 microfiche has one
  extra clipping, or Pellegrino says something different on Day 5.
- **Day 7 as a night.** Earl's twelfth descent as a final feed you can't win,
  only choose how long to hold before letting go. Badge #0088 status: ACTIVE.
- **Badge logins as starting relics.** Log in as 0047, 0088 or 1983 on
  Day 1 and get a passive for every night (0047: first hit each feed +3;
  0088: start each feed with a 3-anchor in the middle lane).
- **Days 8-9**: the lore's "other players" idea could show other
  saves' decks as a ghost opponent.

---

## Claims: the Night Shift as the arrangement

*Built 2026-10. Tests: the "NIGHT SHIFT: claims" block in tools/smoke_test.js.*

### The idea
The arrangement is two things: acknowledge that it exists, and let it know who holds the land so it understands where the human line is. So at night you don't beat it. You **acknowledge** it and **claim** the ground. When it reaches into a parcel you have claimed, the claim holds it, and whatever the claim holds counts as accounted for.

This fits who the 1994 player is. Day 3's deed names them: `GRANTEE: <name>`, recorded 11/03/1987. The Hargrove line has ended, and the land is in the player's name.

### Vocabulary (what the player sees)
| Was | Now | Notes |
|---|---|---|
| lane `CAM A1` | `CAM A1 · KELLY BRANCH` | Each night names its three parcels in a new `parcels` field on NS_NIGHTS. N1: KELLY BRANCH / LKCO-04 / CO. RD 15. N2: STAIRWELL / FLOOR 3 / SUITE 3-C. N3: 33 FT LINE / EAST BENCH / 78 FT. Without `parcels`, the label stays `CAM A1`. |
| HP `34 / 34` | `34 / 34 unaccounted` | The number is your ledger, not its health. At 0 the log reads `<name>: ACCOUNTED FOR. It withdraws.` instead of `SIGNAL LOST` (that message is logged in `hurt()`). |
| `⚔ 6` (attack) | `▸ reaches 6` | A claim or anchor in that lane takes it first. Anything left over costs Lucidity, because you are perceived. |
| `▣ guard 6` | `≈ unsurveyed 6` | Log: "the instruments won't settle." It still works as a shield, **except in a claimed lane**. |
| `↑ extend +1` | `↑ nearer +1` | Same rule as now. The word "extends" is kept for the East Wall pulse. |
| `≋ whisper ×1` | `≋ static ×1` | Log: "three slow beats." It cannot speak. |
| `◌ watching` | `◌ aware of you` | |
| card stat `DMG 5` | `ACCOUNT 5` | Same math. |
| empty slot `anchor` | `unclaimed` | A claim shows `⊕ claim 4` in Harold's orange. A keeper's claim shows its label, for example `#0088 10`. |
| depth 26/52/78/104/130 FT | always ends at **78 FT** | `Math.round((d+1) * 78 / map.length)`. 78 ft is canon: the anomaly sits 78 feet into the east wall. |
| retry "Fight it" | "Close your eyes again" | Matches the brief's "Close your eyes". |
| end eyebrow "the night keeps <name>" | "lucidity 0" | Removes a trailer line. |

"Terror" stays as the internal word and the word in this doc. Renaming it on screen to "feed" is optional later; it touches about 8 strings.

"Accounted for" is a deliberate echo of Day 8's VOICE.MP3 ("The land is accounted for. You are accounted for."). Use it only in the log and the HP label, not in flavor text, so the Day 8 line keeps its weight.

### How a claim works (two new effects, no new intents)
- **Stake.** Drag a lane claim onto a parcel's slot, or click an all-lanes claim. Claims behave like anchors: they last until used up, and a bigger one replaces a smaller one (the larger value wins; values don't add).
- **Registers.** When a Terror reaches into a claimed lane, the claim holds up to its value. Every point it holds also comes off that Terror's unaccounted total. Log: `THE WARMTH meets the line. 2 accounted for.` So a claim defends you and also settles the feed, but only when the Terror reaches. Something that only watches or guards never touches the line, so you still have to ACKNOWLEDGE it.
- **Paper backs the deed.** An ordinary anchor (DOCUMENT, FIRE DOOR, HARD HAT) played onto a claim keeps it a claim. On open ground an anchor only holds; it does not register.
- If a claim accounts for the last Terror during the Terrors' turn, the feed clears at the end of that turn. If your Lucidity also hit 0 on that turn, the loss wins.
- **LET IT KNOW** (reward card): on a lane where a claim stands, the Terror skips its next action and loses its `nearer` bonus. On open ground the card is refused and stays in your hand. The flavor is Earl's note after his tenth descent: "The way you register that a door is closed."

### Cards
Renamed (ids kept, so saves still work):
| id | Name | Cost | Effect | Text / flavor |
|---|---|---|---|---|
| deny | **ACKNOWLEDGE** (starter ×3) | 1 | account 5, one feed | "Say it is there." / "Time, camera, what you saw. Initial the log." |
| lookaway | **SWITCH CAMS** (starter) | 0 | move to the empty lane beside it | "Flip the switcher. Write down the time." |
| deed | THE DEED (Day 3 printer) | 2 | **claim 7, every lane**, exhaust | "GRANTOR: Hargrove Properties LLC. GRANTEE: you. Recorded 11/03/1987." |
| arrangement | THE ARRANGEMENT (Day 5 Y) | 3 | **claim 12, every lane**, exhaust | "Two families. Leave it alone. Let it know whose ground this is." |

New:
| id | Name | Cost | Effect | Unlock | Flavor |
|---|---|---|---|---|---|
| posted | POSTED | 1 | claim 4, lane | Starter: replaces one of the two DOCUMENTs | "POSTED. HARGROVE PROPERTIES. NO TRESPASSING." |
| deed_chain | DEED CHAIN | 1 | claim 5, lane | `DEED_CHAIN`: Day 3 already logs it, but no card is mapped to it | "Boundary accepted on the basis of prior deed description." (the 1887 survey note, verbatim) |
| hc_line | HAROLD'S PAINT | 1 | claim 6, lane | `HC_LINE`: E1M1 `paint` trigger | "Lessee shall not advance any heading east of the line marked by H. Combs." (the lease clause, verbatim) |
| spad | SURVEY SPAD | 0 | claim 3, lane | `SURVEY_SPAD`: E1M1 `compass` trigger | "You check your compass against the survey spad. The needle won't settle." (E1M1, verbatim) |
| seal_1962 | BLOCK, NOT POWDER | 2 | claim 10, lane, exhaust | `JOSEPH_NO1`: E1M2 already saves it | "You wall it up. Block, not powder. You don't shoot at it." |
| plat | TAX MAP 104 | 1 | claim 3, every lane | Reward pool | "Property Valuation, Letcher County. The east line is drawn in pencil." |
| white_oak | WHITE OAK CORNER | 2 | claim 8, lane | Reward pool | "Beginning at a white oak marked with three hacks, corner of the 1887 Hargrove grant." |
| let_it_know | LET IT KNOW | 1 | register (see above) | Reward pool | "Not magic. Just letting it know. The way you register that a door is closed." |

Other card changes:
- **Deck cap.** `NS_CONFIG.maxDeck` goes from 24 to **36**. A player who finds everything already has 29 cards (8 starters plus 21 evidence cards), and `deckList()` cuts from the end, so the cards found last are lost (Day 5's, including THE ARRANGEMENT).
- **Text fixes:** done (20 wording changes, no rule changes).

### Terrors
Rule: a Terror is something the entity does, a record, or a place. It is never a person from the lore, and never Earl's own equipment (Day 4: "Leave the system running").
- **earl → eastwall, THE EAST WALL.** HP 60 (raised from 34 after bot playtests: at 34 it was accounted for before Earl's line ran out or dawn came), boss styling, same pattern (aware, reaches 6, nearer +1, static 2, reaches 8). Flavor: "Where the rock stops and something else begins." (the bible's View One, Day 5).
- **threshold → PRIVATE MEETINGS** (id kept).
  - The pattern becomes guard 6, guard 6, **watch**. It never touches you, because their rituals did nothing. It soaks up your turns, and a claim in its lane cancels its guard ("the readings settle").
  - The flavor is Ruth Bingham's Day 3 quote, "A dozen cars some nights." plus the torchlight in the lower windows. Night 2 no longer gives away the Day 5-6 reveal.
- **ricky → UTILITIES CURRENT** (id kept). Same pattern. Flavor: "1407 Cornett Branch Road. No death certificate filed." Both lines come from the Day 3 missing persons index. Ricky's own voice stays on RICKY'S CHAT. (Turning the LKCO relay into a Terror was rejected because the relay is Earl's system, and the game tells you to leave it running.)
- **Unchanged:** intrusion, warmth, shape, badge47, phantom, cable, witness_t.

### Earl's night (Night 3, last feed)
- **The setup.** The wall stands in CAM B · EAST BENCH. Earl is **already holding that lane**: the feed opens with a claim of 10 labelled `#0088`, set by `claims:[0,10,0], keeper:'#0088'` on the map node. The idea already in this doc, "0088: start each feed with a 3-anchor in the middle lane", becomes his line.
- **How his line runs out** (East Wall bar 0-3, so no bar bonus).
  - The wall's first reach (6) meets his line, and 6 is accounted for.
  - On its fifth action (8 + 1 nearer) the line runs out: 4 accounted for, 5 reaches you.
  - The log says **"The line #0088 was holding is yours now."**
  - With a higher bar the timing is the same but more reaches you. After Day 5 the bar is 1 if you turned back and 10 if you didn't. At 10 the wall has HP 65 and +2 on every reach, and it pulses.
- **Earl is not fought.** He is not hit, beaten or saved. He holds the line until it passes to you. That plays out the bible's "The arrangement has technically lapsed... he is not the custodian in the functional sense" and Day 7's "The land needs a new custodian". It spoils nothing: Day 3 already shows Earl as STATUS: ACTIVE.
- **Dawn.** The node also carries `dawn:8`. If you are still standing at the end of turn 8, it withdraws. That gives two ways through: account for it, or hold until dawn. This is the "you can't win, only choose how long to hold" idea already in this doc.
- **Win text:** "Nothing was beaten. It came to a line it could read, and it withdrew its awareness to whatever it was attending to before it noticed you. / Cold air. January. The crack is gone. / The line held where someone had been standing."

### How claims carry
**Within a night.** Lanes reset every feed, as now. Two things open a feed with a claim already in place:
1. **Lines on file** (`save.flags.recorded`, 0-3). Every feed opens with a claim of that size on every lane.
2. **The 1962 seal.** If `SW.has('JOSEPH_NO1')`, CAM B opens every feed with a claim of 3 labelled `SEAL 4-7-62`.

When more than one applies to a lane, the larger value wins and its label goes with it.

**Across nights.**
- **Hold a night:** `recorded` +1 (max 3). As now: East Wall −1, `night_N:'held'`, tired cleared.
- **Lose and WAKE UP:** `recorded` = 0, because the arrangement lapsed. As now: East Wall +2, tired, `night_N:'taken'`.
- **Close your eyes again (retry):** the record is left alone.
- **The brief** adds the line "On record: every feed opens with a claim of N on each lane."

**Into and out of the days.**
- **In.** These use the existing `SW.find` → `NS_EVIDENCE` → card pipeline, unchanged:
  - Day 3: DEED_CHAIN and DEED.
  - Day 5: CUSTODIAN.
  - The mine: JOSEPH_NO1, HC_LINE and SURVEY_SPAD.
- **Out.** `night_N` and `recorded` are flags any day can read. Possible later hooks (none are in this build):
  - Day 3's deed chain gains a 1994 line when `recorded > 0`.
  - Day 8's VOICE.MP3 drops "You are accounted for." when `recorded === 0`.
  - Day 5 N sets `recorded` to 0.

**The 1962 mine.**
- **The save bug:** fixed. `SW.newRun()` (run on every load of day1.html) used to wipe JOSEPH_NO1. It now keeps `JOSEPH_NO1`, `HC_LINE`, `SURVEY_SPAD` and the `sealed_1962` flag, because 1962 happened before the shift.
- **E1M1 saves.** E1M1 gets two one-line `save` actions, one in its `paint` trigger and one in its `compass` trigger. The mine engine already supports `save:{evidence}`.

**Not in this build** (from the per-lane "calls" design): named north/east/south calls, the contested rule, an `encroach` intent, calls that carry across runs, a Night 4 chapter, and edits to Days 5, 6 and 8. They work, but they double the engine changes. Revisit them if the simple record feels too flat.

### Guns
None, as a weapon or otherwise.
- **Canon.** The entity is never fought, so nothing in the game is shot at. Harold's line at the drift mouth ("Block, not powder. You don't shoot at it.") is about blasting, not firearms, but it makes the same point, and BLOCK, NOT POWDER puts it in the deck as the strongest single-lane claim.
- **Period.** The 1994 player is a staffing-agency fill-in. The kit is a badge, a fob, a parking space and a printout. The 1962 watchman at the portal had a guard shack, a phone line and a logbook (PREQUEL epilogue). Canon mentions no gun.
- **If you ever want one on the table:** the only version that wouldn't break canon is a dead curse card, the shack's gun hanging unused (cost 1 to clear, does nothing). It would put a gun in the game that canon never mentions, so I recommend leaving it out.

### What stays the same
- **The structure:** evidence → cards, the threat bars, the map, rest and archive, and Clarity.
- **The East Wall bar and its pulse:** "THE WALL EXTENDS."
- **Lucidity:** it is dream lucidity, not a sanity meter.
- **Losing:** PERCEIVED, and you always wake up.
- **Card text:** INTRUSION, WARMTH, THE SHAPE, the TAPEs, COMBS.TXT, DOCUMENT ("Paper holds."), and "Same thing they all say."
- **Save shape:** every existing card id stays.

### Known risks
- **Balance.** Registering roughly doubles what a claim is worth. THE ARRANGEMENT (claim 12 on every lane) can account for up to 36 in one feed. The knobs are the claim values, a per-feed cap on registration, and the `dawn` turn.
- **Test coverage.** `tools/smoke_test.js` doesn't load dream.html today, so the build must add a case.
- **Visual skin (separate pass).** The "witch's grimoire" look (`--witchfire`, candle pips, `.seal-btn.witch`) and the red, lunging entity canvas still clash with the 1994 terminal frame and with CLAUDE.md.
- **Night 1 title.** "FIRST CONTACT" is a sci-fi stock phrase. It is also used in badges.js and the README, so changing it is left for a separate pass.
- **Day 3 continuity:** fixed. The missing persons index now says four workers in the Joseph No. 1 east heading.

<details><summary>Build plan (for whoever builds it)</summary>

```
STEP 0: text pass (no rule changes). DONE.
- Apply the 20 textEdits. Verified on scratch copies: every old string occurs exactly once, js/dreamData.js passes `node --check`, and NS_CONFIG/CARDS/STARTER/REWARDS/EVIDENCE/ENEMIES/NIGHTS are identical once name/desc/flavor/icon/win/lose/where are ignored.
- Comment and doc edits outside dreamData.js and dream.html:
  - js/dreamEngine.js:9 header comment: "FIGHT IT (retry night)" → "CLOSE YOUR EYES AGAIN (retry night)".
  - js/dreamEngine.js:648 showEnd: `'the night keeps ' + name.toLowerCase()` → `'lucidity 0'` (trailer line). The `name` variable then becomes unused, so remove it.
  - DESIGN_NIGHTSHIFT.md:47: same retry rename as the header.
  - DESIGN_NIGHTSHIFT.md:51-52: "As the lore says: ... what comes back with you." This line is not in the bible. Replace it with the new Night 1 lose line, without "As the lore says".
  - js/artManifest.js:94-95 art briefs:
    - threshold → title "TERROR: PRIVATE MEETINGS", draw "A dark office building at night, a dozen cars in the lot, torchlight in the lower windows".
    - earl → title "TERROR: THE EAST WALL", draw "Bare rock face at the bench, warm light with no source, nobody in frame".
- Leave the old prototypes alone (remco.html, nightmares.html).
- Run `python3 -m http.server 8765` and `NODE_PATH=$(npm root -g) node tools/smoke_test.js`, and expect ALL OK. Open dream.html?night=1..3 by hand.

STEP 1: js/dreamData.js (data only).
- NS_CONFIG.maxDeck: 24 → 36.
- NS_CARDS:
  - deed and arrangement: effect 'ward_all' → 'claim'. Keep target 'all'. desc "Claim N on every lane. Exhaust."
  - Add posted, deed_chain, hc_line, spad and seal_1962 (target 'lane', effect 'claim', kind 'evidence' except posted, which is 'basic').
  - Add plat (target 'all'), white_oak (target 'lane') and let_it_know (target 'enemy', effect 'register') as kind 'reward'.
  - Use the numbers and flavor in the proposal table. seal_1962's flavor contains an apostrophe, so use a double-quoted JS string.
- NS_STARTER: change one 'document' to 'posted'.
- NS_REWARDS: add 'plat', 'white_oak' and 'let_it_know'.
- NS_EVIDENCE: add 'DEED_CHAIN':'deed_chain', 'JOSEPH_NO1':'seal_1962', 'HC_LINE':'hc_line' and 'SURVEY_SPAD':'spad'.
  - Day 3 already calls SW.find('deed-chain'.replace(/-/g,'_')), which upper-cases to DEED_CHAIN.
  - e1m2.json:170 already saves JOSEPH_NO1.
- NS_ENEMIES:
  - threshold pattern → [['guard',6],['guard',6],['watch']].
  - Rename key earl → eastwall and keep the fields. Then update js/artManifest.js:95 hook 'TERRORS.earl' → 'TERRORS.eastwall'.
- NS_NIGHTS:
  - Add `parcels:[...]` to each night.
  - Night 3's last node → {type:'feed', enemies:['eastwall'], claims:[0,10,0], keeper:'#0088', dawn:8}.
  - Night 3 win → the proposal text.
- Header comments: document effect 'claim', effect 'register', the node fields claims/keeper/dawn, and the night field parcels.

STEP 2: js/dreamEngine.js. Every function named here already exists unless it is marked NEW.
- G.stats (line 46) and beginNight() (line 67): add `registered:0`.
- anchor(i,n) (line 350):
  - Change to `const prev = lane.ward || {}; lane.ward = { ...prev, value: Math.max(n, prev.value || 0) };`
  - This keeps the claim and `by` flags when a later DOCUMENT lands on a claim.
- NEW helper `stake(i, n, by)`:
  - Call anchor(i, n), then set `lane.ward.claim = true`.
  - If `by` is given and n >= the previous value, set `lane.ward.by = by`.
- NEW EFFECTS.claim(c, i):
  - If c.target === 'all', call stake on every lane and return true.
  - Otherwise, if the lane index is invalid, return false; else return stake(i, c.value).
- NEW EFFECTS.register(c, i):
  - If !needsEnemy(i), return false.
  - If the lane's ward is not a claim, floatText 'no claim on this line' on the enemy card and return false (the card stays in hand).
  - Otherwise set enemy.silenced = true and enemy.bonus = 0, log "<name> registers the line.", and return true.
- act() attack branch (line 441):
  - Before absorbing, note `wasClaim = lane.ward && lane.ward.claim` and `by = lane.ward && lane.ward.by`.
  - After the Lucidity damage: if wasClaim && absorbed > 0, add absorbed to G.stats.registered, log "<name> meets the line. N accounted for.", then call hurt(i, absorbed).
    - At this point e.exposed was zeroed at line 403 and e.shield at line 411, so the full amount lands.
    - hurt() may clear lane.enemy, which is safe because endTurn re-checks enemies each lane.
  - If `by` was set and lane.ward is now null, log "The line <by> was holding is yours now."
- act() guard branch: if the lane's ward is a claim, log "<name>: the readings settle on your claim." and set no shield. Otherwise set the shield and log "<name>: the instruments won't settle. ≈ n".
- endTurn() (line 399), after the existing `if(G.lucidity.cur <= 0) return nightLost();` (line 432):
  - If `!G.lanes.some(l => l.enemy)`, then `return checkClear();`.
  - Else if `G.node.dawn && G.turn >= G.node.dawn`: clear every lane.enemy, log 'Dawn. It withdraws.', `renderAll()`, then `return checkClear();`.
  - Because these run after the loss check, a loss on the same turn wins.
- hurt() (line 379): `SIGNAL LOST` → `ACCOUNTED FOR. It withdraws.`
- startFeed(node) (line 159), after the enemies are placed and before renderAll:
  1. `const rec = Math.min(3, save.flags.recorded || 0);` If rec > 0, call stake(i, rec) on every lane.
  2. If SW.has('JOSEPH_NO1'), call stake(1, 3, 'SEAL 4-7-62').
  3. If node.claims, call stake(i, node.claims[i], node.keeper) for every value > 0.
- nightWon() (line 584): `SW.flag('recorded', Math.min(3, (save.flags.recorded || 0) + 1));`
- wake() loss branch (line 626): `SW.flag('recorded', 0);`. The retry path (end-retry → beginNight) does not touch it.
- renderBrief() (line 70): push "On record: every feed opens with a claim of N on each lane." when recorded > 0, and "The 1962 seal holds CAM B." when SW.has('JOSEPH_NO1').
- Labels:
  - intentBadge (line 209):
    - '▸ reaches n', '≈ unsurveyed n', '↑ nearer +n', '≋ static ×n', '◌ aware of you'.
  - Status chip at line 234: ⚔ → ▸.
  - renderLanes (line 214):
    - cam label: `cam + (NIGHT.parcels ? ' · ' + NIGHT.parcels[i] : '')`.
    - hp-text: append ' unaccounted'.
    - ward slot: add class 'claim' when ward.claim. Text is `${ward.by || (ward.claim ? '⊕ claim' : '▣ anchor')} ${value}`. An empty slot shows 'unclaimed'.
  - statLabel (line 255): damage 'ACCOUNT n', drain 'ACCOUNT n · ½ BACK', claim c.target==='all' ? 'CLAIM ALL n' : 'CLAIM n', register 'LET IT KNOW'.
  - showEnd (line 656): 'Feeds Cut' → 'Accounted For'. 'Turns' → 'Held At The Line', showing G.stats.registered.
  - whisper log (line 467): "<name>: three slow beats. n STATIC in your discard."
  - brief (line 89): 'Terrors +N HP' → 'every feed takes +N more to account for'.
- Depth labels at lines 117 and 193 (shown as 156/232 in the old count): `Math.round((d+1) * 78 / NIGHT.map.length) + ' FT'`, using G.depth on line 193.

STEP 3: css/dream.css.
- Add `.ward-slot.claim{ border-color:#b8642a; color:#e09a5a; }` (Harold's orange).
- Optional: `.card` styling for claim cards.

STEP 4: js/swState.js newRun().
- `const kept = save.evidence.filter(id => /^(JOSEPH_NO1|HC_LINE|SURVEY_SPAD)$/.test(id)); Object.assign(save, BLANK(), { name, evidence: kept });`
- Update the header comment.
- Update index.html:381 ('NEW RUN. NAME KEPT. EVERYTHING ELSE CLEARED.') and index.html:388 (the confirm text) to say that 1962 mine evidence is kept.

STEP 5: levels/e1m1.json.
- Add `{"save":{"evidence":"HC_LINE"}}` to the 'paint' trigger (line 86) and `{"save":{"evidence":"SURVEY_SPAD"}}` to the 'compass' trigger (line 89), one action per line. mineEngine.js:295-300 already handles `save.evidence`.
- Re-save the level through control.html so MineLevel.stringify formats it, and check it with MineLevel.validate.

STEP 6: DESIGN_NIGHTSHIFT.md.
- Append the proposal as a "Claims" section.
- Add 'claim' and 'register' to the effect list.
- Update the intent descriptions.
- Mark the "Day 7 as a night" idea (line 121) and the 0088 relic idea (line 125) as folded into Night 3.

STEP 7: tests in tools/smoke_test.js. Add a new block "NIGHT SHIFT: claims" using the same page()/ok() helpers. Top-level consts in the dream scripts (G, NIGHT, EFFECTS, startFeed) can be reached from page.evaluate.
a) Static checks, in page.evaluate on dream.html?night=1:
   - every id in NS_STARTER and NS_REWARDS, and every value in NS_EVIDENCE, exists in NS_CARDS;
   - every enemy id in every NS_NIGHTS map exists in NS_ENEMIES;
   - every card effect is a key of EFFECTS.
b) Mine carry-over:
   - Go to index.html. Evaluate SW.find('JOSEPH_NO1') and then SW.newRun().
   - ok SW.has('JOSEPH_NO1').
   - Go to dream.html?night=1, click #brief-go, then click the first '.node.avail'.
   - ok G.lanes[1].ward.claim && G.lanes[1].ward.value >= 3 && G.lanes[1].ward.by === 'SEAL 4-7-62'.
c) Registration:
   - Put a {value:6, claim:true} ward in the lane of an enemy whose intentOf() is 'attack'.
   - Record its hp, then await endTurn().
   - ok hp dropped by min(6, attack) and G.stats.registered > 0.
d) Guard cancel:
   - Put a claim under PRIVATE MEETINGS (threshold) on its guard turn and await endTurn().
   - ok enemy.shield === 0.
e) Earl's night:
   - Go to dream.html?night=3 and call SW.setBars({e:0}).
   - Start the last node: `startFeed(NIGHT.map[NIGHT.map.length-1][0])`.
   - ok G.lanes[1].ward.by === '#0088' && G.lanes[1].ward.value === 10.
   - Loop endTurn() until the ward is null, and check the #log text contains 'yours now'.
   - Set G.turn = 8, await endTurn(), and ok the lanes are empty (dawn).
f) Record:
   - After the night 3 dawn clear, ok SW.save.flags.recorded >= 1.
   - Then show the end in 'loss', call wake() with location.href stubbed, and ok recorded === 0.
g) ok(!errs.length).
- Run `python3 -m http.server 8765` and `NODE_PATH=$(npm root -g) node tools/smoke_test.js`, and expect ALL OK.
- Play nights 1-3 once by hand for balance: THE ARRANGEMENT plus registration, the dawn:8 length, and Night 3 at East Wall 1 and at 10.
```

</details>
