import { useState, useRef } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExportReportProps {
  matchData: {
    homeTeam: string;
    awayTeam: string;
    league: string;
    date?: string;
  };
  prediction?: {
    homeWinPct: number;
    drawPct: number;
    awayWinPct: number;
    expectedScore: string;
  };
  analysis?: string;
}

export function ExportReport({ matchData, prediction, analysis }: ExportReportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const reportRef = useRef<HTMLDivElement>(null);

  const generateTextReport = () => {
    const lines = [
      '═══════════════════════════════════════════════════════════════',
      '                    MAÇ ANALİZ RAPORU',
      '═══════════════════════════════════════════════════════════════',
      '',
      `📅 Tarih: ${matchData.date || new Date().toLocaleDateString('tr-TR')}`,
      `🏆 Lig: ${matchData.league}`,
      '',
      '───────────────────────────────────────────────────────────────',
      '                        KARŞILAŞMA',
      '───────────────────────────────────────────────────────────────',
      '',
      `    ${matchData.homeTeam}  VS  ${matchData.awayTeam}`,
      '',
    ];

    if (prediction) {
      lines.push(
        '───────────────────────────────────────────────────────────────',
        '                    TAHMİN ÖZETI',
        '───────────────────────────────────────────────────────────────',
        '',
        `🏠 ${matchData.homeTeam} Kazanır: %${prediction.homeWinPct.toFixed(1)}`,
        `🤝 Beraberlik: %${prediction.drawPct.toFixed(1)}`,
        `✈️ ${matchData.awayTeam} Kazanır: %${prediction.awayWinPct.toFixed(1)}`,
        '',
        `📊 Beklenen Skor: ${prediction.expectedScore}`,
        ''
      );
    }

    if (analysis) {
      lines.push(
        '───────────────────────────────────────────────────────────────',
        '                    AI ANALİZİ',
        '───────────────────────────────────────────────────────────────',
        '',
        analysis,
        ''
      );
    }

    lines.push(
      '═══════════════════════════════════════════════════════════════',
      '           Match Analyzer Pro - Profesyonel Analiz',
      '═══════════════════════════════════════════════════════════════'
    );

    return lines.join('\n');
  };

  const handleExportText = async () => {
    setIsExporting(true);
    
    try {
      const report = generateTextReport();
      const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${matchData.homeTeam}_vs_${matchData.awayTeam}_analiz.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Rapor İndirildi",
        description: "Analiz raporu başarıyla indirildi.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Rapor oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = async () => {
    setIsExporting(true);
    
    try {
      const data = {
        generatedAt: new Date().toISOString(),
        match: matchData,
        prediction,
        analysis,
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${matchData.homeTeam}_vs_${matchData.awayTeam}_data.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Veri İndirildi",
        description: "Analiz verisi JSON formatında indirildi.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Veri dışa aktarılırken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl p-6 border border-border">
      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary" />
        Rapor Dışa Aktar
      </h3>
      
      <p className="text-sm text-muted-foreground mb-4">
        Analiz sonuçlarını farklı formatlarda indirin.
      </p>
      
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleExportText}
          disabled={isExporting}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-secondary hover:bg-secondary/80 text-foreground rounded-xl transition-colors disabled:opacity-50"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">TXT Rapor</span>
        </button>
        
        <button
          onClick={handleExportJSON}
          disabled={isExporting}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-primary/20 hover:bg-primary/30 text-primary rounded-xl transition-colors disabled:opacity-50"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">JSON Veri</span>
        </button>
      </div>
      
      {/* Hidden report for PDF generation */}
      <div ref={reportRef} className="hidden" />
    </div>
  );
}
