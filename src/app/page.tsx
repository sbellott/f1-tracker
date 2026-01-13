"use client";

import { useState, useEffect, useMemo } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Calendar, Trophy, Target, Zap, Flag, Moon, Sun, Newspaper, Shield, Loader2, Globe, Users, Swords } from 'lucide-react';
import { Countdown } from '@/components/f1/Countdown';
import { CalendarCard } from '@/components/f1/CalendarCard';
import { StandingsTable } from '@/components/f1/StandingsTable';
import { PredictionsModule } from '@/components/f1/PredictionsModule';
import { SessionsTimeline } from '@/components/f1/SessionsTimeline';
import { useF1Data, useDriverStandings, useConstructorStandings, useCalendar } from '@/lib/hooks/useF1Data';
import type { Prediction, UserPrediction, User } from '@/types';
import { toast } from 'sonner';
import { LoginModal } from '@/components/f1/LoginModal';
import { AuthButton } from '@/components/f1/AuthButton';
import { useAppStore } from '@/store/useAppStore';
import { GlobalSearch } from '@/components/f1/GlobalSearch';
import { NotificationPanel } from '@/components/f1/NotificationPanel';
import { useUnreadCount } from '@/lib/hooks/use-notifications';
import { StatsPanel } from '@/components/f1/StatsPanel';
import { useTheme } from 'next-themes';
import { News } from '@/components/f1/News';
import { Explorer } from '@/components/f1/Explorer';
import { getF1HeroImageUrl } from '@/lib/utils/circuit-images';
import { DriverDetailView } from '@/components/f1/DriverDetailView';
import { ConstructorDetailView } from '@/components/f1/ConstructorDetailView';
import { CircuitDetailView } from '@/components/f1/CircuitDetailView';
import { UserProfile } from '@/components/f1/UserProfile';
import { AdminPanel } from '@/components/admin/AdminPanel';
import Image from 'next/image';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { GroupsSection } from '@/components/groups';

// Race Countdown Component
function RaceCountdown({ targetDate }: { targetDate: Date | string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const target = targetDate instanceof Date ? targetDate : new Date(targetDate);
      const difference = target.getTime() - new Date().getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex gap-3">
      {[
        { value: timeLeft.days, label: 'Days' },
        { value: timeLeft.hours, label: 'Hrs' },
        { value: timeLeft.minutes, label: 'Min' },
        { value: timeLeft.seconds, label: 'Sec' }
      ].map((item, index) => (
        <div key={index} className="text-center">
          <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl px-4 py-3 min-w-[60px] shadow-lg shadow-red-600/20">
            <div className="text-2xl lg:text-3xl font-bold text-white tabular-nums">
              {String(item.value).padStart(2, '0')}
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-1.5">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

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
  const [opponentPredictions, setOpponentPredictions] = useState<UserPrediction[]>([]);
  const [opponent, setOpponent] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState('home');
  const [predictionsSubTab, setPredictionsSubTab] = useState<'duel' | 'groups'>('duel');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [standingsSeason, setStandingsSeason] = useState(2026);
  const [standingsSelectedDriverId, setStandingsSelectedDriverId] = useState<string | null>(null);
  const [standingsSelectedRaceId, setStandingsSelectedRaceId] = useState<string | null>(null);
  const [explorerTab, setExplorerTab] = useState<'drivers' | 'constructors'>('drivers');
  const { theme, setTheme } = useTheme();

  // Notifications
  const { data: unreadCount = 0 } = useUnreadCount();

  // ============================================
  // Handle tab changes - reset circuit selection when leaving/entering calendar
  // ============================================
  const handleTabChange = (newTab: string) => {
    // Reset selections when clicking on tabs to return to main view
    if (newTab === 'calendar') {
      setSelectedCircuitId(null);
    }
    if (newTab === 'explorer') {
      setSelectedDriverId(null);
      setSelectedConstructorId(null);
    }
    if (newTab === 'standings') {
      setStandingsSelectedDriverId(null);
    }
    setCurrentTab(newTab);
  };

  // Helper to scroll to top when navigating to detail views
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handlers for detail view navigation with scroll to top
  const handleDriverSelect = (driverId: string | null) => {
    if (driverId) {
      setExplorerTab('drivers'); // Remember we're on drivers tab
    }
    setSelectedDriverId(driverId);
    if (driverId) scrollToTop();
  };

  const handleStandingsDriverSelect = (driverId: string | null) => {
    setStandingsSelectedDriverId(driverId);
    if (driverId) scrollToTop();
  };

  const handleConstructorSelect = (constructorId: string | null) => {
    if (constructorId) {
      setExplorerTab('constructors'); // Remember we're on constructors tab
    }
    setSelectedConstructorId(constructorId);
    if (constructorId) scrollToTop();
  };

  const handleCircuitSelect = (circuitId: string | null) => {
    setSelectedCircuitId(circuitId);
    if (circuitId) scrollToTop();
  };

  // ============================================
  // Handle circuit click - scroll to top and select circuit
  // ============================================
  const handleCircuitClick = (circuitId: string) => {
    setSelectedCircuitId(circuitId);
    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ============================================
  // Fetch opponent and predictions when logged in
  // ============================================
  useEffect(() => {
    const fetchDuelData = async () => {
      if (!isLoggedIn || !session?.user?.id) {
        setOpponent(null);
        setUserPredictions([]);
        setOpponentPredictions([]);
        return;
      }

      try {
        // Fetch all duel data in one call
        const res = await fetch('/api/duel');
        if (res.ok) {
          const data = await res.json();

          // Set opponent
          if (data.data?.opponent) {
            const opp = data.data.opponent;
            setOpponent({
              id: opp.id,
              email: opp.email,
              pseudo: opp.pseudo || opp.email?.split('@')[0],
              firstName: opp.pseudo?.split('_')[0] || '',
              lastName: opp.pseudo?.split('_')[1] || '',
              avatar: opp.avatar,
              createdAt: new Date(opp.createdAt),
              stats: { totalPoints: 0, predictions: 0, rank: 0, badges: 0, streak: 0, bestRank: 0 },
            });
          }

          // Set predictions
          setUserPredictions(data.data?.userPredictions || []);
          setOpponentPredictions(data.data?.opponentPredictions || []);
        }
      } catch (error) {
        console.error('Failed to fetch duel data:', error);
      }
    };

    fetchDuelData();
  }, [isLoggedIn, session?.user?.id]);

  // Historical standings queries
  const { data: historicalDriverStandings, isLoading: isDriverStandingsLoading } = useDriverStandings(standingsSeason);
  const { data: historicalConstructorStandings, isLoading: isConstructorStandingsLoading } = useConstructorStandings(standingsSeason);
  
  // Calendar for selected standings season (for race filter)
  const { data: standingsSeasonRaces } = useCalendar(standingsSeason);

  // Create user object from session
  const currentUser: User | null = session?.user ? {
    id: session.user.id || '',
    email: session.user.email || '',
    pseudo: session.user.name || session.user.email?.split('@')[0] || 'User',
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

  const handleSubmitPrediction = async (raceId: string, sessionType: 'RACE' | 'SPRINT', prediction: Prediction) => {
    if (!currentUser) {
      toast.error('Login required');
      setShowLoginModal(true);
      return;
    }

    try {
      // Convert Prediction type to API format
      const topTen = [
        prediction.p1, prediction.p2, prediction.p3, prediction.p4, prediction.p5,
        prediction.p6, prediction.p7, prediction.p8, prediction.p9, prediction.p10
      ].filter(Boolean);

      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raceId,
          topTen,
          polePosition: prediction.pole,
          fastestLap: prediction.fastestLap,
        }),
      });
      
      if (!res.ok) throw new Error('Failed to submit prediction');
      
      const data = await res.json();
      setUserPredictions(prev => {
        // Replace existing prediction for this race or add new one
        const existing = prev.findIndex(p => p.raceId === raceId);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = data.data;
          return updated;
        }
        return [...prev, data.data];
      });
      
      const race = races.find(r => r.id === raceId);
      toast.success('Prediction saved!', {
        description: `Your prediction for ${race?.name} has been saved.`,
      });
    } catch (error) {
      toast.error('Error', {
        description: 'Unable to save prediction.',
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
        toast.error('Login error', {
          description: 'Incorrect email or password.',
        });
        return;
      }
      
      setShowLoginModal(false);
      toast.success('Login successful!', {
        description: 'Welcome to F1 Tracker!',
      });
    } catch (error) {
      toast.error('Error', {
        description: 'An error occurred.',
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
        toast.success('Account created!', {
          description: 'Welcome to F1 Tracker!',
        });
      }
    } catch (error: any) {
      toast.error('Error', {
        description: error.message || 'Unable to create account.',
      });
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    setShowProfile(false);
    toast.info('Logged out', {
      description: 'See you soon on F1 Tracker!',
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
      description: 'View your badges in your profile',
    });
  };

  const handleSettingsClick = () => {
    toast.info('Settings', {
      description: 'Section under development',
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
          <p className="text-muted-foreground">Loading F1 data...</p>
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
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
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
              ← Back
            </Button>
            <UserProfile
              user={currentUser}
              onClose={() => {
                setShowProfile(false);
              }}
            />
          </div>
        ) : (
          <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-8">
            <TabsList className="inline-flex w-auto bg-muted/50 p-1.5 rounded-2xl">
              <TabsTrigger value="calendar" className="gap-2 rounded-xl data-[state=active]:shadow-sm">
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Calendar</span>
              </TabsTrigger>
              <TabsTrigger value="standings" className="gap-2 rounded-xl data-[state=active]:shadow-sm">
                <Trophy className="w-4 h-4" />
                <span className="hidden sm:inline">Standings</span>
              </TabsTrigger>
              <TabsTrigger value="predictions" className="gap-2 rounded-xl data-[state=active]:shadow-sm">
                <Target className="w-4 h-4" />
                <span className="hidden sm:inline">Predictions</span>
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
                    <span>Live - 2026 Season</span>
                  </div>
                  <h2 className="text-3xl lg:text-5xl font-bold text-white mb-3">
                    Forza Ferrari
                  </h2>
                  <p className="text-white/90 text-lg max-w-xl">
                    Real-time standings, full calendar and predictions with friends
                  </p>
                </div>
              </div>

              {/* Next Race Countdown Widget */}
              {nextRace && (() => {
                const raceSession = nextRace.sessions?.find(s => s.type === 'RACE');
                if (!raceSession) return null;

                return (
                  <Card className="overflow-hidden border-red-500/30 bg-gradient-to-br from-red-950/20 via-background to-background shadow-xl shadow-red-500/10">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-600/30">
                            <Flag className="w-7 h-7 text-white" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Next Race</p>
                            <h3 className="text-2xl font-bold">{nextRace.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(raceSession.dateTime).toLocaleDateString('en-US', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                        <RaceCountdown targetDate={raceSession.dateTime} />
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}

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
                    <div className="text-sm text-muted-foreground">Races</div>
                  </div>
                </div>
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent/10 via-accent/5 to-transparent p-6 hover:shadow-lg transition-all border border-accent/10">
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <div className="relative">
                    <div className="text-4xl font-bold mb-1 bg-gradient-to-br from-accent to-accent/70 bg-clip-text text-transparent">
                      {drivers.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Drivers</div>
                  </div>
                </div>
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-chart-4/10 via-chart-4/5 to-transparent p-6 hover:shadow-lg transition-all border border-chart-4/10">
                  <div className="absolute inset-0 bg-gradient-to-br from-chart-4/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <div className="relative">
                    <div className="text-4xl font-bold mb-1 bg-gradient-to-br from-chart-4 to-chart-4/70 bg-clip-text text-transparent">
                      {constructors.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Teams</div>
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
                    <CardTitle className="text-xl">Live standings</CardTitle>
                    <CardDescription className="text-base">
                      Follow the drivers and constructors championship evolution in real-time
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="group hover:shadow-xl hover:shadow-accent/5 transition-all border-border/50 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <CardHeader className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center mb-4 shadow-lg shadow-accent/20">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">Predictions</CardTitle>
                    <CardDescription className="text-base">
                      Challenge your friends with race predictions and compare your scores
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="group hover:shadow-xl hover:shadow-chart-3/5 transition-all border-border/50 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-chart-3/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <CardHeader className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-chart-3 to-chart-3/80 flex items-center justify-center mb-4 shadow-lg shadow-chart-3/20">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">Calendar</CardTitle>
                    <CardDescription className="text-base">
                      {races.length} races with full schedules and session countdowns
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
                  // Use official F1 hero image based on circuit country
                  const circuitImage = selectedCircuit ? getF1HeroImageUrl(selectedCircuit.country) : '';

                  // Filter races for this circuit
                  const circuitRaces = races.filter(r => r.circuitId === selectedCircuitId);

                  return selectedCircuit ? (
                    <CircuitDetailView
                      circuit={selectedCircuit}
                      drivers={drivers}
                      constructors={constructors}
                      races={circuitRaces}
                      onBack={() => setSelectedCircuitId(null)}
                      circuitImage={circuitImage}
                    />
                  ) : null;
                })()
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-bold mb-2">2026 Calendar</h2>
                      <p className="text-muted-foreground text-lg">
                        {races.length} races - {races.filter(r => r.hasSprint).length} Sprint weekends
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {races.map(race => {
                      const circuit = circuits.find(c => c.id === race.circuitId);
                      return circuit ? (
                        <div key={race.id} onClick={() => handleCircuitClick(circuit.id)} className="cursor-pointer">
                          <CalendarCard 
                            race={race} 
                            circuit={circuit}
                            drivers={drivers}
                            constructors={constructors}
                          />
                        </div>
                      ) : null;
                    })}
                  </div>
                </>
              )}
            </TabsContent>

            {/* Standings Tab */}
            <TabsContent value="standings" className="space-y-8 fade-in">
              {standingsSelectedDriverId ? (
                (() => {
                  const selectedDriver = drivers.find(d => d.id === standingsSelectedDriverId);
                  const selectedConstructor = selectedDriver
                    ? constructors.find(c => c.id === selectedDriver.constructorId)
                    : null;

                  return selectedDriver && selectedConstructor ? (
                    <DriverDetailView
                      driver={selectedDriver}
                      constructor={selectedConstructor}
                      races={races}
                      onBack={() => setStandingsSelectedDriverId(null)}
                    />
                  ) : null;
                })()
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 className="text-3xl font-bold mb-2">{standingsSeason} Standings</h2>
                      <p className="text-muted-foreground text-lg">
                        {standingsSeason === 2026 
                          ? `After ${races[0]?.round || 0} race(s)` 
                          : 'Final season standings'}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {[2026, 2025, 2024, 2023, 2022, 2021].map((year) => (
                        <Button
                          key={year}
                          variant={standingsSeason === year ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setStandingsSeason(year);
                            setStandingsSelectedRaceId(null); // Reset race filter when changing season
                          }}
                          className={standingsSeason === year ? "bg-red-600 hover:bg-red-700" : ""}
                        >
                          {year}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {(isDriverStandingsLoading || isConstructorStandingsLoading) ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-red-500" />
                      <span className="ml-3 text-muted-foreground">Loading standings...</span>
                    </div>
                  ) : (
                    <>
                      {/* Global Race Filter */}
                      {standingsSeasonRaces && standingsSeasonRaces.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-sm font-medium text-muted-foreground mb-3">
                            {standingsSelectedRaceId 
                              ? `Résultats du ${standingsSeasonRaces.find(r => r.id === standingsSelectedRaceId)?.name || 'Grand Prix'}`
                              : 'Filtrer par course'
                            }
                          </h3>
                          <ScrollArea className="w-full whitespace-nowrap">
                            <div className="flex gap-2 pb-2">
                              {/* Global standings pill */}
                              <Button
                                variant={standingsSelectedRaceId === null ? "default" : "outline"}
                                size="sm"
                                onClick={() => setStandingsSelectedRaceId(null)}
                                className={`flex items-center gap-1.5 shrink-0 ${
                                  standingsSelectedRaceId === null ? "bg-red-600 hover:bg-red-700" : ""
                                }`}
                              >
                                <Globe className="w-3.5 h-3.5" />
                                <span>Classement global</span>
                              </Button>
                              
                              {/* Race pills */}
                              {standingsSeasonRaces
                                .filter(race => race.sessions?.some(s => s.type === 'RACE'))
                                .map((race) => {
                                  const raceSession = race.sessions?.find(s => s.type === 'RACE');
                                  const hasResults = (raceSession?.results?.positions?.length ?? 0) > 0 || raceSession?.completed;
                                  return (
                                    <Button
                                      key={race.id}
                                      variant={standingsSelectedRaceId === race.id ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => setStandingsSelectedRaceId(race.id)}
                                      className={`flex items-center gap-1.5 shrink-0 ${
                                        standingsSelectedRaceId === race.id ? "bg-red-600 hover:bg-red-700" : ""
                                      } ${!hasResults ? "opacity-60" : ""}`}
                                    >
                                      <Flag className="w-3.5 h-3.5" />
                                      <span className="hidden sm:inline">{race.name.replace(' Grand Prix', '')}</span>
                                      <span className="sm:hidden">R{race.round}</span>
                                      {!hasResults && <span className="text-xs ml-1">📅</span>}
                                    </Button>
                                  );
                                })}
                            </div>
                            <ScrollBar orientation="horizontal" />
                          </ScrollArea>
                        </div>
                      )}

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                        <StandingsTable
                          standings={historicalDriverStandings || []}
                          drivers={drivers}
                          constructors={constructors}
                          races={standingsSeasonRaces}
                          type="drivers"
                          selectedRaceId={standingsSelectedRaceId}
                          onRaceSelect={setStandingsSelectedRaceId}
                          onDriverClick={handleStandingsDriverSelect}
                        />
                        <StandingsTable
                          standings={historicalConstructorStandings || []}
                          constructors={constructors}
                          races={standingsSeasonRaces}
                          type="constructors"
                          selectedRaceId={standingsSelectedRaceId}
                          onRaceSelect={setStandingsSelectedRaceId}
                        />
                      </div>
                    </>
                  )}
                </>
              )}
            </TabsContent>

            {/* Predictions Tab */}
            <TabsContent value="predictions" className="space-y-6 fade-in">
              {/* Sub-tabs for Duel vs Groups */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold mb-1">Pronostics</h2>
                  <p className="text-muted-foreground">
                    {predictionsSubTab === 'duel' 
                      ? 'Affrontez vos adversaires sur chaque course'
                      : 'Créez ou rejoignez des ligues de pronostics'}
                  </p>
                </div>
                <div className="flex gap-1 p-1 bg-muted rounded-lg">
                  <Button
                    variant={predictionsSubTab === 'duel' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setPredictionsSubTab('duel')}
                    className="gap-2"
                  >
                    <Swords className="h-4 w-4" />
                    Duel
                  </Button>
                  <Button
                    variant={predictionsSubTab === 'groups' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setPredictionsSubTab('groups')}
                    className="gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Groupes
                  </Button>
                </div>
              </div>

              {/* Duel Sub-Tab Content */}
              {predictionsSubTab === 'duel' && (
                <>
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
                              Connectez-vous pour accéder au duel et soumettre vos pronostics.
                            </p>
                            <Button onClick={() => setShowLoginModal(true)} className="bg-primary">
                              Se connecter
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {currentUser && !opponent && (
                    <Card className="border-blue-200 dark:border-blue-900/30 bg-gradient-to-br from-blue-50 to-blue-50/50 dark:from-blue-950/20 dark:to-blue-950/10">
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          <div className="text-3xl">👤</div>
                          <div>
                            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 text-lg">
                              En attente d'un adversaire
                            </h4>
                            <p className="text-blue-800 dark:text-blue-200">
                              Le duel commencera dès que un second utilisateur rejoindra l'application.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {currentUser && opponent && (
                    <PredictionsModule
                      currentUser={currentUser}
                      opponent={opponent}
                      races={races}
                      drivers={drivers}
                      constructors={constructors}
                      userPredictions={userPredictions}
                      opponentPredictions={opponentPredictions}
                      onSubmitPrediction={handleSubmitPrediction}
                    />
                  )}
                </>
              )}

              {/* Groups Sub-Tab Content */}
              {predictionsSubTab === 'groups' && (
                <>
                  {!isLoggedIn ? (
                    <Card className="border-amber-200 dark:border-amber-900/30 bg-gradient-to-br from-amber-50 to-amber-50/50 dark:from-amber-950/20 dark:to-amber-950/10">
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          <div className="text-3xl">🔐</div>
                          <div>
                            <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2 text-lg">
                              Connexion requise
                            </h4>
                            <p className="text-amber-800 dark:text-amber-200 mb-4">
                              Connectez-vous pour créer ou rejoindre des groupes de pronostics.
                            </p>
                            <Button onClick={() => setShowLoginModal(true)} className="bg-primary">
                              Se connecter
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <GroupsSection />
                  )}
                </>
              )}
            </TabsContent>

            {/* News Tab */}
            <TabsContent value="news" className="space-y-8 fade-in">
              <div>
                <h2 className="text-3xl font-bold mb-2">F1 News</h2>
                <p className="text-muted-foreground text-lg">Latest Formula 1 news and updates</p>
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

                  return selectedDriver && selectedConstructor ? (
                    <DriverDetailView
                      driver={selectedDriver}
                      constructor={selectedConstructor}
                      races={races}
                      onBack={() => setSelectedDriverId(null)}
                    />
                  ) : null;
                })()
              ) : selectedConstructorId ? (
                (() => {
                  const selectedConstructor = constructors.find(c => c.id === selectedConstructorId);

                  return selectedConstructor ? (
                    <ConstructorDetailView
                      constructor={selectedConstructor}
                      drivers={drivers}
                      onBack={() => setSelectedConstructorId(null)}
                      constructorImage={selectedConstructor.logo || ''}
                    />
                  ) : null;
                })()
              ) : (
                <Explorer
                  drivers={drivers}
                  constructors={constructors}
                  onDriverClick={handleDriverSelect}
                  onConstructorClick={handleConstructorSelect}
                  defaultTab={explorerTab}
                  onTabChange={(tab) => setExplorerTab(tab as 'drivers' | 'constructors')}
                />
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Footer */}
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
              Real F1 2026 data - Powered by Supabase
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
              Admin Access
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
      />

      {/* Stats Panel */}
      <StatsPanel
        open={statsPanelOpen}
        onOpenChange={setStatsPanelOpen}
      />
    </div>
  );
}