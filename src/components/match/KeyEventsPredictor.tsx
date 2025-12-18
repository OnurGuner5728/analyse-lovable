import { useMemo } from 'react';
import { AlertTriangle, Flag, Square, Circle, Crosshair, Target } from 'lucide-react';

interface KeyEventsPredictorProps {
  homeStats: {
    avgGoalsFor: number;
    avgGoalsAgainst: number;
    bttsPct: number;
    over25Pct: number;
    ppg: number;
  };
  awayStats: {
    avgGoalsFor: number;
    avgGoalsAgainst: number;
    bttsPct: number;
    over25Pct: number;
    ppg: number;
  };
  homePlayerStats?: {
    totalYellowCards: number;
    totalRedCards: number;
    totalGoals: number;
    matchCount: number;
  };
  awayPlayerStats?: {
    totalYellowCards: number;
    totalRedCards: number;
    totalGoals: number;
    matchCount: number;
  };
  homeTeam: string;
  awayTeam: string;
}

export function KeyEventsPredictor({
  homeStats,
  awayStats,
  homePlayerStats,
  awayPlayerStats,
  homeTeam,
  awayTeam,
}: KeyEventsPredictorProps) {
  const predictions = useMemo(() => {
    // Calculate expected goals
    const homeXG = (homeStats.avgGoalsFor + awayStats.avgGoalsAgainst) / 2;
    const awayXG = (awayStats.avgGoalsFor + homeStats.avgGoalsAgainst) / 2;
    const totalXG = homeXG + awayXG;
    
    // Calculate card expectations
    const homeMatches = homePlayerStats?.matchCount || 10;
    const awayMatches = awayPlayerStats?.matchCount || 10;
    
    const homeYellowPerGame = homePlayerStats ? homePlayerStats.totalYellowCards / homeMatches : 1.5;
    const awayYellowPerGame = awayPlayerStats ? awayPlayerStats.totalYellowCards / awayMatches : 1.5;
    const totalYellowExpected = homeYellowPerGame + awayYellowPerGame;
    
    const homeRedPerGame = homePlayerStats ? homePlayerStats.totalRedCards / homeMatches : 0.1;
    const awayRedPerGame = awayPlayerStats ? awayPlayerStats.totalRedCards / awayMatches : 0.1;
    const redCardProb = Math.min((homeRedPerGame + awayRedPerGame) * 100, 40);
    
    // Penalty probability based on attack strength and card tendency
    const attackIntensity = (homeStats.avgGoalsFor + awayStats.avgGoalsFor) / 2;
    const penaltyProb = Math.min(15 + attackIntensity * 8 + totalYellowExpected * 2, 45);
    
    // Corner estimation (based on attacking and defensive balance)
    const homeCorners = 4 + homeStats.avgGoalsFor * 1.2;
    const awayCorners = 4 + awayStats.avgGoalsFor * 1.2;
    const totalCorners = homeCorners + awayCorners;
    
    // Shot estimation
    const homeShots = 8 + homeStats.avgGoalsFor * 3;
    const awayShots = 8 + awayStats.avgGoalsFor * 3;
    const homeShotsOnTarget = homeShots * 0.35;
    const awayShotsOnTarget = awayShots * 0.35;
    
    // Free kick goal probability
    const freeKickGoalProb = Math.min(5 + totalYellowExpected * 1.5, 18);
    
    // Own goal risk
    const ownGoalRisk = Math.min(3 + (totalXG * 0.8), 10);
    
    return {
      homeXG,
      awayXG,
      totalXG,
      homeYellowExpected: homeYellowPerGame,
      awayYellowExpected: awayYellowPerGame,
      totalYellowExpected,
      redCardProb,
      penaltyProb,
      homeCorners,
      awayCorners,
      totalCorners,
      homeShots,
      awayShots,
      homeShotsOnTarget,
      awayShotsOnTarget,
      freeKickGoalProb,
      ownGoalRisk,
    };
  }, [homeStats, awayStats, homePlayerStats, awayPlayerStats]);

  const EventRow = ({ 
    icon: Icon, 
    label, 
    homeValue, 
    awayValue, 
    unit = '',
    isPercentage = false 
  }: {
    icon: any;
    label: string;
    homeValue: number;
    awayValue: number;
    unit?: string;
    isPercentage?: boolean;
  }) => {
    const format = (v: number) => isPercentage ? `%${v.toFixed(0)}` : v.toFixed(1);
    const total = homeValue + awayValue;
    const homeWidth = (homeValue / total) * 100;
    
    return (
      <div className="py-3 border-b border-border/50 last:border-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Icon className="w-4 h-4" />
            <span className="text-sm">{label}</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-success font-medium">{format(homeValue)}{unit}</span>
            <span className="text-muted-foreground">|</span>
            <span className="text-primary font-medium">{format(awayValue)}{unit}</span>
          </div>
        </div>
        <div className="flex h-2 rounded-full overflow-hidden bg-secondary">
          <div 
            className="bg-success transition-all duration-500"
            style={{ width: `${homeWidth}%` }}
          />
          <div 
            className="bg-primary transition-all duration-500"
            style={{ width: `${100 - homeWidth}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="bg-card rounded-2xl p-6 border border-border">
      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <Target className="w-5 h-5 text-primary" />
        Key Event Tahminleri
      </h3>
      
      {/* Team comparison header */}
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-border">
        <span className="text-success font-semibold">{homeTeam}</span>
        <span className="text-muted-foreground text-sm">vs</span>
        <span className="text-primary font-semibold">{awayTeam}</span>
      </div>
      
      <div className="space-y-1">
        <EventRow 
          icon={Circle} 
          label="Beklenen Gol (xG)" 
          homeValue={predictions.homeXG} 
          awayValue={predictions.awayXG}
        />
        <EventRow 
          icon={Crosshair} 
          label="Toplam Şut" 
          homeValue={predictions.homeShots} 
          awayValue={predictions.awayShots}
        />
        <EventRow 
          icon={Target} 
          label="İsabetli Şut" 
          homeValue={predictions.homeShotsOnTarget} 
          awayValue={predictions.awayShotsOnTarget}
        />
        <EventRow 
          icon={Flag} 
          label="Korner" 
          homeValue={predictions.homeCorners} 
          awayValue={predictions.awayCorners}
        />
        <EventRow 
          icon={Square} 
          label="Sarı Kart" 
          homeValue={predictions.homeYellowExpected} 
          awayValue={predictions.awayYellowExpected}
        />
      </div>
      
      {/* Special events */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-center">
          <AlertTriangle className="w-5 h-5 text-destructive mx-auto mb-1" />
          <div className="text-lg font-bold text-destructive">%{predictions.redCardProb.toFixed(0)}</div>
          <div className="text-xs text-muted-foreground">Kırmızı Kart</div>
        </div>
        <div className="p-3 bg-primary/10 border border-primary/30 rounded-xl text-center">
          <Circle className="w-5 h-5 text-primary mx-auto mb-1" />
          <div className="text-lg font-bold text-primary">%{predictions.penaltyProb.toFixed(0)}</div>
          <div className="text-xs text-muted-foreground">Penaltı</div>
        </div>
        <div className="p-3 bg-success/10 border border-success/30 rounded-xl text-center">
          <Crosshair className="w-5 h-5 text-success mx-auto mb-1" />
          <div className="text-lg font-bold text-success">%{predictions.freeKickGoalProb.toFixed(0)}</div>
          <div className="text-xs text-muted-foreground">Frikik Golü</div>
        </div>
        <div className="p-3 bg-warning/10 border border-warning/30 rounded-xl text-center">
          <AlertTriangle className="w-5 h-5 text-warning mx-auto mb-1" />
          <div className="text-lg font-bold text-warning">%{predictions.ownGoalRisk.toFixed(0)}</div>
          <div className="text-xs text-muted-foreground">Kendi Kalesine</div>
        </div>
      </div>
      
      {/* Summary */}
      <div className="mt-6 p-4 bg-secondary/50 rounded-xl">
        <div className="text-sm text-muted-foreground mb-2">Maç Özeti Tahmini</div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xl font-bold text-foreground">{predictions.totalXG.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground">Toplam xG</div>
          </div>
          <div>
            <div className="text-xl font-bold text-foreground">{predictions.totalCorners.toFixed(0)}</div>
            <div className="text-xs text-muted-foreground">Toplam Korner</div>
          </div>
          <div>
            <div className="text-xl font-bold text-foreground">{predictions.totalYellowExpected.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground">Toplam Sarı</div>
          </div>
        </div>
      </div>
    </div>
  );
}
