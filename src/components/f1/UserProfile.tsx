import { User, Trophy, Target, Award, Calendar, TrendingUp, Star, Zap, Crown, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User as UserType, UserPrediction, Achievement } from '@/types';
import { PageTransition, SlideUp, StaggerChildren, StaggerItem } from './Animations';
import { NotificationPreferences } from './NotificationPreferences';

interface UserProfileProps {
  user: UserType;
  predictions?: UserPrediction[];
  achievements?: Achievement[];
  onClose?: () => void;
}

export function UserProfile({ user, predictions = [], achievements = [], onClose }: UserProfileProps) {
  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  
  // Calculate stats from predictions with safe defaults
  const totalPredictions = predictions.length;
  const correctPredictions = predictions.filter(p => (p as any).pointsEarned > 0).length;
  const accuracy = totalPredictions > 0 ? Math.round((correctPredictions / totalPredictions) * 100) : 0;
  const totalPoints = predictions.reduce((sum, p) => sum + ((p as any).pointsEarned || 0), 0);
  
  // Get recent predictions
  const recentPredictions = predictions.slice(0, 5);
  
  // Get unlocked badges
  const unlockedBadges = achievements.filter(a => a.unlocked);
  const lockedBadges = achievements.filter(a => !a.unlocked);

  // Mock recent activity if no predictions
  const mockRecentActivity = [
    { raceName: 'GP de Bahreïn', sessionType: 'RACE', pointsEarned: 25 },
    { raceName: 'GP d\'Arabie Saoudite', sessionType: 'RACE', pointsEarned: 18 },
    { raceName: 'GP d\'Australie', sessionType: 'RACE', pointsEarned: 32 },
  ];

  const displayRecentActivity = recentPredictions.length > 0 
    ? recentPredictions.map(p => ({
        raceName: (p as any).raceName || 'Course',
        sessionType: p.sessionType,
        pointsEarned: (p as any).pointsEarned || 0
      }))
    : mockRecentActivity;

  return (
    <PageTransition className="space-y-8">
      {/* Profile Header */}
      <Card className="overflow-hidden border-border/50 bg-gradient-to-br from-card to-muted/20">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="h-32 w-32 border-4 border-primary/20 shadow-xl">
                <AvatarImage src={user.avatar} alt={`${user.firstName} ${user.lastName}`} />
                <AvatarFallback className="bg-primary/10 text-primary text-4xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <Badge
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary hover:bg-primary shadow-lg"
              >
                <Trophy className="w-3 h-3 mr-1" />
                Rank #{user.stats.rank}
              </Badge>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold mb-2">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-muted-foreground mb-4">{user.email}</p>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="text-center p-3 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50">
                  <div className="text-2xl font-bold text-primary">{user.stats.totalPoints}</div>
                  <div className="text-xs text-muted-foreground mt-1">Points</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50">
                  <div className="text-2xl font-bold text-chart-3">{user.stats.predictions}</div>
                  <div className="text-xs text-muted-foreground mt-1">Predictions</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50">
                  <div className="text-2xl font-bold text-chart-5">{accuracy}%</div>
                  <div className="text-xs text-muted-foreground mt-1">Accuracy</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50">
                  <div className="text-2xl font-bold text-chart-4">{user.stats.badges}</div>
                  <div className="text-xs text-muted-foreground mt-1">Badges</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="inline-flex w-auto bg-muted/50 p-1.5 rounded-2xl">
          <TabsTrigger value="overview" className="gap-2 rounded-xl">
            <TrendingUp className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="predictions" className="gap-2 rounded-xl">
            <Target className="w-4 h-4" />
            Predictions
          </TabsTrigger>
          <TabsTrigger value="achievements" className="gap-2 rounded-xl">
            <Award className="w-4 h-4" />
            Achievements
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2 rounded-xl">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Performance
                </CardTitle>
                <CardDescription>Your evolution this season</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Success rate</span>
                    <span className="font-medium">{accuracy}%</span>
                  </div>
                  <Progress value={accuracy} className="h-2" />
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Season goal</span>
                    <span className="font-medium">{totalPoints} / 1000 pts</span>
                  </div>
                  <Progress value={(totalPoints / 1000) * 100} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t">
                  <div>
                    <div className="text-2xl font-bold">{user.stats.streak}</div>
                    <div className="text-xs text-muted-foreground">Day streak</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{user.stats.bestRank}</div>
                    <div className="text-xs text-muted-foreground">Best rank</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Recent activity
                </CardTitle>
                <CardDescription>Your latest predictions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {displayRecentActivity.map((pred, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Target className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{pred.raceName}</p>
                          <p className="text-xs text-muted-foreground">{pred.sessionType}</p>
                        </div>
                      </div>
                      <Badge
                        variant={pred.pointsEarned > 0 ? 'default' : 'secondary'}
                        className={pred.pointsEarned > 0 ? 'bg-chart-3 hover:bg-chart-3' : ''}
                      >
                        {pred.pointsEarned > 0 ? `+${pred.pointsEarned}` : '0'} pts
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Predictions history</CardTitle>
              <CardDescription>All your predictions for the 2026 season</CardDescription>
            </CardHeader>
            <CardContent>
              {predictions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No predictions recorded yet</p>
                  <p className="text-sm mt-2">Make your first predictions in the Predictions tab</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {predictions.map((pred, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border/50 hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Target className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{(pred as any).raceName || 'Race'}</p>
                          <p className="text-sm text-muted-foreground">{pred.sessionType}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {new Date((pred as any).timestamp || pred.createdAt).toLocaleDateString('en-US')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {[pred.predictions.p1, pred.predictions.p2, pred.predictions.p3, pred.predictions.p4, pred.predictions.p5, pred.predictions.p6, pred.predictions.p7, pred.predictions.p8, pred.predictions.p9, pred.predictions.p10].filter(Boolean).length} predictions
                          </p>
                        </div>
                        <Badge
                          variant={(pred as any).pointsEarned > 0 ? 'default' : 'secondary'}
                          className={(pred as any).pointsEarned > 0 ? 'bg-chart-3 hover:bg-chart-3' : ''}
                        >
                          {(pred as any).pointsEarned > 0 ? `+${(pred as any).pointsEarned}` : '0'} pts
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-6">
          {achievements.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No badges available yet</p>
                  <p className="text-sm mt-2">Badges will be added soon</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Unlocked Badges */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-chart-5" />
                    Unlocked badges
                  </CardTitle>
                  <CardDescription>{unlockedBadges.length} / {achievements.length} unlocked</CardDescription>
                </CardHeader>
                <CardContent>
                  <StaggerChildren className="grid grid-cols-2 gap-4">
                    {unlockedBadges.map((achievement) => (
                      <StaggerItem key={achievement.id}>
                        <div className="p-4 rounded-xl border border-primary/50 bg-primary/5 hover:bg-primary/10 transition-colors">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="text-3xl">{achievement.icon}</div>
                            <div>
                              <p className="font-medium text-sm">{achievement.name}</p>
                              <Badge variant="secondary" className="text-xs mt-1">
                                {achievement.category}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">{achievement.description}</p>
                          {achievement.unlockedAt && (
                            <p className="text-xs text-muted-foreground mt-2 opacity-70">
                              Unlocked on {new Date(achievement.unlockedAt).toLocaleDateString('en-US')}
                            </p>
                          )}
                        </div>
                      </StaggerItem>
                    ))}
                  </StaggerChildren>
                </CardContent>
              </Card>

              {/* Locked Badges */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-muted-foreground" />
                    To unlock
                  </CardTitle>
                  <CardDescription>Keep predicting to unlock</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {lockedBadges.map((achievement) => (
                      <div
                        key={achievement.id}
                        className="p-4 rounded-xl border border-border/50 bg-muted/30 opacity-60 hover:opacity-80 transition-opacity"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="text-3xl grayscale">{achievement.icon}</div>
                          <div>
                            <p className="font-medium text-sm">{achievement.name}</p>
                            <Badge variant="outline" className="text-xs mt-1">
                              {achievement.category}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{achievement.description}</p>
                        {achievement.progress && (
                          <div className="mt-3">
                            <Progress value={(achievement.progress.current / achievement.progress.target) * 100} className="h-1" />
                            <p className="text-xs text-muted-foreground mt-1">
                              {achievement.progress.current} / {achievement.progress.target}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <NotificationPreferences />
        </TabsContent>
      </Tabs>
    </PageTransition>
  );
}