"use client";

import { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Newspaper, ExternalLink, Clock, TrendingUp, Users, Wrench, Trophy, 
  RefreshCw, AlertCircle, Sparkles, Check, SortAsc, Filter, Eye, EyeOff
} from 'lucide-react';
import { useNews, useReadArticles, useMarkArticleRead } from '@/lib/hooks/useF1Data';
import type { NewsCategory } from '@/lib/services/news.service';

// Source branding colors
const sourceColors: Record<string, { bg: string; text: string; accent: string }> = {
  'Formula1.com': { 
    bg: 'bg-gradient-to-br from-red-600/20 to-red-900/30', 
    text: 'text-red-400', 
    accent: 'border-l-red-500' 
  },
  'Autosport': { 
    bg: 'bg-gradient-to-br from-blue-600/20 to-blue-900/30', 
    text: 'text-blue-400', 
    accent: 'border-l-blue-500' 
  },
  'Motorsport.com': { 
    bg: 'bg-gradient-to-br from-orange-600/20 to-orange-900/30', 
    text: 'text-orange-400', 
    accent: 'border-l-orange-500' 
  },
  'Pitpass': { 
    bg: 'bg-gradient-to-br from-emerald-600/20 to-emerald-900/30', 
    text: 'text-emerald-400', 
    accent: 'border-l-emerald-500' 
  },
};

const categoryIcons = {
  teams: Users,
  drivers: Trophy,
  technical: Wrench,
  results: TrendingUp,
  all: Newspaper,
};

const categoryLabels: Record<NewsCategory, string> = {
  all: 'Toutes',
  teams: 'Écuries',
  drivers: 'Pilotes',
  technical: 'Technique',
  results: 'Résultats',
};

const categoryColors: Record<string, string> = {
  teams: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  drivers: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  technical: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  results: 'bg-green-500/20 text-green-300 border-green-500/30',
};

type SortOption = 'date-desc' | 'date-asc' | 'source';
type ReadFilter = 'all' | 'unread' | 'read';

const sortLabels: Record<SortOption, string> = {
  'date-desc': 'Plus récent',
  'date-asc': 'Plus ancien',
  'source': 'Par source',
};

const readFilterLabels: Record<ReadFilter, string> = {
  'all': 'Tous',
  'unread': 'Non lus',
  'read': 'Lus',
};

function getTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return "À l'instant";
  if (diffInHours === 1) return "Il y a 1h";
  if (diffInHours < 24) return `Il y a ${diffInHours}h`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "Hier";
  if (diffInDays < 7) return `Il y a ${diffInDays}j`;
  
  return `Il y a ${Math.floor(diffInDays / 7)} sem.`;
}

function NewsCardSkeleton() {
  return (
    <Card className="border-border/30 bg-card/50">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function News() {
  const { data: session } = useSession();
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  
  const { data: articles, isLoading, isError, refetch, isFetching } = useNews(selectedCategory);
  const { data: readUrls = [] } = useReadArticles();
  const markAsRead = useMarkArticleRead();

  const isArticleRead = (url: string) => readUrls.includes(url);

  // Sort and filter articles
  const processedArticles = useMemo(() => {
    if (!articles) return { featured: [], regular: [] };

    let filtered = [...articles];

    // Apply read filter (only for logged-in users)
    if (session?.user && readFilter !== 'all') {
      filtered = filtered.filter(article => {
        const isRead = isArticleRead(article.url);
        return readFilter === 'read' ? isRead : !isRead;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        case 'date-asc':
          return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
        case 'source':
          return a.source.localeCompare(b.source);
        default:
          return 0;
      }
    });

    const featured = filtered.filter(article => article.featured).slice(0, 3);
    const regular = filtered.filter(article => !article.featured);

    return { featured, regular };
  }, [articles, sortBy, readFilter, readUrls, session?.user]);

  const handleArticleClick = (url: string) => {
    // Mark as read if user is logged in
    if (session?.user) {
      markAsRead.mutate(url);
    }
    window.open(url, '_blank');
  };

  const unreadCount = useMemo(() => {
    if (!articles || !session?.user) return 0;
    return articles.filter(a => !isArticleRead(a.url)).length;
  }, [articles, readUrls, session?.user]);

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">Actualités F1</h2>
          <p className="text-muted-foreground text-sm">
            Agrégation en temps réel de 4 sources expertes
            {session?.user && unreadCount > 0 && (
              <span className="ml-2 text-primary">• {unreadCount} non lu{unreadCount > 1 ? 's' : ''}</span>
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-2 rounded-xl"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          {isFetching ? 'Chargement...' : 'Actualiser'}
        </Button>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(categoryLabels) as NewsCategory[]).map((category) => {
          const Icon = categoryIcons[category];
          const isSelected = selectedCategory === category;
          return (
            <Button
              key={category}
              variant={isSelected ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={`rounded-full gap-1.5 ${!isSelected ? 'text-muted-foreground hover:text-foreground' : ''}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {categoryLabels[category]}
            </Button>
          );
        })}
      </div>

      {/* Sort and Filter Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <SortAsc className="w-4 h-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(sortLabels).map(([value, label]) => (
                <SelectItem key={value} value={value} className="text-xs">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {session?.user && (
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={readFilter} onValueChange={(v) => setReadFilter(v as ReadFilter)}>
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(readFilterLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value} className="text-xs">
                    <span className="flex items-center gap-1.5">
                      {value === 'read' && <Eye className="w-3 h-3" />}
                      {value === 'unread' && <EyeOff className="w-3 h-3" />}
                      {label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Error State */}
      {isError && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-8 text-center">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 text-destructive" />
            <h3 className="font-semibold mb-1">Erreur de chargement</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Impossible de charger les actualités.
            </p>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              Réessayer
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <NewsCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Featured News - Horizontal Cards */}
      {!isLoading && !isError && selectedCategory === 'all' && processedArticles.featured.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            À la une
          </h3>
          <div className="grid gap-3">
            {processedArticles.featured.map((article) => {
              const Icon = categoryIcons[article.category];
              const colors = sourceColors[article.source] || sourceColors['Formula1.com'];
              const isRead = session?.user && isArticleRead(article.url);
              return (
                <Card 
                  key={article.id} 
                  className={`group cursor-pointer border-l-4 ${colors.accent} border-border/30 hover:border-border/60 transition-all hover:shadow-lg overflow-hidden ${isRead ? 'opacity-60' : ''}`}
                  onClick={() => handleArticleClick(article.url)}
                >
                  <CardContent className={`p-4 ${colors.bg}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className={`text-xs ${categoryColors[article.category]} border`}>
                            <Icon className="w-3 h-3 mr-1" />
                            {categoryLabels[article.category]}
                          </Badge>
                          <Badge variant="secondary" className="text-xs bg-primary/20 text-primary border-0">
                            À la une
                          </Badge>
                          {isRead && (
                            <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground border-0">
                              <Check className="w-3 h-3 mr-1" />
                              Lu
                            </Badge>
                          )}
                        </div>
                        <h4 className={`font-semibold text-base leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2 ${isRead ? 'text-muted-foreground' : ''}`}>
                          {article.title}
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {article.summary}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className={`font-semibold ${colors.text}`}>
                            {article.source}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {getTimeAgo(article.publishedAt)}
                          </span>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleArticleClick(article.url);
                        }}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Regular News - Compact List */}
      {!isLoading && !isError && processedArticles.regular.length > 0 && (
        <div className="space-y-3">
          {selectedCategory === 'all' && processedArticles.featured.length > 0 && (
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Newspaper className="w-4 h-4" />
              Dernières actualités
            </h3>
          )}
          <div className="grid gap-2">
            {processedArticles.regular.map((article) => {
              const Icon = categoryIcons[article.category];
              const colors = sourceColors[article.source] || sourceColors['Formula1.com'];
              const isRead = session?.user && isArticleRead(article.url);
              return (
                <Card 
                  key={article.id} 
                  className={`group cursor-pointer border-l-4 ${colors.accent} border-border/20 hover:border-border/50 transition-all hover:bg-accent/5 ${isRead ? 'opacity-60' : ''}`}
                  onClick={() => handleArticleClick(article.url)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`font-medium text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2 ${isRead ? 'text-muted-foreground' : ''}`}>
                            {article.title}
                          </h4>
                          {isRead && (
                            <Check className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className={`font-medium ${colors.text}`}>
                            {article.source}
                          </span>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${categoryColors[article.category]} border`}>
                            <Icon className="w-2.5 h-2.5 mr-0.5" />
                            {categoryLabels[article.category]}
                          </Badge>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {getTimeAgo(article.publishedAt)}
                          </span>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-50 transition-opacity mt-0.5" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && processedArticles.featured.length === 0 && processedArticles.regular.length === 0 && (
        <Card className="border-border/30 border-dashed">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Newspaper className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">Aucune actualité</h3>
            <p className="text-muted-foreground text-sm">
              {readFilter === 'unread' ? 'Tous les articles ont été lus.' : 
               readFilter === 'read' ? 'Aucun article lu.' :
               'Aucune actualité dans cette catégorie.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Source Legend */}
      {!isLoading && !isError && articles && articles.length > 0 && (
        <div className="flex flex-wrap justify-center gap-4 pt-4 border-t border-border/30">
          {Object.entries(sourceColors).map(([source, colors]) => (
            <div key={source} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className={`w-2 h-2 rounded-full ${colors.text.replace('text-', 'bg-')}`} />
              <span>{source}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}