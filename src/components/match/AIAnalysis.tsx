import { useState } from 'react';
import { Loader2, Brain, Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { TeamStats, H2HData, Prediction, NewsItem, Player, parseNum } from '@/lib/matchAnalyzer';

interface AIAnalysisProps {
  homeTeamName: string;
  awayTeamName: string;
  homeStats: TeamStats | null;
  awayStats: TeamStats | null;
  h2h: H2HData | null;
  prediction: Prediction | null;
  homeManager?: string;
  awayManager?: string;
  homeLeague?: string;
  awayLeague?: string;
  homePlayers?: Player[];
  awayPlayers?: Player[];
  news?: NewsItem[];
}

export const AIAnalysis = ({ 
  homeTeamName, 
  awayTeamName, 
  homeStats, 
  awayStats, 
  h2h, 
  prediction,
  homeManager,
  awayManager,
  homeLeague,
  awayLeague,
  homePlayers,
  awayPlayers,
  news
}: AIAnalysisProps) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate player stats for AI
  const getPlayerStats = (players: Player[] | undefined) => {
    if (!players || players.length === 0) return null;
    
    const totalGoals = players.reduce((sum, p) => sum + parseNum(p.goals), 0);
    const totalAssists = players.reduce((sum, p) => sum + parseNum(p.assists), 0);
    const totalYellowCards = players.reduce((sum, p) => sum + parseNum(p.cards_yellow), 0);
    const totalRedCards = players.reduce((sum, p) => sum + parseNum(p.cards_red), 0);
    
    const topScorer = players
      .filter(p => p.position !== 'GK')
      .sort((a, b) => parseNum(b.goals) - parseNum(a.goals))[0];
    
    const topAssister = players
      .filter(p => p.position !== 'GK')
      .sort((a, b) => parseNum(b.assists) - parseNum(a.assists))[0];
    
    const mostCarded = players
      .sort((a, b) => parseNum(b.cards_yellow) - parseNum(a.cards_yellow))[0];
    
    return {
      totalGoals,
      totalAssists,
      totalYellowCards,
      totalRedCards,
      topScorer: topScorer ? `${topScorer.Player} (${parseNum(topScorer.goals)} gol)` : null,
      topAssister: topAssister ? `${topAssister.Player} (${parseNum(topAssister.assists)} asist)` : null,
      mostCarded: mostCarded && parseNum(mostCarded.cards_yellow) > 0 
        ? `${mostCarded.Player} (${parseNum(mostCarded.cards_yellow)} sarı)` 
        : null,
      avgCardsPerGame: players.length > 0 
        ? (totalYellowCards / Math.max(parseNum(players[0]?.games) || 1, 1)).toFixed(2) 
        : '0',
    };
  };

  // Filter valid H2H matches (exclude today and unplayed)
  const getValidH2HMatches = () => {
    if (!h2h?.matches) return [];
    
    const today = new Date().toISOString().split('T')[0];
    return h2h.matches.filter(match => {
      if (match.date === today) return false;
      const score = match.score || '';
      if (!score || score === '–' || score === '-') return false;
      return true;
    });
  };

  const generateAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      const homePlayerStats = getPlayerStats(homePlayers);
      const awayPlayerStats = getPlayerStats(awayPlayers);
      const validH2HMatches = getValidH2HMatches();

      // Determine competition type
      const isInternational = homeLeague && awayLeague && homeLeague !== awayLeague;
      const competitionType = isInternational ? 'international' : 'league';

      const matchContext = {
        homeTeam: homeTeamName,
        awayTeam: awayTeamName,
        competitionType,
        homeLeague: homeLeague || 'Bilinmiyor',
        awayLeague: awayLeague || 'Bilinmiyor',
        homeManager: homeManager || 'Bilinmiyor',
        awayManager: awayManager || 'Bilinmiyor',
        homeStats: homeStats ? {
          form: homeStats.form.last5.join('-'),
          ppg: homeStats.ppg,
          avgGoalsFor: homeStats.avgGoalsFor,
          avgGoalsAgainst: homeStats.avgGoalsAgainst,
          cleanSheetPct: homeStats.cleanSheetPct,
          failedToScorePct: homeStats.failedToScorePct,
          bttsPct: homeStats.bttsPct,
          over25Pct: homeStats.over25Pct,
          currentStreak: `${homeStats.currentStreak.count} ${homeStats.currentStreak.type}`,
          homeRecord: `${homeStats.home.wins}G-${homeStats.home.draws}B-${homeStats.home.losses}M`,
          formations: Object.entries(homeStats.formations).map(([f, c]) => `${f}(${c})`).join(', '),
        } : null,
        awayStats: awayStats ? {
          form: awayStats.form.last5.join('-'),
          ppg: awayStats.ppg,
          avgGoalsFor: awayStats.avgGoalsFor,
          avgGoalsAgainst: awayStats.avgGoalsAgainst,
          cleanSheetPct: awayStats.cleanSheetPct,
          failedToScorePct: awayStats.failedToScorePct,
          bttsPct: awayStats.bttsPct,
          over25Pct: awayStats.over25Pct,
          currentStreak: `${awayStats.currentStreak.count} ${awayStats.currentStreak.type}`,
          awayRecord: `${awayStats.away.wins}G-${awayStats.away.draws}B-${awayStats.away.losses}M`,
          formations: Object.entries(awayStats.formations).map(([f, c]) => `${f}(${c})`).join(', '),
        } : null,
        homePlayerStats,
        awayPlayerStats,
        h2h: validH2HMatches.length > 0 ? {
          totalGames: validH2HMatches.length,
          team1Wins: h2h?.team1?.wins,
          team2Wins: h2h?.team2?.wins,
          draws: h2h?.team1?.draws,
          team1Goals: h2h?.team1?.goals,
          team2Goals: h2h?.team2?.goals,
          recentResults: validH2HMatches.slice(0, 5).map(m => ({
            date: m.date,
            score: m.score,
            competition: m.competition
          })),
        } : null,
        prediction: prediction ? {
          homeWinPct: prediction.homeWinPct,
          drawPct: prediction.drawPct,
          awayWinPct: prediction.awayWinPct,
          expectedScore: `${prediction.expectedHomeGoals}-${prediction.expectedAwayGoals}`,
          bttsPct: prediction.bttsPct,
          over25Pct: prediction.over25Pct,
          confidence: prediction.confidence,
        } : null,
        // Pass news headlines for AI to interpret (not scrape)
        newsHeadlines: news?.slice(0, 5).map(n => ({
          title: n.title,
          source: n.source,
          date: n.date
        })) || [],
      };

      const { data, error: fnError } = await supabase.functions.invoke('analyze-match', {
        body: { matchContext },
      });

      if (fnError) throw fnError;
      
      setAnalysis(data?.analysis || 'Analiz oluşturulamadı.');
    } catch (err) {
      console.error('AI Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analiz hatası oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-primary/10 via-card to-card rounded-2xl p-6 border border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          Yapay Zeka Analizi
          <Sparkles className="w-4 h-4 text-warning" />
        </h3>
        
        <button
          onClick={generateAnalysis}
          disabled={loading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analiz Ediliyor...
            </>
          ) : analysis ? (
            <>
              <RefreshCw className="w-4 h-4" />
              Yeniden Analiz
            </>
          ) : (
            <>
              <Brain className="w-4 h-4" />
              Analiz Et
            </>
          )}
        </button>
      </div>

      {/* Analysis Features */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        <div className="bg-secondary/30 rounded-lg px-3 py-2 text-center">
          <div className="text-xs text-muted-foreground">Skor Tahmini</div>
          <div className="text-xs text-primary font-medium">✓</div>
        </div>
        <div className="bg-secondary/30 rounded-lg px-3 py-2 text-center">
          <div className="text-xs text-muted-foreground">Kart/Penaltı</div>
          <div className="text-xs text-primary font-medium">✓</div>
        </div>
        <div className="bg-secondary/30 rounded-lg px-3 py-2 text-center">
          <div className="text-xs text-muted-foreground">Manager</div>
          <div className="text-xs text-primary font-medium">✓</div>
        </div>
        <div className="bg-secondary/30 rounded-lg px-3 py-2 text-center">
          <div className="text-xs text-muted-foreground">Haber Yorumu</div>
          <div className="text-xs text-primary font-medium">✓</div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {!analysis && !loading && !error && (
        <div className="text-center py-8 text-muted-foreground">
          <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Maç verilerini analiz etmek için butona tıklayın</p>
          <p className="text-xs mt-1">GPT destekli detaylı tahmin, skor önerisi ve bahis analizi</p>
          <div className="mt-4 text-xs text-muted-foreground/70">
            Analiz içeriği: Form • H2H • Oyuncu istatistikleri • Kart riskleri • Penaltı/Frikik potansiyeli • 
            Manager karşılaştırması • Lig/Uluslararası bağlam • Haber değerlendirmesi
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-primary" />
          <p className="text-muted-foreground">Yapay zeka maçı analiz ediyor...</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Tüm istatistikler, oyuncu verileri ve haberler değerlendiriliyor
          </p>
        </div>
      )}

      {analysis && !loading && (
        <div className="prose prose-invert prose-sm max-w-none">
          <div className="bg-secondary/30 rounded-xl p-4 whitespace-pre-wrap text-foreground leading-relaxed text-sm">
            {analysis}
          </div>
        </div>
      )}
    </div>
  );
};
