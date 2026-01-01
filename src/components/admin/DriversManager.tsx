import { useState } from 'react';
import { Driver, Constructor } from '@/types';
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
  User,
  Flag,
  Calendar,
  Trophy
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface DriversManagerProps {
  drivers: Driver[];
  constructors: Constructor[];
  onUpdateDrivers: (drivers: Driver[]) => void;
}

// Extend Driver type to allow string for dateOfBirth in the form
type DriverFormData = Omit<Driver, 'dateOfBirth'> & {
  dateOfBirth: string | Date;
};

export function DriversManager({ drivers, constructors, onUpdateDrivers }: DriversManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<DriverFormData>>({});

  console.log('DriversManager render - editingDriver:', editingDriver, 'isCreating:', isCreating);

  const filteredDrivers = drivers.filter(driver => 
    driver.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.number.toString().includes(searchTerm)
  );

  const handleCreate = () => {
    setIsCreating(true);
    setFormData({
      id: `driver_${Date.now()}`,
      code: '',
      firstName: '',
      lastName: '',
      number: 0,
      nationality: '',
      dateOfBirth: new Date(),
      constructorId: constructors[0]?.id || '',
      photo: '',
      stats: {
        gp: 0,
        wins: 0,
        podiums: 0,
        poles: 0,
        fastestLaps: 0,
        points: 0,
        titles: 0
      }
    });
  };

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver);

    // Convert Date to string for the input field
    // Handle both Date objects and string representations
    let dateString: string;
    const dob = driver.dateOfBirth as Date | string;
    if (dob instanceof Date) {
      dateString = dob.toISOString().split('T')[0];
    } else if (typeof dob === 'string') {
      dateString = dob.split('T')[0];
    } else {
      dateString = new Date().toISOString().split('T')[0];
    }

    setFormData({
      ...driver,
      dateOfBirth: dateString
    });
  };

  const handleSave = () => {
    if (!formData.firstName || !formData.lastName || !formData.code || !formData.number || !formData.constructorId) {
      toast.error('Erreur', { description: 'Veuillez remplir tous les champs obligatoires' });
      return;
    }

    // Convert dateOfBirth string to Date object
    const processedData: Driver = {
      ...formData,
      id: formData.id || `driver_${Date.now()}`,
      code: formData.code || '',
      firstName: formData.firstName || '',
      lastName: formData.lastName || '',
      number: formData.number || 0,
      nationality: formData.nationality || '',
      dateOfBirth: formData.dateOfBirth instanceof Date 
        ? formData.dateOfBirth 
        : new Date(formData.dateOfBirth || new Date()),
      constructorId: formData.constructorId || '',
      stats: formData.stats || {
        gp: 0,
        wins: 0,
        podiums: 0,
        poles: 0,
        fastestLaps: 0,
        points: 0,
        titles: 0
      }
    } as Driver;

    if (isCreating) {
      const newDrivers = [...drivers, processedData];
      onUpdateDrivers(newDrivers);
      toast.success('Pilote créé', { description: `${processedData.firstName} ${processedData.lastName} a été ajouté` });
    } else if (editingDriver) {
      const updatedDrivers = drivers.map(d => 
        d.id === editingDriver.id ? processedData : d
      );
      onUpdateDrivers(updatedDrivers);
      toast.success('Pilote modifié', { description: `${processedData.firstName} ${processedData.lastName} a été mis à jour` });
    }

    handleCancel();
  };

  const handleDelete = (driver: Driver) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${driver.firstName} ${driver.lastName} ?`)) {
      const updatedDrivers = drivers.filter(d => d.id !== driver.id);
      onUpdateDrivers(updatedDrivers);
      toast.success('Pilote supprimé', { description: `${driver.firstName} ${driver.lastName} a été supprimé` });
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingDriver(null);
    setFormData({});
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">Gestion des pilotes</h2>
          <p className="text-muted-foreground text-lg">{drivers.length} pilotes au total</p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Nouveau pilote
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom ou numéro..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingDriver) && (
        <Card className="border-primary/50 shadow-lg">
          <CardHeader>
            <CardTitle>{isCreating ? 'Nouveau pilote' : 'Modifier le pilote'}</CardTitle>
            <CardDescription>
              {isCreating ? 'Remplissez les informations du nouveau pilote' : 'Modifiez les informations du pilote'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName || ''}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Max"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName || ''}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Verstappen"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code || ''}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="VER"
                  maxLength={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="number">Numéro *</Label>
                <Input
                  id="number"
                  type="number"
                  value={formData.number || ''}
                  onChange={(e) => setFormData({ ...formData, number: parseInt(e.target.value) })}
                  placeholder="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="constructorId">Écurie *</Label>
                <select
                  id="constructorId"
                  value={formData.constructorId || ''}
                  onChange={(e) => setFormData({ ...formData, constructorId: e.target.value })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {constructors.map(constructor => (
                    <option key={constructor.id} value={constructor.id}>
                      {constructor.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationality">Nationalité</Label>
                <Input
                  id="nationality"
                  value={formData.nationality || ''}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  placeholder="Néerlandais"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date de naissance</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString().split('T')[0] : ''}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="profileImage">URL de l'image</Label>
                <Input
                  id="profileImage"
                  value={formData.photo || ''}
                  onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Enregistrer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Drivers List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredDrivers.map((driver) => {
          const constructor = constructors.find(c => c.id === driver.constructorId);
          return (
            <Card key={driver.id} className="hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-16 h-16 rounded-xl font-bold text-2xl flex items-center justify-center text-white"
                      style={{ backgroundColor: constructor?.color || '#E10600' }}
                    >
                      {driver.number}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold">
                          {driver.firstName} {driver.lastName}
                        </h3>
                        <Badge variant="outline">{driver.nationality}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Trophy className="w-3.5 h-3.5" />
                          {constructor?.name || 'N/A'}
                        </div>
                        {driver.dateOfBirth && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(driver.dateOfBirth).getFullYear()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleEdit(driver)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleDelete(driver)}
                      className="hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredDrivers.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucun pilote trouvé</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'Essayez une autre recherche' : 'Commencez par ajouter un pilote'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}