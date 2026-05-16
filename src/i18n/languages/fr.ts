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
  'PLANNED SESSIONS': 'SÉANCES PLANIFIÉES',
  'PRACTICE SESSIONS': 'SÉANCES PRATIQUÉES',
  'QUICK ACCESS': 'ACCÈS RAPIDE',
  TRENDING: 'TENDANCES',
  'Training Sessions': "Sessions d'entraînement",
  'Log and review your mat time':
    'Enregistrez et consultez votre temps sur tatami',
  'Technique Library': 'Bibliothèque de techniques',
  '60+ techniques with YouTube refs': '60+ techniques avec références YouTube',
  Categories: 'Catégories',
  Clubs: 'Clubs',
  'No clubs yet. Add one above.':
    'Aucun club pour le moment. Ajoutez-en un ci-dessus.',
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
  'Customize icons for each session type':
    'Personnalisez les icônes pour chaque type de session',
  'Manage technique categories and icons':
    'Gérez les catégories et icônes des techniques',
  'Manage your training locations': "Gérez vos lieux d'entraînement",
  Language: 'Langue',
  English: 'Anglais',
  Spanish: 'Espagnol',
  French: 'Français',
  'Search…': 'Rechercher…',
  'SESSION TYPE ICONS': 'ICÔNES DE TYPE DE SESSION',
  'Tap + to log your first training':
    'Touchez + pour enregistrer votre premier entraînement',
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
  'What clicked? What to fix?':
    "Qu'est-ce qui a bien marché ? Quoi améliorer ?",
  'What did you work on? Any insights?':
    'Sur quoi avez-vous travaillé ? Des observations ?',
  'Select Techniques': 'Sélectionner des techniques',
  'Select Technique — Tap Given':
    'Sélectionner une technique — Soumission réussie',
  'Select Technique — Tap Received':
    'Sélectionner une technique — Soumission subie',
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
  'No techniques logged for this session.':
    'Aucune technique enregistrée pour cette session.',
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
  Graph: 'Graphe',
  List: 'Liste',
  'Technique Graph': 'Graphe des techniques',
  'Open technique graph': 'Ouvrir le graphe des techniques',
  'No connections to display': 'Aucune connexion à afficher',
  'Reset view': 'Réinitialiser la vue',
  'Zoom in': 'Zoom avant',
  'Zoom out': 'Zoom arrière',
  Clear: 'Effacer',
  Filter: 'Filtrer',
  FILTERS: 'FILTRES',
  'Weekly goal': 'Objectif hebdomadaire',
  Avg: 'Moy.',
  'Avg taps': 'Moy. soumissions',
  weeks: 'semaines',
  'w.': 's.',
  'FOCUS TECHNIQUES': 'TECHNIQUES CIBLES',
  'Set focus': 'Définir focus',
  'Select focus techniques': 'Sélectionner les techniques cibles',
  'No focus techniques selected': 'Aucune technique cible sélectionnée',
  'Given submissions': 'Soumissions réussies',
  Submissions: 'Soumissions',
  'Received: total submissions you got caught in.\nGiven: total submissions you finished.\nAvg: average Given submissions across your last 5 logged sessions.\nThe 5 blue bars show Given submissions for each of those sessions (oldest to newest).':
    'Subies : total des soumissions que vous avez subies.\nRéussies : total des soumissions que vous avez terminées.\nMoy. : moyenne des soumissions réussies sur vos 5 dernières sessions enregistrées.\nLes 5 barres bleues montrent les soumissions réussies pour chacune de ces sessions (de la plus ancienne à la plus récente).',
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
  'Try a different search or filter':
    'Essayez une autre recherche ou un autre filtre',
  'Try again': 'Réessayer',
  'Storage full': 'Stockage plein',
  'Your device storage is full. Export a backup to free up space.':
    "Le stockage de votre appareil est plein. Exportez une sauvegarde pour libérer de l'espace.",
  'Export backup': 'Exporter la sauvegarde',
  Dismiss: 'Fermer',
  // Settings section headings & labels
  'YOUR BELT': 'VOTRE CEINTURE',
  'Your name': 'Votre nom',
  'THEME & LANGUAGE': 'THÈME & LANGUE',
  Theme: 'Thème',
  Dark: 'Sombre',
  Stripes: 'Barrettes',
  'HOME SECTION ORDER': "ORDRE DE L'ACCUEIL",
  'Home section order': "Ordre de l'accueil",
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
  'Pre-filled techniques were reset successfully.':
    'Les techniques prédéfinies ont été réinitialisées avec succès.',
  'Could not reset techniques.': 'Impossible de réinitialiser les techniques.',
  'Export session': 'Exporter la session',
  // Gamification
  GAMIFICATION: 'GAMIFICATION',
  'THIS WEEK': 'CETTE SEMAINE',
  'LEVEL AND SCORES': 'NIVEAU ET SCORES',
  'LEVEL AND SCORES VIEW': 'AFFICHAGE NIVEAU ET SCORES',
  'Choose which level and score cards are shown on Home.':
    "Choisissez les cartes de niveau et de scores à afficher sur l'accueil.",
  Achievements: 'Succès',
  'View all': 'Tout voir',
  Locked: 'Verrouillé',
  Earned: 'Obtenu',
  'Edit cards': 'Modifier les cartes',
  'Done editing': 'Fin de modification',
  'Daily streak': 'Série quotidienne',
  Streaks: 'Séries',
  'Weekly streak': 'Série hebdomadaire',
  'd.': 'j.',
  Level: 'Niveau',
  XP: 'XP',
  'Your level increases as your total XP grows. Levels get progressively harder to reach.':
    'Votre niveau monte avec vos XP totaux. Chaque niveau devient plus exigeant.',
  'Level thresholds: L1 0 XP, L2 100 XP, L3 300 XP, L4 600 XP, L5 1000 XP. Each next level needs 100 XP more than the previous one.':
    'Seuils de niveau : N1 0 XP, N2 100 XP, N3 300 XP, N4 600 XP, N5 1000 XP. Chaque niveau suivant demande 100 XP de plus que le précédent.',
  'XP comes from mat time, submissions given, and sessions logged. Mat time gives 1 XP every 15 minutes.':
    'Les XP viennent du temps sur tatami, des soumissions réussies et des sessions enregistrées. Le tatami donne 1 XP toutes les 15 minutes.',
  'Consecutive days with at least one logged training session.':
    "Jours consécutifs avec au moins une session d'entraînement enregistrée.",
  'Consecutive weeks with at least one logged training session.':
    "Semaines consécutives avec au moins une session d'entraînement enregistrée.",
  'Milestones unlocked from your long-term training consistency and progress.':
    'Jalons débloqués grâce à votre régularité et progression à long terme.',
  'Lifetime hours': 'Heures au total',
  'Next tier': 'Prochain palier',
  // Rank tiers
  Recruit: 'Recrue',
  'White Belt Spirit': 'Esprit ceinture blanche',
  Striped: 'Barretté',
  Roller: 'Rouleur',
  Grinder: 'Acharné',
  Veteran: 'Vétéran',
  'Black Belt Path': 'Voie de la ceinture noire',
  Legend: 'Légende',
  // Focus goals
  'Set goal': "Fixer l'objectif",
  'Clear goal': "Effacer l'objectif",
  'Goal type': "Type d'objectif",
  Target: 'Cible',
  'Sessions used in': 'Sessions en utilisant',
  'Taps given': 'Soumissions données',
  Drilled: 'Répétitions',
  'Manual count': 'Compte manuel',
  'Sessions since last submitted': 'Sessions sans soumission',
  '+1': '+1',
  Reset: 'Réinitialiser',
  // Achievement titles
  'First Steps': 'Premiers pas',
  'On the Mat': 'Sur le tatami',
  'Mat Veteran': 'Vétéran du tatami',
  'Ten Hours': 'Dix heures',
  Century: 'Centenaire',
  'First Submission': 'Première soumission',
  'Tap Master': 'Maître des soumissions',
  'Defensive Wizard': 'Défenseur imprenable',
  'Week Warrior': 'Guerrier hebdomadaire',
  'Daily Devotee': 'Pratiquant assidu',
  Focused: 'Focalisé',
  'Goal Slayer': "Chasseur d'objectifs",
  'Belt Promoted': 'Promotion de ceinture',
  // Achievement descriptions
  'Log your first training session.':
    "Enregistrez votre première session d'entraînement.",
  'Log 10 training sessions.': "Enregistrez 10 sessions d'entraînement.",
  'Log 100 training sessions.': "Enregistrez 100 sessions d'entraînement.",
  'Train 10 hours total.': 'Entraînez-vous 10 heures au total.',
  'Train 100 hours total.': 'Entraînez-vous 100 heures au total.',
  'Submit your first training partner.':
    'Soumettez votre partenaire pour la première fois.',
  'Get 50 submissions.': 'Obtenez 50 soumissions.',
  'Survive 7 sessions in a row without getting submitted.':
    'Tenez 7 sessions de suite sans être soumis.',
  'Reach a 4-week training streak.':
    "Atteignez une série de 4 semaines d'entraînement.",
  'Reach a 7-day training streak.':
    "Atteignez une série de 7 jours d'entraînement.",
  'Hit 3 focus-technique goals at the same time.':
    'Atteignez 3 objectifs de technique cible simultanément.',
  'Complete any focus-technique goal.':
    'Complétez un objectif de technique cible.',
  'Earned a new belt or stripe in the last 7 days.':
    'Obtenu une nouvelle ceinture ou barrette dans les 7 derniers jours.',
  // Card labels
  Rank: 'Rang',
  Sparkline: 'Sparkline',
  'Mat time': 'Temps sur tatami',
  // Auto-backup
  'Auto-backup': 'Sauvegarde automatique',
  'Auto-backup is off — your data only lives in this browser.':
    'La sauvegarde automatique est désactivée — vos données ne vivent que dans ce navigateur.',
  'Back up to a folder': 'Sauvegarder dans un dossier',
  'Back up to GitHub': 'Sauvegarder sur GitHub',
  'Choose folder': 'Choisir un dossier',
  'Reconnect folder': 'Reconnecter le dossier',
  'Disconnect folder': 'Déconnecter le dossier',
  'Backup now': 'Sauvegarder maintenant',
  'Last backup': 'Dernière sauvegarde',
  Never: 'Jamais',
  'GitHub token': 'Jeton GitHub',
  'Personal access token': 'Jeton d’accès personnel',
  'Repository (owner/repo)': 'Dépôt (utilisateur/dépôt)',
  'Gist ID': 'ID du gist',
  'Test connection': 'Tester la connexion',
  'Connected as': 'Connecté en tant que',
  'Folder backup is only available in Chromium-based browsers.':
    'La sauvegarde dossier est disponible uniquement sur les navigateurs Chromium.',
  'Use a fine-grained token scoped to one repo. Revoke it if your device is lost.':
    'Utilisez un jeton fine-grained limité à un seul dépôt. Révoquez-le en cas de perte de l’appareil.',
  'Auto-backup failed': 'Échec de la sauvegarde automatique',
  'Could not write backup to the chosen destination.':
    'Impossible d’écrire la sauvegarde dans la destination choisie.',
  // Setup restore prompt
  'Restore from backup': 'Restaurer depuis une sauvegarde',
  'Set up backup': 'Configurer la sauvegarde',
  'Where should we keep your backups?': 'Où conserver vos sauvegardes ?',
  'A folder on your device': 'Un dossier sur votre appareil',
  'A GitHub repo or gist': 'Un dépôt ou gist GitHub',
  'Skip — start fresh in this browser':
    'Passer — repartir de zéro dans ce navigateur',
  'No previous backup here — starting fresh.':
    'Pas de sauvegarde précédente ici — on part de zéro.',
  'Found a backup': 'Sauvegarde trouvée',
  'Restore this backup': 'Restaurer cette sauvegarde',
  'Ignore — start fresh': 'Ignorer — repartir de zéro',
  'Choose a backup to restore': 'Choisissez une sauvegarde à restaurer',
  'Connected. Looking for backups…': 'Connecté. Recherche des sauvegardes…',
  sessions: 'sessions',
  techniques: 'techniques',
  'How backups work': 'Comment fonctionnent les sauvegardes',
  'Need help?': 'Besoin d’aide ?',
  // Backup sync indicator
  'Backup failed': 'Échec de la sauvegarde',
  'Your data is still safely stored in this browser.':
    'Vos données sont toujours en sécurité dans ce navigateur.',
  'No network — backup will be retried next time you save a session with a connection.':
    'Pas de réseau — la sauvegarde sera retentée la prochaine fois que vous enregistrerez une session avec une connexion.',
  'Existing backup found': 'Sauvegarde existante trouvée',
  'Restore backup': 'Restaurer la sauvegarde',
  'Keep current data': 'Conserver les données actuelles',
  'Backup up to date': 'Sauvegarde à jour',
  'Backup out of date': 'Sauvegarde obsolète',
  'No backup configured': 'Aucune sauvegarde configurée',
} satisfies Record<TranslationKey, string>

const FR_CATEGORY_CONTENT: LanguagePack['categoryContent'] = {
  1: {
    name: 'Gardes',
    description: "Positions sur le dos en contrôlant l'adversaire",
  },
  2: {
    name: 'Passage de garde',
    description: "Techniques pour contourner la garde de l'adversaire",
  },
  3: {
    name: 'Balayages',
    description:
      'Renversements depuis la position inférieure vers la supérieure',
  },
  4: {
    name: 'Soumissions',
    description: 'Techniques de finition — étranglements et clés articulaires',
  },
  5: { name: 'Projections', description: 'Amener le combat au sol' },
  6: {
    name: 'Échappées',
    description: 'Récupérer depuis les mauvaises positions',
  },
  7: { name: 'Positions', description: 'Positions de contrôle dominant' },
}

const FR_TECHNIQUE_CONTENT: LanguagePack['techniqueContent'] = {
  // Guards (1xx)
  101: {
    name: 'Garde Fermée',
    description:
      "Garde classique avec les jambes verrouillées derrière le dos de l'adversaire, contrôlant la posture et créant des angles d'attaque.",
    cues: [
      "Briser la posture avant d'attaquer",
      "Les hanches en l'air créent de l'espace pour les soumissions",
      'Utiliser des angles diagonaux pour les attaques de bras',
      'Combattre constamment pour le contrôle du poignet',
    ],
  },
  102: {
    name: 'Demi-garde',
    description:
      "Une jambe piège une jambe de l'adversaire, offrant une rétention de garde et des opportunités de balayage.",
    cues: [
      'Le croc est essentiel — se battre pour le conserver à chaque fois',
      'Empêcher le cross-face à tout prix',
      'Rester sur le côté, jamais à plat sur le dos',
      'Hanches vers eux pour préparer le balayage',
    ],
  },
  103: {
    name: 'Garde Papillon',
    description:
      "Garde assise utilisant les crochets (cous-de-pied) contre les cuisses de l'adversaire pour déséquilibrer et balayer.",
    cues: [
      'Rester droit — ne pas se pencher en arrière',
      'Les deux crochets engagent les cuisses internes',
      "Déséquilibrer d'un côté avant de soulever",
      'Croc ou contrôle de tête pour créer un angle',
    ],
  },
  104: {
    name: 'Garde Araignée',
    description:
      "Saisir les manches de l'adversaire tout en utilisant les pieds sur les biceps pour contrôler la distance et attaquer.",
    cues: [
      'Prise de manche complète, pieds sur les biceps pas les avant-bras',
      'Étendre complètement avant de tirer pour briser la posture',
      'Frapper la hanche simultanément avec la traction',
      'Pivoter les hanches pour les entrées en triangle et omoplata',
    ],
  },
  105: {
    name: 'Garde De La Riva',
    description:
      "Un crochet sur l'extérieur de la jambe de l'adversaire avec contrôle de la manche et de la cheville.",
    cues: [
      "Crochet profond autour de l'extérieur de la jambe",
      'Contrôler la manche et le revers lointain ou la cheville proche',
      'Maintenir la distance — ne pas se faire écraser',
      'Berimbolo ou prise de dos quand ils avancent',
    ],
  },
  106: {
    name: 'Garde en X',
    description:
      "Les deux crochets sous les cuisses de l'adversaire en forme de X, créant un déséquilibre extrême pour les balayages.",
    cues: [
      "S'asseoir vers eux pour entrer",
      'Les deux crochets sous les cuisses — pousser dans des directions opposées',
      'Étendre les jambes pour détruire leur base',
      "Pousser d'une jambe pour établir la direction du balayage",
    ],
  },
  107: {
    name: 'Garde Lasso',
    description:
      "Enrouler le bras dans un lasso avec la jambe pour immobiliser le bras et créer des angles d'attaque.",
    cues: [
      'Lasso au-dessus du coude pour un contrôle maximal',
      'Pousser la hanche avec le pied libre',
      'Forcer des problèmes de posture pour ouvrir des angles de soumission',
      'Transition vers omoplata ou triangle quand ils se redressent',
    ],
  },
  108: {
    name: 'Rubber Guard',
    description:
      'Position de garde haute avec la jambe derrière la nuque, popularisée par Eddie Bravo.',
    cues: [
      'Prérequis de flexibilité — étirer régulièrement',
      'Verrouiller la jambe derrière la nuque avant de saisir le poignet',
      'Le mission control contrôle totalement la posture',
      'Progresser dans le système : New York, Jiu Claw, Omoplata',
    ],
  },
  109: {
    name: 'Single Leg X (SLX)',
    description:
      "Un crochet entre les jambes de l'adversaire contrôlant une seule jambe pour les balayages et entrées en clé de jambe.",
    cues: [
      "Établir l'ashi garami — crochet extérieur sur la hanche",
      'Verrouiller la ligne du genou, pas seulement la cheville',
      'Tendre la jambe piégée pour briser leur base',
      "Crochet de talon extérieur ou balayage quand ils s'équarissent",
    ],
  },
  110: {
    name: 'Worm Guard',
    description:
      'Variation De La Riva utilisant le revers enfilé autour de la jambe pour un contrôle extrême et des balayages.',
    cues: [
      'Passer le revers sous leur genou et le saisir',
      "L'échappée de hanche crée la position de contrôle",
      'Utiliser le revers comme troisième prise — le garder tendu',
      'Inverser et entrer en berimbolo depuis ici',
    ],
  },
  111: {
    name: 'Garde Z',
    description:
      'Un solide cadre de demi-garde avec bouclier de genou pour contrôler la distance et récupérer les attaques.',
    cues: [
      'Le bouclier de genou pointe vers le thorax, pas vers le bas',
      "Cadrer à l'épaule et au bicep",
      'Garder les hanches angled sur le côté',
      'Croc quand ils pressent',
    ],
  },
  112: {
    name: 'Garde K',
    description:
      'Variation de garde inversée utilisée pour entrer dans les enchevêtrements de jambes et les prises de dos.',
    cues: [
      'Contrôler la jambe proche avant de se retourner',
      'Cacher les hanches sous leur base',
      'Serrer les genoux pour piéger la ligne de jambe',
      "Transitionner rapidement vers l'enchevêtrement de jambes",
    ],
  },
  113: {
    name: 'Garde De La Riva Inversée',
    description:
      "Position de garde où la jambe intérieure se croche autour de la jambe avant de l'adversaire par l'intérieur, créant un angle qui rend la pression frontale beaucoup plus difficile pour le joueur du dessus. Très répandue en no-gi. Les destinations principales sont les prises de dos, les calf kicks et les entrées en single-leg X.",
    cues: [
      "Crocher la jambe intérieure autour de leur jambe avant par le dessous — contrairement à la DLR, ce crochet vient de l'intérieur, pas de l'extérieur",
      "Le pied d'appui doit être sur leur hanche ou cuisse pour maintenir la distance tandis que le crochet intérieur contrôle leur jambe",
      "Prise de dos « Kiss of the Dragon » : s'inverser sous l'adversaire, utiliser le crochet pour pivoter et remonter dans son dos",
      "Quand ils avancent, pomper le crochet et s'étendre pour entrer en single-leg X ou en enchevêtrement de jambes direct",
    ],
  },
  114: {
    name: 'Garde 50/50',
    description:
      'Garde en enchevêtrement de jambes neutre où les deux pratiquants se reflètent mutuellement, créant des opportunités offensives et défensives égales. Principalement une plateforme pour les clés de jambes ; les deux joueurs peuvent attaquer simultanément avec ankle locks, heel hooks et toe holds.',
    cues: [
      "Couvrir le genou de l'adversaire avec la main supérieure et cacher son propre talon derrière leur cuisse — exposer le talon est la façon la plus rapide de perdre",
      "Rester en angle plutôt que face à face ; l'alignement direct leur permet de refléter la tentative de clé de jambe simultanément",
      "L'ankle lock et le heel hook intérieur sont les finitions à plus fort pourcentage ; établir une connexion de hanche serrée avant d'aller chercher le talon",
      'Pour balayer : pivoter le genou extérieur vers le sol pour plier leur genou avant, puis se dégager et établir la position supérieure',
    ],
  },
  115: {
    name: 'Demi-garde Profonde',
    description:
      "Extension de la demi-garde où le pratiquant du dessous tire son corps entièrement sous le centre de gravité de l'adversaire, tête près de son genou, bras enroulé autour d'une jambe et hanches serrées en dessous. Les attaques principales sont le balayage du serveur, le balayage Homer Simpson et la prise de dos.",
    cues: [
      "Entrer en tirant la hanche profondément sous la base de l'adversaire ; le visage doit être près de leur genou, pas de leur hanche",
      "Garder les deux bras à l'intérieur : un enroule la jambe, l'autre contrôle leur genou ou cheville lointain ; cela empêche le cross-face et le kimura",
      'Balayage du serveur : enfiler la jambe extérieure sous leur jambe proche, la soulever et balayer vers la tête',
      'Quand ils prennent appui pour arrêter le balayage, utiliser cet appui comme point de pivot pour pivoter dans leur dos',
    ],
  },
  // Guard Passing (2xx)
  201: {
    name: 'Passage Toréador',
    description:
      'Utiliser des prises sur les genoux et chevilles pour balancer les jambes de côté et passer latéralement.',
    cues: [
      'Contrôler le pantalon au genou, pas à la cheville',
      'Contourner — ne pas essayer de passer au travers',
      'Rediriger les jambes de façon décisive',
      "Aplatir et consolider avant de s'installer en contrôle latéral",
    ],
  },
  202: {
    name: 'Double Passage en Dessous',
    description:
      'Placer les deux bras sous les jambes pour empiler et passer la garde.',
    cues: [
      'Saisir le pantalon aux hanches pas aux chevilles',
      'Plonger sous et empiler les hanches sur la poitrine',
      'Avancer et marcher vers le côté',
      "Tête à l'extérieur pour éviter le triangle",
    ],
  },
  203: {
    name: 'Passage Par-dessus/Par-dessous',
    description:
      "Un bras au-dessus d'une jambe et l'autre sous l'autre, un puissant passage de pression.",
    cues: [
      'Pression forte du côté de la jambe au-dessus',
      'Avancer avec le poids du corps',
      'Aplatir leurs hanches avant de se déplacer sur le côté',
      "Pression d'épaule sur la cuisse intérieure",
    ],
  },
  204: {
    name: 'Leg Drag',
    description:
      'Tirer une jambe à travers le corps tout en maintenant le contact de hanche pour créer un angle de passage.',
    cues: [
      'Tirer une jambe à travers la ligne du corps',
      'Maintenir le contact hanche à hanche tout au long',
      'Dégager la deuxième jambe avant de se stabiliser',
      'Passer par-dessus pour compléter le passage',
    ],
  },
  205: {
    name: 'Passage Genou au Sol',
    description:
      'Conduire le genou à travers la garde tout en contrôlant la hanche.',
    cues: [
      'Le genou coupe diagonalement sur leur cuisse',
      'Pression de hanche dans leur hanche pendant la coupe',
      "Cross-face immédiatement pour empêcher l'échappée",
      "Rester lourd — ne pas les laisser créer de l'espace",
    ],
  },
  206: {
    name: 'Smash Pass',
    description:
      "Empiler les jambes de l'adversaire en avançant pour les aplatir et passer.",
    cues: [
      'Empiler les jambes sur leur poitrine',
      'Serrer les genoux pour contrôler les deux jambes',
      'Avancer avec le corps',
      'Marcher vers le contrôle latéral une fois aplati',
    ],
  },
  207: {
    name: 'Passage Toréador (variante)',
    description:
      'Saisir les deux chevilles et genoux et rediriger les jambes de chaque côté.',
    cues: [
      'Saisir aux genoux pas aux chevilles',
      "Balancer les jambes d'un côté de façon décisive",
      'Enjamber les jambes et épingler',
      "Se déplacer rapidement — c'est un passage de vitesse",
    ],
  },
  208: {
    name: 'HQ / Headquarters',
    description:
      "Position de passage neutre à l'intérieur de la garde, utilisée pour contrôler et préparer les clés de jambe ou les passages.",
    cues: [
      'Maintenir la position intérieure à tout prix',
      'Caler le genou pour contrôler leur hanche',
      'Crochet de talon intérieur ou cheville droite depuis ici',
      'Transitionner vers clé de jambe ou passage selon leur réponse',
    ],
  },
  209: {
    name: 'Passage en Verrou',
    description:
      'Style de passage poitrine-hanche utilisant un verrou de corps serré pour aplatir et dégager les jambes.',
    cues: [
      'Verrouiller les mains au niveau du bas du dos',
      'Tête serrée sous leur menton',
      'Pression de poitrine en avançant',
      'Dégager la ligne du genou avant de se stabiliser',
    ],
  },
  210: {
    name: 'Passage Long Step',
    description:
      'Mouvement de passage dynamique avec un grand pas autour de la garde pour exposer le contrôle latéral.',
    cues: [
      'Contrôler les hanches avant de faire le pas',
      'Le grand pas atterrit derrière leur hanche',
      "Baisser l'épaule pour épingler les jambes",
      "Changer de base pour neutraliser l'inversion",
    ],
  },
  // Sweeps (3xx)
  301: {
    name: 'Balayage de Hanche',
    description:
      "Poser la main et pousser la hanche vers l'avant depuis la garde fermée pour prendre la position supérieure.",
    cues: [
      "Briser la posture d'abord — les tirer vers l'avant",
      'Poser une main, pousser les hanches de façon explosive vers le haut',
      "S'engager totalement — l'hésitation tue le balayage",
      "Enchaîner avec un kimura s'ils prennent appui",
    ],
  },
  302: {
    name: 'Balayage en Ciseaux',
    description:
      "Utiliser un mouvement en ciseaux des jambes depuis la garde fermée pour renverser l'adversaire.",
    cues: [
      "Doit briser la posture avant d'ouvrir la garde",
      'La prise col-manche contrôle les deux côtés',
      'Ciseaux des jambes simultanément avec la traction',
      'Pousser le genou du bas dans leur hanche en balayant',
    ],
  },
  303: {
    name: 'Balayage Pendule',
    description:
      'Depuis la garde fermée, accrocher une jambe et balayer avec un mouvement de pendule.',
    cues: [
      'Accrocher leur jambe proche avec votre jambe proche',
      "Le balancement de pendule génère l'élan",
      'Tirer leur bras sur votre poitrine',
      'Pivoter vers le haut quand ils tombent',
    ],
  },
  304: {
    name: 'Balayage Papillon',
    description:
      "Utiliser les crochets papillon pour déséquilibrer l'adversaire et le balayer de côté.",
    cues: [
      "Le croc crée l'angle pour le balayage",
      'Soulever avec le crochet en tombant de côté',
      'Déséquilibrer vers le côté du croc',
      'Rouler en douceur — ne pas forcer',
    ],
  },
  305: {
    name: 'Balayage Garde en X',
    description:
      "Balayer depuis la garde en X en étendant les jambes pour faire tomber l'adversaire vers l'avant ou l'arrière.",
    cues: [
      'Étendre les deux jambes simultanément pour briser la base',
      "Déséquilibrer vers la direction du balayage d'abord",
      "S'asseoir pour les suivre vers le haut",
      'Saisir la cheville lointaine pour contrôler pendant la chute',
    ],
  },
  306: {
    name: 'Berimbolo',
    description:
      'Une inversion tournante depuis De La Riva pour prendre le dos ou gagner une position dominante.',
    cues: [
      'Inverser sous leur centre de gravité',
      'Pousser les hanches vers leur dos',
      'Saisir la cheville lointaine pour contrôler la rotation',
      'Finir en prise de dos ou position de traîne de jambe',
    ],
  },
  307: {
    name: 'Balayage De La Riva',
    description:
      'Divers balayages depuis la garde De La Riva attaquant la jambe proche ou lointaine.',
    cues: [
      'Déséquilibrer vers le côté du crochet DLR',
      'Frapper vers leur tête pour initier',
      'Pivoter sur leur jambe piégée',
      'Contrôler la cheville en remontant',
    ],
  },
  308: {
    name: 'Balayage Trépied',
    description:
      "Utiliser le pied sur la hanche et le pied sur le bicep pour balayer l'adversaire.",
    cues: [
      'Pied sur la hanche, pied sur le bicep simultanément',
      'Tirer la manche pour briser leur base',
      'Étendre les hanches en tirant la jambe vers vous',
      'Prendre la position supérieure rapidement',
    ],
  },
  309: {
    name: 'Balayage du Bûcheron',
    description:
      "Balayage depuis la garde assise en soulevant une jambe et en coupant la jambe d'appui.",
    cues: [
      "Contrôler les manches ou poignets d'abord",
      'Soulever une jambe avec votre crochet',
      "Couper la cheville d'appui lointaine avec le pied opposé",
      "S'asseoir immédiatement pour finir en position supérieure",
    ],
  },
  310: {
    name: 'Balayage Globe',
    description:
      "Balayage flottant depuis la garde ouverte qui élève l'adversaire au-dessus avant la transition supérieure.",
    cues: [
      'Les prises doivent se connecter aux manches et revers',
      'Ramener les genoux à la poitrine puis étendre',
      'Les guider au-dessus de la ligne des épaules',
      'Suivre et remonter avant le scramble',
    ],
  },
  311: {
    name: 'Balayage Old School (Gordo)',
    description:
      "Balayage fondamental depuis la demi-garde inférieure utilisant un underhook et une prise sur la cheville lointaine de l'adversaire pour le faire basculer. Popularisé par Roberto « Gordo » Correa, généralement le premier balayage de demi-garde enseigné.",
    cues: [
      "Sécuriser un underhook profond sur le bras proche de l'adversaire, puis passer la tête sous son torse",
      'Atteindre sous sa jambe libre et saisir les orteils (pas la cheville) pour le levier maximal',
      "Relâcher l'underhook, renforcer la prise avec les deux mains, puis pousser les hanches vers l'intérieur et soulever",
      "S'ils prennent appui avec la jambe libre, transitionner vers la prise de dos plutôt que de compléter le balayage",
    ],
  },
  312: {
    name: 'Balayage Kimura',
    description:
      "Balayage depuis la garde fermée utilisant la prise kimura (figure 4 sur le poignet) pour déséquilibrer et renverser l'adversaire. Si le balayage est bloqué, la même prise passe directement en soumission kimura ou ouvre un triangle.",
    cues: [
      "Briser la posture de l'adversaire, isoler un poignet et établir la double-clé (kimura)",
      "Tirer le bras à travers l'axe central ; quand ils prennent appui pour empêcher la soumission, utiliser cet appui pour soulever et balayer",
      'Si le balayage échoue, rouler sur le côté et finir la soumission kimura depuis le dessous',
      'Le balayage raté ouvre aussi le triangle et la guillotine depuis la garde — rester actif sur la prise',
    ],
  },
  313: {
    name: 'Balayage John Wayne',
    description:
      "Balayage de demi-garde utilisant le genou libre comme levier contre la cheville lointaine de l'adversaire pour le faire tomber de côté. Nommé d'après le mouvement roulant et décontracté qu'il produit.",
    cues: [
      'Depuis la demi-garde avec underhook, ouvrir la garde et poser le pied supérieur tandis que la jambe inférieure contrôle juste au-dessus de leur cheville',
      'Balancer le genou libre (supérieur) vers le haut et en arc comme un essuie-glace, le conduire à travers la ligne de cheville',
      "Combiner le levier de genou avec un pont-poussée depuis le pied d'appui pour générer la rotation",
      'Suivre le balayage pour arriver directement en contrôle latéral ou demi-garde supérieure',
    ],
  },
  // Submissions (4xx)
  401: {
    name: 'Armbar',
    description:
      "Hyperextension de l'articulation du coude en contrôlant le bras à travers le corps — appliqué depuis de nombreuses positions.",
    cues: [
      "Briser la posture avant d'aller chercher l'armbar",
      "Le bras doit croiser l'axe central du corps",
      'Serrer les genoux, pousser les hanches vers le haut',
      'Le pouce pointant vers le haut signifie que le coude est vers le bas — ajuster',
    ],
  },
  402: {
    name: 'Triangle',
    description:
      'Verrouiller la tête et le bras avec les jambes en figure 4 pour couper le flux sanguin vers le cerveau.',
    cues: [
      "Tête et un bras à l'intérieur du triangle",
      'Tirer la tête vers le bas pour compléter le verrou',
      "S'angulariser vers le côté du bras piégé",
      'Pousser le bras à travers leur axe central pour resserrer',
    ],
  },
  403: {
    name: 'Kimura',
    description:
      "Une prise en figure 4 sur le poignet faisant pivoter l'articulation de l'épaule — appliqué depuis de nombreuses positions.",
    cues: [
      'Prise en figure 4 sous le poignet, pas dessus',
      "Pivoter l'épaule vers l'extérieur et vers le haut",
      'Utiliser le poids du corps et non la seule force des bras',
      'Épingler le coude sur la hanche pour le levier',
    ],
  },
  404: {
    name: 'Omoplata',
    description:
      "Clé d'épaule utilisant les jambes pour contrôler le bras et faire pivoter l'épaule.",
    cues: [
      "Balancer la jambe sur l'épaule — pas seulement le bras",
      "S'asseoir immédiatement pour empêcher le roulement",
      'Perpendiculaire à leur corps pour une pression maximale',
      'Utiliser les hanches et non les seules jambes pour appliquer la clé',
    ],
  },
  405: {
    name: 'Étranglement de Dos',
    description:
      'Étranglement sanguin depuis le dos — bras sous le menton, bras derrière la tête.',
    cues: [
      'Bras SOUS le menton, pas sur le menton',
      'Second bras derrière la tête, pas le cou',
      'Serrer bicep et épaule ensemble',
      'Tirer le coude vers soi en serrant',
    ],
  },
  406: {
    name: 'Guillotine',
    description:
      'Bras autour du cou coupant le flux sanguin, appliqué debout ou depuis la garde.',
    cues: [
      'Entrer complètement sous le cou, pas par-dessus',
      'Guillotine coude haut pour la variation bras-dedans',
      'Tirer le bras à travers le corps en serrant',
      'Se recroqueviller et fermer la garde pour la guillotine',
    ],
  },
  407: {
    name: 'Heel Hook Extérieur',
    description:
      "Pivoter le talon vers l'extérieur pour attaquer les structures latérales du genou.",
    cues: [
      "Établir d'abord la position du crochet de talon extérieur",
      'Saisir le talon, pivoter vers la poitrine',
      'Contrôler la ligne du genou en permanence',
      'Petite rotation — les dégâts sont rapides',
    ],
  },
  408: {
    name: 'Heel Hook Intérieur',
    description:
      "Pivoter le talon vers l'intérieur pour attaquer les structures médiales du genou — extrêmement dangereux.",
    cues: [
      "Protéger d'abord son propre alignement de genou",
      'Figure 4 au niveau du tibia',
      'Pivoter le talon vers le centre',
      'Taper immédiatement — les dégâts sont silencieux et rapides',
    ],
  },
  409: {
    name: 'Clé de Cheville',
    description:
      "Appliquer une pression contre le tendon d'Achille pour attaquer la cheville.",
    cues: [
      "Prise en figure 4 — partie osseuse de l'avant-bras sur l'Achille",
      'Serrer les coudes et tomber en arrière',
      'Contrôler la ligne du genou avec les jambes',
      'Étendre les hanches et non seulement les bras pour appliquer la pression',
    ],
  },
  410: {
    name: 'Kneebar',
    description:
      "Hyperextension de l'articulation du genou, similaire à un armbar mais sur la jambe.",
    cues: [
      'Contrôler la jambe contre la poitrine',
      'Hanche vers la fosse poplitée (derrière le genou)',
      'Étendre les hanches pour créer la pression de barre',
      'Tendre la jambe complètement contre le corps',
    ],
  },
  411: {
    name: 'Darce',
    description:
      'Étranglement bras-dedans utilisant une figure 4 à travers le cou, appliqué depuis la tortue ou la garde.',
    cues: [
      'Passer le bras à travers la tête et le bras simultanément',
      'Sécuriser la prise en figure 4 sur son propre bicep',
      "Serrer et les pousser vers l'avant",
      'Finir en position supérieure ou utiliser le poids du corps depuis derrière',
    ],
  },
  412: {
    name: 'Anaconda',
    description:
      'Similaire au Darce mais avec une position de bras différente, souvent depuis le headlock frontal.',
    cues: [
      'Passer le bras sous la tête et à travers le bras',
      "Pousser l'épaule vers le cou",
      'Rouler vers le côté du bras piégé pour finir',
      "Serrer en poussant le poids du corps vers l'intérieur",
    ],
  },
  413: {
    name: 'Arc-en-ciel (Bow and Arrow)',
    description:
      'Puissant étranglement de revers depuis le dos utilisant la prise de ceinture et pantalon pour le levier final.',
    cues: [
      "Prise profonde de revers du côté de l'étranglement",
      'Prise de pantalon ou de ceinture sur la jambe du côté opposé',
      "Étendre le corps pour créer l'arc",
      "Tirer le revers vers soi, pousser la jambe vers l'extérieur",
    ],
  },
  414: {
    name: 'Étranglement en Croix',
    description:
      'Double prise de revers depuis la monture ou la garde en croisant pour étrangler.',
    cues: [
      "Les deux prises croisent l'axe central de leur revers",
      "Faire pivoter les poignets vers l'intérieur en appliquant la pression",
      'Pousser les coudes vers le sol',
      "Se redresser en monture avant d'appliquer",
    ],
  },
  415: {
    name: 'Ezekiel',
    description:
      "Étranglement par prise de manche depuis la monture, peut même être appliqué à l'intérieur de la garde de l'adversaire.",
    cues: [
      "La manche va d'abord contre le cou",
      'La paume pousse à travers la gorge',
      "Serrer et pivoter l'étranglement",
      "Fonctionne même depuis l'intérieur de leur garde — inattendu",
    ],
  },
  416: {
    name: 'Americana',
    description:
      "Clé d'épaule en figure 4 pliant le poignet vers le haut — appliqué depuis la monture ou le contrôle latéral.",
    cues: [
      "Épingler le poignet au sol d'abord",
      'La prise en figure 4 sécurise le bras',
      'Pousser le coude vers leur hanche en petits cercles',
      'Toujours garder le poignet plus bas que le coude',
    ],
  },
  417: {
    name: 'Triangle Bras',
    description:
      "Étranglement sanguin tête-et-bras fini depuis la monture ou le contrôle latéral avec pression d'épaule.",
    cues: [
      "Piéger leur bras croisant le cou d'abord",
      'Tête basse du même côté que le bras piégé',
      "Marcher sur le côté en serrant l'épaule",
      'Finir avec chute de poitrine et pression',
    ],
  },
  418: {
    name: 'Étranglement Nord-Sud',
    description:
      "Étranglement nord-sud utilisant la pression de l'épaule et du grand dorsal autour du cou.",
    cues: [
      "Le bras s'enroule profondément autour de la ligne du cou",
      "Pression d'épaule vers le bas, pas de traction vers le haut",
      'Écarter les hanches pour resserrer',
      'Cacher le coude et garder la poitrine lourde',
    ],
  },
  419: {
    name: 'Armbar Inversé',
    description:
      "Variante d'armbar paume vers le haut appliquée depuis la garde fermée ou papillon, hyperextendant le coude dans le sens opposé à l'armbar standard. En cas d'échec, la transition vers l'armbar classique est naturelle.",
    cues: [
      "Depuis la garde fermée, isoler un bras et déplacer le poids dans la direction de l'attaque pour charger la pression sur leur coude",
      'Garder leur paume vers le haut (supinée) ; la jambe presse sur leur avant-bras pour appliquer le levier',
      "Tirer leur poignet vers l'épaule et pousser le tibia vers le bas pour la finition",
      "S'ils empilent ou se redressent, transitionner immédiatement vers l'armbar standard en passant la jambe au-dessus de la tête",
    ],
  },
  420: {
    name: 'Toe Hold',
    description:
      "Clé de jambe ciblant la cheville et le pied avec une prise en figure 4 style kimura sur le pied, tordant le pied vers l'intérieur pour déchirer les ligaments de la cheville. Appliqué le plus souvent depuis l'ashi garami, le 50/50 ou les enchevêtrements de demi-garde.",
    cues: [
      "Piéger la jambe pour empêcher l'échappée ; saisir le dessus du pied (auriculaire aligné avec l'auriculaire du pied) et passer l'autre bras sous leur tibia pour verrouiller sur son propre poignet",
      'Garder le pied collé à la poitrine — tout espace leur permet de se dégager',
      "Pivoter tout le corps pour tourner le pied vers l'intérieur (vers leur hanche opposée) plutôt que d'utiliser seulement la force des bras",
      "Contrôler la ligne du genou avant d'appliquer la pression ; un genou non contrôlé leur permettra de rouler et s'échapper",
    ],
  },
  421: {
    name: 'Calf Slicer',
    description:
      "Clé de compression qui coince le tibia derrière le genou de l'adversaire et plie la jambe, écrasant le muscle du mollet contre le tibia. Les setups courants incluent la position tortue, la demi-garde profonde et la garde en X.",
    cues: [
      "Coincer le tibia derrière l'articulation du genou comme fulcrum ; plus le tibia est profond, plus la pression est efficace",
      'Sécuriser une figure 4 avec les jambes et contrôler leur cou-de-pied ou cheville avec les deux mains',
      'Tourner le tranchant du tibia dans leur mollet (comme en dorsiflexion de la cheville) en tirant leur cheville vers soi',
      "La pression se développe vite — finir avant qu'ils roulent ; utiliser une prise ceinture ou un crochet si disponible pour bloquer le roulement",
    ],
  },
  422: {
    name: 'Triangle depuis la Monture',
    description:
      "Étranglement sanguin appliqué depuis la monture supérieure en passant une jambe au-dessus du cou et en verrouillant une figure 4 avec l'autre jambe, similaire au triangle de garde fermée mais avec l'avantage du poids d'être au-dessus.",
    cues: [
      "Depuis la monture haute, remonter les genoux au-delà des coudes de l'adversaire pour que leurs bras soient au-dessus du plan des coudes",
      'Isoler un bras en contrôlant le poignet ; passer la jambe extérieure au-dessus du cou pour commencer le verrouillage du triangle',
      "Verrouiller la figure 4 (tibia derrière le genou) et ajuster l'angle avec la pression de hanche plutôt que de s'inverser",
      "Serrer les genoux ensemble et pousser le bras piégé à travers l'axe central pour resserrer l'étranglement",
    ],
  },
  // Takedowns & Throws (5xx)
  501: {
    name: 'Double Jambe',
    description:
      "Pénétrer sur les deux jambes et pousser pour soulever ou faire trébucher l'adversaire au sol.",
    cues: [
      "Changement de niveau — s'abaisser avant le tir",
      'Le pas de pénétration entre dans leurs hanches',
      "Tête à l'extérieur — jamais à l'intérieur",
      "Pousser vers l'avant et vers le haut, puis faire trébucher ou soulever",
    ],
  },
  502: {
    name: 'Simple Jambe',
    description:
      "Contrôler une jambe et utiliser des crochets ou des soulèvements pour faire tomber l'adversaire.",
    cues: [
      'Sécuriser la jambe à la cuisse pas à la cheville',
      'Pousser à travers leur centre de gravité',
      'Courir le tuyau ou crocheter la cheville pour finir',
      "Garder la tête haute et vers l'extérieur",
    ],
  },
  503: {
    name: 'Projection de Hanche (O-goshi)',
    description:
      "Charger l'adversaire sur la hanche et pivoter pour le projeter au sol.",
    cues: [
      "Briser leur équilibre vers l'avant d'abord",
      'Charger la hanche directement sous leur centre',
      'Pivoter — les hanches font face à la même direction que les leurs',
      'Pivoter et tirer sur la hanche en douceur',
    ],
  },
  504: {
    name: 'Seoi Nage',
    description:
      "Tirer l'adversaire par-dessus l'épaule pour une grande projection.",
    cues: [
      'Les tirer en pivotant dessous',
      "Pousser l'épaule sous leur aisselle",
      'Charger leur poids sur le dos',
      'Pivoter complètement et les tirer par-dessus',
    ],
  },
  505: {
    name: 'Uchi Mata',
    description:
      "Balayer l'intérieur de la jambe de l'adversaire en brisant son équilibre.",
    cues: [
      "Briser l'équilibre vers leur coin avant",
      'Balayer la cuisse intérieure — pas le pied',
      'Pivoter complètement sur la projection',
      'Les pousser par-dessus la jambe balayeuse',
    ],
  },
  506: {
    name: 'Osoto Gari',
    description:
      "Faucher la jambe de l'adversaire par l'extérieur en le poussant en arrière.",
    cues: [
      "Briser l'équilibre vers leur coin arrière",
      'Faire un pas profond près de leur jambe',
      'Faucher la jambe en conduisant tête et épaule',
      "S'engager totalement — ne pas hésiter",
    ],
  },
  507: {
    name: 'Ankle Pick',
    description:
      "Saisir la cheville en poussant la tête pour faire trébucher l'adversaire.",
    cues: [
      'Pousser leur tête vers le bas quand ils font un pas',
      'Saisir la cheville du même côté',
      'Avancer en soulevant la cheville',
      'Suivre rapidement vers la position supérieure',
    ],
  },
  508: {
    name: "Fireman's Carry",
    description:
      "Charger l'adversaire sur le dos en saisissant le bras et la cheville.",
    cues: [
      'Contrôler un bras et la cheville opposée',
      'Plonger sous et charger sur les épaules',
      "Pousser l'épaule vers leur aisselle",
      'Les rouler par-dessus le dos pour finir',
    ],
  },
  509: {
    name: 'De Ashi Barai',
    description:
      "Balayage basé sur le timing qui retire un pied en mouvement pour faire tomber l'adversaire proprement.",
    cues: [
      'Attaquer quand leur poids se déplace',
      'Utiliser la traction manche et revers pour déséquilibrer',
      'Balayer bas au niveau de la cheville',
      'La direction du balayage suit leur pas',
    ],
  },
  510: {
    name: 'Clinch Frontal',
    description:
      "Tirer la tête et la posture de l'adversaire vers le bas pour sécuriser le contrôle en headlock frontal.",
    cues: [
      'Tirer avec les coudes pas les poignets',
      'Reculer en tirant vers le bas',
      'Tourner immédiatement pour créer un angle',
      'Sécuriser la prise du menton et le contrôle du coude',
    ],
  },
  511: {
    name: 'Snap Down vers Prise de Dos',
    description:
      "Un snap down qui, au lieu de se terminer en headlock frontal, utilise l'élan de l'adversaire pour pivoter directement derrière lui et sécuriser le contrôle de dos. Se distingue du snap down vers headlock frontal en circulant derrière la hanche plutôt que de sécuriser une position frontale.",
    cues: [
      'Depuis un collar-tie, exécuter un snap down vers le bas pour briser la posture et amener la tête sous les hanches',
      'Quand ils avancent ou récupèrent, relâcher la tête et faire un pas latéral derrière leur hanche plutôt que de se plaquer en position frontale',
      "Enrouler le bras extérieur autour du torse avec la prise ceinture de sécurité (un bras au-dessus, un en dessous) avant qu'ils ne puissent se relever",
      'Compléter la prise de dos en insérant les deux crochets pour le contrôle de dos',
    ],
  },
  512: {
    name: 'Arm Drag vers Prise de Dos',
    description:
      "Entrée de projection utilisant un arm drag à deux mains (prise poignet et tricep) pour rediriger le bras de l'adversaire à travers le corps et passer derrière lui pour le contrôle de dos. Très adaptable depuis debout, assis et garde papillon.",
    cues: [
      "Saisir le poignet du même côté de l'adversaire pouce vers le bas ; simultanément atteindre profondément vers leur tricep avec l'autre main",
      "Tirer le bras fermement à travers l'axe central en faisant un pas latéral du pied du même côté derrière leur hanche — garder la tête collée à leur poitrine",
      'Enrouler le bras extérieur autour de leur taille et verrouiller la main sur leur hanche lointaine ; cela bloque leur rotation',
      'Compléter la prise de dos en les amenant au tatami avec un retour au tapis ou un balayage de pied, puis insérer les crochets',
    ],
  },
  // Escapes (6xx)
  601: {
    name: 'Pont et Retournement (Upa)',
    description:
      "Pont explosif depuis la monture pour renverser l'adversaire, récupérer la garde ou prendre la position supérieure.",
    cues: [
      'Piéger un bras ET une jambe du même côté',
      'Pont explosif — penser droit vers le haut, pas en arc',
      "Rouler sur l'épaule piégée",
      'Utiliser les pieds pour pousser le sol pour la puissance',
    ],
  },
  602: {
    name: 'Escape de Crevette',
    description:
      "Créer de l'espace en faisant la crevette et replacer la garde depuis le dessous.",
    cues: [
      'Créer un cadre sur la hanche avant de faire la crevette',
      "Faire la crevette vers l'extérieur — créer de l'espace pour le genou",
      "Pousser le genou vers l'intérieur pour replacer la garde",
      'Rester sur le côté — jamais à plat sur le dos',
    ],
  },
  603: {
    name: 'Escape du Contrôle Latéral',
    description:
      'Utiliser le mouvement de crevette pour récupérer la garde depuis le contrôle latéral.',
    cues: [
      'Cadrer sur la hanche et le cou simultanément',
      "Pont pour créer de l'espace puis faire la crevette",
      "Faire la crevette vers l'extérieur et replacer le genou de garde",
      'Rester sur le côté tout au long — jamais à plat',
    ],
  },
  604: {
    name: 'Escape du Dos',
    description:
      'Protéger le cou, retirer la ceinture de sécurité et récupérer la garde depuis le contrôle de dos.',
    cues: [
      "Priorité un : protéger le cou de l'étranglement",
      "Retirer la ceinture — se battre d'abord pour le bras supérieur",
      'Pivoter vers eux du même côté que leurs crochets',
      "Rouler vers la garde en créant l'angle",
    ],
  },
  605: {
    name: 'Défense Guillotine',
    description:
      "Se redresser, tourner vers l'étranglement et trouver le cou pour s'échapper.",
    cues: [
      'Se redresser immédiatement — ne pas rentrer le menton',
      'Tourner vers le bras qui étrangle',
      'Empiler et avancer pour enlever la pression',
      "Trouver leur cou pour les contrôler pendant l'échappée",
    ],
  },
  606: {
    name: 'Défense Triangle',
    description:
      "Empiler, se redresser et utiliser des ruptures de prise pour s'échapper du triangle.",
    cues: [
      'Empiler leurs hanches immédiatement — enlever le poids',
      "Se redresser — menton en l'air, dos droit",
      'Briser leur prise sur la tête ou le poignet',
      "Enjamber leur jambe pour s'échapper du triangle",
    ],
  },
  607: {
    name: 'Escape du Genou au Ventre',
    description:
      "Séquence d'échappée pour retirer la pression du genou et récupérer la garde ou la demi-garde.",
    cues: [
      'Cadrer sur leur genou et hanche',
      'Pont puis faire la crevette sous la pression',
      "Attraper leur jambe d'avancée pour la demi-garde",
      'Ne pas pousser avec les bras tendus',
    ],
  },
  608: {
    name: "Défense de l'Armbar",
    description:
      "Famille d'échappées depuis la soumission armbar, la défense par empilement étant l'option principale pour les débutants. Posture, rotation du pouce et poids du corps combinés pour relâcher la pression sur le coude et extraire le bras.",
    cues: [
      "Dès que l'armbar est sécurisé, saisir son propre avant-bras pour créer une connexion à deux bras et gagner du temps",
      "Se mettre sur les orteils et empiler la poitrine vers le bas sur l'adversaire, soulever leurs hanches hors du tatami pour supprimer le fulcrum",
      "Pivoter le pouce vers le haut (supiner) en tirant le coude à travers leurs jambes — cela change l'angle et libère le coude",
      'Écarter les jambes et prendre appui pour les empêcher de refermer sur le bras',
    ],
  },
  609: {
    name: 'Défense du Triangle',
    description:
      'Échappée basée sur la posture depuis un triangle depuis la garde. Empiler, se redresser et briser la prise avant que le flux sanguin soit coupé — le temps est le facteur critique.',
    cues: [
      "Rentrer le coude du bras piégé vers l'axe central immédiatement pour ralentir l'étranglement",
      "Se redresser fortement et empiler les hanches vers la tête de l'adversaire, chargeant le poids du corps pour réduire leur levier",
      'Marcher les pieds vers eux, redresser le dos et libérer le verrou en poussant leur genou avec la main libre',
      "Une fois le verrou brisé, passer la garde ou sécuriser une position défensive avant qu'ils ne la rétablissent",
    ],
  },
  610: {
    name: 'Défense du Triangle depuis la Monture',
    description:
      "Échappée de dernier recours depuis le triangle depuis la monture — parmi les positions les plus difficiles à s'échapper. Nécessite de soulever les hanches de façon explosive et de pivoter pour créer une séparation avant que le flux sanguin s'arrête.",
    cues: [
      'Poster le bras libre sous leur aisselle (pas à travers le corps) pour les empêcher de verrouiller le bras dans le triangle',
      'Verrouiller les mains ensemble et étendre les bras vers leur hanche lointaine pour créer même une séparation minimale',
      "Ponter les hanches de façon explosive vers leur bas du dos pendant qu'ils ajustent encore le verrou",
      "Enjamber leur corps pour pivoter — même atterrir en contrôle latéral inférieur est une victoire face à l'étranglement",
    ],
  },
  611: {
    name: 'Défense Guillotine depuis la Chute de Garde',
    description:
      "Défense contre une guillotine attrapée pendant la phase de chute de garde ou les transitions de projection — distincte de la défense de guillotine depuis les positions debout ou de lutte. L'attaquant a une prise tête-et-bras quand on va au sol.",
    cues: [
      "Dès que la guillotine est sécurisée, rentrer fortement le menton vers l'épaule du bras piégé pour protéger la trachée",
      "Poster les deux mains sur leurs hanches et se redresser — ne jamais pencher la tête plus loin vers l'intérieur, ce qui resserre l'étranglement",
      'Marcher les pieds autour du même côté que le bras piégé (le côté bras-dedans) pour relâcher la pression',
      "Une fois l'angle brisé, passer le bras extérieur par-dessus leur épaule et tirer vers le bas pour briser la prise",
    ],
  },
  612: {
    name: 'Granby Roll',
    description:
      "Échappée par inversion depuis la position tortue : rouler par-dessus une épaule (sans exposer la nuque) pour retrouver la garde ou atteindre un scramble neutre. Nommé d'après le lycée de Granby en lutte.",
    cues: [
      "Rentrer l'épaule de roulement ; ne jamais exposer la nuque — la tête reste baissée",
      'Garder les orteils du pied avant sur le tatami tout au long pour rouler en ligne droite et contrôlée',
      "Conduire les hanches et les jambes vers le haut et en arc ; elles doivent atterrir vers l'adversaire pour créer des cadres de garde immédiats",
      "Dès que les hanches touchent le tatami, sortir les deux jambes comme cadres de garde — le roulement n'est complet que quand la garde est rétablie",
    ],
  },
  613: {
    name: 'Défense du Headlock Latéral',
    description:
      "Échappée depuis un headlock latéral assis (kesa gatame / scarf hold), où l'adversaire est assis à côté contrôlant la tête et le bras. Utilise le pontage et le mouvement de hanche pour déséquilibrer et récupérer.",
    cues: [
      "Protéger le bras piégé en le gardant plié et proche du corps — ne pas le tendre ou l'étranglement se resserre",
      "Ponter vers l'adversaire pour charger le poids sur lui, puis utiliser l'élan du pont pour le rouler par-dessus le corps",
      "S'ils prennent appui pour arrêter le roulement, faire la crevette dans la direction opposée pour libérer la tête",
      'Une fois la tête libre, récupérer immédiatement la garde ou scrambler vers une position neutre',
    ],
  },
  // Positions (7xx)
  701: {
    name: 'Monture',
    description:
      "S'asseoir sur le torse de l'adversaire — l'une des positions les plus dominantes en BJJ.",
    cues: [
      'Monture haute : crochets derrière leurs bras',
      'Garder les hanches lourdes — ne pas prendre appui',
      'Contrôler les deux bras pour ouvrir les soumissions',
      'Anticiper le pont — poser le pied pour contrer',
    ],
  },
  702: {
    name: 'Contrôle Latéral',
    description:
      "Contrôler l'adversaire depuis le côté avec une pression poitrine à poitrine.",
    cues: [
      'Pression de poitrine dans leur poitrine — pas leurs bras',
      "Le cross-face tourne leur tête vers l'extérieur",
      'Le croc contrôle leur bras proche',
      "Poids vers l'avant — les garder à plat",
    ],
  },
  703: {
    name: 'Contrôle de Dos',
    description:
      "S'attacher au dos de l'adversaire avec des crochets à l'intérieur, la position la plus dangereuse en BJJ.",
    cues: [
      'Crochets à hauteur de hanche — pas les jambes',
      "Ceinture de sécurité : paume vers l'intérieur sur le bras d'étranglement",
      'Garder ses hanches plus basses que les leurs',
      "Contrôle deux-contre-un avant d'aller chercher l'étranglement",
    ],
  },
  704: {
    name: 'Nord-Sud',
    description:
      "Contrôler l'adversaire tête à tête, perpendiculaire à son corps.",
    cues: [
      'Contrôle de tête — couronne de tête dans leur menton',
      "Poids vers l'avant sur leur poitrine",
      'Contrôler les deux bras contre les hanches',
      'Transitionner vers Darce ou kimura depuis ici',
    ],
  },
  705: {
    name: 'Genou au Ventre',
    description:
      "Enfoncer le genou dans le ventre de l'adversaire — une position transitionnelle et d'attaque.",
    cues: [
      'Tibia à travers le ventre — pas seulement le genou',
      'Prise du bras lointain et prise de revers pour la stabilité',
      'Prêt à transitionner quand ils font un pont et poussent',
      'Utiliser la pression pour forcer des réactions pour les soumissions',
    ],
  },
  706: {
    name: 'Position Tortue',
    description:
      "Position de la tortue — position défensive à quatre pattes que l'adversaire doit ouvrir pour attaquer.",
    cues: [
      'Menton sur la poitrine — protéger toujours le cou',
      'Prendre appui sur la tête et les mains pour la structure',
      "Chercher le sit-out ou le roulement pour s'échapper",
      "Ne jamais rester statique — créer du mouvement pour s'échapper",
    ],
  },
  707: {
    name: 'Demi-garde Supérieure',
    description:
      "Position de contrôle supérieur pendant que l'adversaire a une jambe piégée, idéale pour les passages sous pression.",
    cues: [
      'Cross-face et croc comme priorités',
      'Aplatir les hanches avant de libérer la jambe',
      'Reculer la ligne du genou pour dégager le piège',
      'Changer de base quand ils utilisent le bouclier de genou',
    ],
  },
  708: {
    name: 'S-Mount',
    description:
      "Variation avancée de la monture où un genou est posté haut près de l'oreille de l'adversaire tandis que le pied opposé reste au sol, formant un S avec les jambes. Cette configuration isole un bras et crée une plateforme extrêmement serrée pour les finitions en armbar et triangle.",
    cues: [
      "Depuis la monture haute, attendre que l'adversaire pousse les coudes vers le haut comme cadre — cette ouverture est la fenêtre d'entrée en S-mount",
      "Glisser (pas enjamber) un genou jusqu'à leur oreille le long du tatami ; enjamber leur donne de l'espace pour récupérer",
      "Fermer tout l'espace immédiatement après avoir glissé ; poster le pied opposé stabilise la position",
      "L'armbar est la finition principale — la position S pré-charge le bras ; aller directement dessus sans réinitialiser",
    ],
  },
  709: {
    name: 'Crucifix',
    description:
      "Position de contrôle attaquant un adversaire en tortue où un bras est piégé par les jambes et l'autre par les mains, immobilisant les deux bras simultanément. L'entrée se fait typiquement depuis un sprawl ou une attaque de dos sur la tortue.",
    cues: [
      "Depuis un sprawl ou une position d'attaque de dos, circuler d'un côté et coincer le genou proche dans la tortue pour l'ouvrir",
      'Enfiler le bras proche sous leur bras lointain, le prenant avec le coude ; les jambes piègent le bras proche en figure 4',
      'Maintenir une pression poitrine-sur-dos tout au long ; tout espace leur permet de tirer le bras libre',
      'Attaques principales : étranglement arrière (le bras libre passe sous le menton), étranglement de revers et kimura depuis le bras lointain',
    ],
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
  DRILLING: 'Drills',
}

const FR_CONNECTION_TYPES: LanguagePack['connectionTypes'] = {
  FOLLOW_UP: 'Enchaînement',
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
