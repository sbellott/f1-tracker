"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Copy,
  Check,
  Share2,
  Mail,
  Link2,
  Users,
  RefreshCw,
  Loader2,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

import { useCreateInvitation, useRegenerateCode } from "@/hooks/queries/use-groups";

// ============================================
// Schema
// ============================================

const inviteByEmailSchema = z.object({
  email: z.string().email("Adresse email invalide"),
});

type InviteByEmailValues = z.infer<typeof inviteByEmailSchema>;

// ============================================
// Types
// ============================================

interface InviteModalProps {
  groupId: string;
  groupName: string;
  groupCode: string;
  canRegenerateCode?: boolean;
  trigger?: React.ReactNode;
}

// ============================================
// Component
// ============================================

export function InviteModal({
  groupId,
  groupName,
  groupCode,
  canRegenerateCode = false,
  trigger,
}: InviteModalProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [currentCode, setCurrentCode] = useState(groupCode);

  const createInvitation = useCreateInvitation();
  const regenerateCode = useRegenerateCode();

  const form = useForm<InviteByEmailValues>({
    resolver: zodResolver(inviteByEmailSchema),
    defaultValues: {
      email: "",
    },
  });

  const inviteLink = typeof window !== "undefined"
    ? `${window.location.origin}/join?code=${currentCode}`
    : `/join?code=${currentCode}`;

  const copyToClipboard = async (text: string, type: "code" | "link") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      toast.success(type === "code" ? "Code copié !" : "Lien copié !");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Impossible de copier");
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `Rejoins ${groupName} sur F1 Tracker`,
      text: `Rejoins mon groupe de pronostics F1 "${groupName}" ! Code: ${currentCode}`,
      url: inviteLink,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await copyToClipboard(inviteLink, "link");
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        toast.error("Erreur lors du partage");
      }
    }
  };

  const handleRegenerateCode = async () => {
    try {
      const newCode = await regenerateCode.mutateAsync(groupId);
      setCurrentCode(newCode);
      toast.success("Nouveau code généré !");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la régénération"
      );
    }
  };

  const onSubmitEmail = async (values: InviteByEmailValues) => {
    try {
      await createInvitation.mutateAsync({
        groupId,
        recipientEmail: values.email,
      });
      toast.success(`Invitation envoyée à ${values.email}`);
      form.reset();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'envoi"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Users className="h-4 w-4" />
            Inviter
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Inviter des membres
          </DialogTitle>
          <DialogDescription>
            Partagez le code ou le lien pour inviter des amis à rejoindre{" "}
            <span className="font-medium">{groupName}</span>
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="code" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="code" className="gap-2">
              <Link2 className="h-4 w-4" />
              Code / Lien
            </TabsTrigger>
            <TabsTrigger value="email" className="gap-2">
              <Mail className="h-4 w-4" />
              Par email
            </TabsTrigger>
          </TabsList>

          {/* Code & Link Tab */}
          <TabsContent value="code" className="space-y-4 mt-4">
            {/* Invite Code */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Code d&apos;invitation</label>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center justify-center px-4 py-3 bg-muted rounded-lg">
                  <span className="text-2xl font-mono font-bold tracking-widest">
                    {currentCode}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(currentCode, "code")}
                  className="shrink-0 h-auto aspect-square"
                >
                  {copied === "code" ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {canRegenerateCode && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRegenerateCode}
                  disabled={regenerateCode.isPending}
                  className="text-xs text-muted-foreground"
                >
                  {regenerateCode.isPending ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3 mr-1" />
                  )}
                  Générer un nouveau code
                </Button>
              )}
            </div>

            <Separator />

            {/* Invite Link */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Lien d&apos;invitation</label>
              <div className="flex gap-2">
                <Input
                  value={inviteLink}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(inviteLink, "link")}
                  className="shrink-0"
                >
                  {copied === "link" ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Share Button */}
            <Button onClick={handleShare} className="w-full gap-2">
              <Share2 className="h-4 w-4" />
              Partager
            </Button>
          </TabsContent>

          {/* Email Tab */}
          <TabsContent value="email" className="mt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitEmail)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="ami@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={createInvitation.isPending}
                  className="w-full gap-2"
                >
                  {createInvitation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      Envoyer l&apos;invitation
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Une invitation sera envoyée si l&apos;utilisateur a un compte F1 Tracker
                </p>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
