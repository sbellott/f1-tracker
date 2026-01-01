import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Trophy, History, Target, TrendingUp, Crown, Medal } from 'lucide-react';
import { Group, Race, Driver, UserPrediction, User } from '@/types';
import { CreateGroupModal } from '@/components/predictions/CreateGroupModal';
import { InviteModal } from '@/components/predictions/InviteModal';
import { PredictionForm } from '@/components/predictions/PredictionForm';
import { GroupLeaderboard } from '@/components/predictions/GroupLeaderboard';
import { PredictionHistory } from '@/components/predictions/PredictionHistory';
import { DuelView } from '@/components/predictions/DuelView';

interface PredictionsModuleProps {
  currentUser: User;
  groups: Group[];
  races: Race[];
  drivers: Driver[];
  userPredictions: UserPrediction[];
  onCreateGroup: (name: string) => void;
  onJoinGroup: (inviteCode: string) => void;
  onSubmitPrediction: (groupId: string, raceId: string, sessionType: 'RACE' | 'SPRINT', prediction: any) => void;
}

type ViewMode = 'groups' | 'form' | 'leaderboard' | 'history' | 'duel';

export function PredictionsModule({
  currentUser,
  groups,
  races,
  drivers,
  userPredictions,
  onCreateGroup,
  onJoinGroup,
  onSubmitPrediction,
}: PredictionsModuleProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('groups');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [groupToInvite, setGroupToInvite] = useState<Group | null>(null);

  // Get next race that needs prediction
  const upcomingRaces = races.filter(race => {
    const raceDate = new Date(race.date);
    return raceDate > new Date();
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const nextRace = upcomingRaces[0];

  const handleGroupClick = (group: Group) => {
    setSelectedGroup(group);
    
    // If group has 2 members, show duel view, otherwise show leaderboard
    if (group.members.length === 2) {
      setViewMode('duel');
    } else {
      setViewMode('leaderboard');
    }
  };

  const handleMakePrediction = (group: Group) => {
    setSelectedGroup(group);
    setSelectedRace(nextRace);
    setViewMode('form');
  };

  return (
    <div className="space-y-6">
      {/* Header avec stats globales */}
      {viewMode === 'groups' && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Mes Pronostics</h2>
              <p className="text-muted-foreground text-lg">
                {groups.length} groupe{groups.length > 1 ? 's' : ''} · Prochaine course: {nextRace?.name}
              </p>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              <Plus className="w-4 h-4" />
              Créer un groupe
            </Button>
          </div>

          {/* Quick stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6 border-border/50 bg-gradient-to-br from-primary/5 to-transparent">
              <div className="flex items-center justify-between mb-2">
                <Trophy className="w-5 h-5 text-primary" />
                <Badge className="bg-primary/20 text-primary border-0">Total</Badge>
              </div>
              <div className="text-3xl font-bold mb-1">
                {groups.reduce((sum, g) => {
                  const member = g.members.find(m => m.userId === currentUser.id);
                  return sum + (member?.totalPoints || 0);
                }, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Points totaux</div>
            </Card>

            <Card className="p-6 border-border/50 bg-gradient-to-br from-accent/5 to-transparent">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-5 h-5 text-accent" />
                <Badge className="bg-accent/20 text-accent border-0">Prédictions</Badge>
              </div>
              <div className="text-3xl font-bold mb-1">{userPredictions.length}</div>
              <div className="text-sm text-muted-foreground">Pronostics soumis</div>
            </Card>

            <Card className="p-6 border-border/50 bg-gradient-to-br from-chart-3/5 to-transparent">
              <div className="flex items-center justify-between mb-2">
                <Crown className="w-5 h-5 text-chart-3" />
                <Badge className="bg-chart-3/20 text-chart-3 border-0">Classement</Badge>
              </div>
              <div className="text-3xl font-bold mb-1">
                {groups.filter(g => {
                  const members = g.members.sort((a, b) => b.totalPoints - a.totalPoints);
                  return members[0]?.userId === currentUser.id;
                }).length}
              </div>
              <div className="text-sm text-muted-foreground">Groupes en tête</div>
            </Card>
          </div>

          {/* Liste des groupes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">Mes Groupes</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInviteModal(true)}
                className="gap-2"
              >
                <Users className="w-4 h-4" />
                Rejoindre un groupe
              </Button>
            </div>

            {groups.length === 0 ? (
              <Card className="p-12 text-center border-border/50 border-dashed">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">Aucun groupe pour le moment</h3>
                <p className="text-muted-foreground mb-6">
                  Créez votre premier groupe et invitez vos amis à faire des pronostics !
                </p>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Créer mon premier groupe
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groups.map(group => {
                  const currentMember = group.members.find(m => m.userId === currentUser.id);
                  const sortedMembers = [...group.members].sort((a, b) => b.totalPoints - a.totalPoints);
                  const isLeader = sortedMembers[0]?.userId === currentUser.id;
                  
                  return (
                    <Card
                      key={group.id}
                      className="p-6 border-border/50 hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden"
                      onClick={() => handleGroupClick(group)}
                    >
                      {isLeader && (
                        <div className="absolute top-0 right-0">
                          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 transform rotate-45 translate-x-6 -translate-y-6">
                            <Crown className="w-4 h-4 text-white absolute bottom-2 left-2 -rotate-45" />
                          </div>
                        </div>
                      )}

                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                            {group.name}
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="w-3.5 h-3.5" />
                            <span>{group.members.length} membre{group.members.length > 1 ? 's' : ''}</span>
                          </div>
                        </div>
                        
                        {group.members.length === 2 && (
                          <Badge className="bg-gradient-to-r from-primary to-accent text-white border-0">
                            Duel
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                          <span className="text-sm text-muted-foreground">Votre position</span>
                          <div className="flex items-center gap-2">
                            <Medal className="w-4 h-4 text-primary" />
                            <span className="font-bold">
                              {sortedMembers.findIndex(m => m.userId === currentUser.id) + 1}
                              {sortedMembers.findIndex(m => m.userId === currentUser.id) + 1 === 1 ? 'er' : 'e'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                          <span className="text-sm text-muted-foreground">Vos points</span>
                          <span className="font-bold text-primary">{currentMember?.totalPoints || 0} pts</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMakePrediction(group);
                            }}
                          >
                            <Target className="w-3.5 h-3.5 mr-2" />
                            Pronostiquer
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedGroup(group);
                              setViewMode('history');
                            }}
                          >
                            <History className="w-3.5 h-3.5 mr-2" />
                            Historique
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            setGroupToInvite(group);
                          }}
                        >
                          <Users className="w-3.5 h-3.5 mr-2" />
                          Inviter des amis
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Formulaire de pronostics */}
      {viewMode === 'form' && selectedGroup && selectedRace && (
        <PredictionForm
          group={selectedGroup}
          race={selectedRace}
          drivers={drivers}
          onBack={() => {
            setViewMode('groups');
            setSelectedGroup(null);
            setSelectedRace(null);
          }}
          onSubmit={(prediction) => {
            onSubmitPrediction(selectedGroup.id, selectedRace.id, 'RACE', prediction);
            // Retourner à la vue duel ou leaderboard selon le groupe
            if (selectedGroup.members.length === 2) {
              setViewMode('duel');
            } else {
              setViewMode('leaderboard');
            }
          }}
        />
      )}

      {/* Leaderboard */}
      {viewMode === 'leaderboard' && selectedGroup && (
        <GroupLeaderboard
          group={selectedGroup}
          currentUser={currentUser}
          races={races}
          onBack={() => {
            setViewMode('groups');
            setSelectedGroup(null);
          }}
          onMakePrediction={() => {
            if (!nextRace) {
              // Pas de course disponible, on reste sur la vue actuelle
              return;
            }
            setSelectedRace(nextRace);
            setViewMode('form');
          }}
          onInvite={() => setGroupToInvite(selectedGroup)}
        />
      )}

      {/* Duel View */}
      {viewMode === 'duel' && selectedGroup && selectedGroup.members.length === 2 && (
        <DuelView
          group={selectedGroup}
          currentUser={currentUser}
          races={races}
          drivers={drivers}
          userPredictions={userPredictions}
          onBack={() => {
            setViewMode('groups');
            setSelectedGroup(null);
          }}
          onMakePrediction={() => {
            if (!nextRace) {
              // Pas de course disponible, on reste sur la vue actuelle
              return;
            }
            setSelectedRace(nextRace);
            setViewMode('form');
          }}
          onInvite={() => setGroupToInvite(selectedGroup)}
        />
      )}

      {/* Historique */}
      {viewMode === 'history' && selectedGroup && (
        <PredictionHistory
          group={selectedGroup}
          currentUser={currentUser}
          races={races}
          drivers={drivers}
          userPredictions={userPredictions.filter(p => p.groupId === selectedGroup.id)}
          onBack={() => {
            setViewMode('groups');
            setSelectedGroup(null);
          }}
        />
      )}

      {/* Modals */}
      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={(name) => {
          onCreateGroup(name);
          setShowCreateModal(false);
        }}
      />

      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onJoin={(code) => {
          onJoinGroup(code);
          setShowInviteModal(false);
        }}
      />

      {/* Modal d'invitation avec code du groupe */}
      <InviteModal
        isOpen={!!groupToInvite}
        onClose={() => setGroupToInvite(null)}
        onJoin={() => {}}
        inviteCode={groupToInvite?.inviteCode}
        groupName={groupToInvite?.name}
      />
    </div>
  );
}