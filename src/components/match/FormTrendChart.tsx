import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

interface FormTrendChartProps {
  homeForm: string[];
  awayForm: string[];
  homeTeam: string;
  awayTeam: string;
}

export function FormTrendChart({ homeForm, awayForm, homeTeam, awayTeam }: FormTrendChartProps) {
  const data = useMemo(() => {
    const getPointValue = (result: string) => {
      if (result === 'W') return 3;
      if (result === 'D') return 1;
      return 0;
    };
    
    const maxLength = Math.max(homeForm.length, awayForm.length, 5);
    const chartData = [];
    
    let homeCumulative = 0;
    let awayCumulative = 0;
    
    for (let i = 0; i < maxLength; i++) {
      const homeResult = homeForm[i] || null;
      const awayResult = awayForm[i] || null;
      
      if (homeResult) homeCumulative += getPointValue(homeResult);
      if (awayResult) awayCumulative += getPointValue(awayResult);
      
      chartData.push({
        match: `M${i + 1}`,
        home: homeResult ? homeCumulative : null,
        away: awayResult ? awayCumulative : null,
        homeResult,
        awayResult,
      });
    }
    
    return chartData;
  }, [homeForm, awayForm]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => {
            const result = index === 0 ? payload[0].payload.homeResult : payload[0].payload.awayResult;
            const resultColor = result === 'W' ? 'text-success' : result === 'D' ? 'text-warning' : 'text-destructive';
            return (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-muted-foreground">{entry.name}:</span>
                <span className="font-medium text-foreground">{entry.value} puan</span>
                {result && (
                  <span className={`font-bold ${resultColor}`}>({result})</span>
                )}
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card rounded-2xl p-6 border border-border">
      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-primary" />
        Form Trend Analizi
      </h3>
      
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="hsl(var(--border))"
            strokeOpacity={0.5}
          />
          <XAxis 
            dataKey="match" 
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
          />
          <YAxis 
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            label={{ 
              value: 'Kümülatif Puan', 
              angle: -90, 
              position: 'insideLeft',
              style: { fill: 'hsl(var(--muted-foreground))', fontSize: 11 }
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '10px' }}
          />
          <ReferenceLine 
            y={0} 
            stroke="hsl(var(--border))" 
            strokeDasharray="3 3" 
          />
          <Line
            type="monotone"
            dataKey="home"
            name={homeTeam}
            stroke="hsl(160 84% 39%)"
            strokeWidth={3}
            dot={{ fill: 'hsl(160 84% 39%)', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: 'hsl(160 84% 39%)', strokeWidth: 2 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="away"
            name={awayTeam}
            stroke="hsl(38 92% 50%)"
            strokeWidth={3}
            dot={{ fill: 'hsl(38 92% 50%)', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: 'hsl(38 92% 50%)', strokeWidth: 2 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
      
      {/* Form summary */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="p-3 bg-success/10 border border-success/30 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-sm font-medium text-foreground">{homeTeam}</span>
          </div>
          <div className="flex gap-1">
            {homeForm.slice(-5).map((r, i) => (
              <span 
                key={i}
                className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                  r === 'W' ? 'bg-success text-white' :
                  r === 'D' ? 'bg-warning text-black' :
                  'bg-destructive text-white'
                }`}
              >
                {r}
              </span>
            ))}
          </div>
        </div>
        <div className="p-3 bg-primary/10 border border-primary/30 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-sm font-medium text-foreground">{awayTeam}</span>
          </div>
          <div className="flex gap-1">
            {awayForm.slice(-5).map((r, i) => (
              <span 
                key={i}
                className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                  r === 'W' ? 'bg-success text-white' :
                  r === 'D' ? 'bg-warning text-black' :
                  'bg-destructive text-white'
                }`}
              >
                {r}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
