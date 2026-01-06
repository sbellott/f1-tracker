"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Users, Plus, Search, Loader2, UserPlus } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { useGroups, useJoinGroup } from "@/hooks/queries/use-groups";
import { useConfetti } from "@/hooks/use-confetti";
import { CreateGroupModal } from "./CreateGroupModal";
import { GroupCard, GroupCardSkeleton } from "./GroupCard";

// ============================================
// Join Group Schema
// ============================================

const joinGroupSchema = z.object({
  code: z.string().length(8, "Le code doit contenir 8 caractères").toUpperCase(),
});

type JoinGroupValues = z.infer<typeof joinGroupSchema>;

// ============================================
// Component
// ============================================

export function GroupsSection() {
  const router = useRouter();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const { celebrate } = useConfetti();

  const { data: groups, isLoading, error } = useGroups();
  const joinGroup = useJoinGroup();

  const form = useForm<JoinGroupValues>({
    resolver: zodResolver(joinGroupSchema),
    defaultValues: {
      code: "",
    },
  });

  const onJoinSubmit = async (values: JoinGroupValues) => {
    try {
      const group = await joinGroup.mutateAsync(values.code);
      toast.success(`Vous avez rejoint "${group.name}" !`);
      celebrate({ particleCount: 60, spread: 80 });
      setShowJoinModal(false);
      form.reset();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la connexion au groupe"
      );
    }
  };

  const handleGroupClick = (groupId: string) => {
    router.push(`/groups/${groupId}`);
  };

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/10">
        <CardContent className="py-8 text-center">
          <p className="text-destructive">Erreur lors du chargement des groupes</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Mes Groupes
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Créez ou rejoignez des ligues de pronostics
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowJoinModal(true)}
            className="gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Rejoindre
          </Button>
          <CreateGroupModal />
        </div>
      </div>

      {/* Groups List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <GroupCardSkeleton key={i} />
          ))}
        </div>
      ) : !groups?.length ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h4 className="text-lg font-medium mb-2">Aucun groupe</h4>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Créez votre premier groupe ou rejoignez-en un avec un code d&apos;invitation
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <CreateGroupModal
                trigger={
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Créer un groupe
                  </Button>
                }
              />
              <Button variant="outline" onClick={() => setShowJoinModal(true)} className="gap-2">
                <UserPlus className="h-4 w-4" />
                Rejoindre avec un code
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}

      {/* Join Group Modal */}
      <Dialog open={showJoinModal} onOpenChange={setShowJoinModal}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Rejoindre un groupe
            </DialogTitle>
            <DialogDescription>
              Entrez le code d&apos;invitation à 8 caractères pour rejoindre un groupe
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onJoinSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code d&apos;invitation</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="XXXXXXXX"
                        maxLength={8}
                        className="text-center text-2xl font-mono tracking-widest uppercase"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowJoinModal(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={joinGroup.isPending} className="gap-2">
                  {joinGroup.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Rejoindre
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}