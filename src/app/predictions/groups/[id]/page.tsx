"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  Users,
  Lock,
  Globe,
  Crown,
  Shield,
  User,
  Settings,
  LogOut,
  Trash2,
  UserPlus,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { useGroup, useGroupMembers, useLeaveGroup, useDeleteGroup } from "@/hooks/queries/use-groups";
import { GroupLeaderboard, InviteModal } from "@/components/groups";
import type { GroupRole } from "@prisma/client";
import type { GroupMemberWithUser } from "@/lib/services/groups.service";

// ============================================
// Types & Helpers
// ============================================

const roleConfig: Record<GroupRole, { label: string; icon: typeof Crown; color: string }> = {
  OWNER: { label: "Propriétaire", icon: Crown, color: "text-yellow-500" },
  ADMIN: { label: "Admin", icon: Shield, color: "text-blue-500" },
  MEMBER: { label: "Membre", icon: User, color: "text-muted-foreground" },
};

// ============================================
// Page Component
// ============================================

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const groupId = params.id as string;

  const [copied, setCopied] = useState(false);

  const { data: group, isLoading: isLoadingGroup, error: groupError } = useGroup(groupId);
  const { data: membersData, isLoading: isLoadingMembers } = useGroupMembers(groupId);
  const leaveGroup = useLeaveGroup();
  const deleteGroup = useDeleteGroup();

  // Extract members array from response
  const members = membersData?.members ?? [];

  const currentUserId = session?.user?.id;
  const userRole = group?.currentUserRole;
  const isOwner = userRole === "OWNER";
  const isAdmin = userRole === "ADMIN" || isOwner;

  const copyCode = async () => {
    if (!group?.code) return;
    try {
      await navigator.clipboard.writeText(group.code);
      setCopied(true);
      toast.success("Code copié !");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier");
    }
  };

  const handleLeave = async () => {
    try {
      await leaveGroup.mutateAsync(groupId);
      toast.success("Vous avez quitté le groupe");
      router.push("/predictions");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la sortie du groupe");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteGroup.mutateAsync(groupId);
      toast.success("Groupe supprimé");
      router.push("/predictions");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la suppression");
    }
  };

  // Loading state
  if (isLoadingGroup) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4 space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (groupError || !group) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="py-12 text-center">
            <p className="text-destructive text-lg mb-4">
              {groupError?.message || "Groupe introuvable"}
            </p>
            <Button onClick={() => router.push("/predictions")}>
              Retour aux pronostics
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Button>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Group Info & Members */}
        <div className="lg:col-span-2 space-y-6">
          {/* Group Header Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    {group.isPrivate ? (
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Globe className="h-5 w-5 text-muted-foreground" />
                    )}
                    <span className="truncate">{group.name}</span>
                  </CardTitle>
                  {group.description && (
                    <CardDescription className="mt-2 text-base">
                      {group.description}
                    </CardDescription>
                  )}
                </div>
                {userRole && (
                  <Badge variant={userRole === "OWNER" ? "default" : "secondary"} className="shrink-0">
                    {(() => {
                      const RoleIcon = roleConfig[userRole].icon;
                      return <RoleIcon className="h-3 w-3 mr-1" />;
                    })()}
                    {roleConfig[userRole].label}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stats Row */}
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>
                    <strong>{group.memberCount}</strong> / {group.maxMembers} membres
                  </span>
                </div>
                {group.season && (
                  <Badge variant="outline">Saison {group.season}</Badge>
                )}
              </div>

              {/* Invite Code */}
              {isAdmin && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between gap-4 p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Code d'invitation</p>
                      <p className="text-2xl font-mono font-bold tracking-widest">
                        {group.code}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={copyCode}>
                        {copied ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <InviteModal
                        groupId={groupId}
                        groupName={group.name}
                        groupCode={group.code}
                        canRegenerateCode={isOwner}
                        trigger={
                          <Button variant="default" size="sm" className="gap-2">
                            <UserPlus className="h-4 w-4" />
                            Inviter
                          </Button>
                        }
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Actions */}
              <Separator />
              <div className="flex flex-wrap gap-2">
                {!isOwner && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="gap-2 text-destructive hover:text-destructive">
                        <LogOut className="h-4 w-4" />
                        Quitter le groupe
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Quitter le groupe ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Êtes-vous sûr de vouloir quitter "{group.name}" ? 
                          Vos pronostics seront conservés mais vous ne pourrez plus participer.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleLeave}
                          disabled={leaveGroup.isPending}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {leaveGroup.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Quitter
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                {isOwner && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="gap-2">
                        <Trash2 className="h-4 w-4" />
                        Supprimer le groupe
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer le groupe ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action est irréversible. Tous les membres seront retirés 
                          et les données du groupe seront supprimées définitivement.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          disabled={deleteGroup.isPending}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {deleteGroup.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Supprimer définitivement
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Members List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Membres ({members?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingMembers ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !members?.length ? (
                <p className="text-muted-foreground text-center py-4">
                  Aucun membre dans ce groupe
                </p>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => {
                    const RoleIcon = roleConfig[member.role].icon;
                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage
                              src={member.user.avatar ?? undefined}
                              alt={member.user.pseudo ?? ""}
                            />
                            <AvatarFallback>
                              {(member.user.pseudo ?? member.user.email ?? "?")
                                .slice(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {member.user.pseudo ?? member.user.email?.split("@")[0]}
                              {member.user.id === currentUserId && (
                                <span className="text-muted-foreground ml-2">(vous)</span>
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <RoleIcon className={`h-3 w-3 ${roleConfig[member.role].color}`} />
                              {roleConfig[member.role].label}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{member.totalPoints}</p>
                          <p className="text-xs text-muted-foreground">points</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Leaderboard */}
        <div className="space-y-6">
          <GroupLeaderboard
            groupId={groupId}
            groupName={group.name}
            currentUserId={currentUserId}
            initialSeason={group.season ?? undefined}
          />
        </div>
      </div>
    </div>
  );
}