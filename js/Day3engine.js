// ============================================================
// STATE
// ============================================================
let playerName = localStorage.getItem('sw_name') || null;
let currentFrame = 0;
let scale = 1;
let panX = 0, panY = 0;
let isDragging = false;
let lastX = 0, lastY = 0;
let brightness = 1;
let clippedIds = new Set();
let narrativeBeat = 0;
let ghostTriggered = false;
let docsUnlocked = false;
let printerTriggered = false;

// ============================================================
// NEWSPAPER DATA
// ============================================================
const frames = [
  {
    label:'COURIER 1983',
    date:'SEPTEMBER 14, 1983',
    vol:'Vol. XCVII, No. 37',
    price:'25¢',
    ed:'MORNING EDITION',
    articles:[
      {id:'combs-missing',cols:3,clippable:true,
       hl:'xl',headline:'LKCO FOREMAN REPORTED MISSING NEAR INACTIVE SHAFT SITE',
       subhead:'Earl Combs, 41, Not Returned From Tuesday Inspection; Sheriff Requests State Assistance',
       byline:'By James Whitfield, Staff Reporter | Photo by Roger Gilbert, Courier Archives',
       photo:{src:'img/combs-article.png', h:90, cap:'Search crews at the LKCO access road, County Rd. 71. At right, LKCO coordinator R. Pate.'},
       body:`Earl Combs, 41, a Whitesburg native and foreman with Letcher-Knox Coal Operations, was reported missing Tuesday after failing to return from a routine inspection of the company's inactive eastern Letcher County parcel.\n\nCombs' truck, a 1979 Ford, was found at the access road to the closed Shaft 4 site Tuesday afternoon by a neighbor. His flashlight and a clipboard were recovered some thirty feet from the vehicle. No other trace was found.\n\nThe LKCO eastern parcel has been inactive since 1979, when a geological assessment recommended suspension of operations. The land is held under a caretaking agreement with the Hargrove family. Combs had served as the site's primary caretaker since that year.\n\n"The shaft itself is sealed," Sheriff Gerald Bates told the Courier. "We found his equipment but no sign of injury or distress. This is a mystery."\n\nState police assistance has been requested. The search enters its third day today. Combs is survived by his wife, Helen, and three children.`,
       noteText:'Earl Combs — LKCO foreman, missing Sept 1983. Caretaker of Hargrove land. SECWATCH system still lists him: STATUS ACTIVE.'},
      {id:'school-board',cols:1,clippable:false,
       hl:'md',headline:'School Board to Vote on Gymnasium Proposal',
       subhead:'Shared Facility Would Serve Two District Schools',
       byline:'By Sandra Compton',
       body:"The Letcher County Board of Education will hold a special session next Tuesday to consider a $340,000 gymnasium proposal. The facility would serve Fleming-Neon and Whitesburg middle schools jointly. Partial funding from a state grant is anticipated."},
      {id:'search-day3',cols:1,clippable:false,
       hl:'md',headline:'Search Teams Widen; No New Leads',
       byline:'Staff Reports',
       body:`The search for Earl Combs entered its third day without resolution. LKCO has suspended all site operations pending investigation. Company officials declined to comment beyond confirming that Combs' access to the property was routine and authorized.`},
      {id:'fair',cols:1,clippable:false,
       hl:'md',headline:'4-H Fair Results — Whitesburg District',
       byline:'Community Notes',
       body:'The annual Letcher County 4-H Fair concluded Saturday with record attendance. Blue ribbon recipients in livestock, produce, and craft categories were recognized at a ceremony at the civic center. Complete results are listed on page B4.'}
    ]
  },
  {
    label:'COURIER 1986',
    date:'MARCH 7, 1986',
    vol:'Vol. C, No. 10',
    price:'25¢',
    ed:'MORNING EDITION',
    articles:[
      {id:'hargrove-center',cols:3,clippable:true,
       hl:'xl',headline:'HARGROVE FAMILY TO BUILD NEW BUSINESS CENTER ON COUNTY ROAD 15 SITE',
       subhead:`David Hargrove, 36, Announces Spring Construction; Planning Board Approves 4–1 Despite One Member's Concern Over LKCO Corridor Proximity`,
       byline:'By Sandra Compton, Staff Reporter | Photo by Roger Gilbert, Courier Archives',
       photo:{src:'img/hargrove-article.png', h:90, cap:'David Hargrove at Thursday'+'s planning board meeting. The building is expected to open in late 1986.'},
       body:`David Hargrove, 36, representing the Hargrove family trust, announced this week that construction will begin this spring on a new private business and research facility at the former industrial site on County Road 15.\n\nThe Hargrove Business Center, as it will be known, will offer private office suites and what Hargrove described as a "regional research archive." The 12,000-square-foot building is expected to open by October 1986.\n\n"This land has been in our family for nearly a century," Hargrove told the Courier. "It is time to put it to productive use."\n\nThe county planning board approved the development four to one on Tuesday. The lone dissenting vote came from board member Charles Risner, who cited the site's proximity to the inactive LKCO corridor in eastern Letcher County and requested more specificity about the archive's intended use.\n\nHargrove dismissed the concern. "The LKCO parcel is a separate matter entirely," he said. "Our building is on different land under different ownership."\n\nConstruction is expected to employ twelve to fifteen workers. Tenant interest has reportedly been strong among regional professional firms.`,
       noteText:'Hargrove Center — County Rd 15, opens 1986. Private offices + "research archive." Never says what kind. Planning dissent: LKCO proximity flagged.'},
      {id:'donations',cols:1,clippable:false,
       hl:'md',headline:'Hargrove Foundation Gifts $5,000 to County Library',
       byline:'Community Notes',
       body:"The Hargrove Family Foundation has donated five thousand dollars to the Letcher County Public Library for acquisition of regional reference materials. Library director Ellen Sims called it the largest single gift to the library in five years."},
      {id:'roads',cols:1,clippable:false,
       hl:'md',headline:'Highway Dept. Lists Spring Road Closures',
       byline:'Staff Reports',
       body:"The Kentucky Department of Transportation has announced spring resurfacing work beginning April 4th. County Road 15 will see lane restrictions but remain open during construction. Motorists are advised to allow additional travel time through June."},
      {id:'baseball',cols:1,clippable:false,
       hl:'md',headline:'Yellow Jackets Baseball Opens Friday at Hazard',
       byline:'Sports Staff',
       body:'The Whitesburg High School baseball team begins its 1986 season Friday evening at Hazard. Coach Mike Sims says the squad is better positioned this spring after a strong showing in fall conditioning.'}
    ]
  },
  {
    label:'COURIER 1988',
    date:'NOVEMBER 23, 1988',
    vol:'Vol. CII, No. 47',
    price:'35¢',
    ed:'MORNING EDITION',
    articles:[
      {id:'night-activity',cols:2,clippable:true,
       hl:'lg',headline:'COUNTY ROAD 15 RESIDENTS FILE COMPLAINTS OVER LATE-NIGHT GATHERINGS AT HARGROVE CENTER',
       subhead:`Sheriff's Office Investigates; No Criminal Activity Found — Hargrove Confirms "Private Meetings"`,
       byline:'By James Whitfield, Staff Reporter',
       body:`Several residents living near the Hargrove Business Center on County Road 15 have filed formal complaints with the Letcher County Sheriff's Office regarding what they describe as unusual nighttime activity at the building during the past twelve months.\n\nRuth Bingham, who lives approximately half a mile from the facility, said she has observed vehicles arriving at the building well past midnight on multiple occasions. "There must have been a dozen cars some nights," Bingham told the Courier. "And once, in October, I could see something like torchlight in the lower windows. That building has no regular tenants I know of after six o'clock."\n\nAt least four other nearby residents filed similar complaints with the county.\n\nSheriff's Deputy Kenneth Stacy investigated and reported finding no evidence of trespassing or unlawful activity. "Mr. Hargrove confirmed he uses the building for private meetings," Stacy told the Courier. "There is no law against that on private property."\n\nDavid Hargrove, reached by telephone, declined to elaborate. "We hold private meetings," he said. "There is nothing more I have to say about it."`,
       noteText:'Dozen cars. Torchlight in the BASEMENT. 1986–1988. Twelve people. This is what the court file calls "organized ritual activity." They thought they were doing something. They were just close enough for it to notice them.'},
      {id:'thanksgiving',cols:1,clippable:false,
       hl:'md',headline:'Free Thanksgiving Dinner at First Methodist',
       byline:'Community Notes',
       body:'First United Methodist Church will host a free community Thanksgiving dinner beginning at noon on Thursday. Transportation available. All are welcome. A children\'s program will follow the meal.'},
      {id:'basketball-88',cols:1,clippable:false,
       hl:'md',headline:`Yellow Jackets Open Basketball Season Friday`,
       byline:'Sports Staff',
       body:`The Whitesburg Yellow Jackets open the 1988–89 basketball season at home Friday against Hazard High. Tipoff at 7 p.m. Coach Randall Sims says the team is "cautiously optimistic" given a tough early schedule and three returning starters.`}
    ]
  },
  {
    label:'COURIER 1991',
    date:'OCTOBER 9, 1991',
    vol:'Vol. CV, No. 41',
    price:'35¢',
    ed:'MORNING EDITION',
    articles:[
      {id:'hargrove-death',cols:3,clippable:true,
       hl:'xl',headline:'DAVID HARGROVE, 41, DIES; BUSINESS CENTER TO CLOSE INDEFINITELY',
       subhead:'James Hargrove, 76, Dies Four Days After Son — Estate Seals Building and All Associated Properties Including Eastern LKCO Parcel',
       byline:'By Sandra Compton, Staff Reporter | Photo by Roger Gilbert, Courier Archives',
       photo:{src:'img/hargrove-article2.png', h:90, cap:'The Hargrove Business Center on County Road 15, photographed 1987. All tenants given 30 days to vacate.'},
       body:`David Hargrove, 41, the last active member of the Hargrove family and managing director of the Hargrove Business Center, died Sunday at Whitesburg ARH Hospital following sudden cardiac arrest. He was pronounced dead at 3:14 a.m. He had not been known to suffer from heart disease.\n\nHargrove's father, James Hargrove, 76, died Thursday — four days after his son — at the family residence on Cornett Branch Road. The elder Hargrove's physician attributed the death to natural causes consistent with his age and general health.\n\nThe Hargrove family trust announced Monday that the business center will close indefinitely. An attorney for the estate, Thomas Veale of Hazard, said the building and all associated Hargrove land holdings — including the eastern county LKCO parcel — will be placed under a maintenance contract while the estate is resolved.\n\n"There is no succession plan," Veale acknowledged. "David was the end of the line. The family's holdings will be managed in trust until the legal picture is clearer."\n\nApproximately seven tenants have been given thirty days to vacate. The estate is not accepting inquiries or offers regarding the property at this time.\n\nDavid Hargrove is survived by no immediate family. Services were private, per the family's request. Donations to the Letcher County Historical Archive are requested in lieu of flowers.`,
       noteText:'41 years old. No prior heart trouble. Father dead 4 days later. LKCO parcel goes with the rest of the estate. End of the Hargrove line. Pellegrino filed the death cert.'},
      {id:'festival',cols:1,clippable:false,
       hl:'md',headline:'Fall Festival to Proceed Despite Rain Forecast',
       byline:'Staff Reports',
       body:"Organizers of the 14th annual Letcher County Fall Festival confirmed the event will proceed as scheduled this Saturday. Several outdoor vendors will relocate under the civic center awning. Admission is free and open to the public."},
      {id:'vote',cols:1,clippable:false,
       hl:'md',headline:'Early Voting Opens Monday for November Ballot',
       byline:'From County Clerk',
       body:"Early voting for the November 5th general election begins Monday, October 14th, at the Letcher County Courthouse. Hours are 8 a.m. to 4 p.m., Monday through Friday, through November 1st."},
      {id:'weather-fall',cols:1,clippable:false,
       hl:'md',headline:'First Frost Expected by Weekend',
       byline:'Weather Service',
       body:'The National Weather Service is forecasting the first frost of the season for eastern Kentucky by Friday night. Gardeners are advised to protect or harvest tender plants. Lows in exposed areas may reach 28°F through the weekend.'}
    ]
  },
  {
    label:'COURIER DEC 1991',
    date:'DECEMBER 12, 1991',
    vol:'Vol. CV, No. 50',
    price:'35¢',
    ed:'AFTERNOON EDITION',
    articles:[
      {id:'docs-sealed',cols:2,clippable:true,
       hl:'lg',headline:'JUDGE SEALS DOCUMENTS IN HARGROVE MATTER; INSPECTION PETITION DENIED',
       subhead:"Petitioner Identified Only as R.M. Had Sought Access to Building's Lower Level and Associated Records — Case No. LC-1991-CV-0447",
       byline:'By James Whitfield, Staff Reporter',
       body:`A Letcher Circuit Court judge ruled Thursday to seal all documents related to a civil proceeding involving the former Hargrove Business Center, denying a petition seeking a full inspection of the building's lower level and its contents.\n\nThe petitioner, identified in court filings only by the initials R.M., alleged the building may contain evidence related to "organized gathering activity" during the period 1986 to 1991, and expressed concern about the welfare of unnamed participants.\n\nJudge Harold Compton declined to authorize the inspection and ordered all related filings sealed. The court's written order cited confidentiality provisions without elaboration.\n\nThomas Veale, attorney for the Hargrove estate, said the ruling was appropriate. "There is nothing in that building that concerns the public," Veale said. "The petition was entirely without merit."\n\nThe petitioner's attorney could not be reached for comment. Court records confirm the case number as LC-1991-CV-0447. Documents are sealed indefinitely. The building remains closed and under estate management. Property records indicate no authorized maintenance visits since September 1991.`,
       noteText:'Case LC-1991-CV-0447. Petitioner: R.M. Sought access to LOWER LEVEL specifically. "Organized gathering activity." Sealed Dec 1991. Who is R.M.? Find out who R.M. is.'},
      {id:'parade',cols:1,clippable:false,
       hl:'md',headline:'Christmas Parade Route Adjusted for Construction',
       byline:'City Hall',
       body:"The annual Whitesburg Christmas Parade, set for December 20th, will follow an adjusted route due to Main Street utility work. Revised route maps are available at City Hall and included with this edition."},
      {id:'cold',cols:1,clippable:false,
       hl:'md',headline:'Cold Snap Expected Through Weekend',
       byline:'Weather Service',
       body:"A cold air mass from the northwest is expected to push temperatures well below seasonal norms through Sunday. Overnight lows may reach 18F in the county's higher elevations. A wind advisory is in effect for exposed ridgelines."}
    ]
  }
];

// ============================================================
// COUNTY RECORDS DATA
// ============================================================
const docs = [
  {
    id:'deed-chain',icon:'📜',name:'DEED CHAIN — LKCO-04',tag:'Letcher County Property Records',sealed:false,
    title:'Deed Chain — Parcel LKCO-04, Eastern Letcher County',
    meta:'LETCHER COUNTY CLERK\'S OFFICE\nPROPERTY RECORDS DIVISION\nParcel: LKCO-04 · Chain of Title: 1887–Present\nPulled: 01/16/1994 14:23',
    stamp:'',
    body:`<p>Seven conveyances are recorded for LKCO-04 since the original 1887 grant.</p>
<p><strong>1887:</strong> Original land grant to Charles Hargrove. Survey note appended: <em>"Eastern boundary terminates at coordinates where surveyor's instruments gave inconsistent readings. Surveyor declined to proceed. Boundary accepted on the basis of prior deed description."</em></p>
<p><strong>1887–1921:</strong> Charles Hargrove (deceased). Inherited by William Hargrove.</p>
<p><strong>1921–1954:</strong> William Hargrove (deceased). Inherited by James Hargrove.</p>
<p><strong>1954–1991:</strong> James Hargrove / Hargrove Properties LLC.</p>
<p><strong>1987 (11/03):</strong> Transfer recorded to private party. Documents attached. <em>[See: Property Transfer Notice — 11/03/1987 — IN PRINT QUEUE]</em></p>
<p><strong>1991:</strong> Estate of James Hargrove (in probate). No active trustee of record.</p>
<p style="margin-top:12px;color:#8a2020;font-size:10.5px"><strong>NOTE:</strong> Cross-referencing prior owners against county records: Charles Hargrove (deceased 1921, natural causes), William Hargrove (deceased 1954, natural causes), James Hargrove (deceased 1991, natural causes). All sellers in prior conveyances either deceased or absent from subsequent county records. No tax filings, no voter registrations, no further property records found for any party who transferred this parcel.</p>`
  },
  {
    id:'missing-persons',icon:'🔍',name:'MISSING PERSONS INDEX — EASTERN LETCHER',tag:'Sheriff\'s Office Cross-Reference 1923–1991',sealed:false,
    title:'Missing Persons Index — Eastern Letcher County (Partial)',
    meta:'LETCHER COUNTY SHERIFF\'S OFFICE\nCross-reference: Parcels adjacent to or including LKCO-04\nCompiled for clerk records access — 01/16/1994',
    stamp:'',
    body:`<p>Twelve names appear in missing persons records connected to parcels adjacent to or including the LKCO-04 corridor. This is not a comprehensive list — records prior to 1940 are incomplete.</p>
<p><strong>1923:</strong> Evan Griffiths, 44. Coal prospector. Welsh national. Last recorded at eastern survey point. No further records.</p>
<p><strong>1931:</strong> Martin Blevins, 38. Independent miner. Last seen near eastern county access road.</p>
<p><strong>1951:</strong> Robert Sizemore, 29. Geological survey assistant. Survey notes end mid-entry. No body recovered.</p>
<p><strong>1962:</strong> Three workers — names redacted per family request — during LKCO's only active drilling operation at Shaft 4. Incident report sealed. Mining operations resumed briefly, then suspended permanently in 1963.</p>
<p><strong>1983 (February):</strong> Richard "Ricky" Meade, 23. LKCO laborer. <em>Note: Meade's residence at 1407 Cornett Branch Road remains on record. Utility payments current as of this date. No death certificate filed. No further contact.</em></p>
<p><strong>1983 (September):</strong> Earl Combs, 41. LKCO foreman. <em>Note: SECWATCH terminal at Hargrove Business Center lists Combs as STATUS: ACTIVE as of this review.</em></p>
<p style="margin-top:12px;color:#8a2020;font-size:10.5px"><strong>NOTE:</strong> None of the twelve individuals were found. None have filed taxes, registered a vehicle, or appeared in any record after the date of their disappearance.</p>`
  },
  {
    id:'death-cert',icon:'📋',name:'DEATH CERTIFICATE — D. HARGROVE (1991)',tag:'Letcher County Vital Records',sealed:false,
    title:'Certificate of Death — David Robert Hargrove',
    meta:'COMMONWEALTH OF KENTUCKY\nDEPARTMENT FOR VITAL STATISTICS\nCertificate No. 91-LC-0443\nDate Filed: 03/18/1991',
    stamp:'',
    body:`<p><strong>Name of Deceased:</strong> David Robert Hargrove</p>
<p><strong>Date of Birth:</strong> 11/14/1950 &nbsp;|&nbsp; <strong>Age:</strong> 41 years</p>
<p><strong>Date of Death:</strong> 03/16/1991 &nbsp;|&nbsp; <strong>Time:</strong> 03:14 a.m.</p>
<p><strong>Place of Death:</strong> Whitesburg ARH Hospital, Whitesburg, Letcher County, KY</p>
<p><strong>Cause of Death:</strong><br>
I (Immediate): Acute Cardiac Arrest<br>
II (Underlying): Unknown / No prior cardiac history on file<br>
III (Contributing): None noted</p>
<p><strong>Manner of Death:</strong> Natural</p>
<p><strong>Filed by:</strong> R. Pellegrino &nbsp;·&nbsp; <em>(Relationship to deceased: Associate)</em></p>
<p><strong>Witness:</strong> <span style="font-style:italic;color:#8a6040;">[Signature — illegible — possibly reads: E. Combs]</span></p>
<p style="margin-top:12px;color:#8a2020;font-size:10.5px"><strong>NOTE:</strong> Earl Combs has been listed as missing since September 14, 1983 — eight years prior to this certificate. The witness signature cannot be a clerical error. Earl Combs is not available to witness anything. The certificate was accepted as filed.</p>`
  },
  {
    id:'court-file',icon:'⚖',name:'CASE LC-1991-CV-0447 [PARTIAL ACCESS]',tag:'Circuit Court — SEALED — Partial Index Only',sealed:true,
    title:'Letcher Circuit Court — Case LC-1991-CV-0447 [SEALED]',
    meta:'LETCHER COUNTY CIRCUIT COURT\nCivil Division\nCase No. LC-1991-CV-0447\nORDER OF SEALING: 12/11/1991\nAccess Level: INDEX ONLY — Documents Sealed by Court Order',
    stamp:'SEALED BY COURT ORDER',
    body:`<p><strong>Case Type:</strong> Civil Petition — Property Inspection</p>
<p><strong>Petitioner:</strong> <span class="redacted">RICHARD MEADE</span> (initials R.M.)</p>
<p><strong>Respondent:</strong> Estate of James Hargrove / Thomas Veale, Attorney</p>
<p><strong>Filed:</strong> November 1, 1991 &nbsp;|&nbsp; <strong>Closed:</strong> December 11, 1991</p>
<p><strong>Petitioner's Stated Basis:</strong> Alleges building at Hargrove Business Center, specifically <span class="redacted">LOWER LEVEL / BASEMENT</span>, contains evidence related to <em>"organized ritual activity consistent with occult practice"</em> during the period 1986–1991. Petitioner expresses concern for welfare of unnamed participants. Petitioner appeared at initial hearing without counsel.</p>
<p><strong>Relief Sought:</strong> Full physical inspection of <span class="redacted">LOWER LEVEL</span> and seizure of all records, photographs, and material evidence therein. Identification of twelve named individuals listed as persons of interest including <span class="redacted">DAVID R. HARGROVE</span>.</p>
<p><strong>Court Disposition:</strong> Petition denied. All supporting documents sealed per confidentiality provisions. Judge H. Compton presiding.</p>
<p><strong>Estate Attorney Statement:</strong> <em>"There is nothing in that building that concerns the public."</em></p>
<p style="margin-top:12px;color:#8a2020;font-size:10.5px"><strong>NOTE:</strong> Petitioner R.M. filed this case. The petitioner's full name is sealed. The initials match Richard "Ricky" Meade, listed as missing since February 1983 — eight years before this petition was filed. Richard Meade does not legally exist in any record after 1983. He filed this petition anyway.</p>`
  }
];

// ============================================================
// NARRATIVE BEATS
// ============================================================
const narratives = [
  // Beat 0 — startup
  `The basement of the Letcher County Courthouse smells like old carpet and fluorescent light. The clerk upstairs pointed you here without making eye contact. She handed you one canister of film and a laminated index card: COURIER 1979–1994 (INCOMPLETE). The ALOS reader was already on.\n\nYou have the case number from Pellegrino. You have a name: Hargrove. You have a building that shouldn't have been accessed by a dead man's badge. You need a reason why.`,
  // Beat 1 — after first clip
  `The Courier has been covering this county since 1886. Everything that happened here, happened in these pages first. Or didn't happen at all, officially.\n\nKeep looking.`,
  // Beat 2 — after 3 clips
  `You have three pieces now. The foreman who vanished. The building that opened three years later on the same family's land. The meetings nobody would explain.\n\nThe clerk upstairs unlocked the records terminal for you. She said she wasn't supposed to. She said she'd done it before, for someone else, a long time ago. She didn't say who.`,
  // Beat 3 — docs unlocked
  `The county records go back further than the newspaper. The deed chain for LKCO-04 has seven entries. You pulled all seven sellers. Not one of them appears anywhere after the sale.\n\nNot missing. Not dead. Just — not there.`,
  // Beat 4 — all 5 clipped
  `Five clips. The picture is almost complete. The Hargrove family held this land for a hundred years and they all died or disappeared. The meetings in the basement were real. Someone tried to open a court case about it and got shut down.\n\nThe printer is making a sound.\n\nThe printer has been making a sound since you sat down. You thought it was just the machine. It wasn't the machine.`,
  // Beat 5 — after deed reveals
  `November 3rd, 1987.\n\nThe deed to LKCO-04 was transferred in 1987. You didn't buy anything in 1987. You've never been to Letcher County before this week.\n\nThe document is notarized. Pellegrino signed it. And there is a witness line.\n\nThe game does not explain this.\n\nThe game has never explained any of this.`
];

// ============================================================
// INIT
// ============================================================
window.onload = function() {
  if (!playerName) {
    document.getElementById('name-overlay').classList.remove('hidden');
    document.getElementById('name-input').focus();
    document.getElementById('name-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') submitName();
    });
  } else {
    startDay3();
  }
};

function submitName() {
  const v = document.getElementById('name-input').value.trim();
  if (!v) return;
  playerName = v.toUpperCase();
  localStorage.setItem('sw_name', playerName);
  document.getElementById('name-overlay').classList.add('hidden');
  startDay3();
}

function startDay3() {
  document.getElementById('badge-name').textContent = playerName;
  document.getElementById('badge-num').textContent = 'VISITOR · 01.16.94 · DAY PASS';
  document.getElementById('req-name').textContent = playerName;
  renderFrame(0);
  typeWriter(narratives[0], document.getElementById('narr-text'), () => {});
  setupInteractions();
}

// ============================================================
// RENDER NEWSPAPER
// ============================================================
function renderFrame(idx) {
  const f = frames[idx];
  document.getElementById('f-num').textContent = idx + 1;
  document.getElementById('f-tot').textContent = frames.length;
  document.getElementById('film-label').textContent = f.label;
  document.getElementById('prev-btn').disabled = idx === 0;
  document.getElementById('next-btn').disabled = idx === frames.length - 1;

  let html = `<div class="masthead">
    <div class="paper-name">The Letcher County Courier</div>
    <div class="paper-tagline">Serving Eastern Kentucky Since 1886 — Your Record of the Mountains</div>
    <div class="paper-meta">
      <span>${f.vol}</span><span>${f.ed}</span><span>${f.date}</span><span>${f.price}</span>
    </div>
  </div>
  <div class="columns">`;

  for (const a of f.articles) {
    const isClipped = clippedIds.has(a.id);
    html += `<div class="article${a.clippable?' clippable':''}${isClipped?' clipped':''}" 
      data-id="${a.id}" data-cols="${a.cols}" style="grid-column:span ${a.cols}">`;

    // Headline
    if (a.hl==='xl') html += `<div class="hl-xl">${a.headline}</div>`;
    else if (a.hl==='lg') html += `<div class="hl-lg">${a.headline}</div>`;
    else html += `<div class="hl-md">${a.headline}</div>`;

    if (a.subhead) html += `<div class="subhd">${a.subhead}</div>`;
    if (a.byline) html += `<div class="byline">${a.byline}</div>`;

    if (a.photo) {
      if (a.photo.src) {
        // Removed the hardcoded height constraint and set the image to height: auto
        html += `<div class="photo" style="margin-top:12px; margin-bottom:6px; border:1px solid rgba(0,0,0,0.2);">
                   <img src="${a.photo.src}" style="width:100%; height:auto; display:block; filter:grayscale(100%) contrast(140%) brightness(90%) sepia(20%); mix-blend-mode:multiply;">
                 </div>`;
      } else {
        html += `<div class="photo" style="height:${a.photo.h}px"></div>`;
      }
      
      if (a.photo.cap) {
        html += `<div class="photo-cap" style="font-family:'PT Serif', serif; font-size:10px; font-style:italic; line-height:1.3; color:#2a2010; margin-bottom:12px; border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 6px;">${a.photo.cap}</div>`;
      }
    }

    const paras = a.body.split('\n\n');
    html += '<div class="body-t">';
    for (const p of paras) html += `<p>${p}</p>`;
    html += '</div>';

    if (a.clippable && !isClipped) {
      html += `<button class="clip-btn" onclick="clipArticle('${a.id}',${idx})">[ CLIP ARTICLE ]</button>`;
    }
    html += '</div>';
  }
  html += '</div>';

  document.getElementById('newspaper-content').innerHTML = html;

  // Ghost trigger for Earl Combs (frame 0)
  if (idx === 0 && !ghostTriggered) {
    ghostTriggered = true;
    setTimeout(() => {
      const g = document.getElementById('ghost-txt');
      g.textContent = 'COMBS_E // STATUS: ACTIVE';
      g.classList.add('show');
      setTimeout(() => g.classList.remove('show'), 4000);
    }, 6000);
  }

  // Reset pan when frame changes
  panX = 0; panY = 0;
  updateTransform();
  checkZoomUnlock();
}

// ============================================================
// ZOOM / PAN
// ============================================================
function setupInteractions() {
  const screen = document.getElementById('screen');
  const viewport = document.getElementById('viewport');

  // Scroll to zoom
  screen.addEventListener('wheel', e => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    const newScale = Math.max(0.9, Math.min(4.5, scale + delta));
    // Adjust pan to zoom toward cursor position
    const rect = screen.getBoundingClientRect();
    const cx = e.clientX - rect.left - rect.width/2;
    const cy = e.clientY - rect.top - rect.height/2;
    panX -= cx * (newScale - scale) / scale;
    panY -= cy * (newScale - scale) / scale;
    scale = newScale;
    updateTransform();
    checkZoomUnlock();
  }, {passive:false});

  // Drag to pan
  screen.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    screen.style.cursor = 'grabbing';
  });
  document.addEventListener('mousemove', e => {
    if (!isDragging) return;
    panX += e.clientX - lastX;
    panY += e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    // Clamp pan
    const maxPanX = 300 * scale;
    const maxPanY = 300 * scale;
    panX = Math.max(-maxPanX, Math.min(maxPanX, panX));
    panY = Math.max(-maxPanY, Math.min(maxPanY, panY));
    updateTransform();
  });
  document.addEventListener('mouseup', () => {
    isDragging = false;
    document.getElementById('screen').style.cursor = 'crosshair';
  });

  // Touch support
  let lastTouchDist = 0;
  screen.addEventListener('touchstart', e => {
    if (e.touches.length === 1) { lastX = e.touches[0].clientX; lastY = e.touches[0].clientY; }
    if (e.touches.length === 2) {
      lastTouchDist = Math.hypot(e.touches[0].clientX-e.touches[1].clientX,
                                  e.touches[0].clientY-e.touches[1].clientY);
    }
  }, {passive:true});
  screen.addEventListener('touchmove', e => {
    e.preventDefault();
    if (e.touches.length === 1) {
      panX += e.touches[0].clientX - lastX;
      panY += e.touches[0].clientY - lastY;
      lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
      updateTransform();
    }
    if (e.touches.length === 2) {
      const dist = Math.hypot(e.touches[0].clientX-e.touches[1].clientX,
                               e.touches[0].clientY-e.touches[1].clientY);
      scale = Math.max(0.9, Math.min(4.5, scale * (dist / lastTouchDist)));
      lastTouchDist = dist;
      updateTransform();
      checkZoomUnlock();
    }
  }, {passive:false});
}

function updateTransform() {
  document.getElementById('transform-layer').style.transform =
    `translate(${panX}px,${panY}px) scale(${scale})`;
  document.getElementById('zoom-ind').textContent = `ZOOM: ${scale.toFixed(1)}×`;
  // Hide zoom hint after first zoom
  if (scale > 1.2) document.getElementById('zoom-hint').classList.add('hidden');
}

function checkZoomUnlock() {
  const np = document.getElementById('newspaper-content');
  if (scale >= 1.7) np.classList.add('zoom-unlocked');
  else np.classList.remove('zoom-unlocked');
}

// ============================================================
// FRAME NAVIGATION
// ============================================================
function nextFrame() {
  if (currentFrame >= frames.length - 1) return;
  spinReels();
  currentFrame++;
  setTimeout(() => renderFrame(currentFrame), 300);
}
function prevFrame() {
  if (currentFrame <= 0) return;
  spinReels();
  currentFrame--;
  setTimeout(() => renderFrame(currentFrame), 300);
}
function spinReels() {
  const l = document.getElementById('reel-l');
  const r = document.getElementById('reel-r');
  l.classList.add('spin'); r.classList.add('spin');
  // Flicker screen
  document.getElementById('screen').style.opacity = '0.3';
  setTimeout(() => {
    document.getElementById('screen').style.opacity = '';
    l.classList.remove('spin'); r.classList.remove('spin');
  }, 700);
}

// ============================================================
// BRIGHTNESS
// ============================================================
function adjustBright(d) {
  brightness = Math.max(0.4, Math.min(2, brightness + d));
  document.getElementById('transform-layer').style.filter = `brightness(${brightness})`;
}
function resetBright() {
  brightness = 1;
  document.getElementById('transform-layer').style.filter = '';
}

// ============================================================
// PRINT CURRENT CLIP (CTRL button)
// ============================================================
function printClip() {
  // Find a clippable article on this frame and clip the first one found
  const arts = document.querySelectorAll('.article.clippable:not(.clipped)');
  if (arts.length > 0) {
    const id = arts[0].dataset.id;
    clipArticle(id, currentFrame);
  }
}

// ============================================================
// CLIPPING MECHANIC
// ============================================================
function clipArticle(articleId, frameIdx) {
  if (clippedIds.has(articleId)) return;
  clippedIds.add(articleId);

  // Find article data
  const f = frames[frameIdx];
  const art = f.articles.find(a => a.id === articleId);
  if (!art || !art.clippable) return;

  // Update newspaper UI
  const el = document.querySelector(`.article[data-id="${articleId}"]`);
  if (el) {
    el.classList.add('clipped');
    const btn = el.querySelector('.clip-btn');
    if (btn) btn.remove();
  }

  // Add to clippings panel
  document.getElementById('no-clips-msg') && document.getElementById('no-clips-msg').remove();
  const li = document.createElement('div');
  li.className = 'clip-item';
  li.innerHTML = `<span class="clip-date">${f.date}</span>
    <div class="clip-title">${art.headline}</div>
    <div class="clip-note">${art.noteText}</div>`;
  document.getElementById('clips-list').appendChild(li);

  // Update count
  const count = clippedIds.size;
  document.getElementById('clip-count').textContent = count;

  // Add note to notes area
  addNote(art.noteText.split('.')[0] + '.');

  // Check narrative beats
  checkBeat(count);
}

function addNote(text) {
  const na = document.getElementById('notes-area');
  const ln = document.createElement('span');
  ln.className = 'note-ln';
  ln.textContent = '— ' + text;
  na.appendChild(ln);
}

function checkBeat(count) {
  if (count === 1 && narrativeBeat === 0) {
    narrativeBeat = 1;
    setTimeout(() => typeWriter(narratives[1], document.getElementById('narr-text')), 800);
  }
  if (count === 3 && narrativeBeat < 2) {
    narrativeBeat = 2;
    setTimeout(() => {
      typeWriter(narratives[2], document.getElementById('narr-text'), unlockDocs);
    }, 800);
  }
  if (count === 5 && narrativeBeat < 4) {
    narrativeBeat = 4;
    setTimeout(() => {
      typeWriter(narratives[4], document.getElementById('narr-text'), triggerPrinter);
    }, 800);
  }
}

// ============================================================
// UNLOCK COUNTY RECORDS
// ============================================================
function unlockDocs() {
  if (docsUnlocked) return;
  docsUnlocked = true;
  const sec = document.getElementById('docs-section');
  sec.style.display = 'block';
  const list = document.getElementById('docs-list');
  for (const doc of docs) {
    const item = document.createElement('div');
    item.className = `doc-item${doc.sealed?' sealed':''}`;
    item.innerHTML = `<div class="doc-icon">${doc.icon}</div>
      <div class="doc-name">${doc.name}<span class="doc-tag">${doc.tag}</span></div>`;
    item.onclick = () => openDoc(doc.id);
    list.appendChild(item);
  }
  setTimeout(() => typeWriter(narratives[3], document.getElementById('narr-text')), 400);
}

// ============================================================
// DOCUMENT MODAL
// ============================================================
function openDoc(docId) {
  const doc = docs.find(d => d.id === docId);
  if (!doc) return;
  if(typeof SW!=='undefined')SW.find(docId.replace(/-/g,'_'));
  document.getElementById('modal-title').textContent = doc.title;
  document.getElementById('modal-meta').innerHTML = doc.meta.replace(/\n/g,'<br>');
  document.getElementById('modal-body').innerHTML = doc.body;
  document.getElementById('modal-stamp').textContent = doc.stamp;
  document.getElementById('doc-modal').classList.add('open');
}
function closeDoc() {
  document.getElementById('doc-modal').classList.remove('open');
}
document.getElementById('doc-modal').addEventListener('click', e => {
  if (e.target === document.getElementById('doc-modal')) closeDoc();
});

// ============================================================
// PRINTER EVENT
// ============================================================
function triggerPrinter() {
  if (printerTriggered) return;
  printerTriggered = true;
  setTimeout(() => {
    document.getElementById('printer-section').style.display = 'block';
    addNote('Old print job in queue — 1987. Not mine. Never printed.');
  }, 1200);
}

function releasePrint() {
  const btn = document.getElementById('release-btn');
  btn.textContent = '[ PRINTING... ]';
  btn.disabled = true;
  btn.style.color = 'var(--amb)';
  setTimeout(() => {
    const deed = document.getElementById('deed-printout');
    const granteeEl = document.getElementById('deed-grantee');
    granteeEl.textContent = `GRANTEE: ${playerName}`;
    if(typeof SW!=='undefined')SW.find('DEED');
    deed.style.display = 'block';
    // Scroll deed into view
    deed.scrollIntoView({behavior:'smooth', block:'nearest'});
    setTimeout(() => {
      narrativeBeat = 5;
      typeWriter(narratives[5], document.getElementById('narr-text'), () => {
        document.getElementById('continue-btn').classList.add('show');
      });
      addNote('The deed has my name on it. 1987. I have never been here before.');
    }, 800);
  }, 2200);
}

// ============================================================
// TYPEWRITER EFFECT
// ============================================================
function typeWriter(text, el, callback) {
  el.textContent = '';
  let i = 0;
  const cursor = document.getElementById('narr-cursor');
  function tick() {
    if (i < text.length) {
      el.textContent += text[i];
      i++;
      setTimeout(tick, text[i-1] === '\n' ? 180 : 22);
    } else {
      if (callback) callback();
    }
  }
  tick();
}
