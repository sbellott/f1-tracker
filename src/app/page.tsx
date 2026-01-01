"use client";

import { useState, useEffect, useMemo } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Calendar, Trophy, Target, Zap, Flag, Moon, Sun, Newspaper, Shield, Loader2 } from 'lucide-react';
import { Countdown } from '@/components/f1/Countdown';
import { CalendarCard } from '@/components/f1/CalendarCard';
import { StandingsTable } from '@/components/f1/StandingsTable';
import { PredictionsModule } from '@/components/f1/PredictionsModule';
import { SessionsTimeline } from '@/components/f1/SessionsTimeline';
import { useF1Data } from '@/lib/hooks/useF1Data';
import type { Prediction, UserPrediction, User } from '@/types';
import { toast } from 'sonner';
import { LoginModal } from '@/components/f1/LoginModal';
import { AuthButton } from '@/components/f1/AuthButton';
import { useAppStore } from '@/store/useAppStore';
import { GlobalSearch } from '@/components/f1/GlobalSearch';
import { NotificationPanel } from '@/components/f1/NotificationPanel';
import { StatsPanel } from '@/components/f1/StatsPanel';
import { useTheme } from 'next-themes';
import { News } from '@/components/f1/News';
import { Explorer } from '@/components/f1/Explorer';
import { DriverDetailView } from '@/components/f1/DriverDetailView';
import { ConstructorDetailView } from '@/components/f1/ConstructorDetailView';
import { CircuitDetailView } from '@/components/f1/CircuitDetailView';
import { UserProfile } from '@/components/f1/UserProfile';
import { AdminPanel } from '@/components/admin/AdminPanel';
import Image from 'next/image';

export default function HomePage() {
  // ============================================
  // NextAuth session
  // ============================================
  const { data: session, status } = useSession();
  const isLoggedIn = status === 'authenticated';
  const isLoading = status === 'loading';

  // ============================================
  // Real F1 Data from API
  // ============================================
  const {
    drivers,
    constructors,
    circuits,
    races,
    nextRace,
    driverStandings,
    constructorStandings,
    isLoading: isDataLoading,
    isError,
  } = useF1Data();

  // ============================================
  // Zustand store for UI state
  // ============================================
  const {
    favorites,
    selectedDriverId,
    selectedCircuitId,
    selectedConstructorId,
    notificationPanelOpen,
    statsPanelOpen,
    setDrivers,
    setConstructors,
    setCircuits,
    setRaces,
    setSelectedDriverId,
    setSelectedCircuitId,
    setSelectedConstructorId,
    setNotificationPanelOpen,
    setStatsPanelOpen,
  } = useAppStore();

  // ============================================
  // Local state for non-persisted data
  // ============================================
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [userPredictions, setUserPredictions] = useState<UserPrediction[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [currentTab, setCurrentTab] = useState('home');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const { theme, setTheme } = useTheme();

  // Create user object from session
  const currentUser: User | null = session?.user ? {
    id: session.user.id || '',
    email: session.user.email || '',
    pseudo: session.user.name || session.user.email?.split('@')[0] || 'Utilisateur',
    avatar: session.user.image || undefined,
    firstName: session.user.name?.split(' ')[0] || '',
    lastName: session.user.name?.split(' ').slice(1).join(' ') || '',
    createdAt: new Date(),
    stats: {
      totalPoints: 0,
      predictions: 0,
      rank: 0,
      badges: 0,
      streak: 0,
      bestRank: 0,
    },
  } : null;

  // Note: Data now comes from React Query hooks (useF1Data), no need to sync to Zustand

  const handlePredictionSubmit = (raceId: string, prediction: Prediction) => {
    setPredictions(prev => ({ ...prev, [raceId]: prediction }));
    console.log('Prediction submitted for race:', raceId, prediction);
  };

  const handleCreateGroup = async (name: string) => {
    if (!currentUser) {
      toast.error('Connexion requise', {
        description: 'Vous devez être connecté pour créer un groupe.',
      });
      setShowLoginModal(true);
      return;
    }

    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      
      if (!res.ok) throw new Error('Failed to create group');
      
      const data = await res.json();
      setGroups([...groups, data.data]);
      toast.success('Groupe créé !', {
        description: `"${name}" a été créé avec succès. Code: ${data.data.inviteCode}`,
      });
    } catch (error) {
      toast.error('Erreur', {
        description: 'Impossible de créer le groupe.',
      });
    }
  };

  const handleJoinGroup = async (inviteCode: string) => {
    if (!currentUser) {
      toast.error('Connexion requise', {
        description: 'Vous devez être connecté pour rejoindre un groupe.',
      });
      setShowLoginModal(true);
      return;
    }

    try {
      const res = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to join group');
      }
      
      const data = await res.json();
      setGroups([...groups, data.data]);
      toast.success('Groupe rejoint !', {
        description: `Vous avez rejoint "${data.data.name}".`,
      });
    } catch (error: any) {
      toast.error('Erreur', {
        description: error.message || "Ce code d'invitation n'existe pas.",
      });
    }
  };

  const handleSubmitPrediction = async (groupId: string, raceId: string, sessionType: 'RACE' | 'SPRINT', prediction: any) => {
    if (!currentUser) {
      toast.error('Connexion requise');
      setShowLoginModal(true);
      return;
    }

    try {
      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          raceId,
          topTen: prediction.topTen || prediction.positions,
          polePosition: prediction.pole,
          fastestLap: prediction.fastestLap,
        }),
      });
      
      if (!res.ok) throw new Error('Failed to submit prediction');
      
      const data = await res.json();
      setUserPredictions([...userPredictions, data.data]);
      
      const race = races.find(r => r.id === raceId);
      toast.success('Pronostic enregistré !', {
        description: `Votre pronostic pour ${race?.name} a été enregistré.`,
      });
    } catch (error) {
      toast.error('Erreur', {
        description: 'Impossible d\'enregistrer le pronostic.',
      });
    }
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      
      if (result?.error) {
        toast.error('Erreur de connexion', {
          description: 'Email ou mot de passe incorrect.',
        });
        return;
      }
      
      setShowLoginModal(false);
      toast.success('Connexion réussie !', {
        description: 'Bienvenue sur F1 Tracker !',
      });
    } catch (error) {
      toast.error('Erreur', {
        description: 'Une erreur est survenue.',
      });
    }
  };

  const handleRegister = async (firstName: string, lastName: string, email: string, password: string) => {
    try {
      // Create pseudo without spaces (validation only allows letters, numbers, underscores, hyphens)
      const pseudo = `${firstName}_${lastName}`.replace(/\s+/g, '_').toLowerCase();
      
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          confirmPassword: password,
          pseudo,
        }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Registration failed');
      }
      
      // Auto-login after registration
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      
      if (result?.ok) {
        setShowLoginModal(false);
        toast.success('Compte créé !', {
          description: 'Bienvenue sur F1 Tracker !',
        });
      }
    } catch (error: any) {
      toast.error('Erreur', {
        description: error.message || 'Impossible de créer le compte.',
      });
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    setShowProfile(false);
    toast.info('Déconnexion', {
      description: 'À bientôt sur F1 Tracker !',
    });
  };

  const handleProfileClick = () => {
    setShowProfile(true);
  };

  const handleStandingsClick = () => {
    setShowProfile(false);
    setCurrentTab('standings');
  };

  const handlePredictionsClick = () => {
    setShowProfile(false);
    setCurrentTab('predictions');
  };

  const handleBadgesClick = () => {
    setShowProfile(true);
    toast.info('Badges', {
      description: 'Consultez vos badges dans votre profil',
    });
  };

  const handleSettingsClick = () => {
    toast.info('Paramètres', {
      description: 'Section en développement',
    });
  };

  const handleAdminClick = () => {
    setShowProfile(false);
    setShowAdmin(true);
  };

  const nextSession = nextRace?.sessions?.find(s => !s.completed);
  const selectedRaceId = nextRace ? nextRace.id : '';
  const selectedRace = races.find(r => r.id === selectedRaceId) || nextRace;
  const selectedRacePrediction = selectedRaceId ? predictions[selectedRaceId] : null;

  // Show loading state
  if (isDataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Chargement des données F1...</p>
        </div>
      </div>
    );
  }

  // Show Admin Panel if requested
  if (showAdmin) {
    return (
      <AdminPanel
        drivers={drivers}
        constructors={constructors}
        circuits={circuits}
        races={races}
        onUpdateDrivers={setDrivers}
        onUpdateConstructors={setConstructors}
        onUpdateCircuits={setCircuits}
        onUpdateRaces={setRaces}
        onClose={() => setShowAdmin(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Ultra Clean Header */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-background/70 border-b border-border/50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => setCurrentTab('home')}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <Image
                src="/f1-logo.svg"
                alt="Formula 1"
                width={80}
                height={32}
                className="h-8 w-auto"
              />
            </button>

            {/* Global Search */}
            <GlobalSearch
              drivers={drivers}
              constructors={constructors}
              circuits={circuits}
              favorites={favorites}
              onDriverSelect={setSelectedDriverId}
              onConstructorSelect={setSelectedConstructorId}
              onCircuitSelect={setSelectedCircuitId}
              onNavigate={setCurrentTab}
            />

            <div className="flex items-center gap-2">
              {/* Notifications Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setNotificationPanelOpen(true)}
                className="rounded-xl w-10 h-10 relative"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg">
                  2
                </span>
              </Button>

              {/* Stats Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setStatsPanelOpen(true)}
                className="rounded-xl w-10 h-10"
              >
                <Trophy className="w-4 h-4" />
              </Button>

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="rounded-xl w-10 h-10"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>

              {/* Auth Button */}
              <AuthButton
                user={currentUser}
                onLogin={() => setShowLoginModal(true)}
                onLogout={handleLogout}
                onProfileClick={handleProfileClick}
                onStandingsClick={handleStandingsClick}
                onPredictionsClick={handlePredictionsClick}
                onBadgesClick={handleBadgesClick}
                onSettingsClick={handleSettingsClick}
                onAdminClick={handleAdminClick}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Show Profile if showProfile is true */}
        {showProfile && isLoggedIn && currentUser ? (
          <div className="space-y-6">
            <Button
              variant="ghost"
              onClick={() => {
                setShowProfile(false);
              }}
              className="mb-4"
            >
              ← Retour
            </Button>
            <UserProfile
              user={currentUser}
              onClose={() => {
                setShowProfile(false);
              }}
            />
          </div>
        ) : (
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-8">
            <TabsList className="inline-flex w-auto bg-muted/50 p-1.5 rounded-2xl">
              <TabsTrigger value="calendar" className="gap-2 rounded-xl data-[state=active]:shadow-sm">
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Calendrier</span>
              </TabsTrigger>
              <TabsTrigger value="standings" className="gap-2 rounded-xl data-[state=active]:shadow-sm">
                <Trophy className="w-4 h-4" />
                <span className="hidden sm:inline">Classements</span>
              </TabsTrigger>
              <TabsTrigger value="predictions" className="gap-2 rounded-xl data-[state=active]:shadow-sm">
                <Target className="w-4 h-4" />
                <span className="hidden sm:inline">Pronostics</span>
              </TabsTrigger>
              <TabsTrigger value="news" className="gap-2 rounded-xl data-[state=active]:shadow-sm">
                <Newspaper className="w-4 h-4" />
                <span className="hidden sm:inline">News</span>
              </TabsTrigger>
              <TabsTrigger value="explorer" className="gap-2 rounded-xl data-[state=active]:shadow-sm">
                <Zap className="w-4 h-4" />
                <span className="hidden sm:inline">Explorer</span>
              </TabsTrigger>
            </TabsList>

            {/* Home Tab */}
            <TabsContent value="home" className="space-y-8 fade-in">
              {/* Hero Section */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/95 to-primary/80 p-8 lg:p-12 shadow-xl shadow-primary/20">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white mb-4 text-sm">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Live - Saison 2025</span>
                  </div>
                  <h2 className="text-3xl lg:text-5xl font-bold text-white mb-3">
                    Suivez la Formule 1
                  </h2>
                  <p className="text-white/90 text-lg max-w-xl">
                    Classements en temps réel, calendrier complet et pronostics entre amis
                  </p>
                </div>
              </div>

              {nextSession && nextRace && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Countdown
                    nextSession={nextSession}
                    raceName={nextRace.name}
                  />
                  <SessionsTimeline race={nextRace} />
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 hover:shadow-lg transition-all border border-primary/10">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <div className="relative">
                    <div className="text-4xl font-bold mb-1 bg-gradient-to-br from-primary to-primary/70 bg-clip-text text-transparent">
                      {races.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Courses</div>
                  </div>
                </div>
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent/10 via-accent/5 to-transparent p-6 hover:shadow-lg transition-all border border-accent/10">
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <div className="relative">
                    <div className="text-4xl font-bold mb-1 bg-gradient-to-br from-accent to-accent/70 bg-clip-text text-transparent">
                      {drivers.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Pilotes</div>
                  </div>
                </div>
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-chart-4/10 via-chart-4/5 to-transparent p-6 hover:shadow-lg transition-all border border-chart-4/10">
                  <div className="absolute inset-0 bg-gradient-to-br from-chart-4/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <div className="relative">
                    <div className="text-4xl font-bold mb-1 bg-gradient-to-br from-chart-4 to-chart-4/70 bg-clip-text text-transparent">
                      {constructors.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Écuries</div>
                  </div>
                </div>
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-chart-3/10 via-chart-3/5 to-transparent p-6 hover:shadow-lg transition-all border border-chart-3/10">
                  <div className="absolute inset-0 bg-gradient-to-br from-chart-3/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <div className="relative">
                    <div className="text-4xl font-bold mb-1 bg-gradient-to-br from-chart-3 to-chart-3/70 bg-clip-text text-transparent">
                      {races.filter(r => r.hasSprint).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Sprints</div>
                  </div>
                </div>
              </div>

              {/* Feature Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="group hover:shadow-xl hover:shadow-primary/5 transition-all border-border/50 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <CardHeader className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">Classements live</CardTitle>
                    <CardDescription className="text-base">
                      Suivez l&apos;évolution du championnat pilotes et constructeurs en temps réel
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="group hover:shadow-xl hover:shadow-accent/5 transition-all border-border/50 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <CardHeader className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center mb-4 shadow-lg shadow-accent/20">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">Pronostics</CardTitle>
                    <CardDescription className="text-base">
                      Défiez vos amis avec des prédictions de course et comparez vos scores
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="group hover:shadow-xl hover:shadow-chart-3/5 transition-all border-border/50 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-chart-3/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <CardHeader className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-chart-3 to-chart-3/80 flex items-center justify-center mb-4 shadow-lg shadow-chart-3/20">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">Calendrier</CardTitle>
                    <CardDescription className="text-base">
                      {races.length} courses avec horaires complets et countdowns par session
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </TabsContent>

            {/* Calendar Tab */}
            <TabsContent value="calendar" className="space-y-8 fade-in">
              {selectedCircuitId ? (
                (() => {
                  const selectedCircuit = circuits.find(c => c.id === selectedCircuitId);
                  const circuitIndex = circuits.findIndex(c => c.id === selectedCircuitId);
                  const circuitImages = [
                    "https://images.unsplash.com/photo-1540747913346-19e32778e8e5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyYWNlJTIwdHJhY2slMjBhZXJpYWx8ZW58MXx8fHwxNzY3MTU0NTM5fDA&ixlib=rb-4.1.0&q=80&w=1080",
                    "https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3RvcnNwb3J0JTIwdHJhY2t8ZW58MXx8fHwxNzY3MTU0NTQwfDA&ixlib=rb-4.1.0&q=80&w=1080",
                    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyYWNpbmclMjBjaXJjdWl0fGVufDF8fHx8MTc2NzE1NDU0MHww&ixlib=rb-4.1.0&q=80&w=1080"
                  ];
                  const circuitImage = circuitImages[circuitIndex % circuitImages.length];

                  return selectedCircuit ? (
                    <CircuitDetailView
                      circuit={selectedCircuit}
                      drivers={drivers}
                      constructors={constructors}
                      onBack={() => setSelectedCircuitId(null)}
                      circuitImage={circuitImage}
                    />
                  ) : null;
                })()
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-bold mb-2">Calendrier 2025</h2>
                      <p className="text-muted-foreground text-lg">
                        {races.length} courses - {races.filter(r => r.hasSprint).length} weekends Sprint
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {races.map(race => {
                      const circuit = circuits.find(c => c.id === race.circuitId);
                      return circuit ? (
                        <div key={race.id} onClick={() => setSelectedCircuitId(circuit.id)}>
                          <CalendarCard race={race} circuit={circuit} />
                        </div>
                      ) : null;
                    })}
                  </div>
                </>
              )}
            </TabsContent>

            {/* Standings Tab */}
            <TabsContent value="standings" className="space-y-8 fade-in">
              <div>
                <h2 className="text-3xl font-bold mb-2">Classements 2025</h2>
                <p className="text-muted-foreground text-lg">Après {races[0]?.round || 0} course(s)</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                <StandingsTable
                  standings={driverStandings}
                  drivers={drivers}
                  constructors={constructors}
                  type="drivers"
                />
                <StandingsTable
                  standings={constructorStandings}
                  constructors={constructors}
                  type="constructors"
                />
              </div>
            </TabsContent>

            {/* Predictions Tab */}
            <TabsContent value="predictions" className="space-y-8 fade-in">
              <div>
                <h2 className="text-3xl font-bold mb-2">Mes pronostics</h2>
                <p className="text-muted-foreground text-lg">Faites vos prédictions pour la prochaine course</p>
              </div>

              {!isLoggedIn && (
                <Card className="border-amber-200 dark:border-amber-900/30 bg-gradient-to-br from-amber-50 to-amber-50/50 dark:from-amber-950/20 dark:to-amber-950/10">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <div className="text-3xl">🔐</div>
                      <div>
                        <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2 text-lg">
                          Connexion requise
                        </h4>
                        <p className="text-amber-800 dark:text-amber-200 mb-4">
                          Connectez-vous pour créer des groupes et soumettre vos pronostics.
                        </p>
                        <Button onClick={() => setShowLoginModal(true)} className="bg-primary">
                          Se connecter
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {currentUser && (
                <PredictionsModule
                  currentUser={currentUser}
                  groups={groups}
                  races={races}
                  drivers={drivers}
                  userPredictions={userPredictions}
                  onCreateGroup={handleCreateGroup}
                  onJoinGroup={handleJoinGroup}
                  onSubmitPrediction={handleSubmitPrediction}
                />
              )}
            </TabsContent>

            {/* News Tab */}
            <TabsContent value="news" className="space-y-8 fade-in">
              <div>
                <h2 className="text-3xl font-bold mb-2">News F1</h2>
                <p className="text-muted-foreground text-lg">Actualités et dernières nouvelles de la Formule 1</p>
              </div>
              <News />
            </TabsContent>

            {/* Explorer Tab */}
            <TabsContent value="explorer" className="space-y-8 fade-in">
              {selectedDriverId ? (
                (() => {
                  const selectedDriver = drivers.find(d => d.id === selectedDriverId);
                  const selectedConstructor = selectedDriver
                    ? constructors.find(c => c.id === selectedDriver.constructorId)
                    : null;
                  const driverIndex = drivers.findIndex(d => d.id === selectedDriverId);
                  const driverImages = [
                    "https://images.unsplash.com/photo-1696581081893-6b2510101bef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
                    "https://images.unsplash.com/photo-1604312142152-ebfe999a75ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
                    "https://images.unsplash.com/photo-1650574583439-faa89ad8e6c1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
                  ];
                  const driverImage = driverImages[driverIndex % driverImages.length];

                  return selectedDriver && selectedConstructor ? (
                    <DriverDetailView
                      driver={selectedDriver}
                      constructor={selectedConstructor}
                      races={races}
                      onBack={() => setSelectedDriverId(null)}
                      driverImage={driverImage}
                    />
                  ) : null;
                })()
              ) : selectedConstructorId ? (
                (() => {
                  const selectedConstructor = constructors.find(c => c.id === selectedConstructorId);
                  const constructorIndex = constructors.findIndex(c => c.id === selectedConstructorId);
                  const constructorImages = [
                    "https://images.unsplash.com/photo-1540747913346-19e32778e8e5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
                    "https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
                    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
                  ];
                  const constructorImage = constructorImages[constructorIndex % constructorImages.length];

                  return selectedConstructor ? (
                    <ConstructorDetailView
                      constructor={selectedConstructor}
                      drivers={drivers}
                      onBack={() => setSelectedConstructorId(null)}
                      constructorImage={constructorImage}
                    />
                  ) : null;
                })()
              ) : (
                <Explorer
                  drivers={drivers}
                  constructors={constructors}
                  onDriverClick={setSelectedDriverId}
                  onConstructorClick={setSelectedConstructorId}
                />
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Refined Footer */}
      <footer className="border-t border-border/50 mt-20 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                <Flag className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg">F1 Tracker</span>
            </div>
            <p className="text-muted-foreground">
              Données réelles F1 2025 - Propulsé par Supabase
            </p>
          </div>

          {/* Admin Access Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => setShowAdmin(true)}
              className="gap-2 hover:bg-primary/10 hover:border-primary/50"
            >
              <Shield className="w-4 h-4" />
              Accès Administration
            </Button>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />

      {/* Notification Panel */}
      <NotificationPanel
        open={notificationPanelOpen}
        onOpenChange={setNotificationPanelOpen}
        unreadCount={2}
      />

      {/* Stats Panel */}
      <StatsPanel
        open={statsPanelOpen}
        onOpenChange={setStatsPanelOpen}
      />
    </div>
  );
}