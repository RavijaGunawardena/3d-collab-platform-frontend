import { useRef, useEffect, useState, Suspense } from "react";
import { Canvas, useThree, ThreeEvent } from "@react-three/fiber";
import {
  OrbitControls,
  Grid,
  TransformControls,
  Environment,
  ContactShadows,
  Html,
  useProgress,
} from "@react-three/drei";
import * as THREE from "three";
import { toast } from "sonner";
import {
  Loader2,
  Maximize2,
  Home,
  Crosshair,
  AlertTriangle,
} from "lucide-react";

import { ProjectDisplay, CameraState, Vector3 } from "@/types/project.types";
import { Annotation } from "@/types/annotation.types";
import { useCameraSync, useAnnotationSync } from "@/hooks/useSocket";
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

// Loading Component
function LoadingScreen() {
  const { progress } = useProgress();

  return (
    <Html center>
      <div className="flex flex-col items-center gap-4 text-white">
        <Loader2 className="h-8 w-8 animate-spin" />
        <div className="text-center">
          <p className="text-sm font-medium">Loading 3D Scene</p>
          <p className="text-xs text-slate-400 mt-1">
            {progress.toFixed(0)}% complete
          </p>
        </div>
      </div>
    </Html>
  );
}

// Scene Component
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
  const handleSceneClick = (event: ThreeEvent<MouseEvent>) => {
    if (!isPlacingAnnotation) return;

    event.stopPropagation();
    const point = event.point;

    onAnnotationPlaced({
      x: point.x,
      y: point.y,
      z: point.z,
    });
  };

  return (
    <group onClick={handleSceneClick}>
      {/* Lighting Setup */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <directionalLight position={[-10, -10, -5]} intensity={0.3} />

      {/* Environment and Ground */}
      <Environment preset="city" background={false} />

      <Grid
        args={[20, 20]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#6b7280"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#374151"
        fadeDistance={30}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={false}
      />

      <ContactShadows
        position={[0, -0.01, 0]}
        opacity={0.3}
        scale={20}
        blur={2}
        far={10}
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
        // Default demo cube
        <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color="#60a5fa"
            roughness={0.3}
            metalness={0.1}
          />
        </mesh>
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

// Enhanced Model Component
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
  const updateThrottle = 1000; // Reduced throttle for better responsiveness

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
      meshRef.current.scale.set(model.scale.x, model.scale.y, model.scale.z);
    }
  }, [model]);

  const handleTransformEnd = async () => {
    if (!meshRef.current || !model._id) return;

    const now = Date.now();
    if (now - lastUpdateTime.current < updateThrottle) {
      return;
    }

    try {
      await projectService.updateModel(projectId, model._id, {
        position: {
          x: Number(meshRef.current.position.x.toFixed(3)),
          y: Number(meshRef.current.position.y.toFixed(3)),
          z: Number(meshRef.current.position.z.toFixed(3)),
        },
        rotation: {
          x: Number(meshRef.current.rotation.x.toFixed(3)),
          y: Number(meshRef.current.rotation.y.toFixed(3)),
          z: Number(meshRef.current.rotation.z.toFixed(3)),
        },
        scale: {
          x: Number(meshRef.current.scale.x.toFixed(3)),
          y: Number(meshRef.current.scale.y.toFixed(3)),
          z: Number(meshRef.current.scale.z.toFixed(3)),
        },
      });

      lastUpdateTime.current = now;
      onUpdate();
    } catch (error) {
      console.error("Failed to update model transform:", error);
      toast.error("Failed to save model changes");
    }
  };

  const renderGeometry = () => {
    if (model.type === "primitive" && model.geometry) {
      const { type: geometryType } = model.geometry;
      const color = model.color || "#888888";

      switch (geometryType) {
        case "box":
          return (
            <>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial
                color={color}
                roughness={0.4}
                metalness={0.1}
                envMapIntensity={0.5}
              />
            </>
          );
        case "sphere":
          return (
            <>
              <sphereGeometry args={[0.5, 32, 32]} />
              <meshStandardMaterial
                color={color}
                roughness={0.3}
                metalness={0.2}
                envMapIntensity={0.5}
              />
            </>
          );
        case "cylinder":
          return (
            <>
              <cylinderGeometry args={[0.5, 0.5, 1, 32]} />
              <meshStandardMaterial
                color={color}
                roughness={0.4}
                metalness={0.1}
                envMapIntensity={0.5}
              />
            </>
          );
        case "cone":
          return (
            <>
              <coneGeometry args={[0.5, 1, 32]} />
              <meshStandardMaterial
                color={color}
                roughness={0.4}
                metalness={0.1}
                envMapIntensity={0.5}
              />
            </>
          );
        case "torus":
          return (
            <>
              <torusGeometry args={[0.5, 0.2, 16, 100]} />
              <meshStandardMaterial
                color={color}
                roughness={0.3}
                metalness={0.3}
                envMapIntensity={0.5}
              />
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
          document.body.style.cursor = isSelected ? "move" : "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
        }}
      >
        {renderGeometry()}
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
          size={0.8}
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
    console.log("Camera update from:", data.username);
  });

  useEffect(() => {
    if (initialCamera && camera) {
      camera.position.set(
        initialCamera.position.x,
        initialCamera.position.y,
        initialCamera.position.z
      );
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
      dampingFactor={0.05}
      minDistance={1}
      maxDistance={50}
      maxPolarAngle={Math.PI / 2}
      onChange={handleCameraChangeEvent}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
    />
  );
}

// Viewport Controls UI
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
  return (
    <TooltipProvider>
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
        {/* Placement Mode Indicator */}
        {isPlacingAnnotation && (
          <div className="bg-primary/90 backdrop-blur border border-primary rounded-lg p-3 mb-2">
            <div className="flex items-center gap-2 text-white">
              <Crosshair className="h-4 w-4" />
              <div className="flex-1">
                <p className="text-sm font-medium">Annotation Mode</p>
                <p className="text-xs opacity-90">
                  Click on any surface to place
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={onCancelPlacement}
                className="text-white hover:bg-white/20 h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
          </div>
        )}

        {/* View Controls */}
        <div className="flex flex-col gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="secondary"
                onClick={onResetCamera}
                className="bg-slate-800/90 hover:bg-slate-700 backdrop-blur border border-slate-600"
              >
                <Home className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Reset Camera</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="secondary"
                onClick={onFitToView}
                className="bg-slate-800/90 hover:bg-slate-700 backdrop-blur border border-slate-600"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Fit to View</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}

// Performance Monitor (Debug)
function PerformanceMonitor() {
  const [fps, setFps] = useState(60);

  useEffect(() => {
    let frameCount = 0;
    let startTime = Date.now();

    const updateFps = () => {
      frameCount++;
      const currentTime = Date.now();

      if (currentTime - startTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (currentTime - startTime)));
        frameCount = 0;
        startTime = currentTime;
      }

      requestAnimationFrame(updateFps);
    };

    const animationId = requestAnimationFrame(updateFps);
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="absolute bottom-4 left-4 z-10">
      <Badge
        variant={fps < 30 ? "destructive" : fps < 50 ? "secondary" : "default"}
        className="text-xs"
      >
        {fps} FPS
      </Badge>
    </div>
  );
}

// Main ThreeViewer Component
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

  const { createAnnotation, updateAnnotation, deleteAnnotation } =
    useAnnotationSync(
      project.id,
      (data) => {
        const transformedAnnotation = {
          id: data.annotation._id,
          projectId: data.annotation.projectId,
          modelId: data.annotation.modelId,
          userId: data.annotation.userId,
          username: data.annotation.username,
          text: data.annotation.text,
          position: data.annotation.position,
          attachmentType: data.annotation.attachmentType,
          style: data.annotation.style,
          color: data.annotation.color,
          visible: data.annotation.visible,
          createdAt: new Date(data.annotation.createdAt),
          updatedAt: new Date(data.annotation.updatedAt),
        };
        setAnnotations((prev) => [...prev, transformedAnnotation]);
      },
      (data) => {
        setAnnotations((prev) =>
          prev.map((ann) =>
            ann.id === data.annotationId ? { ...ann, ...data.updates } : ann
          )
        );
      },
      (data) => {
        setAnnotations((prev) =>
          prev.filter((ann) => ann.id !== data.annotationId)
        );
        if (selectedAnnotationId === data.annotationId) {
          setSelectedAnnotationId(null);
        }
      }
    );

  // Fetch annotations
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
      }
    };

    fetchAnnotations();
    const interval = setInterval(fetchAnnotations, 30000);
    return () => clearInterval(interval);
  }, [project.id]);

  // Handle cursor changes
  useEffect(() => {
    if (isPlacingAnnotation) {
      document.body.style.cursor = "crosshair";
    } else {
      document.body.style.cursor = "auto";
    }

    return () => {
      document.body.style.cursor = "auto";
    };
  }, [isPlacingAnnotation]);

  // Handle annotation click
  const handleAnnotationClick = (annotation: Annotation) => {
    setSelectedAnnotationId(
      selectedAnnotationId === annotation.id ? null : annotation.id
    );
  };

  // Camera controls
  const handleResetCamera = () => {
    setCameraState({
      position: { x: 5, y: 5, z: 10 },
      rotation: { x: 0, y: 0, z: 0 },
      target: { x: 0, y: 0, z: 0 },
      zoom: 1,
    });
  };

  const handleFitToView = () => {
    // Implementation would calculate bounds of all visible models
    toast.info("Fitting view to models...");
  };

  const handleCancelPlacement = () => {
    // This would be handled by parent component
    console.log("Cancel annotation placement");
  };

  // Error boundary
  useEffect(() => {
    if (!THREE.REVISION) {
      setError("Three.js failed to load");
      toast.error("3D Viewer Error", {
        description: "Failed to initialize 3D viewer",
      });
    }
  }, []);

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-slate-950">
        <div className="text-center text-red-400 max-w-md">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">3D Viewer Error</p>
          <p className="text-sm">{error}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 canvas-container">
      <Canvas
        ref={canvasRef}
        shadows
        gl={{
          antialias: true,
          alpha: false,
          preserveDrawingBuffer: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, 2]}
        camera={{
          position: [
            project.cameraState?.position.x || 5,
            project.cameraState?.position.y || 5,
            project.cameraState?.position.z || 10,
          ],
          fov: 50,
          near: 0.1,
          far: 1000,
        }}
      >
        <Suspense fallback={<LoadingScreen />}>
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

      {/* UI Overlays */}
      <ViewportControls
        onResetCamera={handleResetCamera}
        onFitToView={handleFitToView}
        isPlacingAnnotation={isPlacingAnnotation}
        onCancelPlacement={handleCancelPlacement}
      />

      {/* Performance Monitor (Debug) */}
      {process.env.NODE_ENV === "development" && <PerformanceMonitor />}
    </div>
  );
}

export default ThreeViewer;
