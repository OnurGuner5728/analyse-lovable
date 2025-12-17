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

    const systemPrompt = `Sen profesyonel bir futbol analisti ve bahis uzmanısın. Verilen maç istatistiklerini analiz edip Türkçe olarak detaylı ve okunabilir bir rapor hazırlayacaksın.

Raporun şu bölümleri içermeli:
1. 📊 GENEL DEĞERLENDIRME - Maçın genel görünümü
2. 🏠 EV SAHİBİ ANALİZİ - Güçlü ve zayıf yönler
3. ✈️ DEPLASMAN ANALİZİ - Güçlü ve zayıf yönler  
4. 📈 H2H DEĞERLENDİRMESİ - Karşılıklı sonuçların etkisi
5. 🎯 TAHMİN VE ÖNERİLER - Maç sonucu, skor tahmini ve bahis önerileri
6. ⚠️ RİSK FAKTÖRLERİ - Dikkat edilmesi gereken unsurlar

Kısa, öz ve profesyonel bir dil kullan. Her bölüm 2-3 cümle olsun.`;

    const userPrompt = `Şu maçı analiz et:

${matchContext.homeTeam} vs ${matchContext.awayTeam}

EV SAHİBİ (${matchContext.homeTeam}):
- Son 5 maç: ${matchContext.homeStats?.form || 'Veri yok'}
- Maç başı puan: ${matchContext.homeStats?.ppg || 'N/A'}
- Gol ortalaması: ${matchContext.homeStats?.avgGoalsFor || 'N/A'}
- Yediği gol ort: ${matchContext.homeStats?.avgGoalsAgainst || 'N/A'}
- Clean sheet: %${matchContext.homeStats?.cleanSheetPct || 'N/A'}
- Mevcut seri: ${matchContext.homeStats?.currentStreak || 'N/A'}

DEPLASMAN (${matchContext.awayTeam}):
- Son 5 maç: ${matchContext.awayStats?.form || 'Veri yok'}
- Maç başı puan: ${matchContext.awayStats?.ppg || 'N/A'}
- Gol ortalaması: ${matchContext.awayStats?.avgGoalsFor || 'N/A'}
- Yediği gol ort: ${matchContext.awayStats?.avgGoalsAgainst || 'N/A'}
- Clean sheet: %${matchContext.awayStats?.cleanSheetPct || 'N/A'}
- Mevcut seri: ${matchContext.awayStats?.currentStreak || 'N/A'}

H2H:
- Toplam maç: ${matchContext.h2h?.totalGames || 0}
- ${matchContext.homeTeam} galibiyeti: ${matchContext.h2h?.team1Wins || 0}
- ${matchContext.awayTeam} galibiyeti: ${matchContext.h2h?.team2Wins || 0}
- Beraberlik: ${matchContext.h2h?.draws || 0}

İSTATİSTİKSEL TAHMİN:
- ${matchContext.homeTeam} kazanma: %${matchContext.prediction?.homeWinPct || 'N/A'}
- Beraberlik: %${matchContext.prediction?.drawPct || 'N/A'}
- ${matchContext.awayTeam} kazanma: %${matchContext.prediction?.awayWinPct || 'N/A'}
- Beklenen skor: ${matchContext.prediction?.expectedScore || 'N/A'}`;

    console.log('Calling OpenAI API...');
    
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
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
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
