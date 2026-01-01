import { Driver, Constructor } from '@/types';
import { mockDrivers, mockConstructors } from '@/data/mockData';
import { Trophy, Target, Zap, Flag, Calendar, MapPin, X } from 'lucide-react';

interface DriverDetailProps {
  driverId: string;
  onClose: () => void;
}

export function DriverDetail({ driverId, onClose }: DriverDetailProps) {
  const driver = mockDrivers.find(d => d.id === driverId);
  const constructor = driver ? mockConstructors.find(c => c.id === driver.constructorId) : null;

  if (!driver) return null;

  const getFlag = (nationality: string): string => {
    const flags: Record<string, string> = {
      'NED': '🇳🇱', 'MEX': '🇲🇽', 'MON': '🇲🇨', 'ESP': '🇪🇸',
      'GBR': '🇬🇧', 'AUS': '🇦🇺', 'CAN': '🇨🇦'
    };
    return flags[nationality] || '🏁';
  };

  const calculateAge = (dob: Date): number => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const calculateWinRate = (): number => {
    if (driver.stats.gp === 0) return 0;
    return Math.round((driver.stats.wins / driver.stats.gp) * 1000) / 10;
  };

  const calculatePodiumRate = (): number => {
    if (driver.stats.gp === 0) return 0;
    return Math.round((driver.stats.podiums / driver.stats.gp) * 1000) / 10;
  };

  const calculatePointsPerRace = (): number => {
    if (driver.stats.gp === 0) return 0;
    return Math.round((driver.stats.points / driver.stats.gp) * 10) / 10;
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen p-4">
        <div className="max-w-5xl mx-auto bg-carbon border border-gray-800 rounded-2xl shadow-2xl overflow-hidden my-8">
          {/* Header */}
          <div 
            className="relative h-80 bg-gradient-to-br from-carbon via-carbon-light to-carbon"
            style={{
              borderBottom: `4px solid ${constructor?.color || '#E10600'}`
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-carbon via-carbon/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-6xl">{getFlag(driver.nationality)}</span>
                    <div className="text-8xl text-white/20">{driver.number}</div>
                  </div>
                  <h1 className="text-5xl text-white mb-2">
                    {driver.firstName} <span className="text-racing-red">{driver.lastName}</span>
                  </h1>
                  {constructor && (
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: constructor.color }}
                      />
                      <span className="text-xl text-gray-400">{constructor.name}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Infos basiques */}
          <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-carbon-light p-4 rounded-xl">
              <div className="text-sm text-gray-400 mb-1">Âge</div>
              <div className="text-2xl text-white">{calculateAge(driver.dateOfBirth)} ans</div>
            </div>
            <div className="bg-carbon-light p-4 rounded-xl">
              <div className="text-sm text-gray-400 mb-1">Numéro</div>
              <div className="text-2xl text-white">#{driver.number}</div>
            </div>
            <div className="bg-carbon-light p-4 rounded-xl">
              <div className="text-sm text-gray-400 mb-1">Nationalité</div>
              <div className="text-2xl text-white">{getFlag(driver.nationality)}</div>
            </div>
            <div className="bg-carbon-light p-4 rounded-xl">
              <div className="text-sm text-gray-400 mb-1">Date de naissance</div>
              <div className="text-sm text-white">
                {new Date(driver.dateOfBirth).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
            </div>
          </div>

          {/* Titres mondiaux */}
          {driver.stats.titles > 0 && (
            <div className="p-6 border-t border-gray-800">
              <div className="bg-gradient-to-br from-racing-red/20 to-transparent p-6 rounded-xl border border-racing-red/30">
                <div className="flex items-center gap-3 mb-2">
                  <Trophy className="w-8 h-8 text-racing-red" />
                  <h2 className="text-2xl text-white">Champion du monde</h2>
                </div>
                <div className="text-4xl text-white">
                  {driver.stats.titles}x {driver.stats.titles > 1 ? 'Titres' : 'Titre'}
                </div>
              </div>
            </div>
          )}

          {/* Statistiques carrière */}
          <div className="p-6 border-t border-gray-800">
            <div className="flex items-center gap-2 mb-6">
              <Flag className="w-6 h-6 text-cyan-bright" />
              <h2 className="text-2xl text-white">Statistiques carrière</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-carbon-light p-6 rounded-xl border-l-4 border-racing-red hover:bg-carbon-medium transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <Flag className="w-5 h-5 text-gray-400" />
                  <div className="text-sm text-gray-400">Grands Prix</div>
                </div>
                <div className="text-3xl text-white">{driver.stats.gp}</div>
              </div>

              <div className="bg-carbon-light p-6 rounded-xl border-l-4 border-racing-red hover:bg-carbon-medium transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <Trophy className="w-5 h-5 text-gray-400" />
                  <div className="text-sm text-gray-400">Victoires</div>
                </div>
                <div className="text-3xl text-white">{driver.stats.wins}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {calculateWinRate()}% de réussite
                </div>
              </div>

              <div className="bg-carbon-light p-6 rounded-xl border-l-4 border-cyan-bright hover:bg-carbon-medium transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <Trophy className="w-5 h-5 text-gray-400" />
                  <div className="text-sm text-gray-400">Podiums</div>
                </div>
                <div className="text-3xl text-white">{driver.stats.podiums}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {calculatePodiumRate()}% de réussite
                </div>
              </div>

              <div className="bg-carbon-light p-6 rounded-xl border-l-4 border-cyan-bright hover:bg-carbon-medium transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <Target className="w-5 h-5 text-gray-400" />
                  <div className="text-sm text-gray-400">Poles</div>
                </div>
                <div className="text-3xl text-white">{driver.stats.poles}</div>
              </div>

              <div className="bg-carbon-light p-6 rounded-xl border-l-4 border-racing-red hover:bg-carbon-medium transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <Zap className="w-5 h-5 text-gray-400" />
                  <div className="text-sm text-gray-400">Meilleurs tours</div>
                </div>
                <div className="text-3xl text-white">{driver.stats.fastestLaps}</div>
              </div>

              <div className="bg-carbon-light p-6 rounded-xl border-l-4 border-cyan-bright hover:bg-carbon-medium transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <Trophy className="w-5 h-5 text-gray-400" />
                  <div className="text-sm text-gray-400">Points totaux</div>
                </div>
                <div className="text-3xl text-white">{driver.stats.points}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {calculatePointsPerRace()} pts/course
                </div>
              </div>
            </div>
          </div>

          {/* Équipe actuelle */}
          {constructor && (
            <div className="p-6 border-t border-gray-800">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-6 h-6 text-racing-red" />
                <h2 className="text-2xl text-white">Équipe actuelle</h2>
              </div>
              <div 
                className="bg-carbon-light p-6 rounded-xl border-l-4 hover:bg-carbon-medium transition-colors"
                style={{ borderColor: constructor.color }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl text-white">{constructor.name}</h3>
                  <div 
                    className="w-12 h-12 rounded-full"
                    style={{ backgroundColor: constructor.color }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400 mb-1">Base</div>
                    <div className="text-white">{constructor.base}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 mb-1">Moteur</div>
                    <div className="text-white">{constructor.engine}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 mb-1">Team Principal</div>
                    <div className="text-white">{constructor.teamPrincipal}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 mb-1">Directeur technique</div>
                    <div className="text-white">{constructor.technicalDirector}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
