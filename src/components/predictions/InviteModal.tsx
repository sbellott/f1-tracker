import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Copy, Check, Link as LinkIcon } from 'lucide-react';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (inviteCode: string) => void;
  inviteCode?: string; // Si on affiche le modal pour inviter (avec code existant)
  groupName?: string;
}

export function InviteModal({ isOpen, onClose, onJoin, inviteCode, groupName }: InviteModalProps) {
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsLoading(true);
    onJoin(code.trim().toUpperCase());
    setIsLoading(false);
    setCode('');
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const inviteLink = inviteCode ? `${typeof window !== 'undefined' ? window.location.origin : ''}/predictions/join/${inviteCode}` : '';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center mb-4">
            <UserPlus className="w-6 h-6 text-white" />
          </div>
          <DialogTitle className="text-2xl">
            {inviteCode ? 'Inviter des amis' : 'Rejoindre un groupe'}
          </DialogTitle>
          <DialogDescription>
            {inviteCode
              ? `Partagez ce code ou ce lien pour inviter vos amis à rejoindre "${groupName}"`
              : 'Entrez le code d\'invitation que vous avez reçu'}
          </DialogDescription>
        </DialogHeader>

        {inviteCode ? (
          // Mode invitation (afficher le code)
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Code d'invitation</Label>
              <div className="flex gap-2">
                <Input
                  value={inviteCode}
                  readOnly
                  className="h-12 font-mono text-lg tracking-wider text-center"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 shrink-0"
                  onClick={() => handleCopy(inviteCode)}
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Lien d'invitation</Label>
              <div className="flex gap-2">
                <Input
                  value={inviteLink}
                  readOnly
                  className="h-12 text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 shrink-0"
                  onClick={() => handleCopy(inviteLink)}
                >
                  <LinkIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Astuce:</strong> Partagez ce code ou ce lien avec vos amis pour qu'ils rejoignent votre groupe de pronostics !
              </p>
            </div>
          </div>
        ) : (
          // Mode rejoindre (entrer le code)
          <form onSubmit={handleJoin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="inviteCode">Code d'invitation</Label>
              <Input
                id="inviteCode"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Ex: ABCD1234"
                maxLength={8}
                autoFocus
                className="h-12 font-mono text-lg tracking-wider text-center uppercase"
              />
              <p className="text-xs text-muted-foreground">
                Entrez le code à 8 caractères que vous avez reçu
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-accent/10 to-transparent border border-accent/20">
              <p className="text-sm">
                <strong className="text-accent">Nouveau ici ?</strong>
                <br />
                Demandez à un ami de créer un groupe et de vous partager le code d'invitation !
              </p>
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
                disabled={code.length < 8 || isLoading}
                className="bg-gradient-to-r from-accent to-accent/80"
              >
                {isLoading ? 'Vérification...' : 'Rejoindre'}
              </Button>
            </DialogFooter>
          </form>
        )}

        {inviteCode && (
          <DialogFooter>
            <Button onClick={onClose} className="w-full">
              Fermer
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
