import { useEffect, useState } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Search, User, Building2, MapPin, Flag, Trophy, Target, Calendar, Zap, Star } from 'lucide-react';
import { Driver, Constructor, Circuit } from '@/types';
import { Badge } from '@/components/ui/badge';

interface GlobalSearchProps {
  drivers: Driver[];
  constructors: Constructor[];
  circuits: Circuit[];
  favorites: {
    drivers: string[];
    constructors: string[];
    circuits: string[];
  };
  onDriverSelect: (driverId: string) => void;
  onConstructorSelect: (constructorId: string) => void;
  onCircuitSelect: (circuitId: string) => void;
  onNavigate?: (tab: string) => void;
}

export function GlobalSearch({
  drivers,
  constructors,
  circuits,
  favorites,
  onDriverSelect,
  onConstructorSelect,
  onCircuitSelect,
  onNavigate,
}: GlobalSearchProps) {
  const [open, setOpen] = useState(false);

  // Keyboard shortcut: Cmd+K or Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleDriverSelect = (driverId: string) => {
    onDriverSelect(driverId);
    onNavigate?.('explorer');
    setOpen(false);
  };

  const handleConstructorSelect = (constructorId: string) => {
    onConstructorSelect(constructorId);
    onNavigate?.('explorer');
    setOpen(false);
  };

  const handleCircuitSelect = (circuitId: string) => {
    onCircuitSelect(circuitId);
    onNavigate?.('calendar');
    setOpen(false);
  };

  const handleNavigate = (tab: string) => {
    onNavigate?.(tab);
    setOpen(false);
  };

  const favoriteDrivers = drivers.filter((d) => favorites.drivers.includes(d.id));
  const favoriteConstructors = constructors.filter((c) => favorites.constructors.includes(c.id));

  return (
    <>
      {/* Search trigger button in header */}
      <button
        onClick={() => setOpen(true)}
        className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-muted/50 rounded-xl hover:bg-muted transition-colors border border-border/50"
      >
        <Search className="w-4 h-4" />
        <span>Rechercher...</span>
        <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search drivers, teams, circuits..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {/* Navigation */}
          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => handleNavigate('home')}>
              <Flag className="mr-2 h-4 w-4" />
              <span>Accueil</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigate('calendar')}>
              <Calendar className="mr-2 h-4 w-4" />
              <span>Calendrier</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigate('standings')}>
              <Trophy className="mr-2 h-4 w-4" />
              <span>Standings</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigate('predictions')}>
              <Target className="mr-2 h-4 w-4" />
              <span>Predictions</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigate('explorer')}>
              <Zap className="mr-2 h-4 w-4" />
              <span>Explorer</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          {/* Favorites */}
          {(favoriteDrivers.length > 0 || favoriteConstructors.length > 0) && (
            <>
              <CommandGroup heading="Favoris">
                {favoriteDrivers.map((driver) => {
                  const constructor = constructors.find((c) => c.id === driver.constructorId);
                  return (
                    <CommandItem
                      key={driver.id}
                      value={`${driver.firstName} ${driver.lastName}`}
                      onSelect={() => handleDriverSelect(driver.id)}
                    >
                      <Star className="mr-2 h-4 w-4 text-chart-5 fill-chart-5" />
                      <span>
                        {driver.firstName} {driver.lastName}
                      </span>
                      {constructor && (
                        <Badge
                          variant="secondary"
                          className="ml-auto text-xs"
                          style={{ borderLeft: `3px solid ${constructor.color}` }}
                        >
                          {constructor.name}
                        </Badge>
                      )}
                    </CommandItem>
                  );
                })}
                {favoriteConstructors.map((constructor) => (
                  <CommandItem
                    key={constructor.id}
                    value={constructor.name}
                    onSelect={() => handleConstructorSelect(constructor.id)}
                  >
                    <Star className="mr-2 h-4 w-4 text-chart-5 fill-chart-5" />
                    <span>{constructor.name}</span>
                    <div
                      className="ml-auto w-3 h-3 rounded-full"
                      style={{ backgroundColor: constructor.color }}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {/* Drivers */}
          <CommandGroup heading="Pilotes">
            {drivers.slice(0, 8).map((driver) => {
              const constructor = constructors.find((c) => c.id === driver.constructorId);
              return (
                <CommandItem
                  key={driver.id}
                  value={`${driver.firstName} ${driver.lastName} ${driver.number}`}
                  onSelect={() => handleDriverSelect(driver.id)}
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>
                    {driver.firstName} {driver.lastName}
                  </span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    #{driver.number}
                  </Badge>
                  {constructor && (
                    <Badge
                      variant="secondary"
                      className="ml-auto text-xs"
                      style={{ borderLeft: `3px solid ${constructor.color}` }}
                    >
                      {constructor.name}
                    </Badge>
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>

          <CommandSeparator />

          {/* Constructors */}
          <CommandGroup heading="Écuries">
            {constructors.map((constructor) => (
              <CommandItem
                key={constructor.id}
                value={constructor.name}
                onSelect={() => handleConstructorSelect(constructor.id)}
              >
                <Building2 className="mr-2 h-4 w-4" />
                <span>{constructor.name}</span>
                <div
                  className="ml-auto w-3 h-3 rounded-full"
                  style={{ backgroundColor: constructor.color }}
                />
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          {/* Circuits */}
          <CommandGroup heading="Circuits">
            {circuits.slice(0, 8).map((circuit) => (
              <CommandItem
                key={circuit.id}
                value={`${circuit.name} ${circuit.country}`}
                onSelect={() => handleCircuitSelect(circuit.id)}
              >
                <MapPin className="mr-2 h-4 w-4" />
                <span>{circuit.name}</span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {circuit.country}
                </Badge>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}