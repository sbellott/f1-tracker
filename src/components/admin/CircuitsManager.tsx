import { useState } from 'react';
import { Circuit } from '@/types';
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
  MapPin,
  Ruler,
  Clock
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface CircuitsManagerProps {
  circuits: Circuit[];
  onUpdateCircuits: (circuits: Circuit[]) => void;
}

export function CircuitsManager({ circuits, onUpdateCircuits }: CircuitsManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCircuit, setEditingCircuit] = useState<Circuit | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<Circuit>>({});

  const filteredCircuits = circuits.filter(circuit =>
    circuit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    circuit.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    circuit.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = () => {
    setIsCreating(true);
    setFormData({
      id: `circuit_${Date.now()}`,
      name: '',
      city: '',
      country: '',
      length: 0,
      turns: 0,
      firstGP: new Date().getFullYear(),
      lapRecord: '',
      lapRecordHolder: '',
      lapRecordYear: new Date().getFullYear(),
    });
  };

  const handleEdit = (circuit: Circuit) => {
    setEditingCircuit(circuit);
    setFormData(circuit);
  };

  const handleSave = () => {
    if (!formData.name || !formData.city || !formData.country || !formData.length) {
      toast.error('Error', { description: 'Please fill in all required fields' });
      return;
    }

    if (isCreating) {
      const newCircuits = [...circuits, formData as Circuit];
      onUpdateCircuits(newCircuits);
      toast.success('Circuit created', { description: `${formData.name} has been added` });
    } else if (editingCircuit) {
      const updatedCircuits = circuits.map(c => 
        c.id === editingCircuit.id ? formData as Circuit : c
      );
      onUpdateCircuits(updatedCircuits);
      toast.success('Circuit updated', { description: `${formData.name} has been updated` });
    }

    handleCancel();
  };

  const handleDelete = (circuit: Circuit) => {
    if (window.confirm(`Are you sure you want to delete ${circuit.name}?`)) {
      const updatedCircuits = circuits.filter(c => c.id !== circuit.id);
      onUpdateCircuits(updatedCircuits);
      toast.success('Circuit deleted', { description: `${circuit.name} has been deleted` });
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingCircuit(null);
    setFormData({});
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">Circuit Management</h2>
          <p className="text-muted-foreground text-lg">{circuits.length} circuits total</p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          New circuit
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, city or country..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingCircuit) && (
        <Card className="border-primary/50 shadow-lg">
          <CardHeader>
            <CardTitle>{isCreating ? 'New circuit' : 'Edit circuit'}</CardTitle>
            <CardDescription>
              {isCreating ? 'Fill in the new circuit information' : 'Edit circuit information'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Circuit Name *</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Circuit de Monaco"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Monte-Carlo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  value={formData.country || ''}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="Monaco"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="length">Length (km) *</Label>
                <Input
                  id="length"
                  type="number"
                  step="0.001"
                  value={formData.length || ''}
                  onChange={(e) => setFormData({ ...formData, length: parseFloat(e.target.value) })}
                  placeholder="5.412"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="turns">Number of turns</Label>
                <Input
                  id="turns"
                  type="number"
                  value={formData.turns || ''}
                  onChange={(e) => setFormData({ ...formData, turns: parseInt(e.target.value) })}
                  placeholder="19"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Lap Record</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Input
                    placeholder="Time (e.g. 1:14.260)"
                    value={formData.lapRecord || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      lapRecord: e.target.value
                    })}
                  />
                  <Input
                    placeholder="Driver"
                    value={formData.lapRecordHolder || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      lapRecordHolder: e.target.value
                    })}
                  />
                  <Input
                    type="number"
                    placeholder="Year"
                    value={formData.lapRecordYear || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      lapRecordYear: parseInt(e.target.value) || undefined
                    })}
                  />
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

      {/* Circuits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCircuits.map((circuit) => (
          <Card key={circuit.id} className="hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{circuit.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <MapPin className="w-4 h-4" />
                      {circuit.city}, {circuit.country}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleEdit(circuit)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleDelete(circuit)}
                      className="hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <Ruler className="w-3.5 h-3.5" />
                      Length
                    </div>
                    <div className="font-semibold">{circuit.length} km</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <Clock className="w-3.5 h-3.5" />
                      Turns
                    </div>
                    <div className="font-semibold">{circuit.turns || 'N/A'}</div>
                  </div>
                </div>

                {circuit.lapRecord && (
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="text-xs text-muted-foreground mb-1">Lap Record</div>
                    <div className="font-semibold text-sm">
                      {circuit.lapRecord} · {circuit.lapRecordHolder} ({circuit.lapRecordYear})
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCircuits.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No circuits found</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'Try another search' : 'Start by adding a circuit'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}