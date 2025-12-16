import type { NewsItem } from '@/lib/matchAnalyzer';

interface NewsCardProps {
  news: NewsItem;
}

export const NewsCard = ({ news }: NewsCardProps) => (
  <div className="bg-secondary/30 rounded-xl p-4 hover:bg-secondary/50 transition-all duration-300 border border-transparent hover:border-border">
    <div className="flex items-center gap-2 mb-2">
      <span className="text-xs text-primary font-medium">{news.source}</span>
      {news.date && <span className="text-xs text-muted-foreground">• {news.date}</span>}
    </div>
    <h4 className="text-foreground font-semibold mb-2 line-clamp-2">{news.title}</h4>
    {news.snippet && <p className="text-muted-foreground text-sm line-clamp-2">{news.snippet}</p>}
    {news.url && news.url !== '#' && (
      <a
        href={news.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary text-sm hover:underline mt-2 inline-flex items-center gap-1 font-medium"
      >
        Devamını Oku →
      </a>
    )}
  </div>
);
