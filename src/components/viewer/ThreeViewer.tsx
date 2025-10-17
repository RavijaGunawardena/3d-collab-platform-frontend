import { useRef, useEffect, useState, Suspense } from "react";
import { Canvas, useThree, ThreeEvent, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Grid,
  TransformControls,
  Environment,
  ContactShadows,
  Html,
  useProgress,
  Stars,
  PerspectiveCamera,
} from "@react-three/drei";
import * as THREE from "three";
import { toast } from "sonner";
import {
  Maximize2,
  Home,
  Crosshair,
  AlertTriangle,
  Camera,
  Orbit,
  Move3D,
  RotateCcw,
  ZoomIn,
  Eye,
  Grid3X3,
  Navigation,
  Activity,
  Settings,
} from "lucide-react";

import { ProjectDisplay, CameraState, Vector3 } from "@/types/project.types";
import { Annotation } from "@/types/annotation.types";
import { useCameraSync } from "@/hooks/useSocket";
import { projectService } from "@/services/projectService";
import { annotationService } from "@/services/annotationService";
import { AnnotationMarkers } from "@/components/viewer/AnnotationMarkers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Enhanced Loading Component
function LoadingScreen() {
  const { progress } = useProgress();
  const [loadingPhase, setLoadingPhase] = useState("Initializing");

  useEffect(() => {
    if (progress < 25) setLoadingPhase("Loading 3D Engine");
    else if (progress < 50) setLoadingPhase("Setting up Scene");
    else if (progress < 75) setLoadingPhase("Loading Models");
    else setLoadingPhase("Finalizing");
  }, [progress]);

  return (
    <Html center>
      <div className="flex flex-col items-center gap-6 text-white animate-in">
        <div className="relative">
          {/* Animated loading ring */}
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <div
            className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-chart-1 rounded-full animate-spin"
            style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
          />

          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Grid3X3 className="w-6 h-6 text-primary animate-pulse" />
          </div>
        </div>

        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Preparing 3D Workspace
          </h3>
          <p className="text-sm text-slate-400">{loadingPhase}</p>
          <div className="w-48 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-chart-1 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 font-mono">
            {progress.toFixed(1)}% Complete
          </p>
        </div>
      </div>
    </Html>
  );
}

// Enhanced Scene Component
function Scene({
  project,
  selectedModelId,
  onModelUpdate,
  isPlacingAnnotation,
  onAnnotationPlaced,
  annotations,
  selectedAnnotationId,
  onAnnotationClick,
}: {
  project: ProjectDisplay;
  selectedModelId: string | null;
  onModelUpdate: () => void;
  isPlacingAnnotation: boolean;
  onAnnotationPlaced: (position: Vector3) => void;
  annotations: Annotation[];
  selectedAnnotationId: string | null;
  onAnnotationClick: (annotation: Annotation) => void;
}) {
  const sceneRef = useRef<THREE.Group>(null);

  // Subtle scene animations
  useFrame((state) => {
    if (sceneRef.current) {
      // Gentle breathing animation for the scene
      const breathe = Math.sin(state.clock.elapsedTime * 0.5) * 0.01;
      sceneRef.current.scale.setScalar(1 + breathe);
    }
  });

  const handleSceneClick = (event: ThreeEvent<MouseEvent>) => {
    if (!isPlacingAnnotation) return;

    event.stopPropagation();
    const point = event.point;

    onAnnotationPlaced({
      x: Number(point.x.toFixed(3)),
      y: Number(point.y.toFixed(3)),
      z: Number(point.z.toFixed(3)),
    });
  };

  return (
    <group ref={sceneRef} onClick={handleSceneClick}>
      {/* Enhanced Lighting Setup */}
      <ambientLight intensity={0.3} color="#ffffff" />

      {/* Key light */}
      <directionalLight
        position={[10, 15, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-far={100}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-bias={-0.0001}
      />

      {/* Fill lights */}
      <directionalLight
        position={[-5, 10, -5]}
        intensity={0.4}
        color="#a7f3d0"
      />
      <directionalLight
        position={[0, -5, 10]}
        intensity={0.3}
        color="#fbbf24"
      />

      {/* Rim light */}
      <directionalLight
        position={[-10, 5, -10]}
        intensity={0.6}
        color="#60a5fa"
      />

      {/* Environment and Atmosphere */}
      <Environment
        preset="studio"
        background={false}
        environmentIntensity={0.4}
      />
      <Stars
        radius={100}
        depth={50}
        count={1000}
        factor={2}
        saturation={0.1}
        fade
      />

      {/* Enhanced Grid */}
      <Grid
        args={[50, 50]}
        cellSize={1}
        cellThickness={0.8}
        cellColor="#6b7280"
        sectionSize={10}
        sectionThickness={1.5}
        sectionColor="#374151"
        fadeDistance={40}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={true}
      />

      {/* Enhanced Ground Shadows */}
      <ContactShadows
        position={[0, -0.005, 0]}
        opacity={0.4}
        scale={50}
        blur={2.5}
        far={20}
        resolution={512}
        color="#000000"
      />

      {/* Models */}
      {project.models && project.models.length > 0 ? (
        project.models.map((model, index) => (
          <Model3D
            key={model._id || index}
            model={model}
            isSelected={selectedModelId === model._id}
            projectId={project.id}
            onUpdate={onModelUpdate}
          />
        ))
      ) : (
        // Enhanced default demo objects
        <group>
          <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              color="#60a5fa"
              roughness={0.2}
              metalness={0.1}
              envMapIntensity={0.8}
            />
          </mesh>
          <mesh position={[2, 0.3, 0]} castShadow receiveShadow>
            <sphereGeometry args={[0.6, 32, 32]} />
            <meshStandardMaterial
              color="#34d399"
              roughness={0.3}
              metalness={0.2}
              envMapIntensity={0.8}
            />
          </mesh>
          <mesh position={[-2, 0.5, 0]} castShadow receiveShadow>
            <coneGeometry args={[0.6, 1, 8]} />
            <meshStandardMaterial
              color="#f87171"
              roughness={0.4}
              metalness={0.1}
              envMapIntensity={0.8}
            />
          </mesh>
        </group>
      )}

      {/* Annotations */}
      <AnnotationMarkers
        annotations={annotations}
        selectedAnnotationId={selectedAnnotationId}
        onAnnotationClick={onAnnotationClick}
      />
    </group>
  );
}

// Ultra Enhanced Model Component
function Model3D({
  model,
  isSelected,
  projectId,
  onUpdate,
}: {
  model: any;
  isSelected: boolean;
  projectId: string;
  onUpdate: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const transformRef = useRef<any>(null);
  const lastUpdateTime = useRef<number>(0);
  const updateThrottle = 800;
  const [isHovered, setIsHovered] = useState(false);

  // Smooth hover animation
  useFrame((state) => {
    if (meshRef.current && (isSelected || isHovered)) {
      const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.02;
      meshRef.current.scale.setScalar(model.scale.x + pulse);
    }
  });

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.set(
        model.position.x,
        model.position.y,
        model.position.z
      );
      meshRef.current.rotation.set(
        model.rotation.x,
        model.rotation.y,
        model.rotation.z
      );
      if (!isSelected && !isHovered) {
        meshRef.current.scale.set(model.scale.x, model.scale.y, model.scale.z);
      }
    }
  }, [model, isSelected, isHovered]);

  const handleTransformEnd = async () => {
    if (!meshRef.current || !model._id) return;

    const now = Date.now();
    if (now - lastUpdateTime.current < updateThrottle) {
      return;
    }

    try {
      const position = meshRef.current.position;
      const rotation = meshRef.current.rotation;
      const scale = meshRef.current.scale;

      await projectService.updateModel(projectId, model._id, {
        position: {
          x: Number(position.x.toFixed(3)),
          y: Number(position.y.toFixed(3)),
          z: Number(position.z.toFixed(3)),
        },
        rotation: {
          x: Number(rotation.x.toFixed(3)),
          y: Number(rotation.y.toFixed(3)),
          z: Number(rotation.z.toFixed(3)),
        },
        scale: {
          x: Number(scale.x.toFixed(3)),
          y: Number(scale.y.toFixed(3)),
          z: Number(scale.z.toFixed(3)),
        },
      });

      lastUpdateTime.current = now;
      onUpdate();

      toast.success("Model Updated", {
        description: "Changes saved successfully",
        duration: 2000,
      });
    } catch (error) {
      console.error("Failed to update model transform:", error);
      toast.error("Save Failed", {
        description: "Could not save model changes",
      });
    }
  };

  const renderGeometry = () => {
    if (model.type === "primitive" && model.geometry) {
      const { type: geometryType } = model.geometry;
      const color = model.color || "#888888";
      const roughness = isSelected ? 0.2 : isHovered ? 0.3 : 0.4;
      const metalness = isSelected ? 0.3 : isHovered ? 0.2 : 0.1;

      const materialProps = {
        color,
        roughness,
        metalness,
        envMapIntensity: 0.8,
        clearcoat: isSelected ? 0.3 : 0,
        clearcoatRoughness: 0.1,
      };

      switch (geometryType) {
        case "box":
          return (
            <>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial {...materialProps} />
            </>
          );
        case "sphere":
          return (
            <>
              <sphereGeometry args={[0.5, 64, 64]} />
              <meshStandardMaterial {...materialProps} />
            </>
          );
        case "cylinder":
          return (
            <>
              <cylinderGeometry args={[0.5, 0.5, 1, 32]} />
              <meshStandardMaterial {...materialProps} />
            </>
          );
        case "cone":
          return (
            <>
              <coneGeometry args={[0.5, 1, 32]} />
              <meshStandardMaterial {...materialProps} />
            </>
          );
        case "torus":
          return (
            <>
              <torusGeometry args={[0.5, 0.2, 16, 100]} />
              <meshStandardMaterial {...materialProps} />
            </>
          );
        default:
          return null;
      }
    }

    return (
      <>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#888888" wireframe />
      </>
    );
  };

  if (!model.visible) {
    return null;
  }

  return (
    <group>
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        onPointerOver={(e) => {
          e.stopPropagation();
          setIsHovered(true);
          document.body.style.cursor = isSelected ? "move" : "pointer";
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setIsHovered(false);
          document.body.style.cursor = "auto";
        }}
      >
        {renderGeometry()}

        {/* Selection outline */}
        {isSelected && (
          <mesh scale={[1.05, 1.05, 1.05]}>
            {renderGeometry()}
            <meshBasicMaterial
              color="#60a5fa"
              transparent
              opacity={0.1}
              side={THREE.BackSide}
            />
          </mesh>
        )}
      </mesh>

      {isSelected && meshRef.current && (
        <TransformControls
          ref={transformRef}
          object={meshRef.current}
          mode="translate"
          onObjectChange={handleTransformEnd}
          showX={true}
          showY={true}
          showZ={true}
          size={1}
          space="world"
        />
      )}
    </group>
  );
}

// Enhanced Camera Controller
function CameraController({
  projectId,
  initialCamera,
  onCameraChange,
}: {
  projectId: string;
  initialCamera?: CameraState;
  onCameraChange?: (camera: any) => void;
}) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  const { updateCamera } = useCameraSync(projectId, (data) => {
    console.log("Camera sync from:", data.username);
  });

  useEffect(() => {
    if (initialCamera && camera) {
      camera.position.set(
        initialCamera.position.x,
        initialCamera.position.y,
        initialCamera.position.z
      );
      if (controlsRef.current && initialCamera.target) {
        controlsRef.current.target.set(
          initialCamera.target.x,
          initialCamera.target.y,
          initialCamera.target.z
        );
      }
    }
  }, [initialCamera, camera]);

  const handleCameraChangeEvent = () => {
    if (controlsRef.current && camera) {
      const target = controlsRef.current.target;
      const cameraState = {
        position: {
          x: Number(camera.position.x.toFixed(3)),
          y: Number(camera.position.y.toFixed(3)),
          z: Number(camera.position.z.toFixed(3)),
        },
        rotation: {
          x: Number(camera.rotation.x.toFixed(3)),
          y: Number(camera.rotation.y.toFixed(3)),
          z: Number(camera.rotation.z.toFixed(3)),
        },
        target: {
          x: Number(target.x.toFixed(3)),
          y: Number(target.y.toFixed(3)),
          z: Number(target.z.toFixed(3)),
        },
        zoom: 1,
      };

      updateCamera(cameraState);
      onCameraChange?.(cameraState);
    }
  };

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.03}
      minDistance={0.5}
      maxDistance={100}
      maxPolarAngle={Math.PI / 2.1}
      onChange={handleCameraChangeEvent}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      rotateSpeed={0.8}
      zoomSpeed={1.2}
      panSpeed={0.8}
    />
  );
}

// Ultra Enhanced Viewport Controls
function ViewportControls({
  onResetCamera,
  onFitToView,
  isPlacingAnnotation,
  onCancelPlacement,
}: {
  onResetCamera: () => void;
  onFitToView: () => void;
  isPlacingAnnotation: boolean;
  onCancelPlacement: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <TooltipProvider>
      <div className="absolute top-4 left-4 flex flex-col gap-3 z-20">
        {/* Enhanced Placement Mode Indicator */}
        {isPlacingAnnotation && (
          <div className="bg-gradient-to-r from-primary/95 to-chart-1/95 backdrop-blur-xl border border-primary/30 rounded-2xl p-4 shadow-2xl shadow-primary/20 animate-in">
            <div className="flex items-center gap-3 text-white">
              <div className="p-2 bg-white/20 rounded-xl">
                <Crosshair className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Annotation Mode Active</p>
                <p className="text-xs opacity-90 mt-1">
                  Click on any 3D surface to place your annotation
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={onCancelPlacement}
                className="text-white hover:bg-white/20 h-8 w-8 p-0 rounded-lg"
              >
                ×
              </Button>
            </div>
          </div>
        )}

        {/* Enhanced Control Panel */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">
          {/* Header */}
          <div className="p-3 border-b border-slate-700/50 bg-slate-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/20 rounded-lg">
                  <Camera className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-white">Viewport</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 w-6 p-0 text-slate-400 hover:text-white"
              >
                <Settings
                  className={`h-3 w-3 transition-transform duration-200 ${
                    isExpanded ? "rotate-45" : ""
                  }`}
                />
              </Button>
            </div>
          </div>

          {/* Main Controls */}
          <div className="p-3 space-y-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onResetCamera}
                  className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800/50"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Reset View
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Reset camera to default position</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onFitToView}
                  className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800/50"
                >
                  <Maximize2 className="h-4 w-4 mr-2" />
                  Fit All
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Fit all models in view</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Expanded Controls */}
          {isExpanded && (
            <div className="border-t border-slate-700/50 bg-slate-800/30 p-3 space-y-2 animate-in">
              <div className="grid grid-cols-2 gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-slate-400 hover:text-white hover:bg-slate-700/50 p-2 h-auto flex-col gap-1"
                    >
                      <Orbit className="h-4 w-4" />
                      <span className="text-xs">Orbit</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Drag to orbit around models</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-slate-400 hover:text-white hover:bg-slate-700/50 p-2 h-auto flex-col gap-1"
                    >
                      <Move3D className="h-4 w-4" />
                      <span className="text-xs">Pan</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Right-click drag to pan view</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-slate-400 hover:text-white hover:bg-slate-700/50 p-2 h-auto flex-col gap-1"
                    >
                      <ZoomIn className="h-4 w-4" />
                      <span className="text-xs">Zoom</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Scroll wheel to zoom in/out</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-slate-400 hover:text-white hover:bg-slate-700/50 p-2 h-auto flex-col gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="text-xs">Focus</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Double-click model to focus</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

// Enhanced Performance Monitor
function PerformanceMonitor() {
  const [fps, setFps] = useState(60);

  useEffect(() => {
    let frameCount = 0;
    let startTime = Date.now();

    const updateStats = () => {
      frameCount++;
      const currentTime = Date.now();

      if (currentTime - startTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (currentTime - startTime)));
        frameCount = 0;
        startTime = currentTime;
      }

      requestAnimationFrame(updateStats);
    };

    const animationId = requestAnimationFrame(updateStats);
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="absolute bottom-4 left-4 z-20 flex gap-2">
      <Badge
        variant={fps < 30 ? "destructive" : fps < 50 ? "secondary" : "default"}
        className="bg-slate-900/80 backdrop-blur-sm border-slate-700/50 text-slate-300"
      >
        <Activity className="w-3 h-3 mr-1" />
        {fps} FPS
      </Badge>

      <Badge
        variant="secondary"
        className="bg-slate-900/80 backdrop-blur-sm border-slate-700/50 text-slate-300"
      >
        <Grid3X3 className="w-3 h-3 mr-1" />
        WebGL 2.0
      </Badge>
    </div>
  );
}

// Main Enhanced ThreeViewer Component
interface ThreeViewerProps {
  project: ProjectDisplay;
  selectedModelId: string | null;
  isPlacingAnnotation: boolean;
  onAnnotationPlaced: (position: Vector3) => void;
}

export function ThreeViewer({
  project,
  selectedModelId,
  isPlacingAnnotation,
  onAnnotationPlaced,
}: ThreeViewerProps) {
  const [error, setError] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<
    string | null
  >(null);
  const [cameraState, setCameraState] = useState<CameraState | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch annotations with enhanced error handling
  useEffect(() => {
    const fetchAnnotations = async () => {
      try {
        const data = await annotationService.getAnnotationsByProject(
          project.id
        );
        const transformedAnnotations = data.map((annotation: any) => ({
          id: annotation._id || annotation.id,
          projectId: annotation.projectId,
          modelId: annotation.modelId,
          userId: annotation.userId,
          username: annotation.username,
          text: annotation.text,
          position: annotation.position,
          attachmentType: annotation.attachmentType,
          style: annotation.style,
          color: annotation.color,
          visible: annotation.visible,
          createdAt: new Date(annotation.createdAt),
          updatedAt: new Date(annotation.updatedAt),
        }));
        setAnnotations(transformedAnnotations);
      } catch (error) {
        console.error("Failed to fetch annotations:", error);
        toast.error("Sync Issue", {
          description: "Annotations will sync when connection is restored.",
        });
      }
    };

    fetchAnnotations();
    const interval = setInterval(fetchAnnotations, 45000);
    return () => clearInterval(interval);
  }, [project.id]);

  // Enhanced cursor management
  useEffect(() => {
    if (isPlacingAnnotation) {
      document.body.style.cursor = "crosshair";
      document.body.classList.add("annotation-mode");
    } else {
      document.body.style.cursor = "auto";
      document.body.classList.remove("annotation-mode");
    }

    return () => {
      document.body.style.cursor = "auto";
      document.body.classList.remove("annotation-mode");
    };
  }, [isPlacingAnnotation]);

  const handleAnnotationClick = (annotation: Annotation) => {
    setSelectedAnnotationId(
      selectedAnnotationId === annotation.id ? null : annotation.id
    );
  };

  const handleResetCamera = () => {
    setCameraState({
      position: { x: 8, y: 8, z: 12 },
      rotation: { x: 0, y: 0, z: 0 },
      target: { x: 0, y: 0, z: 0 },
      zoom: 1,
    });
    toast.success("Camera Reset", {
      description: "View restored to default position",
    });
  };

  const handleFitToView = () => {
    toast.info("Fitting Models", {
      description: "Calculating optimal view...",
    });
    // Enhanced fit-to-view logic would go here
  };

  const handleCancelPlacement = () => {
    toast.info("Annotation Cancelled", {
      description: "Exited annotation placement mode",
    });
  };

  // Enhanced error boundary
  useEffect(() => {
    const checkWebGL = () => {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");

      if (!gl) {
        setError("WebGL not supported - 3D features require WebGL");
        return false;
      }
      return true;
    };

    if (!THREE.REVISION || !checkWebGL()) {
      setError("3D Engine failed to initialize");
      toast.error("3D Viewer Error", {
        description: "Failed to initialize 3D rendering engine",
      });
    }
  }, []);

  // Enhanced error display
  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center max-w-md p-8 bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl">
          <div className="w-16 h-16 mx-auto mb-6 bg-destructive/20 rounded-2xl flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-3">
            3D Viewer Error
          </h3>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">{error}</p>
          <div className="space-y-3">
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="w-full"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reload Application
            </Button>
            <p className="text-xs text-slate-500">
              If the problem persists, check browser compatibility or try a
              different browser.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 canvas-container bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Background ambiance */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/2 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-0 right-1/4 w-80 h-80 bg-chart-1/3 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <Canvas
        ref={canvasRef}
        shadows="soft"
        gl={{
          antialias: true,
          alpha: false,
          preserveDrawingBuffer: true,
          powerPreference: "high-performance",
          stencil: false,
          depth: true,
        }}
        dpr={[1, 2]}
        camera={{
          position: [
            project.cameraState?.position.x || 8,
            project.cameraState?.position.y || 8,
            project.cameraState?.position.z || 12,
          ],
          fov: 45,
          near: 0.1,
          far: 1000,
        }}
        onCreated={(state) => {
          state.gl.shadowMap.enabled = true;
          state.gl.shadowMap.type = THREE.PCFSoftShadowMap;
          state.gl.toneMapping = THREE.ACESFilmicToneMapping;
          state.gl.toneMappingExposure = 1.2;
        }}
      >
        <Suspense fallback={<LoadingScreen />}>
          <PerspectiveCamera makeDefault />

          <CameraController
            projectId={project.id}
            initialCamera={cameraState || project.cameraState}
            onCameraChange={setCameraState}
          />

          <Scene
            project={project}
            selectedModelId={selectedModelId}
            onModelUpdate={() => {}}
            isPlacingAnnotation={isPlacingAnnotation}
            onAnnotationPlaced={onAnnotationPlaced}
            annotations={annotations}
            selectedAnnotationId={selectedAnnotationId}
            onAnnotationClick={handleAnnotationClick}
          />
        </Suspense>
      </Canvas>

      {/* Enhanced UI Overlays */}
      <ViewportControls
        onResetCamera={handleResetCamera}
        onFitToView={handleFitToView}
        isPlacingAnnotation={isPlacingAnnotation}
        onCancelPlacement={handleCancelPlacement}
      />

      {/* Performance Monitor (Debug) */}
      {process.env.NODE_ENV === "development" && <PerformanceMonitor />}

      {/* Viewport Status */}
      <div className="absolute top-4 right-4 z-20">
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="bg-slate-900/80 backdrop-blur-sm border-slate-700/50 text-slate-300"
          >
            <Eye className="w-3 h-3 mr-1" />
            3D Viewport
          </Badge>

          {isPlacingAnnotation && (
            <Badge className="bg-primary/90 text-primary-foreground animate-pulse">
              <Navigation className="w-3 h-3 mr-1" />
              Placement Mode
            </Badge>
          )}
        </div>
      </div>

      {/* Helper overlay for first-time users */}
      <div className="absolute bottom-4 right-4 z-20">
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl p-3 max-w-xs">
          <div className="flex items-start gap-2 text-xs text-slate-400">
            <Navigation className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="font-medium text-slate-300">Navigation Controls:</p>
              <p>• Drag to orbit • Right-drag to pan • Scroll to zoom</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ThreeViewer;
