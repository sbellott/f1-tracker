import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Driver, Constructor, Circuit, Race, Prediction, UserPrediction, Group, User } from '@/types';

interface Favorites {
  drivers: string[];
  constructors: string[];
  circuits: string[];
}

interface AppState {
  // Data
  drivers: Driver[];
  constructors: Constructor[];
  circuits: Circuit[];
  races: Race[];
  
  // User state
  currentUser: User | null;
  predictions: Record<string, Prediction>;
  userPredictions: UserPrediction[];
  groups: Group[];
  
  // UI state
  selectedDriverId: string | null;
  selectedConstructorId: string | null;
  selectedCircuitId: string | null;
  notificationPanelOpen: boolean;
  statsPanelOpen: boolean;
  searchOpen: boolean;
  
  // Preferences
  favorites: Favorites;
  
  // Actions
  setDrivers: (drivers: Driver[]) => void;
  setConstructors: (constructors: Constructor[]) => void;
  setCircuits: (circuits: Circuit[]) => void;
  setRaces: (races: Race[]) => void;
  
  setCurrentUser: (user: User | null) => void;
  setPrediction: (raceId: string, prediction: Prediction) => void;
  addUserPrediction: (prediction: UserPrediction) => void;
  setGroups: (groups: Group[]) => void;
  addGroup: (group: Group) => void;
  
  setSelectedDriverId: (id: string | null) => void;
  setSelectedConstructorId: (id: string | null) => void;
  setSelectedCircuitId: (id: string | null) => void;
  setNotificationPanelOpen: (open: boolean) => void;
  setStatsPanelOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  
  toggleFavoriteDriver: (driverId: string) => void;
  toggleFavoriteConstructor: (constructorId: string) => void;
  toggleFavoriteCircuit: (circuitId: string) => void;
  
  // Getters
  getNextRace: () => Race | undefined;
  getFavoriteDrivers: () => Driver[];
  getFavoriteConstructors: () => Constructor[];
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      drivers: [],
      constructors: [],
      circuits: [],
      races: [],
      
      currentUser: null,
      predictions: {},
      userPredictions: [],
      groups: [],
      
      selectedDriverId: null,
      selectedConstructorId: null,
      selectedCircuitId: null,
      notificationPanelOpen: false,
      statsPanelOpen: false,
      searchOpen: false,
      
      favorites: {
        drivers: [],
        constructors: [],
        circuits: [],
      },
      
      // Data actions
      setDrivers: (drivers) => set({ drivers }),
      setConstructors: (constructors) => set({ constructors }),
      setCircuits: (circuits) => set({ circuits }),
      setRaces: (races) => set({ races }),
      
      setCurrentUser: (user) => set({ currentUser: user }),
      setPrediction: (raceId, prediction) =>
        set((state) => ({
          predictions: { ...state.predictions, [raceId]: prediction },
        })),
      addUserPrediction: (prediction) =>
        set((state) => ({
          userPredictions: [...state.userPredictions, prediction],
        })),
      setGroups: (groups) => set({ groups }),
      addGroup: (group) =>
        set((state) => ({
          groups: [...state.groups, group],
        })),
      
      // UI actions
      setSelectedDriverId: (id) => set({ selectedDriverId: id }),
      setSelectedConstructorId: (id) => set({ selectedConstructorId: id }),
      setSelectedCircuitId: (id) => set({ selectedCircuitId: id }),
      setNotificationPanelOpen: (open) => set({ notificationPanelOpen: open }),
      setStatsPanelOpen: (open) => set({ statsPanelOpen: open }),
      setSearchOpen: (open) => set({ searchOpen: open }),
      
      // Favorites actions
      toggleFavoriteDriver: (driverId) =>
        set((state) => {
          const favorites = state.favorites.drivers.includes(driverId)
            ? state.favorites.drivers.filter((id) => id !== driverId)
            : [...state.favorites.drivers, driverId];
          return {
            favorites: { ...state.favorites, drivers: favorites },
          };
        }),
      toggleFavoriteConstructor: (constructorId) =>
        set((state) => {
          const favorites = state.favorites.constructors.includes(constructorId)
            ? state.favorites.constructors.filter((id) => id !== constructorId)
            : [...state.favorites.constructors, constructorId];
          return {
            favorites: { ...state.favorites, constructors: favorites },
          };
        }),
      toggleFavoriteCircuit: (circuitId) =>
        set((state) => {
          const favorites = state.favorites.circuits.includes(circuitId)
            ? state.favorites.circuits.filter((id) => id !== circuitId)
            : [...state.favorites.circuits, circuitId];
          return {
            favorites: { ...state.favorites, circuits: favorites },
          };
        }),
      
      // Getters
      getNextRace: () => {
        const { races } = get();
        return races.find((race) => !race.sessions.every((s) => s.completed));
      },
      getFavoriteDrivers: () => {
        const { drivers, favorites } = get();
        return drivers.filter((d) => favorites.drivers.includes(d.id));
      },
      getFavoriteConstructors: () => {
        const { constructors, favorites } = get();
        return constructors.filter((c) => favorites.constructors.includes(c.id));
      },
    }),
    {
      name: 'f1-tracker-storage',
      partialize: (state) => ({
        favorites: state.favorites,
        predictions: state.predictions,
      }),
    }
  )
);
