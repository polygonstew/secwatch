/* ════════════════════════════════════════════════════════
   SECWATCH  --  badge registry  (js/badges.js)

   Type one of these at the dashboard login (index.html), or at
   its command line, to jump straight into that part of the game.
   Any other badge number just logs you in as yourself.

   Add a row to add a shortcut. `go` is a page (relative URL).
════════════════════════════════════════════════════════ */
const SW_BADGES = {
  /* chapter skips: 000 + day number */
  '0001': { go:'day1.html',           label:'DAY 1  · THE NIGHT SHIFT',         when:'01/15/94 23:51' },
  '0002': { go:'day2.html',           label:'DAY 2  · THE MORNING AFTER',       when:'01/16/94 06:22' },
  '0003': { go:'day3.html',           label:'DAY 3  · THE PAPER TRAIL',         when:'01/16/94 14:00' },
  '0004': { go:'day4.html',           label:'DAY 4  · RICKY MEADE\'S HOUSE',     when:'01/16/94 16:30' },
  '0005': { go:'day5.html',           label:'DAY 5  · UNDERGROUND',             when:'01/17/94' },
  '0006': { go:'day6.html',           label:'DAY 6  · THE HARGROVE HOUSE',      when:'01/17/94 evening' },
  '0007': { go:'day7.html',           label:'DAY 7  · 1983',                    when:'03/11/83 07:08' },
  '0008': { go:'day8.html',           label:'DAY 8  · THE ARRANGEMENT STRAINS', when:'01/??/94' },
  '0009': { go:'day9.html',           label:'DAY 9  · THE OTHERS',              when:'variable' },
  '0010': { go:'day10.html',          label:'DAY 10 · THE WALL SENDS ITS REGARDS', when:'now' },
  /* nights: 010 + night number */
  '0101': { go:'dream.html?night=1',  label:'NIGHT 1 · FIRST CONTACT',          when:'01/16/94 02:14' },
  '0102': { go:'dream.html?night=2',  label:'NIGHT 2 · THE CORRIDOR',           when:'01/17/94 03:41' },
  '0103': { go:'dream.html?night=3',  label:'NIGHT 3 · THE BOUNDARY',           when:'01/18/94 04:52' },
  /* the mine, 1962 */
  '1962': { go:'mine.html?level=levels/e1m1.json', label:'1962 · JOSEPH No. 1 · THE SHIFT',        when:'04/06/62' },
  '0407': { go:'mine.html?level=levels/e1m2.json', label:'1962 · JOSEPH No. 1 · THE EAST HEADING', when:'04/07/62' },
  /* lore badges (they work because the system never forgets them) */
  '0047': { go:'day6.html',           label:'D. HARGROVE · DEACTIVATED 03/16/91 · ACCESS GRANTED', when:'' },
  '0088': { go:'day7.html',           label:'E. COMBS · STATUS: ACTIVE',        when:'' },
  '7291': { go:'day9.html',           label:'BADGE 7291 · EAST WALL 9',         when:'' }
};
/* order of the shift log on the dashboard */
const SW_ORDER = ['0001','0002','0101','0003','0004','0102','0005','0103','0006','0007','0008','0009','0010'];
