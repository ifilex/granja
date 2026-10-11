import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { FarmState, CropPlot, AnimalPen, ProductionBuilding } from '../types/game';
import { GAME_ITEMS } from '../data/gameData';
import { soundManager } from '../utils/audio';
import { IsometricSeedSelector } from './isometric/IsometricSeedSelector';
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Compass,
  Eye,
  Sparkles,
  Maximize2,
  Layers,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Floating3DParticle {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
}

export interface FarmCanvas3DProps {
  state: FarmState;
  onHarvestPlot: (plotId: number) => void;
  onPlantPlot: (plotId: number, cropId: string) => void;
  onWaterPlot?: (plotId: number) => void;
  onFeedAnimal: (penId: string) => void;
  onCollectAnimal: (penId: string) => void;
  onOpenBuilding: (buildingId: string) => void;
  onCollectBuildingItem: (buildingId: string, slotIndex: number) => void;
  onOpenOrders: () => void;
  onOpenMarket: () => void;
  onOpenOtherFarm: (farmId: string) => void;
  onSpeedUpPlot: (plotId: number) => void;
  onSpeedUpAnimal: (penId: string) => void;
  onBuyPlot?: () => void;
  onOpenSilo?: () => void;
  onOpenBarn?: () => void;
  onSwitchTo2D?: () => void;
}

export const FarmCanvas3D: React.FC<FarmCanvas3DProps> = ({
  state,
  onHarvestPlot,
  onPlantPlot,
  onWaterPlot,
  onFeedAnimal,
  onCollectAnimal,
  onOpenBuilding,
  onOpenOrders,
  onOpenMarket,
  onBuyPlot,
  onOpenSilo,
  onOpenBarn,
  onSwitchTo2D,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // UI States
  const [seedSelectorPlotId, setSeedSelectorPlotId] = useState<number | null>(null);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [floatingParticles, setFloatingParticles] = useState<Floating3DParticle[]>([]);
  const [cameraViewMode, setCameraViewMode] = useState<'iso' | 'top' | 'close'>('iso');
  const [hoveredObjectName, setHoveredObjectName] = useState<string | null>(null);
  const [trainToast, setTrainToast] = useState<string | null>(null);

  // Three.js internal references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Dynamic interactive 3D object registry for raycasting
  const interactiveObjectsRef = useRef<Map<THREE.Object3D, { type: string; id: any }>>(new Map());
  const windmillBladesRef = useRef<THREE.Group | null>(null);
  const trainRef = useRef<THREE.Group | null>(null);
  const truckRef = useRef<THREE.Group | null>(null);
  const duckRef = useRef<THREE.Group | null>(null);
  const smokeParticlesRef = useRef<THREE.Mesh[]>([]);
  const animalBobsRef = useRef<THREE.Group[]>([]);
  const cropMeshesGroupRef = useRef<THREE.Group | null>(null);
  const plotsInteractiveMeshesRef = useRef<Map<number, THREE.Mesh>>(new Map());

  // Camera Orbit and Drag State
  const isDraggingRef = useRef(false);
  const dragButtonRef = useRef(0); // 0 = left/pan, 2 = right/rotate
  const mousePrevRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchStartDistRef = useRef<number | null>(null);

  // Spherical camera parameters
  const cameraTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const cameraSphericalRef = useRef<{ radius: number; theta: number; phi: number }>({
    radius: 42,
    theta: Math.PI / 4, // 45 deg classic isometric angle
    phi: Math.PI / 3.4,  // gentle top-down angle
  });

  // Target values for smooth camera damping
  const targetSphericalRef = useRef<{ radius: number; theta: number; phi: number }>({
    radius: 42,
    theta: Math.PI / 4,
    phi: Math.PI / 3.4,
  });
  const targetLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  // Spawn visual screen particle
  const spawnScreenParticle = (text: string, x: number, y: number, color = '#fef08a') => {
    const p: Floating3DParticle = {
      id: Math.random().toString(),
      x,
      y: y - 20,
      text,
      color,
    };
    setFloatingParticles((prev) => [...prev, p]);
    setTimeout(() => {
      setFloatingParticles((prev) => prev.filter((item) => item.id !== p.id));
    }, 1300);
  };

  // ----------------------------------------------------
  // THREE.JS SCENE INITIALIZATION & BUILD
  // ----------------------------------------------------
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d2818); // Rich forest twilight background
    scene.fog = new THREE.FogExp2(0x0d2818, 0.012);
    sceneRef.current = scene;

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.5, 300);
    cameraRef.current = camera;

    // 3. WebGL Renderer (Potato Mode optimizations for old phones vs High Performance)
    const isPotato = state.performanceMode === 'potato';
    const renderer = new THREE.WebGLRenderer({
      antialias: !isPotato,
      powerPreference: isPotato ? 'low-power' : 'high-performance',
      precision: isPotato ? 'mediump' : 'highp',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isPotato ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isPotato;
    if (!isPotato) {
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    rendererRef.current = renderer;

    // Clear previous canvas if any
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 4. Lighting Rig
    // Warm Hemisphere Light (Sky Blue + Meadow Grass Green)
    const hemiLight = new THREE.HemisphereLight(0xbae6fd, 0x1e3a1e, 0.85);
    scene.add(hemiLight);

    // Warm Golden Sunlight with Soft Shadow Casting
    const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.4);
    sunLight.position.set(30, 45, 25);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 120;
    sunLight.shadow.camera.left = -35;
    sunLight.shadow.camera.right = 35;
    sunLight.shadow.camera.top = 35;
    sunLight.shadow.camera.bottom = -35;
    sunLight.shadow.bias = -0.0004;
    scene.add(sunLight);

    // Soft Ambient Fill Light
    const ambientLight = new THREE.AmbientLight(0xffedd5, 0.35);
    scene.add(ambientLight);

    // ----------------------------------------------------
    // BUILD 3D WORLD GEOMETRIES & MESHES
    // ----------------------------------------------------
    const interactiveMap = interactiveObjectsRef.current;
    interactiveMap.clear();

    // Materials Palette
    const grassTopMat = new THREE.MeshStandardMaterial({
      color: 0x388e3c,
      roughness: 0.7,
      metalness: 0.05,
      flatShading: false,
    });
    const cliffSideMat = new THREE.MeshStandardMaterial({
      color: 0x4e342e,
      roughness: 0.9,
      metalness: 0.1,
    });
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.15,
      metalness: 0.2,
      transparent: true,
      opacity: 0.88,
    });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
    const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.85 });
    const redBarnMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.6 });
    const whiteTrimMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3, metalness: 0.6 });
    const goldCropMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 });
    const cornGreenMat = new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.6 });
    const carrotOrangeMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4 });
    const soilBedMat = new THREE.MeshStandardMaterial({ color: 0x382211, roughness: 0.95 });
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 });
    const railBallastMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });
    const steelRailMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.25, metalness: 0.8 });

    // A. 3D FLOATING ISLAND BASE
    const islandGroup = new THREE.Group();

    // Main Meadow Table
    const islandGeo = new THREE.BoxGeometry(46, 5, 46);
    const islandMesh = new THREE.Mesh(islandGeo, [
      cliffSideMat, // right
      cliffSideMat, // left
      grassTopMat,  // top
      cliffSideMat, // bottom
      cliffSideMat, // front
      cliffSideMat, // back
    ]);
    islandMesh.position.y = -2.5;
    islandMesh.receiveShadow = true;
    islandGroup.add(islandMesh);

    // Decorative Terraced Hillocks for organic landscape feel
    const hillGeo = new THREE.CylinderGeometry(6, 9, 2.5, 12);
    const hillMesh1 = new THREE.Mesh(hillGeo, grassTopMat);
    hillMesh1.position.set(-15, 0.8, -14);
    hillMesh1.receiveShadow = true;
    hillMesh1.castShadow = true;
    islandGroup.add(hillMesh1);

    const hillMesh2 = new THREE.Mesh(hillGeo, grassTopMat);
    hillMesh2.position.set(16, 0.8, -13);
    hillMesh2.receiveShadow = true;
    hillMesh2.castShadow = true;
    islandGroup.add(hillMesh2);

    // B. 3D WATER POND & DOCK
    const pondGeo = new THREE.BoxGeometry(11, 0.6, 9);
    const pondMesh = new THREE.Mesh(pondGeo, waterMat);
    pondMesh.position.set(15, 0.05, 14);
    islandGroup.add(pondMesh);

    // Swimming 3D Duck
    const duckGroup = new THREE.Group();
    const duckBody = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), new THREE.MeshStandardMaterial({ color: 0xfef08a }));
    duckBody.scale.set(1.2, 0.8, 0.9);
    duckGroup.add(duckBody);
    const duckHead = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), new THREE.MeshStandardMaterial({ color: 0x15803d }));
    duckHead.position.set(0.3, 0.25, 0);
    duckGroup.add(duckHead);
    const duckBeak = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 6), new THREE.MeshStandardMaterial({ color: 0xf97316 }));
    duckBeak.rotation.z = -Math.PI / 2;
    duckBeak.position.set(0.48, 0.22, 0);
    duckGroup.add(duckBeak);
    duckGroup.position.set(15, 0.45, 14);
    duckRef.current = duckGroup;
    islandGroup.add(duckGroup);

    // Wooden Pier / Dock
    const pierGeo = new THREE.BoxGeometry(3.5, 0.4, 5);
    const pierMesh = new THREE.Mesh(pierGeo, woodMat);
    pierMesh.position.set(10.5, 0.35, 14);
    pierMesh.castShadow = true;
    pierMesh.receiveShadow = true;
    islandGroup.add(pierMesh);

    // Mooring Posts
    for (let i = -1.8; i <= 1.8; i += 1.8) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.2, 6), woodMat);
      post.position.set(9.2, 0.7, 14 + i);
      post.castShadow = true;
      islandGroup.add(post);
    }

    // Cargo Boat at Dock
    const boatGroup = new THREE.Group();
    const hullGeo = new THREE.BoxGeometry(4.2, 0.9, 2.2);
    const hullMesh = new THREE.Mesh(hullGeo, redBarnMat);
    hullMesh.castShadow = true;
    boatGroup.add(hullMesh);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.1, 1.8), whiteTrimMat);
    cabin.position.set(-1.1, 0.8, 0);
    cabin.castShadow = true;
    boatGroup.add(cabin);
    boatGroup.position.set(14.5, 0.5, 17.5);
    islandGroup.add(boatGroup);
    interactiveMap.set(boatGroup, { type: 'boat', id: 'boat' });

    // C. 3D RAILROAD & STEAM TRAIN
    const railY = 0.15;
    const railZ = -17; // Running along northern border
    const ballast = new THREE.Mesh(new THREE.BoxGeometry(44, 0.2, 3.2), railBallastMat);
    ballast.position.set(0, railY, railZ);
    ballast.receiveShadow = true;
    islandGroup.add(ballast);

    // Ties & Steel Rails
    for (let rx = -21; rx <= 21; rx += 1.4) {
      const tie = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 2.4), darkWoodMat);
      tie.position.set(rx, railY + 0.1, railZ);
      tie.receiveShadow = true;
      islandGroup.add(tie);
    }
    const railL = new THREE.Mesh(new THREE.BoxGeometry(44, 0.15, 0.12), steelRailMat);
    railL.position.set(0, railY + 0.22, railZ - 0.7);
    islandGroup.add(railL);
    const railR = new THREE.Mesh(new THREE.BoxGeometry(44, 0.15, 0.12), steelRailMat);
    railR.position.set(0, railY + 0.22, railZ + 0.7);
    islandGroup.add(railR);

    // 3D Steam Locomotive
    const trainGroup = new THREE.Group();
    // Boiler
    const boiler = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 3.5, 16), new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.5, roughness: 0.4 }));
    boiler.rotation.z = Math.PI / 2;
    boiler.position.set(0.5, 1.4, 0);
    boiler.castShadow = true;
    trainGroup.add(boiler);

    // Brass Bands
    [-0.5, 0.6, 1.7].forEach((bx) => {
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.04, 8, 24), new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.8, roughness: 0.2 }));
      band.rotation.y = Math.PI / 2;
      band.position.set(bx, 1.4, 0);
      trainGroup.add(band);
    });

    // Cab
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.2, 2.0), redBarnMat);
    cab.position.set(-1.8, 1.8, 0);
    cab.castShadow = true;
    trainGroup.add(cab);

    // Chimney Stack
    const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.24, 1.1, 12), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 }));
    chimney.position.set(1.6, 2.5, 0);
    chimney.castShadow = true;
    trainGroup.add(chimney);

    // Wheels
    [-2.2, -1.1, 0.2, 1.4].forEach((wx) => {
      const wheelL = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.15, 12), redBarnMat);
      wheelL.rotation.x = Math.PI / 2;
      wheelL.position.set(wx, 0.6, -0.9);
      wheelL.castShadow = true;
      trainGroup.add(wheelL);

      const wheelR = wheelL.clone();
      wheelR.position.z = 0.9;
      trainGroup.add(wheelR);
    });

    // Grain Cargo Wagon
    const wagon = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.5, 1.9), woodMat);
    wagon.position.set(-5.2, 1.4, 0);
    wagon.castShadow = true;
    trainGroup.add(wagon);

    const cargoGrain = new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.8, 8), goldCropMat);
    cargoGrain.position.set(-5.2, 2.3, 0);
    trainGroup.add(cargoGrain);

    trainGroup.position.set(6, railY, railZ);
    trainRef.current = trainGroup;
    islandGroup.add(trainGroup);
    interactiveMap.set(trainGroup, { type: 'train', id: 'steam_train' });

    // Smoke Puffs Array
    const smokeGroup = new THREE.Group();
    const smokePuffs: THREE.Mesh[] = [];
    for (let i = 0; i < 4; i++) {
      const puff = new THREE.Mesh(
        new THREE.SphereGeometry(0.35 + i * 0.12, 7, 7),
        new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 - i * 0.12 })
      );
      puff.position.set(6 + 1.6 - i * 0.8, 3.2 + i * 0.6, railZ);
      smokePuffs.push(puff);
      smokeGroup.add(puff);
    }
    smokeParticlesRef.current = smokePuffs;
    islandGroup.add(smokeGroup);

    // D. 3D ROADWAY & DELIVERY TRUCK
    const roadY = 0.1;
    const roadZ = -10;
    const roadMesh = new THREE.Mesh(new THREE.BoxGeometry(44, 0.12, 3.4), roadMat);
    roadMesh.position.set(0, roadY, roadZ);
    roadMesh.receiveShadow = true;
    islandGroup.add(roadMesh);

    // Yellow Dashes
    for (let dx = -20; dx <= 20; dx += 3.2) {
      const dash = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.14, 0.2), new THREE.MeshStandardMaterial({ color: 0xfacc15 }));
      dash.position.set(dx, roadY + 0.02, roadZ);
      islandGroup.add(dash);
    }

    // 3D Delivery Truck
    const truckGroup = new THREE.Group();
    const truckCab = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.4, 1.6), redBarnMat);
    truckCab.position.set(0.6, 1.1, 0);
    truckCab.castShadow = true;
    truckGroup.add(truckCab);

    const truckBed = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.1, 1.7), woodMat);
    truckBed.position.set(-1.4, 1.0, 0);
    truckBed.castShadow = true;
    truckGroup.add(truckBed);

    // Crates in truck bed
    const crateGeo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
    const crateMat = new THREE.MeshStandardMaterial({ color: 0xd97706 });
    const crate1 = new THREE.Mesh(crateGeo, crateMat);
    crate1.position.set(-1.6, 1.7, -0.3);
    truckGroup.add(crate1);
    const crate2 = new THREE.Mesh(crateGeo, crateMat);
    crate2.position.set(-1.1, 1.7, 0.3);
    truckGroup.add(crate2);

    // Truck Wheels
    [-1.8, 0.7].forEach((wx) => {
      const wl = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.2, 12), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
      wl.rotation.x = Math.PI / 2;
      wl.position.set(wx, 0.45, -0.9);
      truckGroup.add(wl);

      const wr = wl.clone();
      wr.position.z = 0.9;
      truckGroup.add(wr);
    });

    truckGroup.position.set(-3, roadY, roadZ);
    truckRef.current = truckGroup;
    islandGroup.add(truckGroup);
    interactiveMap.set(truckGroup, { type: 'truck', id: 'delivery_truck' });

    // Order Notice Board next to truck
    const boardGroup = new THREE.Group();
    const boardPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.2, 6), woodMat);
    boardPost.position.y = 1.1;
    boardGroup.add(boardPost);
    const boardSign = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 0.15), new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.8 }));
    boardSign.position.set(0, 1.7, 0);
    boardSign.castShadow = true;
    boardGroup.add(boardSign);
    boardGroup.position.set(-6, roadY, roadZ - 2.4);
    islandGroup.add(boardGroup);
    interactiveMap.set(boardGroup, { type: 'orders', id: 'orders_board' });

    // E. 3D FARM BUILDINGS
    // 1. Red Barn (Granero) at (-10, 0, -2)
    const barnGroup = new THREE.Group();
    const barnBody = new THREE.Mesh(new THREE.BoxGeometry(6.5, 4.2, 5.5), redBarnMat);
    barnBody.position.y = 2.1;
    barnBody.castShadow = true;
    barnBody.receiveShadow = true;
    barnGroup.add(barnBody);

    // Gambrel Roof
    const roofGeo = new THREE.ConeGeometry(4.8, 2.5, 4);
    const roofMesh = new THREE.Mesh(roofGeo, whiteTrimMat);
    roofMesh.rotation.y = Math.PI / 4;
    roofMesh.position.y = 5.2;
    roofMesh.scale.set(1.1, 1, 1.25);
    roofMesh.castShadow = true;
    barnGroup.add(roofMesh);

    // Barn Door & Hayloft Window
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.6, 0.2), whiteTrimMat);
    door.position.set(0, 1.3, 2.8);
    barnGroup.add(door);

    const hayBale = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.8, 1.1), goldCropMat);
    hayBale.position.set(0, 3.4, 2.9);
    barnGroup.add(hayBale);

    barnGroup.position.set(-10, 0, -2);
    islandGroup.add(barnGroup);
    interactiveMap.set(barnGroup, { type: 'barn', id: 'barn' });

    // 2. Grain Silo at (-15.5, 0, -2)
    const siloGroup = new THREE.Group();
    const siloBody = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 6.2, 16), metalMat);
    siloBody.position.y = 3.1;
    siloBody.castShadow = true;
    siloBody.receiveShadow = true;
    siloGroup.add(siloBody);

    const siloDome = new THREE.Mesh(new THREE.SphereGeometry(1.8, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), whiteTrimMat);
    siloDome.position.y = 6.2;
    siloDome.castShadow = true;
    siloGroup.add(siloDome);

    siloGroup.position.set(-15.5, 0, -2);
    islandGroup.add(siloGroup);
    interactiveMap.set(siloGroup, { type: 'silo', id: 'silo' });

    // 3. Windmill (Molino de Piensos) at (12, 0, -2)
    const millGroup = new THREE.Group();
    const millTower = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.8, 5.8, 8), new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9 }));
    millTower.position.y = 2.9;
    millTower.castShadow = true;
    millTower.receiveShadow = true;
    millGroup.add(millTower);

    const millRoof = new THREE.Mesh(new THREE.ConeGeometry(2.4, 2.0, 8), redBarnMat);
    millRoof.position.y = 6.6;
    millRoof.castShadow = true;
    millGroup.add(millRoof);

    // 4 Animated Rotating Blades
    const bladesGroup = new THREE.Group();
    bladesGroup.position.set(0, 5.6, 2.2);

    for (let b = 0; b < 4; b++) {
      const bladeRod = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.8, 0.08), woodMat);
      bladeRod.position.y = 1.9;
      const sail = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 3.2), whiteTrimMat);
      sail.position.set(0.4, 1.8, 0.02);

      const singleBlade = new THREE.Group();
      singleBlade.add(bladeRod);
      singleBlade.add(sail);
      singleBlade.rotation.z = (b * Math.PI) / 2;
      bladesGroup.add(singleBlade);
    }
    millGroup.add(bladesGroup);
    windmillBladesRef.current = bladesGroup;

    millGroup.position.set(12, 0, -2);
    islandGroup.add(millGroup);
    interactiveMap.set(millGroup, { type: 'building', id: 'feed_mill' });

    // 4. Bakery (Panadería) at (14, 0, 5)
    const bakeryGroup = new THREE.Group();
    const bakeryWalls = new THREE.Mesh(new THREE.BoxGeometry(4.6, 2.8, 4.0), new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.7 }));
    bakeryWalls.position.y = 1.4;
    bakeryWalls.castShadow = true;
    bakeryWalls.receiveShadow = true;
    bakeryGroup.add(bakeryWalls);

    const bakeryRoof = new THREE.Mesh(new THREE.ConeGeometry(3.6, 2.0, 4), redBarnMat);
    bakeryRoof.rotation.y = Math.PI / 4;
    bakeryRoof.position.y = 3.6;
    bakeryRoof.scale.set(1.1, 1, 1.1);
    bakeryRoof.castShadow = true;
    bakeryGroup.add(bakeryRoof);

    // Stone Chimney
    const chimneyStone = new THREE.Mesh(new THREE.BoxGeometry(0.7, 3.5, 0.7), new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 }));
    chimneyStone.position.set(1.4, 3.0, -1.0);
    chimneyStone.castShadow = true;
    bakeryGroup.add(chimneyStone);

    bakeryGroup.position.set(14, 0, 5);
    islandGroup.add(bakeryGroup);
    interactiveMap.set(bakeryGroup, { type: 'building', id: 'bakery' });

    // 5. Dairy Works (Lechería) at (-12, 0, 5)
    const dairyGroup = new THREE.Group();
    const dairyWalls = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.6, 3.8), new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.6 }));
    dairyWalls.position.y = 1.3;
    dairyWalls.castShadow = true;
    dairyGroup.add(dairyWalls);

    const dairyRoof = new THREE.Mesh(new THREE.ConeGeometry(3.2, 1.8, 4), whiteTrimMat);
    dairyRoof.rotation.y = Math.PI / 4;
    dairyRoof.position.y = 3.3;
    dairyRoof.castShadow = true;
    dairyGroup.add(dairyRoof);

    // Milk Canister
    const milkCan = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 1.0, 8), metalMat);
    milkCan.position.set(1.6, 0.5, 1.6);
    dairyGroup.add(milkCan);

    dairyGroup.position.set(-12, 0, 5);
    islandGroup.add(dairyGroup);
    interactiveMap.set(dairyGroup, { type: 'building', id: 'dairy' });

    // F. 3D ANIMAL PASTURES & ANIMALS
    // Cow Pasture at (-11, 0, 13)
    const cowPenGroup = new THREE.Group();
    // Fence Rails
    const penFenceMat = woodMat;
    const penSize = 6.5;
    const halfPen = penSize / 2;
    // Fence boundary posts
    [-halfPen, halfPen].forEach((px) => {
      [-halfPen, halfPen].forEach((pz) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.4, 6), penFenceMat);
        post.position.set(px, 0.7, pz);
        cowPenGroup.add(post);
      });
    });
    // Fence rails
    const railX1 = new THREE.Mesh(new THREE.BoxGeometry(penSize, 0.12, 0.08), penFenceMat);
    railX1.position.set(0, 0.6, -halfPen);
    cowPenGroup.add(railX1);
    const railX2 = new THREE.Mesh(new THREE.BoxGeometry(penSize, 0.12, 0.08), penFenceMat);
    railX2.position.set(0, 0.6, halfPen);
    cowPenGroup.add(railX2);
    const railZ1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, penSize), penFenceMat);
    railZ1.position.set(-halfPen, 0.6, 0);
    cowPenGroup.add(railZ1);
    const railZ2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, penSize), penFenceMat);
    railZ2.position.set(halfPen, 0.6, 0);
    cowPenGroup.add(railZ2);

    // 3D Animated Holstein Cow
    const cowGroup = new THREE.Group();
    const cowBody = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 0.9), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    cowBody.position.y = 0.9;
    cowBody.castShadow = true;
    cowGroup.add(cowBody);

    // Black spots
    const spot1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.92), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
    spot1.position.set(0.2, 1.0, 0);
    cowGroup.add(spot1);

    // Cow Head
    const cowHead = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.6), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    cowHead.position.set(0.9, 1.3, 0);
    cowGroup.add(cowHead);
    const cowSnout = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.35, 0.5), new THREE.MeshStandardMaterial({ color: 0xfbcfe8 }));
    cowSnout.position.set(1.3, 1.2, 0);
    cowGroup.add(cowSnout);

    // Cow Legs
    [
      [-0.5, -0.35],
      [-0.5, 0.35],
      [0.5, -0.35],
      [0.5, 0.35],
    ].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, 0.2), new THREE.MeshStandardMaterial({ color: 0xffffff }));
      leg.position.set(lx, 0.35, lz);
      leg.castShadow = true;
      cowGroup.add(leg);
    });

    cowGroup.position.set(0, 0, 0);
    cowPenGroup.add(cowGroup);
    animalBobsRef.current.push(cowGroup);

    cowPenGroup.position.set(-11, 0, 13);
    islandGroup.add(cowPenGroup);
    interactiveMap.set(cowPenGroup, { type: 'animal', id: 'cow_pasture' });

    // Chicken Pen at (-4, 0, 13)
    const chickenPenGroup = new THREE.Group();
    // Coop house
    const coop = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.0, 2.0), redBarnMat);
    coop.position.set(-1, 1.0, -1);
    coop.castShadow = true;
    chickenPenGroup.add(coop);
    const coopRoof = new THREE.Mesh(new THREE.ConeGeometry(1.9, 1.1, 4), whiteTrimMat);
    coopRoof.rotation.y = Math.PI / 4;
    coopRoof.position.set(-1, 2.4, -1);
    chickenPenGroup.add(coopRoof);

    // Animated Pecking Chickens
    for (let c = 0; c < 2; c++) {
      const chkGroup = new THREE.Group();
      const chkBody = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), new THREE.MeshStandardMaterial({ color: 0xffffff }));
      chkBody.position.y = 0.35;
      chkGroup.add(chkBody);
      const comb = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.15, 0.18), redBarnMat);
      comb.position.set(0, 0.55, 0);
      chkGroup.add(comb);
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.15, 4), new THREE.MeshStandardMaterial({ color: 0xfacc15 }));
      beak.rotation.z = -Math.PI / 2;
      beak.position.set(0.3, 0.4, 0);
      chkGroup.add(beak);

      chkGroup.position.set(0.6 + c * 0.9, 0, 0.2 - c * 0.7);
      chickenPenGroup.add(chkGroup);
      animalBobsRef.current.push(chkGroup);
    }

    chickenPenGroup.position.set(-4, 0, 13);
    islandGroup.add(chickenPenGroup);
    interactiveMap.set(chickenPenGroup, { type: 'animal', id: 'chicken_pen' });

    // G. 3D DECORATIVE TREES (Pine & Apple Trees)
    const treeCoords = [
      { x: -18, z: -12, type: 'pine' },
      { x: -17, z: 9, type: 'apple' },
      { x: 18, z: -8, type: 'pine' },
      { x: 17, z: 2, type: 'apple' },
      { x: -19, z: 17, type: 'pine' },
      { x: 3, z: 18, type: 'apple' },
      { x: 6, z: -5, type: 'pine' },
    ];

    treeCoords.forEach(({ x, z, type }) => {
      const treeGroup = new THREE.Group();
      if (type === 'pine') {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 1.8, 6), darkWoodMat);
        trunk.position.y = 0.9;
        trunk.castShadow = true;
        treeGroup.add(trunk);

        [
          { r: 2.2, h: 2.2, y: 2.4 },
          { r: 1.7, h: 1.9, y: 3.8 },
          { r: 1.1, h: 1.5, y: 4.9 },
        ].forEach((tier) => {
          const cone = new THREE.Mesh(
            new THREE.ConeGeometry(tier.r, tier.h, 7),
            new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.8 })
          );
          cone.position.y = tier.y;
          cone.castShadow = true;
          treeGroup.add(cone);
        });
      } else {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 2.0, 6), woodMat);
        trunk.position.y = 1.0;
        trunk.castShadow = true;
        treeGroup.add(trunk);

        const foliage = new THREE.Mesh(
          new THREE.SphereGeometry(1.9, 8, 8),
          new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.7 })
        );
        foliage.position.y = 3.2;
        foliage.castShadow = true;
        treeGroup.add(foliage);

        // Red Apples
        [
          [0.8, 3.4, 1.4],
          [-1.1, 2.9, 0.9],
          [0.5, 3.8, -1.2],
        ].forEach(([ax, ay, az]) => {
          const apple = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), redBarnMat);
          apple.position.set(ax, ay, az);
          treeGroup.add(apple);
        });
      }

      treeGroup.position.set(x, 0, z);
      islandGroup.add(treeGroup);
    });

    scene.add(islandGroup);

    // Group dedicated to dynamic crop plots that update when state changes
    const cropGroup = new THREE.Group();
    scene.add(cropGroup);
    cropMeshesGroupRef.current = cropGroup;

    // ----------------------------------------------------
    // ANIMATION RENDER LOOP (Smooth 60FPS)
    // ----------------------------------------------------
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // 1. Rotate Windmill Blades Smoothly
      if (windmillBladesRef.current) {
        windmillBladesRef.current.rotation.z -= 0.018;
      }

      // 2. Chug Steam Train & Locomotive Vibrations
      if (trainRef.current) {
        trainRef.current.position.y = railY + Math.sin(elapsedTime * 8) * 0.03;
      }

      // 3. Smoke Particles Floating & Pulsing
      smokeParticlesRef.current.forEach((puff, idx) => {
        puff.position.y = 3.2 + idx * 0.6 + Math.sin(elapsedTime * 3 + idx) * 0.15;
        puff.position.x = 6 + 1.6 - idx * 0.8 + Math.cos(elapsedTime * 2 + idx) * 0.1;
        puff.scale.setScalar(1.0 + Math.sin(elapsedTime * 2 + idx) * 0.1);
      });

      // 4. Bob Animals & Duck
      if (duckRef.current) {
        duckRef.current.position.x = 15 + Math.sin(elapsedTime * 0.6) * 1.5;
        duckRef.current.position.z = 14 + Math.cos(elapsedTime * 0.6) * 1.2;
        duckRef.current.rotation.y = -elapsedTime * 0.6;
      }

      animalBobsRef.current.forEach((anim, i) => {
        anim.position.y = Math.abs(Math.sin(elapsedTime * 3 + i * 1.5)) * 0.12;
      });

      // 5. Smooth Camera Damping (Spherical Coordinates)
      const cur = cameraSphericalRef.current;
      const tgt = targetSphericalRef.current;

      cur.radius += (tgt.radius - cur.radius) * 0.08;
      cur.theta += (tgt.theta - cur.theta) * 0.08;
      cur.phi += (tgt.phi - cur.phi) * 0.08;

      const lookCur = cameraTargetRef.current;
      const lookTgt = targetLookAtRef.current;
      lookCur.lerp(lookTgt, 0.08);

      // Convert spherical to Cartesian position
      const sinPhiRadius = Math.sin(cur.phi) * cur.radius;
      camera.position.x = lookCur.x + sinPhiRadius * Math.sin(cur.theta);
      camera.position.y = lookCur.y + Math.cos(cur.phi) * cur.radius;
      camera.position.z = lookCur.z + sinPhiRadius * Math.cos(cur.theta);
      camera.lookAt(lookCur);

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      renderer.dispose();
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    };
  }, []);

  // ----------------------------------------------------
  // SYNC DYNAMIC CROP PLOTS WITH GAME STATE
  // ----------------------------------------------------
  useEffect(() => {
    const cropGroup = cropMeshesGroupRef.current;
    if (!cropGroup) return;

    // Clear existing dynamic plot children
    while (cropGroup.children.length > 0) {
      cropGroup.remove(cropGroup.children[0]);
    }
    plotsInteractiveMeshesRef.current.clear();

    const now = Date.now();
    const soilBedMat = new THREE.MeshStandardMaterial({ color: 0x382211, roughness: 0.95 });
    const wheatMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 });
    const cornMat = new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.6 });
    const carrotMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4 });
    const greenMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.7 });

    // Grid layout for plots: 4 columns centered around (0, 0, 1)
    const plotsPerRow = 4;
    const spacingX = 3.8;
    const spacingZ = 3.6;

    state.plots.forEach((plot, index) => {
      const col = index % plotsPerRow;
      const row = Math.floor(index / plotsPerRow);
      const px = (col - 1.5) * spacingX;
      const pz = -1 + row * spacingZ;

      const plotContainer = new THREE.Group();
      plotContainer.position.set(px, 0.05, pz);

      // Raised Soil Planter Bed
      const bedGeo = new THREE.BoxGeometry(3.2, 0.25, 3.0);
      const bedMesh = new THREE.Mesh(bedGeo, soilBedMat);
      bedMesh.receiveShadow = true;
      plotContainer.add(bedMesh);

      // Register for raycasting
      interactiveObjectsRef.current.set(bedMesh, { type: 'plot', id: plot.id });
      plotsInteractiveMeshesRef.current.set(plot.id, bedMesh);

      // If Crop is Planted
      if (plot.cropId && plot.plantedAt) {
        const itemInfo = GAME_ITEMS[plot.cropId];
        const growthDuration = (itemInfo?.growthTimeSeconds || 60) * 1000;
        const progress = Math.min(1.0, (now - plot.plantedAt) / growthDuration);
        const isReady = progress >= 1.0;

        const cropVisuals = new THREE.Group();

        // 3D Procedural Plant Models Based on Crop Type
        if (plot.cropId === 'wheat') {
          // Wheat Stalks in Furrow Rows
          for (let row = -1; row <= 1; row += 0.7) {
            for (let col = -1; col <= 1; col += 0.5) {
              const stemH = 0.4 + progress * 0.9;
              const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, stemH, 5), isReady ? wheatMat : greenMat);
              stem.position.set(col, stemH / 2, row);
              stem.castShadow = true;
              cropVisuals.add(stem);

              // Golden Grain Ear Top
              if (progress > 0.4) {
                const ear = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 5), wheatMat);
                ear.position.set(col, stemH + 0.15, row);
                cropVisuals.add(ear);
              }
            }
          }
        } else if (plot.cropId === 'corn') {
          // Corn Stalks with Leaves & Cobs
          for (let col = -0.8; col <= 0.8; col += 0.8) {
            const stalkH = 0.6 + progress * 1.4;
            const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, stalkH, 6), cornMat);
            stalk.position.set(col, stalkH / 2, 0);
            stalk.castShadow = true;
            cropVisuals.add(stalk);

            if (progress > 0.5) {
              // Yellow Corn Cob
              const cob = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.5, 6), wheatMat);
              cob.rotation.z = 0.4;
              cob.position.set(col + 0.2, stalkH * 0.6, 0.1);
              cropVisuals.add(cob);
            }
          }
        } else if (plot.cropId === 'carrot') {
          // Carrot Leaves & Peeking Orange Tops
          for (let rx = -0.8; rx <= 0.8; rx += 0.8) {
            for (let rz = -0.7; rz <= 0.7; rz += 0.7) {
              const frond = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.6 * progress, 5), greenMat);
              frond.position.set(rx, 0.3 * progress, rz);
              cropVisuals.add(frond);

              if (isReady) {
                const orangeTop = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.05, 0.25, 6), carrotMat);
                orangeTop.position.set(rx, 0.15, rz);
                cropVisuals.add(orangeTop);
              }
            }
          }
        } else {
          // Generic Sprouting Crops (Strawberry, Sugarcane, Soybean)
          for (let gx = -0.7; gx <= 0.7; gx += 0.7) {
            const sprout = new THREE.Mesh(new THREE.SphereGeometry(0.35 * progress, 7, 7), greenMat);
            sprout.position.set(gx, 0.25 * progress, 0);
            cropVisuals.add(sprout);
          }
        }

        // Ready Aura Glow Indicator
        if (isReady) {
          const readyRing = new THREE.Mesh(
            new THREE.RingGeometry(1.2, 1.4, 16),
            new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide })
          );
          readyRing.rotation.x = -Math.PI / 2;
          readyRing.position.y = 0.18;
          cropVisuals.add(readyRing);
        }

        plotContainer.add(cropVisuals);
      }

      cropGroup.add(plotContainer);
    });

    // "Desarrollar Parcela" Expander Slot
    if (onBuyPlot) {
      const nextIndex = state.plots.length;
      const col = nextIndex % plotsPerRow;
      const row = Math.floor(nextIndex / plotsPerRow);
      const px = (col - 1.5) * spacingX;
      const pz = -1 + row * spacingZ;

      const buyMesh = new THREE.Mesh(
        new THREE.BoxGeometry(3.0, 0.2, 2.8),
        new THREE.MeshStandardMaterial({
          color: state.coins >= (40 + state.plots.length * 20) ? 0x15803d : 0x475569,
          roughness: 0.8,
        })
      );
      buyMesh.position.set(px, 0.05, pz);
      interactiveObjectsRef.current.set(buyMesh, { type: 'buy_plot', id: 'buy_plot' });
      cropGroup.add(buyMesh);
    }
  }, [state.plots, state.coins, onBuyPlot]);

  // ----------------------------------------------------
  // INTERACTIVE RAYCASTING (Clicks, Touch, Hovers)
  // ----------------------------------------------------
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    dragButtonRef.current = e.button;
    mousePrevRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      const dx = e.clientX - mousePrevRef.current.x;
      const dy = e.clientY - mousePrevRef.current.y;
      mousePrevRef.current = { x: e.clientX, y: e.clientY };

      // Left click = Pan, Right click or Shift = Orbit Rotation
      if (dragButtonRef.current === 2 || e.shiftKey) {
        // Orbit Rotate
        targetSphericalRef.current.theta -= dx * 0.007;
        targetSphericalRef.current.phi = Math.max(0.3, Math.min(Math.PI / 2.2, targetSphericalRef.current.phi - dy * 0.007));
      } else {
        // Pan World
        const curTheta = cameraSphericalRef.current.theta;
        const forward = new THREE.Vector3(-Math.sin(curTheta), 0, -Math.cos(curTheta));
        const right = new THREE.Vector3(Math.cos(curTheta), 0, -Math.sin(curTheta));

        const panFactor = 0.035;
        targetLookAtRef.current.addScaledVector(right, -dx * panFactor);
        targetLookAtRef.current.addScaledVector(forward, dy * panFactor);

        // Clamp pan to island boundaries
        targetLookAtRef.current.x = Math.max(-20, Math.min(20, targetLookAtRef.current.x));
        targetLookAtRef.current.z = Math.max(-20, Math.min(20, targetLookAtRef.current.z));
      }
    } else {
      // Hover Raycasting
      checkRaycastHover(e.clientX, e.clientY);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    // If movement was negligible, treat as a Click
    const dist = Math.hypot(e.clientX - mousePrevRef.current.x, e.clientY - mousePrevRef.current.y);
    if (dist < 4) {
      handleRaycastClick(e.clientX, e.clientY);
    }
    isDraggingRef.current = false;
  };

  // Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY > 0 ? 3.5 : -3.5;
    targetSphericalRef.current.radius = Math.max(18, Math.min(65, targetSphericalRef.current.radius + zoomDelta));
  };

  // Check Hover Object for Cursor
  const checkRaycastHover = (clientX: number, clientY: number) => {
    const container = mountRef.current;
    if (!container || !cameraRef.current || !sceneRef.current) return;

    const rect = container.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    const interactiveList = Array.from(interactiveObjectsRef.current.keys()) as THREE.Object3D[];
    const intersects = raycaster.intersectObjects(interactiveList, true);

    if (intersects.length > 0) {
      let rootHit: THREE.Object3D | null = intersects[0].object;
      while (rootHit && !interactiveObjectsRef.current.has(rootHit)) {
        rootHit = rootHit.parent;
      }
      if (rootHit) {
        const info = interactiveObjectsRef.current.get(rootHit);
        if (info?.type === 'plot') setHoveredObjectName(`Parcela #${info.id}`);
        else if (info?.type === 'building') setHoveredObjectName(`Fábrica: ${info.id}`);
        else if (info?.type === 'train') setHoveredObjectName('🚂 Tren a Vapor Expreso');
        else if (info?.type === 'truck') setHoveredObjectName('🚚 Camión de Reparto');
        else if (info?.type === 'barn') setHoveredObjectName('Granero Principal');
        else if (info?.type === 'silo') setHoveredObjectName('Silo de Granos');
        else setHoveredObjectName(info?.type || null);
        container.style.cursor = 'pointer';
        return;
      }
    }
    setHoveredObjectName(null);
    container.style.cursor = isDraggingRef.current ? 'grabbing' : 'grab';
  };

  // Click Trigger
  const handleRaycastClick = (clientX: number, clientY: number) => {
    const container = mountRef.current;
    if (!container || !cameraRef.current) return;

    const rect = container.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    const interactiveList = Array.from(interactiveObjectsRef.current.keys()) as THREE.Object3D[];
    const intersects = raycaster.intersectObjects(interactiveList, true);

    if (intersects.length > 0) {
      let rootHit: THREE.Object3D | null = intersects[0].object;
      while (rootHit && !interactiveObjectsRef.current.has(rootHit)) {
        rootHit = rootHit.parent;
      }

      if (rootHit) {
        const info = interactiveObjectsRef.current.get(rootHit);
        if (!info) return;

        soundManager.playClick();

        // 1. PLOT CLICK
        if (info.type === 'plot') {
          const plot = state.plots.find((p) => p.id === info.id);
          if (!plot) return;

          const now = Date.now();
          const item = plot.cropId ? GAME_ITEMS[plot.cropId] : null;
          const isReady = plot.cropId && plot.plantedAt && now - plot.plantedAt >= (item?.growthTimeSeconds || 60) * 1000;

          if (activeTool === 'water_can' || (!plot.isWatered && plot.cropId && !isReady)) {
            if (onWaterPlot) onWaterPlot(plot.id);
            soundManager.playWater();
            spawnScreenParticle('💧 ¡Regado! 2x vel.', clientX, clientY, '#38bdf8');
          } else if (isReady) {
            onHarvestPlot(plot.id);
            soundManager.playHarvest();
            spawnScreenParticle(`+2 ${item?.name || 'Cosecha'}! 🌾`, clientX, clientY, '#facc15');
            confetti({
              particleCount: 20,
              spread: 50,
              origin: { x: clientX / window.innerWidth, y: clientY / window.innerHeight },
            });
          } else if (!plot.cropId) {
            if (activeTool && GAME_ITEMS[activeTool]?.category === 'crop') {
              onPlantPlot(plot.id, activeTool);
              soundManager.playPlant();
              spawnScreenParticle(`Sembrado ${GAME_ITEMS[activeTool].name}`, clientX, clientY, '#86efac');
            } else {
              setSeedSelectorPlotId(plot.id);
            }
          }
        }
        // 2. EXPAND PLOT
        else if (info.type === 'buy_plot') {
          if (onBuyPlot) onBuyPlot();
        }
        // 3. STEAM TRAIN
        else if (info.type === 'train') {
          soundManager.playTrainWhistle();
          setTrainToast('🚂 ¡Expreso Agrícola 3D! Transportando 30T de trigo hacia el puerto continental.');
          setTimeout(() => setTrainToast(null), 3500);
        }
        // 4. TRUCK & ORDERS
        else if (info.type === 'truck' || info.type === 'orders') {
          onOpenOrders();
        }
        // 5. BARN & SILO
        else if (info.type === 'barn' && onOpenBarn) {
          onOpenBarn();
        } else if (info.type === 'silo' && onOpenSilo) {
          onOpenSilo();
        }
        // 6. FACTORIES & BUILDINGS
        else if (info.type === 'building') {
          onOpenBuilding(info.id);
        }
        // 7. ANIMALS
        else if (info.type === 'animal') {
          const pen = state.animals.find((a) => a.id === info.id);
          if (pen) {
            if (pen.readyProducts > 0) {
              onCollectAnimal(pen.id);
              spawnScreenParticle(`¡Producto recolectado! ⭐`, clientX, clientY, '#fef08a');
            } else {
              onFeedAnimal(pen.id);
              spawnScreenParticle(`¡Animales alimentados! 🌾`, clientX, clientY, '#93c5fd');
            }
          }
        }
      }
    }
  };

  // Camera Presets
  const setCameraPreset = (preset: 'iso' | 'top' | 'close') => {
    soundManager.playClick();
    setCameraViewMode(preset);
    if (preset === 'iso') {
      targetSphericalRef.current = { radius: 42, theta: Math.PI / 4, phi: Math.PI / 3.4 };
      targetLookAtRef.current = new THREE.Vector3(0, 0, 0);
    } else if (preset === 'top') {
      targetSphericalRef.current = { radius: 46, theta: 0, phi: 0.2 };
      targetLookAtRef.current = new THREE.Vector3(0, 0, 0);
    } else if (preset === 'close') {
      targetSphericalRef.current = { radius: 24, theta: Math.PI / 4, phi: Math.PI / 3.2 };
      targetLookAtRef.current = new THREE.Vector3(0, 1, 2);
    }
  };

  return (
    <div className="relative w-full h-full flex-1 overflow-hidden select-none bg-[#0c2414]">
      {/* Three.js Canvas Container */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Floating 3D HUD Badges */}
      <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2 pointer-events-auto z-10">
        <div className="flex items-center gap-2 bg-stone-950/85 backdrop-blur-md border-2 border-emerald-500/80 rounded-2xl px-3 py-1.5 shadow-xl text-xs font-bold text-emerald-200">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>MOTOR 3D SUAVE • WEBGL REAL</span>
        </div>

        {/* Switch to 2D Mode Button */}
        {onSwitchTo2D && (
          <button
            onClick={() => {
              soundManager.playClick();
              onSwitchTo2D();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-stone-900/90 hover:bg-stone-800 text-amber-200 border border-amber-600/70 font-bold text-xs shadow-lg active:scale-95 transition"
            title="Cambiar a Vista Isométrica 2D"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Vista 2D Clásica</span>
          </button>
        )}
      </div>

      {/* Hover Object Tooltip */}
      {hoveredObjectName && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-stone-950/90 text-yellow-300 font-bold text-xs px-4 py-1.5 rounded-full border border-yellow-500/60 shadow-xl pointer-events-none z-10 animate-fade-in">
          {hoveredObjectName}
        </div>
      )}

      {/* Train Cargo Toast Notification */}
      {trainToast && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-stone-950/95 text-amber-200 font-extrabold text-xs sm:text-sm px-5 py-2.5 rounded-2xl border-2 border-yellow-400 shadow-2xl pointer-events-none z-20 animate-bounce">
          {trainToast}
        </div>
      )}

      {/* Floating Particle Text Overlay */}
      {floatingParticles.map((p) => (
        <div
          key={p.id}
          style={{
            left: p.x,
            top: p.y,
            color: p.color,
          }}
          className="fixed -translate-x-1/2 -translate-y-1/2 pointer-events-none font-black text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] z-50 animate-float-pulse"
        >
          {p.text}
        </div>
      ))}

      {/* Floating 3D Camera Controls */}
      <div className="absolute right-3 top-3 flex flex-col gap-2 z-10 pointer-events-auto">
        {/* Zoom In */}
        <button
          onClick={() => {
            soundManager.playClick();
            targetSphericalRef.current.radius = Math.max(18, targetSphericalRef.current.radius - 6);
          }}
          className="w-9 h-9 rounded-xl bg-stone-950/85 hover:bg-stone-900 border border-emerald-500/60 text-emerald-200 flex items-center justify-center shadow-lg active:scale-95 transition"
          title="Acercar Cámara"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        {/* Zoom Out */}
        <button
          onClick={() => {
            soundManager.playClick();
            targetSphericalRef.current.radius = Math.min(65, targetSphericalRef.current.radius + 6);
          }}
          className="w-9 h-9 rounded-xl bg-stone-950/85 hover:bg-stone-900 border border-emerald-500/60 text-emerald-200 flex items-center justify-center shadow-lg active:scale-95 transition"
          title="Alejar Cámara"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        {/* Reset / Iso View */}
        <button
          onClick={() => setCameraPreset('iso')}
          className={`w-9 h-9 rounded-xl border flex items-center justify-center shadow-lg active:scale-95 transition ${
            cameraViewMode === 'iso'
              ? 'bg-emerald-600 border-yellow-300 text-stone-950 font-bold'
              : 'bg-stone-950/85 hover:bg-stone-900 border-emerald-500/60 text-emerald-200'
          }`}
          title="Ángulo Isométrico 3D"
        >
          <Compass className="w-4 h-4" />
        </button>

        {/* Close Up */}
        <button
          onClick={() => setCameraPreset('close')}
          className={`w-9 h-9 rounded-xl border flex items-center justify-center shadow-lg active:scale-95 transition ${
            cameraViewMode === 'close'
              ? 'bg-emerald-600 border-yellow-300 text-stone-950 font-bold'
              : 'bg-stone-950/85 hover:bg-stone-900 border-emerald-500/60 text-emerald-200'
          }`}
          title="Vista Detallada Primer Plano"
        >
          <Eye className="w-4 h-4" />
        </button>

        {/* Top-Down Bird's Eye */}
        <button
          onClick={() => setCameraPreset('top')}
          className={`w-9 h-9 rounded-xl border flex items-center justify-center shadow-lg active:scale-95 transition ${
            cameraViewMode === 'top'
              ? 'bg-emerald-600 border-yellow-300 text-stone-950 font-bold'
              : 'bg-stone-950/85 hover:bg-stone-900 border-emerald-500/60 text-emerald-200'
          }`}
          title="Vista Cenital"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Navigation Footer Pill */}
      <div className="absolute bottom-3 inset-x-0 flex justify-center pointer-events-none z-10 px-2">
        <div className="bg-stone-950/90 backdrop-blur-md border border-amber-600/70 rounded-2xl px-3 py-1.5 shadow-2xl flex items-center gap-1.5 pointer-events-auto max-w-md overflow-x-auto">
          <button
            onClick={() => {
              soundManager.playClick();
              targetLookAtRef.current = new THREE.Vector3(0, 0, 1);
            }}
            className="px-2.5 py-1 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-200 font-bold text-xs whitespace-nowrap active:scale-95 transition"
          >
            🌾 Cultivos
          </button>
          <button
            onClick={() => {
              soundManager.playClick();
              targetLookAtRef.current = new THREE.Vector3(-10, 0, 13);
            }}
            className="px-2.5 py-1 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-200 font-bold text-xs whitespace-nowrap active:scale-95 transition"
          >
            🐄 Animales
          </button>
          <button
            onClick={() => {
              soundManager.playClick();
              targetLookAtRef.current = new THREE.Vector3(13, 0, 0);
            }}
            className="px-2.5 py-1 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-200 font-bold text-xs whitespace-nowrap active:scale-95 transition"
          >
            🏭 Fábricas
          </button>
          <button
            onClick={() => {
              soundManager.playClick();
              targetLookAtRef.current = new THREE.Vector3(0, 0, -14);
            }}
            className="px-2.5 py-1 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-200 font-bold text-xs whitespace-nowrap active:scale-95 transition"
          >
            🚂 Ferrocarril
          </button>
        </div>
      </div>

      {/* Seed Selector Modal when clicking empty 3D plot */}
      {seedSelectorPlotId !== null && (
        <IsometricSeedSelector
          state={state}
          plotId={seedSelectorPlotId}
          onSelectSeed={(plotId, cropId) => {
            onPlantPlot(plotId, cropId);
            setSeedSelectorPlotId(null);
          }}
          onClose={() => setSeedSelectorPlotId(null)}
        />
      )}
    </div>
  );
};
