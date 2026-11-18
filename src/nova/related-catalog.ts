import neonDreams from '@/assets/neon-dreams-poster.webp';
import shadowProtocol from '@/assets/shadow-protocol-poster.webp';
import crimsonVeil from '@/assets/crimson-veil-poster.webp';
import barcode from '@/assets/barcode-poster.webp';

export type ContentKind = 'Movie' | 'Series';

export type PreviewTitle = {
  title: string;
  kind: ContentKind;
  genres: string[];
  artwork: string;
  year?: string;
};

export type EpisodeItem = {
  episode: number;
  title: string;
  duration: string;
  synopsis: string;
  artwork: string;
};

export type SeasonData = {
  season: number;
  label: string;
  episodes: EpisodeItem[];
};

const previewTitles: PreviewTitle[] = [
  { title: 'Neon Dreams', kind: 'Series', genres: ['Sci-Fi', 'Mystery'], artwork: neonDreams, year: '2025' },
  { title: 'Shadow Protocol', kind: 'Movie', genres: ['Action', 'Thriller'], artwork: shadowProtocol, year: '2025' },
  { title: 'Crimson Veil', kind: 'Movie', genres: ['Thriller', 'Crime'], artwork: crimsonVeil, year: '2024' },
  { title: 'Barcode', kind: 'Series', genres: ['Mystery', 'Drama'], artwork: barcode, year: '2024' },
];

const SERIES_TITLES = new Set<string>([
  'Neon Dreams',
  'Barcode',
  'Demon Slayer',
  'Cars on Fire',
  'Dark Matter',
  'The Fall',
  'Echoes of Tomorrow',
  'Black Mirror City',
  'The Order',
  'Rogue State',
  'Aftermath',
  'The Last Kingdom',
  'Foggy Crossing',
  'Sacred Games',
  'Mirzapur',
  'The Family Man',
  'Panchayat',
  'Scam 1992',
  'Aspirants',
  'Maharani',
  'Aashram',
  'Rana Naidu',
  'Betaal',
  'Criminal Justice',
  'Taarak Mehta',
  'CID',
  'Crime Patrol',
  'Kumkum Bhagya',
  'Kundali',
  'Bade Achhe',
  'Anupamaa',
  'Yeh Rishta',
  'Ghum Hai',
  'Imlie',
  'Pandya Store',
  'Bhagya',
  'Bigg Boss 18',
  'KBC 16',
  'Roadies',
  'Indian Idol',
  'Dance India',
  'Splitsvilla',
  'Chhota Bheem',
  'Motu Patlu',
  'Doraemon',
  'Shinchan',
  'Perman',
  'Ninja Hattori',
  'Powerpuff Girls',
  'Ben 10',
  'Mr. Bean',
  'Tom & Jerry',
  'Oggy',
  'Kiteretsu',
  'TMKOC',
  'Bhabi Ji Ghar',
  'The Kapil Show',
  'Wagle Ki Duniya',
  'Happu Ki Ultan',
  'F.I.R',
]);

const titleGenres: Record<string, string[]> = {
  'Saruam Maya': ['Comedy', 'Drama'],
  'Demon Slayer': ['Action', 'Drama'],
  'Cars on Fire': ['Action', 'Thriller'],
  'Dark Matter': ['Sci-Fi', 'Mystery'],
  'The Fall': ['Crime', 'Thriller'],
  'Echoes of Tomorrow': ['Sci-Fi'],
  'Black Mirror City': ['Sci-Fi', 'Mystery'],
  'The Order': ['Mystery'],
  'Rogue State': ['Action', 'Thriller'],
  'Midnight Run': ['Action'],
  'Zero Hour': ['Thriller'],
  Spectra: ['Drama'],
  'The Silent Witness': ['Crime'],
  'Midnight Hollow': ['Horror'],
  'Foggy Crossing': ['Mystery', 'Thriller'],
  'Last Light': ['Romance', 'Drama'],
  Pathaan: ['Action', 'Thriller'],
  Jawan: ['Action', 'Drama'],
  Mirzapur: ['Crime', 'Thriller'],
  'Sacred Games': ['Crime', 'Thriller'],
  Panchayat: ['Comedy', 'Drama'],
};

const SERIES_CUSTOM_SEASONS: Record<string, { s1: string[]; s2: string[]; s3: string[] }> = {
  'Demon Slayer': {
    s1: ['Cruelty', 'Trainer Urokodaki', 'Sabito & Makomo', 'Final Selection', 'My Own Steel'],
    s2: ['Flame Hashira', 'Deep Slumber', 'Should Have Been', 'Insult', 'Move Forward'],
    s3: ['Someone’s Dream', 'Yoriichi Type Zero', 'A Sword from Over 300 Years', 'Thank You, Tokito', 'Bright Red Sword'],
  },
  'Neon Dreams': {
    s1: ['Signal Zero', 'The Glass Grid', 'Ghost Frequency', 'Memory Leak', 'Blackout'],
    s2: ['Mirror Core', 'Synthetic Dawn', 'Dead Channel', 'Overclock', 'Echo Chamber'],
    s3: ['Reset Protocol', 'Subzero', 'Silent Relay', 'Terminal Horizon', 'Awakening'],
  },
  Barcode: {
    s1: ['001: The Ledger', '002: Counterfeit', '003: Blind Spot', '004: Ink & Iron', '005: Checkout'],
    s2: ['006: Black Market', '007: Duplicate Key', '008: Redacted', '009: Warehouse 9', '010: Final Scan'],
    s3: ['011: Ghost Inventory', '012: Override', '013: Trace Route', '014: Broken Seal', '015: Zero Balance'],
  },
  'Dark Matter': {
    s1: ['Are You Happy?', 'Trip of a Lifetime', 'The Box', 'The Corridor', 'Worldless'],
    s2: ['Superposition', 'Phase Shift', 'Entangled', 'Parallel Echo', 'Event Horizon'],
    s3: ['Collapse', 'Wave Function', 'Observer Effect', 'Multiverse', 'Homecoming'],
  },
};

const ARTWORKS = [neonDreams, shadowProtocol, crimsonVeil, barcode];

export function parseSeriesTitle(rawTitle: string): {
  baseTitle: string;
  seasonNumber: number;
  episodeNumber: number;
  hasEpisodeTag: boolean;
} {
  const match = rawTitle.match(/^(.+?)\s*·\s*S(\d+):E(\d+)$/i);
  if (!match) {
    return { baseTitle: rawTitle, seasonNumber: 1, episodeNumber: 1, hasEpisodeTag: false };
  }
  return {
    baseTitle: match[1]!.trim(),
    seasonNumber: Math.max(1, Number(match[2])),
    episodeNumber: Math.max(1, Number(match[3])),
    hasEpisodeTag: true,
  };
}

export function getContentKind(title: string, explicitType?: 'movie' | 'series' | 'video'): ContentKind {
  const parsed = parseSeriesTitle(title);
  if (parsed.hasEpisodeTag) return 'Series';
  if (explicitType === 'series') return 'Series';
  if (explicitType === 'movie') return 'Movie';
  if (SERIES_TITLES.has(parsed.baseTitle)) return 'Series';
  return 'Movie';
}

export function isSeriesTitle(title: string, explicitType?: 'movie' | 'series' | 'video'): boolean {
  return getContentKind(title, explicitType) === 'Series';
}

export function getRelatedTitles(title: string): PreviewTitle[] {
  const { baseTitle } = parseSeriesTitle(title);
  const genres = previewTitles.find(item => item.title === baseTitle)?.genres ?? titleGenres[baseTitle] ?? [];
  const score = (item: PreviewTitle) => item.genres.filter(genre => genres.includes(genre)).length;
  return previewTitles.filter(item => item.title !== baseTitle).sort((a, b) => score(b) - score(a));
}

export function getSimilarTitles(title: string): PreviewTitle[] {
  const related = getRelatedTitles(title);
  const { baseTitle } = parseSeriesTitle(title);
  const baseGenres = previewTitles.find(item => item.title === baseTitle)?.genres ?? titleGenres[baseTitle] ?? ['Drama'];
  const extraCandidates: PreviewTitle[] = [
    { title: 'Saruam Maya', kind: 'Movie', genres: ['Comedy', 'Drama'], artwork: crimsonVeil, year: '2025' },
    { title: 'Mirzapur', kind: 'Series', genres: ['Crime', 'Thriller'], artwork: shadowProtocol, year: '2025' },
    { title: 'Dark Matter', kind: 'Series', genres: ['Sci-Fi', 'Mystery'], artwork: neonDreams, year: '2025' },
    { title: 'Demon Slayer', kind: 'Series', genres: ['Action', 'Drama'], artwork: barcode, year: '2025' },
    { title: 'Pathaan', kind: 'Movie', genres: ['Action', 'Thriller'], artwork: shadowProtocol, year: '2025' },
  ];
  const extraCatalog = extraCandidates.filter(
    item => item.title !== baseTitle && !related.some(r => r.title === item.title),
  );

  const score = (item: PreviewTitle) => item.genres.filter(genre => baseGenres.includes(genre)).length;
  return [...related, ...extraCatalog].sort((a, b) => score(b) - score(a));
}

export function getSeasonsForTitle(title: string): SeasonData[] {
  const { baseTitle } = parseSeriesTitle(title);
  const custom = SERIES_CUSTOM_SEASONS[baseTitle];
  const baseArtwork = artworkFor(baseTitle) ?? neonDreams;

  const buildEpisodes = (seasonNum: number, customNames?: string[]): EpisodeItem[] => {
    const names = customNames ?? [
      'The Beginning',
      'Hidden Truths',
      'Crossroads',
      'Turning Point',
    ];
    return names.map((epTitle, idx) => ({
      episode: idx + 1,
      title: epTitle,
      duration: `${36 + ((seasonNum * 5 + idx * 3) % 16)}m`,
      synopsis: `${baseTitle} · Season ${seasonNum}, Episode ${idx + 1}: ${epTitle}.`,
      artwork: idx === 0 ? baseArtwork : ARTWORKS[(seasonNum + idx) % ARTWORKS.length]!,
    }));
  };

  return [
    { season: 1, label: 'Season 1', episodes: buildEpisodes(1, custom?.s1) },
    { season: 2, label: 'Season 2', episodes: buildEpisodes(2, custom?.s2) },
    { season: 3, label: 'Season 3', episodes: buildEpisodes(3, custom?.s3) },
  ];
}

/** Bundled artwork for a preview title, if one exists. */
export function artworkFor(title: string): string | undefined {
  const { baseTitle } = parseSeriesTitle(title);
  return previewTitles.find(item => item.title === baseTitle)?.artwork;
}
