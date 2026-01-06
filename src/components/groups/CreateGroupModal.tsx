"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Users, Lock, Globe, Loader2, Plus, Copy, Check } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

import { useCreateGroup } from "@/hooks/queries/use-groups";

// ============================================
// Schema
// ============================================

const createGroupSchema = z.object({
  name: z
    .string()
    .min(3, "Le nom doit contenir au moins 3 caractères")
    .max(50, "Le nom ne peut pas dépasser 50 caractères")
    .trim(),
  description: z
    .string()
    .max(500, "La description ne peut pas dépasser 500 caractères")
    .optional(),
  isPrivate: z.boolean(),
  maxMembers: z.number().int().min(2).max(100),
});

type CreateGroupFormValues = z.infer<typeof createGroupSchema>;

// ============================================
// Component
// ============================================

interface CreateGroupModalProps {
  trigger?: React.ReactNode;
  onSuccess?: (groupCode: string) => void;
}

export function CreateGroupModal({ trigger, onSuccess }: CreateGroupModalProps) {
  const [open, setOpen] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const createGroup = useCreateGroup();

  const form = useForm<CreateGroupFormValues>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: "",
      description: "",
      isPrivate: true,
      maxMembers: 20,
    },
  });

  const onSubmit = async (values: CreateGroupFormValues) => {
    try {
      const group = await createGroup.mutateAsync(values);
      setCreatedCode(group.code);
      toast.success("Groupe créé avec succès !");
      onSuccess?.(group.code);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la création du groupe"
      );
    }
  };

  const handleClose = () => {
    setOpen(false);
    // Reset after animation
    setTimeout(() => {
      form.reset();
      setCreatedCode(null);
      setCopied(false);
    }, 200);
  };

  const copyCode = async () => {
    if (!createdCode) return;
    try {
      await navigator.clipboard.writeText(createdCode);
      setCopied(true);
      toast.success("Code copié !");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier le code");
    }
  };

  const copyLink = async () => {
    if (!createdCode) return;
    const link = `${window.location.origin}/join?code=${createdCode}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Lien d'invitation copié !");
    } catch {
      toast.error("Impossible de copier le lien");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Créer un groupe
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        {!createdCode ? (
          // Form View
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Créer un nouveau groupe
              </DialogTitle>
              <DialogDescription>
                Créez votre ligue de pronostics et invitez vos amis à vous
                rejoindre.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom du groupe *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Les Experts F1, Dream Team..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Une courte description de votre groupe..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {field.value?.length || 0}/500 caractères
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Private Toggle */}
                <FormField
                  control={form.control}
                  name="isPrivate"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base flex items-center gap-2">
                          {field.value ? (
                            <Lock className="h-4 w-4" />
                          ) : (
                            <Globe className="h-4 w-4" />
                          )}
                          Groupe {field.value ? "privé" : "public"}
                        </FormLabel>
                        <FormDescription>
                          {field.value
                            ? "Seuls les membres invités peuvent rejoindre"
                            : "Tout le monde peut rejoindre avec le code"}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Max Members */}
                <FormField
                  control={form.control}
                  name="maxMembers"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Nombre maximum de membres</FormLabel>
                        <Badge variant="secondary">{field.value} membres</Badge>
                      </div>
                      <FormControl>
                        <Slider
                          min={2}
                          max={100}
                          step={1}
                          value={[field.value]}
                          onValueChange={(values) => field.onChange(values[0])}
                          className="py-4"
                        />
                      </FormControl>
                      <FormDescription>
                        Entre 2 et 100 membres
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={createGroup.isPending}
                    className="gap-2"
                  >
                    {createGroup.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Création...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Créer le groupe
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        ) : (
          // Success View
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <Check className="h-5 w-5" />
                Groupe créé !
              </DialogTitle>
              <DialogDescription>
                Partagez ce code avec vos amis pour qu&apos;ils rejoignent votre
                groupe.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Code Display */}
              <div className="flex flex-col items-center gap-4 p-6 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Code d&apos;invitation</p>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-mono font-bold tracking-widest">
                    {createdCode}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyCode}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Share Options */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={copyLink}
                  className="gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copier le lien
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const text = `Rejoins mon groupe de pronostics F1 ! Code: ${createdCode}`;
                    const url = `${window.location.origin}/join?code=${createdCode}`;
                    if (navigator.share) {
                      navigator.share({ title: "F1 Tracker", text, url });
                    } else {
                      copyLink();
                    }
                  }}
                  className="gap-2"
                >
                  <Users className="h-4 w-4" />
                  Partager
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                Terminé
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}