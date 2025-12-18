import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { matchContext } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `Sen profesyonel bir futbol analisti ve bahis uzmanısın. Görevin, verilen maç verilerini derinlemesine analiz ederek SOMUT VE SAYISAL tahminler sunmak.

MUTLAKA UYULMASI GEREKEN KURALLAR:
1. SADECE sana verilen verilerdeki oyuncu ve teknik direktör isimlerini kullan - HALÜSİNASYON YAPMA
2. Tüm tahminler SOMUT RAKAMLARLA ve YÜZDE OLASILIKLARLA desteklenmeli
3. Belirsiz ifadeler ("potansiyel var", "olabilir", "muhtemel") KULLANMA - bunun yerine "%65 ihtimalle", "beklenen değer: 3.2" gibi ifadeler kullan
4. Her key event (penaltı, kart, korner, şut, frikik) için tahmin edilen SAYI ver
5. Gol kombinasyonlarını analiz et ve bunları TAHMİNİ SKORA yansıt

ANALİZ FORMATI:

📊 TAKIM GÜÇ ANALİZİ
[Ev sahibi ve deplasman takımlarının form, gol atma/yeme oranları, iç saha/dış saha performansı - RAKAMLARLA]

🏆 MÜSABAKA BAĞLAMI
[Lig maçı ise lig sıralaması ve puan durumu analizi]
[Uluslararası maç ise takımların uluslararası performans farklılıkları]
[Takımların bu bağlamdaki güç dengesi değerlendirmesi]

👥 KADRO VE OYUNCU ANALİZİ
[Kilit oyuncular ve form durumları - SADECE verideki isimler]
[Gol kralları karşılaştırması]
[Asist kralları karşılaştırması]

🎯 KEY EVENT TAHMİNLERİ (SOMUT RAKAMLAR)
- Toplam Gol Beklentisi: X.XX (ev: X.XX, dep: X.XX)
- Toplam Şut Beklentisi: XX-XX (isabetli: XX-XX)
- Korner Beklentisi: XX-XX
- Sarı Kart Beklentisi: X-X (ev: X, dep: X)
- Kırmızı Kart Riski: %XX
- Penaltı İhtimali: %XX
- Frikik Gol İhtimali: %XX
- Kendi Kalesine Gol Riski: %XX

⚽ GOL DAĞILIMI ANALİZİ
[Her takım için gol kaynaklarının yüzdesel dağılımı]
- Açık oyundan: %XX
- Penaltıdan: %XX
- Serbest vuruştan: %XX
- Kornerden: %XX
- Kendi kalesine: %XX

🎲 TAHMİNİ SKOR VE OLASILIKLAR
Ana Tahmin: [SKOR] (%XX olasılık)
Alternatif 1: [SKOR] (%XX olasılık)
Alternatif 2: [SKOR] (%XX olasılık)

İlk Yarı Tahmini: [SKOR]
İlk Gol: [TAKİM] (%XX)
Her İki Takım Gol Atar: Evet/Hayır (%XX)
2.5 Üst: Evet/Hayır (%XX)

📈 BAHİS ÖNERİLERİ
[En değerli 3 bahis önerisi - her biri için beklenen değer hesabı]

⚠️ RİSK FAKTÖRLERİ
[Maç sonucunu etkileyebilecek kritik faktörler]`;

    // Build comprehensive user prompt
    let userPrompt = `ŞU MAÇI ANALİZ ET:

${matchContext.homeTeam} vs ${matchContext.awayTeam}

MÜSABAKA TÜRÜ: ${matchContext.competitionType === 'international' ? 'ULUSLARARASI (Farklı ligler - güç dengesine dikkat!)' : 'LİG MAÇI'}
Ev Sahibi Ligi: ${matchContext.homeLeague}
Deplasman Ligi: ${matchContext.awayLeague}

TEKNIK DİREKTÖRLER:
- ${matchContext.homeTeam}: ${matchContext.homeManager}
- ${matchContext.awayTeam}: ${matchContext.awayManager}
`;

    if (matchContext.homeStats) {
      userPrompt += `
EV SAHİBİ (${matchContext.homeTeam}) İSTATİSTİKLERİ:
- Son 5 maç formu: ${matchContext.homeStats.form || 'Veri yok'}
- Maç başı puan: ${matchContext.homeStats.ppg}
- Gol ortalaması: ${matchContext.homeStats.avgGoalsFor}
- Yediği gol ort.: ${matchContext.homeStats.avgGoalsAgainst}
- Clean sheet: %${matchContext.homeStats.cleanSheetPct}
- Gol atamama: %${matchContext.homeStats.failedToScorePct}
- KG oranı: %${matchContext.homeStats.bttsPct}
- 2.5 Üst oranı: %${matchContext.homeStats.over25Pct}
- Mevcut seri: ${matchContext.homeStats.currentStreak}
- Ev sahibi kayıt: ${matchContext.homeStats.homeRecord || 'N/A'}
- Tercih dizilişler: ${matchContext.homeStats.formations || 'N/A'}
`;
    }

    if (matchContext.awayStats) {
      userPrompt += `
DEPLASMAN (${matchContext.awayTeam}) İSTATİSTİKLERİ:
- Son 5 maç formu: ${matchContext.awayStats.form || 'Veri yok'}
- Maç başı puan: ${matchContext.awayStats.ppg}
- Gol ortalaması: ${matchContext.awayStats.avgGoalsFor}
- Yediği gol ort.: ${matchContext.awayStats.avgGoalsAgainst}
- Clean sheet: %${matchContext.awayStats.cleanSheetPct}
- Gol atamama: %${matchContext.awayStats.failedToScorePct}
- KG oranı: %${matchContext.awayStats.bttsPct}
- 2.5 Üst oranı: %${matchContext.awayStats.over25Pct}
- Mevcut seri: ${matchContext.awayStats.currentStreak}
- Deplasman kayıt: ${matchContext.awayStats.awayRecord || 'N/A'}
- Tercih dizilişler: ${matchContext.awayStats.formations || 'N/A'}
`;
    }

    if (matchContext.homePlayerStats) {
      userPrompt += `
${matchContext.homeTeam} OYUNCU İSTATİSTİKLERİ:
- Toplam gol: ${matchContext.homePlayerStats.totalGoals}
- Toplam asist: ${matchContext.homePlayerStats.totalAssists}
- Toplam sarı kart: ${matchContext.homePlayerStats.totalYellowCards}
- Toplam kırmızı kart: ${matchContext.homePlayerStats.totalRedCards}
- En golcü: ${matchContext.homePlayerStats.topScorer || 'Bilinmiyor'}
- En asistçi: ${matchContext.homePlayerStats.topAssister || 'Bilinmiyor'}
- En kartlı: ${matchContext.homePlayerStats.mostCarded || 'Bilinmiyor'}
- Maç başı kart ort.: ${matchContext.homePlayerStats.avgCardsPerGame}
`;
    }

    if (matchContext.awayPlayerStats) {
      userPrompt += `
${matchContext.awayTeam} OYUNCU İSTATİSTİKLERİ:
- Toplam gol: ${matchContext.awayPlayerStats.totalGoals}
- Toplam asist: ${matchContext.awayPlayerStats.totalAssists}
- Toplam sarı kart: ${matchContext.awayPlayerStats.totalYellowCards}
- Toplam kırmızı kart: ${matchContext.awayPlayerStats.totalRedCards}
- En golcü: ${matchContext.awayPlayerStats.topScorer || 'Bilinmiyor'}
- En asistçi: ${matchContext.awayPlayerStats.topAssister || 'Bilinmiyor'}
- En kartlı: ${matchContext.awayPlayerStats.mostCarded || 'Bilinmiyor'}
- Maç başı kart ort.: ${matchContext.awayPlayerStats.avgCardsPerGame}
`;
    }

    if (matchContext.h2h) {
      userPrompt += `
H2H (KAFA KAFAYA) - Sadece oynanan maçlar:
- Toplam maç: ${matchContext.h2h.totalGames}
- ${matchContext.homeTeam} galibiyeti: ${matchContext.h2h.team1Wins || 0}
- ${matchContext.awayTeam} galibiyeti: ${matchContext.h2h.team2Wins || 0}
- Beraberlik: ${matchContext.h2h.draws || 0}
- ${matchContext.homeTeam} toplam gol: ${matchContext.h2h.team1Goals || 0}
- ${matchContext.awayTeam} toplam gol: ${matchContext.h2h.team2Goals || 0}
`;
      if (matchContext.h2h.recentResults?.length > 0) {
        userPrompt += `- Son karşılaşmalar: ${matchContext.h2h.recentResults.map((r: any) => `${r.date}: ${r.score}`).join(', ')}\n`;
      }
    }

    if (matchContext.prediction) {
      userPrompt += `
İSTATİSTİKSEL MODEL TAHMİNİ:
- ${matchContext.homeTeam} kazanma: %${matchContext.prediction.homeWinPct}
- Beraberlik: %${matchContext.prediction.drawPct}
- ${matchContext.awayTeam} kazanma: %${matchContext.prediction.awayWinPct}
- Beklenen skor: ${matchContext.prediction.expectedScore}
- KG olasılığı: %${matchContext.prediction.bttsPct}
- 2.5 Üst olasılığı: %${matchContext.prediction.over25Pct}
- Güven seviyesi: ${matchContext.prediction.confidence}
`;
    }

    if (matchContext.newsHeadlines?.length > 0) {
      userPrompt += `
GÜNCEL HABER BAŞLIKLARI (Yorumla, içerik uydurma):
${matchContext.newsHeadlines.map((n: any, i: number) => `${i + 1}. "${n.title}" (${n.source}, ${n.date})`).join('\n')}
`;
    }

    userPrompt += `

ÖNEMLİ: Tüm tahminleri SOMUT RAKAMLARLA ver. "Olabilir", "potansiyel var" gibi belirsiz ifadeler KULLANMA. Her key event için beklenen değer hesapla ve bunları final skor tahminine yansıt.`;

    console.log('Calling Lovable AI Gateway...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.',
          analysis: null 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'AI credits exhausted. Please add credits to continue.',
          analysis: null 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || 'Analiz oluşturulamadı';

    console.log('Analysis generated successfully');

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-match function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
