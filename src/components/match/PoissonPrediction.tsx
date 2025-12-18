import { useMemo } from 'react';
import { Target, TrendingUp, Percent, Calculator } from 'lucide-react';

interface PoissonPredictionProps {
  homeExpectedGoals: number;
  awayExpectedGoals: number;
  homeTeam: string;
  awayTeam: string;
}

// Poisson probability calculation
function poissonProbability(lambda: number, k: number): number {
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

function factorial(n: number): number {
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

export function PoissonPrediction({ 
  homeExpectedGoals, 
  awayExpectedGoals, 
  homeTeam, 
  awayTeam 
}: PoissonPredictionProps) {
  const predictions = useMemo(() => {
    const maxGoals = 6;
    const scoreProbs: { score: string; prob: number }[] = [];
    
    let homeWin = 0;
    let draw = 0;
    let awayWin = 0;
    let btts = 0;
    let over25 = 0;
    let over15 = 0;
    let under25 = 0;
    
    for (let h = 0; h <= maxGoals; h++) {
      for (let a = 0; a <= maxGoals; a++) {
        const probH = poissonProbability(homeExpectedGoals, h);
        const probA = poissonProbability(awayExpectedGoals, a);
        const prob = probH * probA;
        
        scoreProbs.push({ score: `${h}-${a}`, prob });
        
        if (h > a) homeWin += prob;
        else if (h < a) awayWin += prob;
        else draw += prob;
        
        if (h > 0 && a > 0) btts += prob;
        if (h + a > 2.5) over25 += prob;
        if (h + a > 1.5) over15 += prob;
        if (h + a < 2.5) under25 += prob;
      }
    }
    
    // Sort by probability and get top 5
    const topScores = scoreProbs
      .sort((a, b) => b.prob - a.prob)
      .slice(0, 5);
    
    return {
      homeWin: homeWin * 100,
      draw: draw * 100,
      awayWin: awayWin * 100,
      btts: btts * 100,
      over25: over25 * 100,
      over15: over15 * 100,
      under25: under25 * 100,
      topScores,
      expectedTotalGoals: homeExpectedGoals + awayExpectedGoals,
    };
  }, [homeExpectedGoals, awayExpectedGoals]);

  return (
    <div className="bg-card rounded-2xl p-6 border border-border">
      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <Calculator className="w-5 h-5 text-primary" />
        Poisson Model Tahminleri
      </h3>
      
      {/* Expected Goals */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-secondary/50 rounded-xl">
          <div className="text-2xl font-bold text-foreground">{homeExpectedGoals.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground mt-1">xG {homeTeam}</div>
        </div>
        <div className="text-center p-4 bg-primary/20 rounded-xl">
          <div className="text-2xl font-bold text-primary">{predictions.expectedTotalGoals.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground mt-1">Toplam xG</div>
        </div>
        <div className="text-center p-4 bg-secondary/50 rounded-xl">
          <div className="text-2xl font-bold text-foreground">{awayExpectedGoals.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground mt-1">xG {awayTeam}</div>
        </div>
      </div>
      
      {/* Match Outcome Probabilities */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
          <Target className="w-4 h-4" />
          Maç Sonucu Olasılıkları
        </h4>
        <div className="flex gap-2 h-8 rounded-lg overflow-hidden">
          <div 
            className="bg-success flex items-center justify-center text-xs font-bold text-white transition-all"
            style={{ width: `${predictions.homeWin}%` }}
          >
            {predictions.homeWin > 15 && `${predictions.homeWin.toFixed(1)}%`}
          </div>
          <div 
            className="bg-warning flex items-center justify-center text-xs font-bold text-black transition-all"
            style={{ width: `${predictions.draw}%` }}
          >
            {predictions.draw > 15 && `${predictions.draw.toFixed(1)}%`}
          </div>
          <div 
            className="bg-destructive flex items-center justify-center text-xs font-bold text-white transition-all"
            style={{ width: `${predictions.awayWin}%` }}
          >
            {predictions.awayWin > 15 && `${predictions.awayWin.toFixed(1)}%`}
          </div>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>{homeTeam} Kazanır</span>
          <span>Beraberlik</span>
          <span>{awayTeam} Kazanır</span>
        </div>
      </div>
      
      {/* Top Predicted Scores */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          En Olası Skorlar
        </h4>
        <div className="grid grid-cols-5 gap-2">
          {predictions.topScores.map((item, index) => (
            <div 
              key={item.score}
              className={`text-center p-3 rounded-xl transition-all ${
                index === 0 
                  ? 'bg-primary/20 border-2 border-primary' 
                  : 'bg-secondary/50 border border-border'
              }`}
            >
              <div className={`text-lg font-bold ${index === 0 ? 'text-primary' : 'text-foreground'}`}>
                {item.score}
              </div>
              <div className="text-xs text-muted-foreground">
                %{(item.prob * 100).toFixed(1)}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Market Probabilities */}
      <div>
        <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
          <Percent className="w-4 h-4" />
          Bahis Piyasası Tahminleri
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-secondary/50 rounded-xl text-center">
            <div className="text-lg font-bold text-foreground">%{predictions.over25.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground">2.5 Üst</div>
          </div>
          <div className="p-3 bg-secondary/50 rounded-xl text-center">
            <div className="text-lg font-bold text-foreground">%{predictions.under25.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground">2.5 Alt</div>
          </div>
          <div className="p-3 bg-secondary/50 rounded-xl text-center">
            <div className="text-lg font-bold text-foreground">%{predictions.btts.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground">KG Var</div>
          </div>
          <div className="p-3 bg-secondary/50 rounded-xl text-center">
            <div className="text-lg font-bold text-foreground">%{predictions.over15.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground">1.5 Üst</div>
          </div>
        </div>
      </div>
    </div>
  );
}
