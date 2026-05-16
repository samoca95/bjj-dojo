import type { ConnectionType, Difficulty, SessionType } from '../../types'
import type { LanguagePack, TranslationKey } from './types'

const ES_TRANSLATIONS = {
  Home: 'Inicio',
  Sessions: 'Sesiones',
  Techniques: 'Técnicas',
  Settings: 'Ajustes',
  'Track your journey on the mats': 'Sigue tu camino en el tatami',
  'YOUR STATS': 'TUS ESTADÍSTICAS',
  'Mat Time': 'Tiempo en Tatami',
  'Taps Given': 'Sumisiones Aplicadas',
  'Taps Received': 'Sumisiones Recibidas',
  'PLANNED SESSIONS': 'SESIONES PLANIFICADAS',
  'PRACTICE SESSIONS': 'SESIONES PRACTICADAS',
  'QUICK ACCESS': 'ACCESO RÁPIDO',
  TRENDING: 'TENDENCIAS',
  'Training Sessions': 'Sesiones de Entrenamiento',
  'Log and review your mat time': 'Registra y revisa tu tiempo en tatami',
  'Technique Library': 'Biblioteca de Técnicas',
  '60+ techniques with YouTube refs':
    'Más de 60 técnicas con referencias de YouTube',
  Categories: 'Categorías',
  Clubs: 'Academias',
  'No clubs yet. Add one above.': 'Aún no hay academias. Añade una arriba.',
  'ADD CLUB': 'AÑADIR ACADEMIA',
  'e.g. Main Dojo': 'p. ej. Academia Principal',
  'Add Club': 'Añadir Academia',
  Save: 'Guardar',
  Cancel: 'Cancelar',
  Edit: 'Editar',
  Delete: 'Eliminar',
  'Move up': 'Mover arriba',
  'Move down': 'Mover abajo',
  Order: 'Orden',
  'THEME MODE': 'MODO DE TEMA',
  Black: 'Oscuro',
  Light: 'Claro',
  'Session type': 'Tipo de sesión',
  'Customize icons for each session type':
    'Personaliza los iconos de cada tipo de sesión',
  'Manage technique categories and icons':
    'Gestiona categorías e iconos de técnicas',
  'Manage your training locations': 'Gestiona tus lugares de entrenamiento',
  Language: 'Idioma',
  English: 'Inglés',
  Spanish: 'Español',
  'Search…': 'Buscar…',
  'SESSION TYPE ICONS': 'ICONOS DE TIPO DE SESIÓN',
  'No sessions yet': 'Aún no hay sesiones',
  'Tap + to log your first training':
    'Pulsa + para registrar tu primer entrenamiento',
  DATE: 'FECHA',
  DURATION: 'DURACIÓN',
  'SESSION TYPE': 'TIPO DE SESIÓN',
  CLUB: 'ACADEMIA',
  Manage: 'Gestionar',
  Another: 'Otra',
  Custom: 'Personalizado',
  Minutes: 'Minutos',
  'ENERGY LEVEL': 'NIVEL DE ENERGÍA',
  Exhausted: 'Agotado',
  Low: 'Bajo',
  Average: 'Medio',
  Good: 'Bueno',
  Peak: 'Máximo',
  'TECHNIQUES PRACTICED': 'TÉCNICAS PRACTICADAS',
  'Add techniques…': 'Añadir técnicas…',
  'TAPS / SUBMISSIONS': 'SUMISIONES',
  'Github repo': 'Repositorio en Github',
  Given: 'Aplicadas',
  Received: 'Recibidas',
  NOTES: 'NOTAS',
  'What clicked? What to fix?': '¿Qué funcionó? ¿Qué mejorar?',
  'What did you work on? Any insights?':
    '¿Qué trabajaste? ¿Alguna observación?',
  'Select Techniques': 'Seleccionar Técnicas',
  'Select Technique — Tap Given': 'Seleccionar Técnica — Sumisión Aplicada',
  'Select Technique — Tap Received': 'Seleccionar Técnica — Sumisión Recibida',
  Done: 'Listo',
  'Search techniques…': 'Buscar técnicas…',
  'Search sessions…': 'Buscar sesiones…',
  'Search sessions': 'Buscar sesiones',
  'Search all icons…': 'Buscar todos los iconos…',
  'Add new technique…': 'Añadir técnica nueva…',
  'NEW TECHNIQUE': 'NUEVA TÉCNICA',
  Add: 'Añadir',
  'Technique name': 'Nombre de técnica',
  'Log Session': 'Registrar Sesión',
  'Edit Session': 'Editar Sesión',
  Duration: 'Duración',
  Energy: 'Energía',
  Club: 'Academia',
  Notes: 'Notas',
  'No techniques logged for this session.':
    'No se registraron técnicas en esta sesión.',
  Unknown: 'Desconocida',
  'Taps / Submissions': 'Sumisiones',
  'New Technique': 'Nueva Técnica',
  'Edit Technique': 'Editar Técnica',
  NAME: 'NOMBRE',
  CATEGORY: 'CATEGORÍA',
  DIFFICULTY: 'DIFICULTAD',
  DESCRIPTION: 'DESCRIPCIÓN',
  'YOUTUBE URL': 'URL DE YOUTUBE',
  'COACHING CUES': 'CLAVES TÉCNICAS',
  'TECHNIQUE CONNECTIONS': 'CONEXIONES ENTRE TÉCNICAS',
  'No connections yet.': 'Aún no hay conexiones.',
  'Unknown technique': 'Técnica desconocida',
  Remove: 'Quitar',
  'Request a feature': 'Solicitar una función',
  'Select connected technique…': 'Selecciona técnica conectada…',
  'Add Connection': 'Añadir conexión',
  'Delete Technique': 'Eliminar Técnica',
  'Watch on YouTube': 'Ver en YouTube',
  'Leads To / Follow-ups': 'Conduce a / Seguimientos',
  'Can Be Set Up From': 'Puede iniciarse desde',
  Graph: 'Gráfico',
  List: 'Lista',
  'Technique Graph': 'Grafo de Técnicas',
  'Open technique graph': 'Abrir grafo de técnicas',
  'No connections to display': 'No hay conexiones para mostrar',
  'Reset view': 'Restablecer vista',
  'Zoom in': 'Acercar',
  'Zoom out': 'Alejar',
  Clear: 'Limpiar',
  Filter: 'Filtrar',
  FILTERS: 'FILTROS',
  'Weekly goal': 'Meta semanal',
  Avg: 'Prom.',
  'Avg taps': 'Prom. taps',
  weeks: 'semanas',
  'w.': 's.',
  'FOCUS TECHNIQUES': 'TÉCNICAS DE ENFOQUE',
  'Set focus': 'Definir enfoque',
  'Select focus techniques': 'Selecciona técnicas de enfoque',
  'No focus techniques selected': 'No hay técnicas de enfoque seleccionadas',
  'Given submissions': 'Sumisiones aplicadas',
  Submissions: 'Sumisiones',
  'Received: total submissions you got caught in.\nGiven: total submissions you finished.\nAvg: average Given submissions across your last 5 logged sessions.\nThe 5 blue bars show Given submissions for each of those sessions (oldest to newest).':
    'Recibidas: total de sumisiones en las que te sometieron.\nAplicadas: total de sumisiones que finalizaste.\nProm.: promedio de sumisiones aplicadas en tus últimas 5 sesiones registradas.\nLas 5 barras azules muestran las sumisiones aplicadas en cada una de esas sesiones (de la más antigua a la más reciente).',
  Icons: 'Iconos',
  Emoji: 'Emoji',
  Suggested: 'Sugeridos',
  'All Icons': 'Todos los iconos',
  'Paste or type an emoji': 'Pega o escribe un emoji',
  'e.g. 🥋': 'p. ej. 🥋',
  Suggestions: 'Sugerencias',
  Use: 'Usar',
  All: 'Todas',
  min: 'min',
  'TRAINING CALENDAR': 'CALENDARIO DE ENTRENO',
  'White Belt': 'Cinturón Blanco',
  'Blue Belt': 'Cinturón Azul',
  'Purple Belt': 'Cinturón Morado',
  'Brown Belt': 'Cinturón Marrón',
  'Black Belt': 'Cinturón Negro',
  'Previous month': 'Mes anterior',
  'Next month': 'Mes siguiente',
  Mon: 'Lun',
  Tue: 'Mar',
  Wed: 'Mié',
  Thu: 'Jue',
  Fri: 'Vie',
  Sat: 'Sáb',
  Sun: 'Dom',
  'Section unavailable': 'Sección no disponible',
  'Hide section': 'Ocultar sección',
  'Show section': 'Mostrar sección',
  'No matching sessions': 'No hay sesiones que coincidan',
  'Try a different search or filter': 'Prueba otra búsqueda o filtro',
  'Try again': 'Reintentar',
  'Storage full': 'Almacenamiento lleno',
  'Your device storage is full. Export a backup to free up space.':
    'El almacenamiento del dispositivo está lleno. Exporta un respaldo para liberar espacio.',
  'Export backup': 'Exportar respaldo',
  Dismiss: 'Cerrar',
  // Settings section headings & labels
  'YOUR BELT': 'TU CINTURÓN',
  'Your name': 'Tu nombre',
  'THEME & LANGUAGE': 'TEMA E IDIOMA',
  Theme: 'Tema',
  Dark: 'Oscuro',
  Stripes: 'Grados',
  'HOME SECTION ORDER': 'ORDEN DEL INICIO',
  'Home section order': 'Orden del inicio',
  'Reorder the sections on the home screen and hide the ones you do not want to see.':
    'Reordena las secciones de la pantalla principal y oculta las que no quieras ver.',
  'WEEKLY MAT TIME GOAL': 'META SEMANAL DE TATAMI',
  'Default:': 'Predeterminado:',
  'Reset pre-filled techniques': 'Restablecer técnicas predefinidas',
  'Only pre-filled techniques and links are reset; custom techniques are kept.':
    'Solo se reinician técnicas y conexiones predefinidas; las personalizadas no se eliminan.',
  'BACKUP & RECOVERY': 'RESPALDO Y RECUPERACIÓN',
  'Export JSON': 'Exportar JSON',
  'Import JSON': 'Importar JSON',
  'Use export/import to recover your data if browser storage is lost.':
    'Usa exportar/importar para recuperar tus datos si el almacenamiento del navegador se pierde.',
  'LOCAL LOGGING': 'REGISTRO LOCAL',
  'Logged events:': 'Eventos registrados:',
  'Clear logs': 'Limpiar registros',
  'App version:': 'Versión de la app:',
  'Developed by:': 'Desarrollado por:',
  French: 'Francés',
  // Alert messages
  'Backup imported successfully.': 'Respaldo importado correctamente.',
  'Could not import backup.': 'No se pudo importar el respaldo.',
  'Reset all pre-filled techniques?\nYour custom techniques will be preserved.':
    '¿Restablecer todas las técnicas predefinidas?\nTus técnicas personalizadas no se eliminarán.',
  'Pre-filled techniques were reset successfully.':
    'Técnicas predefinidas restablecidas correctamente.',
  'Could not reset techniques.': 'No se pudo restablecer.',
  'Export session': 'Exportar sesión',
  // Gamification
  GAMIFICATION: 'GAMIFICACIÓN',
  'THIS WEEK': 'ESTA SEMANA',
  'LEVEL AND SCORES': 'NIVEL Y PUNTUACIONES',
  'LEVEL AND SCORES VIEW': 'VISTA DE NIVEL Y PUNTUACIONES',
  'Choose which level and score cards are shown on Home.':
    'Elige qué tarjetas de nivel y puntuaciones se muestran en Inicio.',
  Achievements: 'Logros',
  'View all': 'Ver todos',
  Locked: 'Bloqueado',
  Earned: 'Ganado',
  'Edit cards': 'Editar tarjetas',
  'Done editing': 'Terminar edición',
  'Daily streak': 'Racha diaria',
  Streaks: 'Rachas',
  'Weekly streak': 'Racha semanal',
  'd.': 'd.',
  Level: 'Nivel',
  XP: 'XP',
  'Your level increases as your total XP grows. Levels get progressively harder to reach.':
    'Tu nivel sube cuando aumentan tus XP totales. Cada nivel requiere más progreso.',
  'Level thresholds: L1 0 XP, L2 100 XP, L3 300 XP, L4 600 XP, L5 1000 XP. Each next level needs 100 XP more than the previous one.':
    'Umbrales de nivel: N1 0 XP, N2 100 XP, N3 300 XP, N4 600 XP, N5 1000 XP. Cada nivel siguiente requiere 100 XP más que el anterior.',
  'XP comes from mat time, submissions given, and sessions logged. Mat time gives 1 XP every 15 minutes.':
    'Los XP vienen del tiempo en tatami, sumisiones aplicadas y sesiones registradas. El tatami da 1 XP cada 15 minutos.',
  'Consecutive days with at least one logged training session.':
    'Días consecutivos con al menos una sesión registrada.',
  'Consecutive weeks with at least one logged training session.':
    'Semanas consecutivas con al menos una sesión registrada.',
  'Milestones unlocked from your long-term training consistency and progress.':
    'Hitos que se desbloquean por tu constancia y progreso a largo plazo.',
  'Lifetime hours': 'Horas totales',
  'Next tier': 'Siguiente rango',
  // Rank tiers
  Recruit: 'Recluta',
  'White Belt Spirit': 'Espíritu Cinturón Blanco',
  Striped: 'Graduado',
  Roller: 'Rodador',
  Grinder: 'Guerrero',
  Veteran: 'Veterano',
  'Black Belt Path': 'Camino al Negro',
  Legend: 'Leyenda',
  // Focus goals
  'Set goal': 'Fijar meta',
  'Clear goal': 'Borrar meta',
  'Goal type': 'Tipo de meta',
  Target: 'Objetivo',
  'Sessions used in': 'Sesiones usando',
  'Taps given': 'Sumisiones dadas',
  Drilled: 'Repeticiones',
  'Manual count': 'Conteo manual',
  'Sessions since last submitted': 'Sesiones sin ceder',
  '+1': '+1',
  Reset: 'Reiniciar',
  // Achievement titles
  'First Steps': 'Primeros pasos',
  'On the Mat': 'En el tatami',
  'Mat Veteran': 'Veterano del tatami',
  'Ten Hours': 'Diez horas',
  Century: 'Centenario',
  'First Submission': 'Primera sumisión',
  'Tap Master': 'Maestro de sumisiones',
  'Defensive Wizard': 'Mago defensivo',
  'Week Warrior': 'Guerrero semanal',
  'Daily Devotee': 'Dedicación diaria',
  Focused: 'Enfocado',
  'Goal Slayer': 'Cazametas',
  'Belt Promoted': 'Ascenso de cinturón',
  // Achievement descriptions
  'Log your first training session.':
    'Registra tu primera sesión de entrenamiento.',
  'Log 10 training sessions.': 'Registra 10 sesiones de entrenamiento.',
  'Log 100 training sessions.': 'Registra 100 sesiones de entrenamiento.',
  'Train 10 hours total.': 'Entrena 10 horas en total.',
  'Train 100 hours total.': 'Entrena 100 horas en total.',
  'Submit your first training partner.':
    'Aplica tu primera sumisión en sparring.',
  'Get 50 submissions.': 'Consigue 50 sumisiones.',
  'Survive 7 sessions in a row without getting submitted.':
    'Aguanta 7 sesiones seguidas sin ceder.',
  'Reach a 4-week training streak.':
    'Alcanza una racha de 4 semanas de entrenamiento.',
  'Reach a 7-day training streak.':
    'Alcanza una racha de 7 días de entrenamiento.',
  'Hit 3 focus-technique goals at the same time.':
    'Cumple 3 metas de técnica de enfoque a la vez.',
  'Complete any focus-technique goal.':
    'Completa cualquier meta de técnica de enfoque.',
  'Earned a new belt or stripe in the last 7 days.':
    'Obtuviste un nuevo cinturón o grado en los últimos 7 días.',
  // Card labels
  Rank: 'Rango',
  Sparkline: 'Sparkline',
  'Mat time': 'Tiempo en tatami',
  // Auto-backup
  'Auto-backup': 'Copia automática',
  'Auto-backup is off — your data only lives in this browser.':
    'La copia automática está desactivada — tus datos solo viven en este navegador.',
  'Back up to a folder': 'Copia a una carpeta',
  'Back up to GitHub': 'Copia a GitHub',
  'Choose folder': 'Elegir carpeta',
  'Reconnect folder': 'Reconectar carpeta',
  'Disconnect folder': 'Desconectar carpeta',
  'Backup now': 'Hacer copia ahora',
  'Last backup': 'Última copia',
  Never: 'Nunca',
  'GitHub token': 'Token de GitHub',
  'Personal access token': 'Token de acceso personal',
  'Repository (owner/repo)': 'Repositorio (usuario/repo)',
  'Gist ID': 'ID del gist',
  'Test connection': 'Probar conexión',
  'Connected as': 'Conectado como',
  'Folder backup is only available in Chromium-based browsers.':
    'La copia a carpeta solo está disponible en navegadores basados en Chromium.',
  'Use a fine-grained token scoped to one repo. Revoke it if your device is lost.':
    'Usa un token de grano fino limitado a un repo. Revócalo si pierdes tu dispositivo.',
  'Auto-backup failed': 'Falló la copia automática',
  'Could not write backup to the chosen destination.':
    'No se pudo guardar la copia en el destino elegido.',
  'Connect GitHub': 'Conectar con GitHub',
  'Signed in as': 'Conectado como',
  'Sign out': 'Cerrar sesión',
  'Select a repository': 'Selecciona un repositorio',
  'Create new repository': 'Crear repositorio nuevo',
  'Repository name': 'Nombre del repositorio',
  'Private repository': 'Repositorio privado',
  Create: 'Crear',
  'Loading repositories…': 'Cargando repositorios…',
  'No repositories with write access.':
    'No hay repositorios con permiso de escritura.',
  'Backups to keep': 'Copias a conservar',
  'Older backups are deleted automatically.':
    'Las copias antiguas se eliminan automáticamente.',
  'GitHub login is not configured in this build.':
    'El inicio de sesión con GitHub no está configurado en esta versión.',
  'Enter this code at GitHub': 'Introduce este código en GitHub',
  'Open GitHub': 'Abrir GitHub',
  'Copy code': 'Copiar código',
  Copied: 'Copiado',
  'Waiting for authorization…': 'Esperando autorización…',
  'Authorization timed out. Try again.':
    'Se agotó el tiempo de autorización. Inténtalo de nuevo.',
  'Authorization was denied.': 'Se denegó la autorización.',
  // Setup restore prompt
  'Restore from backup': 'Restaurar desde una copia',
  'Set up backup': 'Configurar copia de seguridad',
  'Where should we keep your backups?': '¿Dónde guardamos tus copias?',
  'A folder on your device': 'Una carpeta en tu dispositivo',
  'A GitHub repo or gist': 'Un repo o gist de GitHub',
  'You can enable folder and GitHub backups together later in Settings.':
    'Luego puedes activar carpeta y GitHub juntos desde Ajustes.',
  'Omit for now': 'Omitir por ahora',
  'Skip — start fresh in this browser':
    'Omitir — empezar desde cero en este navegador',
  'No previous backup here — starting fresh.':
    'No hay copias previas aquí — empezando desde cero.',
  'Found a backup': 'Encontramos una copia',
  'Restore this backup': 'Restaurar esta copia',
  'Ignore — start fresh': 'Ignorar — empezar desde cero',
  'Choose a backup to restore': 'Elige una copia para restaurar',
  'Connected. Looking for backups…': 'Conectado. Buscando copias…',
  sessions: 'sesiones',
  techniques: 'técnicas',
  'How backups work': 'Cómo funcionan las copias',
  'Need help?': '¿Necesitas ayuda?',
  // Backup sync indicator
  'Backup failed': 'Copia fallida',
  'Your data is still safely stored in this browser.':
    'Tus datos siguen guardados de forma segura en este navegador.',
  'No network — backup will be retried next time you save a session with a connection.':
    'Sin conexión — se reintentará la copia la próxima vez que guardes una sesión con conexión.',
  'Existing backup found': 'Copia existente encontrada',
  'Restore backup': 'Restaurar copia',
  'Keep current data': 'Conservar datos actuales',
  'Backup up to date': 'Copia al día',
  'Backup out of date': 'Copia desactualizada',
  'No backup configured': 'Sin copia configurada',
  // Flows — kept in English per product requirement
  Flows: 'Flows',
  'Flow button icon': 'Flow button icon',
  FLOWS: 'FLOWS',
  'Open Flows': 'Open Flows',
  'Reset flow icon': 'Reset flow icon',
  'Strategic combination of techniques': 'Combinación estratégica de técnicas',
} satisfies Record<TranslationKey, string>

export const ES_CATEGORY_CONTENT: Record<
  number,
  { name: string; description: string }
> = {
  1: {
    name: 'Guardias',
    description: 'Posiciones sobre tu espalda controlando al oponente',
  },
  2: {
    name: 'Pase de Guardia',
    description: 'Técnicas para superar la guardia del oponente',
  },
  3: {
    name: 'Barridas',
    description: 'Reversiones desde posición inferior a superior',
  },
  4: {
    name: 'Sumisiones',
    description:
      'Técnicas de finalización: estrangulamientos y llaves articulares',
  },
  5: {
    name: 'Derribos y Proyecciones',
    description: 'Llevar la pelea al suelo',
  },
  6: {
    name: 'Escapes',
    description: 'Recuperarse de posiciones desfavorables',
  },
  7: { name: 'Posiciones', description: 'Posiciones de control dominante' },
}

export const ES_TECHNIQUE_CONTENT: Record<
  number,
  { name?: string; description: string; cues: string[] }
> = {
  // Guards (1xx)
  101: {
    name: 'Guardia Cerrada',
    description:
      'Guardia clásica con piernas bloqueadas detrás de la espalda del oponente, controlando la postura y creando ángulos de ataque.',
    cues: [
      'Rompe la postura antes de atacar',
      'Las caderas arriba crean espacio para sumisiones',
      'Usa ángulos diagonales para ataques de brazo',
      'Lucha por el control de muñeca constantemente',
    ],
  },
  102: {
    name: 'Media Guardia',
    description:
      'Una pierna atrapa una pierna del oponente, ofreciendo retención de guardia y oportunidades de barrida.',
    cues: [
      'El gancho bajo es clave — lucha por él cada vez',
      'Evita el cross-face a toda costa',
      'Ponte de lado, nunca plano sobre tu espalda',
      'Caderas hacia ellos para preparar la barrida con gancho',
    ],
  },
  103: {
    name: 'Guardia Mariposa',
    description:
      'Guardia sentada usando los ganchos (empeine) contra los muslos del oponente para desequilibrar y barrer.',
    cues: [
      'Mantente erguido — no te recuestes',
      'Ambos ganchos enganchan los muslos internos',
      'Desequilibra hacia el lado antes de levantar',
      'Gancho bajo o control de cabeza para el ángulo',
    ],
  },
  104: {
    name: 'Guardia Araña',
    description:
      'Agarrar las mangas del oponente mientras se usan los pies en los bíceps para controlar la distancia y atacar.',
    cues: [
      'Agarre completo de manga, pies en bíceps no en antebrazos',
      'Extiende completamente antes de tirar para romper postura',
      'Patea la cadera simultáneamente con el tirón',
      'Rota caderas para entradas a triángulo y omoplata',
    ],
  },
  105: {
    name: 'Guardia De La Riva',
    description:
      'Gancho en una pierna por fuera de la pierna del oponente con control de manga/tobillo.',
    cues: [
      'Gancho profundo alrededor del exterior de la pierna',
      'Controla manga y solapa lejana o tobillo cercano',
      'Mantén la distancia — no dejes que te aplasten',
      'Berimbolo o toma de espalda cuando avanzan',
    ],
  },
  106: {
    name: 'Guardia en X',
    description:
      'Ambos ganchos bajo los muslos del oponente en forma de X, creando desequilibrio extremo para barridas.',
    cues: [
      'Siéntate hacia ellos para entrar',
      'Ambos ganchos bajo los muslos — empuja en direcciones opuestas',
      'Extiende las piernas para destruir su base',
      'Empuja desde una pierna para establecer la dirección de la barrida',
    ],
  },
  107: {
    name: 'Guardia Lazo',
    description:
      'Envolver el brazo en un lazo con la pierna para inmovilizar el brazo y crear ángulos de ataque.',
    cues: [
      'Lazo sobre el codo para máximo control',
      'Empuja la cadera con el pie libre',
      'Fuerza problemas de postura para abrir ángulos de sumisión',
      'Transiciona a omoplata o triángulo cuando recuperan postura',
    ],
  },
  108: {
    name: 'Rubber Guard',
    description:
      'Posición de guardia alta con la pierna detrás del cuello, popularizada por Eddie Bravo.',
    cues: [
      'Requisito de flexibilidad — estira regularmente',
      'Bloquea la pierna detrás del cuello antes de agarrar la muñeca',
      'El mission control controla la postura completamente',
      'Avanza por el sistema: Nueva York, Jiu Claw, Omoplata',
    ],
  },
  109: {
    name: 'Single Leg X (SLX)',
    description:
      'Un gancho entre las piernas del oponente controlando una sola pierna para barridas y entradas a llave de pierna.',
    cues: [
      'Establece ashi garami — gancho exterior en cadera',
      'Bloquea la línea de rodilla, no solo el tobillo',
      'Estira la pierna atrapada para romper su base',
      'Heel hook exterior o barrida cuando cuadran',
    ],
  },
  110: {
    name: 'Worm Guard',
    description:
      'Variación de DLR usando la solapa enhebrada alrededor de la pierna para control extremo y barridas.',
    cues: [
      'Pasa la solapa bajo su rodilla y agárrala',
      'El escape de cadera crea la posición de control',
      'Usa la solapa como tercer agarre — mantenlo tenso',
      'Invierte y entra al berimbolo desde aquí',
    ],
  },
  111: {
    name: 'Guardia Z',
    description:
      'Una guardia media fuerte con escudo de rodilla para controlar la distancia y recuperar ataques.',
    cues: [
      'El escudo de rodilla apunta al pecho, no hacia abajo',
      'Encuadra en el hombro y el bícep',
      'Mantén las caderas anguladas de lado',
      'Gancho bajo cuando presionan',
    ],
  },
  112: {
    name: 'Guardia K',
    description:
      'Variación de guardia invertida para entrar a enredos de piernas y tomas de espalda.',
    cues: [
      'Controla la pierna cercana antes de invertir',
      'Esconde tus caderas bajo su base',
      'Aprieta las rodillas para atrapar la línea de pierna',
      'Transiciona rápidamente al enredo de piernas',
    ],
  },
  113: {
    name: 'Guardia De La Riva Inversa',
    description:
      'Posición de guardia donde la pierna interior se engancha alrededor de la pierna delantera del oponente desde adentro, creando un ángulo que dificulta la presión frontal. Muy habitual en no-gi. Los destinos principales son las tomas de espalda, los calf kicks y las entradas a single-leg X.',
    cues: [
      'Engancha tu pierna interior alrededor de su pierna delantera desde abajo — a diferencia de la DLR, este gancho va por dentro, no por fuera',
      'El pie de apoyo debe estar en su cadera o muslo para mantener la distancia mientras el gancho interior controla su pierna',
      'Toma de espalda "Kiss of the Dragon": inviértete bajo el oponente, usa el gancho para rotar y subir a su espalda',
      'Cuando presionen hacia adelante, bombea el gancho y extiende para entrar a single-leg X o a un enredo directo de piernas',
    ],
  },
  114: {
    name: 'Guardia 50/50',
    description:
      'Enredo de piernas neutro en el que ambos practicantes se espejean mutuamente, creando igualdad ofensiva y defensiva. Es principalmente una plataforma para llaves de pierna; ambos pueden atacar al mismo tiempo con ankle locks, heel hooks y toe holds.',
    cues: [
      'Cubre la rodilla del oponente con tu mano superior y esconde tu propio talón detrás de su muslo — exponer el talón es la forma más rápida de perder',
      'Mantente en ángulo en lugar de alinearte directamente; la alineación frontal permite que espejeen tu intento de llave de pierna simultáneamente',
      'El ankle lock y el heel hook interior son las finalizaciones de mayor porcentaje; establece una conexión de cadera apretada antes de ir por el talón',
      'Para barrer: rota tu rodilla exterior hacia el suelo para doblar su rodilla delantera, luego desengánchate y establece posición superior',
    ],
  },
  115: {
    name: 'Media Guardia Profunda',
    description:
      'Extensión de la media guardia en la que el practicante de abajo se mete completamente bajo el centro de gravedad del oponente, con la cabeza cerca de su rodilla, un brazo envolviendo una pierna y las caderas pegadas. Los ataques principales son la barrida del mesero, la barrida Homer Simpson y la toma de espalda.',
    cues: [
      'Entra jalando la cadera profundamente bajo la base del oponente; tu cara debe estar cerca de su rodilla, no de su cadera',
      'Mantén ambos brazos adentro: uno envuelve la pierna, el otro controla su rodilla o tobillo lejano; esto impide el cross-face y la kimura',
      'Barrida del mesero: ensarta tu pierna exterior bajo su pierna cercana, elévala y barre hacia tu cabeza',
      'Cuando apoyen para frenar la barrida, usa ese apoyo como punto de pivote para rotar hacia su espalda',
    ],
  },
  // Guard Passing (2xx)
  201: {
    name: 'Pase Toreando',
    description:
      'Usar agarres en las rodillas/tobillos para mover las piernas a un lado y pasar lateralmente.',
    cues: [
      'Controla el pantalón en la rodilla, no en el tobillo',
      'Rodea — no intentes atravesar',
      'Redirige las piernas decisivamente hacia un lado',
      'Aplana y consolida antes de establecer el control lateral',
    ],
  },
  202: {
    name: 'Pase Doble por Debajo',
    description:
      'Meter ambos brazos bajo las piernas para apilar y pasar la guardia.',
    cues: [
      'Agarra el pantalón en las caderas no en los tobillos',
      'Pasa por debajo y apila las caderas al pecho',
      'Avanza y camina hacia el lado',
      'Cabeza al exterior para evitar el triángulo',
    ],
  },
  203: {
    name: 'Pase Por Encima-Por Debajo',
    description:
      'Un brazo sobre una pierna y el otro bajo la otra, un potente pase de presión.',
    cues: [
      'Presión fuerte en el lado de la pierna sobre',
      'Empuja hacia adelante con tu peso corporal',
      'Aplana sus caderas antes de moverse al lado',
      'Presión de hombro en el muslo interno',
    ],
  },
  204: {
    name: 'Leg Drag',
    description:
      'Arrastrar una pierna a través del cuerpo manteniendo contacto de cadera para crear un ángulo de pase.',
    cues: [
      'Tira una pierna a través de la línea del cuerpo',
      'Mantén contacto cadera a cadera durante todo el movimiento',
      'Despeja la segunda pierna antes de establecer posición',
      'Pasa por encima para completar el pase',
    ],
  },
  205: {
    name: 'Pase de Rodilla',
    description:
      'Conducir la rodilla a través de la guardia mientras se controla la cadera.',
    cues: [
      'La rodilla corta diagonalmente sobre su muslo',
      'Presión de cadera en su cadera al cortar',
      'Cross-face inmediatamente para evitar el escape',
      'Mantente pesado — no dejes que creen espacio',
    ],
  },
  206: {
    name: 'Smash Pass',
    description:
      'Apilar las piernas del oponente mientras se avanza para aplanar y pasar.',
    cues: [
      'Apila las piernas hacia su pecho',
      'Aprieta las rodillas para controlar ambas piernas',
      'Empuja hacia adelante con tu cuerpo',
      'Camina hacia el control lateral una vez aplano',
    ],
  },
  207: {
    name: 'Pase Toreador',
    description:
      'Agarrar ambos tobillos/rodillas y redirigir las piernas hacia cualquier lado.',
    cues: [
      'Agarra en las rodillas no en los tobillos',
      'Mueve las piernas decisivamente hacia un lado',
      'Pasa sobre las piernas y fija',
      'Muévete rápido — este es un pase de velocidad',
    ],
  },
  208: {
    name: 'HQ / Headquarters',
    description:
      'Posición de pase neutral dentro de la guardia, para controlar y preparar llaves de pierna o pases.',
    cues: [
      'Mantén la posición interna a toda costa',
      'Cuña la rodilla para controlar su cadera',
      'Heel hook interior o tobillo recto desde aquí',
      'Transiciona a llave de pierna o pase según su respuesta',
    ],
  },
  209: {
    name: 'Pase Candado',
    description:
      'Estilo de pase pecho a cadera usando un candado corporal ajustado para aplanar y despejar las piernas.',
    cues: [
      'Entrelaza las manos en la línea de la espalda baja',
      'Cabeza bien bajo su mentón',
      'Empuja presión de pecho mientras rodeas',
      'Despeja la línea de rodilla antes de establecer posición',
    ],
  },
  210: {
    name: 'Pase de Paso Largo',
    description:
      'Movimiento de pase dinámico que da un paso largo alrededor de la guardia para exponer el control lateral.',
    cues: [
      'Controla las caderas antes de dar el paso',
      'El paso largo aterriza detrás de su cadera',
      'Baja el hombro para fijar las piernas',
      'Cambia la base para bloquear la inversión',
    ],
  },
  // Sweeps (3xx)
  301: {
    name: 'Barrida de Cadera',
    description:
      'Apoyarse en la mano y golpear la cadera hacia adelante desde guardia cerrada para tomar la posición superior.',
    cues: [
      'Rompe la postura primero — jálalo hacia adelante',
      'Apoya una mano, golpea las caderas explosivamente hacia arriba',
      'Comprométete totalmente — la duda mata la barrida',
      'Continúa con kimura si se apoyan',
    ],
  },
  302: {
    name: 'Barrida de Tijera',
    description:
      'Usar un movimiento de tijera con las piernas desde guardia cerrada para tumbar al oponente.',
    cues: [
      'Debes romper la postura antes de abrir la guardia',
      'El agarre collar-manga controla ambos lados',
      'Tijera las piernas simultáneamente con el tirón',
      'Empuja la rodilla de abajo en su cadera al barrer',
    ],
  },
  303: {
    name: 'Barrida de Péndulo',
    description:
      'Desde guardia cerrada, enganchar una pierna y barrer con un movimiento de péndulo.',
    cues: [
      'Engancha su pierna cercana con tu pierna cercana',
      'El balanceo de péndulo genera el impulso',
      'Tira de su brazo cruzado sobre tu pecho',
      'Gira hacia arriba cuando caen',
    ],
  },
  304: {
    name: 'Barrida de Mariposa',
    description:
      'Usar los ganchos de mariposa para desequilibrar al oponente y barrerlo hacia el lado.',
    cues: [
      'El gancho bajo crea el ángulo para la barrida',
      'Eleva con el gancho mientras caes de lado',
      'Desequilíbralos hacia el lado del gancho bajo',
      'Rueda suavemente — no uses fuerza',
    ],
  },
  305: {
    name: 'Barrida de Guardia en X',
    description:
      'Barrer desde guardia X extendiendo las piernas para volcar al oponente hacia adelante o atrás.',
    cues: [
      'Extiende ambas piernas al unísono para romper la base',
      'Desequilíbralos hacia tu dirección de barrida primero',
      'Siéntate para seguirlos hacia arriba',
      'Agarra el tobillo lejano para controlar mientras caen',
    ],
  },
  306: {
    name: 'Berimbolo',
    description:
      'Una inversión giratoria desde De La Riva para tomar la espalda o ganar posición dominante.',
    cues: [
      'Invierte bajo su centro de gravedad',
      'Empuja las caderas hacia su espalda',
      'Agarra el tobillo lejano para controlar la rotación',
      'Termina en toma de espalda o posición de arrastre de pierna',
    ],
  },
  307: {
    name: 'Barrida De La Riva',
    description:
      'Varias barridas desde la guardia De La Riva atacando la pierna cercana o lejana.',
    cues: [
      'Desequilíbralos hacia el lado del gancho DLR',
      'Patea hacia su cabeza para iniciar',
      'Rota sobre su pierna atrapada',
      'Controla el tobillo mientras subes',
    ],
  },
  308: {
    name: 'Barrida Trípode',
    description:
      'Usar el pie en la cadera y el pie en el bícep para barrer al oponente.',
    cues: [
      'Pie en cadera, pie en bícep simultáneamente',
      'Tira de la manga para romper su base',
      'Extiende las caderas mientras tiras de la pierna hacia ti',
      'Sube a la posición superior rápidamente',
    ],
  },
  309: {
    name: 'Barrida del Leñador',
    description:
      'Barrida desde guardia sentada elevando una pierna y cortando la pierna de apoyo.',
    cues: [
      'Controla mangas o muñecas primero',
      'Levanta una pierna con tu gancho',
      'Corta el tobillo de apoyo lejano con el pie opuesto',
      'Siéntate inmediatamente para terminar arriba',
    ],
  },
  310: {
    name: 'Barrida del Globo',
    description:
      'Barrida flotante desde guardia abierta que eleva al oponente por encima antes de la transición superior.',
    cues: [
      'Los agarres deben conectar a mangas/solapa',
      'Lleva las rodillas al pecho luego extiende',
      'Guíalos sobre tu línea de hombro',
      'Síguelos y sube antes del intercambio',
    ],
  },
  311: {
    name: 'Barrida Old School (Gordo)',
    description:
      'Barrida fundamental desde la media guardia inferior usando un underhook y un agarre en el tobillo lejano del oponente para voltearlo. Popularizada por Roberto "Gordo" Correa, suele ser la primera barrida de media guardia que se enseña.',
    cues: [
      'Asegura un underhook profundo en el brazo cercano del oponente, luego mete la cabeza bajo su torso',
      'Alcanza por debajo de su pierna libre y agarra los dedos del pie (no el tobillo) para máxima palanca',
      'Suelta el underhook, refuerza el agarre con ambas manos y luego empuja las caderas hacia adentro y levanta',
      'Si apoyan la pierna libre para estabilizarse, transiciona a tomar la espalda en lugar de completar la barrida',
    ],
  },
  312: {
    name: 'Barrida con Kimura',
    description:
      'Barrida desde guardia cerrada usando el agarre kimura (figura 4 en la muñeca) para desequilibrar y voltear al oponente. Si la barrida se bloquea, el mismo agarre pasa directamente a la sumisión kimura o abre el triángulo.',
    cues: [
      'Rompe la postura del oponente, aísla una muñeca y establece el agarre de doble llave (kimura)',
      'Jala el brazo cruzando tu línea central; cuando apoyen la mano para evitar la sumisión, usa ese apoyo para elevar y barrer',
      'Si la barrida falla, rueda hacia tu lado y termina la kimura desde abajo',
      'La barrida fallida también abre el triángulo y la guillotina desde guardia — mantente activo en el agarre',
    ],
  },
  313: {
    name: 'Barrida John Wayne',
    description:
      'Barrida de media guardia usando la rodilla libre como palanca contra el tobillo lejano del oponente para tumbarlo de lado. Debe su nombre al movimiento rodante y casual que produce.',
    cues: [
      'Desde media guardia con underhook, abre la guardia y apoya el pie superior mientras tu pierna inferior controla justo sobre su tobillo',
      'Balancea tu rodilla libre (superior) hacia arriba y hacia afuera en arco como un limpiaparabrisas, llevándola a través de la línea del tobillo',
      'Combina la palanca de rodilla con un puente-empuje desde el pie de apoyo para generar rotación',
      'Sigue la barrida para terminar directamente en control lateral o media guardia superior',
    ],
  },
  // Submissions (4xx)
  401: {
    name: 'Armbar',
    description:
      'Hiperextender la articulación del codo controlando el brazo a través del cuerpo — se aplica desde muchas posiciones.',
    cues: [
      'Rompe la postura antes de ir por el armbar',
      'El brazo debe cruzar la línea central de tu cuerpo',
      'Aprieta las rodillas, empuja las caderas hacia arriba',
      'Pulgar apuntando arriba significa que el codo apunta abajo — ajusta',
    ],
  },
  402: {
    name: 'Triángulo',
    description:
      'Bloquear la cabeza y el brazo con las piernas en figura 4 para cortar el flujo sanguíneo al cerebro.',
    cues: [
      'Cabeza y un brazo dentro del triángulo',
      'Tira de la cabeza hacia abajo para completar el bloqueo',
      'Angula hacia el lado del brazo atrapado',
      'Empuja el brazo cruzando su línea central para ajustar',
    ],
  },
  403: {
    name: 'Kimura',
    description:
      'Un agarre en figura 4 en la muñeca rotando la articulación del hombro — se aplica desde muchas posiciones.',
    cues: [
      'Agarre en figura 4 bajo la muñeca, no sobre ella',
      'Rota el hombro externamente y hacia arriba',
      'Usa el peso del cuerpo no solo la fuerza del brazo',
      'Fija el codo en tu cadera para aprovechar',
    ],
  },
  404: {
    name: 'Omoplata',
    description:
      'Llave de hombro usando las piernas para controlar el brazo y rotar el hombro.',
    cues: [
      'Mueve la pierna sobre el hombro — no solo el brazo',
      'Siéntate inmediatamente para evitar que rueden',
      'Perpendicular a su cuerpo para máxima presión',
      'Usa las caderas no solo las piernas para aplicar la llave',
    ],
  },
  405: {
    name: 'Estrangulamiento Trasero',
    description:
      'Estrangulamiento de sangre desde la espalda — brazo bajo el mentón, brazo detrás de la cabeza.',
    cues: [
      'Brazo bajo el mentón, NO sobre el mentón',
      'Segundo brazo detrás de la cabeza, no del cuello',
      'Aprieta bícep y hombro juntos',
      'Tira del codo hacia ti mientras aprietas',
    ],
  },
  406: {
    name: 'Guillotina',
    description:
      'Brazo alrededor del cuello cortando el flujo sanguíneo, aplicado de pie o desde guardia.',
    cues: [
      'Entra completamente bajo el cuello, no encima',
      'Guillotina de codo alto para la variación con brazo dentro',
      'Tira del brazo cruzando tu cuerpo mientras aprietas',
      'Encógete y cierra la guardia para guillotina de guardia',
    ],
  },
  407: {
    name: 'Heel Hook Externo',
    description:
      'Rotar el talón hacia afuera para atacar las estructuras laterales de la rodilla.',
    cues: [
      'Establece primero la posición de heel hook exterior',
      'Sujeta el talón, rota hacia tu pecho',
      'Controla la línea de rodilla en todo momento',
      'Pequeña rotación — el daño es rápido',
    ],
  },
  408: {
    name: 'Heel Hook Interno',
    description:
      'Rotar el talón hacia adentro para atacar las estructuras mediales de la rodilla — extremadamente peligroso.',
    cues: [
      'Protege primero tu propia alineación de rodilla',
      'Figura 4 a nivel de la espinilla',
      'Rota el talón hacia tu centro',
      'Toca inmediatamente — el daño es silencioso y rápido',
    ],
  },
  409: {
    name: 'Llave de Tobillo',
    description:
      'Aplicar presión contra el tendón de Aquiles para atacar el tobillo.',
    cues: [
      'Agarre en figura 4 — parte ósea del antebrazo en el Aquiles',
      'Aprieta los codos y cae hacia atrás',
      'Controla la línea de rodilla con tus piernas',
      'Extiende las caderas no solo los brazos para aplicar presión',
    ],
  },
  410: {
    name: 'Palanca de Rodilla',
    description:
      'Hiperextender la articulación de la rodilla, similar a un armbar pero en la pierna.',
    cues: [
      'Controla la pierna contra tu pecho',
      'Cadera a la fosa poplítea (detrás de la rodilla)',
      'Extiende las caderas para crear la presión de barra',
      'Estira la pierna completamente contra tu cuerpo',
    ],
  },
  411: {
    name: 'Darce',
    description:
      'Estrangulamiento con brazo dentro usando una figura 4 a través del cuello, aplicado desde tortuga o guardia.',
    cues: [
      'Pasa el brazo a través de la cabeza y el brazo simultáneamente',
      'Asegura el agarre de figura 4 en tu propio bícep',
      'Aprieta y empújalos hacia adelante',
      'Termina encima o usa el peso del cuerpo desde atrás',
    ],
  },
  412: {
    name: 'Anaconda',
    description:
      'Similar al Darce pero con diferente posición de brazo, a menudo desde el headlock frontal.',
    cues: [
      'Pasa el brazo bajo la cabeza y a través del brazo',
      'Empuja el hombro hacia el cuello',
      'Rueda hacia el lado del brazo atrapado para terminar',
      'Aprieta mientras empujas tu peso corporal hacia adentro',
    ],
  },
  413: {
    name: 'Arco y Flecha',
    description:
      'Potente estrangulamiento de solapa desde la espalda usando el agarre del cinturón/pantalón para palanca.',
    cues: [
      'Agarre profundo de solapa en el lado del estrangulamiento',
      'Agarre de pantalón o cinturón en la pierna del lado opuesto',
      'Extiende tu cuerpo para crear el arco',
      'Tira de la solapa hacia ti, empuja la pierna hacia afuera',
    ],
  },
  414: {
    name: 'Estrangulamiento de Cruz',
    description:
      'Doble agarre de solapa desde montura o guardia cruzando para estrangular.',
    cues: [
      'Ambos agarres cruzan la línea central de su solapa',
      'Rota las muñecas hacia adentro al aplicar presión',
      'Empuja los codos hacia el suelo',
      'Mantén postura en montura antes de aplicar',
    ],
  },
  415: {
    name: 'Ezekiel',
    description:
      'Estrangulamiento de agarre de manga desde la montura, incluso puede aplicarse dentro de la guardia del oponente.',
    cues: [
      'La manga va contra el cuello primero',
      'La palma empuja a través de la garganta',
      'Aprieta y rota el estrangulamiento',
      'Funciona incluso desde dentro de su guardia — inesperado',
    ],
  },
  416: {
    name: 'Americana',
    description:
      'Llave de hombro en figura 4 doblando la muñeca hacia arriba — aplicada desde montura o control lateral.',
    cues: [
      'Fija la muñeca al suelo primero',
      'El agarre de figura 4 asegura el brazo',
      'Empuja el codo hacia su cadera en pequeños círculos',
      'Mantén la muñeca siempre más baja que el codo',
    ],
  },
  417: {
    name: 'Triángulo de Brazo',
    description:
      'Estrangulamiento de sangre cabeza y brazo terminado desde montura o control lateral con presión de hombro.',
    cues: [
      'Atrapa su brazo cruzando el cuello primero',
      'Cabeza baja en el mismo lado que el brazo atrapado',
      'Camina hacia el lado mientras aprietas el hombro',
      'Termina con caída de pecho y presión',
    ],
  },
  418: {
    name: 'Estrangulamiento Norte-Sur',
    description:
      'Estrangulamiento desde norte-sur usando presión de hombro y dorsal alrededor del cuello.',
    cues: [
      'El brazo se envuelve profundamente alrededor de la línea del cuello',
      'Presión de hombro hacia abajo, no tirando hacia arriba',
      'Aleja las caderas para ajustar',
      'Esconde el codo y mantén el pecho pesado',
    ],
  },
  419: {
    name: 'Armbar Inverso',
    description:
      'Variante del armbar con la palma hacia arriba, aplicada desde guardia cerrada o mariposa, que hiperextiende el codo en dirección contraria al armbar estándar. Si falla, fluye de forma natural de vuelta al armbar regular.',
    cues: [
      'Desde guardia cerrada, aísla un brazo y desplaza tu peso en la dirección del ataque para cargar presión sobre su codo',
      'Mantén su palma hacia arriba (supinada); tu pierna presiona sobre su antebrazo para aplicar la palanca',
      'Jala su muñeca hacia tu hombro y empuja tu espinilla hacia abajo para la finalización',
      'Si apilan o recuperan postura, transiciona de inmediato al armbar estándar pasando la pierna sobre la cabeza',
    ],
  },
  420: {
    name: 'Toe Hold',
    description:
      'Llave de pierna que ataca el tobillo y el pie con un agarre en figura 4 al estilo kimura sobre el pie, girándolo hacia adentro para desgarrar los ligamentos del tobillo. Se aplica con más frecuencia desde ashi garami, 50/50 o enredos de media guardia.',
    cues: [
      'Atrapa la pierna para impedir el escape; agarra la parte superior del pie (meñique de la mano alineado con el meñique del pie) y pasa el otro brazo bajo su espinilla para bloquearlo en tu propia muñeca',
      'Mantén el pie pegado a tu pecho — cualquier espacio les permite zafarse',
      'Rota todo tu cuerpo para girar el pie hacia adentro (hacia su cadera opuesta) en lugar de usar solo la fuerza de los brazos',
      'Controla la línea de rodilla antes de aplicar presión; una rodilla sin controlar les permitirá rodar y escapar',
    ],
  },
  421: {
    name: 'Calf Slicer',
    description:
      'Llave de compresión que cuña la espinilla detrás de la rodilla del oponente y dobla la pierna, aplastando el músculo de la pantorrilla contra el hueso de la espinilla. Los setups más comunes son desde posición tortuga, media guardia profunda y guardia X.',
    cues: [
      'Cuña tu espinilla detrás de la articulación de la rodilla del oponente como fulcro; cuanto más profunda la espinilla, más eficiente la presión',
      'Asegura una figura 4 con tus piernas y controla su empeine o tobillo con ambas manos',
      'Gira la hoja de la espinilla hacia su pantorrilla (como dorsiflexionando el tobillo) mientras jalas su tobillo hacia ti',
      'La presión se desarrolla rápido — termina antes de que rueden; usa un agarre de cinturón o gancho si está disponible para bloquear el rodado',
    ],
  },
  422: {
    name: 'Triángulo desde Montada',
    description:
      'Estrangulamiento de sangre aplicado desde la montada superior pasando una pierna sobre el cuello y bloqueando una figura 4 con la otra pierna, similar al triángulo de guardia cerrada pero con la ventaja de peso de estar encima.',
    cues: [
      'Desde montada alta, sube las rodillas pasando los codos del oponente para que sus brazos queden sobre el plano del codo',
      'Aísla un brazo controlando la muñeca; pasa la pierna exterior sobre el cuello para comenzar el bloqueo del triángulo',
      'Bloquea la figura 4 (espinilla detrás de la rodilla) y ajusta el ángulo usando la presión de cadera en lugar de invertirte',
      'Aprieta las rodillas juntas y empuja el brazo atrapado cruzando la línea central para ajustar el estrangulamiento',
    ],
  },
  // Takedowns & Throws (5xx)
  501: {
    name: 'Doble Pierna',
    description:
      'Dispararse en ambas piernas y empujar para levantar/virar al oponente al suelo.',
    cues: [
      'Cambio de nivel — bájate antes del disparo',
      'El paso de penetración entra dentro de sus caderas',
      'Cabeza hacia afuera — nunca hacia adentro',
      'Empuja hacia adelante y arriba, luego vira o levanta',
    ],
  },
  502: {
    name: 'Pierna Simple',
    description:
      'Controlar una pierna y usar viradas o elevaciones para derrumbar al oponente.',
    cues: [
      'Asegura la pierna en el muslo no en el tobillo',
      'Empuja a través de su centro de gravedad',
      'Corre el tubo o vira el tobillo para terminar',
      'Mantén la cabeza arriba y hacia afuera',
    ],
  },
  503: {
    name: 'Proyección de Cadera (O-goshi)',
    description:
      'Cargar al oponente en la cadera y rotar para tirarlo al suelo.',
    cues: [
      'Rompe su equilibrio hacia adelante primero',
      'Carga la cadera directamente bajo su centro',
      'Gira — las caderas miran en la misma dirección que las suyas',
      'Rota y tira sobre tu cadera suavemente',
    ],
  },
  504: {
    name: 'Seoi Nage',
    description: 'Tirar del oponente sobre el hombro para una gran proyección.',
    cues: [
      'Jálalo mientras rotas por debajo',
      'Empuja el hombro bajo su axila',
      'Carga su peso sobre tu espalda',
      'Rota completamente y jálalos sobre',
    ],
  },
  505: {
    name: 'Uchi Mata',
    description:
      'Barrer el interior de la pierna del oponente mientras se rompe su equilibrio.',
    cues: [
      'Rompe el equilibrio hacia su esquina delantera',
      'Barre el muslo interior — no el pie',
      'Rota sobre la proyección completamente',
      'Empújalos sobre tu pierna de barrida',
    ],
  },
  506: {
    name: 'Osoto Gari',
    description:
      'Segar la pierna del oponente desde afuera mientras se lo empuja hacia atrás.',
    cues: [
      'Rompe el equilibrio hacia su esquina trasera',
      'Da un paso profundo junto a su pierna',
      'Siega la pierna mientras empujas cabeza y hombro',
      'Comprométete totalmente — no dudes',
    ],
  },
  507: {
    name: 'Recogida de Tobillo',
    description:
      'Agarrar el tobillo mientras se empuja la cabeza para virar al oponente.',
    cues: [
      'Empuja su cabeza hacia abajo mientras da un paso',
      'Agarra el tobillo del mismo lado',
      'Empuja hacia adelante mientras levantas el tobillo',
      'Sigue hacia la posición superior rápidamente',
    ],
  },
  508: {
    name: 'Proyección del Bombero',
    description:
      'Cargar al oponente por la espalda agarrando el brazo y el tobillo.',
    cues: [
      'Controla un brazo y el tobillo opuesto',
      'Pasa por debajo y carga sobre los hombros',
      'Empuja el hombro hacia su axila',
      'Ruédalos sobre tu espalda para terminar',
    ],
  },
  509: {
    name: 'Barredura de Pie (De Ashi Barai)',
    description:
      'Barrida basada en el timing que remueve un pie en paso para derribar limpiamente al oponente.',
    cues: [
      'Ataca cuando su peso se desplace',
      'Usa el tirón de manga/solapa para desequilibrar',
      'Barre bajo en la línea del tobillo',
      'La dirección de la barrida sigue su paso',
    ],
  },
  510: {
    name: 'Clinch de Cabeza Frontal',
    description:
      'Tirar de la cabeza y postura del oponente hacia abajo para asegurar control de headlock frontal y ataques.',
    cues: [
      'Tira con los codos, no con las muñecas',
      'Da un paso atrás mientras tiras hacia abajo',
      'Circula inmediatamente para crear ángulo',
      'Asegura el agarre de mentón y control de codo',
    ],
  },
  511: {
    name: 'Snap Down a Toma de Espalda',
    description:
      'Un snap down que, en lugar de terminar en headlock frontal, usa el impulso del oponente para girar directamente detrás de él y asegurar el control de espalda. Se distingue del Snap Down a Headlock Frontal por circular detrás de la cadera en lugar de asegurar una posición frontal.',
    cues: [
      'Desde un collar-tie, ejecuta un snap down brusco hacia abajo para romper la postura y llevar la cabeza bajo tus caderas',
      'Mientras avanzan o se recuperan, suelta la cabeza y da un paso lateral detrás de su cadera en lugar de bajar en posición frontal',
      'Envuelve el torso con el agarre de cinturón de seguridad (un brazo por encima, uno por debajo) antes de que puedan incorporarse',
      'Completa la toma de espalda insertando ambos ganchos para el control de espalda',
    ],
  },
  512: {
    name: 'Arm Drag a Toma de Espalda',
    description:
      'Entrada a derribo que usa un arm drag con dos manos (agarre de muñeca y trícep) para redirigir el brazo del oponente cruzando el cuerpo y dar un paso detrás de él hacia el control de espalda. Muy adaptable desde de pie, sentado y guardia mariposa.',
    cues: [
      'Agarra la muñeca del mismo lado del oponente con el pulgar hacia abajo; simultáneamente alcanza profundo hacia su trícep con la otra mano',
      'Jala el brazo con fuerza cruzando tu línea central mientras das un paso con el pie del mismo lado lateralmente detrás de su cadera — mantén la cabeza pegada a su pecho',
      'Envuelve tu brazo exterior alrededor de su cintura y bloquea la mano en su cadera lejana; esto bloquea su rotación',
      'Completa la toma de espalda llevándolos al tatami con un derribo de espalda o barrida de pie, luego inserta los ganchos',
    ],
  },
  // Escapes (6xx)
  601: {
    name: 'Puente y Volteo (Upa)',
    description:
      'Puente explosivo desde la montura para voltear al oponente, recuperar guardia o tomar posición superior.',
    cues: [
      'Atrapa un brazo Y una pierna en el mismo lado',
      'Puente explosivo — piensa hacia arriba, no arqueado',
      'Rueda sobre el hombro atrapado',
      'Usa los pies para empujar el suelo y dar potencia',
    ],
  },
  602: {
    name: 'Escape de Gamba',
    description:
      'Crear espacio haciendo la gamba con las caderas y recuperar la guardia desde abajo.',
    cues: [
      'Crea un marco en la cadera antes de hacer la gamba',
      'Haz la gamba de caderas hacia afuera — crea espacio para la rodilla',
      'Empuja la rodilla hacia adentro para recuperar guardia',
      'Mantente de lado — nunca plano sobre tu espalda',
    ],
  },
  603: {
    name: 'Escape del Control Lateral',
    description:
      'Usar el movimiento de gamba para recuperar la guardia desde el control lateral.',
    cues: [
      'Marco en cadera y cuello simultáneamente',
      'Puente para crear espacio para hacer la gamba',
      'Haz la gamba de caderas hacia afuera y recupera la rodilla de guardia',
      'Mantente de lado durante todo el movimiento — nunca plano',
    ],
  },
  604: {
    name: 'Escape de Espalda',
    description:
      'Proteger el cuello, trabajar para quitar el cinturón de seguridad, y recuperar guardia desde el control de espalda.',
    cues: [
      'Prioridad uno: protege tu cuello del estrangulamiento',
      'Quita el cinturón de seguridad — lucha primero por el brazo superior',
      'Rota hacia ellos en el mismo lado que sus ganchos',
      'Rueda hacia la guardia mientras creas el ángulo',
    ],
  },
  605: {
    name: 'Defensa de Guillotina',
    description:
      'Recuperar la postura, girar hacia el estrangulamiento y encontrar el cuello para escapar.',
    cues: [
      'Recupera la postura inmediatamente — no metas el mentón',
      'Gírate hacia el brazo que te está estrangulando',
      'Apila y avanza hacia adelante para quitar la presión',
      'Encuentra su cuello para controlarlo mientras escapas',
    ],
  },
  606: {
    name: 'Defensa de Triángulo',
    description:
      'Apilar, recuperar postura y usar rupturas de agarre para escapar del triángulo.',
    cues: [
      'Apila sus caderas inmediatamente — quita el peso de encima',
      'Recupera postura — mentón arriba, espalda recta',
      'Rompe su agarre en tu cabeza o muñeca',
      'Pasa sobre su pierna para escapar del triángulo',
    ],
  },
  607: {
    name: 'Escape de Rodilla en Abdomen',
    description:
      'Secuencia de escape para remover la presión de rodilla y recuperar guardia o media guardia.',
    cues: [
      'Marco en su rodilla y cadera',
      'Puente luego gamba bajo presión',
      'Atrapa su pierna que da el paso para media guardia',
      'No empujes con los brazos rectos',
    ],
  },
  608: {
    name: 'Escape del Armbar',
    description:
      'Familia de escapes del armbar, siendo la defensa de pila la opción principal para principiantes. Postura, rotación del pulgar y apilamiento del peso corporal combinados alivian la presión en el codo y extraen el brazo.',
    cues: [
      'En el instante en que el armbar se asegura, agarra tu propio antebrazo para crear una conexión de dos brazos y ganar tiempo',
      'Apóyate en los dedos de los pies y apila el pecho hacia abajo sobre el oponente, levantando sus caderas para eliminar el fulcro',
      'Rota el pulgar hacia arriba (supina) mientras jalas el codo sobre sus piernas — esto cambia el ángulo y libera el codo',
      'Abre las piernas en base amplia para evitar que cierren sobre el brazo',
    ],
  },
  609: {
    name: 'Escape del Triángulo',
    description:
      'Escape basado en la postura de un triángulo aplicado desde la guardia. Apila, recupera postura y rompe el agarre antes de que el flujo sanguíneo se corte — el tiempo es el factor crítico.',
    cues: [
      'Mete el codo del brazo atrapado hacia tu línea central inmediatamente para ralentizar el estrangulamiento',
      'Recupera postura con fuerza y apila las caderas hacia la cabeza del oponente, cargando tu peso corporal para reducir su palanca',
      'Camina los pies hacia ellos, endereza la espalda y rompe el bloqueo empujando su rodilla con la mano libre',
      'Una vez roto el bloqueo, pasa la guardia o asegura una posición defensiva antes de que se restablezcan',
    ],
  },
  610: {
    name: 'Escape del Triángulo Montado',
    description:
      'Escape de último recurso del triángulo montado — una de las posiciones más difíciles de escapar. Requiere levantar las caderas explosivamente y rotar para crear separación antes de que se corte el flujo sanguíneo.',
    cues: [
      'Apoya el brazo libre bajo su axila (no cruzando el cuerpo) para evitar que bloqueen el brazo en el triángulo',
      'Entrelaza las manos y extiende los brazos hacia su cadera lejana para crear aunque sea mínima separación',
      'Puente explosivo de caderas hacia su zona lumbar mientras aún ajustan el bloqueo',
      'Pasa por encima de su cuerpo para rotar — incluso aterrizar en control lateral inferior es una victoria frente a ser estrangulado',
    ],
  },
  611: {
    name: 'Escape de Guillotina desde Caída de Guardia',
    description:
      'Defensa contra una guillotina atrapada durante la fase de caída de guardia o en transiciones de derribo — distinta de la defensa de guillotina desde posiciones superiores/de lucha. El atacante tiene agarre de cabeza y brazo mientras vas al suelo.',
    cues: [
      'En el momento en que la guillotina se asegura, mete el mentón con fuerza hacia el hombro del brazo atrapado para proteger la tráquea',
      'Apoya ambas manos en sus caderas y recupera postura — nunca bajes más la cabeza, eso aprieta el estrangulamiento',
      'Camina los pies alrededor hacia el mismo lado del brazo atrapado (el lado con brazo adentro) para aliviar la presión',
      'Una vez roto el ángulo, pasa el brazo exterior sobre su hombro y jala hacia abajo para romper el agarre',
    ],
  },
  612: {
    name: 'Rollo de Granby',
    description:
      'Escape de inversión desde posición tortuga: rodar sobre un hombro (sin exponer el cuello) para recuperar la guardia o llegar a un scramble neutro.',
    cues: [
      'Mete el hombro de rodada hacia abajo; nunca expongas la nuca — la cabeza permanece abajo',
      'Mantén los dedos del pie delantero en el suelo durante todo el movimiento para rodar en línea recta y controlada',
      'Impulsa caderas y piernas hacia arriba y en arco; deben caer hacia el oponente para crear marcos de guardia inmediatos',
      'En el momento en que las caderas toquen el suelo, lanza ambas piernas como marcos de guardia — el rollo solo está completo al restablecer la guardia',
    ],
  },
  613: {
    name: 'Escape del Headlock',
    description:
      'Escape de un headlock lateral sentado (kesa gatame / scarf hold), donde el oponente se sienta a tu lado controlando tu cabeza y brazo. Usa puente y movimiento de caderas para desequilibrar y recuperar.',
    cues: [
      'Protege el brazo atrapado manteniéndolo doblado y pegado al cuerpo — no lo estires o el estrangulamiento se aprieta',
      'Haz puente hacia el oponente para cargar tu peso sobre él, luego usa el impulso del puente para rodarlo sobre tu cuerpo',
      'Si apoya para detener el rodamiento, gamba las caderas en la dirección opuesta para liberar la cabeza',
      'Una vez libre la cabeza, recupera guardia o lucha por una posición neutral inmediatamente',
    ],
  },
  // Positions (7xx)
  701: {
    name: 'Montada',
    description:
      'Sentarse encima del torso del oponente — una de las posiciones más dominantes en el BJJ.',
    cues: [
      'Montura alta: ganchos detrás de sus brazos',
      'Mantén las caderas pesadas — no te apoyes',
      'Controla ambos brazos para abrir sumisiones',
      'Anticipa el puente — apoya el pie para contrarrestar',
    ],
  },
  702: {
    name: 'Control Lateral',
    description:
      'Controlar al oponente desde el lado con presión pecho a pecho.',
    cues: [
      'Presión de pecho en su pecho — no en sus brazos',
      'El cross-face gira su cabeza hacia afuera',
      'El gancho bajo controla su brazo cercano',
      'Peso hacia adelante — mantenlos planos',
    ],
  },
  703: {
    name: 'Control de Espalda',
    description:
      'Pegarse a la espalda del oponente con ganchos dentro, la posición más peligrosa del BJJ.',
    cues: [
      'Ganchos a la altura de la cadera — no en las piernas',
      'Cinturón de seguridad: palma adentro en el brazo del estrangulamiento',
      'Mantén tus caderas más bajas que las suyas',
      'Control dos a uno antes de ir por el estrangulamiento',
    ],
  },
  704: {
    name: 'Norte-Sur',
    description:
      'Controlar al oponente cabeza con cabeza, perpendicular a su cuerpo.',
    cues: [
      'Control de cabeza — coronilla de tu cabeza en su mentón',
      'Peso hacia adelante en su pecho',
      'Controla ambos brazos contra tus caderas',
      'Transiciona a Darce o kimura desde aquí',
    ],
  },
  705: {
    name: 'Rodilla en Abdomen',
    description:
      'Hundir la rodilla en el abdomen del oponente — una posición de transición y ataque.',
    cues: [
      'Espinilla a través del abdomen — no solo la rodilla',
      'Agarre del brazo lejano y agarre de solapa para estabilidad',
      'Listo para transicionar cuando hacen puente y empujan',
      'Usa la presión para forzar reacciones y preparar sumisiones',
    ],
  },
  706: {
    name: 'Posición Tortuga',
    description:
      'Posición tortuga — posición defensiva en cuatro apoyos que el oponente debe abrir para atacar.',
    cues: [
      'Mentón al pecho — protege el cuello siempre',
      'Apoya en cabeza y manos para estructura',
      'Busca el sit-out o el rodar para escapar',
      'Nunca te quedes estático — crea movimiento para escapar',
    ],
  },
  707: {
    name: 'Media Guardia Superior',
    description:
      'Posición de control superior mientras el oponente tiene una pierna atrapada, ideal para pases de presión.',
    cues: [
      'Cross-face y gancho bajo como prioridades',
      'Aplana las caderas antes de liberar la pierna',
      'Camina la línea de rodilla hacia atrás para despejar la trampa',
      'Cambia la base cuando utilizan el escudo de rodilla',
    ],
  },
  708: {
    name: 'S-Mount',
    description:
      'Variación avanzada de montura donde una rodilla se apoya alta cerca de la oreja del oponente mientras el pie opuesto permanece en el suelo, formando una forma de S con las piernas. Esta configuración aísla un brazo y crea una plataforma muy ajustada para finalizaciones de armbar y triángulo.',
    cues: [
      'Desde montura alta, espera a que el oponente empuje los codos hacia arriba como marco — ese espacio es la ventana de entrada al S-mount',
      'Desliza (no des pasos) una rodilla hasta su oreja a lo largo del suelo; dar un paso les da espacio para recuperar',
      'Cierra todo el espacio inmediatamente tras el deslizamiento; apoyar el pie opuesto estabiliza la posición',
      'El armbar es la finalización principal — la posición en S pre-carga el brazo; muévete directamente hacia él sin reiniciar',
    ],
  },
  709: {
    name: 'Crucifijo',
    description:
      'Posición de control que ataca a un oponente en posición tortuga donde un brazo queda atrapado por las piernas y el otro por las manos, inmovilizando ambos brazos simultáneamente. La entrada es típicamente desde un sprawl o ataque de espalda a la tortuga.',
    cues: [
      'Desde un sprawl o posición de ataque a la espalda, circula hacia un lado y mete tu rodilla cercana en la tortuga para abrirla',
      'Pasa el brazo cercano bajo su brazo lejano, atrapándolo con el codo; tus piernas atrapan el brazo cercano en figura 4',
      'Mantén presión de pecho sobre la espalda en todo momento; cualquier espacio le permite librar el brazo',
      'Ataques principales: estrangulamiento trasero (el brazo libre va bajo el mentón), estrangulamiento de solapa y kimura del brazo lejano',
    ],
  },
}

export const ES_DIFFICULTY: Record<Difficulty, string> = {
  BEGINNER: 'Principiante',
  INTERMEDIATE: 'Intermedio',
  ADVANCED: 'Avanzado',
  ELITE: 'Élite',
}

export const ES_SESSION_TYPES: Record<SessionType, string> = {
  GI: 'Gi',
  NOGI: 'No-Gi',
  OPEN_MAT: 'Open Mat',
  COMPETITION: 'Competición',
  DRILLING: 'Drills',
}

export const ES_CONNECTION_TYPES: Record<ConnectionType, string> = {
  FOLLOW_UP: 'Seguimiento',
  COUNTER: 'Contra',
  SETUP: 'Preparación',
  TRANSITION: 'Transición',
}

export const ES_LANGUAGE_PACK: LanguagePack = {
  translations: ES_TRANSLATIONS,
  categoryContent: ES_CATEGORY_CONTENT,
  techniqueContent: ES_TECHNIQUE_CONTENT,
  difficulty: ES_DIFFICULTY,
  sessionTypes: ES_SESSION_TYPES,
  connectionTypes: ES_CONNECTION_TYPES,
  locale: 'es-ES',
} satisfies LanguagePack
