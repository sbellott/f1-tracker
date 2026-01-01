import { useState } from 'react';
import { Constructor } from '@/types';
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
  Building2,
  Trophy,
  MapPin
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface ConstructorsManagerProps {
  constructors: Constructor[];
  onUpdateConstructors: (constructors: Constructor[]) => void;
}

export function ConstructorsManager({ constructors, onUpdateConstructors }: ConstructorsManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingConstructor, setEditingConstructor] = useState<Constructor | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<Constructor>>({});

  const filteredConstructors = constructors.filter(constructor => 
    constructor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    constructor.base.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = () => {
    setIsCreating(true);
    setFormData({
      id: `constructor_${Date.now()}`,
      name: '',
      nationality: '',
      base: '',
      teamPrincipal: '',
      technicalDirector: '',
      engine: '',
      color: '#E10600',
      stats: {
        titles: 0,
        wins: 0,
        poles: 0,
        podiums: 0,
      },
    });
  };

  const handleEdit = (constructor: Constructor) => {
    setEditingConstructor(constructor);
    setFormData(constructor);
  };

  const handleSave = () => {
    if (!formData.name || !formData.nationality || !formData.base) {
      toast.error('Erreur', { description: 'Veuillez remplir tous les champs obligatoires' });
      return;
    }

    if (isCreating) {
      const newConstructors = [...constructors, formData as Constructor];
      onUpdateConstructors(newConstructors);
      toast.success('Écurie créée', { description: `${formData.name} a été ajoutée` });
    } else if (editingConstructor) {
      const updatedConstructors = constructors.map(c => 
        c.id === editingConstructor.id ? formData as Constructor : c
      );
      onUpdateConstructors(updatedConstructors);
      toast.success('Écurie modifiée', { description: `${formData.name} a été mise à jour` });
    }

    handleCancel();
  };

  const handleDelete = (constructor: Constructor) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${constructor.name} ?`)) {
      const updatedConstructors = constructors.filter(c => c.id !== constructor.id);
      onUpdateConstructors(updatedConstructors);
      toast.success('Écurie supprimée', { description: `${constructor.name} a été supprimée` });
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingConstructor(null);
    setFormData({});
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">Gestion des écuries</h2>
          <p className="text-muted-foreground text-lg">{constructors.length} écuries au total</p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Nouvelle écurie
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom ou base..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingConstructor) && (
        <Card className="border-primary/50 shadow-lg">
          <CardHeader>
            <CardTitle>{isCreating ? 'Nouvelle écurie' : 'Modifier l\'écurie'}</CardTitle>
            <CardDescription>
              {isCreating ? 'Remplissez les informations de la nouvelle écurie' : 'Modifiez les informations de l\'écurie'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de l'écurie *</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Red Bull Racing"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationality">Nationalité *</Label>
                <Input
                  id="nationality"
                  value={formData.nationality || ''}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  placeholder="Austrian"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="base">Base *</Label>
                <Input
                  id="base"
                  value={formData.base || ''}
                  onChange={(e) => setFormData({ ...formData, base: e.target.value })}
                  placeholder="Milton Keynes, Royaume-Uni"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teamPrincipal">Directeur d'équipe</Label>
                <Input
                  id="teamPrincipal"
                  value={formData.teamPrincipal || ''}
                  onChange={(e) => setFormData({ ...formData, teamPrincipal: e.target.value })}
                  placeholder="Christian Horner"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="technicalDirector">Directeur technique</Label>
                <Input
                  id="technicalDirector"
                  value={formData.technicalDirector || ''}
                  onChange={(e) => setFormData({ ...formData, technicalDirector: e.target.value })}
                  placeholder="Pierre Waché"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="engine">Moteur</Label>
                <Input
                  id="engine"
                  value={formData.engine || ''}
                  onChange={(e) => setFormData({ ...formData, engine: e.target.value })}
                  placeholder="Honda RBPT"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="titles">Titres constructeurs</Label>
                <Input
                  id="titles"
                  type="number"
                  value={formData.stats?.titles || 0}
                  onChange={(e) => setFormData({
                    ...formData,
                    stats: { ...formData.stats!, titles: parseInt(e.target.value) || 0 }
                  })}
                  placeholder="5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Couleur principale</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color || '#E10600'}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-20"
                  />
                  <Input
                    value={formData.color || '#E10600'}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#E10600"
                  />
                </div>
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

      {/* Constructors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredConstructors.map((constructor) => (
          <Card key={constructor.id} className="hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div 
                      className="w-12 h-12 rounded-xl"
                      style={{ backgroundColor: constructor.color }}
                    />
                    <div>
                      <h3 className="text-xl font-bold mb-1">{constructor.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5" />
                        {constructor.base}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleEdit(constructor)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleDelete(constructor)}
                      className="hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {constructor.stats?.titles > 0 && (
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <Trophy className="w-3.5 h-3.5" />
                        Titres
                      </div>
                      <div className="font-semibold">{constructor.stats.titles}</div>
                    </div>
                  )}
                  {constructor.stats?.wins > 0 && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground mb-1">Victoires</div>
                      <div className="font-semibold">{constructor.stats.wins}</div>
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  {constructor.teamPrincipal && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Directeur</span>
                      <span className="font-medium">{constructor.teamPrincipal}</span>
                    </div>
                  )}
                  {constructor.technicalDirector && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Dir. technique</span>
                      <span className="font-medium">{constructor.technicalDirector}</span>
                    </div>
                  )}
                  {constructor.engine && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Moteur</span>
                      <span className="font-medium">{constructor.engine}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredConstructors.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucune écurie trouvée</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'Essayez une autre recherche' : 'Commencez par ajouter une écurie'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
