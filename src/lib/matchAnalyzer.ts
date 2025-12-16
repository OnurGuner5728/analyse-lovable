// Types
export interface Match {
  result?: 'W' | 'D' | 'L';
  venue?: 'Home' | 'Away';
  gf?: string | number;
  ga?: string | number;
  comp?: string;
  formation?: string;
  date?: string;
  opponent?: string;
}

export interface Player {
  Player: string;
  position?: string;
  goals?: string | number;
  assists?: string | number;
  cards_yellow?: string | number;
  cards_red?: string | number;
  minutes?: string | number;
}

export interface TeamData {
  teamName?: string;
  league?: string;
  points?: number;
  manager?: string;
  recentMatches?: Match[];
  players?: Player[];
  h2h?: H2HData;
}

export interface H2HData {
  team1?: { wins?: number; draws?: number };
  team2?: { wins?: number; draws?: number };
  matches?: Match[];
}

export interface VenueStats {
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
}

export interface TeamStats {
  total: VenueStats;
  home: VenueStats;
  away: VenueStats;
  form: {
    last5: string[];
    last10: string[];
    points: number;
  };
  cleanSheets: number;
  failedToScore: number;
  btts: number;
  over15: number;
  over25: number;
  over35: number;
  currentStreak: { type: string | null; count: number };
  formations: Record<string, number>;
  avgGoalsFor: string;
  avgGoalsAgainst: string;
  ppg: string;
  homePPG: string;
  awayPPG: string;
  cleanSheetPct: string;
  failedToScorePct: string;
  bttsPct: string;
  over25Pct: string;
}

export interface Prediction {
  homeWinPct: string;
  awayWinPct: string;
  drawPct: string;
  expectedHomeGoals: string;
  expectedAwayGoals: string;
  bttsPct: string;
  over25Pct: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface NewsItem {
  title: string;
  url: string;
  source: string;
  date: string;
  snippet?: string;
}

// Utilities
export const parseNum = (val: unknown): number => {
  if (val === null || val === undefined || val === '') return 0;
  const parsed = parseFloat(String(val).replace(',', ''));
  return isNaN(parsed) ? 0 : parsed;
};

export const calculateTeamStats = (team: TeamData | null, competition = 'all'): TeamStats | null => {
  if (!team?.recentMatches) return null;
  
  let matches = team.recentMatches.filter(m => m.result);
  if (competition !== 'all') {
    matches = matches.filter(m => m.comp === competition || m.comp?.includes(competition));
  }

  const stats: TeamStats = {
    total: { matches: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 },
    home: { matches: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 },
    away: { matches: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 },
    form: { last5: [], last10: [], points: 0 },
    cleanSheets: 0,
    failedToScore: 0,
    btts: 0,
    over15: 0,
    over25: 0,
    over35: 0,
    currentStreak: { type: null, count: 0 },
    formations: {},
    avgGoalsFor: '0.00',
    avgGoalsAgainst: '0.00',
    ppg: '0.00',
    homePPG: '0.00',
    awayPPG: '0.00',
    cleanSheetPct: '0.0',
    failedToScorePct: '0.0',
    bttsPct: '0.0',
    over25Pct: '0.0',
  };

  matches.forEach((match) => {
    const gf = parseNum(match.gf);
    const ga = parseNum(match.ga);
    const totalGoals = gf + ga;
    const isHome = match.venue === 'Home';

    stats.total.matches++;
    stats.total.gf += gf;
    stats.total.ga += ga;

    if (match.result === 'W') stats.total.wins++;
    else if (match.result === 'D') stats.total.draws++;
    else if (match.result === 'L') stats.total.losses++;

    if (isHome) {
      stats.home.matches++;
      stats.home.gf += gf;
      stats.home.ga += ga;
      if (match.result === 'W') stats.home.wins++;
      else if (match.result === 'D') stats.home.draws++;
      else if (match.result === 'L') stats.home.losses++;
    } else {
      stats.away.matches++;
      stats.away.gf += gf;
      stats.away.ga += ga;
      if (match.result === 'W') stats.away.wins++;
      else if (match.result === 'D') stats.away.draws++;
      else if (match.result === 'L') stats.away.losses++;
    }

    if (ga === 0) stats.cleanSheets++;
    if (gf === 0) stats.failedToScore++;
    if (gf > 0 && ga > 0) stats.btts++;
    if (totalGoals > 1.5) stats.over15++;
    if (totalGoals > 2.5) stats.over25++;
    if (totalGoals > 3.5) stats.over35++;

    if (match.formation) {
      stats.formations[match.formation] = (stats.formations[match.formation] || 0) + 1;
    }
  });

  const last10 = matches.slice(-10);
  const last5 = matches.slice(-5);
  stats.form.last5 = last5.map(m => m.result || '?');
  stats.form.last10 = last10.map(m => m.result || '?');
  stats.form.points = last5.reduce((acc, m) => 
    m.result === 'W' ? acc + 3 : m.result === 'D' ? acc + 1 : acc, 0
  );

  for (let i = matches.length - 1; i >= 0; i--) {
    const result = matches[i].result;
    if (stats.currentStreak.type === null) {
      stats.currentStreak.type = result || null;
      stats.currentStreak.count = 1;
    } else if (stats.currentStreak.type === result) {
      stats.currentStreak.count++;
    } else break;
  }

  const totalMatches = stats.total.matches || 1;
  stats.avgGoalsFor = (stats.total.gf / totalMatches).toFixed(2);
  stats.avgGoalsAgainst = (stats.total.ga / totalMatches).toFixed(2);
  stats.ppg = (((stats.total.wins * 3) + stats.total.draws) / totalMatches).toFixed(2);
  stats.homePPG = stats.home.matches
    ? (((stats.home.wins * 3) + stats.home.draws) / stats.home.matches).toFixed(2)
    : '0.00';
  stats.awayPPG = stats.away.matches
    ? (((stats.away.wins * 3) + stats.away.draws) / stats.away.matches).toFixed(2)
    : '0.00';
  stats.cleanSheetPct = ((stats.cleanSheets / totalMatches) * 100).toFixed(1);
  stats.failedToScorePct = ((stats.failedToScore / totalMatches) * 100).toFixed(1);
  stats.bttsPct = ((stats.btts / totalMatches) * 100).toFixed(1);
  stats.over25Pct = ((stats.over25 / totalMatches) * 100).toFixed(1);

  return stats;
};

export const getTopScorers = (players: Player[] | undefined, limit = 5): Player[] => {
  if (!players) return [];
  return players
    .filter(p => p.position !== 'GK' && parseNum(p.goals) > 0)
    .sort((a, b) => parseNum(b.goals) - parseNum(a.goals))
    .slice(0, limit);
};

export const getCardRisks = (players: Player[] | undefined): Player[] => {
  if (!players) return [];
  return players
    .filter(p => parseNum(p.cards_yellow) >= 3)
    .sort((a, b) => parseNum(b.cards_yellow) - parseNum(a.cards_yellow));
};

export const calculatePrediction = (
  homeStats: TeamStats,
  awayStats: TeamStats,
  h2hStats?: H2HData
): Prediction | null => {
  if (!homeStats || !awayStats) return null;

  const homeFormScore = (homeStats.form.points / 15) * 100;
  const awayFormScore = (awayStats.form.points / 15) * 100;

  let homeH2HScore = 50, awayH2HScore = 50;
  if (h2hStats && h2hStats.team1 && h2hStats.team2) {
    const total = (h2hStats.team1.wins || 0) + (h2hStats.team2.wins || 0) + (h2hStats.team1.draws || 0);
    if (total > 0) {
      homeH2HScore = ((h2hStats.team1.wins || 0) / total) * 100;
      awayH2HScore = ((h2hStats.team2.wins || 0) / total) * 100;
    }
  }

  const homeVenueScore = Math.min((parseFloat(homeStats.homePPG) / 3) * 100, 100);
  const awayVenueScore = Math.min((parseFloat(awayStats.awayPPG) / 3) * 100, 100);
  const homeGoalDiff = homeStats.total.gf - homeStats.total.ga;
  const awayGoalDiff = awayStats.total.gf - awayStats.total.ga;
  const homeGoalScore = Math.max(0, Math.min(100, 50 + homeGoalDiff * 3));
  const awayGoalScore = Math.max(0, Math.min(100, 50 + awayGoalDiff * 3));

  const homeFinal = homeFormScore * 0.30 + homeH2HScore * 0.20 + homeVenueScore * 0.25 + homeGoalScore * 0.15 +
    (homeStats.currentStreak.type === 'W' ? 70 : homeStats.currentStreak.type === 'L' ? 30 : 50) * 0.10;
  const awayFinal = awayFormScore * 0.30 + awayH2HScore * 0.20 + awayVenueScore * 0.25 + awayGoalScore * 0.15 +
    (awayStats.currentStreak.type === 'W' ? 70 : awayStats.currentStreak.type === 'L' ? 30 : 50) * 0.10;

  const drawBase = 18;
  const total = homeFinal + awayFinal + drawBase;

  return {
    homeWinPct: ((homeFinal / total) * 100).toFixed(1),
    awayWinPct: ((awayFinal / total) * 100).toFixed(1),
    drawPct: ((drawBase / total) * 100).toFixed(1),
    expectedHomeGoals: (parseFloat(homeStats.avgGoalsFor) * (parseFloat(awayStats.avgGoalsAgainst) / 1.5)).toFixed(1),
    expectedAwayGoals: (parseFloat(awayStats.avgGoalsFor) * (parseFloat(homeStats.avgGoalsAgainst) / 1.5) * 0.85).toFixed(1),
    bttsPct: ((parseFloat(homeStats.bttsPct) + parseFloat(awayStats.bttsPct)) / 2).toFixed(1),
    over25Pct: ((parseFloat(homeStats.over25Pct) + parseFloat(awayStats.over25Pct)) / 2).toFixed(1),
    confidence: Math.abs(homeFinal - awayFinal) > 20 ? 'high' : Math.abs(homeFinal - awayFinal) > 10 ? 'medium' : 'low',
  };
};

export const fetchNews = async (homeTeam: string, awayTeam: string): Promise<NewsItem[]> => {
  try {
    const query = encodeURIComponent(`${homeTeam} vs ${awayTeam} football`);
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://news.google.com/rss/search?q=${query}&hl=en`)}`;

    const response = await fetch(proxyUrl);
    if (!response.ok) return [];

    const xml = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    const items = doc.querySelectorAll('item');

    return Array.from(items).slice(0, 10).map(item => ({
      title: item.querySelector('title')?.textContent?.replace(/<[^>]*>/g, '') || '',
      url: item.querySelector('link')?.textContent || '',
      source: item.querySelector('source')?.textContent || 'Google News',
      date: item.querySelector('pubDate')?.textContent
        ? new Date(item.querySelector('pubDate')!.textContent!).toLocaleDateString('tr-TR')
        : '',
    }));
  } catch {
    return [];
  }
};
