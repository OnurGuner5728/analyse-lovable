import { Newspaper, ExternalLink, Clock, AlertCircle } from 'lucide-react';

interface NewsItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
}

interface LiveNewsFeedProps {
  news: NewsItem[];
  loading: boolean;
  error?: string;
}

export function LiveNewsFeed({ news, loading, error }: LiveNewsFeedProps) {
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffHours < 1) return 'Az önce';
      if (diffHours < 24) return `${diffHours} saat önce`;
      if (diffHours < 48) return 'Dün';
      return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-border">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-primary" />
          Güncel Haberler
        </h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-secondary rounded w-3/4 mb-2" />
              <div className="h-3 bg-secondary rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-border">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-primary" />
          Güncel Haberler
        </h3>
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <span className="text-sm text-destructive">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-6 border border-border">
      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <Newspaper className="w-5 h-5 text-primary" />
        Güncel Haberler
        <span className="text-xs text-muted-foreground font-normal ml-auto">
          {news.length} haber
        </span>
      </h3>
      
      {news.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          İlgili haber bulunamadı.
        </p>
      ) : (
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
          {news.map((item, index) => (
            <a
              key={index}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 bg-secondary/50 hover:bg-secondary/80 rounded-xl transition-all group border border-transparent hover:border-primary/30"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                  {item.title}
                </h4>
                <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0 group-hover:text-primary transition-colors" />
              </div>
              
              {item.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {item.description.substring(0, 150)}...
                </p>
              )}
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="px-2 py-0.5 bg-primary/20 text-primary rounded-full">
                  {item.source}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(item.pubDate)}
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
