import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Users, MapPin, Calendar, Target, TrendingUp } from 'lucide-react';
import { Driver, Constructor, Circuit, Race } from '@/types';

interface AdminDashboardProps {
  drivers: Driver[];
  constructors: Constructor[];
  circuits: Circuit[];
  races: Race[];
  onNavigateToDrivers?: () => void;
  onNavigateToConstructors?: () => void;
  onNavigateToCircuits?: () => void;
  onNavigateToRaces?: () => void;
  onNavigateToResults?: () => void;
}

export function AdminDashboard({ 
  drivers, 
  constructors, 
  circuits, 
  races,
  onNavigateToDrivers,
  onNavigateToConstructors,
  onNavigateToCircuits,
  onNavigateToRaces,
  onNavigateToResults,
}: AdminDashboardProps) {
  const completedRaces = races.filter(r => r.sessions.every(s => s.completed)).length;
  const upcomingRaces = races.length - completedRaces;
  const sprintWeekends = races.filter(r => r.hasSprint).length;

  const stats = [
    {
      title: 'Pilotes',
      value: drivers.length,
      description: 'Pilotes actifs sur la grille',
      icon: Users,
      color: 'primary',
    },
    {
      title: 'Écuries',
      value: constructors.length,
      description: 'Équipes en compétition',
      icon: Trophy,
      color: 'accent',
    },
    {
      title: 'Circuits',
      value: circuits.length,
      description: 'Circuits au calendrier',
      icon: MapPin,
      color: 'chart-3',
    },
    {
      title: 'Courses',
      value: races.length,
      description: `${completedRaces} terminées · ${upcomingRaces} à venir`,
      icon: Calendar,
      color: 'chart-4',
    },
    {
      title: 'Sprints',
      value: sprintWeekends,
      description: 'Weekends avec Sprint',
      icon: TrendingUp,
      color: 'chart-2',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-2">Tableau de bord</h2>
        <p className="text-muted-foreground text-lg">
          Vue d'ensemble de l'administration
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-lg transition-all border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{stat.title}</CardTitle>
                  <div className={`w-10 h-10 rounded-xl bg-${stat.color}/10 flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 text-${stat.color}`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-1">{stat.value}</div>
                <p className="text-sm text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
          <CardDescription>Gérez les données de votre application F1 Tracker</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer" onClick={onNavigateToDrivers}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">Gérer les pilotes</div>
                  <div className="text-sm text-muted-foreground">Ajouter, modifier ou supprimer</div>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-border/50 hover:border-accent/50 hover:bg-accent/5 transition-all cursor-pointer" onClick={onNavigateToConstructors}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <div className="font-semibold">Gérer les écuries</div>
                  <div className="text-sm text-muted-foreground">Ajouter, modifier ou supprimer</div>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-border/50 hover:border-chart-3/50 hover:bg-chart-3/5 transition-all cursor-pointer" onClick={onNavigateToCircuits}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-chart-3/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-chart-3" />
                </div>
                <div>
                  <div className="font-semibold">Gérer les circuits</div>
                  <div className="text-sm text-muted-foreground">Ajouter, modifier ou supprimer</div>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-border/50 hover:border-chart-4/50 hover:bg-chart-4/5 transition-all cursor-pointer" onClick={onNavigateToRaces}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-chart-4/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-chart-4" />
                </div>
                <div>
                  <div className="font-semibold">Gérer les courses</div>
                  <div className="text-sm text-muted-foreground">Ajouter, modifier ou supprimer</div>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-border/50 hover:border-chart-2/50 hover:bg-chart-2/5 transition-all cursor-pointer" onClick={onNavigateToResults}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-chart-2/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-chart-2" />
                </div>
                <div>
                  <div className="font-semibold">Gérer les résultats</div>
                  <div className="text-sm text-muted-foreground">Ajouter, modifier ou supprimer</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Activité récente</CardTitle>
          <CardDescription>Dernières modifications apportées</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">Course ajoutée</div>
                <div className="text-xs text-muted-foreground">Grand Prix de Monaco</div>
              </div>
              <div className="text-xs text-muted-foreground">Il y a 2h</div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-accent" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">Pilote modifié</div>
                <div className="text-xs text-muted-foreground">Max Verstappen - Points mis à jour</div>
              </div>
              <div className="text-xs text-muted-foreground">Il y a 5h</div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className="w-8 h-8 rounded-lg bg-chart-3/10 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-chart-3" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">Circuit ajouté</div>
                <div className="text-xs text-muted-foreground">Circuit de Spa-Francorchamps</div>
              </div>
              <div className="text-xs text-muted-foreground">Il y a 1j</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}