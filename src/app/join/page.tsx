"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Users, UserPlus, Loader2, ArrowLeft, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { useJoinGroup } from "@/hooks/queries/use-groups";

// ============================================
// Schema
// ============================================

const joinSchema = z.object({
  code: z.string().length(8, "Le code doit contenir 8 caractères").toUpperCase(),
});

type JoinFormValues = z.infer<typeof joinSchema>;

// ============================================
// Inner Component (uses useSearchParams)
// ============================================

function JoinPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [isJoining, setIsJoining] = useState(false);

  const joinGroup = useJoinGroup();
  const codeFromUrl = searchParams.get("code")?.toUpperCase() ?? "";

  const form = useForm<JoinFormValues>({
    resolver: zodResolver(joinSchema),
    defaultValues: {
      code: codeFromUrl,
    },
  });

  // Auto-join if code is in URL and user is logged in
  useEffect(() => {
    if (codeFromUrl && codeFromUrl.length === 8 && status === "authenticated" && !isJoining) {
      handleJoin(codeFromUrl);
    }
  }, [codeFromUrl, status]);

  const handleJoin = async (code: string) => {
    if (status !== "authenticated") {
      toast.error("Vous devez être connecté pour rejoindre un groupe");
      router.push(`/?login=true&redirect=/join?code=${code}`);
      return;
    }

    setIsJoining(true);
    try {
      const group = await joinGroup.mutateAsync(code);
      toast.success(`Vous avez rejoint "${group.name}" !`);
      router.push(`/predictions/groups/${group.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la connexion au groupe"
      );
      setIsJoining(false);
    }
  };

  const onSubmit = (values: JoinFormValues) => {
    handleJoin(values.code);
  };

  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // Auto-joining state
  if (isJoining) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <h2 className="text-xl font-semibold">Connexion au groupe...</h2>
            <p className="text-muted-foreground">
              Veuillez patienter pendant que nous vous ajoutons au groupe.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => router.push("/")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Accueil
        </Button>

        {/* Join Card */}
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Rejoindre un groupe</CardTitle>
            <CardDescription>
              Entrez le code d'invitation à 8 caractères pour rejoindre une ligue de pronostics
            </CardDescription>
          </CardHeader>

          <CardContent>
            {status !== "authenticated" ? (
              <div className="text-center space-y-4">
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900/30">
                  <p className="text-amber-800 dark:text-amber-200">
                    Vous devez être connecté pour rejoindre un groupe.
                  </p>
                </div>
                <Button
                  onClick={() => router.push(`/?login=true&redirect=/join${codeFromUrl ? `?code=${codeFromUrl}` : ""}`)}
                  className="w-full gap-2"
                >
                  Se connecter
                </Button>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code d'invitation</FormLabel>
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

                  <Button
                    type="submit"
                    disabled={joinGroup.isPending}
                    className="w-full gap-2"
                  >
                    {joinGroup.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Connexion...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Rejoindre le groupe
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-muted/50">
          <CardContent className="py-4">
            <div className="flex gap-3">
              <Trophy className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Ligues de pronostics F1</p>
                <p className="text-muted-foreground">
                  Rejoignez des groupes privés pour comparer vos pronostics avec vos amis et grimper dans le classement !
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================
// Page Component (with Suspense for useSearchParams)
// ============================================

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <JoinPageContent />
    </Suspense>
  );
}
