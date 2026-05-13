import type { LanguagePack, TranslationKey } from './types'

const FR_TRANSLATIONS = {
  Home: 'Accueil',
  Sessions: 'Sessions',
  Techniques: 'Techniques',
  Settings: 'Paramètres',
  'Track your journey on the mats': 'Suivez votre progression sur les tatamis',
  'YOUR STATS': 'VOS STATS',
  'Mat Time': 'Temps sur tatami',
  'Taps Given': 'Soumissions réussies',
  'Taps Received': 'Soumissions subies',
  'PRACTICE SESSIONS': 'SÉANCES PRATIQUÉES',
  'QUICK ACCESS': 'ACCÈS RAPIDE',
  TRENDING: 'TENDANCES',
  'Training Sessions': "Sessions d'entraînement",
  'Log and review your mat time': 'Enregistrez et consultez votre temps sur tatami',
  'Technique Library': 'Bibliothèque de techniques',
  '60+ techniques with YouTube refs': '60+ techniques avec références YouTube',
  Categories: 'Catégories',
  Clubs: 'Clubs',
  'No clubs yet. Add one above.': 'Aucun club pour le moment. Ajoutez-en un ci-dessus.',
  'ADD CLUB': 'AJOUTER UN CLUB',
  'e.g. Main Dojo': 'ex. Dojo principal',
  'Add Club': 'Ajouter un club',
  Save: 'Enregistrer',
  Cancel: 'Annuler',
  Edit: 'Modifier',
  Delete: 'Supprimer',
  'Move up': 'Monter',
  'Move down': 'Descendre',
  Order: 'Ordre',
  'THEME MODE': 'MODE THÈME',
  Black: 'Sombre',
  Light: 'Clair',
  'Session type': 'Type de session',
  'Customize icons for each session type': 'Personnalisez les icônes pour chaque type de session',
  'Manage technique categories and icons': 'Gérez les catégories et icônes des techniques',
  'Manage your training locations': "Gérez vos lieux d'entraînement",
  Language: 'Langue',
  English: 'Anglais',
  Spanish: 'Espagnol',
  French: 'Français',
  'Search…': 'Rechercher…',
  'SESSION TYPE ICONS': 'ICÔNES DE TYPE DE SESSION',
  'Tap + to log your first training': 'Touchez + pour enregistrer votre premier entraînement',
  'No sessions yet': 'Aucune session pour le moment',
  DATE: 'DATE',
  DURATION: 'DURÉE',
  'SESSION TYPE': 'TYPE DE SESSION',
  CLUB: 'CLUB',
  Manage: 'Gérer',
  Another: 'Autre',
  Custom: 'Personnalisé',
  Minutes: 'Minutes',
  'ENERGY LEVEL': "NIVEAU D'ÉNERGIE",
  Exhausted: 'Épuisé',
  Low: 'Faible',
  Average: 'Moyen',
  Good: 'Bon',
  Peak: 'Maximum',
  'TECHNIQUES PRACTICED': 'TECHNIQUES PRATIQUÉES',
  'Add techniques…': 'Ajouter des techniques…',
  'TAPS / SUBMISSIONS': 'SOUMISSIONS',
  'Github repo': 'Dépôt Github',
  Given: 'Réussies',
  Received: 'Subies',
  NOTES: 'NOTES',
  'What clicked? What to fix?': 'Ce qui a cliqué ? Quoi corriger ?',
  'What did you work on? Any insights?': 'Sur quoi avez-vous travaillé ? Des observations ?',
  'Select Techniques': 'Sélectionner des techniques',
  'Select Technique — Tap Given': 'Sélectionner une technique — Soumission réussie',
  'Select Technique — Tap Received': 'Sélectionner une technique — Soumission subie',
  Done: 'Terminé',
  'Search techniques…': 'Rechercher des techniques…',
  'Search sessions…': 'Rechercher des sessions…',
  'Search sessions': 'Rechercher des sessions',
  'Search all icons…': 'Rechercher tous les icônes…',
  'Add new technique…': 'Ajouter une nouvelle technique…',
  'NEW TECHNIQUE': 'NOUVELLE TECHNIQUE',
  Add: 'Ajouter',
  'Technique name': 'Nom de la technique',
  'Log Session': 'Enregistrer la session',
  'Edit Session': 'Modifier la session',
  Duration: 'Durée',
  Energy: 'Énergie',
  Club: 'Club',
  Notes: 'Notes',
  'No techniques logged for this session.': 'Aucune technique enregistrée pour cette session.',
  Unknown: 'Inconnue',
  'Taps / Submissions': 'Soumissions',
  'New Technique': 'Nouvelle technique',
  'Edit Technique': 'Modifier la technique',
  NAME: 'NOM',
  CATEGORY: 'CATÉGORIE',
  DIFFICULTY: 'DIFFICULTÉ',
  DESCRIPTION: 'DESCRIPTION',
  'YOUTUBE URL': 'URL YOUTUBE',
  'COACHING CUES': 'CONSEILS TECHNIQUES',
  'TECHNIQUE CONNECTIONS': 'CONNEXIONS ENTRE TECHNIQUES',
  'No connections yet.': 'Aucune connexion pour le moment.',
  'Unknown technique': 'Technique inconnue',
  Remove: 'Retirer',
  'Request a feature': 'Suggérer une fonctionnalité',
  'Select connected technique…': 'Sélectionner une technique connectée…',
  'Add Connection': 'Ajouter une connexion',
  'Delete Technique': 'Supprimer la technique',
  'Watch on YouTube': 'Regarder sur YouTube',
  'Leads To / Follow-ups': 'Mène à / Suites',
  'Can Be Set Up From': 'Peut être préparé depuis',
  Clear: 'Effacer',
  Filter: 'Filtrer',
  FILTERS: 'FILTRES',
  'Weekly goal': 'Objectif hebdomadaire',
  'Avg taps': 'Moy. soumissions',
  weeks: 'semaines',
  'w.': 's.',
  'FOCUS TECHNIQUES': 'TECHNIQUES CIBLES',
  'Set focus': 'Définir focus',
  'Select focus techniques': 'Sélectionner les techniques cibles',
  'No focus techniques selected': 'Aucune technique cible sélectionnée',
  'Given submissions': 'soumissions réussies',
  Submissions: 'soumissions',
  Icons: 'Icônes',
  Emoji: 'Émoji',
  Suggested: 'Suggéré',
  'All Icons': 'Tous les icônes',
  'Paste or type an emoji': 'Collez ou saisissez un émoji',
  'e.g. 🥋': 'ex. 🥋',
  Suggestions: 'Suggestions',
  Use: 'Utiliser',
  All: 'Tout',
  min: 'min',
  'TRAINING CALENDAR': "CALENDRIER D'ENTRAÎNEMENT",
  'White Belt': 'Ceinture blanche',
  'Blue Belt': 'Ceinture bleue',
  'Purple Belt': 'Ceinture violette',
  'Brown Belt': 'Ceinture marron',
  'Black Belt': 'Ceinture noire',
  'Previous month': 'Mois précédent',
  'Next month': 'Mois suivant',
  Mon: 'Lun',
  Tue: 'Mar',
  Wed: 'Mer',
  Thu: 'Jeu',
  Fri: 'Ven',
  Sat: 'Sam',
  Sun: 'Dim',
  'Section unavailable': 'Section non disponible',
  'Hide section': 'Masquer la section',
  'Show section': 'Afficher la section',
  'No matching sessions': 'Aucune session correspondante',
  'Try a different search or filter': 'Essayez une autre recherche ou un autre filtre',
  'Try again': 'Réessayer',
  'Storage full': 'Stockage plein',
  'Your device storage is full. Export a backup to free up space.':
    "Le stockage de votre appareil est plein. Exportez une sauvegarde pour libérer de l'espace.",
  'Export backup': 'Exporter la sauvegarde',
  Dismiss: 'Fermer',
  // Settings section headings & labels
  'YOUR BELT': 'VOTRE CEINTURE',
  'THEME & LANGUAGE': 'THÈME & LANGUE',
  Theme: 'Thème',
  Dark: 'Sombre',
  Stripes: 'Barrettes',
  'HOME SECTION ORDER': "ORDRE DE L'ACCUEIL",
  'Reorder the sections on the home screen and hide the ones you do not want to see.':
    "Réorganisez les sections de l'écran d'accueil et masquez celles que vous ne souhaitez pas voir.",
  'WEEKLY MAT TIME GOAL': 'OBJECTIF HEBDOMADAIRE',
  'Default:': 'Par défaut :',
  'Reset pre-filled techniques': 'Réinitialiser les techniques prédéfinies',
  'Only pre-filled techniques and links are reset; custom techniques are kept.':
    'Seules les techniques et connexions prédéfinies sont réinitialisées ; les personnalisées sont conservées.',
  'BACKUP & RECOVERY': 'SAUVEGARDE & RÉCUPÉRATION',
  'Export JSON': 'Exporter JSON',
  'Import JSON': 'Importer JSON',
  'Use export/import to recover your data if browser storage is lost.':
    'Utilisez exporter/importer pour récupérer vos données si le stockage du navigateur est perdu.',
  'LOCAL LOGGING': 'JOURNAL LOCAL',
  'Logged events:': 'Événements enregistrés :',
  'Clear logs': 'Effacer les journaux',
  'App version:': "Version de l'application :",
  'Developed by:': 'Développé par :',
  // Alert messages
  'Backup imported successfully.': 'Sauvegarde importée avec succès.',
  'Could not import backup.': "Impossible d'importer la sauvegarde.",
  'Reset all pre-filled techniques?\nYour custom techniques will be preserved.':
    'Réinitialiser toutes les techniques prédéfinies ?\nVos techniques personnalisées seront conservées.',
  'Pre-filled techniques were reset successfully.': 'Les techniques prédéfinies ont été réinitialisées avec succès.',
  'Could not reset techniques.': 'Impossible de réinitialiser les techniques.',
} satisfies Record<TranslationKey, string>

const FR_CATEGORY_CONTENT: LanguagePack['categoryContent'] = {
  1: { name: 'Gardes', description: "Positions sur le dos en contrôlant l'adversaire" },
  2: { name: 'Passage de garde', description: "Techniques pour contourner la garde de l'adversaire" },
  3: { name: 'Balayages', description: 'Renversements depuis la position inférieure vers la supérieure' },
  4: { name: 'Soumissions', description: 'Techniques de finition — étranglements et clés articulaires' },
  5: { name: 'Projections', description: 'Amener le combat au sol' },
  6: { name: 'Échappées', description: 'Récupérer depuis les mauvaises positions' },
  7: { name: 'Positions', description: 'Positions de contrôle dominant' },
}

const FR_TECHNIQUE_CONTENT: LanguagePack['techniqueContent'] = {
  // Guards (1xx)
  101: {
    description: "Garde classique avec les jambes verrouillées derrière le dos de l'adversaire, contrôlant la posture et créant des angles d'attaque.",
    cues: ["Briser la posture avant d'attaquer", "Les hanches en l'air créent de l'espace pour les soumissions", 'Utiliser des angles diagonaux pour les attaques de bras', 'Combattre constamment pour le contrôle du poignet'],
  },
  102: {
    description: "Une jambe piège une jambe de l'adversaire, offrant une rétention de garde et des opportunités de balayage.",
    cues: ['Le croc est essentiel — se battre pour le conserver à chaque fois', 'Empêcher le cross-face à tout prix', 'Rester sur le côté, jamais à plat sur le dos', 'Hanches vers eux pour préparer le balayage'],
  },
  103: {
    description: "Garde assise utilisant les crochets (cous-de-pied) contre les cuisses de l'adversaire pour déséquilibrer et balayer.",
    cues: ['Rester droit — ne pas se pencher en arrière', 'Les deux crochets engagent les cuisses internes', "Déséquilibrer d'un côté avant de soulever", 'Croc ou contrôle de tête pour créer un angle'],
  },
  104: {
    description: "Saisir les manches de l'adversaire tout en utilisant les pieds sur les biceps pour contrôler la distance et attaquer.",
    cues: ['Prise de manche complète, pieds sur les biceps pas les avant-bras', 'Étendre complètement avant de tirer pour briser la posture', 'Frapper la hanche simultanément avec la traction', 'Pivoter les hanches pour les entrées en triangle et omoplata'],
  },
  105: {
    description: "Un crochet sur l'extérieur de la jambe de l'adversaire avec contrôle de la manche et de la cheville.",
    cues: ["Crochet profond autour de l'extérieur de la jambe", 'Contrôler la manche et le revers lointain ou la cheville proche', 'Maintenir la distance — ne pas se faire écraser', 'Berimbolo ou prise de dos quand ils avancent'],
  },
  106: {
    description: "Les deux crochets sous les cuisses de l'adversaire en forme de X, créant un déséquilibre extrême pour les balayages.",
    cues: ["S'asseoir vers eux pour entrer", "Les deux crochets sous les cuisses — pousser dans des directions opposées", 'Étendre les jambes pour détruire leur base', "Pousser d'une jambe pour établir la direction du balayage"],
  },
  107: {
    description: "Enrouler le bras dans un lasso avec la jambe pour immobiliser le bras et créer des angles d'attaque.",
    cues: ["Lasso au-dessus du coude pour un contrôle maximal", 'Pousser la hanche avec le pied libre', "Forcer des problèmes de posture pour ouvrir des angles de soumission", 'Transition vers omoplata ou triangle quand ils se redressent'],
  },
  108: {
    description: 'Position de garde haute avec la jambe derrière la nuque, popularisée par Eddie Bravo.',
    cues: ['Prérequis de flexibilité — étirer régulièrement', 'Verrouiller la jambe derrière la nuque avant de saisir le poignet', 'Le mission control contrôle totalement la posture', 'Progresser dans le système : New York, Jiu Claw, Omoplata'],
  },
  109: {
    description: "Un crochet entre les jambes de l'adversaire contrôlant une seule jambe pour les balayages et entrées en clé de jambe.",
    cues: ["Établir l'ashi garami — crochet extérieur sur la hanche", 'Verrouiller la ligne du genou, pas seulement la cheville', 'Tendre la jambe piégée pour briser leur base', "Crochet de talon extérieur ou balayage quand ils s'équarissent"],
  },
  110: {
    description: 'Variation De La Riva utilisant le revers enfilé autour de la jambe pour un contrôle extrême et des balayages.',
    cues: ['Passer le revers sous leur genou et le saisir', "L'échappée de hanche crée la position de contrôle", 'Utiliser le revers comme troisième prise — le garder tendu', 'Inverser et entrer en berimbolo depuis ici'],
  },
  111: {
    description: 'Un solide cadre de demi-garde avec bouclier de genou pour contrôler la distance et récupérer les attaques.',
    cues: ['Le bouclier de genou pointe vers le thorax, pas vers le bas', "Cadrer à l'épaule et au bicep", 'Garder les hanches angled sur le côté', 'Croc quand ils pressent'],
  },
  112: {
    description: 'Variation de garde inversée utilisée pour entrer dans les enchevêtrements de jambes et les prises de dos.',
    cues: ['Contrôler la jambe proche avant de se retourner', 'Cacher les hanches sous leur base', 'Serrer les genoux pour piéger la ligne de jambe', "Transitionner rapidement vers l'enchevêtrement de jambes"],
  },
  // Guard Passing (2xx)
  201: {
    description: 'Utiliser des prises sur les genoux et chevilles pour balancer les jambes de côté et passer latéralement.',
    cues: ['Contrôler le pantalon au genou, pas à la cheville', "Contourner — ne pas essayer de passer au travers", 'Rediriger les jambes de façon décisive', "Aplatir et consolider avant de s'installer en contrôle latéral"],
  },
  202: {
    description: 'Placer les deux bras sous les jambes pour empiler et passer la garde.',
    cues: ['Saisir le pantalon aux hanches pas aux chevilles', 'Plonger sous et empiler les hanches sur la poitrine', 'Avancer et marcher vers le côté', "Tête à l'extérieur pour éviter le triangle"],
  },
  203: {
    description: "Un bras au-dessus d'une jambe et l'autre sous l'autre, un puissant passage de pression.",
    cues: ['Pression forte du côté de la jambe au-dessus', 'Avancer avec le poids du corps', 'Aplatir leurs hanches avant de se déplacer sur le côté', "Pression d'épaule sur la cuisse intérieure"],
  },
  204: {
    description: "Tirer une jambe à travers le corps tout en maintenant le contact de hanche pour créer un angle de passage.",
    cues: ['Tirer une jambe à travers la ligne du corps', "Maintenir le contact hanche à hanche tout au long", 'Dégager la deuxième jambe avant de se stabiliser', 'Passer par-dessus pour compléter le passage'],
  },
  205: {
    description: 'Conduire le genou à travers la garde tout en contrôlant la hanche.',
    cues: ['Le genou coupe diagonalement sur leur cuisse', 'Pression de hanche dans leur hanche pendant la coupe', "Cross-face immédiatement pour empêcher l'échappée", "Rester lourd — ne pas les laisser créer de l'espace"],
  },
  206: {
    description: "Empiler les jambes de l'adversaire en avançant pour les aplatir et passer.",
    cues: ['Empiler les jambes sur leur poitrine', 'Serrer les genoux pour contrôler les deux jambes', 'Avancer avec le corps', 'Marcher vers le contrôle latéral une fois aplati'],
  },
  207: {
    description: 'Saisir les deux chevilles et genoux et rediriger les jambes de chaque côté.',
    cues: ['Saisir aux genoux pas aux chevilles', "Balancer les jambes d'un côté de façon décisive", 'Enjamber les jambes et épingler', "Se déplacer rapidement — c'est un passage de vitesse"],
  },
  208: {
    description: "Position de passage neutre à l'intérieur de la garde, utilisée pour contrôler et préparer les clés de jambe ou les passages.",
    cues: ["Maintenir la position intérieure à tout prix", 'Caler le genou pour contrôler leur hanche', 'Crochet de talon intérieur ou cheville droite depuis ici', "Transitionner vers clé de jambe ou passage selon leur réponse"],
  },
  209: {
    description: 'Style de passage poitrine-hanche utilisant un verrou de corps serré pour aplatir et dégager les jambes.',
    cues: ['Verrouiller les mains au niveau du bas du dos', 'Tête serrée sous leur menton', 'Pression de poitrine en avançant', 'Dégager la ligne du genou avant de se stabiliser'],
  },
  210: {
    description: 'Mouvement de passage dynamique avec un grand pas autour de la garde pour exposer le contrôle latéral.',
    cues: ['Contrôler les hanches avant de faire le pas', 'Le grand pas atterrit derrière leur hanche', "Baisser l'épaule pour épingler les jambes", "Changer de base pour neutraliser l'inversion"],
  },
  // Sweeps (3xx)
  301: {
    description: 'Poser la main et pousser la hanche vers l\'avant depuis la garde fermée pour prendre la position supérieure.',
    cues: ["Briser la posture d'abord — les tirer vers l'avant", 'Poser une main, pousser les hanches de façon explosive vers le haut', "S'engager totalement — l'hésitation tue le balayage", 'Enchaîner avec un kimura s\'ils prennent appui'],
  },
  302: {
    description: "Utiliser un mouvement en ciseaux des jambes depuis la garde fermée pour renverser l'adversaire.",
    cues: ["Doit briser la posture avant d'ouvrir la garde", 'La prise col-manche contrôle les deux côtés', 'Ciseaux des jambes simultanément avec la traction', 'Pousser le genou du bas dans leur hanche en balayant'],
  },
  303: {
    description: 'Depuis la garde fermée, accrocher une jambe et balayer avec un mouvement de pendule.',
    cues: ['Accrocher leur jambe proche avec votre jambe proche', "Le balancement de pendule génère l'élan", 'Tirer leur bras sur votre poitrine', 'Pivoter vers le haut quand ils tombent'],
  },
  304: {
    description: "Utiliser les crochets papillon pour déséquilibrer l'adversaire et le balayer de côté.",
    cues: ["Le croc crée l'angle pour le balayage", 'Soulever avec le crochet en tombant de côté', 'Déséquilibrer vers le côté du croc', 'Rouler en douceur — ne pas forcer'],
  },
  305: {
    description: "Balayer depuis la garde en X en étendant les jambes pour faire tomber l'adversaire vers l'avant ou l'arrière.",
    cues: ['Étendre les deux jambes simultanément pour briser la base', 'Déséquilibrer vers la direction du balayage d\'abord', "S'asseoir pour les suivre vers le haut", 'Saisir la cheville lointaine pour contrôler pendant la chute'],
  },
  306: {
    description: 'Une inversion tournante depuis De La Riva pour prendre le dos ou gagner une position dominante.',
    cues: ['Inverser sous leur centre de gravité', 'Pousser les hanches vers leur dos', 'Saisir la cheville lointaine pour contrôler la rotation', 'Finir en prise de dos ou position de traîne de jambe'],
  },
  307: {
    description: 'Divers balayages depuis la garde De La Riva attaquant la jambe proche ou lointaine.',
    cues: ['Déséquilibrer vers le côté du crochet DLR', 'Frapper vers leur tête pour initier', 'Pivoter sur leur jambe piégée', 'Contrôler la cheville en remontant'],
  },
  308: {
    description: "Utiliser le pied sur la hanche et le pied sur le bicep pour balayer l'adversaire.",
    cues: ['Pied sur la hanche, pied sur le bicep simultanément', 'Tirer la manche pour briser leur base', 'Étendre les hanches en tirant la jambe vers vous', 'Prendre la position supérieure rapidement'],
  },
  309: {
    description: "Balayage depuis la garde assise en soulevant une jambe et en coupant la jambe d'appui.",
    cues: ['Contrôler les manches ou poignets d\'abord', 'Soulever une jambe avec votre crochet', "Couper la cheville d'appui lointaine avec le pied opposé", "S'asseoir immédiatement pour finir en position supérieure"],
  },
  310: {
    description: "Balayage flottant depuis la garde ouverte qui élève l'adversaire au-dessus avant la transition supérieure.",
    cues: ['Les prises doivent se connecter aux manches et revers', 'Ramener les genoux à la poitrine puis étendre', "Les guider au-dessus de la ligne des épaules", 'Suivre et remonter avant le scramble'],
  },
  // Submissions (4xx)
  401: {
    description: "Hyperextension de l'articulation du coude en contrôlant le bras à travers le corps — appliqué depuis de nombreuses positions.",
    cues: ["Briser la posture avant d'aller chercher l'armbar", "Le bras doit croiser l'axe central du corps", 'Serrer les genoux, pousser les hanches vers le haut', 'Le pouce pointant vers le haut signifie que le coude est vers le bas — ajuster'],
  },
  402: {
    description: 'Verrouiller la tête et le bras avec les jambes en figure 4 pour couper le flux sanguin vers le cerveau.',
    cues: ["Tête et un bras à l'intérieur du triangle", 'Tirer la tête vers le bas pour compléter le verrou', "S'angulariser vers le côté du bras piégé", 'Pousser le bras à travers leur axe central pour resserrer'],
  },
  403: {
    description: "Une prise en figure 4 sur le poignet faisant pivoter l'articulation de l'épaule — appliqué depuis de nombreuses positions.",
    cues: ['Prise en figure 4 sous le poignet, pas dessus', "Pivoter l'épaule vers l'extérieur et vers le haut", 'Utiliser le poids du corps et non la seule force des bras', "Épingler le coude sur la hanche pour le levier"],
  },
  404: {
    description: "Clé d'épaule utilisant les jambes pour contrôler le bras et faire pivoter l'épaule.",
    cues: ["Balancer la jambe sur l'épaule — pas seulement le bras", "S'asseoir immédiatement pour empêcher le roulement", 'Perpendiculaire à leur corps pour une pression maximale', 'Utiliser les hanches et non les seules jambes pour appliquer la clé'],
  },
  405: {
    description: 'Étranglement sanguin depuis le dos — bras sous le menton, bras derrière la tête.',
    cues: ['Bras SOUS le menton, pas sur le menton', 'Second bras derrière la tête, pas le cou', 'Serrer bicep et épaule ensemble', "Tirer le coude vers soi en serrant"],
  },
  406: {
    description: 'Bras autour du cou coupant le flux sanguin, appliqué debout ou depuis la garde.',
    cues: ['Entrer complètement sous le cou, pas par-dessus', 'Guillotine coude haut pour la variation bras-dedans', "Tirer le bras à travers le corps en serrant", 'Se recroqueviller et fermer la garde pour la guillotine'],
  },
  407: {
    description: "Pivoter le talon vers l'extérieur pour attaquer les structures latérales du genou.",
    cues: ["Établir d'abord la position du crochet de talon extérieur", 'Saisir le talon, pivoter vers la poitrine', 'Contrôler la ligne du genou en permanence', 'Petite rotation — les dégâts sont rapides'],
  },
  408: {
    description: "Pivoter le talon vers l'intérieur pour attaquer les structures médiales du genou — extrêmement dangereux.",
    cues: ["Protéger d'abord son propre alignement de genou", 'Figure 4 au niveau du tibia', 'Pivoter le talon vers le centre', 'Taper immédiatement — les dégâts sont silencieux et rapides'],
  },
  409: {
    description: "Appliquer une pression contre le tendon d'Achille pour attaquer la cheville.",
    cues: ["Prise en figure 4 — partie osseuse de l'avant-bras sur l'Achille", 'Serrer les coudes et tomber en arrière', 'Contrôler la ligne du genou avec les jambes', "Étendre les hanches et non seulement les bras pour appliquer la pression"],
  },
  410: {
    description: "Hyperextension de l'articulation du genou, similaire à un armbar mais sur la jambe.",
    cues: ['Contrôler la jambe contre la poitrine', 'Hanche vers la fosse poplitée (derrière le genou)', 'Étendre les hanches pour créer la pression de barre', 'Tendre la jambe complètement contre le corps'],
  },
  411: {
    description: 'Étranglement bras-dedans utilisant une figure 4 à travers le cou, appliqué depuis la tortue ou la garde.',
    cues: ['Passer le bras à travers la tête et le bras simultanément', 'Sécuriser la prise en figure 4 sur son propre bicep', "Serrer et les pousser vers l'avant", 'Finir en position supérieure ou utiliser le poids du corps depuis derrière'],
  },
  412: {
    description: 'Similaire au Darce mais avec une position de bras différente, souvent depuis le headlock frontal.',
    cues: ['Passer le bras sous la tête et à travers le bras', "Pousser l'épaule vers le cou", 'Rouler vers le côté du bras piégé pour finir', 'Serrer en poussant le poids du corps vers l\'intérieur'],
  },
  413: {
    description: 'Puissant étranglement de revers depuis le dos utilisant la prise de ceinture et pantalon pour le levier final.',
    cues: ["Prise profonde de revers du côté de l'étranglement", 'Prise de pantalon ou de ceinture sur la jambe du côté opposé', 'Étendre le corps pour créer l\'arc', "Tirer le revers vers soi, pousser la jambe vers l'extérieur"],
  },
  414: {
    description: 'Double prise de revers depuis la monture ou la garde en croisant pour étrangler.',
    cues: ["Les deux prises croisent l'axe central de leur revers", "Faire pivoter les poignets vers l'intérieur en appliquant la pression", 'Pousser les coudes vers le sol', "Se redresser en monture avant d'appliquer"],
  },
  415: {
    description: "Étranglement par prise de manche depuis la monture, peut même être appliqué à l'intérieur de la garde de l'adversaire.",
    cues: ['La manche va d\'abord contre le cou', 'La paume pousse à travers la gorge', "Serrer et pivoter l'étranglement", "Fonctionne même depuis l'intérieur de leur garde — inattendu"],
  },
  416: {
    description: 'Clé d\'épaule en figure 4 pliant le poignet vers le haut — appliqué depuis la monture ou le contrôle latéral.',
    cues: ['Épingler le poignet au sol d\'abord', 'La prise en figure 4 sécurise le bras', 'Pousser le coude vers leur hanche en petits cercles', 'Toujours garder le poignet plus bas que le coude'],
  },
  417: {
    description: "Étranglement sanguin tête-et-bras fini depuis la monture ou le contrôle latéral avec pression d'épaule.",
    cues: ['Piéger leur bras croisant le cou d\'abord', 'Tête basse du même côté que le bras piégé', "Marcher sur le côté en serrant l'épaule", 'Finir avec chute de poitrine et pression'],
  },
  418: {
    description: "Étranglement nord-sud utilisant la pression de l'épaule et du grand dorsal autour du cou.",
    cues: ["Le bras s'enroule profondément autour de la ligne du cou", 'Pression d\'épaule vers le bas, pas de traction vers le haut', 'Écarter les hanches pour resserrer', 'Cacher le coude et garder la poitrine lourde'],
  },
  // Takedowns & Throws (5xx)
  501: {
    description: "Pénétrer sur les deux jambes et pousser pour soulever ou faire trébucher l'adversaire au sol.",
    cues: ["Changement de niveau — s'abaisser avant le tir", 'Le pas de pénétration entre dans leurs hanches', "Tête à l'extérieur — jamais à l'intérieur", 'Pousser vers l\'avant et vers le haut, puis faire trébucher ou soulever'],
  },
  502: {
    description: 'Contrôler une jambe et utiliser des crochets ou des soulèvements pour faire tomber l\'adversaire.',
    cues: ['Sécuriser la jambe à la cuisse pas à la cheville', 'Pousser à travers leur centre de gravité', 'Courir le tuyau ou crocheter la cheville pour finir', "Garder la tête haute et vers l'extérieur"],
  },
  503: {
    description: "Charger l'adversaire sur la hanche et pivoter pour le projeter au sol.",
    cues: ["Briser leur équilibre vers l'avant d'abord", 'Charger la hanche directement sous leur centre', 'Pivoter — les hanches font face à la même direction que les leurs', 'Pivoter et tirer sur la hanche en douceur'],
  },
  504: {
    description: "Tirer l'adversaire par-dessus l'épaule pour une grande projection.",
    cues: ['Les tirer en pivotant dessous', "Pousser l'épaule sous leur aisselle", 'Charger leur poids sur le dos', 'Pivoter complètement et les tirer par-dessus'],
  },
  505: {
    description: "Balayer l'intérieur de la jambe de l'adversaire en brisant son équilibre.",
    cues: ['Briser l\'équilibre vers leur coin avant', 'Balayer la cuisse intérieure — pas le pied', 'Pivoter complètement sur la projection', 'Les pousser par-dessus la jambe balayeuse'],
  },
  506: {
    description: "Faucher la jambe de l'adversaire par l'extérieur en le poussant en arrière.",
    cues: ['Briser l\'équilibre vers leur coin arrière', 'Faire un pas profond près de leur jambe', 'Faucher la jambe en conduisant tête et épaule', "S'engager totalement — ne pas hésiter"],
  },
  507: {
    description: "Saisir la cheville en poussant la tête pour faire trébucher l'adversaire.",
    cues: ['Pousser leur tête vers le bas quand ils font un pas', 'Saisir la cheville du même côté', 'Avancer en soulevant la cheville', 'Suivre rapidement vers la position supérieure'],
  },
  508: {
    description: "Charger l'adversaire sur le dos en saisissant le bras et la cheville.",
    cues: ['Contrôler un bras et la cheville opposée', 'Plonger sous et charger sur les épaules', "Pousser l'épaule vers leur aisselle", 'Les rouler par-dessus le dos pour finir'],
  },
  509: {
    description: 'Balayage basé sur le timing qui retire un pied en mouvement pour faire tomber l\'adversaire proprement.',
    cues: ['Attaquer quand leur poids se déplace', 'Utiliser la traction manche et revers pour déséquilibrer', 'Balayer bas au niveau de la cheville', 'La direction du balayage suit leur pas'],
  },
  510: {
    description: "Tirer la tête et la posture de l'adversaire vers le bas pour sécuriser le contrôle en headlock frontal.",
    cues: ['Tirer avec les coudes pas les poignets', 'Reculer en tirant vers le bas', "Tourner immédiatement pour créer un angle", 'Sécuriser la prise du menton et le contrôle du coude'],
  },
  // Escapes (6xx)
  601: {
    description: "Pont explosif depuis la monture pour renverser l'adversaire, récupérer la garde ou prendre la position supérieure.",
    cues: ['Piéger un bras ET une jambe du même côté', "Pont explosif — penser droit vers le haut, pas en arc", "Rouler sur l'épaule piégée", 'Utiliser les pieds pour pousser le sol pour la puissance'],
  },
  602: {
    description: "Créer de l'espace en glissant les hanches et replacer la garde depuis le dessous.",
    cues: ['Créer un cadre sur la hanche avant de glisser', "Glisser les hanches vers l'extérieur — créer de l'espace pour le genou", 'Pousser le genou vers l\'intérieur pour replacer la garde', 'Rester sur le côté — jamais à plat sur le dos'],
  },
  603: {
    description: 'Utiliser le mouvement de glissement pour récupérer la garde depuis le contrôle latéral.',
    cues: ['Cadrer sur la hanche et le cou simultanément', "Pont pour créer de l'espace pour glisser", "Glisser les hanches vers l'extérieur et replacer le genou de garde", 'Rester sur le côté tout au long — jamais à plat'],
  },
  604: {
    description: "Protéger le cou, retirer la ceinture de sécurité et récupérer la garde depuis le contrôle de dos.",
    cues: ["Priorité un : protéger le cou de l'étranglement", "Retirer la ceinture — se battre d'abord pour le bras supérieur", 'Pivoter vers eux du même côté que leurs crochets', "Rouler vers la garde en créant l'angle"],
  },
  605: {
    description: "Se redresser, tourner vers l'étranglement et trouver le cou pour s'échapper.",
    cues: ["Se redresser immédiatement — ne pas rentrer le menton", "Tourner vers le bras qui étrangle", 'Empiler et avancer pour enlever la pression', "Trouver leur cou pour les contrôler pendant l'échappée"],
  },
  606: {
    description: "Empiler, se redresser et utiliser des ruptures de prise pour s'échapper du triangle.",
    cues: ["Empiler leurs hanches immédiatement — enlever le poids", "Se redresser — menton en l'air, dos droit", 'Briser leur prise sur la tête ou le poignet', "Enjamber leur jambe pour s'échapper du triangle"],
  },
  607: {
    description: "Séquence d'échappée pour retirer la pression du genou et récupérer la garde ou la demi-garde.",
    cues: ['Cadrer sur leur genou et hanche', 'Pont puis glisser sous la pression', "Attraper leur jambe d'avancée pour la demi-garde", 'Ne pas pousser avec les bras tendus'],
  },
  // Positions (7xx)
  701: {
    description: "S'asseoir sur le torse de l'adversaire — l'une des positions les plus dominantes en BJJ.",
    cues: ['Monture haute : crochets derrière leurs bras', "Garder les hanches lourdes — ne pas prendre appui", 'Contrôler les deux bras pour ouvrir les soumissions', 'Anticiper le pont — poser le pied pour contrer'],
  },
  702: {
    description: "Contrôler l'adversaire depuis le côté avec une pression poitrine à poitrine.",
    cues: ['Pression de poitrine dans leur poitrine — pas leurs bras', "Le cross-face tourne leur tête vers l'extérieur", 'Le croc contrôle leur bras proche', "Poids vers l'avant — les garder à plat"],
  },
  703: {
    description: "S'attacher au dos de l'adversaire avec des crochets à l'intérieur, la position la plus dangereuse en BJJ.",
    cues: ['Crochets à hauteur de hanche — pas les jambes', "Ceinture de sécurité : paume vers l'intérieur sur le bras d'étranglement", 'Garder ses hanches plus basses que les leurs', "Contrôle deux-contre-un avant d'aller chercher l'étranglement"],
  },
  704: {
    description: "Contrôler l'adversaire tête à tête, perpendiculaire à son corps.",
    cues: ['Contrôle de tête — couronne de tête dans leur menton', 'Poids vers l\'avant sur leur poitrine', 'Contrôler les deux bras contre les hanches', 'Transitionner vers Darce ou kimura depuis ici'],
  },
  705: {
    description: "Enfoncer le genou dans le ventre de l'adversaire — une position transitionnelle et d'attaque.",
    cues: ['Tibia à travers le ventre — pas seulement le genou', 'Prise du bras lointain et prise de revers pour la stabilité', 'Prêt à transitionner quand ils font un pont et poussent', 'Utiliser la pression pour forcer des réactions pour les soumissions'],
  },
  706: {
    description: "Position défensive à quatre pattes — l'adversaire doit l'ouvrir pour attaquer.",
    cues: ['Menton sur la poitrine — protéger toujours le cou', 'Prendre appui sur la tête et les mains pour la structure', "Chercher le sit-out ou le roulement pour s'échapper", "Ne jamais rester statique — créer du mouvement pour s'échapper"],
  },
  707: {
    description: "Position de contrôle supérieur pendant que l'adversaire a une jambe piégée, idéale pour les passages sous pression.",
    cues: ['Cross-face et croc comme priorités', 'Aplatir les hanches avant de libérer la jambe', 'Reculer la ligne du genou pour dégager le piège', "Changer de base quand ils utilisent le bouclier de genou"],
  },
}

const FR_DIFFICULTY: LanguagePack['difficulty'] = {
  BEGINNER: 'Débutant',
  INTERMEDIATE: 'Intermédiaire',
  ADVANCED: 'Avancé',
  ELITE: 'Élite',
}

const FR_SESSION_TYPES: LanguagePack['sessionTypes'] = {
  GI: 'Gi',
  NOGI: 'No-Gi',
  OPEN_MAT: 'Open mat',
  COMPETITION: 'Compétition',
  DRILLING: 'Exercices',
}

const FR_CONNECTION_TYPES: LanguagePack['connectionTypes'] = {
  FOLLOW_UP: 'Suite',
  COUNTER: 'Contre',
  SETUP: 'Mise en place',
  TRANSITION: 'Transition',
}

export const FR_LANGUAGE_PACK: LanguagePack = {
  translations: FR_TRANSLATIONS,
  categoryContent: FR_CATEGORY_CONTENT,
  techniqueContent: FR_TECHNIQUE_CONTENT,
  difficulty: FR_DIFFICULTY,
  sessionTypes: FR_SESSION_TYPES,
  connectionTypes: FR_CONNECTION_TYPES,
  locale: 'fr-FR',
} satisfies LanguagePack
