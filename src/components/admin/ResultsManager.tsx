import { useState } from 'react';
import { Race, Circuit, Driver, Constructor } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Trophy, 
  Flag, 
  Search, 
  Save, 
  X,
  MapPin,
  Calendar,
  User,
  Clock,
  Zap,
  Award
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface RaceResult {
  position: number;
  driverId: string;
  points: number;
  fastestLap: boolean;
  polePosition: boolean;
}

interface ResultsManagerProps {
  races: Race[];
  circuits: Circuit[];
  drivers: Driver[];
  constructors: Constructor[];
}

export function ResultsManager({ races, circuits, drivers, constructors }: ResultsManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [sessionType, setSessionType] = useState<'RACE' | 'SPRINT'>('RACE');
  const [results, setResults] = useState<RaceResult[]>([]);

  const filteredRaces = races.filter(race => 
    race.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectRace = (race: Race) => {
    setSelectedRace(race);
    // Initialize empty results for top 10
    const initialResults: RaceResult[] = Array.from({ length: 10 }, (_, i) => ({
      position: i + 1,
      driverId: '',
      points: 0,
      fastestLap: false,
      polePosition: false,
    }));
    setResults(initialResults);
  };

  const handleUpdateResult = (position: number, field: keyof RaceResult, value: any) => {
    const updatedResults = results.map(r => 
      r.position === position ? { ...r, [field]: value } : r
    );
    setResults(updatedResults);
  };

  const handleSaveResults = () => {
    if (!selectedRace) return;

    // Validate that all positions have a driver
    const hasEmptyPositions = results.some(r => !r.driverId);
    if (hasEmptyPositions) {
      toast.error('Error', { description: 'All drivers must be selected' });
      return;
    }

    toast.success('Results saved', { 
      description: `The results of ${selectedRace.name} have been saved` 
    });
    setSelectedRace(null);
    setResults([]);
  };

  const handleCancel = () => {
    setSelectedRace(null);
    setResults([]);
  };

  const pointsSystem = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

  const getDriverName = (driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    return driver ? `${driver.firstName} ${driver.lastName}` : '';
  };

  const getDriverNumber = (driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    return driver?.number || '';
  };

  const getConstructorColor = (driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    if (!driver) return '#E10600';
    const constructor = constructors.find(c => c.id === driver.constructorId);
    return constructor?.color || '#E10600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">Results Management</h2>
          <p className="text-muted-foreground text-lg">Enter race and sprint results</p>
        </div>
      </div>

      {!selectedRace ? (
        <>
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search for a race..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Races List */}
          <div className="space-y-4">
            {filteredRaces.map((race) => {
              const circuit = circuits.find(c => c.id === race.circuitId);
              const hasRace = race.sessions.some(s => s.type === 'RACE');
              const hasSprint = race.hasSprint;
              
              return (
                <Card key={race.id} className="hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline" className="font-mono">R{race.round}</Badge>
                          <h3 className="text-xl font-bold">{race.name}</h3>
                          {race.hasSprint && (
                            <Badge className="gap-1 bg-chart-2 hover:bg-chart-2">
                              <Zap className="w-3 h-3" />
                              Sprint
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          {circuit?.name} - {circuit?.city}, {circuit?.country}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasSprint && (
                          <Button 
                            onClick={() => {
                              setSessionType('SPRINT');
                              handleSelectRace(race);
                            }}
                            className="gap-2"
                          >
                            <Zap className="w-4 h-4" />
                            Sprint Results
                          </Button>
                        )}
                        {hasRace && (
                          <Button 
                            onClick={() => {
                              setSessionType('RACE');
                              handleSelectRace(race);
                            }}
                            className="gap-2"
                          >
                            <Flag className="w-4 h-4" />
                            Race Results
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredRaces.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Flag className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No race found</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Try another search' : 'No races available'}
                </p>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card className="border-primary/50 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">
                  {selectedRace.name} - {sessionType === 'RACE' ? 'Race' : 'Sprint'}
                </CardTitle>
                <CardDescription className="text-base">
                  Enter the Top 10 results
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-lg font-mono px-3 py-1">
                Round {selectedRace.round}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Results Grid */}
            <div className="space-y-3">
              {results.map((result) => (
                <div 
                  key={result.position}
                  className="grid grid-cols-12 gap-3 items-center p-4 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/50 transition-all"
                >
                  {/* Position */}
                  <div className="col-span-1">
                    <div className="flex items-center justify-center">
                      {result.position <= 3 ? (
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                          style={{
                            backgroundColor: 
                              result.position === 1 ? '#FFD700' : 
                              result.position === 2 ? '#C0C0C0' : 
                              '#CD7F32'
                          }}
                        >
                          {result.position}
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center font-bold text-lg">
                          {result.position}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Driver Selection */}
                  <div className="col-span-6">
                    <select
                      value={result.driverId}
                      onChange={(e) => {
                        handleUpdateResult(result.position, 'driverId', e.target.value);
                        const points = pointsSystem[result.position - 1] || 0;
                        handleUpdateResult(result.position, 'points', points);
                      }}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      style={{
                        borderLeft: result.driverId ? `4px solid ${getConstructorColor(result.driverId)}` : undefined
                      }}
                    >
                      <option value="">Select a driver...</option>
                      {drivers.map(driver => (
                        <option key={driver.id} value={driver.id}>
                          #{driver.number} - {driver.firstName} {driver.lastName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Points */}
                  <div className="col-span-2">
                    <Input
                      type="number"
                      value={result.points}
                      onChange={(e) => handleUpdateResult(result.position, 'points', parseInt(e.target.value) || 0)}
                      className="text-center font-bold"
                      placeholder="Pts"
                    />
                  </div>

                  {/* Pole Position (only position 1) */}
                  <div className="col-span-1.5">
                    {result.position === 1 && (
                      <Button
                        variant={result.polePosition ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleUpdateResult(result.position, 'polePosition', !result.polePosition)}
                        className="w-full gap-1"
                        title="Pole Position"
                      >
                        <Award className="w-3.5 h-3.5" />
                        Pole
                      </Button>
                    )}
                  </div>

                  {/* Fastest Lap */}
                  <div className="col-span-1.5">
                    <Button
                      variant={result.fastestLap ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        // Remove fastest lap from all others
                        const updatedResults = results.map(r => ({
                          ...r,
                          fastestLap: r.position === result.position ? !result.fastestLap : false
                        }));
                        setResults(updatedResults);
                      }}
                      className="w-full gap-1"
                      title="Meilleur tour"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      FL
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground mb-1">Selected drivers</div>
                    <div className="text-2xl font-bold">
                      {results.filter(r => r.driverId).length}/10
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Points distributed</div>
                    <div className="text-2xl font-bold">
                      {results.reduce((sum, r) => sum + r.points, 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Fastest lap</div>
                    <div className="text-lg font-semibold">
                      {results.find(r => r.fastestLap)?.driverId 
                        ? getDriverName(results.find(r => r.fastestLap)!.driverId)
                        : 'Not assigned'
                      }
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={handleCancel} size="lg">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSaveResults} size="lg">
                <Save className="w-4 h-4 mr-2" />
                Save results
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}