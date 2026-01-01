import { Constructor, Driver } from '@/types';
import { mockConstructors, mockDrivers } from '@/data/mockData';
import { Trophy, MapPin, Settings, Users, X } from 'lucide-react';

interface ConstructorDetailProps {
  constructorId: string;
  onClose: () => void;
}

export function ConstructorDetail({ constructorId, onClose }: ConstructorDetailProps) {
  const constructor = mockConstructors.find(c => c.id === constructorId);
  const drivers = mockDrivers.filter(d => d.constructorId === constructorId);

  if (!constructor) return null;

  const getFlag = (nationality: string): string => {
    const flags: Record<string, string> = {
      'AUT': '🇦🇹', 'ITA': '🇮🇹', 'GER': '🇩🇪', 'GBR': '🇬🇧',
      'NED': '🇳🇱', 'MEX': '🇲🇽', 'MON': '🇲🇨', 'ESP': '🇪🇸', 'AUS': '🇦🇺', 'CAN': '🇨🇦'
    };
    return flags[nationality] || '🏁';
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen p-4">
        <div className="max-w-5xl mx-auto bg-carbon border border-gray-800 rounded-2xl shadow-2xl overflow-hidden my-8">
          {/* Header avec couleur de l'écurie */}
          <div 
            className="relative h-80"
            style={{
              background: `linear-gradient(135deg, ${constructor.color}40 0%, ${constructor.color}10 100%)`,
              borderBottom: `6px solid ${constructor.color}`
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-carbon via-carbon/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div 
                      className="w-20 h-20 rounded-full border-4 flex items-center justify-center"
                      style={{ borderColor: constructor.color }}
                    >
                      <span className="text-4xl">{getFlag(constructor.nationality)}</span>
                    </div>
                  </div>
                  <h1 className="text-5xl text-white mb-2">
                    {constructor.name}
                  </h1>
                  <div className="flex items-center gap-4 text-gray-400">
                    <span className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {constructor.base}
                    </span>
                  </div>
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

          {/* Direction de l'équipe */}
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-6 h-6 text-racing-red" />
              <h2 className="text-2xl text-white">Direction</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-carbon-light p-6 rounded-xl border-l-4" style={{ borderColor: constructor.color }}>
                <div className="text-sm text-gray-400 mb-2">Team Principal</div>
                <div className="text-xl text-white">{constructor.teamPrincipal}</div>
              </div>
              <div className="bg-carbon-light p-6 rounded-xl border-l-4" style={{ borderColor: constructor.color }}>
                <div className="text-sm text-gray-400 mb-2">Directeur Technique</div>
                <div className="text-xl text-white">{constructor.technicalDirector}</div>
              </div>
            </div>
          </div>

          {/* Informations techniques */}
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-6 h-6 text-cyan-bright" />
              <h2 className="text-2xl text-white">Informations techniques</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-carbon-light p-6 rounded-xl">
                <div className="text-sm text-gray-400 mb-2">Motoriste</div>
                <div className="text-xl text-white">{constructor.engine}</div>
              </div>
              <div className="bg-carbon-light p-6 rounded-xl">
                <div className="text-sm text-gray-400 mb-2">Nationalité</div>
                <div className="text-xl text-white">
                  <span className="mr-2">{getFlag(constructor.nationality)}</span>
                  {constructor.nationality}
                </div>
              </div>
            </div>
          </div>

          {/* Palmarès */}
          <div className="p-6 border-b border-gray-800">
            <div className="bg-gradient-to-br from-racing-red/20 to-transparent p-6 rounded-xl border border-racing-red/30">
              <div className="flex items-center gap-3 mb-6">
                <Trophy className="w-8 h-8 text-racing-red" />
                <h2 className="text-2xl text-white">Palmarès</h2>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-carbon-light rounded-xl">
                  <div className="text-4xl text-racing-red mb-2">{constructor.stats.titles}</div>
                  <div className="text-sm text-gray-400">Titres constructeurs</div>
                </div>
                <div className="text-center p-4 bg-carbon-light rounded-xl">
                  <div className="text-4xl text-white mb-2">{constructor.stats.wins}</div>
                  <div className="text-sm text-gray-400">Victoires</div>
                </div>
                <div className="text-center p-4 bg-carbon-light rounded-xl">
                  <div className="text-4xl text-cyan-bright mb-2">{constructor.stats.poles}</div>
                  <div className="text-sm text-gray-400">Poles</div>
                </div>
                <div className="text-center p-4 bg-carbon-light rounded-xl">
                  <div className="text-4xl text-white mb-2">{constructor.stats.podiums}</div>
                  <div className="text-sm text-gray-400">Podiums</div>
                </div>
              </div>
            </div>
          </div>

          {/* Pilotes actuels */}
          {drivers.length > 0 && (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-6 h-6 text-racing-red" />
                <h2 className="text-2xl text-white">Pilotes {new Date().getFullYear()}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {drivers.map((driver) => {
                  const driverFlag = getFlag(driver.nationality);
                  return (
                    <div 
                      key={driver.id}
                      className="bg-carbon-light p-6 rounded-xl hover:bg-carbon-medium transition-all duration-300 cursor-pointer border-l-4"
                      style={{ borderColor: constructor.color }}
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="text-5xl opacity-20">{driver.number}</div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">{driverFlag}</span>
                            <span className="text-xs text-gray-500">#{driver.number}</span>
                          </div>
                          <h3 className="text-xl text-white">
                            {driver.firstName} <span className="text-racing-red">{driver.lastName}</span>
                          </h3>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <div className="text-2xl text-white">{driver.stats.wins}</div>
                          <div className="text-xs text-gray-400">Victoires</div>
                        </div>
                        <div>
                          <div className="text-2xl text-white">{driver.stats.podiums}</div>
                          <div className="text-xs text-gray-400">Podiums</div>
                        </div>
                        <div>
                          <div className="text-2xl text-white">{driver.stats.poles}</div>
                          <div className="text-xs text-gray-400">Poles</div>
                        </div>
                      </div>

                      {driver.stats.titles > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-center gap-2">
                          <Trophy className="w-4 h-4 text-racing-red" />
                          <span className="text-sm text-gray-400">
                            {driver.stats.titles}x Champion du monde
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
