import { useState } from 'react';
import { Loader2, Brain, Sparkles, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { TeamStats, H2HData, Prediction } from '@/lib/matchAnalyzer';

interface AIAnalysisProps {
  homeTeamName: string;
  awayTeamName: string;
  homeStats: TeamStats | null;
  awayStats: TeamStats | null;
  h2h: H2HData | null;
  prediction: Prediction | null;
}

export const AIAnalysis = ({ homeTeamName, awayTeamName, homeStats, awayStats, h2h, prediction }: AIAnalysisProps) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      const matchContext = {
        homeTeam: homeTeamName,
        awayTeam: awayTeamName,
        homeStats: homeStats ? {
          form: homeStats.form.last5.join('-'),
          ppg: homeStats.ppg,
          avgGoalsFor: homeStats.avgGoalsFor,
          avgGoalsAgainst: homeStats.avgGoalsAgainst,
          cleanSheetPct: homeStats.cleanSheetPct,
          currentStreak: `${homeStats.currentStreak.count} ${homeStats.currentStreak.type}`,
        } : null,
        awayStats: awayStats ? {
          form: awayStats.form.last5.join('-'),
          ppg: awayStats.ppg,
          avgGoalsFor: awayStats.avgGoalsFor,
          avgGoalsAgainst: awayStats.avgGoalsAgainst,
          cleanSheetPct: awayStats.cleanSheetPct,
          currentStreak: `${awayStats.currentStreak.count} ${awayStats.currentStreak.type}`,
        } : null,
        h2h: h2h ? {
          totalGames: h2h.totalGames,
          team1Wins: h2h.team1?.wins,
          team2Wins: h2h.team2?.wins,
          draws: h2h.team1?.draws,
        } : null,
        prediction: prediction ? {
          homeWinPct: prediction.homeWinPct,
          drawPct: prediction.drawPct,
          awayWinPct: prediction.awayWinPct,
          expectedScore: `${prediction.expectedHomeGoals}-${prediction.expectedAwayGoals}`,
        } : null,
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

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm mb-4">
          {error}
        </div>
      )}

      {!analysis && !loading && !error && (
        <div className="text-center py-8 text-muted-foreground">
          <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Maç verilerini analiz etmek için butona tıklayın</p>
          <p className="text-xs mt-1">GPT-4 destekli detaylı tahmin ve öneriler</p>
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-primary" />
          <p className="text-muted-foreground">Yapay zeka maçı analiz ediyor...</p>
        </div>
      )}

      {analysis && !loading && (
        <div className="prose prose-invert prose-sm max-w-none">
          <div className="bg-secondary/30 rounded-xl p-4 whitespace-pre-wrap text-foreground leading-relaxed">
            {analysis}
          </div>
        </div>
      )}
    </div>
  );
};
