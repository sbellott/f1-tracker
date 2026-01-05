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
      title: 'Drivers',
      value: drivers.length,
      description: 'Active drivers on the grid',
      icon: Users,
      color: 'primary',
    },
    {
      title: 'Teams',
      value: constructors.length,
      description: 'Teams competing',
      icon: Trophy,
      color: 'accent',
    },
    {
      title: 'Circuits',
      value: circuits.length,
      description: 'Circuits on the calendar',
      icon: MapPin,
      color: 'chart-3',
    },
    {
      title: 'Races',
      value: races.length,
      description: `${completedRaces} completed · ${upcomingRaces} upcoming`,
      icon: Calendar,
      color: 'chart-4',
    },
    {
      title: 'Sprints',
      value: sprintWeekends,
      description: 'Sprint weekends',
      icon: TrendingUp,
      color: 'chart-2',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
        <p className="text-muted-foreground text-lg">
          Administration overview
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
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Manage your F1 Tracker application data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer" onClick={onNavigateToDrivers}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">Manage drivers</div>
                  <div className="text-sm text-muted-foreground">Add, edit or delete</div>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-border/50 hover:border-accent/50 hover:bg-accent/5 transition-all cursor-pointer" onClick={onNavigateToConstructors}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <div className="font-semibold">Manage teams</div>
                  <div className="text-sm text-muted-foreground">Add, edit or delete</div>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-border/50 hover:border-chart-3/50 hover:bg-chart-3/5 transition-all cursor-pointer" onClick={onNavigateToCircuits}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-chart-3/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-chart-3" />
                </div>
                <div>
                  <div className="font-semibold">Manage circuits</div>
                  <div className="text-sm text-muted-foreground">Add, edit or delete</div>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-border/50 hover:border-chart-4/50 hover:bg-chart-4/5 transition-all cursor-pointer" onClick={onNavigateToRaces}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-chart-4/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-chart-4" />
                </div>
                <div>
                  <div className="font-semibold">Manage races</div>
                  <div className="text-sm text-muted-foreground">Add, edit or delete</div>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-border/50 hover:border-chart-2/50 hover:bg-chart-2/5 transition-all cursor-pointer" onClick={onNavigateToResults}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-chart-2/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-chart-2" />
                </div>
                <div>
                  <div className="font-semibold">Manage results</div>
                  <div className="text-sm text-muted-foreground">Add, edit or delete</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest changes made</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">Race added</div>
                <div className="text-xs text-muted-foreground">Monaco Grand Prix</div>
              </div>
              <div className="text-xs text-muted-foreground">2h ago</div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-accent" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">Driver modified</div>
                <div className="text-xs text-muted-foreground">Max Verstappen - Points updated</div>
              </div>
              <div className="text-xs text-muted-foreground">5h ago</div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className="w-8 h-8 rounded-lg bg-chart-3/10 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-chart-3" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">Circuit added</div>
                <div className="text-xs text-muted-foreground">Spa-Francorchamps Circuit</div>
              </div>
              <div className="text-xs text-muted-foreground">1d ago</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}