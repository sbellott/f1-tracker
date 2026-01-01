import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Newspaper, ExternalLink, Clock, TrendingUp, Users, Wrench, Trophy } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

type NewsCategory = 'all' | 'teams' | 'drivers' | 'technical' | 'results';

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  category: NewsCategory;
  source: string;
  publishedAt: string;
  imageUrl: string;
  url: string;
  featured?: boolean;
}

const mockNews: NewsArticle[] = [
  {
    id: '1',
    title: "Red Bull Racing domine les essais d'Abu Dhabi",
    summary: "Max Verstappen signe le meilleur temps lors de la dernière journée d'essais de la saison, confirmant la suprématie de RB20.",
    category: 'teams',
    source: 'F1.com',
    publishedAt: '2026-12-29T10:30:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1590839258959-ed53c78e0c63?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    url: '#',
    featured: true,
  },
  {
    id: '2',
    title: "Charles Leclerc prolonge chez Ferrari jusqu'en 2029",
    summary: "La Scuderia Ferrari annonce la prolongation de contrat de son pilote monégasque pour 5 années supplémentaires.",
    category: 'drivers',
    source: 'Motorsport.com',
    publishedAt: '2026-12-28T15:45:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1587019158091-1a103c5dd17f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    url: '#',
    featured: true,
  },
  {
    id: '3',
    title: "Nouveaux développements aérodynamiques pour 2025",
    summary: "La FIA annonce des modifications des règlements techniques pour favoriser les dépassements et réduire l'effet de sol.",
    category: 'technical',
    source: 'Auto Hebdo',
    publishedAt: '2026-12-27T09:15:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    url: '#',
  },
  {
    id: '4',
    title: "McLaren confirme ses ambitions pour le titre constructeurs",
    summary: "Andrea Stella dévoile la stratégie de développement agressive de l'équipe pour la saison 2025.",
    category: 'teams',
    source: 'NextGen Auto',
    publishedAt: '2026-12-26T14:20:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    url: '#',
  },
  {
    id: '5',
    title: "Lewis Hamilton : 'Ma dernière année chez Mercedes sera spéciale'",
    summary: "Le septuple champion du monde évoque son transfert imminent chez Ferrari et ses derniers mois avec l'équipe allemande.",
    category: 'drivers',
    source: 'F1.com',
    publishedAt: '2026-12-25T11:00:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1623847704746-32f8c5db148c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    url: '#',
  },
  {
    id: '6',
    title: "Victoire dominante de Verstappen à Abu Dhabi",
    summary: "Le Néerlandais remporte la dernière course de la saison devant Norris et Leclerc, clôturant une saison record.",
    category: 'results',
    source: 'Motorsport.com',
    publishedAt: '2026-12-24T17:30:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1541443131876-44b03de101c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    url: '#',
  },
];

const categoryIcons = {
  teams: Users,
  drivers: Trophy,
  technical: Wrench,
  results: TrendingUp,
  all: Newspaper,
};

const categoryLabels = {
  all: 'Toutes',
  teams: 'Écuries',
  drivers: 'Pilotes',
  technical: 'Technique',
  results: 'Résultats',
};

export function News() {
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory>('all');

  const filteredNews = selectedCategory === 'all' 
    ? mockNews 
    : mockNews.filter(article => article.category === selectedCategory);

  const featuredNews = mockNews.filter(article => article.featured);
  const regularNews = filteredNews.filter(article => !article.featured);

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Il y a quelques minutes";
    if (diffInHours === 1) return "Il y a 1 heure";
    if (diffInHours < 24) return `Il y a ${diffInHours} heures`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "Il y a 1 jour";
    return `Il y a ${diffInDays} jours`;
  };

  return (
    <div className="space-y-8 fade-in">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold mb-2">Actualités F1</h2>
        <p className="text-muted-foreground text-lg">Les dernières nouvelles de la Formule 1</p>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-3">
        {(Object.keys(categoryLabels) as NewsCategory[]).map((category) => {
          const Icon = categoryIcons[category];
          return (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(category)}
              className="rounded-xl gap-2"
            >
              <Icon className="w-4 h-4" />
              {categoryLabels[category]}
            </Button>
          );
        })}
      </div>

      {/* Featured News */}
      {selectedCategory === 'all' && featuredNews.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            À la une
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {featuredNews.map((article) => {
              const Icon = categoryIcons[article.category];
              return (
                <Card 
                  key={article.id} 
                  className="overflow-hidden group cursor-pointer hover:shadow-xl transition-all border-border/50"
                >
                  <div className="relative h-64 overflow-hidden">
                    <ImageWithFallback
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                    <Badge 
                      className="absolute top-4 left-4 backdrop-blur-xl bg-black/60 text-white border-0"
                    >
                      <Icon className="w-3 h-3 mr-1.5" />
                      {categoryLabels[article.category]}
                    </Badge>
                    <Badge 
                      variant="secondary"
                      className="absolute top-4 right-4 backdrop-blur-xl bg-primary text-white border-0 font-semibold"
                    >
                      À la une
                    </Badge>
                  </div>
                  <CardHeader>
                    <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                      {article.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {article.summary}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {getTimeAgo(article.publishedAt)}
                      </div>
                      <span className="font-medium">{article.source}</span>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full rounded-xl gap-2"
                      onClick={() => window.open(article.url, '_blank')}
                    >
                      Lire l'article
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Regular News Grid */}
      {regularNews.length > 0 && (
        <div className="space-y-4">
          {selectedCategory !== 'all' && (
            <h3 className="font-bold flex items-center gap-2">
              {(() => {
                const Icon = categoryIcons[selectedCategory];
                return <Icon className="w-5 h-5 text-primary" />;
              })()}
              {categoryLabels[selectedCategory]}
            </h3>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularNews.map((article) => {
              const Icon = categoryIcons[article.category];
              return (
                <Card 
                  key={article.id} 
                  className="overflow-hidden group cursor-pointer hover:shadow-xl transition-all border-border/50 flex flex-col"
                >
                  <div className="relative h-48 overflow-hidden">
                    <ImageWithFallback
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <Badge 
                      className="absolute top-3 left-3 backdrop-blur-xl bg-black/60 text-white border-0 text-xs"
                    >
                      <Icon className="w-3 h-3 mr-1" />
                      {categoryLabels[article.category]}
                    </Badge>
                  </div>
                  <CardHeader className="flex-1">
                    <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                      {article.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-3">
                      {article.summary}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {getTimeAgo(article.publishedAt)}
                      </div>
                      <span className="font-medium">{article.source}</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full rounded-xl gap-2"
                      onClick={() => window.open(article.url, '_blank')}
                    >
                      Lire
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredNews.length === 0 && (
        <Card className="border-border/50 border-dashed">
          <CardContent className="py-16 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Newspaper className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="font-bold mb-2">Aucune actualité</h3>
            <p className="text-muted-foreground">
              Aucune actualité disponible dans cette catégorie pour le moment.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
