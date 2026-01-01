import { useState } from 'react';
import { Driver, Constructor } from '@/types';
import { ChevronDown, Trophy, Target, Zap, Flag } from 'lucide-react';

interface HeadToHeadProps {
  drivers: Driver[];
  constructors: Constructor[];
  onClose?: () => void;
}

export function HeadToHead({ drivers, constructors, onClose }: HeadToHeadProps) {
  const [driver1, setDriver1] = useState<Driver | null>(drivers[0] || null);
  const [driver2, setDriver2] = useState<Driver | null>(drivers[1] || null);
  const [showDropdown1, setShowDropdown1] = useState(false);
  const [showDropdown2, setShowDropdown2] = useState(false);

  const getConstructor = (constructorId: string): Constructor | undefined => {
    return constructors.find(c => c.id === constructorId);
  };

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

  const calculateAveragePoints = (driver: Driver): number => {
    if (driver.stats.gp === 0) return 0;
    return Math.round((driver.stats.points / driver.stats.gp) * 10) / 10;
  };

  const calculateWinRate = (driver: Driver): number => {
    if (driver.stats.gp === 0) return 0;
    return Math.round((driver.stats.wins / driver.stats.gp) * 1000) / 10;
  };

  const calculatePodiumRate = (driver: Driver): number => {
    if (driver.stats.gp === 0) return 0;
    return Math.round((driver.stats.podiums / driver.stats.gp) * 1000) / 10;
  };

  const ComparisonStat = ({ 
    label, 
    value1, 
    value2, 
    icon 
  }: { 
    label: string; 
    value1: number; 
    value2: number; 
    icon: React.ReactNode;
  }) => {
    const max = Math.max(value1, value2);
    const width1 = max > 0 ? (value1 / max) * 100 : 0;
    const width2 = max > 0 ? (value2 / max) * 100 : 0;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span className="flex items-center gap-2">
            {icon}
            {label}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1 flex items-center justify-end gap-2">
            <span className="text-white min-w-[50px] text-right">{value1}</span>
            <div className="flex-1 h-2 bg-carbon-light rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-racing-red to-red-400 rounded-full transition-all duration-500"
                style={{ width: `${width1}%`, marginLeft: 'auto' }}
              />
            </div>
          </div>
          <div className="flex-1 flex items-center gap-2">
            <div className="flex-1 h-2 bg-carbon-light rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-bright to-cyan-400 rounded-full transition-all duration-500"
                style={{ width: `${width2}%` }}
              />
            </div>
            <span className="text-white min-w-[50px] text-left">{value2}</span>
          </div>
        </div>
      </div>
    );
  };

  const DriverSelector = ({
    driver,
    setDriver,
    showDropdown,
    setShowDropdown,
    color
  }: {
    driver: Driver | null;
    setDriver: (d: Driver) => void;
    showDropdown: boolean;
    setShowDropdown: (s: boolean) => void;
    color: string;
  }) => {
    const constructor = driver ? getConstructor(driver.constructorId) : null;

    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className={`w-full p-4 bg-carbon-light border-2 ${color} rounded-lg hover:bg-carbon-medium transition-all duration-300 group`}
        >
          {driver ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getFlag(driver.nationality)}</span>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-white">{driver.firstName} {driver.lastName}</span>
                    <span className="text-sm text-gray-400">#{driver.number}</span>
                  </div>
                  <div className="text-sm text-gray-400">{constructor?.name}</div>
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </div>
          ) : (
            <div className="text-gray-400">Sélectionner un pilote</div>
          )}
        </button>

        {showDropdown && (
          <div className="absolute z-50 mt-2 w-full bg-carbon-medium border border-gray-700 rounded-lg shadow-2xl max-h-96 overflow-y-auto">
            {drivers.map((d) => {
              const driverConstructor = getConstructor(d.constructorId);
              return (
                <button
                  key={d.id}
                  onClick={() => {
                    setDriver(d);
                    setShowDropdown(false);
                  }}
                  className="w-full p-3 hover:bg-carbon-light transition-colors text-left flex items-center gap-3"
                >
                  <span className="text-xl">{getFlag(d.nationality)}</span>
                  <div>
                    <div className="text-white">{d.firstName} {d.lastName}</div>
                    <div className="text-sm text-gray-400">{driverConstructor?.name}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (!driver1 || !driver2) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="w-full max-w-6xl bg-carbon border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-racing-red to-red-600 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl text-white">Head-to-Head</h2>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Driver Selection */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <DriverSelector
              driver={driver1}
              setDriver={setDriver1}
              showDropdown={showDropdown1}
              setShowDropdown={setShowDropdown1}
              color="border-racing-red"
            />
            <DriverSelector
              driver={driver2}
              setDriver={setDriver2}
              showDropdown={showDropdown2}
              setShowDropdown={setShowDropdown2}
              color="border-cyan-bright"
            />
          </div>

          {/* Comparison Stats */}
          <div className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-carbon-light p-4 rounded-lg border-l-4 border-racing-red">
                <div className="text-sm text-gray-400">Âge</div>
                <div className="text-2xl text-white">{calculateAge(driver1.dateOfBirth)} ans</div>
              </div>
              <div className="bg-carbon-light p-4 rounded-lg">
                <div className="text-sm text-gray-400">VS</div>
                <div className="text-2xl text-white">•</div>
              </div>
              <div className="bg-carbon-light p-4 rounded-lg border-r-4 border-cyan-bright">
                <div className="text-sm text-gray-400">Âge</div>
                <div className="text-2xl text-white">{calculateAge(driver2.dateOfBirth)} ans</div>
              </div>
            </div>

            {/* Career Stats */}
            <div className="bg-carbon-light rounded-xl p-6 space-y-6">
              <h3 className="text-lg text-white mb-4">Statistiques Carrière</h3>
              
              <ComparisonStat
                label="Grands Prix disputés"
                value1={driver1.stats.gp}
                value2={driver2.stats.gp}
                icon={<Flag className="w-4 h-4" />}
              />

              <ComparisonStat
                label="Victoires"
                value1={driver1.stats.wins}
                value2={driver2.stats.wins}
                icon={<Trophy className="w-4 h-4" />}
              />

              <ComparisonStat
                label="Podiums"
                value1={driver1.stats.podiums}
                value2={driver2.stats.podiums}
                icon={<Trophy className="w-4 h-4" />}
              />

              <ComparisonStat
                label="Pole Positions"
                value1={driver1.stats.poles}
                value2={driver2.stats.poles}
                icon={<Target className="w-4 h-4" />}
              />

              <ComparisonStat
                label="Meilleurs tours"
                value1={driver1.stats.fastestLaps}
                value2={driver2.stats.fastestLaps}
                icon={<Zap className="w-4 h-4" />}
              />

              <ComparisonStat
                label="Points totaux"
                value1={driver1.stats.points}
                value2={driver2.stats.points}
                icon={<Trophy className="w-4 h-4" />}
              />

              <ComparisonStat
                label="Titres mondiaux"
                value1={driver1.stats.titles}
                value2={driver2.stats.titles}
                icon={<Trophy className="w-4 h-4" />}
              />
            </div>

            {/* Calculated Stats */}
            <div className="bg-carbon-light rounded-xl p-6 space-y-6">
              <h3 className="text-lg text-white mb-4">Statistiques Calculées</h3>

              <ComparisonStat
                label="Taux de victoire (%)"
                value1={calculateWinRate(driver1)}
                value2={calculateWinRate(driver2)}
                icon={<Trophy className="w-4 h-4" />}
              />

              <ComparisonStat
                label="Taux de podium (%)"
                value1={calculatePodiumRate(driver1)}
                value2={calculatePodiumRate(driver2)}
                icon={<Trophy className="w-4 h-4" />}
              />

              <ComparisonStat
                label="Points moyens par GP"
                value1={calculateAveragePoints(driver1)}
                value2={calculateAveragePoints(driver2)}
                icon={<Target className="w-4 h-4" />}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
