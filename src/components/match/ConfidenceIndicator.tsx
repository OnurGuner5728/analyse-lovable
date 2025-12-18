import { Shield, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';

interface ConfidenceIndicatorProps {
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
  dataQuality: number; // 0-100
  h2hGames: number;
  formReliability: number; // 0-100
}

export function ConfidenceIndicator({
  homeWinProb,
  drawProb,
  awayWinProb,
  dataQuality,
  h2hGames,
  formReliability,
}: ConfidenceIndicatorProps) {
  // Calculate overall confidence
  const maxProb = Math.max(homeWinProb, drawProb, awayWinProb);
  const predictionClarity = (maxProb - 33.3) * 1.5; // How clear is the prediction
  const h2hConfidence = Math.min(h2hGames * 10, 100);
  
  const overallConfidence = (
    dataQuality * 0.3 +
    predictionClarity * 0.3 +
    h2hConfidence * 0.2 +
    formReliability * 0.2
  );
  
  const getConfidenceLevel = (score: number) => {
    if (score >= 75) return { label: 'Yüksek', color: 'text-success', bg: 'bg-success', icon: CheckCircle };
    if (score >= 50) return { label: 'Orta', color: 'text-primary', bg: 'bg-primary', icon: TrendingUp };
    if (score >= 25) return { label: 'Düşük', color: 'text-warning', bg: 'bg-warning', icon: AlertCircle };
    return { label: 'Çok Düşük', color: 'text-destructive', bg: 'bg-destructive', icon: AlertCircle };
  };
  
  const confidence = getConfidenceLevel(overallConfidence);
  const Icon = confidence.icon;

  return (
    <div className="bg-card rounded-2xl p-6 border border-border">
      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <Shield className="w-5 h-5 text-primary" />
        Tahmin Güvenilirliği
      </h3>
      
      {/* Main confidence score */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="hsl(var(--secondary))"
              strokeWidth="12"
              fill="none"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke={`hsl(var(--${confidence.bg.replace('bg-', '')}))`}
              strokeWidth="12"
              fill="none"
              strokeDasharray={`${overallConfidence * 3.52} 352`}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Icon className={`w-6 h-6 ${confidence.color} mb-1`} />
            <span className={`text-2xl font-bold ${confidence.color}`}>
              {overallConfidence.toFixed(0)}%
            </span>
            <span className="text-xs text-muted-foreground">{confidence.label}</span>
          </div>
        </div>
      </div>
      
      {/* Individual factors */}
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Veri Kalitesi</span>
            <span className="text-foreground font-medium">{dataQuality.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-success transition-all duration-500"
              style={{ width: `${dataQuality}%` }}
            />
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Tahmin Netliği</span>
            <span className="text-foreground font-medium">{predictionClarity.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${Math.max(0, predictionClarity)}%` }}
            />
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">H2H Veri Miktarı</span>
            <span className="text-foreground font-medium">{h2hGames} maç</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-warning transition-all duration-500"
              style={{ width: `${h2hConfidence}%` }}
            />
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Form Güvenilirliği</span>
            <span className="text-foreground font-medium">{formReliability.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-success transition-all duration-500"
              style={{ width: `${formReliability}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Warning messages */}
      {overallConfidence < 50 && (
        <div className="mt-4 p-3 bg-warning/10 border border-warning/30 rounded-xl flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
          <p className="text-xs text-warning">
            Düşük güvenilirlik: Yeterli veri veya net bir trend bulunmuyor. Tahminlere dikkatli yaklaşın.
          </p>
        </div>
      )}
    </div>
  );
}
