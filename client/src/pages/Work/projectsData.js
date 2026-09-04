/**
 * VENOM — THE ARTIST
 * Archive Directory & Project Data Containers
 * 
 * NOTE: All genre project arrays are intentionally empty (`projects: []`).
 * You can add your real portfolio items directly into the `projects` array of any genre.
 * The UI will automatically render the editorial grid and full-screen project modal
 * as soon as project objects are added.
 */

export const GENRE_CATEGORIES = [
  {
    id: '01',
    key: 'cinema',
    title: 'CINEMA',
    discipline: 'ARCHIVE / FILM',
    description: 'Narrative Short Films & Feature Cinematography',
    projects: [
      /* Example project object schema to add later:
      {
        id: 'cinema-01',
        title: 'Project Title',
        year: '2025',
        client: 'Client / Production House',
        role: 'Director of Photography',
        projectType: 'Narrative Short Film',
        aspectRatio: '21/9',
        featured: true,
        thumbnail: '/images/work/thumb.jpg',
        heroImage: '/images/work/hero.jpg',
        gallery: ['/images/work/frame1.jpg', '/images/work/frame2.jpg'],
        shortDescription: 'Short project summary...',
        fullDescription: 'Comprehensive director/cinematographer statement...',
        tools: ['ARRI Alexa Mini', 'Cooke Anamorphic', 'DaVinci Resolve'],
        credits: [
          { role: 'Director', name: 'Name' },
          { role: 'Cinematographer', name: 'Akshat' }
        ]
      }
      */
    ],
  },
  {
    id: '02',
    key: 'moving-image',
    title: 'MOVING IMAGE',
    discipline: 'ARCHIVE / MOTION & EXPERIMENTAL',
    description: 'Experimental Visuals & Kinetic Direction',
    projects: [],
  },
  {
    id: '03',
    key: 'stills',
    title: 'STILLS',
    discipline: 'ARCHIVE / PHOTOGRAPHY',
    description: '35mm Film Photography & Editorial Portraits',
    projects: [],
  },
  {
    id: '04',
    key: 'the-cut',
    title: 'THE CUT',
    discipline: 'ARCHIVE / EDITING',
    description: 'Rhythmic Film Editing & Sound Design Sync',
    projects: [],
  },
  {
    id: '05',
    key: 'short-form',
    title: 'SHORT FORM',
    discipline: 'ARCHIVE / VERTICAL CINEMA',
    description: 'High-Impact Vertical Cinema & Micro-Docs',
    projects: [],
  },
  {
    id: '06',
    key: 'stories',
    title: 'STORIES',
    discipline: 'ARCHIVE / DOCUMENTARY',
    description: 'Character Studies & Narrative Documentaries',
    projects: [],
  },
  {
    id: '07',
    key: 'brand-work',
    title: 'BRAND WORK',
    discipline: 'ARCHIVE / COMMERCIAL',
    description: 'Commercial Campaigns & Fashion Lookbooks',
    projects: [],
  },
  {
    id: '08',
    key: 'live',
    title: 'LIVE',
    discipline: 'ARCHIVE / CONCERT & PERFORMANCE',
    description: 'Concert Multicam Cinema & Tour Visuals',
    projects: [],
  },
];
