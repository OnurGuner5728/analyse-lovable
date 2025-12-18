import { useMemo } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Radar as RadarIcon } from 'lucide-react';

interface TeamStats {
  ppg: number;
  avgGoalsFor: number;
  avgGoalsAgainst: number;
  cleanSheetPct: number;
  bttsPct: number;
  over25Pct: number;
}

interface TeamRadarChartProps {
  homeStats: TeamStats;
  awayStats: TeamStats;
  homeTeam: string;
  awayTeam: string;
}

export function TeamRadarChart({ homeStats, awayStats, homeTeam, awayTeam }: TeamRadarChartProps) {
  const data = useMemo(() => {
    // Normalize values to 0-100 scale for better visualization
    const normalize = (value: number, max: number) => Math.min((value / max) * 100, 100);
    
    return [
      {
        subject: 'Saldırı',
        home: normalize(homeStats.avgGoalsFor, 3),
        away: normalize(awayStats.avgGoalsFor, 3),
        fullMark: 100,
      },
      {
        subject: 'Savunma',
        home: 100 - normalize(homeStats.avgGoalsAgainst, 3),
        away: 100 - normalize(awayStats.avgGoalsAgainst, 3),
        fullMark: 100,
      },
      {
        subject: 'Clean Sheet',
        home: homeStats.cleanSheetPct,
        away: awayStats.cleanSheetPct,
        fullMark: 100,
      },
      {
        subject: 'Maç Başı Puan',
        home: normalize(homeStats.ppg, 3),
        away: normalize(awayStats.ppg, 3),
        fullMark: 100,
      },
      {
        subject: 'Gollü Maç',
        home: homeStats.over25Pct,
        away: awayStats.over25Pct,
        fullMark: 100,
      },
      {
        subject: 'Her İki Takım Gol',
        home: homeStats.bttsPct,
        away: awayStats.bttsPct,
        fullMark: 100,
      },
    ];
  }, [homeStats, awayStats]);

  return (
    <div className="bg-card rounded-2xl p-6 border border-border">
      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <RadarIcon className="w-5 h-5 text-primary" />
        Takım Karşılaştırma Radarı
      </h3>
      
      <ResponsiveContainer width="100%" height={350}>
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid 
            stroke="hsl(var(--border))" 
            strokeOpacity={0.5}
          />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 100]} 
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
            tickCount={5}
          />
          <Radar
            name={homeTeam}
            dataKey="home"
            stroke="hsl(160 84% 39%)"
            fill="hsl(160 84% 39%)"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Radar
            name={awayTeam}
            dataKey="away"
            stroke="hsl(38 92% 50%)"
            fill="hsl(38 92% 50%)"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Legend 
            wrapperStyle={{ 
              paddingTop: '20px',
              fontSize: '12px',
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              color: 'hsl(var(--foreground))',
            }}
            formatter={(value: number) => [`${value.toFixed(1)}`, '']}
          />
        </RadarChart>
      </ResponsiveContainer>
      
      {/* Legend explanation */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-success" />
          <span>{homeTeam}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span>{awayTeam}</span>
        </div>
      </div>
    </div>
  );
}
