"use client";

/**
 * DuelOpponentSelector - Select and pin opponents for head-to-head comparison
 * Allows users to choose opponents from their groups for duels
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pin, PinOff, Users, ChevronDown, Check, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useResultsStore, type DuelOpponent } from "@/lib/stores/results-store";
import { useGroups, useGroupMembers, type GroupMember, type GroupSummary } from "@/lib/hooks/use-groups";
import { cn } from "@/lib/utils";

// ============================================
// Types
// ============================================

interface GroupMemberItem {
  id: string;
  pseudo: string;
  avatar: string | null;
  groupId: string;
  groupName: string;
  totalPoints?: number;
  rank?: number;
}

// ============================================
// Quick Switch Bar
// ============================================

function QuickSwitchBar({
  onSelect,
}: {
  onSelect: (opponent: DuelOpponent) => void;
}) {
  const { recentOpponents, pinnedOpponent } = useResultsStore();

  if (recentOpponents.length === 0) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        Récents:
      </span>
      {recentOpponents.map((opponent) => (
        <button
          key={opponent.id}
          onClick={() => onSelect(opponent)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all",
            "bg-muted/50 hover:bg-muted border border-transparent",
            pinnedOpponent?.id === opponent.id && "border-f1-red bg-f1-red/10"
          )}
        >
          <Avatar className="w-5 h-5">
            <AvatarImage src={opponent.avatar || undefined} />
            <AvatarFallback className="text-[10px]">
              {opponent.pseudo.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium">{opponent.pseudo}</span>
          {pinnedOpponent?.id === opponent.id && (
            <Pin className="w-3 h-3 text-f1-red" />
          )}
        </button>
      ))}
    </div>
  );
}

// ============================================
// Group Members List
// ============================================

function GroupMembersList({
  groupId,
  groupName,
  searchQuery,
  currentUserId,
  onSelect,
}: {
  groupId: string;
  groupName: string;
  searchQuery: string;
  currentUserId: string;
  onSelect: (member: GroupMemberItem) => void;
}) {
  const { data: members, isLoading } = useGroupMembers(groupId);
  const { pinnedOpponent } = useResultsStore();

  const filteredMembers = useMemo(() => {
    if (!members) return [];
    return members
      .filter((m) => m.user.id !== currentUserId)
      .filter((m) =>
        m.user.pseudo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.user.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .map((m) => ({
        id: m.user.id,
        pseudo: m.user.pseudo || m.user.email.split("@")[0],
        avatar: m.user.avatar,
        groupId,
        groupName,
        totalPoints: m.totalPoints,
        rank: m.rank,
      }));
  }, [members, currentUserId, searchQuery, groupId, groupName]);

  if (isLoading) {
    return (
      <div className="py-4 text-center text-sm text-muted-foreground">
        Chargement...
      </div>
    );
  }

  if (filteredMembers.length === 0) {
    return (
      <div className="py-4 text-center text-sm text-muted-foreground">
        Aucun membre trouvé
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {filteredMembers.map((member) => (
        <button
          key={member.id}
          onClick={() => onSelect(member)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
            "hover:bg-muted/50",
            pinnedOpponent?.id === member.id && "bg-f1-red/10"
          )}
        >
          <Avatar className="w-8 h-8">
            <AvatarImage src={member.avatar || undefined} />
            <AvatarFallback>
              {member.pseudo.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <span className="font-medium">{member.pseudo}</span>
              {member.rank && member.rank <= 3 && (
                <Badge variant="outline" className="text-xs px-1.5 py-0">
                  #{member.rank}
                </Badge>
              )}
            </div>
            {member.totalPoints !== undefined && (
              <span className="text-xs text-muted-foreground">
                {member.totalPoints} pts
              </span>
            )}
          </div>
          {pinnedOpponent?.id === member.id ? (
            <Pin className="w-4 h-4 text-f1-red" />
          ) : (
            <Check className="w-4 h-4 opacity-0 group-hover:opacity-50" />
          )}
        </button>
      ))}
    </div>
  );
}

// ============================================
// Main Component
// ============================================

interface DuelOpponentSelectorProps {
  currentUserId: string;
  className?: string;
  onSelect?: () => void; // Optional callback when opponent is selected
}

export function DuelOpponentSelector({
  currentUserId,
  className,
  onSelect,
}: DuelOpponentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const { data: groups, isLoading: groupsLoading } = useGroups();
  const { pinnedOpponent, setPinnedOpponent, addRecentOpponent } =
    useResultsStore();

  const handleSelectOpponent = (member: GroupMemberItem) => {
    const opponent: DuelOpponent = {
      id: member.id,
      pseudo: member.pseudo,
      avatar: member.avatar,
      groupId: member.groupId,
      groupName: member.groupName,
    };
    setPinnedOpponent(opponent);
    addRecentOpponent(opponent);
    setIsOpen(false);
    setSearchQuery("");
    onSelect?.(); // Call the callback if provided
  };

  const handleUnpin = () => {
    setPinnedOpponent(null);
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Quick switch bar */}
      <QuickSwitchBar onSelect={handleSelectOpponent} />

      {/* Current opponent display + selector */}
      <div className="flex items-center gap-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "flex-1 justify-between h-auto py-2",
                pinnedOpponent && "border-f1-red/50"
              )}
            >
              {pinnedOpponent ? (
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={pinnedOpponent.avatar || undefined} />
                    <AvatarFallback>
                      {pinnedOpponent.pseudo.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{pinnedOpponent.pseudo}</span>
                      <Pin className="w-3 h-3 text-f1-red" />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {pinnedOpponent.groupName}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>Choisir un adversaire</span>
                </div>
              )}
              <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-80 p-0" align="start">
            {/* Search */}
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un joueur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>

            {/* Groups list */}
            <ScrollArea className="h-[300px]">
              {groupsLoading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Chargement des groupes...
                </div>
              ) : !groups || groups.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Rejoins un groupe pour défier des adversaires !</p>
                </div>
              ) : (
                <div className="p-2">
                  {groups.map((group) => (
                    <div key={group.id} className="mb-2">
                      {/* Group header */}
                      <button
                        onClick={() => toggleGroup(group.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="flex-1 text-left font-medium">
                          {group.name}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {group.memberCount} membres
                        </Badge>
                        <ChevronDown
                          className={cn(
                            "w-4 h-4 transition-transform",
                            expandedGroups.has(group.id) && "rotate-180"
                          )}
                        />
                      </button>

                      {/* Group members */}
                      <AnimatePresence>
                        {expandedGroups.has(group.id) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden pl-4"
                          >
                            <GroupMembersList
                              groupId={group.id}
                              groupName={group.name}
                              searchQuery={searchQuery}
                              currentUserId={currentUserId}
                              onSelect={handleSelectOpponent}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* Unpin button */}
        {pinnedOpponent && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleUnpin}
            className="shrink-0"
          >
            <PinOff className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}