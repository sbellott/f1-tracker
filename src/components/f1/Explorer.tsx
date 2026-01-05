import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Building2, Zap } from 'lucide-react';
import { Driver, Constructor, Circuit, Race } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { HeadToHead } from './HeadToHead';

interface ExplorerProps {
  drivers: Driver[];
  constructors: Constructor[];
  onDriverClick: (driverId: string) => void;
  onConstructorClick: (constructorId: string) => void;
}

export function Explorer({ 
  drivers, 
  constructors, 
  onDriverClick, 
  onConstructorClick 
}: ExplorerProps) {
  return (
    <div className="space-y-8 fade-in">
      <div>
        <h2 className="text-3xl font-bold mb-2">Explorer</h2>
        <p className="text-muted-foreground text-lg">
          Discover drivers, teams and Head-to-Head comparisons
        </p>
      </div>

      <Tabs defaultValue="drivers" className="space-y-6">
        <TabsList className="inline-flex w-auto bg-muted/50 p-1.5 rounded-2xl">
          <TabsTrigger value="drivers" className="gap-2 rounded-xl">
            <Users className="w-4 h-4" />
            Drivers
          </TabsTrigger>
          <TabsTrigger value="constructors" className="gap-2 rounded-xl">
            <Building2 className="w-4 h-4" />
            Teams
          </TabsTrigger>
          <TabsTrigger value="h2h" className="gap-2 rounded-xl">
            <Zap className="w-4 h-4" />
            Head-to-Head
          </TabsTrigger>
        </TabsList>

        {/* Drivers Sub-Tab */}
        <TabsContent value="drivers" className="space-y-6">
          <div>
            <h3 className="font-bold text-xl mb-2">2026 Drivers</h3>
            <p className="text-muted-foreground">{drivers.length} drivers on the grid</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {drivers.map((driver, index) => {
              const constructor = constructors.find(c => c.id === driver.constructorId);
              const driverImages = [
                "https://images.unsplash.com/photo-1696581081893-6b2510101bef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
                "https://images.unsplash.com/photo-1604312142152-ebfe999a75ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
                "https://images.unsplash.com/photo-1650574583439-faa89ad8e6c1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
              ];
              const driverImage = driverImages[index % driverImages.length];
              
              return (
                <Card 
                  key={driver.id} 
                  className="overflow-hidden hover:shadow-xl transition-all group border-border/50 cursor-pointer"
                  onClick={() => onDriverClick(driver.id)}
                >
                  <div className="relative h-56 overflow-hidden">
                    <ImageWithFallback
                      src={driverImage}
                      alt={`${driver.firstName} ${driver.lastName}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <Badge 
                      className="absolute top-4 right-4 text-xl font-bold h-12 w-12 rounded-2xl backdrop-blur-xl bg-white/90 dark:bg-black/70 text-black dark:text-white border-0 flex items-center justify-center shadow-lg"
                    >
                      {driver.number}
                    </Badge>
                    <div 
                      className="absolute bottom-0 left-0 right-0 h-1.5"
                      style={{ backgroundColor: constructor?.color || '#gray' }}
                    />
                  </div>
                  <CardHeader className="space-y-2">
                    <CardTitle className="text-xl">
                      {driver.firstName} {driver.lastName}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-base text-muted-foreground">
                      <div 
                        className="w-3 h-3 rounded-full shadow-sm"
                        style={{ backgroundColor: constructor?.color || '#gray' }}
                      />
                      {constructor?.name}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold">{driver.stats.wins}</div>
                        <div className="text-xs text-muted-foreground mt-1">Wins</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold">{driver.stats.podiums}</div>
                        <div className="text-xs text-muted-foreground mt-1">Podiums</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold">{driver.stats.poles}</div>
                        <div className="text-xs text-muted-foreground mt-1">Poles</div>
                      </div>
                    </div>
                    {driver.stats.titles > 0 && (
                      <div className="pt-4 border-t">
                        <Badge className="w-full justify-center py-2 bg-gradient-to-r from-chart-5 to-chart-5/80 hover:from-chart-5 hover:to-chart-5 text-white border-0 shadow-lg shadow-chart-5/20">
                          {driver.stats.titles}× World Champion 🏆
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Constructors Sub-Tab */}
        <TabsContent value="constructors" className="space-y-6">
          <div>
            <h3 className="font-bold text-xl mb-2">2026 Teams</h3>
            <p className="text-muted-foreground">{constructors.length} teams on the grid</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {constructors.map((constructor, index) => {
              const constructorImages = [
                "https://images.unsplash.com/photo-1540747913346-19e32778e8e5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
                "https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
                "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
              ];
              const constructorImage = constructorImages[index % constructorImages.length];
              
              return (
                <Card 
                  key={constructor.id} 
                  className="overflow-hidden hover:shadow-xl transition-all group border-border/50 cursor-pointer"
                  onClick={() => onConstructorClick(constructor.id)}
                >
                  <div className="relative h-56 overflow-hidden">
                    <ImageWithFallback
                      src={constructorImage}
                      alt={constructor.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div 
                      className="absolute bottom-0 left-0 right-0 h-1.5"
                      style={{ backgroundColor: constructor.color || '#gray' }}
                    />
                  </div>
                  <CardHeader className="space-y-2">
                    <CardTitle className="text-xl">
                      {constructor.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-base text-muted-foreground">
                      <div 
                        className="w-3 h-3 rounded-full shadow-sm"
                        style={{ backgroundColor: constructor.color || '#gray' }}
                      />
                      {constructor.base}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold">{constructor.stats.wins}</div>
                        <div className="text-xs text-muted-foreground mt-1">Wins</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold">{constructor.stats.podiums}</div>
                        <div className="text-xs text-muted-foreground mt-1">Podiums</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold">{constructor.stats.poles}</div>
                        <div className="text-xs text-muted-foreground mt-1">Poles</div>
                      </div>
                    </div>
                    {constructor.stats.titles > 0 && (
                      <div className="pt-4 border-t">
                        <Badge className="w-full justify-center py-2 bg-gradient-to-r from-chart-5 to-chart-5/80 hover:from-chart-5 hover:to-chart-5 text-white border-0 shadow-lg shadow-chart-5/20">
                          {constructor.stats.titles}× World Champion 🏆
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* H2H Sub-Tab */}
        <TabsContent value="h2h">
          <HeadToHead 
            drivers={drivers}
            constructors={constructors}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}