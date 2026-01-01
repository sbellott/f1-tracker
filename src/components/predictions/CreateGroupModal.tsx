import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Sparkles } from 'lucide-react';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

export function CreateGroupModal({ isOpen, onClose, onCreate }: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    setIsLoading(true);
    onCreate(groupName.trim());
    setIsLoading(false);
    setGroupName('');
  };

  const suggestedNames = [
    'Les Fous du Volant 🏎️',
    'Team Verstappen',
    'Ferrari Tifosi',
    'Mercedes Gang',
    'Red Bull Racing',
    'Écurie des Champions',
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-white" />
          </div>
          <DialogTitle className="text-2xl">Créer un groupe</DialogTitle>
          <DialogDescription>
            Créez un nouveau groupe de pronostics et invitez vos amis à vous rejoindre
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="groupName">Nom du groupe</Label>
            <Input
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Ex: Les Champions F1"
              maxLength={50}
              autoFocus
              className="h-12"
            />
            <p className="text-xs text-muted-foreground">
              {groupName.length}/50 caractères
            </p>
          </div>

          {/* Suggestions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="w-4 h-4" />
              <span>Suggestions</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestedNames.map((name, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setGroupName(name)}
                  className="h-8 text-xs"
                >
                  {name}
                </Button>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={!groupName.trim() || isLoading}
              className="bg-gradient-to-r from-primary to-primary/80"
            >
              {isLoading ? 'Création...' : 'Créer le groupe'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
