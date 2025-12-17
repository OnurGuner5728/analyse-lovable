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
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const { matchContext } = await req.json();

    const systemPrompt = `Sen dünyaca ünlü bir futbol analisti, bahis uzmanı ve istatistik dehasisın. Verilen tüm verileri derinlemesine analiz edip Türkçe olarak profesyonel bir rapor hazırlayacaksın.

ÖNEMLİ KURALLAR:
- Sadece sana verilen istatistiksel verileri, oyuncu isimlerini ve manager isimlerini kullan
- Haber başlıklarını yorumla ama içerik uydurmA
- Halüsinasyon yapma, olmayan veri üretme
- Her tahmin için mantıksal gerekçe sun

RAPORUN BÖLÜMLERİ:

📊 GENEL DEĞERLENDIRME
- Maçın karakteri ve önemi
- Lig maçı mı, uluslararası mı? (Uluslararasıysa güç dengesizliğine dikkat et)

🏠 EV SAHİBİ ANALİZİ
- Form durumu ve seri
- Ev sahibi avantajı
- Güçlü/zayıf yönler

✈️ DEPLASMAN ANALİZİ  
- Deplasman performansı
- Form durumu
- Güçlü/zayıf yönler

👔 MANAGER KARŞILAŞTIRMASI
- Taktiksel yaklaşımlar
- Tercih edilen dizilişler
- Tarihsel başarı

📈 H2H DEĞERLENDİRMESİ
- Geçmiş karşılaşma sonuçları (bugünün maçını sayma!)
- Gol trendleri
- Psikolojik üstünlük

⚽ SKOR TAHMİNİ
- Net skor tahmini (örn: 2-1)
- Alternatif skorlar
- İlk yarı/ikinci yarı beklentisi

🎯 GOL KOMBİNASYONLARI
- Penaltı ihtimali (kart ortalamasına göre)
- Serbest vuruş golü potansiyeli
- Korner golü olasılığı
- Kendi kalesine gol riski

🟨 KART TAHMİNİ
- Sarı kart beklentisi (her takım için)
- Kırmızı kart riski
- En riskli oyuncular (verilmişse)

💰 BAHİS ÖNERİLERİ
- MS (Maç Sonucu) önerisi
- Alt/Üst 2.5 önerisi
- KG (Karşılıklı Gol) önerisi
- Handikap önerisi (gerekirse)
- Korner bahisi (tahmini)

⚠️ RİSK FAKTÖRLERİ
- Sürpriz potansiyeli
- Sakatlık/ceza riskleri (verilmişse)
- Motivasyon farkları

📰 HABER DEĞERLENDİRMESİ (varsa)
- Verilen haber başlıklarından çıkarımlar
- Maça etki edebilecek faktörler

Her bölümü kısa ve öz tut (2-4 cümle). Profesyonel ve güvenilir bir dil kullan.`;

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

    console.log('Calling OpenAI API with comprehensive match data...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || 'Analiz oluşturulamadı';

    console.log('Comprehensive analysis generated successfully');

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
