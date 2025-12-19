import { useState, useMemo } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Database, Search, Eye, BarChart3, Trophy, Target, Shield,
  Activity, Zap, CheckCircle, XCircle, Loader2, Calendar, MapPin, Filter
} from 'lucide-react';
import {
  DatabaseRecord, ParsedMatchRecord, TeamInfo, TeamStats, Prediction, NewsItem, H2HData,
  parseMatchData, calculateTeamStats, calculatePrediction, getTopScorers, fetchNews, parseNum
} from '@/lib/matchAnalyzer';
import { FormBadge } from '@/components/match/FormBadge';
import { StatCard } from '@/components/match/StatCard';
import { LoadingSpinner } from '@/components/match/LoadingSpinner';
import { H2HChart } from '@/components/match/H2HChart';
import { PlayerComparison } from '@/components/match/PlayerComparison';
import { ManagerComparison } from '@/components/match/ManagerComparison';
import { AIAnalysis } from '@/components/match/AIAnalysis';
import { PoissonPrediction } from '@/components/match/PoissonPrediction';
import { TeamRadarChart } from '@/components/match/TeamRadarChart';
import { KeyEventsPredictor } from '@/components/match/KeyEventsPredictor';
import { ConfidenceIndicator } from '@/components/match/ConfidenceIndicator';
import { FormTrendChart } from '@/components/match/FormTrendChart';
import { ExportReport } from '@/components/match/ExportReport';
import { LiveNewsFeed } from '@/components/match/LiveNewsFeed';
import { MatchSummaryCard } from '@/components/match/MatchSummaryCard';

const DEFAULT_URL = 'https://tmauayspvhfabrfmnpbi.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtYXVheXNwdmhmYWJyZm1ucGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NTcxMTcsImV4cCI6MjA4MDUzMzExN30.XZwbAaNRznFN4lQ5asIv84Shu5TspczIGRyLgRUSgj4';

const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export default function MatchAnalyzer() {
  const [activeTab, setActiveTab] = useState('setup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Supabase
  const [supabaseUrl, setSupabaseUrl] = useState(DEFAULT_URL);
  const [supabaseKey, setSupabaseKey] = useState(DEFAULT_KEY);
  const [isConnected, setIsConnected] = useState(false);
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(null);

  // Matches
  const [matches, setMatches] = useState<ParsedMatchRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMatch, setSelectedMatch] = useState<ParsedMatchRecord | null>(null);
  const [dateFilter, setDateFilter] = useState(getTodayDate());

  // Analysis
  const [homeTeam, setHomeTeam] = useState<TeamInfo | null>(null);
  const [awayTeam, setAwayTeam] = useState<TeamInfo | null>(null);
  const [h2h, setH2h] = useState<H2HData | null>(null);
  const [homeStats, setHomeStats] = useState<TeamStats | null>(null);
  const [awayStats, setAwayStats] = useState<TeamStats | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);

  // News
  const [matchNews, setMatchNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);

  const connectSupabase = async () => {
    if (!supabaseUrl || !supabaseKey) {
      setError('Supabase URL ve Key gerekli');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const client = createClient(supabaseUrl, supabaseKey);

      const { data, error: fetchError } = await client
        .from('team_details_cache')
        .select('id, team_url, data, updated_at')
        .order('updated_at', { ascending: false })
        .limit(500);

      if (fetchError) throw fetchError;

      const parsedMatches = (data as DatabaseRecord[] || [])
        .map(record => parseMatchData(record))
        .filter((m): m is ParsedMatchRecord => m !== null);

      setSupabaseClient(client);
      setMatches(parsedMatches);
      setIsConnected(true);
      setActiveTab('matches');
    } catch (err) {
      setError('Bağlantı hatası: ' + (err instanceof Error ? err.message : 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  };

  const analyzeMatch = (match: ParsedMatchRecord) => {
    setSelectedMatch(match);
    
    const home = match.data.homeTeam || match.data.awayTeam;
    const away = match.data.awayTeam || match.data.homeTeam;
    
    setHomeTeam(home || null);
    setAwayTeam(away || null);
    setH2h(match.data.h2h || null);

    const hStats = calculateTeamStats(home);
    const aStats = calculateTeamStats(away);
    setHomeStats(hStats);
    setAwayStats(aStats);

    const pred = calculatePrediction(hStats, aStats, match.data.h2h);
    setPrediction(pred);

    setActiveTab('overview');

    // Load news
    setNewsLoading(true);
    fetchNews(match.homeTeamName, match.awayTeamName)
      .then(news => setMatchNews(news))
      .finally(() => setNewsLoading(false));
  };

  const filteredMatches = useMemo(() => {
    return matches.filter(match => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = match.homeTeamName.toLowerCase().includes(searchLower) ||
             match.awayTeamName.toLowerCase().includes(searchLower);
      
      // Date filter
      const matchDate = match.data.h2h?.matches?.[0]?.date;
      const matchesDate = !dateFilter || !matchDate || matchDate === dateFilter;
      
      return matchesSearch && matchesDate;
    });
  }, [matches, searchQuery, dateFilter]);

  // Get unique dates from matches
  const availableDates = useMemo(() => {
    const dates = new Set<string>();
    matches.forEach(match => {
      const date = match.data.h2h?.matches?.[0]?.date;
      if (date) dates.add(date);
    });
    return Array.from(dates).sort().reverse();
  }, [matches]);

  const renderSetup = () => (
    <div className="max-w-xl mx-auto space-y-6 animate-slide-up">
      <div className="bg-card rounded-2xl p-6 border border-border shadow-lg">
        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          Supabase Bağlantısı
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-muted-foreground text-sm mb-2">Supabase URL</label>
            <input
              type="text"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://your-project.supabase.co"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-muted-foreground text-sm mb-2">Anon Key</label>
            <input
              type="password"
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIs..."
              className="input-field"
            />
          </div>

          <button
            onClick={connectSupabase}
            disabled={loading || !supabaseUrl || !supabaseKey}
            className="btn-primary"
          >
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Bağlanıyor...</> : <><Database className="w-5 h-5" /> Bağlan</>}
          </button>
        </div>

        {isConnected && (
          <div className="mt-4 p-3 bg-success/10 border border-success/30 rounded-xl flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-success" />
            <span className="text-success">Bağlantı başarılı! {matches.length} maç bulundu.</span>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-xl flex items-center gap-2">
            <XCircle className="w-5 h-5 text-destructive" />
            <span className="text-destructive">{error}</span>
          </div>
        )}
      </div>
    </div>
  );

  const renderMatchSelection = () => (
    <div className="space-y-6 animate-slide-up">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Takım veya maç ara..."
            className="input-field pl-12"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="input-field w-48"
          />
          {dateFilter && (
            <button 
              onClick={() => setDateFilter('')}
              className="px-3 py-2 text-sm bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors"
            >
              Tümü
            </button>
          )}
        </div>
      </div>

      {/* Quick Date Buttons */}
      {availableDates.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setDateFilter(getTodayDate())}
            className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
              dateFilter === getTodayDate() 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
            }`}
          >
            Bugün
          </button>
          {availableDates.slice(0, 7).map(date => (
            <button
              key={date}
              onClick={() => setDateFilter(date)}
              className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                dateFilter === date 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
              }`}
            >
              {new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
            </button>
          ))}
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-secondary/30">
          <h3 className="text-foreground font-semibold">
            Maçlar ({filteredMatches.length})
            {dateFilter && <span className="text-muted-foreground text-sm ml-2">• {dateFilter}</span>}
          </h3>
        </div>
        <div className="max-h-[600px] overflow-y-auto">
          {filteredMatches.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {dateFilter 
                ? `${dateFilter} tarihinde maç bulunamadı` 
                : 'Maç bulunamadı'}
            </div>
          ) : (
            filteredMatches.map((match) => {
              const matchDate = match.data.h2h?.matches?.[0]?.date;
              const venue = match.data.h2h?.matches?.[0]?.venue;
              
              return (
                <div 
                  key={match.id} 
                  className="p-4 border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer"
                  onClick={() => analyzeMatch(match)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center font-bold text-foreground text-sm">
                        {match.homeTeamName.substring(0, 3).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-foreground">{match.homeTeamName}</div>
                        <div className="text-xs text-muted-foreground">
                          {match.data.homeTeam?.league || match.data.awayTeam?.league || 'Lig Bilinmiyor'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="px-4 text-center">
                      <div className="text-lg font-bold text-primary">VS</div>
                    </div>
                    
                    <div className="flex items-center gap-3 flex-1 justify-end text-right">
                      <div className="flex-1">
                        <div className="font-semibold text-foreground">{match.awayTeamName}</div>
                        <div className="text-xs text-muted-foreground">
                          {match.data.awayTeam?.points || match.data.homeTeam?.points || '0'} puan
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center font-bold text-primary text-sm">
                        {match.awayTeamName.substring(0, 3).toUpperCase()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                    {matchDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {matchDate}
                      </span>
                    )}
                    {venue && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {venue}
                      </span>
                    )}
                    {match.data.h2h?.totalGames && (
                      <span className="text-primary font-medium">
                        {match.data.h2h.totalGames} karşılaşma geçmişi
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );

  const renderOverview = () => {
    if (!selectedMatch) return <LoadingSpinner />;

    return (
      <div className="space-y-6 animate-slide-up">
        {/* Match Header */}
        <div className="bg-gradient-to-br from-card via-secondary/50 to-background rounded-2xl p-8 border border-border shadow-xl">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Trophy className="w-5 h-5 text-primary" />
            <span className="text-primary font-medium">
              {homeTeam?.league || awayTeam?.league || 'Match Analysis'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-secondary to-card flex items-center justify-center border border-border shadow-lg">
                <span className="text-xl font-black text-foreground">
                  {selectedMatch.homeTeamName.substring(0, 3).toUpperCase()}
                </span>
              </div>
              <h2 className="text-xl font-bold text-foreground mb-1">{selectedMatch.homeTeamName}</h2>
              <p className="text-muted-foreground text-sm">
                Ev Sahibi • {homeTeam?.points || '0'} Puan
              </p>
            </div>

            <div className="px-8 text-center">
              <div className="text-4xl font-black text-gradient">VS</div>
              <div className="mt-2 text-muted-foreground text-sm">
                {homeTeam?.manager || '-'} vs {awayTeam?.manager || '-'}
              </div>
            </div>

            <div className="flex-1 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/30 shadow-lg">
                <span className="text-xl font-black text-foreground">
                  {selectedMatch.awayTeamName.substring(0, 3).toUpperCase()}
                </span>
              </div>
              <h2 className="text-xl font-bold text-foreground mb-1">{selectedMatch.awayTeamName}</h2>
              <p className="text-muted-foreground text-sm">
                Deplasman • {awayTeam?.points || '0'} Puan
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard 
            label="Form (Son 5)" 
            value={`${homeStats?.form.points || 0} - ${awayStats?.form.points || 0}`} 
            icon={Activity} 
          />
          <StatCard 
            label="Gol Ortalaması" 
            value={`${homeStats?.avgGoalsFor || '0'} - ${awayStats?.avgGoalsFor || '0'}`} 
            icon={Target} 
          />
          <StatCard 
            label="Maç Başı Puan" 
            value={`${homeStats?.ppg || '0'} - ${awayStats?.ppg || '0'}`} 
            icon={BarChart3} 
          />
          <StatCard 
            label="Clean Sheet %" 
            value={`${homeStats?.cleanSheetPct || '0'} - ${awayStats?.cleanSheetPct || '0'}`} 
            icon={Shield} 
          />
        </div>

        {/* Form */}
        {(homeStats?.form.last10.length || awayStats?.form.last10.length) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card rounded-2xl p-5 border border-border">
              <h3 className="text-foreground font-semibold mb-3">{selectedMatch.homeTeamName} - Son Form</h3>
              <div className="flex gap-2 mb-3 flex-wrap">
                {(homeStats?.form.last10 || []).slice(-7).map((r, i) => <FormBadge key={i} result={r} />)}
              </div>
              {homeStats?.currentStreak.type && (
                <div className="text-sm text-muted-foreground">
                  Seri: <span className={homeStats.currentStreak.type === 'W' ? 'text-success' : homeStats.currentStreak.type === 'L' ? 'text-destructive' : 'text-warning'}>
                    {homeStats.currentStreak.count} {homeStats.currentStreak.type === 'W' ? 'Galibiyet' : homeStats.currentStreak.type === 'L' ? 'Mağlubiyet' : 'Beraberlik'}
                  </span>
                </div>
              )}
            </div>

            <div className="bg-card rounded-2xl p-5 border border-border">
              <h3 className="text-foreground font-semibold mb-3">{selectedMatch.awayTeamName} - Son Form</h3>
              <div className="flex gap-2 mb-3 flex-wrap">
                {(awayStats?.form.last10 || []).slice(-7).map((r, i) => <FormBadge key={i} result={r} />)}
              </div>
              {awayStats?.currentStreak.type && (
                <div className="text-sm text-muted-foreground">
                  Seri: <span className={awayStats.currentStreak.type === 'W' ? 'text-success' : awayStats.currentStreak.type === 'L' ? 'text-destructive' : 'text-warning'}>
                    {awayStats.currentStreak.count} {awayStats.currentStreak.type === 'W' ? 'Galibiyet' : awayStats.currentStreak.type === 'L' ? 'Mağlubiyet' : 'Beraberlik'}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* H2H Charts */}
        {h2h && h2h.matches && h2h.matches.length > 0 && (
          <div className="bg-card rounded-2xl p-6 border border-border">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              H2H Grafikleri ({h2h.totalGames || h2h.matches.length} maç)
            </h3>
            <H2HChart 
              h2h={h2h} 
              homeTeamName={selectedMatch.homeTeamName} 
              awayTeamName={selectedMatch.awayTeamName} 
            />
          </div>
        )}

        {/* Prediction */}
        {prediction && (
          <div className="bg-gradient-to-r from-primary/10 via-card to-card rounded-2xl p-6 border border-primary/20 shadow-lg">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              İstatistiksel Tahmin
              <span className={`ml-auto text-xs px-2 py-1 rounded-full ${
                prediction.confidence === 'high' ? 'bg-success/20 text-success' :
                prediction.confidence === 'medium' ? 'bg-warning/20 text-warning' :
                'bg-muted text-muted-foreground'
              }`}>
                {prediction.confidence === 'high' ? 'Yüksek Güven' : 
                 prediction.confidence === 'medium' ? 'Orta Güven' : 'Düşük Güven'}
              </span>
            </h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-secondary/50 rounded-xl p-4 text-center border border-border">
                <div className="text-sm text-muted-foreground mb-1">{selectedMatch.homeTeamName}</div>
                <div className="text-2xl font-bold text-foreground">{prediction.homeWinPct}%</div>
              </div>
              <div className="bg-secondary/50 rounded-xl p-4 text-center border border-border">
                <div className="text-sm text-muted-foreground mb-1">Beraberlik</div>
                <div className="text-2xl font-bold text-warning">{prediction.drawPct}%</div>
              </div>
              <div className="bg-primary/10 rounded-xl p-4 text-center border border-primary/30">
                <div className="text-sm text-primary mb-1">{selectedMatch.awayTeamName}</div>
                <div className="text-2xl font-bold text-primary">{prediction.awayWinPct}%</div>
              </div>
            </div>
            <div className="h-3 bg-secondary rounded-full overflow-hidden flex">
              <div className="bg-foreground h-full transition-all duration-500" style={{ width: `${prediction.homeWinPct}%` }} />
              <div className="bg-warning h-full transition-all duration-500" style={{ width: `${prediction.drawPct}%` }} />
              <div className="bg-primary h-full transition-all duration-500" style={{ width: `${prediction.awayWinPct}%` }} />
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 text-center text-sm">
              <div><span className="text-muted-foreground">BTTS:</span> <span className="text-foreground font-medium">{prediction.bttsPct}%</span></div>
              <div><span className="text-muted-foreground">2.5Ü:</span> <span className="text-foreground font-medium">{prediction.over25Pct}%</span></div>
              <div><span className="text-muted-foreground">Beklenen:</span> <span className="text-foreground font-medium">{prediction.expectedHomeGoals}-{prediction.expectedAwayGoals}</span></div>
            </div>
          </div>
        )}

        {/* Match Summary Card */}
        {prediction && homeStats && awayStats && (
          <MatchSummaryCard
            homeTeam={selectedMatch.homeTeamName}
            awayTeam={selectedMatch.awayTeamName}
            prediction={{
              homeWinPct: parseFloat(prediction.homeWinPct),
              drawPct: parseFloat(prediction.drawPct),
              awayWinPct: parseFloat(prediction.awayWinPct),
              expectedScore: `${prediction.expectedHomeGoals}-${prediction.expectedAwayGoals}`,
              bttsPct: parseFloat(prediction.bttsPct),
              over25Pct: parseFloat(prediction.over25Pct),
              confidence: prediction.confidence,
            }}
            homeStats={{
              ppg: parseFloat(homeStats.ppg),
              avgGoalsFor: parseFloat(homeStats.avgGoalsFor),
              avgGoalsAgainst: parseFloat(homeStats.avgGoalsAgainst),
              form: { points: homeStats.form.points },
            }}
            awayStats={{
              ppg: parseFloat(awayStats.ppg),
              avgGoalsFor: parseFloat(awayStats.avgGoalsFor),
              avgGoalsAgainst: parseFloat(awayStats.avgGoalsAgainst),
              form: { points: awayStats.form.points },
            }}
          />
        )}

        {/* Poisson Statistical Prediction */}
        {homeStats && awayStats && (
          <PoissonPrediction
            homeExpectedGoals={parseFloat(homeStats.avgGoalsFor)}
            awayExpectedGoals={parseFloat(awayStats.avgGoalsFor)}
            homeTeam={selectedMatch.homeTeamName}
            awayTeam={selectedMatch.awayTeamName}
          />
        )}

        {/* Key Events Predictor */}
        {homeStats && awayStats && (
          <KeyEventsPredictor
            homeStats={{
              avgGoalsFor: parseFloat(homeStats.avgGoalsFor),
              avgGoalsAgainst: parseFloat(homeStats.avgGoalsAgainst),
              bttsPct: parseFloat(homeStats.bttsPct),
              over25Pct: parseFloat(homeStats.over25Pct),
              ppg: parseFloat(homeStats.ppg),
            }}
            awayStats={{
              avgGoalsFor: parseFloat(awayStats.avgGoalsFor),
              avgGoalsAgainst: parseFloat(awayStats.avgGoalsAgainst),
              bttsPct: parseFloat(awayStats.bttsPct),
              over25Pct: parseFloat(awayStats.over25Pct),
              ppg: parseFloat(awayStats.ppg),
            }}
            homeTeam={selectedMatch.homeTeamName}
            awayTeam={selectedMatch.awayTeamName}
          />
        )}

        {/* Confidence Indicator */}
        {prediction && homeStats && awayStats && (
          <ConfidenceIndicator
            homeWinProb={parseFloat(prediction.homeWinPct)}
            drawProb={parseFloat(prediction.drawPct)}
            awayWinProb={parseFloat(prediction.awayWinPct)}
            dataQuality={Math.min(100, (homeStats.total.matches + awayStats.total.matches) * 5)}
            h2hGames={h2h?.totalGames || 0}
            formReliability={Math.min(100, ((homeStats.form.last10.length + awayStats.form.last10.length) / 2) * 10)}
          />
        )}

        {/* Team Radar Chart */}
        {homeStats && awayStats && (
          <TeamRadarChart
            homeStats={{
              ppg: parseFloat(homeStats.ppg),
              avgGoalsFor: parseFloat(homeStats.avgGoalsFor),
              avgGoalsAgainst: parseFloat(homeStats.avgGoalsAgainst),
              cleanSheetPct: parseFloat(homeStats.cleanSheetPct),
              bttsPct: parseFloat(homeStats.bttsPct),
              over25Pct: parseFloat(homeStats.over25Pct),
            }}
            awayStats={{
              ppg: parseFloat(awayStats.ppg),
              avgGoalsFor: parseFloat(awayStats.avgGoalsFor),
              avgGoalsAgainst: parseFloat(awayStats.avgGoalsAgainst),
              cleanSheetPct: parseFloat(awayStats.cleanSheetPct),
              bttsPct: parseFloat(awayStats.bttsPct),
              over25Pct: parseFloat(awayStats.over25Pct),
            }}
            homeTeam={selectedMatch.homeTeamName}
            awayTeam={selectedMatch.awayTeamName}
          />
        )}

        {/* Form Trend Chart */}
        {(homeStats?.form.last10.length || awayStats?.form.last10.length) ? (
          <FormTrendChart
            homeForm={homeStats?.form.last10 || []}
            awayForm={awayStats?.form.last10 || []}
            homeTeam={selectedMatch.homeTeamName}
            awayTeam={selectedMatch.awayTeamName}
          />
        ) : null}

        {/* Manager Comparison */}
        <ManagerComparison
          homeManager={homeTeam?.manager}
          awayManager={awayTeam?.manager}
          homeTeamName={selectedMatch.homeTeamName}
          awayTeamName={selectedMatch.awayTeamName}
          homeLeague={homeTeam?.league}
          awayLeague={awayTeam?.league}
          homePoints={homeTeam?.points}
          awayPoints={awayTeam?.points}
        />

        {/* AI Analysis */}
        <AIAnalysis
          homeTeamName={selectedMatch.homeTeamName}
          awayTeamName={selectedMatch.awayTeamName}
          homeStats={homeStats}
          awayStats={awayStats}
          h2h={h2h}
          prediction={prediction}
          homeManager={homeTeam?.manager}
          awayManager={awayTeam?.manager}
          homeLeague={homeTeam?.league}
          awayLeague={awayTeam?.league}
          homePlayers={homeTeam?.players}
          awayPlayers={awayTeam?.players}
          news={matchNews}
        />

        {/* Player Comparison */}
        {(homeTeam?.players?.length || awayTeam?.players?.length) ? (
          <PlayerComparison
            homePlayers={homeTeam?.players || []}
            awayPlayers={awayTeam?.players || []}
            homeTeamName={selectedMatch.homeTeamName}
            awayTeamName={selectedMatch.awayTeamName}
          />
        ) : null}

        {/* Top Scorers */}
        {(homeTeam?.players?.length || awayTeam?.players?.length) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card rounded-2xl p-5 border border-border">
              <h3 className="text-foreground font-bold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-success" />
                {selectedMatch.homeTeamName} - Golcüler
              </h3>
              {getTopScorers(homeTeam?.players, 5).length > 0 ? (
                getTopScorers(homeTeam?.players, 5).map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-foreground">{p.Player}</span>
                    <span className="text-primary font-bold">{parseNum(p.goals)}G / {parseNum(p.assists)}A</span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">Golcü verisi bulunamadı</p>
              )}
            </div>
            <div className="bg-card rounded-2xl p-5 border border-border">
              <h3 className="text-foreground font-bold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                {selectedMatch.awayTeamName} - Golcüler
              </h3>
              {getTopScorers(awayTeam?.players, 5).length > 0 ? (
                getTopScorers(awayTeam?.players, 5).map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-foreground">{p.Player}</span>
                    <span className="text-primary font-bold">{parseNum(p.goals)}G / {parseNum(p.assists)}A</span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">Golcü verisi bulunamadı</p>
              )}
            </div>
          </div>
        ) : null}

        {/* Live News Feed */}
        <LiveNewsFeed
          news={matchNews.map(n => ({
            title: n.title,
            description: n.snippet || '',
            link: n.url,
            pubDate: n.date,
            source: n.source,
          }))}
          loading={newsLoading}
        />

        {/* Export Report */}
        <ExportReport
          matchData={{
            homeTeam: selectedMatch.homeTeamName,
            awayTeam: selectedMatch.awayTeamName,
            league: homeTeam?.league || awayTeam?.league || 'Unknown League',
          }}
          prediction={prediction ? {
            homeWinPct: parseFloat(prediction.homeWinPct),
            drawPct: parseFloat(prediction.drawPct),
            awayWinPct: parseFloat(prediction.awayWinPct),
            expectedScore: `${prediction.expectedHomeGoals}-${prediction.expectedAwayGoals}`,
          } : undefined}
        />
      </div>
    );
  };

  const tabs = [
    { id: 'setup', label: 'Bağlantı', icon: Database },
    { id: 'matches', label: 'Maçlar', icon: Calendar },
    { id: 'overview', label: 'Analiz', icon: Eye, requiresMatch: true },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-card/80 backdrop-blur-xl border-b border-border sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-warning flex items-center justify-center shadow-lg glow">
                <BarChart3 className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Maç Analiz Sistemi</h1>
                <p className="text-muted-foreground text-sm">İstatistik + AI Analizi</p>
              </div>
            </div>
            {isConnected && (
              <div className="flex items-center gap-2 text-success text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                <span>Bağlı</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <nav className="bg-card/50 backdrop-blur-lg border-b border-border sticky top-[73px] z-40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1 py-2">
            {tabs.map(tab => {
              const isDisabled = tab.requiresMatch && !selectedMatch;
              return (
                <button
                  key={tab.id}
                  onClick={() => !isDisabled && setActiveTab(tab.id)}
                  disabled={isDisabled}
                  className={activeTab === tab.id ? 'tab-button-active' : isDisabled ? 'tab-button text-muted-foreground/50 cursor-not-allowed' : 'tab-button-inactive'}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'setup' && renderSetup()}
        {activeTab === 'matches' && renderMatchSelection()}
        {activeTab === 'overview' && renderOverview()}
      </main>

      <footer className="bg-card border-t border-border mt-12 py-6">
        <div className="max-w-6xl mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>Bu analiz istatistiksel verilere ve yapay zekaya dayanmaktadır.</p>
        </div>
      </footer>
    </div>
  );
}
