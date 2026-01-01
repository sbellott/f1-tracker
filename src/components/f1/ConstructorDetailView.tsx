import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trophy, Users, Flag, TrendingUp, Award, Star } from 'lucide-react';
import { Constructor, Driver } from '@/types';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ConstructorDetailViewProps {
  constructor: Constructor;
  drivers: Driver[];
  onBack: () => void;
  constructorImage: string;
}

export function ConstructorDetailView({
  constructor,
  drivers,
  onBack,
  constructorImage,
}: ConstructorDetailViewProps) {
  const teamDrivers = drivers.filter(d => d.constructorId === constructor.id);
  
  return (
    <div className="space-y-8 fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="rounded-xl"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold">{constructor.name}</h2>
          <p className="text-muted-foreground text-lg">Écurie de Formule 1</p>
        </div>
      </div>

      {/* Hero Image */}
      <div className="relative h-96 rounded-3xl overflow-hidden group">
        <ImageWithFallback
          src={constructorImage}
          alt={constructor.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(circle at center, ${constructor.color} 0%, transparent 70%)`
          }}
        />
        
        {/* Team Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="flex items-end justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div 
                  className="w-20 h-20 rounded-2xl shadow-2xl flex items-center justify-center backdrop-blur-xl bg-white/10 border border-white/20"
                  style={{ 
                    boxShadow: `0 0 30px ${constructor.color}40`
                  }}
                >
                  <Flag className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white mb-1">{constructor.name}</h1>
                  <div className="flex items-center gap-2">
                    <Badge 
                      className="text-white border-white/30"
                      style={{ 
                        backgroundColor: `${constructor.color}90`,
                      }}
                    >
                      {constructor.base}
                    </Badge>
                    {constructor.stats.titles > 0 && (
                      <Badge className="bg-amber-500/90 text-white border-0">
                        {constructor.stats.titles}× Champions
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <Trophy className="w-8 h-8 mx-auto mb-3 text-amber-500" />
              <div className="text-4xl font-bold mb-1">{constructor.stats.wins}</div>
              <div className="text-sm text-muted-foreground">Victoires</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <Award className="w-8 h-8 mx-auto mb-3 text-primary" />
              <div className="text-4xl font-bold mb-1">{constructor.stats.podiums}</div>
              <div className="text-sm text-muted-foreground">Podiums</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <Star className="w-8 h-8 mx-auto mb-3 text-accent" />
              <div className="text-4xl font-bold mb-1">{constructor.stats.poles}</div>
              <div className="text-sm text-muted-foreground">Pole Positions</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <Flag className="w-8 h-8 mx-auto mb-3 text-chart-3" />
              <div className="text-4xl font-bold mb-1">{constructor.stats.titles}</div>
              <div className="text-sm text-muted-foreground">Titres</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flag className="w-5 h-5" />
              Informations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
              <span className="text-muted-foreground">Base</span>
              <span className="font-bold">{constructor.base}</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
              <span className="text-muted-foreground">Directeur</span>
              <span className="font-bold">{constructor.teamPrincipal}</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
              <span className="text-muted-foreground">Dir. Technique</span>
              <span className="font-bold">{constructor.technicalDirector}</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
              <span className="text-muted-foreground">Moteur</span>
              <span className="font-bold">{constructor.engine}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Pilotes {new Date().getFullYear()}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {teamDrivers.map(driver => (
              <div 
                key={driver.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-muted/50 to-muted/30 hover:from-muted/70 hover:to-muted/40 transition-all group cursor-pointer"
              >
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-lg"
                  style={{ backgroundColor: constructor.color }}
                >
                  {driver.number}
                </div>
                <div className="flex-1">
                  <div className="font-bold group-hover:text-primary transition-colors">
                    {driver.firstName} {driver.lastName}
                  </div>
                  <div className="text-sm text-muted-foreground">{driver.nationality}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{driver.stats.wins}</div>
                  <div className="text-xs text-muted-foreground">Victoires</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      <Card className="border-border/50 overflow-hidden">
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            background: `linear-gradient(135deg, ${constructor.color} 0%, transparent 100%)`
          }}
        />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Palmarès
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20">
              <Trophy className="w-12 h-12 mx-auto mb-3 text-amber-500" />
              <div className="text-5xl font-bold mb-2">{constructor.stats.titles}</div>
              <div className="text-muted-foreground">Championnats Constructeurs</div>
            </div>
            
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 text-primary" />
              <div className="text-5xl font-bold mb-2">{constructor.stats.wins}</div>
              <div className="text-muted-foreground">Victoires en Course</div>
            </div>
            
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
              <Star className="w-12 h-12 mx-auto mb-3 text-accent" />
              <div className="text-5xl font-bold mb-2">{constructor.stats.poles}</div>
              <div className="text-muted-foreground">Pole Positions</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
