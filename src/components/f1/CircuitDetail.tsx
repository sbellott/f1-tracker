import { Circuit, Race } from '@/types';
import { mockCircuits, mockRaces } from '@/data/mockData';
import { MapPin, Calendar, Flag, Zap, TrendingUp, X } from 'lucide-react';

interface CircuitDetailProps {
  circuitId: string;
  onClose: () => void;
}

export function CircuitDetail({ circuitId, onClose }: CircuitDetailProps) {
  const circuit = mockCircuits.find(c => c.id === circuitId);
  const races = mockRaces.filter(r => r.circuitId === circuitId);
  const nextRace = races.find(r => new Date(r.date) > new Date());

  if (!circuit) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen p-4">
        <div className="max-w-5xl mx-auto bg-carbon border border-gray-800 rounded-2xl shadow-2xl overflow-hidden my-8">
          {/* Header avec image */}
          <div className="relative h-80 bg-gradient-to-br from-racing-red/20 to-cyan-bright/20">
            <div className="absolute inset-0 bg-gradient-to-t from-carbon via-carbon/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <MapPin className="w-6 h-6 text-racing-red" />
                    <span className="text-gray-400">{circuit.city}, {circuit.country}</span>
                  </div>
                  <h1 className="text-4xl text-white mb-2">{circuit.name}</h1>
                  <p className="text-gray-400">Premier GP : {circuit.firstGP}</p>
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

          {/* Prochaine course */}
          {nextRace && (
            <div className="p-6 bg-gradient-to-r from-racing-red/10 to-cyan-bright/10 border-b border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-racing-red" />
                <span className="text-sm text-gray-400">Prochaine course</span>
              </div>
              <div className="text-white">
                {nextRace.name} • {new Date(nextRace.date).toLocaleDateString('fr-FR', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </div>
            </div>
          )}

          {/* Stats principales */}
          <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-carbon-light p-4 rounded-xl border-l-4 border-racing-red">
              <div className="text-sm text-gray-400 mb-1">Longueur</div>
              <div className="text-2xl text-white">{circuit.length} km</div>
            </div>
            <div className="bg-carbon-light p-4 rounded-xl border-l-4 border-cyan-bright">
              <div className="text-sm text-gray-400 mb-1">Virages</div>
              <div className="text-2xl text-white">{circuit.turns}</div>
            </div>
            <div className="bg-carbon-light p-4 rounded-xl border-l-4 border-racing-red">
              <div className="text-sm text-gray-400 mb-1">Distance totale</div>
              <div className="text-2xl text-white">
                {circuit.length ? `${(circuit.length * Math.ceil(305 / circuit.length)).toFixed(1)} km` : '-'}
              </div>
            </div>
            {circuit.drsZones && (
              <div className="bg-carbon-light p-4 rounded-xl border-l-4 border-cyan-bright">
                <div className="text-sm text-gray-400 mb-1">Zones DRS</div>
                <div className="text-2xl text-white">{circuit.drsZones}</div>
              </div>
            )}
          </div>

          {/* Record du tour */}
          {circuit.lapRecord && (
            <div className="p-6 border-t border-gray-800">
              <div className="bg-gradient-to-br from-racing-red/20 to-transparent p-6 rounded-xl border border-racing-red/30">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-6 h-6 text-racing-red" />
                  <h2 className="text-xl text-white">Record du tour</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Temps</div>
                    <div className="text-3xl text-white">{circuit.lapRecord}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Pilote</div>
                    <div className="text-xl text-white">{circuit.lapRecordHolder || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Année</div>
                    <div className="text-xl text-white">{circuit.lapRecordYear || '-'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Historique / Faits marquants */}
          {circuit.history && (
            <div className="p-6 border-t border-gray-800">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-6 h-6 text-cyan-bright" />
                <h2 className="text-xl text-white">Historique</h2>
              </div>
              <p className="text-gray-400 leading-relaxed">
                {circuit.history}
              </p>
            </div>
          )}

          {/* Palmarès des 10 dernières années */}
          {circuit.winners && circuit.winners.length > 0 && (
            <div className="p-6 border-t border-gray-800">
              <div className="flex items-center gap-2 mb-4">
                <Flag className="w-6 h-6 text-racing-red" />
                <h2 className="text-xl text-white">Palmarès récent</h2>
              </div>
              <div className="space-y-2">
                {circuit.winners.map((winner) => (
                  <div 
                    key={winner.year}
                    className="flex items-center justify-between p-4 bg-carbon-light rounded-lg hover:bg-carbon-medium transition-colors"
                  >
                    <span className="text-gray-400">{winner.year}</span>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-right">
                        <div className="text-xs text-gray-500 mb-1">Vainqueur</div>
                        <div className="text-white">{winner.winner}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 mb-1">Pole</div>
                        <div className="text-cyan-bright">{winner.pole}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 mb-1">Meilleur tour</div>
                        <div className="text-gray-400">{winner.fastestLap}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Direction du circuit */}
          {circuit.direction && (
            <div className="p-6 border-t border-gray-800">
              <div className="flex items-center gap-4">
                <div className="text-gray-400">Sens de rotation :</div>
                <div className="flex items-center gap-2">
                  <div className={`w-12 h-12 rounded-full border-4 border-dashed ${
                    circuit.direction === 'clockwise' ? 'border-racing-red' : 'border-cyan-bright'
                  } flex items-center justify-center`}>
                    <svg 
                      className="w-6 h-6 text-white" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      style={{ 
                        transform: circuit.direction === 'clockwise' ? 'scaleX(-1)' : 'none' 
                      }}
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M12 8V4m0 4l3-3m-3 3L9 5m3 7v12m0 0l3-3m-3 3l-3-3" 
                      />
                    </svg>
                  </div>
                  <span className="text-white">
                    {circuit.direction === 'clockwise' ? 'Horaire' : 'Anti-horaire'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
