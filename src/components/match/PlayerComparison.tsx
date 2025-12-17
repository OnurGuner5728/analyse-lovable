import { useState } from 'react';
import { Player, parseNum } from '@/lib/matchAnalyzer';
import { Users, Target, Clock, CreditCard } from 'lucide-react';

interface PlayerComparisonProps {
  homePlayers: Player[];
  awayPlayers: Player[];
  homeTeamName: string;
  awayTeamName: string;
}

export const PlayerComparison = ({ homePlayers, awayPlayers, homeTeamName, awayTeamName }: PlayerComparisonProps) => {
  const [selectedHomePlayer, setSelectedHomePlayer] = useState<Player | null>(null);
  const [selectedAwayPlayer, setSelectedAwayPlayer] = useState<Player | null>(null);

  const sortedHomePlayers = [...homePlayers]
    .filter(p => p.position !== 'GK')
    .sort((a, b) => parseNum(b.goals) - parseNum(a.goals))
    .slice(0, 15);

  const sortedAwayPlayers = [...awayPlayers]
    .filter(p => p.position !== 'GK')
    .sort((a, b) => parseNum(b.goals) - parseNum(a.goals))
    .slice(0, 15);

  const renderPlayerCard = (player: Player, isSelected: boolean, onClick: () => void, teamColor: string) => (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg cursor-pointer transition-all ${
        isSelected 
          ? `bg-${teamColor}/20 border border-${teamColor}/50` 
          : 'bg-secondary/30 hover:bg-secondary/50 border border-transparent'
      }`}
    >
      <div className="font-medium text-foreground text-sm truncate">{player.Player}</div>
      <div className="text-xs text-muted-foreground">{player.position || 'N/A'}</div>
      <div className="text-xs text-primary mt-1">{parseNum(player.goals)}G / {parseNum(player.assists)}A</div>
    </div>
  );

  const renderStatBar = (label: string, homeValue: number, awayValue: number, icon: React.ReactNode) => {
    const total = homeValue + awayValue || 1;
    const homePercent = (homeValue / total) * 100;
    const awayPercent = (awayValue / total) * 100;

    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-success font-medium">{homeValue}</span>
          <span className="text-muted-foreground flex items-center gap-1">{icon} {label}</span>
          <span className="text-primary font-medium">{awayValue}</span>
        </div>
        <div className="h-2 bg-secondary rounded-full flex overflow-hidden">
          <div 
            className="bg-success h-full transition-all duration-300" 
            style={{ width: `${homePercent}%` }} 
          />
          <div 
            className="bg-primary h-full transition-all duration-300" 
            style={{ width: `${awayPercent}%` }} 
          />
        </div>
      </div>
    );
  };

  return (
    <div className="bg-card rounded-2xl p-6 border border-border">
      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <Users className="w-5 h-5 text-primary" />
        Oyuncu Karşılaştırması
      </h3>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Home Team Players */}
        <div>
          <div className="text-sm font-medium text-success mb-3">{homeTeamName}</div>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
            {sortedHomePlayers.map((player, idx) => (
              <div key={idx}>
                {renderPlayerCard(
                  player, 
                  selectedHomePlayer?.Player === player.Player, 
                  () => setSelectedHomePlayer(player),
                  'success'
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Away Team Players */}
        <div>
          <div className="text-sm font-medium text-primary mb-3">{awayTeamName}</div>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
            {sortedAwayPlayers.map((player, idx) => (
              <div key={idx}>
                {renderPlayerCard(
                  player, 
                  selectedAwayPlayer?.Player === player.Player, 
                  () => setSelectedAwayPlayer(player),
                  'primary'
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comparison Section */}
      {selectedHomePlayer && selectedAwayPlayer && (
        <div className="bg-secondary/30 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span className="text-success">{selectedHomePlayer.Player}</span>
            <span className="text-muted-foreground">vs</span>
            <span className="text-primary">{selectedAwayPlayer.Player}</span>
          </div>

          <div className="space-y-3">
            {renderStatBar(
              'Gol',
              parseNum(selectedHomePlayer.goals),
              parseNum(selectedAwayPlayer.goals),
              <Target className="w-3 h-3" />
            )}
            {renderStatBar(
              'Asist',
              parseNum(selectedHomePlayer.assists),
              parseNum(selectedAwayPlayer.assists),
              <Users className="w-3 h-3" />
            )}
            {renderStatBar(
              'Maç',
              parseNum(selectedHomePlayer.games),
              parseNum(selectedAwayPlayer.games),
              <Clock className="w-3 h-3" />
            )}
            {renderStatBar(
              'Sarı Kart',
              parseNum(selectedHomePlayer.cards_yellow),
              parseNum(selectedAwayPlayer.cards_yellow),
              <CreditCard className="w-3 h-3" />
            )}
          </div>
        </div>
      )}

      {(!selectedHomePlayer || !selectedAwayPlayer) && (
        <div className="text-center text-muted-foreground text-sm py-4 bg-secondary/30 rounded-xl">
          Her iki takımdan birer oyuncu seçin
        </div>
      )}
    </div>
  );
};
