import { useState } from 'react';
import { Driver, Constructor, Circuit, Race } from '@/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LayoutDashboard, 
  Users, 
  Trophy, 
  MapPin, 
  Calendar,
  X,
  Shield,
  Flag
} from 'lucide-react';
import { AdminDashboard } from './AdminDashboard';
import { DriversManager } from './DriversManager';
import { ConstructorsManager } from './ConstructorsManager';
import { CircuitsManager } from './CircuitsManager';
import { RacesManager } from './RacesManager';
import { ResultsManager } from './ResultsManager';
import { Card, CardContent } from '@/components/ui/card';

interface AdminPanelProps {
  drivers: Driver[];
  constructors: Constructor[];
  circuits: Circuit[];
  races: Race[];
  onUpdateDrivers: (drivers: Driver[]) => void;
  onUpdateConstructors: (constructors: Constructor[]) => void;
  onUpdateCircuits: (circuits: Circuit[]) => void;
  onUpdateRaces: (races: Race[]) => void;
  onClose: () => void;
}

export function AdminPanel({
  drivers,
  constructors,
  circuits,
  races,
  onUpdateDrivers,
  onUpdateConstructors,
  onUpdateCircuits,
  onUpdateRaces,
  onClose,
}: AdminPanelProps) {
  const [currentTab, setCurrentTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <div className="sticky top-0 z-50 backdrop-blur-2xl bg-gradient-to-r from-primary via-primary/95 to-primary/90 border-b border-primary-foreground/10 shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Administration</h1>
                <p className="text-xs text-white/80">F1 Tracker Management</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              onClick={onClose}
              className="text-white hover:bg-white/10"
            >
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          </div>
        </div>
      </div>

      {/* Admin Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-8">
          <TabsList className="inline-flex w-auto bg-muted/50 p-1.5 rounded-2xl">
            <TabsTrigger value="dashboard" className="gap-2 rounded-xl data-[state=active]:shadow-sm">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="drivers" className="gap-2 rounded-xl data-[state=active]:shadow-sm">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Drivers</span>
            </TabsTrigger>
            <TabsTrigger value="constructors" className="gap-2 rounded-xl data-[state=active]:shadow-sm">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Teams</span>
            </TabsTrigger>
            <TabsTrigger value="circuits" className="gap-2 rounded-xl data-[state=active]:shadow-sm">
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">Circuits</span>
            </TabsTrigger>
            <TabsTrigger value="races" className="gap-2 rounded-xl data-[state=active]:shadow-sm">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Races</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-2 rounded-xl data-[state=active]:shadow-sm">
              <Flag className="w-4 h-4" />
              <span className="hidden sm:inline">Results</span>
            </TabsTrigger>
          </TabsList>

          {/* Info Banner */}
          <Card className="border-amber-200 dark:border-amber-900/30 bg-gradient-to-br from-amber-50 to-amber-50/50 dark:from-amber-950/20 dark:to-amber-950/10">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <div className="text-2xl">⚠️</div>
                <div>
                  <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                    Demo mode
                  </h4>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    Changes are not saved. Connect Supabase to enable data persistence.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <TabsContent value="dashboard" className="space-y-8 fade-in">
            <AdminDashboard 
              drivers={drivers}
              constructors={constructors}
              circuits={circuits}
              races={races}
              onNavigateToDrivers={() => setCurrentTab('drivers')}
              onNavigateToConstructors={() => setCurrentTab('constructors')}
              onNavigateToCircuits={() => setCurrentTab('circuits')}
              onNavigateToRaces={() => setCurrentTab('races')}
              onNavigateToResults={() => setCurrentTab('results')}
            />
          </TabsContent>

          <TabsContent value="drivers" className="space-y-8 fade-in">
            <DriversManager 
              drivers={drivers}
              constructors={constructors}
              onUpdateDrivers={onUpdateDrivers}
            />
          </TabsContent>

          <TabsContent value="constructors" className="space-y-8 fade-in">
            <ConstructorsManager 
              constructors={constructors}
              onUpdateConstructors={onUpdateConstructors}
            />
          </TabsContent>

          <TabsContent value="circuits" className="space-y-8 fade-in">
            <CircuitsManager 
              circuits={circuits}
              onUpdateCircuits={onUpdateCircuits}
            />
          </TabsContent>

          <TabsContent value="races" className="space-y-8 fade-in">
            <RacesManager 
              races={races}
              circuits={circuits}
              onUpdateRaces={onUpdateRaces}
            />
          </TabsContent>

          <TabsContent value="results" className="space-y-8 fade-in">
            <ResultsManager 
              races={races}
              circuits={circuits}
              drivers={drivers}
              constructors={constructors}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}