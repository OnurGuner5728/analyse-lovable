import { TrendingUp, TrendingDown, Minus, Trophy, Target, Shield, Zap } from 'lucide-react';

interface MatchSummaryCardProps {
  homeTeam: string;
  awayTeam: string;
  prediction: {
    homeWinPct: number;
    drawPct: number;
    awayWinPct: number;
    expectedScore: string;
    bttsPct: number;
    over25Pct: number;
    confidence: string;
  };
  homeStats: {
    ppg: number;
    avgGoalsFor: number;
    avgGoalsAgainst: number;
    form: { points: number };
  };
  awayStats: {
    ppg: number;
    avgGoalsFor: number;
    avgGoalsAgainst: number;
    form: { points: number };
  };
}

export function MatchSummaryCard({
  homeTeam,
  awayTeam,
  prediction,
  homeStats,
  awayStats,
}: MatchSummaryCardProps) {
  const getWinner = () => {
    if (prediction.homeWinPct > prediction.awayWinPct + 10) return 'home';
    if (prediction.awayWinPct > prediction.homeWinPct + 10) return 'away';
    return 'draw';
  };

  const winner = getWinner();
  const [homeGoals, awayGoals] = prediction.expectedScore.split('-').map(Number);

  const getFormTrend = (points: number) => {
    if (points >= 10) return { icon: TrendingUp, color: 'text-success', label: 'Yükselişte' };
    if (points >= 6) return { icon: Minus, color: 'text-warning', label: 'Stabil' };
    return { icon: TrendingDown, color: 'text-destructive', label: 'Düşüşte' };
  };

  const homeTrend = getFormTrend(homeStats.form.points);
  const awayTrend = getFormTrend(awayStats.form.points);
  const HomeTrendIcon = homeTrend.icon;
  const AwayTrendIcon = awayTrend.icon;

  return (
    <div className="bg-gradient-to-br from-card via-secondary/30 to-background rounded-2xl p-6 border border-border shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <Trophy className="w-5 h-5 text-primary" />
        <span className="text-primary font-semibold">Maç Özeti</span>
      </div>
      
      {/* Main prediction */}
      <div className="text-center mb-6">
        <div className="text-5xl font-black text-gradient mb-2">
          {prediction.expectedScore}
        </div>
        <div className="text-muted-foreground text-sm">Beklenen Skor</div>
      </div>
      
      {/* Team comparison */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Home team */}
        <div className={`text-center p-4 rounded-xl transition-all ${
          winner === 'home' ? 'bg-success/20 border-2 border-success' : 'bg-secondary/50'
        }`}>
          <div className="text-2xl font-bold text-foreground mb-1">
            {homeGoals}
          </div>
          <div className="text-xs text-muted-foreground mb-2">{homeTeam}</div>
          <div className={`flex items-center justify-center gap-1 text-xs ${homeTrend.color}`}>
            <HomeTrendIcon className="w-3 h-3" />
            <span>{homeTrend.label}</span>
          </div>
        </div>
        
        {/* Draw */}
        <div className={`text-center p-4 rounded-xl transition-all ${
          winner === 'draw' ? 'bg-warning/20 border-2 border-warning' : 'bg-secondary/50'
        }`}>
          <div className="text-2xl font-bold text-foreground mb-1">
            %{prediction.drawPct.toFixed(0)}
          </div>
          <div className="text-xs text-muted-foreground">Beraberlik</div>
        </div>
        
        {/* Away team */}
        <div className={`text-center p-4 rounded-xl transition-all ${
          winner === 'away' ? 'bg-primary/20 border-2 border-primary' : 'bg-secondary/50'
        }`}>
          <div className="text-2xl font-bold text-foreground mb-1">
            {awayGoals}
          </div>
          <div className="text-xs text-muted-foreground mb-2">{awayTeam}</div>
          <div className={`flex items-center justify-center gap-1 text-xs ${awayTrend.color}`}>
            <AwayTrendIcon className="w-3 h-3" />
            <span>{awayTrend.label}</span>
          </div>
        </div>
      </div>
      
      {/* Win probabilities bar */}
      <div className="mb-6">
        <div className="flex h-3 rounded-full overflow-hidden">
          <div 
            className="bg-success transition-all duration-700"
            style={{ width: `${prediction.homeWinPct}%` }}
          />
          <div 
            className="bg-warning transition-all duration-700"
            style={{ width: `${prediction.drawPct}%` }}
          />
          <div 
            className="bg-primary transition-all duration-700"
            style={{ width: `${prediction.awayWinPct}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>%{prediction.homeWinPct.toFixed(0)}</span>
          <span>%{prediction.drawPct.toFixed(0)}</span>
          <span>%{prediction.awayWinPct.toFixed(0)}</span>
        </div>
      </div>
      
      {/* Key stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-secondary/50 rounded-xl text-center">
          <Target className="w-4 h-4 text-primary mx-auto mb-1" />
          <div className="text-lg font-bold text-foreground">%{prediction.bttsPct.toFixed(0)}</div>
          <div className="text-xs text-muted-foreground">KG Var</div>
        </div>
        <div className="p-3 bg-secondary/50 rounded-xl text-center">
          <Zap className="w-4 h-4 text-warning mx-auto mb-1" />
          <div className="text-lg font-bold text-foreground">%{prediction.over25Pct.toFixed(0)}</div>
          <div className="text-xs text-muted-foreground">2.5 Üst</div>
        </div>
        <div className="p-3 bg-secondary/50 rounded-xl text-center">
          <Shield className="w-4 h-4 text-success mx-auto mb-1" />
          <div className="text-lg font-bold text-foreground">{prediction.confidence}</div>
          <div className="text-xs text-muted-foreground">Güven</div>
        </div>
      </div>
    </div>
  );
}
