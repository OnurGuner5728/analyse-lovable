import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { H2HData } from '@/lib/matchAnalyzer';

interface H2HChartProps {
  h2h: H2HData;
  homeTeamName: string;
  awayTeamName: string;
}

// Filter out today's matches and unplayed matches
const filterPlayedMatches = (matches: H2HData['matches']) => {
  if (!matches) return [];
  
  const today = new Date().toISOString().split('T')[0];
  
  return matches.filter(match => {
    // Exclude today's date
    if (match.date === today) return false;
    
    // Exclude matches with no score or 0-0 that might be future matches
    const score = match.score || '';
    if (!score || score === '–' || score === '-') return false;
    
    // Parse score to check if it's a valid played match
    const parts = score.split(/[–-]/);
    if (parts.length !== 2) return false;
    
    const homeScore = parseInt(parts[0]?.trim() || '0');
    const awayScore = parseInt(parts[1]?.trim() || '0');
    
    // If both scores are 0, check if the date is in the future
    if (homeScore === 0 && awayScore === 0) {
      const matchDate = new Date(match.date);
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      if (matchDate >= todayDate) return false;
    }
    
    return true;
  });
};

export const H2HChart = ({ h2h, homeTeamName, awayTeamName }: H2HChartProps) => {
  const team1Wins = h2h.team1?.wins || 0;
  const team2Wins = h2h.team2?.wins || 0;
  const draws = h2h.team1?.draws || 0;

  // Enhanced color palette with better contrast
  const COLORS = {
    home: '#10b981', // Emerald for home team
    away: '#3b82f6', // Blue for away team
    draw: '#f59e0b', // Amber for draws
    homeLight: 'rgba(16, 185, 129, 0.2)',
    awayLight: 'rgba(59, 130, 246, 0.2)',
  };

  const pieData = [
    { name: homeTeamName, value: team1Wins, color: COLORS.home },
    { name: 'Beraberlik', value: draws, color: COLORS.draw },
    { name: awayTeamName, value: team2Wins, color: COLORS.away },
  ].filter(d => d.value > 0);

  const barData = [
    {
      name: 'Galibiyet',
      [homeTeamName]: team1Wins,
      [awayTeamName]: team2Wins,
    },
    {
      name: 'Gol',
      [homeTeamName]: h2h.team1?.goals || 0,
      [awayTeamName]: h2h.team2?.goals || 0,
    },
    {
      name: 'Beraberlik',
      [homeTeamName]: draws,
      [awayTeamName]: draws,
    },
  ];

  // Filter and process recent matches (exclude today's and unplayed)
  const playedMatches = filterPlayedMatches(h2h.matches);
  
  const recentMatches = playedMatches.slice(0, 8).map((match, idx) => {
    const [homeScore, awayScore] = (match.score || '0-0').split(/[–-]/).map(s => parseInt(s?.trim() || '0') || 0);
    const dateFormatted = match.date ? new Date(match.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }) : `Maç ${idx + 1}`;
    
    return {
      name: dateFormatted,
      fullDate: match.date,
      [homeTeamName]: homeScore,
      [awayTeamName]: awayScore,
      total: homeScore + awayScore,
      winner: homeScore > awayScore ? homeTeamName : awayScore > homeScore ? awayTeamName : 'Berabere',
    };
  }).reverse();

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    
    return (
      <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-xl">
        <p className="text-foreground font-semibold text-sm mb-2">{label}</p>
        {payload.map((entry: any, idx: number) => (
          <p key={idx} className="text-xs flex items-center gap-2">
            <span 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-bold text-foreground">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  };

  // Custom legend
  const renderLegend = (value: string, entry: any) => (
    <span className="text-foreground text-xs font-medium ml-1">{value}</span>
  );

  // Calculate total played matches for accurate display
  const totalPlayedGames = team1Wins + team2Wins + draws;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-500/10 rounded-xl p-3 text-center border border-emerald-500/20">
          <div className="text-2xl font-bold text-emerald-400">{team1Wins}</div>
          <div className="text-xs text-emerald-400/80 truncate">{homeTeamName}</div>
        </div>
        <div className="bg-amber-500/10 rounded-xl p-3 text-center border border-amber-500/20">
          <div className="text-2xl font-bold text-amber-400">{draws}</div>
          <div className="text-xs text-amber-400/80">Beraberlik</div>
        </div>
        <div className="bg-blue-500/10 rounded-xl p-3 text-center border border-blue-500/20">
          <div className="text-2xl font-bold text-blue-400">{team2Wins}</div>
          <div className="text-xs text-blue-400/80 truncate">{awayTeamName}</div>
        </div>
      </div>

      {/* Pie Chart - Win Distribution */}
      <div className="bg-secondary/30 rounded-xl p-4 border border-border">
        <h4 className="text-foreground font-semibold mb-4 text-sm flex items-center justify-between">
          <span>Galibiyet Dağılımı</span>
          <span className="text-xs text-muted-foreground">({totalPlayedGames} maç)</span>
        </h4>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={2}
                stroke="hsl(var(--card))"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                formatter={renderLegend}
                wrapperStyle={{ paddingTop: 10 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Percentage labels */}
        <div className="flex justify-center gap-4 mt-2 text-xs">
          {pieData.map((item, idx) => (
            <div key={idx} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-muted-foreground">{item.name}:</span>
              <span className="text-foreground font-medium">
                {totalPlayedGames > 0 ? ((item.value / totalPlayedGames) * 100).toFixed(0) : 0}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bar Chart - Stats Comparison */}
      <div className="bg-secondary/30 rounded-xl p-4 border border-border">
        <h4 className="text-foreground font-semibold mb-4 text-sm">H2H İstatistik Karşılaştırması</h4>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} layout="vertical" barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis 
                type="number" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} 
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                dataKey="name" 
                type="category" 
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 11, fontWeight: 500 }} 
                width={75}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey={homeTeamName} 
                fill={COLORS.home} 
                radius={[0, 6, 6, 0]} 
                name={homeTeamName}
              />
              <Bar 
                dataKey={awayTeamName} 
                fill={COLORS.away} 
                radius={[0, 6, 6, 0]} 
                name={awayTeamName}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="flex justify-center gap-6 mt-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.home }} />
            <span className="text-foreground font-medium">{homeTeamName}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.away }} />
            <span className="text-foreground font-medium">{awayTeamName}</span>
          </div>
        </div>
      </div>

      {/* Recent Matches Score Chart */}
      {recentMatches.length > 0 && (
        <div className="bg-secondary/30 rounded-xl p-4 border border-border">
          <h4 className="text-foreground font-semibold mb-4 text-sm flex items-center justify-between">
            <span>Son Karşılaşmalar (Skorlar)</span>
            <span className="text-xs text-muted-foreground">{recentMatches.length} maç</span>
          </h4>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recentMatches} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey={homeTeamName} 
                  fill={COLORS.home} 
                  radius={[4, 4, 0, 0]}
                  name={homeTeamName}
                />
                <Bar 
                  dataKey={awayTeamName} 
                  fill={COLORS.away} 
                  radius={[4, 4, 0, 0]}
                  name={awayTeamName}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Match results summary */}
          <div className="mt-3 flex flex-wrap gap-2 justify-center">
            {recentMatches.map((match, idx) => {
              const homeVal = match[homeTeamName] as number;
              const awayVal = match[awayTeamName] as number;
              const isHomeWin = homeVal > awayVal;
              const isAwayWin = awayVal > homeVal;
              
              return (
                <div 
                  key={idx}
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    isHomeWin 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : isAwayWin 
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {homeVal}-{awayVal}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Goal Trend Line Chart */}
      {recentMatches.length >= 3 && (
        <div className="bg-secondary/30 rounded-xl p-4 border border-border">
          <h4 className="text-foreground font-semibold mb-4 text-sm">Gol Trendi</h4>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={recentMatches}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey={homeTeamName} 
                  stroke={COLORS.home} 
                  strokeWidth={2}
                  dot={{ fill: COLORS.home, strokeWidth: 2 }}
                  name={homeTeamName}
                />
                <Line 
                  type="monotone" 
                  dataKey={awayTeamName} 
                  stroke={COLORS.away} 
                  strokeWidth={2}
                  dot={{ fill: COLORS.away, strokeWidth: 2 }}
                  name={awayTeamName}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
