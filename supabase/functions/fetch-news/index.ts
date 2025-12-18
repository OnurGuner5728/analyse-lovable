import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Free RSS feeds for sports news
const RSS_FEEDS = [
  { url: 'https://www.espn.com/espn/rss/soccer/news', source: 'ESPN' },
  { url: 'https://feeds.bbci.co.uk/sport/football/rss.xml', source: 'BBC Sport' },
  { url: 'https://www.goal.com/feeds/en/news', source: 'Goal.com' },
];

interface NewsItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
}

async function fetchRSSFeed(feedUrl: string, source: string): Promise<NewsItem[]> {
  try {
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MatchAnalyzer/1.0)',
      },
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch ${source}: ${response.status}`);
      return [];
    }
    
    const xml = await response.text();
    const items: NewsItem[] = [];
    
    // Simple XML parsing for RSS items
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    
    while ((match = itemRegex.exec(xml)) !== null && items.length < 10) {
      const itemXml = match[1];
      
      const titleMatch = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/);
      const descMatch = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/);
      const linkMatch = itemXml.match(/<link>(.*?)<\/link>/);
      const dateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/);
      
      const title = titleMatch ? (titleMatch[1] || titleMatch[2] || '').trim() : '';
      const description = descMatch ? (descMatch[1] || descMatch[2] || '').replace(/<[^>]*>/g, '').trim() : '';
      const link = linkMatch ? linkMatch[1].trim() : '';
      const pubDate = dateMatch ? dateMatch[1].trim() : '';
      
      if (title) {
        items.push({ title, description, link, pubDate, source });
      }
    }
    
    return items;
  } catch (error) {
    console.error(`Error fetching ${source}:`, error);
    return [];
  }
}

function filterNewsByTeams(news: NewsItem[], homeTeam: string, awayTeam: string): NewsItem[] {
  const homeWords = homeTeam.toLowerCase().split(/\s+/);
  const awayWords = awayTeam.toLowerCase().split(/\s+/);
  
  return news.filter(item => {
    const text = (item.title + ' ' + item.description).toLowerCase();
    
    // Check if any word from team names appears in the news
    const matchesHome = homeWords.some(word => word.length > 3 && text.includes(word));
    const matchesAway = awayWords.some(word => word.length > 3 && text.includes(word));
    
    return matchesHome || matchesAway;
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { homeTeam, awayTeam } = await req.json();
    
    console.log(`Fetching news for: ${homeTeam} vs ${awayTeam}`);
    
    // Fetch from all RSS feeds in parallel
    const feedPromises = RSS_FEEDS.map(feed => fetchRSSFeed(feed.url, feed.source));
    const feedResults = await Promise.all(feedPromises);
    
    // Flatten all news items
    const allNews = feedResults.flat();
    
    console.log(`Fetched ${allNews.length} total news items`);
    
    // Filter by team names
    let relevantNews = filterNewsByTeams(allNews, homeTeam, awayTeam);
    
    // If no relevant news, return general football news
    if (relevantNews.length === 0) {
      relevantNews = allNews.slice(0, 10);
    }
    
    // Sort by date (newest first)
    relevantNews.sort((a, b) => {
      const dateA = new Date(a.pubDate).getTime() || 0;
      const dateB = new Date(b.pubDate).getTime() || 0;
      return dateB - dateA;
    });
    
    // Limit to 15 items
    const limitedNews = relevantNews.slice(0, 15);
    
    console.log(`Returning ${limitedNews.length} relevant news items`);

    return new Response(JSON.stringify({ news: limitedNews }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in fetch-news function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      news: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
