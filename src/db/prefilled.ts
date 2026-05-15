import type { Category, Technique, TechniqueConnection } from '../types'

export const prefilledCategories: Category[] = [
  {
    id: 1,
    name: 'Guards',
    description: 'Positions on your back controlling the opponent',
    icon: 'shield',
  },
  {
    id: 2,
    name: 'Guard Passing',
    description: "Techniques to bypass the opponent's guard",
    icon: 'arrows-swap',
  },
  {
    id: 3,
    name: 'Sweeps',
    description: 'Reversals from bottom position to top',
    icon: 'repeat',
  },
  {
    id: 4,
    name: 'Submissions',
    description: 'Finishing techniques — chokes and joint locks',
    icon: 'target',
  },
  {
    id: 5,
    name: 'Takedowns & Throws',
    description: 'Taking the fight to the ground',
    icon: 'arrow-down',
  },
  {
    id: 6,
    name: 'Escapes',
    description: 'Recovering from bad positions',
    icon: 'lifebuoy',
  },
  {
    id: 7,
    name: 'Positions',
    description: 'Dominant control positions',
    icon: 'crown',
  },
]

export const prefilledTechniques: Technique[] = [
  // Guards (1xx)
  {
    id: 101,
    name: 'Closed Guard',
    categoryId: 1,
    difficulty: 'BEGINNER',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Full Guard', 'Guarda Fechada'],
    description:
      "Classic guard with legs locked behind the opponent's back, controlling posture and creating attack angles.",
    cues: [
      'Break posture before attacking',
      'Hips up creates space for submissions',
      'Use diagonal angles for arm attacks',
      'Fight for wrist control constantly',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=bjj+closed+guard+fundamentals',
    referenceLinks: [
      {
        url: 'https://en.wikipedia.org/wiki/Guard_(grappling)',
        label: 'Wikipedia: Guard (Grappling)',
      },
    ],
  },
  {
    id: 102,
    name: 'Half Guard',
    categoryId: 1,
    difficulty: 'BEGINNER',
    isCustom: false,
    gi: true,
    noGi: true,
    description:
      "One leg trapping one of the opponent's legs, providing guard retention and sweep opportunities.",
    cues: [
      'Underhook is king — fight for it every time',
      'Prevent the cross-face at all costs',
      'Get on your side, never flat on your back',
      'Hip into them to set up the underhook sweep',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=bjj+half+guard+attacks+sweeps',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/BJJ-half_guard.jpg/640px-BJJ-half_guard.jpg',
    referenceLinks: [
      {
        url: 'https://en.wikipedia.org/wiki/Half_guard',
        label: 'Wikipedia: Half Guard',
      },
    ],
  },
  {
    id: 103,
    name: 'Butterfly Guard',
    categoryId: 1,
    difficulty: 'INTERMEDIATE',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Hook Guard'],
    description:
      "Seated guard using the hooks (insteps) against the opponent's thighs to off-balance and sweep.",
    cues: [
      'Stay upright — do not lean back',
      'Both hooks engage the inner thighs',
      'Off-balance to the side before lifting',
      'Underhook or head control for the angle',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=bjj+butterfly+guard+complete+guide',
    referenceLinks: [
      {
        url: 'https://en.wikipedia.org/wiki/Butterfly_guard',
        label: 'Wikipedia: Butterfly Guard',
      },
    ],
  },
  {
    id: 104,
    name: 'Spider Guard',
    categoryId: 1,
    difficulty: 'INTERMEDIATE',
    isCustom: false,
    gi: true,
    noGi: false,
    description:
      "Gripping the opponent's sleeves while using feet on biceps to control distance and attack.",
    cues: [
      'Full sleeve grip, feet on biceps not forearms',
      'Extend fully before pulling to break posture',
      'Kick hip simultaneously with the pull',
      'Rotate hips for triangle and omoplata entries',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=bjj+spider+guard+attacks+sweeps',
    referenceLinks: [
      {
        url: 'https://en.wikipedia.org/wiki/Guard_(grappling)',
        label: 'Wikipedia: Guard (Grappling)',
      },
    ],
  },
  {
    id: 105,
    name: 'De La Riva Guard',
    categoryId: 1,
    difficulty: 'INTERMEDIATE',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['DLR Guard', 'DLR'],
    description:
      "One-leg hook on the outside of the opponent's leg with sleeve/ankle control.",
    cues: [
      'Hook deep around the outside of the leg',
      'Control sleeve and far collar or near ankle',
      'Maintain distance — do not let them smash',
      'Berimbolo or back take when they step in',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=de+la+riva+guard+bjj+basics',
    referenceLinks: [
      {
        url: 'https://en.wikipedia.org/wiki/De_La_Riva_guard',
        label: 'Wikipedia: De La Riva Guard',
      },
    ],
  },
  {
    id: 106,
    name: 'X-Guard',
    categoryId: 1,
    difficulty: 'ADVANCED',
    isCustom: false,
    gi: true,
    noGi: true,
    description:
      "Both hooks under opponent's thighs in an X shape, creating extreme off-balance for sweeps.",
    cues: [
      'Sit up into them to enter',
      'Both hooks under thighs — drive in opposite directions',
      'Extend legs to shatter their base',
      'Drive off one leg to set up the sweep direction',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=x+guard+bjj+sweeps+entries',
    referenceLinks: [
      {
        url: 'https://en.wikipedia.org/wiki/Guard_(grappling)',
        label: 'Wikipedia: Guard (Grappling)',
      },
    ],
  },
  {
    id: 107,
    name: 'Lasso Guard',
    categoryId: 1,
    difficulty: 'ADVANCED',
    isCustom: false,
    gi: true,
    noGi: false,
    description:
      'Wrapping the arm in a lasso with the leg to immobilize the arm and create attack angles.',
    cues: [
      'Lasso above the elbow for max control',
      'Push hip with the free foot',
      'Force posture issues to open submission angles',
      'Transition to omoplata or triangle when they posture',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=lasso+guard+bjj+sweeps+submissions',
    referenceLinks: [
      {
        url: 'https://en.wikipedia.org/wiki/Guard_(grappling)',
        label: 'Wikipedia: Guard (Grappling)',
      },
    ],
  },
  {
    id: 108,
    name: 'Rubber Guard',
    categoryId: 1,
    difficulty: 'ADVANCED',
    isCustom: false,
    gi: true,
    noGi: true,
    description:
      'High guard position with leg behind the neck, popularised by Eddie Bravo.',
    cues: [
      'Flexibility prerequisite — stretch regularly',
      'Lock leg behind neck before gripping wrist',
      'Mission control controls posture completely',
      'Move through the system: New York, Jiu Claw, Omoplata',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=rubber+guard+bjj+10th+planet',
    referenceLinks: [
      {
        url: 'https://en.wikipedia.org/wiki/10th_Planet_Jiu-Jitsu',
        label: 'Wikipedia: 10th Planet Jiu-Jitsu (Eddie Bravo system)',
      },
    ],
  },
  {
    id: 109,
    name: 'Single Leg X (SLX)',
    categoryId: 1,
    difficulty: 'ADVANCED',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Single Leg X-Guard', 'Ashi Garami'],
    description:
      "One hook between the opponent's legs controlling a single leg for sweeps and leg-lock entries.",
    cues: [
      'Establish ashi garami — outside hook on hip',
      'Lock the knee line, not just the ankle',
      'Straighten the trapped leg to break their base',
      'Outside heel hook or sweep when they square up',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=single+leg+x+guard+bjj+ashi+garami',
    referenceLinks: [
      {
        url: 'https://en.wikipedia.org/wiki/Guard_(grappling)',
        label: 'Wikipedia: Guard (Grappling)',
      },
    ],
  },
  {
    id: 110,
    name: 'Worm Guard',
    categoryId: 1,
    difficulty: 'ELITE',
    isCustom: false,
    gi: true,
    noGi: false,
    description:
      'DLR variation using the lapel threaded around the leg for extreme control and sweeps.',
    cues: [
      'Feed lapel under their knee and grab it',
      'Hip escape creates the control position',
      'Use lapel as a third grip — keep it tight',
      'Invert and enter berimbolo from here',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=worm+guard+bjj+keenan+cornelius',
    referenceLinks: [
      {
        url: 'https://en.wikipedia.org/wiki/De_La_Riva_guard',
        label: 'Wikipedia: De La Riva Guard (base position)',
      },
    ],
  },
  {
    id: 111,
    name: 'Z Guard',
    categoryId: 1,
    difficulty: 'INTERMEDIATE',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Knee Shield Half Guard', 'Z-Guard'],
    description:
      'A strong half-guard frame with knee shield to control distance and recover attacks.',
    cues: [
      'Knee shield points across chest, not down',
      'Frame at shoulder and bicep',
      'Keep hips angled on your side',
      'Underhook when they pressure in',
      'The Z-guard knee shield frames directly into the Choi Bar (an omoplata variation) — monitor the opponent\'s near arm when they post on the knee shield',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=z+guard+bjj+knee+shield',
    referenceLinks: [
      {
        url: 'https://en.wikipedia.org/wiki/Half_guard',
        label: 'Wikipedia: Half Guard (Z Guard is a variant)',
      },
    ],
  },
  {
    id: 112,
    name: 'K Guard',
    categoryId: 1,
    difficulty: 'ADVANCED',
    isCustom: false,
    gi: true,
    noGi: true,
    description:
      'Inverted guard variation used to enter leg entanglements and back takes.',
    cues: [
      'Control near leg before inverting',
      'Hide your hips under their base',
      'Clamp knees to trap leg line',
      'Transition quickly to leg entanglement',
      'K-guard creates immediate back take and heel hook entries; the knee on belly of the trapped leg is the key pressure point for transitions',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=k+guard+bjj+entries',
    referenceLinks: [
      {
        url: 'https://en.wikipedia.org/wiki/Guard_(grappling)',
        label: 'Wikipedia: Guard (Grappling)',
      },
    ],
  },
  {
    id: 113,
    name: 'Reverse De La Riva Guard',
    categoryId: 1,
    difficulty: 'ADVANCED',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['RDLR', 'Reverse DLR', 'Spiral Guard', 'Back Hook Guard'],
    description:
      "A guard position where the inside leg hooks around the opponent's lead leg from the inside, creating an angle that makes forward pressure much harder for the top player. Particularly prevalent in no-gi. Primary destinations are back takes, calf kicks, and single-leg X entries.",
    cues: [
      'Hook your inside leg around their lead leg from below — unlike DLR, this hook comes from the inside, not outside',
      'Your posting foot should be on their hip or thigh to maintain distance while the inside hook controls their leg',
      '"Kiss of the Dragon" back take: invert under the opponent, use the hook to rotate and climb to their back',
      'When they drive through, pump the hook and extend to enter single-leg X or direct leg lock entanglement',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=reverse+de+la+riva+guard+tutorial+BJJ+back+take',
  },
  {
    id: 114,
    name: '50/50 Guard',
    categoryId: 1,
    difficulty: 'ADVANCED',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['50/50', 'Fifty-Fifty Guard', 'Neutral Leg Entanglement'],
    description:
      'A neutral leg-entanglement guard where both practitioners mirror each other\'s leg position, creating equal offensive and defensive opportunities. Primarily a platform for leg locks; both players can attack ankle locks, heel hooks, and toe holds simultaneously.',
    cues: [
      'Cup your opponent\'s knee with your top hand and hide your own heel behind their thigh — exposing your heel is the fastest way to lose',
      'Stay at an angle rather than straight-on; direct alignment lets them mirror your leg lock attempt simultaneously',
      'Ankle lock and inside heel hook are the highest-percentage finishes; establish a tight hip connection before reaching for the heel',
      'To sweep: rotate your outside knee toward the mat to buckle their lead knee, then disengage and establish top position',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=50+50+guard+BJJ+leg+locks+sweeps+tutorial',
  },
  {
    id: 115,
    name: 'Deep Half Guard',
    categoryId: 1,
    difficulty: 'ADVANCED',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Deep Half', 'DH Guard', 'Under Hook Half Guard'],
    description:
      "An extension of the half guard where the bottom player pulls their body fully beneath the opponent's centre of gravity with head near their knee, arm wrapped around one leg, and hips tight underneath. Primary attacks are the waiter sweep, Homer Simpson sweep, and back take.",
    cues: [
      'Enter by pulling your hip deep beneath the opponent\'s base; your face should be near their knee, not their hip',
      'Keep both arms in: one wraps the leg, the other controls their far knee or ankle; this prevents the cross-face and the kimura',
      'Waiter sweep: thread your outside leg under their near leg, elevate it, and sweep toward your head',
      'When they post to stop the sweep, use that post as a pivot point to rotate to their back instead',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=deep+half+guard+BJJ+waiter+sweep+back+take+tutorial',
  },

  // Guard Passing (2xx)
  {
    id: 201,
    name: 'Torreando Pass',
    categoryId: 2,
    difficulty: 'BEGINNER',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Toreando Pass', 'Matador Pass', 'Bullfighter Pass'],
    description:
      'Using grips on the knees/ankles to swing the legs aside and pass laterally.',
    cues: [
      'Control pants at the knee, not the ankle',
      'Step around — do not try to go through',
      'Redirect legs to one side decisively',
      'Flatten and consolidate before settling into side control',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=torreando+pass+bjj+fundamentals',
  },
  {
    id: 202,
    name: 'Double Under Pass',
    categoryId: 2,
    difficulty: 'INTERMEDIATE',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Double Unders', 'Double Underhook Pass'],
    description:
      'Shooting both arms under the legs to stack and pass the guard.',
    cues: [
      'Grip pants at hips not ankles',
      'Duck under and stack hips to chest',
      'Drive forward and walk to the side',
      'Head to the outside to prevent triangle',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=double+under+pass+bjj+pressure+passing',
  },
  {
    id: 203,
    name: 'Over-Under Pass',
    categoryId: 2,
    difficulty: 'INTERMEDIATE',
    isCustom: false,
    gi: true,
    noGi: true,
    description:
      'One arm over one leg and one arm under the other, a powerful pressure pass.',
    cues: [
      'Heavy pressure on the over-leg side',
      'Drive forward with your body weight',
      'Flatten their hips before moving to side',
      'Shoulder pressure on the inner thigh',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=over+under+pass+bjj+bernardo+faria',
  },
  {
    id: 204,
    name: 'Leg Drag',
    categoryId: 2,
    difficulty: 'INTERMEDIATE',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Leg Drag Pass'],
    description:
      'Dragging one leg across the body while maintaining hip connection to create an angle for passing.',
    cues: [
      'Pull one leg across the body line',
      'Maintain hip-to-hip contact throughout',
      'Clear the second leg before settling',
      'Step over to complete the pass',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=leg+drag+pass+bjj+technique',
  },
  {
    id: 205,
    name: 'Knee Slice Pass',
    categoryId: 2,
    difficulty: 'BEGINNER',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Knee Cut Pass', 'Knee Slide Pass'],
    description:
      'Driving the knee through the guard while controlling the hip.',
    cues: [
      'Knee cuts diagonally across their thigh',
      'Hip pressure into their hip as you cut',
      'Cross-face immediately to prevent escape',
      'Stay heavy — do not let them create space',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=knee+slice+pass+bjj+fundamentals',
  },
  {
    id: 206,
    name: 'Smash Pass',
    categoryId: 2,
    difficulty: 'INTERMEDIATE',
    isCustom: false,
    gi: true,
    noGi: true,
    description:
      "Stacking the opponent's legs while driving forward to flatten and pass.",
    cues: [
      'Stack legs to their chest',
      'Pinch knees together to control both legs',
      'Drive forward with your body',
      'Walk around to side control once flat',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=smash+pass+bjj+no+gi+technique',
  },
  {
    id: 207,
    name: 'Bullfighter Pass',
    categoryId: 2,
    difficulty: 'BEGINNER',
    isCustom: false,
    gi: true,
    noGi: true,
    description:
      'Gripping both ankles/knees and redirecting the legs to either side.',
    cues: [
      'Grip at the knees not the ankles',
      'Swing legs decisively to one side',
      'Step over the legs and pin',
      'Move quickly — this is a speed pass',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=bullfighter+pass+bjj+ankle+grip',
  },
  {
    id: 208,
    name: 'HQ / Headquarters',
    categoryId: 2,
    difficulty: 'INTERMEDIATE',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Headquarters Position', 'HQ'],
    description:
      'Neutral passing position inside the guard, used to control and set up leg locks or passes.',
    cues: [
      'Maintain the inside position at all costs',
      'Wedge knee to control their hip',
      'Inside heel hook or straight ankle from here',
      'Transition to leg lock or pass based on their response',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=headquarters+position+bjj+nogi+passing',
  },
  {
    id: 209,
    name: 'Body Lock Pass',
    categoryId: 2,
    difficulty: 'INTERMEDIATE',
    isCustom: false,
    gi: true,
    noGi: true,
    description:
      'Chest-to-hip passing style using a tight body lock to flatten and clear the legs.',
    cues: [
      'Lock hands at lower back line',
      'Head tight under their chin',
      'Drive chest pressure while stepping around',
      'Clear knee line before settling',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=body+lock+pass+bjj',
  },
  {
    id: 210,
    name: 'Long Step Pass',
    categoryId: 2,
    difficulty: 'ADVANCED',
    isCustom: false,
    gi: true,
    noGi: true,
    description:
      'Dynamic passing movement stepping deep around the guard to expose side control.',
    cues: [
      'Control hips before stepping',
      'Long step lands behind their hip',
      'Drop shoulder to pin legs',
      'Switch base to kill inversion',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=long+step+pass+bjj',
  },

  // Sweeps (3xx)
  {
    id: 301,
    name: 'Hip Bump Sweep',
    categoryId: 3,
    difficulty: 'BEGINNER',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Sit-Up Sweep'],
    description:
      'Posting the hand and bumping the hip forward from closed guard to take top position.',
    cues: [
      'Break posture first — pull them forward',
      'Post one hand, bump hips explosively upward',
      'Commit fully — hesitation kills the sweep',
      'Follow up with kimura if they base out',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=hip+bump+sweep+bjj+closed+guard',
  },
  {
    id: 302,
    name: 'Scissor Sweep',
    categoryId: 3,
    difficulty: 'BEGINNER',
    isCustom: false,
    gi: true,
    noGi: true,
    description:
      'Using a scissoring motion of the legs from closed guard to knock the opponent over.',
    cues: [
      'Must break posture before opening guard',
      'Collar-sleeve grip controls both sides',
      'Scissor legs simultaneously with the pull',
      'Drive bottom knee into their hip as you sweep',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=scissor+sweep+bjj+closed+guard+technique',
  },
  {
    id: 303,
    name: 'Flower Sweep (Pendulum)',
    categoryId: 3,
    difficulty: 'BEGINNER',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Pendulum Sweep'],
    description:
      'From closed guard, hooking a leg and sweeping with a pendulum motion.',
    cues: [
      'Hook their near leg with your near leg',
      'Pendulum swing generates the momentum',
      'Pull their arm across your chest',
      'Spin to top as they go over',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=flower+sweep+pendulum+bjj+closed+guard',
  },
  {
    id: 304,
    name: 'Butterfly Sweep',
    categoryId: 3,
    difficulty: 'INTERMEDIATE',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Hook Sweep', 'Elevator Sweep'],
    description:
      'Using butterfly hooks to off-balance the opponent and sweep to the side.',
    cues: [
      'Underhook creates the angle for the sweep',
      'Elevate with the hook as you fall to the side',
      'Off-balance them toward the underhook side',
      'Roll through smoothly — do not muscle it',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=butterfly+sweep+bjj+technique+marcelo',
  },
  {
    id: 305,
    name: 'X-Guard Sweep',
    categoryId: 3,
    difficulty: 'ADVANCED',
    isCustom: false,
    gi: true,
    noGi: true,
    description:
      'Sweeping from X-guard by extending the legs to dump the opponent forward or backward.',
    cues: [
      'Extend both legs in unison to break base',
      'Off-balance toward your sweep direction first',
      'Sit up to follow them to the top',
      'Grab the far ankle to control as they fall',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=x+guard+sweep+bjj+standing',
  },
  {
    id: 306,
    name: 'Berimbolo',
    categoryId: 3,
    difficulty: 'ELITE',
    isCustom: false,
    gi: true,
    noGi: true,
    description:
      'A spinning inversion from De La Riva to take the back or gain dominant position.',
    cues: [
      'Invert under their center of gravity',
      'Drive hips up toward their back',
      'Grab the far ankle to control the rotation',
      'Finish in back take or leg drag position',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=berimbolo+bjj+mendes+brothers+technique',
    referenceLinks: [
      {
        url: 'https://en.wikipedia.org/wiki/Berimbolo',
        label: 'Wikipedia: Berimbolo',
      },
    ],
  },
  {
    id: 307,
    name: 'De La Riva Sweep',
    categoryId: 3,
    difficulty: 'INTERMEDIATE',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['DLR Sweep'],
    description:
      'Various sweeps from the De La Riva guard attacking the near or far leg.',
    cues: [
      'Off-balance them to the side of the DLR hook',
      'Kick toward their head to initiate',
      'Rotate over their trapped leg',
      'Control the ankle as you come on top',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=de+la+riva+sweep+bjj+basic+intermediate',
  },
  {
    id: 308,
    name: 'Tripod Sweep',
    categoryId: 3,
    difficulty: 'INTERMEDIATE',
    isCustom: false,
    gi: true,
    noGi: true,
    description:
      'Using foot on the hip and foot on the bicep to sweep the opponent.',
    cues: [
      'Foot on hip, foot on bicep simultaneously',
      'Pull the sleeve to break their base',
      'Extend hips as you pull the leg toward you',
      'Come up to the top position quickly',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=tripod+sweep+bjj+spider+guard+no+gi',
  },
  {
    id: 309,
    name: 'Lumberjack Sweep',
    categoryId: 3,
    difficulty: 'INTERMEDIATE',
    isCustom: false,
    gi: true,
    noGi: true,
    description:
      'Sweep from seated guard by elevating one leg and chopping the post leg.',
    cues: [
      'Control sleeves or wrists first',
      'Lift one leg with your hook',
      'Chop the far post ankle with opposite foot',
      'Sit up immediately to finish on top',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=lumberjack+sweep+bjj',
  },
  {
    id: 310,
    name: 'Balloon Sweep',
    categoryId: 3,
    difficulty: 'INTERMEDIATE',
    isCustom: false,
    gi: true,
    noGi: true,
    description:
      'Floating sweep from open guard that elevates opponent overhead before top transition.',
    cues: [
      'Grips must connect to sleeves/collar',
      'Bring knees to chest then extend',
      'Guide them over your shoulder line',
      'Follow and come up before scramble',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=balloon+sweep+bjj',
  },
  {
    id: 311,
    name: 'Old School Half Guard Sweep',
    categoryId: 3,
    difficulty: 'BEGINNER',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Old School Sweep', 'Gordo Sweep'],
    description:
      "A fundamental bottom half-guard sweep using an underhook and a grip on the opponent's far ankle to tilt them over. Popularised by Roberto 'Gordo' Correa, typically the first half-guard sweep taught.",
    cues: [
      'Secure a deep underhook on the opponent\'s near arm, then duck your head under their torso',
      'Reach under their free leg and grip the toes (not the ankle) for maximum lever length',
      'Release the underhook, reinforce the toe grip with both hands, then drive your hips in and lift',
      'If they base out with their free leg, transition to taking their back instead of completing the sweep',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=old+school+half+guard+sweep+BJJ+tutorial',
  },
  {
    id: 312,
    name: 'Kimura Sweep',
    categoryId: 3,
    difficulty: 'BEGINNER',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Kimura Sweep from Closed Guard'],
    description:
      'A closed-guard sweep using the kimura grip (figure-four on the wrist) to off-balance and reverse the opponent. If the sweep is denied, the same grip transitions directly into the kimura submission or opens a triangle.',
    cues: [
      'Break opponent\'s posture, isolate one wrist, and establish the double-wristlock (kimura) grip',
      'Pull the arm across your centre line; when they post their hand to prevent the submission, use that post to elevate and sweep',
      'If the sweep fails, roll to your side and finish the kimura submission from bottom',
      'Failed sweep also opens guard-bottom triangle and guillotine — stay active on the grip',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=kimura+sweep+from+closed+guard+BJJ',
  },
  {
    id: 313,
    name: 'John Wayne Sweep',
    categoryId: 3,
    difficulty: 'INTERMEDIATE',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Knee Lever Sweep', 'Knee Lever', 'Half Guard Knee Lever'],
    description:
      'A half-guard sweep using the free knee as a lever against the opponent\'s far ankle to tip them sideways. Named for the casual, rolling motion it produces.',
    cues: [
      'From half guard with an underhook, open your guard and post your top foot while your bottom leg controls just above their ankle',
      'Swing your free (top) knee upward and over in an arc like a windshield wiper, driving it through their ankle line',
      'Combine the knee lever with a bridge-push from your posted foot to generate rotation',
      'Follow the sweep to come on top directly into side control or half guard top',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=john+wayne+sweep+knee+lever+half+guard+BJJ',
  },

  // Submissions (4xx)
  {
    id: 401,
    name: 'Armbar',
    categoryId: 4,
    difficulty: 'BEGINNER',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Juji Gatame', 'Cross Armlock', 'Arm Bar'],
    description:
      'Hyperextending the elbow joint by controlling the arm across the body — applied from many positions.',
    cues: [
      'Break posture before going for the armbar',
      'Arm must cross the centerline of your body',
      'Squeeze knees together, drive hips upward',
      'Thumb pointing up means elbow faces down — adjust',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=armbar+bjj+guard+mount+technique+setup',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Armlock_juji-gatame_armbar.jpg/640px-Armlock_juji-gatame_armbar.jpg',
    referenceLinks: [
      {
        url: 'https://en.wikipedia.org/wiki/Juji-gatame',
        label: 'Wikipedia: Juji-gatame (Armbar)',
      },
    ],
  },
  {
    id: 402,
    name: 'Triangle Choke',
    categoryId: 4,
    difficulty: 'BEGINNER',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Sankaku Jime'],
    description:
      'Locking the head and arm with the legs in a figure-4 to cut off blood flow to the brain.',
    cues: [
      'Head and one arm inside the triangle',
      'Pull head down to complete the lock',
      'Angle off to the side of the trapped arm',
      'Push arm across their centerline to tighten',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=triangle+choke+bjj+guard+technique',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Triangle33.JPG/640px-Triangle33.JPG',
    referenceLinks: [
      {
        url: 'https://en.wikipedia.org/wiki/Triangle_choke',
        label: 'Wikipedia: Triangle Choke',
      },
    ],
  },
  {
    id: 403,
    name: 'Kimura',
    categoryId: 4,
    difficulty: 'BEGINNER',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Double Wristlock', 'Ude Garami', 'Chicken Wing'],
    description:
      'A figure-4 grip on the wrist rotating the shoulder joint — applied from many positions.',
    cues: [
      'Figure-4 grip below the wrist, not on it',
      'Rotate the shoulder externally and upward',
      'Use body weight not just arm strength',
      'Pin the elbow to your hip for leverage',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=kimura+bjj+closed+guard+side+control',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Brazilian_Jiu-jitsu_Kimura_lock_from_guard.jpg/640px-Brazilian_Jiu-jitsu_Kimura_lock_from_guard.jpg',
    referenceLinks: [
      {
        url: 'https://en.wikipedia.org/wiki/Kimura_lock',
        label: 'Wikipedia: Kimura Lock',
      },
    ],
  },
  {
    id: 404,
    name: 'Omoplata',
    categoryId: 4,
    difficulty: 'INTERMEDIATE',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Coil Lock', 'Ashi Sankaku Garami'],
    description:
      'Shoulder lock using the legs to control the arm and rotate the shoulder.',
    cues: [
      'Swing leg over the shoulder — not just the arm',
      'Sit up immediately to prevent rolling',
      'Perpendicular to their body for max pressure',
      'Use hips not just legs to apply the lock',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=omoplata+bjj+submission+guard',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Omoplata_armlock.jpg/640px-Omoplata_armlock.jpg',
    referenceLinks: [
      {
        url: 'https://en.wikipedia.org/wiki/Omoplata',
        label: 'Wikipedia: Omoplata',
      },
    ],
  },
  {
    id: 405,
    name: 'Rear Naked Choke',
    categoryId: 4,
    difficulty: 'BEGINNER',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['RNC', 'Mata Leão', 'Hadaka Jime'],
    description:
      'Blood choke from the back — arm under the chin, arm behind the head.',
    cues: [
      'Arm under the chin, NOT on the chin',
      'Second arm behind the head, not the neck',
      'Squeeze bicep and shoulder together',
      'Pull elbow toward you as you squeeze',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=rear+naked+choke+bjj+finishing+technique',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Hadaka-jime.jpg/640px-Hadaka-jime.jpg',
    referenceLinks: [
      {
        url: 'https://en.wikipedia.org/wiki/Hadaka_jime',
        label: 'Wikipedia: Hadaka-jime (Rear Naked Choke)',
      },
    ],
  },
  {
    id: 406,
    name: 'Guillotine Choke',
    categoryId: 4,
    difficulty: 'BEGINNER',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Guillotine', 'Mae Hadaka Jime'],
    description:
      'Arm around the neck cutting off blood flow, applied from standing or guard.',
    cues: [
      'Get fully under the neck, not on top',
      'High elbow guillotine for arm-in variation',
      'Pull arm across your body as you squeeze',
      'Crunch and close the guard for guard guillotine',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=guillotine+choke+bjj+high+elbow+arm+in',
    referenceLinks: [
      {
        url: 'https://en.wikipedia.org/wiki/Guillotine_choke',
        label: 'Wikipedia: Guillotine Choke',
      },
    ],
  },
  {
    id: 407,
    name: 'Outside Heel Hook',
    categoryId: 4,
    difficulty: 'ADVANCED',
    isCustom: false,
    gi: true,
    noGi: true,
    description:
      'Rotating the heel outward to attack the lateral structures of the knee.',
    cues: [
      'Establish outside heel hook position first',
      'Cup the heel, rotate toward your chest',
      'Control the knee line at all times',
      'Small rotation — the damage is fast',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=outside+heel+hook+bjj+nogi+leg+lock',
    referenceLinks: [
      {
        url: 'https://en.wikipedia.org/wiki/Heel_hook',
        label: 'Wikipedia: Heel Hook',
      },
    ],
  },
  {
    id: 408,
    name: 'Inside Heel Hook',
    categoryId: 4,
    difficulty: 'ELITE',
    isCustom: false,
    gi: true,
    noGi: true,
    description:
      'Rotating the heel inward to attack the medial structures of the knee — highly dangerous.',
    cues: [
      'Protect your own knee alignment first',
      'Figure-4 at the shin level',
      'Rotate the heel toward your center',
      'Tap immediately — damage is silent and fast',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=inside+heel+hook+bjj+mechanics+defense',
    referenceLinks: [
      {
        url: 'https://en.wikipedia.org/wiki/Heel_hook',
        label: 'Wikipedia: Heel Hook',
      },
    ],
  },
  {
    id: 409,
    name: 'Straight Ankle Lock',
    categoryId: 4,
    difficulty: 'BEGINNER',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Achilles Lock', 'Straight Footlock', 'Botinha'],
    description:
      'Applying pressure against the Achilles tendon to attack the ankle.',
    cues: [
      'Figure-4 grip — bony part of forearm on Achilles',
      'Squeeze elbows together and fall back',
      'Control their knee line with your legs',
      'Extend hips not just arms to apply pressure',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=straight+ankle+lock+bjj+fundamentals',
    referenceLinks: [
      {
        url: 'https://en.wikipedia.org/wiki/Ankle_lock',
        label: 'Wikipedia: Ankle Lock',
      },
    ],
  },
  {
    id: 410,
    name: 'Kneebar',
    categoryId: 4,
    difficulty: 'ADVANCED',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Knee Bar', 'Hiza Juji Gatame'],
    description:
      'Hyperextending the knee joint, similar to an armbar but on the leg.',
    cues: [
      'Control the leg against your chest',
      'Hip to popliteal fossa (back of knee)',
      'Extend hips to create the bar pressure',
      'Straighten leg fully against your body',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=kneebar+bjj+submission+entry+technique',
    referenceLinks: [
      {
        url: 'https://en.wikipedia.org/wiki/Knee_bar',
        label: 'Wikipedia: Knee Bar',
      },
    ],
  },
  {
    id: 411,
    name: 'Darce Choke',
    categoryId: 4,
    difficulty: 'INTERMEDIATE',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ["D'Arce Choke", 'Brabo Choke'],
    description:
      'Arm-in choke using a figure-4 through the neck, applied from turtle or guard.',
    cues: [
      'Thread arm through head and arm simultaneously',
      'Secure figure-4 grip on own bicep',
      'Squeeze and drive them forward',
      'Finish on top or use body weight from behind',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=darce+choke+bjj+nogi+setup+finish',
    referenceLinks: [
      {
        url: 'https://en.wikipedia.org/wiki/D%27arce_choke',
        label: "Wikipedia: D'arce Choke",
      },
    ],
  },
  {
    id: 412,
    name: 'Anaconda Choke',
    categoryId: 4,
    difficulty: 'INTERMEDIATE',
    isCustom: false,
    gi: true,
    noGi: true,
    description:
      'Similar to the Darce but with a different arm position, often from front headlock.',
    cues: [
      'Thread arm under the head and through arm',
      'Drive shoulder into the neck',
      'Roll to the trapped arm side to finish',
      'Squeeze while driving your body weight in',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=anaconda+choke+bjj+front+headlock+nogi',
    referenceLinks: [
      {
        url: 'https://en.wikipedia.org/wiki/Anaconda_choke',
        label: 'Wikipedia: Anaconda Choke',
      },
    ],
  },
  {
    id: 413,
    name: 'Bow and Arrow Choke',
    categoryId: 4,
    difficulty: 'INTERMEDIATE',
    isCustom: false,
    gi: true,
    noGi: false,
    description:
      'Powerful collar choke from the back using the belt/pants grip for finishing leverage.',
    cues: [
      'Deep collar grip on the choking side',
      'Pants or belt grip on opposite side leg',
      'Extend your body to create the bow',
      'Pull collar toward you, push leg away',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=bow+and+arrow+choke+bjj+gi+back+control',
  },
  {
    id: 414,
    name: 'Cross Collar Choke',
    categoryId: 4,
    difficulty: 'BEGINNER',
    isCustom: false,
    gi: true,
    noGi: false,
    aliases: ['Cross Choke', 'X Choke', 'Juji Jime'],
    description:
      'Double collar grip from mount or guard crossing over to choke.',
    cues: [
      'Both grips cross the centerline of their collar',
      'Rotate wrists inward as you apply pressure',
      'Drive elbows toward the floor',
      'Posture up in mount before applying',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=cross+collar+choke+bjj+mount+guard+gi',
  },
  {
    id: 415,
    name: 'Ezekiel Choke',
    categoryId: 4,
    difficulty: 'INTERMEDIATE',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Sode Guruma Jime', 'Estrangulamento Ezequiel'],
    description:
      "Sleeve-grip choke from mount, can even be applied inside the opponent's guard.",
    cues: [
      'Sleeve goes against the neck first',
      'Palm pushes across the throat',
      'Squeeze and rotate the choke',
      'Works even from inside their guard — unexpected',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=ezekiel+choke+bjj+mount+technique',
    referenceLinks: [
      {
        url: 'https://en.wikipedia.org/wiki/Ezekiel_choke',
        label: 'Wikipedia: Ezekiel Choke',
      },
    ],
  },
  {
    id: 416,
    name: 'Americana (Keylock)',
    categoryId: 4,
    difficulty: 'BEGINNER',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Keylock', 'Figure-Four Armlock', 'V-Lock'],
    description:
      'Figure-4 shoulder lock bending the wrist upward — applied from mount or side control.',
    cues: [
      'Pin the wrist to the mat first',
      'Figure-4 grip secures the arm',
      'Drive elbow toward their hip in small circles',
      'Keep the wrist lower than the elbow always',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=americana+keylock+bjj+mount+side+control',
    referenceLinks: [
      {
        url: 'https://en.wikipedia.org/wiki/Ude_garami',
        label: 'Wikipedia: Ude-garami (Americana / Keylock)',
      },
    ],
  },
  {
    id: 417,
    name: 'Arm Triangle Choke',
    categoryId: 4,
    difficulty: 'INTERMEDIATE',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Head and Arm Choke', 'Kata Gatame', 'Side Choke'],
    description:
      'Head-and-arm blood choke finished from mount or side control with shoulder pressure.',
    cues: [
      'Trap their arm across neck first',
      'Head low on same side as trapped arm',
      'Walk to side while squeezing shoulder in',
      'Finish with chest drop and pressure',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=arm+triangle+choke+bjj',
    referenceLinks: [
      {
        url: 'https://en.wikipedia.org/wiki/Arm_triangle_choke',
        label: 'Wikipedia: Arm Triangle Choke',
      },
    ],
  },
  {
    id: 418,
    name: 'North-South Choke',
    categoryId: 4,
    difficulty: 'ADVANCED',
    isCustom: false,
    gi: true,
    noGi: true,
    description:
      'Choke from north-south using shoulder and lat pressure around the neck.',
    cues: [
      'Arm wraps deep around neck line',
      'Shoulder pressure down, not pulling up',
      'Sprawl hips away to tighten',
      'Hide elbow and keep chest heavy',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=north+south+choke+bjj',
  },
  {
    id: 419,
    name: 'Reverse Armbar',
    categoryId: 4,
    difficulty: 'INTERMEDIATE',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Reverse Armlock', 'Arm Crush', 'Cutting Armbar', 'Razor Lock'],
    description:
      'A palm-up armbar variant applied from closed or butterfly guard that hyperextends the elbow in the opposite direction to the standard armbar. If it fails, it flows naturally back into the regular armbar.',
    cues: [
      'From closed guard, isolate one arm and shift your weight in the direction of the attack to load pressure onto their elbow',
      'Keep their palm facing up (supinated); your leg presses over their forearm to apply the lever',
      'Pull their wrist toward your shoulder and press your shin downward for the finish',
      'If they stack or posture, transition immediately to the standard armbar by swinging the leg over the head',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=reverse+armbar+from+closed+guard+BJJ',
  },
  {
    id: 420,
    name: 'Toe Hold',
    categoryId: 4,
    difficulty: 'ADVANCED',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Ashi Dori Garami', 'Foot Lock'],
    description:
      'A leg lock targeting the ankle and foot using a kimura-style figure-four grip on the foot, twisting the foot inward to tear ankle ligaments. Most commonly applied from ashi garami, 50/50, or half guard entanglements.',
    cues: [
      'Trap the leg to prevent escape; grab the top of the foot (pinky finger aligned with pinky toe) and loop the other arm under their shin to lock on your own wrist',
      'Keep their foot to your chest — any gap allows them to wiggle free',
      'Rotate your entire body to crank the foot inward (toward their opposite hip) rather than just using arm strength',
      'Control the knee line before applying pressure; an uncontrolled knee will allow them to roll and escape',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=toe+hold+BJJ+leg+lock+tutorial',
  },
  {
    id: 421,
    name: 'Calf Slicer',
    categoryId: 4,
    difficulty: 'ADVANCED',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Calf Crusher', 'Leg Slicer', 'Compression Lock'],
    description:
      "A compression lock that wedges the shin behind the opponent's knee and folds the leg, crushing the calf muscle against the shin bone. Common setups include turtle position, deep half guard, and X-guard.",
    cues: [
      "Wedge your shin behind the opponent's knee joint as a fulcrum; the deeper the shin, the more efficient the pressure",
      'Secure a figure-four with your legs and control their instep or ankle with both hands',
      'Turn your shin blade into their calf (like dorsiflexing your ankle) while pulling their ankle toward you',
      'Pressure develops quickly — finish before they roll out; use a seatbelt grip or hook if available to block the roll',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=calf+slicer+BJJ+compression+lock+tutorial',
  },
  {
    id: 422,
    name: 'Mounted Triangle',
    categoryId: 4,
    difficulty: 'ADVANCED',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Top Triangle', 'Triangle from Mount'],
    description:
      'A blood choke applied from the top mount by swinging one leg over the neck and locking a figure-four with the other leg, similar to a closed-guard triangle but with the weight advantage of being on top.',
    cues: [
      "From high mount, climb knees past the opponent's elbows so their arms are above the elbow plane",
      'Isolate one arm by controlling the wrist; swing the outside leg over the neck to begin the triangle lock',
      'Lock the figure-four (shin behind knee) and adjust the angle using hip pressure rather than inverting',
      'Squeeze your knees together and press the trapped arm across the centreline to tighten the choke',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=mounted+triangle+BJJ+submission+from+mount',
  },

  // Takedowns & Throws (5xx)
  {
    id: 501,
    name: 'Double Leg Takedown',
    categoryId: 5,
    difficulty: 'BEGINNER',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Double Leg', 'Morote Gari'],
    description:
      'Shooting in on both legs and driving to lift/trip the opponent to the ground.',
    cues: [
      'Level change — get low before the shot',
      'Penetration step drives inside their hips',
      'Head to the outside — never inside',
      'Drive forward and up, then trip or lift',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=double+leg+takedown+wrestling+bjj',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Morote-gari.jpg/640px-Morote-gari.jpg',
    referenceLinks: [
      {
        url: 'https://en.wikipedia.org/wiki/Double_leg_takedown',
        label: 'Wikipedia: Double Leg Takedown',
      },
    ],
  },
  {
    id: 502,
    name: 'Single Leg Takedown',
    categoryId: 5,
    difficulty: 'BEGINNER',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Single Leg'],
    description:
      'Controlling one leg and using trips or lifts to bring the opponent down.',
    cues: [
      'Secure the leg at the thigh not the ankle',
      'Drive through their center of gravity',
      'Run the pipe or trip the ankle to finish',
      'Keep head up and to the outside',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=single+leg+takedown+bjj+wrestling+finish',
    referenceLinks: [
      {
        url: 'https://en.wikipedia.org/wiki/Single_leg_takedown',
        label: 'Wikipedia: Single Leg Takedown',
      },
    ],
  },
  {
    id: 503,
    name: 'Hip Throw (O-goshi)',
    categoryId: 5,
    difficulty: 'BEGINNER',
    isCustom: false,
    gi: true,
    noGi: true,
    description:
      'Loading the opponent onto the hip and rotating to throw them to the ground.',
    cues: [
      'Break their balance forward first',
      'Load hip directly under their center',
      'Turn — hips face the same direction as theirs',
      'Rotate and pull over your hip smoothly',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=o+goshi+hip+throw+judo+bjj',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/O-goshi.jpg/640px-O-goshi.jpg',
    referenceLinks: [
      {
        url: 'https://en.wikipedia.org/wiki/O_goshi',
        label: 'Wikipedia: O-goshi (Hip Throw)',
      },
    ],
  },
  {
    id: 504,
    name: 'Seoi Nage',
    categoryId: 5,
    difficulty: 'INTERMEDIATE',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Shoulder Throw'],
    description: 'Pulling the opponent over the shoulder for a large throw.',
    cues: [
      'Pull them in as you rotate under',
      'Drive shoulder under their armpit',
      'Load their weight onto your back',
      'Rotate fully and pull them over',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=seoi+nage+shoulder+throw+judo+bjj',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Seoi-nage.jpg/640px-Seoi-nage.jpg',
    referenceLinks: [
      {
        url: 'https://en.wikipedia.org/wiki/Seoi_nage',
        label: 'Wikipedia: Seoi-nage (Shoulder Throw)',
      },
    ],
  },
  {
    id: 505,
    name: 'Uchi Mata',
    categoryId: 5,
    difficulty: 'ADVANCED',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Inner Thigh Throw'],
    description:
      "Sweeping inside the opponent's leg while breaking their balance.",
    cues: [
      'Break balance to their front corner',
      'Sweep the inner thigh — not the foot',
      'Rotate over the throw completely',
      'Drive them over your sweeping leg',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=uchi+mata+judo+bjj+inner+thigh+throw',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Uchi-mata.jpg/640px-Uchi-mata.jpg',
    referenceLinks: [
      {
        url: 'https://en.wikipedia.org/wiki/Uchi_mata',
        label: 'Wikipedia: Uchi-mata',
      },
    ],
  },
  {
    id: 506,
    name: 'Osoto Gari',
    categoryId: 5,
    difficulty: 'BEGINNER',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Major Outer Reap', 'Large Outer Reap'],
    description:
      "Reaping the opponent's leg from the outside while pushing them backward.",
    cues: [
      'Break balance backward to their rear corner',
      'Step in deep next to their leg',
      'Reap the leg while driving head and shoulder',
      'Commit fully — do not hesitate',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=osoto+gari+judo+bjj+outer+reap',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/O-soto-gari.jpg/640px-O-soto-gari.jpg',
    referenceLinks: [
      {
        url: 'https://en.wikipedia.org/wiki/O_soto_gari',
        label: 'Wikipedia: O-soto-gari',
      },
    ],
  },
  {
    id: 507,
    name: 'Ankle Pick',
    categoryId: 5,
    difficulty: 'INTERMEDIATE',
    isCustom: false,
    gi: true,
    noGi: true,
    description:
      'Grabbing the ankle while pushing the head to trip the opponent.',
    cues: [
      'Push their head down as they step',
      'Grab the ankle on the same side',
      'Drive forward as you lift the ankle',
      'Follow to the top position quickly',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=ankle+pick+bjj+wrestling+takedown',
  },
  {
    id: 508,
    name: "Fireman's Carry",
    categoryId: 5,
    difficulty: 'ADVANCED',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Kata Guruma'],
    description:
      'Loading the opponent across the back by gripping arm and ankle.',
    cues: [
      'Control one arm and the opposite ankle',
      'Duck under and load across shoulders',
      'Drive shoulder into their armpit',
      'Roll them over your back to finish',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=fireman+carry+wrestling+bjj+takedown',
  },
  {
    id: 509,
    name: 'Foot Sweep (De Ashi Barai)',
    categoryId: 5,
    difficulty: 'INTERMEDIATE',
    isCustom: false,
    gi: true,
    noGi: true,
    description:
      'Timing-based sweep that removes a stepping foot to take the opponent down cleanly.',
    cues: [
      'Attack as their weight shifts',
      'Use sleeve/collar pull to unbalance',
      'Sweep low at ankle line',
      'Direction of sweep follows their step',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=de+ashi+barai+bjj+judo',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/De-ashi-barai.jpg/640px-De-ashi-barai.jpg',
    referenceLinks: [
      {
        url: 'https://en.wikipedia.org/wiki/De_ashi_barai',
        label: 'Wikipedia: De-ashi-barai (Foot Sweep)',
      },
    ],
  },
  {
    id: 510,
    name: 'Snap Down to Front Headlock',
    categoryId: 5,
    difficulty: 'INTERMEDIATE',
    isCustom: false,
    gi: true,
    noGi: true,
    description:
      'Pulling opponent head and posture down to secure front headlock control and attacks.',
    cues: [
      'Pull with elbows not wrists',
      'Step back as you snap down',
      'Circle to angle off immediately',
      'Secure chin strap and elbow control',
      'For a back take instead of front headlock, circle laterally behind the hip rather than clamping down in front — see Snap Down to Back Take (511)',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=snap+down+front+headlock+bjj',
  },
  {
    id: 511,
    name: 'Snap Down to Back Take',
    categoryId: 5,
    difficulty: 'INTERMEDIATE',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Snap Down Back Take'],
    description:
      "A snap-down that, instead of landing in a front headlock, uses the opponent's momentum to spin directly behind them and secure back control. Distinguished from the Snap Down to Front Headlock by circling behind the hip rather than securing a front position.",
    cues: [
      'From a collar-tie, execute a sharp downward snap to break posture and drive the head below your hips',
      "As they post or scramble forward, release the head and step laterally behind their hip rather than clamping down in front",
      'Reach around the torso with the seatbelt grip (one arm over, one arm under) before they can stand back up',
      'Finish the back take by inserting both hooks for back control',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=snap+down+to+back+take+BJJ+takedown',
  },
  {
    id: 512,
    name: 'Arm Drag to Back Take',
    categoryId: 5,
    difficulty: 'INTERMEDIATE',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Arm Drag Back Take', 'Arm Drag'],
    description:
      'A takedown entry that uses a two-handed arm drag (wrist and tricep grip) to redirect the opponent\'s arm across the body and step behind them into back control. Highly adaptable from standing, seated, and butterfly guard.',
    cues: [
      'Grab the opponent\'s same-side wrist with a thumb-down grip; simultaneously reach deep to their tricep with your other hand',
      'Pull the arm sharply across your centreline while stepping your same-side foot laterally behind their hip — keep your head glued to their chest',
      'Wrap your outside arm around their waist and lock your hand on their far hip; this blocks their rotation',
      'Complete the back take by bringing them to the mat with a mat return or foot sweep, then insert hooks',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=arm+drag+to+back+take+BJJ+takedown',
  },

  // Escapes (6xx)
  {
    id: 601,
    name: 'Bridge and Roll (Upa)',
    categoryId: 6,
    difficulty: 'BEGINNER',
    isCustom: false,
    gi: true,
    noGi: true,
    description:
      'Explosive bridge from mount to roll the opponent, recovering guard or taking top.',
    cues: [
      'Trap one arm AND one leg on the same side',
      'Explosive bridge — think straight up, not arched',
      'Roll over the trapped shoulder',
      'Use feet to push off the floor for power',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=upa+bridge+roll+escape+mount+bjj',
  },
  {
    id: 602,
    name: 'Elbow-Knee Escape',
    categoryId: 6,
    difficulty: 'BEGINNER',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Elbow Escape', 'Shrimp Escape', 'Knee-Elbow Escape'],
    description:
      'Creating space by shrimping the hips out and replacing guard from underneath.',
    cues: [
      'Create a frame on the hip before shrimping',
      'Shrimp hips away — create space for knee',
      'Drive knee through to replace guard',
      'Stay on your side — never flat on your back',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=elbow+knee+escape+shrimp+bjj+mount',
  },
  {
    id: 603,
    name: 'Side Control Escape',
    categoryId: 6,
    difficulty: 'BEGINNER',
    isCustom: false,
    gi: true,
    noGi: true,
    description:
      'Using the shrimp movement to recover guard from side control.',
    cues: [
      'Frame on hip and neck simultaneously',
      'Bridge to create space to shrimp',
      'Shrimp hips away and replace guard knee',
      'Stay on your side throughout — not flat',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=side+control+escape+bjj+shrimp+recover+guard',
  },
  {
    id: 604,
    name: 'Back Escape',
    categoryId: 6,
    difficulty: 'INTERMEDIATE',
    isCustom: false,
    gi: true,
    noGi: true,
    description:
      'Protecting the neck, working the seat belt off, and recovering guard from back control.',
    cues: [
      'Priority one: protect your neck from the choke',
      'Strip the seat belt — fight the top arm first',
      'Rotate into them on the same side as their hooks',
      'Roll to guard as you create the angle',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=back+escape+bjj+seat+belt+recover+guard',
  },
  {
    id: 605,
    name: 'Guillotine Defense',
    categoryId: 6,
    difficulty: 'INTERMEDIATE',
    isCustom: false,
    gi: true,
    noGi: true,
    description:
      'Posturing up, turning into the choke, and finding the neck to escape a guillotine from top/mount or wrestling positions.',
    cues: [
      'Posture up immediately — do not tuck chin',
      'Turn toward the arm that is choking you',
      'Stack and drive forward to take pressure off',
      'Find their neck to control them as you escape',
      'This covers guillotines from top/mount wrestling positions; for guard-pull guillotine defense see Guillotine Escape from Guard Pull (611)',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=guillotine+choke+defense+escape+bjj',
  },
  {
    id: 606,
    name: 'Triangle Defense',
    categoryId: 6,
    difficulty: 'INTERMEDIATE',
    isCustom: false,
    gi: true,
    noGi: true,
    description:
      'Stacking, posturing, and using grip breaks to escape the triangle choke.',
    cues: [
      'Stack their hips immediately — take the weight off',
      'Posture upright — chin up, back straight',
      'Break their grip on your head or wrist',
      'Step over their leg to escape the triangle',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=triangle+choke+defense+escape+bjj',
  },
  {
    id: 607,
    name: 'Knee-On-Belly Escape',
    categoryId: 6,
    difficulty: 'BEGINNER',
    isCustom: false,
    gi: true,
    noGi: true,
    description:
      'Escape sequence to remove knee pressure and recover guard or half guard.',
    cues: [
      'Frame at their knee and hip',
      'Bridge then shrimp under pressure',
      'Catch their stepping leg for half guard',
      'Do not push with straight arms',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=knee+on+belly+escape+bjj',
  },
  {
    id: 608,
    name: 'Armbar Escape',
    categoryId: 6,
    difficulty: 'BEGINNER',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Armbar Defense', 'Stack Escape'],
    description:
      'A family of escapes from the armbar submission, with the stack defense being the primary option for beginners. Posture, thumb rotation, and body weight stacking combine to relieve elbow pressure and extract the arm.',
    cues: [
      'The instant the armbar is secured, grip your own forearm to create a two-arm connection and buy time',
      'Post on your toes and stack your chest downward onto the opponent, lifting their hips off the mat to remove the fulcrum',
      'Rotate your thumb upward (supinate) as you pull your elbow across their legs — this changes the angle and slips the elbow free',
      'Step your legs wide and base out to prevent them from re-closing on the arm',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=armbar+escape+BJJ+defense+stack+technique',
  },
  {
    id: 609,
    name: 'Triangle Escape',
    categoryId: 6,
    difficulty: 'BEGINNER',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Triangle Defense', 'Triangle Choke Escape'],
    description:
      'Posture-based escape from a triangle choke applied from guard. Stack, posture up, and break the grip before blood flow is cut off — time is the critical factor.',
    cues: [
      'Tuck the trapped arm\'s elbow toward your centreline immediately to slow the choke',
      'Posture up hard and stack the hips toward the opponent\'s head, loading your body weight to reduce their leverage',
      'Walk your feet toward them, straighten your back, and pop the lock by pushing their knee away with your free hand',
      'Once the lock breaks, pass the guard or secure a defensive position before they re-establish',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=triangle+choke+escape+BJJ+posture+stack',
  },
  {
    id: 610,
    name: 'Mounted Triangle Escape',
    categoryId: 6,
    difficulty: 'ADVANCED',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Defending Mounted Triangle', 'Top Triangle Escape'],
    description:
      'A last-resort escape from the mounted triangle — among the most difficult positions to escape from. Requires lifting the hips explosively and rotating to create separation before blood flow stops.',
    cues: [
      'Post your free arm under their armpit (not across the body) to prevent them from locking the arm into the triangle',
      'Lock your hands together and extend arms toward their far hip to create even minimal separation',
      'Explosively bridge your hips upward into their lower back while they are still adjusting the lock',
      'Step over their body to rotate — even landing in side control bottom is a victory over being choked',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=mounted+triangle+escape+BJJ+defense',
  },
  {
    id: 611,
    name: 'Guillotine Escape from Guard Pull',
    categoryId: 6,
    difficulty: 'INTERMEDIATE',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Guard Pull Guillotine Defense'],
    description:
      'Defense against a guillotine caught during the guard-pull phase or takedown transitions — distinct from guillotine defense from top/wrestling positions. The attacker has a head-and-arm grip as you go to the ground.',
    cues: [
      'The moment the guillotine is secured, tuck your chin hard to the shoulder of the trapped arm to protect the trachea',
      'Post both hands on their hips and posture up — never duck your head further in, which tightens the choke',
      'Walk your feet around toward the same side as the trapped arm (the arm-in side) to relieve pressure',
      'Once the angle is broken, reach your outside arm over their shoulder and pull down to break the grip',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=guillotine+escape+from+guard+pull+BJJ',
  },
  {
    id: 612,
    name: 'Granby Roll',
    categoryId: 6,
    difficulty: 'INTERMEDIATE',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Turtle Escape', 'Shoulder Roll Escape'],
    description:
      "An inversion escape from turtle position: rolling over one shoulder (without exposing the neck) to recover guard or reach a neutral scramble. Named after Granby High School wrestling.",
    cues: [
      'Tuck the rolling shoulder under; never expose the back of the neck — head stays down',
      'Keep the toes of the lead foot on the mat throughout to roll in a controlled straight line',
      'Drive hips and legs up and over in an arc; they should land toward the opponent to create immediate guard frames',
      'The moment hips hit the mat, shoot both legs out as guard frames — the roll is only complete when guard is re-established',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=granby+roll+turtle+escape+BJJ+guard+recovery',
  },
  {
    id: 613,
    name: 'Headlock Escape',
    categoryId: 6,
    difficulty: 'BEGINNER',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Side Headlock Escape', 'Kesa Gatame Escape'],
    description:
      'Escape from a seated side headlock (kesa gatame / scarf hold), where the opponent sits beside you controlling your head and arm. Uses bridging and hip movement to unbalance and recover.',
    cues: [
      'Protect the trapped arm by keeping it bent and close to the body — do not straighten it or the choke tightens',
      'Bridge into the opponent to load your weight onto them, then use the bridge momentum to roll them over your body',
      'If they post to stop the roll, shrimp your hips away in the opposite direction to free your head',
      'Once your head is free, immediately recover guard or scramble to a neutral position',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=headlock+escape+kesa+gatame+BJJ+tutorial',
  },

  // Positions (7xx)
  {
    id: 701,
    name: 'Mount',
    categoryId: 7,
    difficulty: 'BEGINNER',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Full Mount', 'Tate Shiho Gatame'],
    description:
      "Sitting on top of the opponent's torso — one of the most dominant positions in BJJ.",
    cues: [
      'High mount: hooks behind their arms',
      'Keep hips heavy — do not post up',
      'Control both arms to open submissions',
      'Anticipate the bridge — post foot to counter',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=mount+position+bjj+attacks+control',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Tate-shiho-gatame.jpg/640px-Tate-shiho-gatame.jpg',
    referenceLinks: [
      {
        url: 'https://en.wikipedia.org/wiki/Mount_(grappling)',
        label: 'Wikipedia: Mount (Grappling)',
      },
    ],
  },
  {
    id: 702,
    name: 'Side Control',
    categoryId: 7,
    difficulty: 'BEGINNER',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Side Mount', 'Cross Side', 'Yoko Shiho Gatame'],
    description:
      'Controlling the opponent from the side with chest-to-chest pressure.',
    cues: [
      'Chest pressure into their chest — not their arms',
      'Cross-face turns their head away',
      'Underhook controls their near arm',
      'Weight forward — keep them flat',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=side+control+bjj+submissions+transitions',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Yoko-shiho-gatame.jpg/640px-Yoko-shiho-gatame.jpg',
    referenceLinks: [
      {
        url: 'https://en.wikipedia.org/wiki/Side_control',
        label: 'Wikipedia: Side Control',
      },
    ],
  },
  {
    id: 703,
    name: 'Back Control',
    categoryId: 7,
    difficulty: 'INTERMEDIATE',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Back Mount', 'Rear Mount'],
    description:
      "Attaching to the opponent's back with hooks in, the most dangerous position in BJJ.",
    cues: [
      'Hooks in at hip height — not legs',
      'Seatbelt: palm-in on the choking arm',
      'Keep your hips lower than theirs',
      'Two-on-one control before going for the choke',
      'When the opponent attempts to escape, reassert the seatbelt and re-insert the bottom hook first; losing a hook is recoverable, losing the seatbelt usually loses the position',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=back+control+bjj+seat+belt+hooks+finishing',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Back_mount.jpg/640px-Back_mount.jpg',
    referenceLinks: [
      {
        url: 'https://en.wikipedia.org/wiki/Back_mount',
        label: 'Wikipedia: Back Mount',
      },
    ],
  },
  {
    id: 704,
    name: 'North-South',
    categoryId: 7,
    difficulty: 'INTERMEDIATE',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Kami Shiho Gatame'],
    description:
      'Controlling the opponent head-to-head, perpendicular to their body.',
    cues: [
      'Head control — crown of head into their chin',
      'Weight forward on their chest',
      'Control both arms against your hips',
      'Transition to Darce or kimura from here',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=north+south+position+bjj+control+submissions',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Kami-shiho-gatame.jpg/640px-Kami-shiho-gatame.jpg',
    referenceLinks: [
      {
        url: 'https://en.wikipedia.org/wiki/Kami-shiho-gatame',
        label: 'Wikipedia: Kami-shiho-gatame (North-South)',
      },
    ],
  },
  {
    id: 705,
    name: 'Knee on Belly',
    categoryId: 7,
    difficulty: 'BEGINNER',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Knee on Stomach', 'Knee Mount', 'Knee Ride'],
    description:
      "Driving the knee into the opponent's belly — a transitional and attacking position.",
    cues: [
      'Shin across the belly — not just the knee',
      'Far arm grip and collar grip for stability',
      'Ready to transition as they bridge and push',
      'Use pressure to force reactions for submissions',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=knee+on+belly+bjj+attacks+pressure',
    referenceLinks: [
      {
        url: 'https://en.wikipedia.org/wiki/Knee-on-stomach',
        label: 'Wikipedia: Knee-on-stomach',
      },
    ],
  },
  {
    id: 706,
    name: 'Turtle Position',
    categoryId: 7,
    difficulty: 'BEGINNER',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Turtle', "Referee's Position"],
    description:
      'Defensive position on all fours — the opponent must break it open to attack.',
    cues: [
      'Chin to chest — protect the neck always',
      'Post on head and hands for structure',
      'Look for the sit-out or roll to escape',
      'Never stay static — create movement to escape',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=turtle+position+bjj+attacks+defense',
    referenceLinks: [
      {
        url: 'https://en.wikipedia.org/wiki/Guard_(grappling)',
        label: 'Wikipedia: Guard (Grappling) — turtle discussed in context',
      },
    ],
  },
  {
    id: 707,
    name: 'Half Guard Top',
    categoryId: 7,
    difficulty: 'INTERMEDIATE',
    isCustom: false,
    gi: true,
    noGi: true,
    description:
      'Top control position while opponent has one leg trapped, ideal for pressure passing.',
    cues: [
      'Cross-face and underhook as priorities',
      'Flatten hips before freeing leg',
      'Walk knee line backward to clear trap',
      'Switch base when they knee shield',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=half+guard+top+position+bjj',
    referenceLinks: [
      {
        url: 'https://en.wikipedia.org/wiki/Half_guard',
        label: 'Wikipedia: Half Guard',
      },
    ],
  },
  {
    id: 708,
    name: 'S-Mount',
    categoryId: 7,
    difficulty: 'ADVANCED',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['S Mount', 'High Mount Variation', 'Technical Mount'],
    description:
      "An advanced mount variation where one knee is posted high near the opponent's ear while the opposite foot stays on the mat, forming an S-shape with the legs. This configuration isolates one arm and creates an extremely tight platform for armbar and triangle finishes.",
    cues: [
      "From high mount, wait for the opponent to push elbows upward as a frame — that gap is the S-mount entry window",
      'Slide (not step) one knee up to their ear along the mat; stepping gives them room to recover',
      'Close all space immediately after sliding; posting your opposite foot stabilises the position',
      'The armbar is the primary finish — the S position pre-loads the arm; move directly to it without resetting',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=S-mount+BJJ+entry+armbar+from+high+mount',
  },
  {
    id: 709,
    name: 'Crucifix',
    categoryId: 7,
    difficulty: 'ADVANCED',
    isCustom: false,
    gi: true,
    noGi: true,
    aliases: ['Crucifixion', 'Double Arm Control'],
    description:
      "A control position attacking a turtled opponent where one arm is trapped by the legs and the other by the hands, immobilising both of the opponent's arms simultaneously. Entry is typically from a sprawl or back attack on the turtle.",
    cues: [
      'From a sprawl or back-attack position, circle to one side and wedge your close knee into the turtle to open it',
      'Thread your near arm under their far arm, catching it with your elbow; your legs trap the near arm in a figure-four',
      'Maintain heavy chest-on-back pressure throughout; any space lets them pull their arm free',
      'Primary attacks: rear naked choke (free arm goes under the chin), collar/lapel choke, and kimura from the far arm',
    ],
    youtubeUrl:
      'https://www.youtube.com/results?search_query=crucifix+position+BJJ+attacks+turtled+opponent',
  },
]

export const prefilledConnections: TechniqueConnection[] = [
  // Closed Guard attacks
  { fromTechniqueId: 101, toTechniqueId: 401, connectionType: 'FOLLOW_UP' },
  { fromTechniqueId: 101, toTechniqueId: 402, connectionType: 'FOLLOW_UP' },
  { fromTechniqueId: 101, toTechniqueId: 403, connectionType: 'FOLLOW_UP' },
  { fromTechniqueId: 101, toTechniqueId: 404, connectionType: 'FOLLOW_UP' },
  { fromTechniqueId: 101, toTechniqueId: 406, connectionType: 'FOLLOW_UP' },
  { fromTechniqueId: 101, toTechniqueId: 301, connectionType: 'FOLLOW_UP' },
  { fromTechniqueId: 101, toTechniqueId: 302, connectionType: 'FOLLOW_UP' },
  { fromTechniqueId: 101, toTechniqueId: 303, connectionType: 'FOLLOW_UP' },
  // Submission combinations
  { fromTechniqueId: 402, toTechniqueId: 401, connectionType: 'FOLLOW_UP' },
  { fromTechniqueId: 402, toTechniqueId: 404, connectionType: 'FOLLOW_UP' },
  { fromTechniqueId: 402, toTechniqueId: 403, connectionType: 'FOLLOW_UP' }, // Triangle → Kimura when they posture out
  { fromTechniqueId: 401, toTechniqueId: 402, connectionType: 'FOLLOW_UP' },
  { fromTechniqueId: 401, toTechniqueId: 404, connectionType: 'TRANSITION' },
  { fromTechniqueId: 401, toTechniqueId: 403, connectionType: 'FOLLOW_UP' }, // Armbar → Kimura when they stack
  { fromTechniqueId: 403, toTechniqueId: 406, connectionType: 'FOLLOW_UP' },
  { fromTechniqueId: 403, toTechniqueId: 401, connectionType: 'FOLLOW_UP' },
  { fromTechniqueId: 403, toTechniqueId: 404, connectionType: 'FOLLOW_UP' }, // Kimura → Omoplata when they roll to escape
  { fromTechniqueId: 416, toTechniqueId: 401, connectionType: 'FOLLOW_UP' }, // Americana → Armbar when they post to escape
  { fromTechniqueId: 301, toTechniqueId: 403, connectionType: 'FOLLOW_UP' },
  // Half Guard
  { fromTechniqueId: 102, toTechniqueId: 403, connectionType: 'FOLLOW_UP' },
  { fromTechniqueId: 102, toTechniqueId: 406, connectionType: 'FOLLOW_UP' },
  { fromTechniqueId: 102, toTechniqueId: 111, connectionType: 'TRANSITION' }, // Half Guard → Z Guard (knee shield variant)
  { fromTechniqueId: 102, toTechniqueId: 304, connectionType: 'TRANSITION' }, // Half Guard → Butterfly Sweep (converting hooks)
  // Z Guard
  { fromTechniqueId: 111, toTechniqueId: 102, connectionType: 'TRANSITION' }, // Z Guard → Half Guard
  // Butterfly Guard
  { fromTechniqueId: 103, toTechniqueId: 304, connectionType: 'FOLLOW_UP' },
  { fromTechniqueId: 103, toTechniqueId: 411, connectionType: 'FOLLOW_UP' },
  { fromTechniqueId: 103, toTechniqueId: 403, connectionType: 'FOLLOW_UP' },
  { fromTechniqueId: 103, toTechniqueId: 402, connectionType: 'FOLLOW_UP' }, // Butterfly → Triangle (feet to biceps)
  // De La Riva
  { fromTechniqueId: 105, toTechniqueId: 306, connectionType: 'FOLLOW_UP' },
  { fromTechniqueId: 105, toTechniqueId: 307, connectionType: 'FOLLOW_UP' },
  { fromTechniqueId: 105, toTechniqueId: 703, connectionType: 'TRANSITION' },
  // X-Guard
  { fromTechniqueId: 106, toTechniqueId: 305, connectionType: 'FOLLOW_UP' },
  { fromTechniqueId: 106, toTechniqueId: 109, connectionType: 'TRANSITION' }, // X-Guard → SLX (single-leg version)
  // SLX → leg locks
  { fromTechniqueId: 109, toTechniqueId: 409, connectionType: 'FOLLOW_UP' },
  { fromTechniqueId: 109, toTechniqueId: 407, connectionType: 'FOLLOW_UP' },
  { fromTechniqueId: 109, toTechniqueId: 408, connectionType: 'FOLLOW_UP' },
  { fromTechniqueId: 109, toTechniqueId: 305, connectionType: 'TRANSITION' }, // SLX → X-Guard Sweep (converting to full X)
  { fromTechniqueId: 112, toTechniqueId: 407, connectionType: 'FOLLOW_UP' },
  { fromTechniqueId: 112, toTechniqueId: 408, connectionType: 'FOLLOW_UP' },
  // Rubber Guard
  { fromTechniqueId: 108, toTechniqueId: 404, connectionType: 'FOLLOW_UP' }, // Mission Control → Omoplata
  { fromTechniqueId: 108, toTechniqueId: 402, connectionType: 'FOLLOW_UP' }, // Rubber Guard → Triangle
  // Worm Guard
  { fromTechniqueId: 110, toTechniqueId: 306, connectionType: 'FOLLOW_UP' }, // Worm Guard → Berimbolo
  // Spider Guard
  { fromTechniqueId: 104, toTechniqueId: 402, connectionType: 'FOLLOW_UP' },
  { fromTechniqueId: 104, toTechniqueId: 308, connectionType: 'FOLLOW_UP' },
  { fromTechniqueId: 104, toTechniqueId: 309, connectionType: 'FOLLOW_UP' }, // Spider Guard → Lumberjack Sweep
  // Lasso Guard
  { fromTechniqueId: 107, toTechniqueId: 404, connectionType: 'FOLLOW_UP' },
  { fromTechniqueId: 107, toTechniqueId: 402, connectionType: 'FOLLOW_UP' },
  { fromTechniqueId: 107, toTechniqueId: 308, connectionType: 'FOLLOW_UP' }, // Lasso → Tripod Sweep
  // From Mount
  { fromTechniqueId: 701, toTechniqueId: 401, connectionType: 'FOLLOW_UP' },
  { fromTechniqueId: 701, toTechniqueId: 402, connectionType: 'FOLLOW_UP' },
  { fromTechniqueId: 701, toTechniqueId: 403, connectionType: 'FOLLOW_UP' }, // Mount → Kimura
  { fromTechniqueId: 701, toTechniqueId: 414, connectionType: 'FOLLOW_UP' },
  { fromTechniqueId: 701, toTechniqueId: 415, connectionType: 'FOLLOW_UP' },
  { fromTechniqueId: 701, toTechniqueId: 416, connectionType: 'FOLLOW_UP' },
  { fromTechniqueId: 701, toTechniqueId: 417, connectionType: 'FOLLOW_UP' }, // Mount → Arm Triangle
  { fromTechniqueId: 701, toTechniqueId: 703, connectionType: 'TRANSITION' }, // Mount → Back Control (when they roll)
  { fromTechniqueId: 701, toTechniqueId: 601, connectionType: 'COUNTER' },
  { fromTechniqueId: 701, toTechniqueId: 602, connectionType: 'COUNTER' },
  // From Side Control
  { fromTechniqueId: 702, toTechniqueId: 403, connectionType: 'FOLLOW_UP' },
  { fromTechniqueId: 702, toTechniqueId: 416, connectionType: 'FOLLOW_UP' },
  { fromTechniqueId: 702, toTechniqueId: 417, connectionType: 'FOLLOW_UP' }, // Side Control → Arm Triangle
  { fromTechniqueId: 702, toTechniqueId: 411, connectionType: 'FOLLOW_UP' }, // Side Control → Darce (when they turtle)
  { fromTechniqueId: 702, toTechniqueId: 704, connectionType: 'TRANSITION' },
  { fromTechniqueId: 702, toTechniqueId: 705, connectionType: 'TRANSITION' },
  { fromTechniqueId: 702, toTechniqueId: 701, connectionType: 'TRANSITION' },
  { fromTechniqueId: 702, toTechniqueId: 707, connectionType: 'TRANSITION' }, // Side Control → Half Guard Top (when they re-half guard)
  { fromTechniqueId: 702, toTechniqueId: 603, connectionType: 'COUNTER' },
  // From Back Control
  { fromTechniqueId: 703, toTechniqueId: 405, connectionType: 'FOLLOW_UP' },
  { fromTechniqueId: 703, toTechniqueId: 413, connectionType: 'FOLLOW_UP' },
  { fromTechniqueId: 703, toTechniqueId: 604, connectionType: 'COUNTER' }, // Back Control → Back Escape
  // North-South
  { fromTechniqueId: 704, toTechniqueId: 403, connectionType: 'FOLLOW_UP' },
  { fromTechniqueId: 704, toTechniqueId: 412, connectionType: 'FOLLOW_UP' },
  { fromTechniqueId: 704, toTechniqueId: 418, connectionType: 'FOLLOW_UP' },
  { fromTechniqueId: 704, toTechniqueId: 702, connectionType: 'TRANSITION' }, // North-South → Side Control
  // Knee on Belly
  { fromTechniqueId: 705, toTechniqueId: 401, connectionType: 'FOLLOW_UP' },
  { fromTechniqueId: 705, toTechniqueId: 402, connectionType: 'FOLLOW_UP' },
  { fromTechniqueId: 705, toTechniqueId: 403, connectionType: 'FOLLOW_UP' },
  { fromTechniqueId: 705, toTechniqueId: 701, connectionType: 'TRANSITION' }, // KoB → Mount (stepping over)
  { fromTechniqueId: 705, toTechniqueId: 702, connectionType: 'TRANSITION' }, // KoB → Side Control (when they push knee away)
  { fromTechniqueId: 705, toTechniqueId: 607, connectionType: 'COUNTER' }, // KoB → Knee-on-Belly Escape
  // Half Guard Top
  { fromTechniqueId: 707, toTechniqueId: 701, connectionType: 'TRANSITION' }, // Half Guard Top → Mount (after passing)
  { fromTechniqueId: 707, toTechniqueId: 702, connectionType: 'TRANSITION' }, // Half Guard Top → Side Control
  // Takedowns → positions
  { fromTechniqueId: 501, toTechniqueId: 702, connectionType: 'TRANSITION' },
  { fromTechniqueId: 502, toTechniqueId: 702, connectionType: 'TRANSITION' },
  { fromTechniqueId: 503, toTechniqueId: 702, connectionType: 'TRANSITION' },
  { fromTechniqueId: 504, toTechniqueId: 702, connectionType: 'TRANSITION' },
  { fromTechniqueId: 505, toTechniqueId: 702, connectionType: 'TRANSITION' }, // Uchi Mata → Side Control
  { fromTechniqueId: 506, toTechniqueId: 702, connectionType: 'TRANSITION' },
  { fromTechniqueId: 507, toTechniqueId: 702, connectionType: 'TRANSITION' }, // Ankle Pick → Side Control
  { fromTechniqueId: 508, toTechniqueId: 702, connectionType: 'TRANSITION' }, // Fireman's Carry → Side Control
  { fromTechniqueId: 509, toTechniqueId: 702, connectionType: 'TRANSITION' }, // Foot Sweep → Side Control
  // Snap Down → front headlock attacks
  { fromTechniqueId: 510, toTechniqueId: 706, connectionType: 'TRANSITION' }, // Snap Down → Turtle (opponent turtles up)
  { fromTechniqueId: 510, toTechniqueId: 411, connectionType: 'FOLLOW_UP' }, // Snap Down → Darce Choke
  { fromTechniqueId: 510, toTechniqueId: 412, connectionType: 'FOLLOW_UP' }, // Snap Down → Anaconda Choke
  // Guard passes → positions
  { fromTechniqueId: 201, toTechniqueId: 702, connectionType: 'TRANSITION' },
  { fromTechniqueId: 202, toTechniqueId: 702, connectionType: 'TRANSITION' },
  { fromTechniqueId: 203, toTechniqueId: 702, connectionType: 'TRANSITION' },
  { fromTechniqueId: 204, toTechniqueId: 702, connectionType: 'TRANSITION' },
  { fromTechniqueId: 205, toTechniqueId: 702, connectionType: 'TRANSITION' },
  { fromTechniqueId: 206, toTechniqueId: 702, connectionType: 'TRANSITION' }, // Smash Pass → Side Control
  { fromTechniqueId: 207, toTechniqueId: 702, connectionType: 'TRANSITION' }, // Bullfighter Pass → Side Control
  { fromTechniqueId: 209, toTechniqueId: 707, connectionType: 'TRANSITION' },
  { fromTechniqueId: 210, toTechniqueId: 702, connectionType: 'TRANSITION' },
  { fromTechniqueId: 208, toTechniqueId: 407, connectionType: 'FOLLOW_UP' },
  { fromTechniqueId: 208, toTechniqueId: 409, connectionType: 'FOLLOW_UP' },
  { fromTechniqueId: 208, toTechniqueId: 408, connectionType: 'FOLLOW_UP' },
  // Turtle attacks
  { fromTechniqueId: 706, toTechniqueId: 411, connectionType: 'FOLLOW_UP' },
  { fromTechniqueId: 706, toTechniqueId: 412, connectionType: 'FOLLOW_UP' },
  { fromTechniqueId: 706, toTechniqueId: 703, connectionType: 'TRANSITION' },
  // Escapes → guard recovery
  { fromTechniqueId: 601, toTechniqueId: 101, connectionType: 'TRANSITION' },
  { fromTechniqueId: 601, toTechniqueId: 102, connectionType: 'TRANSITION' }, // Bridge & Roll often lands in half guard
  { fromTechniqueId: 602, toTechniqueId: 101, connectionType: 'TRANSITION' },
  { fromTechniqueId: 602, toTechniqueId: 102, connectionType: 'TRANSITION' }, // Elbow-Knee often recovers to half guard first
  { fromTechniqueId: 603, toTechniqueId: 102, connectionType: 'TRANSITION' }, // Side Control Escape → Half Guard
  { fromTechniqueId: 604, toTechniqueId: 101, connectionType: 'TRANSITION' },
  // Submission counters (the escape technique counters the submission)
  { fromTechniqueId: 406, toTechniqueId: 605, connectionType: 'COUNTER' }, // Guillotine → Guillotine Defense
  { fromTechniqueId: 402, toTechniqueId: 606, connectionType: 'COUNTER' }, // Triangle → Triangle Defense
  // Berimbolo → back
  { fromTechniqueId: 306, toTechniqueId: 703, connectionType: 'TRANSITION' },
  // Anaconda → back (roll-through finish)
  { fromTechniqueId: 412, toTechniqueId: 703, connectionType: 'TRANSITION' },
  // SETUP connections — feints and opportunities
  { fromTechniqueId: 302, toTechniqueId: 301, connectionType: 'SETUP' }, // Scissor Sweep threat sets up Hip Bump
  { fromTechniqueId: 301, toTechniqueId: 302, connectionType: 'SETUP' }, // Hip Bump threat sets up Scissor Sweep
  { fromTechniqueId: 501, toTechniqueId: 502, connectionType: 'SETUP' }, // Double Leg shot sets up Single Leg
  { fromTechniqueId: 502, toTechniqueId: 501, connectionType: 'SETUP' }, // Single Leg level-change sets up Double Leg

  // New connections — sweeps
  { fromTechniqueId: 102, toTechniqueId: 311, connectionType: 'FOLLOW_UP' }, // Half Guard → Old School Sweep
  { fromTechniqueId: 311, toTechniqueId: 703, connectionType: 'TRANSITION' }, // Old School Sweep → Back Control (opponent defends)
  { fromTechniqueId: 101, toTechniqueId: 312, connectionType: 'FOLLOW_UP' }, // Closed Guard → Kimura Sweep
  { fromTechniqueId: 312, toTechniqueId: 403, connectionType: 'TRANSITION' }, // Kimura Sweep → Kimura (same grip)
  { fromTechniqueId: 403, toTechniqueId: 312, connectionType: 'SETUP' },     // Kimura threat opens the sweep
  { fromTechniqueId: 312, toTechniqueId: 402, connectionType: 'FOLLOW_UP' }, // Kimura Sweep → Triangle (opponent defends)
  { fromTechniqueId: 102, toTechniqueId: 313, connectionType: 'FOLLOW_UP' }, // Half Guard → John Wayne Sweep
  { fromTechniqueId: 111, toTechniqueId: 313, connectionType: 'FOLLOW_UP' }, // Z Guard → John Wayne Sweep
  { fromTechniqueId: 313, toTechniqueId: 311, connectionType: 'SETUP' },     // John Wayne ↔ Old School (mutual setups)

  // New connections — submissions
  { fromTechniqueId: 101, toTechniqueId: 419, connectionType: 'FOLLOW_UP' }, // Closed Guard → Reverse Armbar
  { fromTechniqueId: 419, toTechniqueId: 401, connectionType: 'TRANSITION' }, // Reverse Armbar → standard Armbar
  { fromTechniqueId: 401, toTechniqueId: 419, connectionType: 'SETUP' },     // Standard Armbar threat exposes reverse
  { fromTechniqueId: 109, toTechniqueId: 420, connectionType: 'FOLLOW_UP' }, // SLX → Toe Hold
  { fromTechniqueId: 106, toTechniqueId: 420, connectionType: 'FOLLOW_UP' }, // X-Guard → Toe Hold
  { fromTechniqueId: 420, toTechniqueId: 407, connectionType: 'TRANSITION' }, // Toe Hold → Outside Heel Hook
  { fromTechniqueId: 706, toTechniqueId: 421, connectionType: 'FOLLOW_UP' }, // Turtle → Calf Slicer
  { fromTechniqueId: 106, toTechniqueId: 421, connectionType: 'FOLLOW_UP' }, // X-Guard → Calf Slicer
  { fromTechniqueId: 421, toTechniqueId: 408, connectionType: 'TRANSITION' }, // Calf Slicer → Inside Heel Hook
  { fromTechniqueId: 701, toTechniqueId: 422, connectionType: 'FOLLOW_UP' }, // Mount → Mounted Triangle
  { fromTechniqueId: 422, toTechniqueId: 401, connectionType: 'FOLLOW_UP' }, // Mounted Triangle → Armbar
  { fromTechniqueId: 610, toTechniqueId: 422, connectionType: 'COUNTER' },   // Mounted Triangle Escape counters Mounted Triangle
  { fromTechniqueId: 422, toTechniqueId: 610, connectionType: 'COUNTER' },   // Reciprocal

  // New connections — takedowns
  { fromTechniqueId: 511, toTechniqueId: 703, connectionType: 'TRANSITION' }, // Snap Down Back Take → Back Control
  { fromTechniqueId: 510, toTechniqueId: 511, connectionType: 'TRANSITION' }, // Snap Down Front HL → Snap Down Back Take
  { fromTechniqueId: 512, toTechniqueId: 703, connectionType: 'TRANSITION' }, // Arm Drag → Back Control
  { fromTechniqueId: 512, toTechniqueId: 405, connectionType: 'FOLLOW_UP' }, // Arm Drag → RNC

  // New connections — escapes (reciprocal counters)
  { fromTechniqueId: 608, toTechniqueId: 401, connectionType: 'COUNTER' },   // Armbar Escape counters Armbar
  { fromTechniqueId: 401, toTechniqueId: 608, connectionType: 'COUNTER' },   // Reciprocal
  { fromTechniqueId: 609, toTechniqueId: 402, connectionType: 'COUNTER' },   // Triangle Escape counters Triangle
  { fromTechniqueId: 402, toTechniqueId: 609, connectionType: 'COUNTER' },   // Reciprocal
  { fromTechniqueId: 611, toTechniqueId: 406, connectionType: 'COUNTER' },   // Guillotine Escape GP counters Guillotine
  { fromTechniqueId: 406, toTechniqueId: 611, connectionType: 'COUNTER' },   // Reciprocal
  { fromTechniqueId: 612, toTechniqueId: 706, connectionType: 'COUNTER' },   // Granby Roll escapes turtle
  { fromTechniqueId: 612, toTechniqueId: 101, connectionType: 'TRANSITION' }, // Granby Roll recovers closed guard
  { fromTechniqueId: 613, toTechniqueId: 702, connectionType: 'COUNTER' },   // Headlock Escape counters side headlock

  // New connections — new guards
  { fromTechniqueId: 105, toTechniqueId: 113, connectionType: 'TRANSITION' }, // DLR → Reverse DLR (rotate hook)
  { fromTechniqueId: 113, toTechniqueId: 703, connectionType: 'FOLLOW_UP' }, // RDLR → Back Control (Kiss of the Dragon)
  { fromTechniqueId: 113, toTechniqueId: 109, connectionType: 'TRANSITION' }, // RDLR → Single Leg X
  { fromTechniqueId: 113, toTechniqueId: 407, connectionType: 'FOLLOW_UP' }, // RDLR → Outside Heel Hook
  { fromTechniqueId: 109, toTechniqueId: 114, connectionType: 'TRANSITION' }, // SLX → 50/50
  { fromTechniqueId: 114, toTechniqueId: 409, connectionType: 'FOLLOW_UP' }, // 50/50 → Straight Ankle Lock
  { fromTechniqueId: 114, toTechniqueId: 407, connectionType: 'FOLLOW_UP' }, // 50/50 → Outside Heel Hook
  { fromTechniqueId: 114, toTechniqueId: 408, connectionType: 'FOLLOW_UP' }, // 50/50 → Inside Heel Hook
  { fromTechniqueId: 114, toTechniqueId: 420, connectionType: 'FOLLOW_UP' }, // 50/50 → Toe Hold
  { fromTechniqueId: 102, toTechniqueId: 115, connectionType: 'TRANSITION' }, // Half Guard → Deep Half Guard
  { fromTechniqueId: 115, toTechniqueId: 702, connectionType: 'FOLLOW_UP' }, // Deep Half → Side Control (waiter sweep)
  { fromTechniqueId: 115, toTechniqueId: 703, connectionType: 'FOLLOW_UP' }, // Deep Half → Back Control
  { fromTechniqueId: 115, toTechniqueId: 421, connectionType: 'FOLLOW_UP' }, // Deep Half → Calf Slicer

  // New connections — guard-to-guard transitions
  { fromTechniqueId: 101, toTechniqueId: 102, connectionType: 'TRANSITION' }, // Closed Guard → Half Guard (retention)
  { fromTechniqueId: 101, toTechniqueId: 103, connectionType: 'TRANSITION' }, // Closed Guard → Butterfly Guard
  { fromTechniqueId: 102, toTechniqueId: 103, connectionType: 'TRANSITION' }, // Half Guard → Butterfly Guard

  // New connections — positions
  { fromTechniqueId: 701, toTechniqueId: 708, connectionType: 'TRANSITION' }, // Mount → S-Mount
  { fromTechniqueId: 708, toTechniqueId: 401, connectionType: 'FOLLOW_UP' }, // S-Mount → Armbar
  { fromTechniqueId: 708, toTechniqueId: 402, connectionType: 'FOLLOW_UP' }, // S-Mount → Triangle
  { fromTechniqueId: 708, toTechniqueId: 422, connectionType: 'TRANSITION' }, // S-Mount → Mounted Triangle
  { fromTechniqueId: 706, toTechniqueId: 709, connectionType: 'TRANSITION' }, // Turtle → Crucifix
  { fromTechniqueId: 709, toTechniqueId: 405, connectionType: 'FOLLOW_UP' }, // Crucifix → RNC
  { fromTechniqueId: 709, toTechniqueId: 403, connectionType: 'FOLLOW_UP' }, // Crucifix → Kimura
  { fromTechniqueId: 709, toTechniqueId: 703, connectionType: 'TRANSITION' }, // Crucifix → Back Control
]
