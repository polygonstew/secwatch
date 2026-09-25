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
the deed with your name on it becomes **THE DEED** (anchor every lane).

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
  -> lose: FIGHT IT (retry the night)  or  WAKE UP (stay up all night):
           East Wall +2, next night you're tired (−1 Focus). The story keeps going.
```

Losing never ends the game. As the lore says: *you wake up. You always
wake up. The question is what comes back with you.*

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
  `damage damage_all drain heal recall ward ward_all swap draw energy expose silence purge`
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
days, tabs and reloads. `index.html` (Day 1) starts a fresh run, but the
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
