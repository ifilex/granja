import React, { useState, useEffect, useCallback } from 'react';
import { FarmState, MarketListing, ChatMessage, OtherFarm } from './types/game';
import {
  INITIAL_FARM_STATE,
  GAME_ITEMS,
  RECIPES,
  SAMPLE_NEWSPAPER_LISTINGS,
  SAMPLE_CLAN,
  LEADERBOARD_DATA,
  OTHER_FARMS_LIST,
} from './data/gameData';
import { loadFarmState, saveFarmState } from './utils/storage';
import { soundManager } from './utils/audio';
import { notificationManager } from './utils/notifications';

import { TopBar } from './components/TopBar';
import { FarmCanvas } from './components/FarmCanvas';
import { FarmCanvas3D } from './components/FarmCanvas3D';
import { BuildingModal } from './components/BuildingModal';
import { StorageModal } from './components/StorageModal';
import { OrderBoardModal } from './components/OrderBoardModal';
import { GlobalMarketModal } from './components/GlobalMarketModal';
import { ClansAndChatModal } from './components/ClansAndChatModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { VisitingFarmModal } from './components/VisitingFarmModal';
import { DailyRewardsModal } from './components/DailyRewardsModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { AchievementsAndShareModal } from './components/AchievementsAndShareModal';
import { NotificationBanner } from './components/NotificationBanner';
import { MainMenu } from './components/MainMenu';
import { RustyWorkshopModal } from './components/RustyWorkshopModal';
import confetti from 'canvas-confetti';

export default function App() {
  const [state, setState] = useState<FarmState>(() => loadFarmState());
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Main Menu state (starts open as initial game menu)
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(true);

  // 3D WebGL vs 2D Isometric Render Mode (defaults to 3D smooth mode)
  const [renderMode, setRenderMode] = useState<'3d' | '2d'>(() => {
    try {
      const saved = localStorage.getItem('valle_dorado_render_mode');
      return saved === '2d' || saved === '3d' ? saved : '3d';
    } catch {
      return '3d';
    }
  });

  const handleToggleRenderMode = useCallback(() => {
    setRenderMode((prev) => {
      const next = prev === '3d' ? '2d' : '3d';
      try {
        localStorage.setItem('valle_dorado_render_mode', next);
      } catch {
        // ignore localstorage errors
      }
      return next;
    });
  }, []);

  // Modals state
  const [activeBuildingId, setActiveBuildingId] = useState<string | null>(null);
  const [storageModalType, setStorageModalType] = useState<'silo' | 'barn' | null>(null);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [isClansOpen, setIsClansOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [visitingFarmId, setVisitingFarmId] = useState<string | null>(null);
  const [isDailyOpen, setIsDailyOpen] = useState(false);
  const [isCloudOpen, setIsCloudOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [isWorkshopOpen, setIsWorkshopOpen] = useState(false);

  // Dynamic Marketplace & Chat State
  const [newspaperListings, setNewspaperListings] = useState<MarketListing[]>(
    SAMPLE_NEWSPAPER_LISTINGS
  );
  const [clanChat, setClanChat] = useState<ChatMessage[]>([
    {
      id: 'c1',
      senderId: 'leader_alberto',
      senderName: 'Alberto Granja',
      senderAvatar: '👨‍🌾',
      isClan: true,
      timestamp: Date.now() - 3600000,
      text: '¡Bienvenidos al clan Cosechadores del Valle! Recuerden ayudarse con donaciones.',
    },
    {
      id: 'c2',
      senderId: 'sofia_verde',
      senderName: 'Sofía Verde',
      senderAvatar: '👩‍🌾',
      isClan: true,
      timestamp: Date.now() - 1800000,
      text: '¿Alguien tiene 2 de trigo para completar el barco?',
      request: {
        itemId: 'wheat',
        countRequested: 2,
        countFulfilled: 0,
        status: 'open',
      },
    },
  ]);
  const [globalChat, setGlobalChat] = useState<ChatMessage[]>([
    {
      id: 'g1',
      senderId: 'greg',
      senderName: 'Granjero Greg',
      senderAvatar: '🤠',
      isClan: false,
      timestamp: Date.now() - 7200000,
      text: '¡Hola a todos los granjeros del mundo! Acabo de poner trigo a 1 moneda en mi puesto.',
    },
  ]);
  const [otherFarms, setOtherFarms] = useState<OtherFarm[]>(OTHER_FARMS_LIST);

  // Monitor network connectivity
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync sound setting
  useEffect(() => {
    soundManager.enabled = state.soundEnabled;
  }, [state.soundEnabled]);

  // Save on state updates
  useEffect(() => {
    saveFarmState(state);
  }, [state]);

  // Recalculate Silo & Barn capacities
  const recalculateCapacities = useCallback(
    (inv: Record<string, number>): { siloUsed: number; barnUsed: number } => {
      let silo = 0;
      let barn = 0;
      Object.entries(inv).forEach(([itemId, count]) => {
        if (count <= 0) return;
        const meta = GAME_ITEMS[itemId];
        if (!meta) return;
        if (meta.category === 'crop') {
          silo += count;
        } else {
          barn += count;
        }
      });
      return { siloUsed: silo, barnUsed: barn };
    },
    []
  );

  // Level Up Check
  const checkLevelUp = (currentState: FarmState, addedXp: number): FarmState => {
    let newXp = currentState.xp + addedXp;
    let newLevel = currentState.level;
    let nextThreshold = currentState.xpToNextLevel;
    let newDiamonds = currentState.diamonds;
    let leveledUp = false;

    while (newXp >= nextThreshold) {
      newXp -= nextThreshold;
      newLevel += 1;
      nextThreshold = Math.round(nextThreshold * 1.5);
      newDiamonds += 5; // Level up reward!
      leveledUp = true;
    }

    if (leveledUp) {
      soundManager.playLevelUp();
      confetti({ particleCount: 80, spread: 90, origin: { y: 0.5 } });
      notificationManager.send({
        title: `🎉 ¡Subiste al Nivel ${newLevel}!`,
        message: '¡Desbloqueaste nuevos cultivos, recetas y ganaste +5 Diamantes!',
        type: 'reward',
        icon: '⭐',
      });
    }

    return {
      ...currentState,
      level: newLevel,
      xp: newXp,
      xpToNextLevel: nextThreshold,
      diamonds: newDiamonds,
    };
  };

  // Automated Game Loop & Push Notification Dispatcher (Checks ready crops, feeds, animals)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();

      // Check ready crops
      state.plots.forEach((plot) => {
        if (plot.cropId && plot.readyAt && now >= plot.readyAt) {
          const item = GAME_ITEMS[plot.cropId];
          notificationManager.send({
            title: '🌾 ¡Cosecha Lista!',
            message: `Tu cosecha de ${item?.name || 'cultivo'} está madura para recolectar.`,
            type: 'harvest',
            icon: item?.icon || '🌾',
            dedupeKey: `plot_${plot.id}_ready`,
          });
        }
      });

      // Check ready animals
      state.animalPens.forEach((pen) => {
        if (pen.fedCount > 0 && pen.readyAt && now >= pen.readyAt) {
          const product = GAME_ITEMS[pen.productItemId];
          notificationManager.send({
            title: '🥛 ¡Animales Listos!',
            message: `${pen.name} tiene ${product?.name} fresca lista para recoger.`,
            type: 'animal',
            icon: product?.icon || '🥛',
            dedupeKey: `pen_${pen.id}_ready`,
          });
        }
      });

      // Check crafting buildings
      setState((prev) => {
        let updated = false;
        const newBuildings = prev.buildings.map((bld) => {
          let bldUpdated = false;
          const newQueue = bld.queue.map((slot) => {
            if (!slot.finished && now >= slot.startedAt + slot.durationSeconds * 1000) {
              bldUpdated = true;
              return { ...slot, finished: true };
            }
            return slot;
          });
          if (bldUpdated) {
            updated = true;
            return { ...bld, queue: newQueue };
          }
          return bld;
        });

        if (updated) {
          notificationManager.send({
            title: '🍞 ¡Elaboración Lista!',
            message: 'Tus productos artesanales están listos para ser recogidos.',
            type: 'artisan',
            icon: '🍞',
            dedupeKey: 'building_ready',
          });
          return { ...prev, buildings: newBuildings };
        }
        return prev;
      });

      // Simulated Roadside Shop Buyers
      setState((prev) => {
        let slotSold = false;
        const newRoadside = prev.roadsideSlots.map((slot) => {
          if (slot.itemId && !slot.isSold && slot.hasAd && Math.random() < 0.15) {
            slotSold = true;
            return { ...slot, isSold: true };
          }
          return slot;
        });

        if (slotSold) {
          soundManager.playCoin();
          notificationManager.send({
            title: '🏪 ¡Venta en tu Puesto!',
            message: 'Un jugador compró artículos de tu puesto de venta. ¡Pasa a cobrar!',
            type: 'market',
            icon: '🪙',
            dedupeKey: 'slot_sold_' + now,
          });
          return { ...prev, roadsideSlots: newRoadside };
        }
        return prev;
      });
    }, 4000);

    return () => clearInterval(timer);
  }, [state.plots, state.animalPens]);

  // Rusty's Retirement Autonomous Idle Bots Engine (Tito & Automatons)
  useEffect(() => {
    const botInterval = setInterval(() => {
      setState((prev) => {
        const now = Date.now();
        let plotsChanged = false;
        let invChanged = false;
        let updatedPlots = [...prev.plots];
        let updatedBiofuel = prev.biofuel ?? 50;
        let updatedInventory = { ...prev.inventory };

        // If biofuel is completely depleted, bots pause
        if (updatedBiofuel <= 0) {
          const pausedBots = (prev.bots || []).map((b) => ({
            ...b,
            status: 'idle' as const,
            currentTask: '⚡ Sin Biocombustible',
            battery: 0,
          }));
          return { ...prev, biofuel: 0, bots: pausedBots };
        }

        // 1. Auto-Watering Loop (Tito & Water Bot)
        if (prev.autoWateringEnabled && updatedBiofuel > 0) {
          const dryPlotIndex = updatedPlots.findIndex(
            (p) => p.cropId && !p.isWatered && (!p.readyAt || now < p.readyAt)
          );
          if (dryPlotIndex !== -1) {
            const plot = updatedPlots[dryPlotIndex];
            const remaining = plot.readyAt ? Math.max(1000, plot.readyAt - now) : 10000;
            const newReadyAt = now + Math.max(1000, Math.ceil(remaining / 2));
            updatedPlots[dryPlotIndex] = {
              ...plot,
              isWatered: true,
              readyAt: newReadyAt,
            };
            updatedBiofuel = Math.max(0, updatedBiofuel - 1);
            plotsChanged = true;
          }
        }

        // 2. Auto-Harvesting Loop (Tito & Harvest Bot)
        if (prev.autoHarvestingEnabled && updatedBiofuel > 0) {
          const readyPlotIndex = updatedPlots.findIndex(
            (p) => p.cropId && p.readyAt && now >= p.readyAt
          );
          if (readyPlotIndex !== -1 && prev.siloUsed + 2 <= prev.siloCapacity) {
            const plot = updatedPlots[readyPlotIndex];
            const cropId = plot.cropId!;
            updatedInventory[cropId] = (updatedInventory[cropId] || 0) + 2;
            updatedPlots[readyPlotIndex] = {
              ...plot,
              cropId: null,
              plantedAt: null,
              readyAt: null,
              isWatered: false,
            };
            updatedBiofuel = Math.max(0, updatedBiofuel - 1);
            plotsChanged = true;
            invChanged = true;
          }
        }

        // Update bots animation tasks & status
        const updatedBots = (prev.bots || []).map((bot) => {
          if (!bot.unlocked) return bot;
          const batteryLevel = Math.max(5, Math.min(100, Math.round((updatedBiofuel / (prev.maxBiofuel || 100)) * 100)));

          if (bot.type === 'rusty') {
            const task = plotsChanged
              ? '⚡ Supervisando tareas'
              : prev.autoWateringEnabled || prev.autoHarvestingEnabled
              ? '🌱 Vigilando el valle'
              : 'Descansando';
            return {
              ...bot,
              status: plotsChanged ? ('working' as const) : ('idle' as const),
              currentTask: task,
              battery: batteryLevel,
            };
          }

          if (bot.type === 'water_bot') {
            return {
              ...bot,
              status: (plotsChanged && prev.autoWateringEnabled) ? ('working' as const) : ('idle' as const),
              currentTask: prev.autoWateringEnabled ? '💧 Regando cultivos' : 'Pausado',
              battery: batteryLevel,
            };
          }

          if (bot.type === 'harvest_bot') {
            return {
              ...bot,
              status: (plotsChanged && prev.autoHarvestingEnabled) ? ('working' as const) : ('idle' as const),
              currentTask: prev.autoHarvestingEnabled ? '🌾 Cosechando campos' : 'Pausado',
              battery: batteryLevel,
            };
          }

          return {
            ...bot,
            battery: batteryLevel,
          };
        });

        if (!plotsChanged && !invChanged) {
          return prev;
        }

        const { siloUsed, barnUsed } = invChanged
          ? recalculateCapacities(updatedInventory)
          : { siloUsed: prev.siloUsed, barnUsed: prev.barnUsed };

        return {
          ...prev,
          plots: updatedPlots,
          inventory: updatedInventory,
          biofuel: updatedBiofuel,
          bots: updatedBots,
          siloUsed,
          barnUsed,
        };
      });
    }, 2200);

    return () => clearInterval(botInterval);
  }, [recalculateCapacities]);

  // --- ACTIONS ---

  // 1. Harvest Plot
  const handleHarvestPlot = (plotId: number) => {
    const plot = state.plots.find((p) => p.id === plotId);
    if (!plot || !plot.cropId) return;
    const crop = GAME_ITEMS[plot.cropId];
    if (!crop) return;

    if (state.siloUsed + 2 > state.siloCapacity) {
      notificationManager.send({
        title: '⚠️ Silo Lleno',
        message: '¡No tienes espacio en el Silo! Vende cosechas o amplía su capacidad.',
        type: 'harvest',
        icon: '🌾',
      });
      return;
    }

    soundManager.playHarvest();

    setState((prev) => {
      const newInventory = {
        ...prev.inventory,
        [plot.cropId!]: (prev.inventory[plot.cropId!] || 0) + 2,
      };
      const { siloUsed, barnUsed } = recalculateCapacities(newInventory);

      const newPlots = prev.plots.map((p) =>
        p.id === plotId ? { ...p, cropId: null, plantedAt: null, readyAt: null } : p
      );

      const newStats = {
        ...prev.stats,
        cropsHarvested: prev.stats.cropsHarvested + 2,
      };

      // Progress achievements
      const newAchievements = prev.achievements.map((ach) =>
        ach.id === 'ach_farmer_1'
          ? { ...ach, currentValue: Math.min(ach.targetValue, ach.currentValue + 2) }
          : ach
      );

      const updated = {
        ...prev,
        inventory: newInventory,
        siloUsed,
        barnUsed,
        plots: newPlots,
        stats: newStats,
        achievements: newAchievements,
      };

      return checkLevelUp(updated, crop.xpReward || 2);
    });
  };

  // 2. Plant Seed in Plot
  const handlePlantPlot = (plotId: number, cropId: string) => {
    const crop = GAME_ITEMS[cropId];
    if (!crop) return;

    const available = state.inventory[cropId] || 0;
    if (available <= 0) {
      notificationManager.send({
        title: 'Semillas Insuficientes',
        message: `No tienes semillas de ${crop.name}. Consigue en el mercado o espera tu racha diaria.`,
        type: 'harvest',
        icon: crop.icon,
      });
      return;
    }

    soundManager.playPlant();

    setState((prev) => {
      const newInventory = {
        ...prev.inventory,
        [cropId]: (prev.inventory[cropId] || 1) - 1,
      };
      const { siloUsed, barnUsed } = recalculateCapacities(newInventory);

      const durationMs = (crop.growthTimeSeconds || 15) * 1000;
      const now = Date.now();

      const newPlots = prev.plots.map((p) =>
        p.id === plotId
          ? {
              ...p,
              cropId,
              plantedAt: now,
              readyAt: now + durationMs,
              isWatered: false,
            }
          : p
      );

      return {
        ...prev,
        inventory: newInventory,
        siloUsed,
        barnUsed,
        plots: newPlots,
      };
    });
  };

  // 2b. Water Specific Plot (Rusty's Retirement & Stardew Valley Mechanic)
  const handleWaterPlot = (plotId: number) => {
    setState((prev) => {
      const plot = prev.plots.find((p) => p.id === plotId);
      if (!plot || !plot.cropId || plot.isWatered) return prev;

      soundManager.playWater();
      const now = Date.now();
      const remaining = plot.readyAt ? Math.max(1000, plot.readyAt - now) : 10000;
      // Watering cuts remaining growth time in half!
      const acceleratedReadyAt = now + Math.max(1000, Math.ceil(remaining / 2));

      return {
        ...prev,
        plots: prev.plots.map((p) =>
          p.id === plotId ? { ...p, isWatered: true, readyAt: acceleratedReadyAt } : p
        ),
      };
    });
  };

  // 2c. Water All Plots at once
  const handleWaterAll = () => {
    let anyWatered = false;
    setState((prev) => {
      const now = Date.now();
      const newPlots = prev.plots.map((p) => {
        if (p.cropId && !p.isWatered) {
          anyWatered = true;
          const remaining = p.readyAt ? Math.max(1000, p.readyAt - now) : 10000;
          return { ...p, isWatered: true, readyAt: now + Math.max(1000, Math.ceil(remaining / 2)) };
        }
        return p;
      });

      if (anyWatered) {
        soundManager.playWater();
        notificationManager.send({
          title: '💧 ¡Campos Regados!',
          message: 'Tus cultivos crecerán el doble de rápido gracias al riego.',
          type: 'harvest',
          icon: '💧',
        });
      }
      return { ...prev, plots: newPlots };
    });
  };

  // 2d. Harvest All Ready Plots
  const handleHarvestAll = () => {
    setState((prev) => {
      const now = Date.now();
      const readyPlots = prev.plots.filter((p) => p.cropId && p.readyAt && now >= p.readyAt);
      if (readyPlots.length === 0) return prev;

      const neededSpace = readyPlots.length * 2;
      if (prev.siloUsed + neededSpace > prev.siloCapacity) {
        notificationManager.send({
          title: '⚠️ Silo Lleno',
          message: 'No tienes espacio suficiente para cosechar todos los cultivos.',
          type: 'harvest',
          icon: '🌾',
        });
        return prev;
      }

      soundManager.playHarvest();
      confetti({ particleCount: 30, spread: 60, origin: { y: 0.6 } });

      const newInventory = { ...prev.inventory };
      readyPlots.forEach((p) => {
        newInventory[p.cropId!] = (newInventory[p.cropId!] || 0) + 2;
      });

      const { siloUsed, barnUsed } = recalculateCapacities(newInventory);
      const newPlots = prev.plots.map((p) =>
        p.cropId && p.readyAt && now >= p.readyAt
          ? { ...p, cropId: null, plantedAt: null, readyAt: null, isWatered: false }
          : p
      );

      const updated = {
        ...prev,
        inventory: newInventory,
        plots: newPlots,
        siloUsed,
        barnUsed,
        stats: {
          ...prev.stats,
          cropsHarvested: prev.stats.cropsHarvested + readyPlots.length * 2,
        },
      };

      return checkLevelUp(updated, readyPlots.length * 3);
    });
  };

  // 2e. Convert Crops to Biofuel & Spare Parts (Rusty's Retirement Mechanic)
  const handleConvertBiofuel = (cropId: string, count: number) => {
    setState((prev) => {
      const have = prev.inventory[cropId] || 0;
      if (have < count) return prev;

      soundManager.playBiofuel();
      const newInventory = { ...prev.inventory, [cropId]: have - count };
      const { siloUsed, barnUsed } = recalculateCapacities(newInventory);
      const fuelPerCrop = cropId === 'sugar_cane' ? 8 : cropId === 'carrot' ? 6 : 5;
      const partsEarned = Math.ceil(count * 1.5);
      const newFuel = Math.min(prev.maxBiofuel || 100, (prev.biofuel || 0) + count * fuelPerCrop);

      notificationManager.send({
        title: '⚡ Biocombustible Producido',
        message: `+${count * fuelPerCrop}L de biocombustible y +${partsEarned} piezas para Tito y sus robots.`,
        type: 'reward',
        icon: '⚡',
      });

      return {
        ...prev,
        inventory: newInventory,
        siloUsed,
        barnUsed,
        biofuel: newFuel,
        spareParts: (prev.spareParts || 0) + partsEarned,
      };
    });
  };

  // 2f. Upgrade a Farm Bot
  const handleUpgradeBot = (botId: string) => {
    setState((prev) => {
      const bot = prev.bots.find((b) => b.id === botId);
      if (!bot) return prev;
      const costParts = bot.level * 15;
      const costCoins = bot.level * 40;

      if ((prev.spareParts || 0) < costParts || prev.coins < costCoins) {
        notificationManager.send({
          title: 'Recursos Insuficientes',
          message: `Necesitas ${costParts} piezas y ${costCoins} monedas para mejorar este robot.`,
          type: 'market',
          icon: '⚙️',
        });
        return prev;
      }

      soundManager.playLevelUp();
      return {
        ...prev,
        spareParts: prev.spareParts - costParts,
        coins: prev.coins - costCoins,
        bots: prev.bots.map((b) =>
          b.id === botId
            ? {
                ...b,
                level: b.level + 1,
                speed: Number((b.speed * 1.25).toFixed(2)),
              }
            : b
        ),
      };
    });
  };

  // 2g. Unlock a Farm Bot
  const handleUnlockBot = (botId: string) => {
    setState((prev) => {
      const bot = prev.bots.find((b) => b.id === botId);
      if (!bot || bot.unlocked) return prev;
      const costParts = 25;
      const costCoins = 100;

      if ((prev.spareParts || 0) < costParts || prev.coins < costCoins) {
        notificationManager.send({
          title: 'Recursos Insuficientes',
          message: `Se requieren ${costParts} piezas y ${costCoins} monedas para activar este robot.`,
          type: 'market',
          icon: '⚙️',
        });
        return prev;
      }

      soundManager.playLevelUp();
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      notificationManager.send({
        title: '🎉 ¡Robot Activado!',
        message: `¡${bot.name} está listo para automatizar tareas en tu granja!`,
        type: 'reward',
        icon: '🤖',
      });

      return {
        ...prev,
        spareParts: prev.spareParts - costParts,
        coins: prev.coins - costCoins,
        bots: prev.bots.map((b) => (b.id === botId ? { ...b, unlocked: true } : b)),
      };
    });
  };

  // 2h. Toggle Automations
  const handleToggleAutoWatering = () => {
    soundManager.playClick();
    setState((prev) => ({
      ...prev,
      autoWateringEnabled: !prev.autoWateringEnabled,
    }));
  };

  const handleToggleAutoHarvesting = () => {
    soundManager.playClick();
    setState((prev) => ({
      ...prev,
      autoHarvestingEnabled: !prev.autoHarvestingEnabled,
    }));
  };

  // 2i. Performance Mode for Old Mobile Phones ("Potato Mode" ultra-optimized)
  const handleTogglePerformanceMode = useCallback(() => {
    soundManager.playClick();
    setState((prev) => {
      const nextMode: 'potato' | 'standard' | '3d' =
        prev.performanceMode === 'potato'
          ? 'standard'
          : prev.performanceMode === 'standard'
          ? '3d'
          : 'potato';

      try {
        localStorage.setItem('valle_dorado_perf_mode', nextMode);
      } catch {
        // ignore storage error
      }

      if (nextMode === '3d') {
        setRenderMode('3d');
      } else {
        setRenderMode('2d');
      }

      notificationManager.send({
        title: nextMode === 'potato' ? '🥔 Modo Celulares Antiguos' : nextMode === 'standard' ? '🌱 Modo Estándar 2D' : '🎮 Modo 3D Suave',
        message:
          nextMode === 'potato'
            ? 'Rendimiento ultra-ligero a 60 FPS sin sombras pesadas para teléfonos antiguos.'
            : nextMode === 'standard'
            ? 'Gráficos isométricos 2D nítidos de alta definición.'
            : 'Entorno tridimensional con modelos 3D y vista orbital.',
        type: 'reward',
        icon: nextMode === 'potato' ? '🥔' : nextMode === 'standard' ? '🗺️' : '🎮',
      });

      return {
        ...prev,
        performanceMode: nextMode,
      };
    });
  }, []);

  // 2j. Buy / Develop New Crop Plot
  const handleBuyPlot = () => {
    const cost = 40 + state.plots.length * 20;
    if (state.coins < cost) {
      notificationManager.send({
        title: 'Monedas Insuficientes',
        message: `Necesitas ${cost} monedas para desarrollar una nueva parcela de cultivo.`,
        type: 'market',
        icon: '🪙',
      });
      return;
    }
    soundManager.playCoin();
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
    notificationManager.send({
      title: '🎉 ¡Nueva Parcela Desarrollada!',
      message: `¡Has expandido tu granja con una nueva parcela de cultivo #${state.plots.length + 1}!`,
      type: 'reward',
      icon: '🌱',
    });
    setState((prev) => ({
      ...prev,
      coins: prev.coins - cost,
      plots: [
        ...prev.plots,
        { id: prev.plots.length, cropId: null, plantedAt: null, readyAt: null, isWatered: true },
      ],
    }));
  };

  // 3. Feed Animal
  const handleFeedAnimal = (penId: string) => {
    const pen = state.animalPens.find((p) => p.id === penId);
    if (!pen) return;
    const feedAvailable = state.inventory[pen.feedItemId] || 0;

    if (feedAvailable < pen.count) {
      notificationManager.send({
        title: 'Pienso Insuficiente',
        message: `Necesitas ${pen.count} de ${GAME_ITEMS[pen.feedItemId]?.name} para alimentar el corral.`,
        type: 'animal',
        icon: '🥣',
      });
      return;
    }

    soundManager.playAnimal(pen.type);

    setState((prev) => {
      const newInventory = {
        ...prev.inventory,
        [pen.feedItemId]: (prev.inventory[pen.feedItemId] || 0) - pen.count,
      };
      const { siloUsed, barnUsed } = recalculateCapacities(newInventory);

      const durationMs = pen.productionTimeSeconds * 1000;
      const now = Date.now();

      const newPens = prev.animalPens.map((p) =>
        p.id === penId
          ? {
              ...p,
              fedCount: p.count,
              fedAt: now,
              readyAt: now + durationMs,
            }
          : p
      );

      return {
        ...prev,
        inventory: newInventory,
        siloUsed,
        barnUsed,
        animalPens: newPens,
      };
    });
  };

  // 4. Collect Animal Product
  const handleCollectAnimal = (penId: string) => {
    const pen = state.animalPens.find((p) => p.id === penId);
    if (!pen) return;
    const product = GAME_ITEMS[pen.productItemId];

    if (state.barnUsed + pen.productYield > state.barnCapacity) {
      notificationManager.send({
        title: '⚠️ Granero Lleno',
        message: '¡No tienes espacio en el Granero para almacenar estos productos!',
        type: 'animal',
        icon: '📦',
      });
      return;
    }

    soundManager.playHarvest();
    soundManager.playAnimal(pen.type);

    setState((prev) => {
      const newInventory = {
        ...prev.inventory,
        [pen.productItemId]: (prev.inventory[pen.productItemId] || 0) + pen.productYield,
      };
      const { siloUsed, barnUsed } = recalculateCapacities(newInventory);

      const newPens = prev.animalPens.map((p) =>
        p.id === penId
          ? {
              ...p,
              fedCount: 0,
              fedAt: null,
              readyAt: null,
            }
          : p
      );

      // Achievements
      const newAchievements = prev.achievements.map((ach) =>
        ach.id === 'ach_milkman_1'
          ? { ...ach, currentValue: Math.min(ach.targetValue, ach.currentValue + pen.productYield) }
          : ach
      );

      const updated = {
        ...prev,
        inventory: newInventory,
        siloUsed,
        barnUsed,
        animalPens: newPens,
        achievements: newAchievements,
      };

      return checkLevelUp(updated, (product?.xpReward || 4) * pen.productYield);
    });
  };

  // 5. Queue Recipe in Building
  const handleQueueRecipe = (buildingId: string, recipeId: string) => {
    const building = state.buildings.find((b) => b.id === buildingId);
    const recipe = RECIPES.find((r) => r.id === recipeId);
    if (!building || !recipe) return;

    if (building.queue.length >= building.slotsCount) return;

    // Check ingredients
    const hasAll = recipe.ingredients.every(
      (ing) => (state.inventory[ing.itemId] || 0) >= ing.count
    );
    if (!hasAll) return;

    soundManager.playPlant();

    setState((prev) => {
      const newInventory = { ...prev.inventory };
      recipe.ingredients.forEach((ing) => {
        newInventory[ing.itemId] = (newInventory[ing.itemId] || 0) - ing.count;
      });
      const { siloUsed, barnUsed } = recalculateCapacities(newInventory);

      const newSlot = {
        itemId: recipe.outputItemId,
        startedAt: Date.now(),
        durationSeconds: recipe.durationSeconds,
        finished: false,
      };

      const newBuildings = prev.buildings.map((b) =>
        b.id === buildingId ? { ...b, queue: [...b.queue, newSlot] } : b
      );

      return {
        ...prev,
        inventory: newInventory,
        siloUsed,
        barnUsed,
        buildings: newBuildings,
      };
    });
  };

  // 6. Collect finished item from building
  const handleCollectBuildingItem = (buildingId: string, slotIndex: number) => {
    const building = state.buildings.find((b) => b.id === buildingId);
    if (!building) return;
    const slot = building.queue[slotIndex];
    if (!slot || !slot.finished) return;

    if (state.barnUsed + 1 > state.barnCapacity) {
      notificationManager.send({
        title: '⚠️ Granero Lleno',
        message: 'No puedes recoger el producto porque el granero está al límite.',
        type: 'artisan',
        icon: '📦',
      });
      return;
    }

    soundManager.playHarvest();

    setState((prev) => {
      const newInventory = {
        ...prev.inventory,
        [slot.itemId]: (prev.inventory[slot.itemId] || 0) + 1,
      };
      const { siloUsed, barnUsed } = recalculateCapacities(newInventory);

      const newQueue = building.queue.filter((_, idx) => idx !== slotIndex);
      const newBuildings = prev.buildings.map((b) =>
        b.id === buildingId ? { ...b, queue: newQueue } : b
      );

      const itemMeta = GAME_ITEMS[slot.itemId];
      const updated = {
        ...prev,
        inventory: newInventory,
        siloUsed,
        barnUsed,
        buildings: newBuildings,
      };

      return checkLevelUp(updated, itemMeta?.xpReward || 5);
    });
  };

  // 7. Unlock slot in building
  const handleUnlockSlot = (buildingId: string) => {
    if (state.diamonds < 6) {
      notificationManager.send({
        title: 'Diamantes Insuficientes',
        message: 'Necesitas 6 diamantes para desbloquear una ranura adicional.',
        type: 'reward',
        icon: '💎',
      });
      return;
    }

    soundManager.playDiamond();

    setState((prev) => {
      const newBuildings = prev.buildings.map((b) =>
        b.id === buildingId ? { ...b, slotsCount: b.slotsCount + 1 } : b
      );
      return {
        ...prev,
        diamonds: prev.diamonds - 6,
        buildings: newBuildings,
      };
    });
  };

  // 8. Speedups
  const handleSpeedUpPlot = (plotId: number) => {
    if (state.diamonds < 1) return;
    soundManager.playDiamond();
    setState((prev) => ({
      ...prev,
      diamonds: prev.diamonds - 1,
      plots: prev.plots.map((p) => (p.id === plotId ? { ...p, readyAt: Date.now() - 1000 } : p)),
    }));
  };

  const handleSpeedUpAnimal = (penId: string) => {
    if (state.diamonds < 1) return;
    soundManager.playDiamond();
    setState((prev) => ({
      ...prev,
      diamonds: prev.diamonds - 1,
      animalPens: prev.animalPens.map((p) =>
        p.id === penId ? { ...p, readyAt: Date.now() - 1000 } : p
      ),
    }));
  };

  const handleSpeedUpBuildingSlot = (buildingId: string, slotIndex: number) => {
    if (state.diamonds < 1) return;
    soundManager.playDiamond();
    setState((prev) => ({
      ...prev,
      diamonds: prev.diamonds - 1,
      buildings: prev.buildings.map((b) =>
        b.id === buildingId
          ? {
              ...b,
              queue: b.queue.map((q, idx) =>
                idx === slotIndex ? { ...q, finished: true } : q
              ),
            }
          : b
      ),
    }));
  };

  // 9. Sell Item directly
  const handleSellItem = (itemId: string, count: number) => {
    const item = GAME_ITEMS[itemId];
    if (!item) return;
    const inStock = state.inventory[itemId] || 0;
    const actualCount = Math.min(count, inStock);
    if (actualCount <= 0) return;

    soundManager.playCoin();
    const earnings = actualCount * item.basePrice;

    setState((prev) => {
      const newInventory = {
        ...prev.inventory,
        [itemId]: (prev.inventory[itemId] || 0) - actualCount,
      };
      const { siloUsed, barnUsed } = recalculateCapacities(newInventory);

      return {
        ...prev,
        coins: prev.coins + earnings,
        inventory: newInventory,
        siloUsed,
        barnUsed,
        stats: {
          ...prev.stats,
          totalCoinsEarned: prev.stats.totalCoinsEarned + earnings,
        },
      };
    });
  };

  // 10. Upgrade Storage Capacity
  const handleUpgradeStorage = (type: 'silo' | 'barn') => {
    soundManager.playLevelUp();
    setState((prev) => {
      if (type === 'silo') {
        const nailCost = Math.ceil(prev.siloCapacity / 25);
        const plankCost = Math.ceil(prev.siloCapacity / 25);
        const newInv = {
          ...prev.inventory,
          nail: Math.max(0, (prev.inventory.nail || 0) - nailCost),
          plank: Math.max(0, (prev.inventory.plank || 0) - plankCost),
        };
        return {
          ...prev,
          siloCapacity: prev.siloCapacity + 25,
          inventory: newInv,
        };
      } else {
        const boltCost = Math.ceil(prev.barnCapacity / 25);
        const tapeCost = Math.ceil(prev.barnCapacity / 25);
        const newInv = {
          ...prev.inventory,
          bolt: Math.max(0, (prev.inventory.bolt || 0) - boltCost),
          duct_tape: Math.max(0, (prev.inventory.duct_tape || 0) - tapeCost),
        };
        return {
          ...prev,
          barnCapacity: prev.barnCapacity + 25,
          inventory: newInv,
        };
      }
    });
  };

  // 11. Truck Order Delivery
  const handleFulfillOrder = (orderId: string) => {
    const order = state.truckOrders.find((o) => o.id === orderId);
    if (!order) return;

    soundManager.playTruck();
    soundManager.playCoin();

    setState((prev) => {
      const newInventory = { ...prev.inventory };
      order.requirements.forEach((req) => {
        newInventory[req.itemId] = Math.max(0, (newInventory[req.itemId] || 0) - req.count);
      });

      if (order.specialRewardToolId) {
        newInventory[order.specialRewardToolId] =
          (newInventory[order.specialRewardToolId] || 0) + 1;
      }

      const { siloUsed, barnUsed } = recalculateCapacities(newInventory);

      // Generate a fresh new order
      const clientAvatars = ['👩‍🌾', '👨‍🍳', '🧔', '👵', '👧', '👱‍♂️'];
      const clientNames = [
        'Mercado Central',
        'Pastelería San José',
        'Posada Campestre',
        'Doña Carmen',
        'Don Mateo',
      ];
      const randomName = clientNames[Math.floor(Math.random() * clientNames.length)];
      const randomAvatar = clientAvatars[Math.floor(Math.random() * clientAvatars.length)];

      const possibleItemKeys = ['wheat', 'corn', 'carrot', 'milk', 'egg', 'bread'];
      const pick1 = possibleItemKeys[Math.floor(Math.random() * possibleItemKeys.length)];
      const pick2 = possibleItemKeys[Math.floor(Math.random() * possibleItemKeys.length)];

      const newOrder = {
        id: 'ord_' + Math.random().toString(36).substring(2, 7),
        clientName: randomName,
        clientAvatar: randomAvatar,
        requirements: [
          { itemId: pick1, count: Math.floor(Math.random() * 4) + 2 },
          { itemId: pick2, count: Math.floor(Math.random() * 2) + 1 },
        ],
        rewardCoins: Math.floor(Math.random() * 60) + 40,
        rewardXp: Math.floor(Math.random() * 30) + 20,
        specialRewardToolId: Math.random() > 0.4 ? 'plank' : undefined,
      };

      const newOrders = prev.truckOrders.map((o) => (o.id === orderId ? newOrder : o));

      // Achievements
      const newAchievements = prev.achievements.map((ach) =>
        ach.id === 'ach_truck_1'
          ? { ...ach, currentValue: Math.min(ach.targetValue, ach.currentValue + 1) }
          : ach
      );

      const updated = {
        ...prev,
        coins: prev.coins + order.rewardCoins,
        inventory: newInventory,
        siloUsed,
        barnUsed,
        truckOrders: newOrders,
        stats: {
          ...prev.stats,
          ordersCompleted: prev.stats.ordersCompleted + 1,
          totalCoinsEarned: prev.stats.totalCoinsEarned + order.rewardCoins,
        },
        achievements: newAchievements,
      };

      return checkLevelUp(updated, order.rewardXp);
    });
  };

  const handleDiscardOrder = (orderId: string) => {
    soundManager.playClick();
    setState((prev) => ({
      ...prev,
      truckOrders: prev.truckOrders.filter((o) => o.id !== orderId),
    }));
  };

  // 12. Global Market: Buy Listing
  const handleBuyListing = (listing: MarketListing) => {
    if (state.coins < listing.price) return;
    const meta = GAME_ITEMS[listing.itemId];
    if (!meta) return;

    const isCrop = meta.category === 'crop';
    if (isCrop && state.siloUsed + listing.quantity > state.siloCapacity) {
      notificationManager.send({
        title: 'Silo Lleno',
        message: 'No puedes comprar esto porque el Silo no tiene suficiente espacio.',
        type: 'market',
        icon: '🌾',
      });
      return;
    }
    if (!isCrop && state.barnUsed + listing.quantity > state.barnCapacity) {
      notificationManager.send({
        title: 'Granero Lleno',
        message: 'No puedes comprar esto porque el Granero no tiene suficiente espacio.',
        type: 'market',
        icon: '📦',
      });
      return;
    }

    soundManager.playCoin();

    // Mark as sold in newspaper
    setNewspaperListings((prev) =>
      prev.map((l) => (l.id === listing.id ? { ...l, isSold: true } : l))
    );

    setState((prev) => {
      const newInv = {
        ...prev.inventory,
        [listing.itemId]: (prev.inventory[listing.itemId] || 0) + listing.quantity,
      };
      const { siloUsed, barnUsed } = recalculateCapacities(newInv);

      return {
        ...prev,
        coins: prev.coins - listing.price,
        inventory: newInv,
        siloUsed,
        barnUsed,
      };
    });
  };

  // 13. Global Market: Refresh Newspaper
  const handleRefreshNewspaper = () => {
    soundManager.playClick();
    const sellers = [
      { name: 'Don Roberto', avatar: '👨‍🌾', level: 31 },
      { name: 'Granja Los Pinos', avatar: '🌲', level: 25 },
      { name: 'Camila Verde', avatar: '👩‍🌾', level: 19 },
      { name: 'Granjero Greg', avatar: '🤠', level: 50 },
      { name: 'Hermanos Díaz', avatar: '🧔', level: 42 },
    ];
    const candidateItems = ['wheat', 'corn', 'carrot', 'milk', 'egg', 'bread', 'plank', 'nail', 'bolt'];

    const newListings: MarketListing[] = Array.from({ length: 8 }).map((_, i) => {
      const seller = sellers[Math.floor(Math.random() * sellers.length)];
      const itemKey = candidateItems[Math.floor(Math.random() * candidateItems.length)];
      const meta = GAME_ITEMS[itemKey];
      const qty = itemKey === 'plank' || itemKey === 'nail' || itemKey === 'bolt' ? 1 : Math.floor(Math.random() * 8) + 2;
      const price = Math.round(qty * meta.basePrice * (0.8 + Math.random() * 0.4));

      return {
        id: 'list_gen_' + Math.random().toString(36).substring(2, 8),
        sellerId: 'seller_' + i,
        sellerName: seller.name,
        sellerAvatar: seller.avatar,
        sellerLevel: seller.level,
        itemId: itemKey,
        quantity: qty,
        price,
        hasAd: true,
        createdAt: Date.now(),
        isSold: false,
      };
    });

    setNewspaperListings(newListings);
  };

  // 14. Roadside Stand: List Item
  const handleListItemForSale = (
    slotId: number,
    itemId: string,
    quantity: number,
    price: number,
    hasAd: boolean
  ) => {
    soundManager.playPlant();

    setState((prev) => {
      const newInv = {
        ...prev.inventory,
        [itemId]: Math.max(0, (prev.inventory[itemId] || 0) - quantity),
      };
      const { siloUsed, barnUsed } = recalculateCapacities(newInv);

      const newSlots = prev.roadsideSlots.map((s) =>
        s.id === slotId
          ? {
              ...s,
              itemId,
              quantity,
              price,
              hasAd,
              isSold: false,
              collected: false,
            }
          : s
      );

      return {
        ...prev,
        inventory: newInv,
        siloUsed,
        barnUsed,
        roadsideSlots: newSlots,
      };
    });
  };

  // 15. Roadside Stand: Collect Coins
  const handleCollectSaleCoins = (slotId: number) => {
    const slot = state.roadsideSlots.find((s) => s.id === slotId);
    if (!slot || !slot.isSold) return;

    soundManager.playCoin();

    setState((prev) => {
      const newSlots = prev.roadsideSlots.map((s) =>
        s.id === slotId
          ? {
              ...s,
              itemId: null,
              quantity: 0,
              price: 0,
              hasAd: false,
              isSold: false,
              collected: true,
            }
          : s
      );

      // Achievements
      const newAchievements = prev.achievements.map((ach) =>
        ach.id === 'ach_market_1'
          ? { ...ach, currentValue: Math.min(ach.targetValue, ach.currentValue + 1) }
          : ach
      );

      return {
        ...prev,
        coins: prev.coins + slot.price,
        roadsideSlots: newSlots,
        stats: {
          ...prev.stats,
          marketSales: prev.stats.marketSales + 1,
          totalCoinsEarned: prev.stats.totalCoinsEarned + slot.price,
        },
        achievements: newAchievements,
      };
    });
  };

  // 16. Visiting Other Farm: Revive Tree
  const handleReviveTree = (farmId: string, treeId: number) => {
    soundManager.playHarvest();

    setOtherFarms((prev) =>
      prev.map((f) =>
        f.id === farmId
          ? {
              ...f,
              wiltedTrees: f.wiltedTrees.map((t) =>
                t.id === treeId ? { ...t, isRevived: true } : t
              ),
            }
          : f
      )
    );

    setState((prev) => {
      const newStats = {
        ...prev.stats,
        treesRevived: prev.stats.treesRevived + 1,
      };
      const newAchievements = prev.achievements.map((ach) =>
        ach.id === 'ach_tree_1'
          ? { ...ach, currentValue: Math.min(ach.targetValue, ach.currentValue + 1) }
          : ach
      );
      const updated = {
        ...prev,
        stats: newStats,
        achievements: newAchievements,
      };
      return checkLevelUp(updated, 15);
    });
  };

  // 17. Visiting Other Farm: Buy Item
  const handleBuyVisitingItem = (
    farmId: string,
    itemId: string,
    price: number,
    qty: number
  ) => {
    if (state.coins < price) return;
    soundManager.playCoin();

    setOtherFarms((prev) =>
      prev.map((f) =>
        f.id === farmId
          ? {
              ...f,
              marketItems: f.marketItems.filter((i) => i.itemId !== itemId),
            }
          : f
      )
    );

    setState((prev) => {
      const newInv = {
        ...prev.inventory,
        [itemId]: (prev.inventory[itemId] || 0) + qty,
      };
      const { siloUsed, barnUsed } = recalculateCapacities(newInv);

      return {
        ...prev,
        coins: prev.coins - price,
        inventory: newInv,
        siloUsed,
        barnUsed,
      };
    });
  };

  // 18. Clan & Global Chat Messages
  const handleSendChatMessage = (
    text: string,
    isClan: boolean,
    requestItem?: string
  ) => {
    soundManager.playClick();

    const newMsg: ChatMessage = {
      id: 'msg_' + Math.random().toString(36).substring(2, 9),
      senderId: 'player_me',
      senderName: state.playerName,
      senderAvatar: state.playerAvatar,
      isClan,
      timestamp: Date.now(),
      text,
      request: requestItem
        ? {
            itemId: requestItem,
            countRequested: 3,
            countFulfilled: 0,
            status: 'open',
          }
        : undefined,
    };

    if (isClan) {
      setClanChat((prev) => [...prev, newMsg]);
    } else {
      setGlobalChat((prev) => [...prev, newMsg]);
    }
  };

  // 19. Fulfill Clan Supply Request
  const handleFulfillSupplyRequest = (messageId: string) => {
    const msg = clanChat.find((m) => m.id === messageId);
    if (!msg || !msg.request) return;
    const reqItem = msg.request.itemId;
    const needed = msg.request.countRequested - msg.request.countFulfilled;
    const inStock = state.inventory[reqItem] || 0;

    if (inStock < needed) {
      notificationManager.send({
        title: 'Suministros Insuficientes',
        message: `No tienes suficientes ${GAME_ITEMS[reqItem]?.name} para donar.`,
        type: 'clan',
        icon: '🤝',
      });
      return;
    }

    soundManager.playCoin();

    setClanChat((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? {
              ...m,
              request: m.request
                ? {
                    ...m.request,
                    countFulfilled: m.request.countRequested,
                    status: 'fulfilled',
                  }
                : undefined,
            }
          : m
      )
    );

    setState((prev) => {
      const newInv = {
        ...prev.inventory,
        [reqItem]: (prev.inventory[reqItem] || 0) - needed,
      };
      const { siloUsed, barnUsed } = recalculateCapacities(newInv);

      const updated = {
        ...prev,
        inventory: newInv,
        siloUsed,
        barnUsed,
      };
      return checkLevelUp(updated, 30);
    });
  };

  // 20. Daily Streak Claim
  const handleClaimDailyStreak = () => {
    soundManager.playLevelUp();
    setState((prev) => {
      const nextStreak = (prev.dailyRewardStreak % 7) + 1;
      let coinsGain = 100;
      let diamondsGain = 2;
      if (prev.dailyRewardStreak === 7) {
        coinsGain = 500;
        diamondsGain = 10;
      }
      return {
        ...prev,
        dailyRewardStreak: nextStreak,
        lastDailyRewardClaim: Date.now(),
        coins: prev.coins + coinsGain,
        diamonds: prev.diamonds + diamondsGain,
      };
    });
  };

  // 21. Fortune Wheel Spin
  const handleSpinWheel = (prizeIndex: number) => {
    setState((prev) => {
      const prizeAmounts: Record<number, { coins?: number; diamonds?: number; item?: string }> = {
        0: { coins: 50 },
        1: { diamonds: 3 },
        2: { item: 'wheat' },
        3: { item: 'plank' },
        4: { coins: 150 },
        5: { item: 'bolt' },
        6: { diamonds: 5 },
        7: { item: 'nail' },
      };
      const p = prizeAmounts[prizeIndex] || { coins: 50 };
      const newInv = { ...prev.inventory };
      if (p.item) {
        newInv[p.item] = (newInv[p.item] || 0) + (p.item === 'wheat' ? 5 : 1);
      }
      const { siloUsed, barnUsed } = recalculateCapacities(newInv);

      return {
        ...prev,
        lastSpinTimestamp: Date.now(),
        coins: prev.coins + (p.coins || 0),
        diamonds: prev.diamonds + (p.diamonds || 0),
        inventory: newInv,
        siloUsed,
        barnUsed,
      };
    });
  };

  // 22. Claim Achievement
  const handleClaimAchievement = (achId: string) => {
    const ach = state.achievements.find((a) => a.id === achId);
    if (!ach || ach.claimed) return;

    soundManager.playDiamond();

    setState((prev) => {
      const newAchs = prev.achievements.map((a) =>
        a.id === achId ? { ...a, claimed: true } : a
      );
      const updated = {
        ...prev,
        diamonds: prev.diamonds + ach.rewardDiamonds,
        achievements: newAchs,
      };
      return checkLevelUp(updated, ach.rewardXp);
    });
  };

  const handleNewGame = (newFarmName: string, climate: string) => {
    const freshState: FarmState = {
      ...INITIAL_FARM_STATE,
      farmName: newFarmName,
      lastSavedAt: Date.now(),
    };
    setState(freshState);
    saveFarmState(freshState);
    setIsMainMenuOpen(false);
    notificationManager.send({
      title: '🚜 ¡Nueva Granja Fundada!',
      message: `¡Bienvenido a ${newFarmName}! Región: ${climate}. ¡Que comiencen las cosechas!`,
      type: 'reward',
      icon: '🌾',
    });
  };

  const handleToggleRetroPalette = () => {
    setState((prev) => ({ ...prev, retroPalette: !prev.retroPalette }));
  };

  const handleToggleCrtFilter = () => {
    setState((prev) => ({ ...prev, crtFilter: !prev.crtFilter }));
  };

  const activeBuilding = state.buildings.find((b) => b.id === activeBuildingId) || null;
  const currentVisitingFarm = otherFarms.find((f) => f.id === visitingFarmId) || null;

  const hasDailyReady =
    Date.now() - state.lastDailyRewardClaim > 24 * 3600 * 1000 ||
    state.lastDailyRewardClaim === 0 ||
    Date.now() - state.lastSpinTimestamp > 24 * 3600 * 1000 ||
    state.lastSpinTimestamp === 0;

  const unclaimedAchievements = state.achievements.filter(
    (a) => !a.claimed && a.currentValue >= a.targetValue
  ).length;

  return (
    <main
      className={`fixed inset-0 w-screen h-screen flex flex-col bg-[#142315] select-none overflow-hidden font-fredoka ${
        state.crtFilter ? 'crt-scanlines' : ''
      }`}
    >
      {/* Initial Granja Valle Dorado Main Menu */}
      {isMainMenuOpen && (
        <MainMenu
          state={state}
          renderMode={renderMode}
          onToggleRenderMode={handleToggleRenderMode}
          onContinue={() => setIsMainMenuOpen(false)}
          onNewGame={handleNewGame}
          onToggleSound={() =>
            setState((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))
          }
          onToggleRetroPalette={handleToggleRetroPalette}
          onToggleCrtFilter={handleToggleCrtFilter}
          onOpenLeaderboard={() => {
            setIsMainMenuOpen(false);
            setIsLeaderboardOpen(true);
          }}
          onOpenCloud={() => {
            setIsMainMenuOpen(false);
            setIsCloudOpen(true);
          }}
        />
      )}

      {/* Top Notification Banner */}
      <NotificationBanner />

      {/* Top HUD Status Bar */}
      <TopBar
        state={state}
        renderMode={renderMode}
        onToggleRenderMode={handleToggleRenderMode}
        onOpenMainMenu={() => setIsMainMenuOpen(true)}
        onOpenSilo={() => setStorageModalType('silo')}
        onOpenBarn={() => setStorageModalType('barn')}
        onOpenDaily={() => setIsDailyOpen(true)}
        onOpenAchievements={() => setIsAchievementsOpen(true)}
        onOpenClans={() => setIsClansOpen(true)}
        onOpenCloud={() => setIsCloudOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenWorkshop={() => setIsWorkshopOpen(true)}
        onTogglePerformanceMode={handleTogglePerformanceMode}
        onToggleSound={() =>
          setState((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))
        }
        onToggleRetroPalette={handleToggleRetroPalette}
        onRequestNotifications={() => {
          notificationManager.requestPermission().then((granted) => {
            setState((prev) => ({ ...prev, notificationsEnabled: granted }));
            if (granted) {
              soundManager.playCoin();
              notificationManager.send({
                title: '🔔 Notificaciones Activadas',
                message: '¡Te avisaremos en cuanto tus cosechas y animales estén listos!',
                type: 'harvest',
                icon: '🌱',
              });
            }
          });
        }}
        isOnline={isOnline}
        hasDailyReady={hasDailyReady}
        unclaimedAchievements={unclaimedAchievements}
      />

      {/* Main Farm Interactive View: 3D WebGL (Smooth 3D Models) or 2D Classic Isometric */}
      {renderMode === '3d' ? (
        <FarmCanvas3D
          state={state}
          onHarvestPlot={handleHarvestPlot}
          onPlantPlot={handlePlantPlot}
          onWaterPlot={handleWaterPlot}
          onFeedAnimal={handleFeedAnimal}
          onCollectAnimal={handleCollectAnimal}
          onOpenBuilding={(bldId) => setActiveBuildingId(bldId)}
          onCollectBuildingItem={handleCollectBuildingItem}
          onOpenOrders={() => setIsOrdersOpen(true)}
          onOpenMarket={() => setIsMarketOpen(true)}
          onOpenOtherFarm={(farmId) => setVisitingFarmId(farmId)}
          onSpeedUpPlot={handleSpeedUpPlot}
          onSpeedUpAnimal={handleSpeedUpAnimal}
          onBuyPlot={handleBuyPlot}
          onOpenSilo={() => setStorageModalType('silo')}
          onOpenBarn={() => setStorageModalType('barn')}
          onSwitchTo2D={() => {
            setRenderMode('2d');
            try {
              localStorage.setItem('valle_dorado_render_mode', '2d');
            } catch {}
          }}
        />
      ) : (
        <FarmCanvas
          state={state}
          onHarvestPlot={handleHarvestPlot}
          onPlantPlot={handlePlantPlot}
          onWaterPlot={handleWaterPlot}
          onWaterAll={handleWaterAll}
          onHarvestAll={handleHarvestAll}
          onFeedAnimal={handleFeedAnimal}
          onCollectAnimal={handleCollectAnimal}
          onOpenBuilding={(bldId) => setActiveBuildingId(bldId)}
          onCollectBuildingItem={handleCollectBuildingItem}
          onOpenOrders={() => setIsOrdersOpen(true)}
          onOpenMarket={() => setIsMarketOpen(true)}
          onOpenOtherFarm={(farmId) => setVisitingFarmId(farmId)}
          onSpeedUpPlot={handleSpeedUpPlot}
          onSpeedUpAnimal={handleSpeedUpAnimal}
          onBuyPlot={handleBuyPlot}
          onOpenSilo={() => setStorageModalType('silo')}
          onOpenBarn={() => setStorageModalType('barn')}
          onOpenWorkshop={() => setIsWorkshopOpen(true)}
          onTogglePerformanceMode={handleTogglePerformanceMode}
        />
      )}

      {/* MODALS */}

      {/* Building Crafting Modal */}
      {activeBuildingId && (
        <BuildingModal
          building={activeBuilding}
          state={state}
          onClose={() => setActiveBuildingId(null)}
          onQueueRecipe={handleQueueRecipe}
          onCollectItem={handleCollectBuildingItem}
          onUnlockSlot={handleUnlockSlot}
          onSpeedUpSlot={handleSpeedUpBuildingSlot}
        />
      )}

      {/* Storage Modal (Silo / Barn) */}
      {storageModalType && (
        <StorageModal
          type={storageModalType}
          state={state}
          onClose={() => setStorageModalType(null)}
          onSellItem={handleSellItem}
          onUpgradeStorage={handleUpgradeStorage}
        />
      )}

      {/* Order Board Modal */}
      {isOrdersOpen && (
        <OrderBoardModal
          state={state}
          onClose={() => setIsOrdersOpen(false)}
          onFulfillOrder={handleFulfillOrder}
          onDiscardOrder={handleDiscardOrder}
        />
      )}

      {/* Global Market Modal */}
      {isMarketOpen && (
        <GlobalMarketModal
          state={state}
          newspaperListings={newspaperListings}
          onClose={() => setIsMarketOpen(false)}
          onBuyListing={handleBuyListing}
          onRefreshNewspaper={handleRefreshNewspaper}
          onListItemForSale={handleListItemForSale}
          onCollectSaleCoins={handleCollectSaleCoins}
          onVisitSeller={(sellerId) => {
            setIsMarketOpen(false);
            setVisitingFarmId(sellerId);
          }}
        />
      )}

      {/* Clans & Chat Modal */}
      {isClansOpen && (
        <ClansAndChatModal
          state={state}
          clan={SAMPLE_CLAN}
          clanChat={clanChat}
          globalChat={globalChat}
          onClose={() => setIsClansOpen(false)}
          onSendChatMessage={handleSendChatMessage}
          onFulfillSupplyRequest={handleFulfillSupplyRequest}
        />
      )}

      {/* Monthly Leaderboard Modal */}
      {isLeaderboardOpen && (
        <LeaderboardModal
          players={LEADERBOARD_DATA}
          state={state}
          onClose={() => setIsLeaderboardOpen(false)}
          onVisitPlayer={(playerId) => {
            setIsLeaderboardOpen(false);
            setVisitingFarmId(playerId);
          }}
        />
      )}

      {/* Visiting Other Farm Modal */}
      {visitingFarmId && (
        <VisitingFarmModal
          farm={currentVisitingFarm}
          state={state}
          onClose={() => setVisitingFarmId(null)}
          onReviveTree={handleReviveTree}
          onBuyVisitingItem={handleBuyVisitingItem}
        />
      )}

      {/* Daily Rewards & Lucky Wheel Modal */}
      {isDailyOpen && (
        <DailyRewardsModal
          state={state}
          onClose={() => setIsDailyOpen(false)}
          onClaimDailyStreak={handleClaimDailyStreak}
          onSpinWheel={handleSpinWheel}
        />
      )}

      {/* Cloud Sync & E2E Backup Modal */}
      {isCloudOpen && (
        <CloudSyncModal
          state={state}
          onClose={() => setIsCloudOpen(false)}
          onRestoreState={(restored) => setState(restored)}
          isOnline={isOnline}
        />
      )}

      {/* Achievements & Social Share Modal */}
      {isAchievementsOpen && (
        <AchievementsAndShareModal
          state={state}
          onClose={() => setIsAchievementsOpen(false)}
          onClaimAchievement={handleClaimAchievement}
        />
      )}

      {/* Tito's Automatons Workshop Modal (Rusty's Retirement System) */}
      {isWorkshopOpen && (
        <RustyWorkshopModal
          state={state}
          onClose={() => setIsWorkshopOpen(false)}
          onConvertBiofuel={handleConvertBiofuel}
          onUpgradeBot={handleUpgradeBot}
          onUnlockBot={handleUnlockBot}
          onToggleAutoWatering={handleToggleAutoWatering}
          onToggleAutoHarvesting={handleToggleAutoHarvesting}
          onWaterAllPlots={handleWaterAll}
          onHarvestAllPlots={handleHarvestAll}
          onTogglePerformanceMode={handleTogglePerformanceMode}
        />
      )}
    </main>
  );
}
