"use client";

import { useRef, useState, useCallback } from "react";
import {
  Download,
  Share2,
  Trophy,
  Target,
  TrendingUp,
  Users,
  Loader2,
  ImageIcon,
  Copy,
  Check,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

// ============================================
// Types
// ============================================

interface ShareStats {
  totalPoints: number;
  rank?: number;
  totalParticipants?: number;
  predictionsCount: number;
  perfectPredictions: number;
  winRate: number;
  groupName?: string;
  season: number;
  username: string;
  avatarUrl?: string;
}

interface ShareCardProps {
  stats: ShareStats;
  className?: string;
  trigger?: React.ReactNode;
}

type CardFormat = "story" | "square" | "wide";
type CardTheme = "dark" | "gradient" | "team";

const FORMAT_DIMENSIONS: Record<CardFormat, { width: number; height: number; label: string }> = {
  story: { width: 1080, height: 1920, label: "Story (9:16)" },
  square: { width: 1080, height: 1080, label: "Carré (1:1)" },
  wide: { width: 1200, height: 630, label: "Large (1.91:1)" },
};

// ============================================
// Share Card Content (Rendered to Canvas)
// ============================================

interface CardContentProps {
  stats: ShareStats;
  format: CardFormat;
  theme: CardTheme;
  scale?: number;
}

function ShareCardContent({ stats, format, theme, scale = 1 }: CardContentProps) {
  const dims = FORMAT_DIMENSIONS[format];
  const isVertical = format === "story";
  const isSquare = format === "square";

  // Compute scaled dimensions for preview
  const previewWidth = dims.width * scale;
  const previewHeight = dims.height * scale;

  // Theme styles
  const themeStyles = {
    dark: "bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900",
    gradient: "bg-gradient-to-br from-red-600 via-red-700 to-zinc-900",
    team: "bg-gradient-to-br from-blue-900 via-purple-900 to-zinc-900",
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden text-white font-sans",
        themeStyles[theme]
      )}
      style={{
        width: previewWidth,
        height: previewHeight,
        fontSize: `${scale * 16}px`,
      }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
      </div>

      {/* Racing Lines */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-white to-red-500"
           style={{ height: `${scale * 4}px` }} />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-white to-red-500"
           style={{ height: `${scale * 4}px` }} />

      {/* Content Container */}
      <div className={cn(
        "relative h-full flex flex-col",
        isVertical ? "p-8 justify-between" : "p-6",
        isSquare && "p-6 justify-between"
      )}
      style={{
        padding: `${scale * (isVertical ? 32 : 24)}px`,
      }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2" style={{ gap: `${scale * 8}px` }}>
            <div
              className="font-bold tracking-tight text-red-500"
              style={{ fontSize: `${scale * (isVertical ? 28 : 24)}px` }}
            >
              F1
            </div>
            <div
              className="font-semibold text-white/90"
              style={{ fontSize: `${scale * (isVertical ? 20 : 16)}px` }}
            >
              TRACKER
            </div>
          </div>
          <div
            className="text-white/60 font-medium"
            style={{ fontSize: `${scale * 14}px` }}
          >
            Saison {stats.season}
          </div>
        </div>

        {/* Main Stats */}
        <div className={cn(
          "flex-1 flex flex-col justify-center",
          isVertical && "my-8",
          !isVertical && "my-4"
        )}>
          {/* User Info */}
          <div className="text-center mb-6" style={{ marginBottom: `${scale * 24}px` }}>
            {stats.avatarUrl && (
              <div
                className="mx-auto mb-4 rounded-full overflow-hidden border-4 border-white/20"
                style={{
                  width: `${scale * (isVertical ? 96 : 64)}px`,
                  height: `${scale * (isVertical ? 96 : 64)}px`,
                  marginBottom: `${scale * 16}px`,
                  borderWidth: `${scale * 4}px`,
                }}
              >
                <img
                  src={stats.avatarUrl}
                  alt={stats.username}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div
              className="font-bold text-white"
              style={{ fontSize: `${scale * (isVertical ? 32 : 24)}px` }}
            >
              {stats.username}
            </div>
            {stats.groupName && (
              <div
                className="text-white/60 mt-1"
                style={{
                  fontSize: `${scale * 14}px`,
                  marginTop: `${scale * 4}px`
                }}
              >
                {stats.groupName}
              </div>
            )}
          </div>

          {/* Big Points Display */}
          <div className="text-center mb-6" style={{ marginBottom: `${scale * 24}px` }}>
            <div
              className="font-black text-white leading-none"
              style={{ fontSize: `${scale * (isVertical ? 96 : 72)}px` }}
            >
              {stats.totalPoints}
            </div>
            <div
              className="text-white/60 uppercase tracking-widest mt-2"
              style={{
                fontSize: `${scale * 14}px`,
                marginTop: `${scale * 8}px`,
                letterSpacing: `${scale * 2}px`
              }}
            >
              POINTS
            </div>
          </div>

          {/* Rank Badge */}
          {stats.rank && stats.totalParticipants && (
            <div className="flex justify-center mb-6" style={{ marginBottom: `${scale * 24}px` }}>
              <div
                className={cn(
                  "px-4 py-2 rounded-full flex items-center gap-2",
                  stats.rank === 1 ? "bg-yellow-500/20 text-yellow-400" :
                  stats.rank === 2 ? "bg-gray-300/20 text-gray-300" :
                  stats.rank === 3 ? "bg-orange-500/20 text-orange-400" :
                  "bg-white/10 text-white/80"
                )}
                style={{
                  padding: `${scale * 8}px ${scale * 16}px`,
                  gap: `${scale * 8}px`,
                  borderRadius: `${scale * 9999}px`,
                }}
              >
                <Trophy style={{ width: `${scale * 20}px`, height: `${scale * 20}px` }} />
                <span style={{ fontSize: `${scale * 18}px`, fontWeight: 600 }}>
                  #{stats.rank} / {stats.totalParticipants}
                </span>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div
            className={cn(
              "grid gap-4",
              isVertical ? "grid-cols-2" : "grid-cols-3",
              isSquare && "grid-cols-2"
            )}
            style={{ gap: `${scale * 16}px` }}
          >
            <StatBox
              icon={<Target />}
              value={stats.predictionsCount}
              label="Pronostics"
              scale={scale}
            />
            <StatBox
              icon={<Trophy />}
              value={stats.perfectPredictions}
              label="Parfaits"
              scale={scale}
            />
            {!isSquare && (
              <StatBox
                icon={<TrendingUp />}
                value={`${Math.round(stats.winRate)}%`}
                label="Précision"
                scale={scale}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div
            className="text-white/40"
            style={{ fontSize: `${scale * 12}px` }}
          >
            f1tracker.app
          </div>
          <div
            className="text-white/40"
            style={{ fontSize: `${scale * 12}px` }}
          >
            #F1Predictions
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({
  icon,
  value,
  label,
  scale = 1
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  scale?: number;
}) {
  return (
    <div
      className="bg-white/10 rounded-lg p-3 text-center backdrop-blur-sm"
      style={{
        padding: `${scale * 12}px`,
        borderRadius: `${scale * 8}px`,
      }}
    >
      <div
        className="text-white/60 mx-auto mb-2"
        style={{
          width: `${scale * 20}px`,
          height: `${scale * 20}px`,
          marginBottom: `${scale * 8}px`,
        }}
      >
        {icon}
      </div>
      <div
        className="font-bold text-white"
        style={{ fontSize: `${scale * 24}px` }}
      >
        {value}
      </div>
      <div
        className="text-white/60"
        style={{ fontSize: `${scale * 12}px` }}
      >
        {label}
      </div>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function ShareCard({ stats, className, trigger }: ShareCardProps) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<CardFormat>("square");
  const [theme, setTheme] = useState<CardTheme>("gradient");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Calculate preview scale (fit in dialog)
  const previewScale = format === "story" ? 0.2 : format === "square" ? 0.3 : 0.35;

  const generateImage = useCallback(async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;

    try {
      // Dynamic import for html2canvas (only load when needed)
      const html2canvas = (await import("html2canvas")).default;

      const dims = FORMAT_DIMENSIONS[format];

      // Create a temporary container at full size
      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.left = "-9999px";
      container.style.top = "0";
      document.body.appendChild(container);

      // Clone and render at full size
      const fullSizeCard = cardRef.current.cloneNode(true) as HTMLElement;
      fullSizeCard.style.transform = `scale(${1 / previewScale})`;
      fullSizeCard.style.transformOrigin = "top left";
      fullSizeCard.style.width = `${dims.width}px`;
      fullSizeCard.style.height = `${dims.height}px`;
      container.appendChild(fullSizeCard);

      const canvas = await html2canvas(fullSizeCard, {
        width: dims.width,
        height: dims.height,
        scale: 2, // High quality
        useCORS: true,
        backgroundColor: null,
      });

      document.body.removeChild(container);

      return new Promise((resolve) => {
        canvas.toBlob(resolve, "image/png", 1.0);
      });
    } catch (error) {
      console.error("Error generating image:", error);
      return null;
    }
  }, [format, previewScale]);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const blob = await generateImage();
      if (!blob) throw new Error("Failed to generate image");

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `f1-tracker-${stats.username}-${format}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Image téléchargée !");
    } catch (error) {
      toast.error("Erreur lors de la génération");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    setIsGenerating(true);
    try {
      const blob = await generateImage();
      if (!blob) throw new Error("Failed to generate image");

      const file = new File([blob], `f1-tracker-${stats.username}.png`, {
        type: "image/png",
      });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "Mes stats F1 Tracker",
          text: `J'ai ${stats.totalPoints} points sur F1 Tracker ! 🏎️`,
          files: [file],
        });
        toast.success("Partagé !");
      } else {
        // Fallback: copy to clipboard or download
        await handleDownload();
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        toast.error("Erreur lors du partage");
        console.error(error);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const copyShareText = async () => {
    const text = `🏎️ J'ai ${stats.totalPoints} points sur F1 Tracker saison ${stats.season} !\n${stats.rank ? `📊 Classement: #${stats.rank}/${stats.totalParticipants}\n` : ""}🎯 ${stats.predictionsCount} pronostics\n🏆 ${stats.perfectPredictions} parfaits\n\n#F1Tracker #F1Predictions`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Texte copié !");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className={cn("gap-2", className)}>
            <Share2 className="h-4 w-4" />
            Partager
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            Partager mes stats
          </DialogTitle>
          <DialogDescription>
            Générez une image personnalisée de vos performances
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Options */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Format</label>
              <Select value={format} onValueChange={(v) => setFormat(v as CardFormat)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FORMAT_DIMENSIONS).map(([key, val]) => (
                    <SelectItem key={key} value={key}>
                      {val.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Thème</label>
              <Select value={theme} onValueChange={(v) => setTheme(v as CardTheme)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">Sombre</SelectItem>
                  <SelectItem value="gradient">F1 Rouge</SelectItem>
                  <SelectItem value="team">Racing Blue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview */}
          <div className="flex justify-center p-4 bg-muted/50 rounded-lg">
            <div
              ref={cardRef}
              className="shadow-2xl rounded-lg overflow-hidden"
            >
              <ShareCardContent
                stats={stats}
                format={format}
                theme={theme}
                scale={previewScale}
              />
            </div>
          </div>

          {/* Actions */}
          <Tabs defaultValue="image" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="image">Image</TabsTrigger>
              <TabsTrigger value="text">Texte</TabsTrigger>
            </TabsList>

            <TabsContent value="image" className="space-y-3 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleDownload}
                  disabled={isGenerating}
                  className="gap-2"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Télécharger
                </Button>
                <Button
                  onClick={handleShare}
                  disabled={isGenerating}
                  variant="default"
                  className="gap-2"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Share2 className="h-4 w-4" />
                  )}
                  Partager
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                L&apos;image sera générée en haute qualité ({FORMAT_DIMENSIONS[format].width}x{FORMAT_DIMENSIONS[format].height})
              </p>
            </TabsContent>

            <TabsContent value="text" className="space-y-3 mt-4">
              <div className="p-3 bg-muted rounded-lg text-sm font-mono whitespace-pre-wrap">
                🏎️ J&apos;ai {stats.totalPoints} points sur F1 Tracker saison {stats.season} !
                {stats.rank && `\n📊 Classement: #${stats.rank}/${stats.totalParticipants}`}
                {"\n"}🎯 {stats.predictionsCount} pronostics
                {"\n"}🏆 {stats.perfectPredictions} parfaits
                {"\n\n"}#F1Tracker #F1Predictions
              </div>
              <Button
                onClick={copyShareText}
                variant="outline"
                className="w-full gap-2"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "Copié !" : "Copier le texte"}
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Compact Trigger Button
// ============================================

export function ShareButton({
  stats,
  className
}: {
  stats: ShareStats;
  className?: string;
}) {
  return (
    <ShareCard
      stats={stats}
      trigger={
        <Button variant="ghost" size="icon" className={className}>
          <Share2 className="h-4 w-4" />
        </Button>
      }
    />
  );
}
