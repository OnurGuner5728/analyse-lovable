import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { H2HData } from '@/lib/matchAnalyzer';

interface H2HChartProps {
  h2h: H2HData;
  homeTeamName: string;
  awayTeamName: string;
}

export const H2HChart = ({ h2h, homeTeamName, awayTeamName }: H2HChartProps) => {
  const team1Wins = h2h.team1?.wins || 0;
  const team2Wins = h2h.team2?.wins || 0;
  const draws = h2h.team1?.draws || 0;

  const pieData = [
    { name: homeTeamName, value: team1Wins, color: 'hsl(var(--success))' },
    { name: 'Beraberlik', value: draws, color: 'hsl(var(--warning))' },
    { name: awayTeamName, value: team2Wins, color: 'hsl(var(--primary))' },
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
  ];

  const recentMatches = (h2h.matches || []).slice(0, 6).map((match, idx) => {
    const [homeScore, awayScore] = (match.score || '0-0').split('–').map(s => parseInt(s) || 0);
    return {
      name: match.date?.split('-').slice(1).join('/') || `Maç ${idx + 1}`,
      [match.homeTeam]: homeScore,
      [match.awayTeam]: awayScore,
    };
  }).reverse();

  return (
    <div className="space-y-6">
      {/* Pie Chart - Win Distribution */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <h4 className="text-foreground font-semibold mb-4 text-sm">Galibiyet Dağılımı</h4>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart - Stats Comparison */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <h4 className="text-foreground font-semibold mb-4 text-sm">H2H İstatistikleri</h4>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <YAxis dataKey="name" type="category" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} width={80} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey={homeTeamName} fill="hsl(var(--success))" radius={[0, 4, 4, 0]} />
              <Bar dataKey={awayTeamName} fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Matches Score Chart */}
      {recentMatches.length > 0 && (
        <div className="bg-card rounded-xl p-4 border border-border">
          <h4 className="text-foreground font-semibold mb-4 text-sm">Son Karşılaşmalar</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recentMatches}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey={homeTeamName} fill="hsl(var(--success))" stackId="a" />
                <Bar dataKey={awayTeamName} fill="hsl(var(--primary))" stackId="b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
