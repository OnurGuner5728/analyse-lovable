import { User, Trophy, TrendingUp, Calendar, Award } from 'lucide-react';

interface ManagerComparisonProps {
  homeManager: string | undefined;
  awayManager: string | undefined;
  homeTeamName: string;
  awayTeamName: string;
  homeLeague: string | undefined;
  awayLeague: string | undefined;
  homePoints: string | number | undefined;
  awayPoints: string | number | undefined;
}

export const ManagerComparison = ({
  homeManager,
  awayManager,
  homeTeamName,
  awayTeamName,
  homeLeague,
  awayLeague,
  homePoints,
  awayPoints,
}: ManagerComparisonProps) => {
  if (!homeManager && !awayManager) return null;

  return (
    <div className="bg-gradient-to-br from-card via-secondary/20 to-card rounded-2xl p-6 border border-border">
      <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
        <User className="w-5 h-5 text-primary" />
        Teknik Direktör Karşılaştırması
      </h3>

      <div className="grid grid-cols-2 gap-6">
        {/* Home Manager */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center border-2 border-emerald-500/30">
            <User className="w-8 h-8 text-emerald-400" />
          </div>
          <h4 className="font-bold text-foreground text-lg">{homeManager || 'Bilinmiyor'}</h4>
          <p className="text-emerald-400 text-sm font-medium">{homeTeamName}</p>
          
          <div className="mt-4 space-y-2 text-left bg-emerald-500/5 rounded-xl p-3 border border-emerald-500/10">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Trophy className="w-3 h-3" /> Lig
              </span>
              <span className="text-foreground font-medium">{homeLeague || '-'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Puan
              </span>
              <span className="text-foreground font-medium">{homePoints || 0}</span>
            </div>
          </div>
        </div>

        {/* Away Manager */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center border-2 border-blue-500/30">
            <User className="w-8 h-8 text-blue-400" />
          </div>
          <h4 className="font-bold text-foreground text-lg">{awayManager || 'Bilinmiyor'}</h4>
          <p className="text-blue-400 text-sm font-medium">{awayTeamName}</p>
          
          <div className="mt-4 space-y-2 text-left bg-blue-500/5 rounded-xl p-3 border border-blue-500/10">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Trophy className="w-3 h-3" /> Lig
              </span>
              <span className="text-foreground font-medium">{awayLeague || '-'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Puan
              </span>
              <span className="text-foreground font-medium">{awayPoints || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* VS Divider */}
      <div className="flex items-center justify-center my-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-warning/20 flex items-center justify-center border border-primary/30">
          <span className="text-sm font-black text-foreground">VS</span>
        </div>
      </div>

      {/* Competition Context */}
      {homeLeague && awayLeague && (
        <div className="bg-secondary/30 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
            <Award className="w-4 h-4" />
            <span>Müsabaka Bağlamı</span>
          </div>
          {homeLeague === awayLeague ? (
            <p className="text-foreground text-sm">
              <span className="text-primary font-medium">Lig Maçı:</span> Aynı ligde mücadele eden takımlar. 
              Yerel rekabet avantajları ve lig dinamikleri ön planda.
            </p>
          ) : (
            <p className="text-foreground text-sm">
              <span className="text-warning font-medium">Uluslararası/Farklı Lig:</span> Farklı lig dinamikleri. 
              Uluslararası tecrübe ve adaptasyon kritik öneme sahip.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
