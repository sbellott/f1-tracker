import { useState } from 'react';
import { Race, Circuit, Session } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Save, 
  X, 
  Calendar,
  MapPin,
  Flag,
  Zap,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface RacesManagerProps {
  races: Race[];
  circuits: Circuit[];
  onUpdateRaces: (races: Race[]) => void;
}

export function RacesManager({ races, circuits, onUpdateRaces }: RacesManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRace, setEditingRace] = useState<Race | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<Race>>({});

  const filteredRaces = races.filter(race => 
    race.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = () => {
    setIsCreating(true);
    const raceId = `race_${Date.now()}`;
    const defaultSessions: Session[] = [
      { id: `session_fp1_${Date.now()}`, raceId, type: 'FP1', dateTime: new Date(), completed: false },
      { id: `session_fp2_${Date.now()}`, raceId, type: 'FP2', dateTime: new Date(), completed: false },
      { id: `session_fp3_${Date.now()}`, raceId, type: 'FP3', dateTime: new Date(), completed: false },
      { id: `session_qual_${Date.now()}`, raceId, type: 'QUALIFYING', dateTime: new Date(), completed: false },
      { id: `session_race_${Date.now()}`, raceId, type: 'RACE', dateTime: new Date(), completed: false },
    ];

    setFormData({
      id: raceId,
      name: '',
      round: races.length + 1,
      circuitId: circuits[0]?.id || '',
      date: new Date(),
      sessions: defaultSessions,
      hasSprint: false,
    });
  };

  const handleEdit = (race: Race) => {
    setEditingRace(race);
    setFormData(race);
  };

  const handleSave = () => {
    if (!formData.name || !formData.circuitId || !formData.sessions || formData.sessions.length === 0) {
      toast.error('Error', { description: 'Please fill in all required fields' });
      return;
    }

    if (isCreating) {
      const newRaces = [...races, formData as Race];
      onUpdateRaces(newRaces);
      toast.success('Race created', { description: `${formData.name} has been added` });
    } else if (editingRace) {
      const updatedRaces = races.map(r => 
        r.id === editingRace.id ? formData as Race : r
      );
      onUpdateRaces(updatedRaces);
      toast.success('Race updated', { description: `${formData.name} has been updated` });
    }

    handleCancel();
  };

  const handleDelete = (race: Race) => {
    if (window.confirm(`Are you sure you want to delete ${race.name}?`)) {
      const updatedRaces = races.filter(r => r.id !== race.id);
      onUpdateRaces(updatedRaces);
      toast.success('Race deleted', { description: `${race.name} has been deleted` });
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingRace(null);
    setFormData({});
  };

  const handleSessionUpdate = (index: number, field: keyof Session, value: any) => {
    const updatedSessions = [...(formData.sessions || [])];
    updatedSessions[index] = { ...updatedSessions[index], [field]: value };
    setFormData({ ...formData, sessions: updatedSessions });
  };

  const handleAddSprint = () => {
    const raceId = formData.id || `race_${Date.now()}`;
    const sprintSessions: Session[] = [
      { id: `session_fp1_${Date.now()}`, raceId, type: 'FP1', dateTime: new Date(), completed: false },
      { id: `session_sq_${Date.now()}`, raceId, type: 'SPRINT_QUALIFYING', dateTime: new Date(), completed: false },
      { id: `session_sprint_${Date.now()}`, raceId, type: 'SPRINT', dateTime: new Date(), completed: false },
      { id: `session_qual_${Date.now()}`, raceId, type: 'QUALIFYING', dateTime: new Date(), completed: false },
      { id: `session_race_${Date.now()}`, raceId, type: 'RACE', dateTime: new Date(), completed: false },
    ];
    setFormData({ ...formData, hasSprint: true, sessions: sprintSessions });
  };

  const handleRemoveSprint = () => {
    const raceId = formData.id || `race_${Date.now()}`;
    const regularSessions: Session[] = [
      { id: `session_fp1_${Date.now()}`, raceId, type: 'FP1', dateTime: new Date(), completed: false },
      { id: `session_fp2_${Date.now()}`, raceId, type: 'FP2', dateTime: new Date(), completed: false },
      { id: `session_fp3_${Date.now()}`, raceId, type: 'FP3', dateTime: new Date(), completed: false },
      { id: `session_qual_${Date.now()}`, raceId, type: 'QUALIFYING', dateTime: new Date(), completed: false },
      { id: `session_race_${Date.now()}`, raceId, type: 'RACE', dateTime: new Date(), completed: false },
    ];
    setFormData({ ...formData, hasSprint: false, sessions: regularSessions });
  };

  const sessionTypeLabels: Record<string, string> = {
    FP1: 'Free Practice 1',
    FP2: 'Free Practice 2',
    FP3: 'Free Practice 3',
    SPRINT_QUALIFYING: 'Sprint Qualifying',
    SPRINT: 'Sprint',
    QUALIFYING: 'Qualifying',
    RACE: 'Race',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">Race Management</h2>
          <p className="text-muted-foreground text-lg">{races.length} races total</p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          New race
        </Button>
      </div>

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

      {/* Create/Edit Form */}
      {(isCreating || editingRace) && (
        <Card className="border-primary/50 shadow-lg">
          <CardHeader>
            <CardTitle>{isCreating ? 'New race' : 'Edit race'}</CardTitle>
            <CardDescription>
              {isCreating ? 'Fill in the new race information' : 'Edit race information'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Race Name *</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Monaco Grand Prix"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="round">Round # *</Label>
                <Input
                  id="round"
                  type="number"
                  value={formData.round || ''}
                  onChange={(e) => setFormData({ ...formData, round: parseInt(e.target.value) })}
                  placeholder="6"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="circuitId">Circuit *</Label>
                <select
                  id="circuitId"
                  value={formData.circuitId || ''}
                  onChange={(e) => setFormData({ ...formData, circuitId: e.target.value })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {circuits.map(circuit => (
                    <option key={circuit.id} value={circuit.id}>
                      {circuit.name} - {circuit.city}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <Label>Race format</Label>
                  {formData.hasSprint ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRemoveSprint}
                      className="gap-2"
                    >
                      <X className="w-3.5 h-3.5" />
                      Remove Sprint
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleAddSprint}
                      className="gap-2"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Add Sprint
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  {formData.sessions?.map((session, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center p-3 rounded-lg border border-border/50 bg-muted/30">
                      <div className="col-span-4">
                        <Label className="text-xs text-muted-foreground mb-1">Session</Label>
                        <div className="font-medium text-sm">{sessionTypeLabels[session.type] || session.type}</div>
                      </div>
                      <div className="col-span-6">
                        <Label className="text-xs text-muted-foreground mb-1">Date and time</Label>
                        <Input
                          type="datetime-local"
                          value={session.dateTime ? new Date(session.dateTime).toISOString().slice(0, 16) : ''}
                          onChange={(e) => handleSessionUpdate(index, 'dateTime', new Date(e.target.value).toISOString())}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="col-span-2 flex items-end justify-center">
                        <Button
                          variant={session.completed ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleSessionUpdate(index, 'completed', !session.completed)}
                          className="gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {session.completed ? 'OK' : 'Upcoming'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Races List */}
      <div className="space-y-4">
        {filteredRaces.map((race) => {
          const circuit = circuits.find(c => c.id === race.circuitId);
          const completedSessions = race.sessions.filter(s => s.completed).length;
          const totalSessions = race.sessions.length;
          const isCompleted = completedSessions === totalSessions;
          const nextSession = race.sessions.find(s => !s.completed);

          return (
            <Card key={race.id} className="hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline" className="font-mono">
                        R{race.round}
                      </Badge>
                      <h3 className="text-xl font-bold">{race.name}</h3>
                      {race.hasSprint && (
                        <Badge className="gap-1 bg-chart-2 hover:bg-chart-2">
                          <Zap className="w-3 h-3" />
                          Sprint
                        </Badge>
                      )}
                      {isCompleted && (
                        <Badge className="gap-1 bg-chart-4 hover:bg-chart-4">
                          <CheckCircle2 className="w-3 h-3" />
                          Completed
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {circuit?.name} - {circuit?.city}, {circuit?.country}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleEdit(race)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleDelete(race)}
                      className="hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {race.sessions.map((session, index) => (
                    <div 
                      key={index}
                      className={`flex items-center justify-between p-2 rounded-lg text-sm ${
                        session.completed 
                          ? 'bg-chart-4/10 border border-chart-4/20' 
                          : nextSession === session
                          ? 'bg-primary/10 border border-primary/20'
                          : 'bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {session.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-chart-4" />
                        ) : nextSession === session ? (
                          <Clock className="w-4 h-4 text-primary" />
                        ) : (
                          <div className="w-4 h-4" />
                        )}
                        <span className="font-medium">
                          {sessionTypeLabels[session.type] || session.type}
                        </span>
                      </div>
                      <div className="text-muted-foreground">
                        {new Date(session.dateTime).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                  <div>
                    Progress: {completedSessions}/{totalSessions} sessions
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {nextSession ? (
                      <>Next: {new Date(nextSession.dateTime).toLocaleDateString('en-US')}</>
                    ) : (
                      <>Completed</>
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
            <h3 className="text-lg font-semibold mb-2">No races found</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'Try another search' : 'Start by adding a race'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}