import { useRef, useEffect, useState } from "react";
import { Canvas, useThree, useFrame, ThreeEvent } from "@react-three/fiber";
import {
  OrbitControls,
  Grid,
  PerspectiveCamera,
  TransformControls,
} from "@react-three/drei";
import * as THREE from "three";
import { toast } from "sonner";

import { Project, CameraState, Vector3 } from "@/types/project.types";
import { Annotation } from "@/types/annotation.types";
import { useCameraSync } from "@/hooks/useSocket";
import { projectService } from "@/services/projectService";
import { annotationService } from "@/services/annotationService";
import { AnnotationMarkers } from "@/components/viewer/AnnotationMarkers";

/**
 * Scene Component
 * Main 3D scene with models and annotations
 */
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
  project: Project;
  selectedModelId: string | null;
  onModelUpdate: () => void;
  isPlacingAnnotation: boolean;
  onAnnotationPlaced: (position: Vector3) => void;
  annotations: Annotation[];
  selectedAnnotationId: string | null;
  onAnnotationClick: (annotation: Annotation) => void;
}) {
  /**
   * Handle click on scene for annotation placement
   */
  const handleSceneClick = (event: ThreeEvent<MouseEvent>) => {
    if (!isPlacingAnnotation) return;

    event.stopPropagation();

    // Get the intersection point
    const point = event.point;

    onAnnotationPlaced({
      x: point.x,
      y: point.y,
      z: point.z,
    });
  };

  return (
    <group onClick={handleSceneClick}>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <directionalLight position={[-10, -10, -5]} intensity={0.3} />

      {/* Grid Helper */}
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

      {/* Render Models */}
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
        // Default cube if no models
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#60a5fa" />
        </mesh>
      )}

      {/* Annotation Markers */}
      <AnnotationMarkers
        annotations={annotations}
        selectedAnnotationId={selectedAnnotationId}
        onAnnotationClick={onAnnotationClick}
      />
    </group>
  );
}

/**
 * Model 3D Component
 * Renders individual 3D models with transform controls
 */
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
  //   const { camera, gl } = useThree();

  useEffect(() => {
    if (meshRef.current) {
      // Apply transformations
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

  /**
   * Handle transform end - save to backend
   */
  const handleTransformEnd = async () => {
    if (!meshRef.current || !model._id) return;

    try {
      await projectService.updateModel(projectId, model._id, {
        position: {
          x: meshRef.current.position.x,
          y: meshRef.current.position.y,
          z: meshRef.current.position.z,
        },
        rotation: {
          x: meshRef.current.rotation.x,
          y: meshRef.current.rotation.y,
          z: meshRef.current.rotation.z,
        },
        scale: {
          x: meshRef.current.scale.x,
          y: meshRef.current.scale.y,
          z: meshRef.current.scale.z,
        },
      });

      onUpdate();
    } catch (error) {
      console.error("Failed to update model transform:", error);
    }
  };

  // Render geometry based on type
  const renderGeometry = () => {
    if (model.type === "primitive" && model.geometry) {
      const { type: geometryType } = model.geometry;
      const color = model.color || "#888888";

      switch (geometryType) {
        case "box":
          return (
            <>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color={color} />
            </>
          );
        case "sphere":
          return (
            <>
              <sphereGeometry args={[0.5, 32, 32]} />
              <meshStandardMaterial color={color} />
            </>
          );
        case "cylinder":
          return (
            <>
              <cylinderGeometry args={[0.5, 0.5, 1, 32]} />
              <meshStandardMaterial color={color} />
            </>
          );
        case "cone":
          return (
            <>
              <coneGeometry args={[0.5, 1, 32]} />
              <meshStandardMaterial color={color} />
            </>
          );
        case "torus":
          return (
            <>
              <torusGeometry args={[0.5, 0.2, 16, 100]} />
              <meshStandardMaterial color={color} />
            </>
          );
        default:
          return null;
      }
    }

    // Placeholder for uploaded models
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
      <mesh ref={meshRef} castShadow>
        {renderGeometry()}
      </mesh>

      {/* Transform Controls (only for selected model) */}
      {isSelected && meshRef.current && (
        <TransformControls
          ref={transformRef}
          object={meshRef.current}
          mode="translate"
          onObjectChange={handleTransformEnd}
        />
      )}
    </group>
  );
}

/**
 * Camera Controller
 * Manages camera synchronization
 */
function CameraController({
  projectId,
  initialCamera,
}: {
  projectId: string;
  initialCamera?: CameraState;
}) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const lastUpdateTime = useRef(0);
  const updateThrottle = 100; // Update every 100ms

  const { updateCamera } = useCameraSync(projectId, (data) => {
    // Receive camera updates from other users
    // For now, we won't force camera changes (optional feature)
    console.log("Camera update from:", data.username);
  });

  // Set initial camera position
  useEffect(() => {
    if (initialCamera && camera) {
      camera.position.set(
        initialCamera.position.x,
        initialCamera.position.y,
        initialCamera.position.z
      );
    }
  }, [initialCamera, camera]);

  // Throttled camera update broadcast
  useFrame(() => {
    const now = Date.now();
    if (now - lastUpdateTime.current > updateThrottle) {
      if (controlsRef.current) {
        const target = controlsRef.current.target;
        updateCamera({
          position: {
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z,
          },
          rotation: {
            x: camera.rotation.x,
            y: camera.rotation.y,
            z: camera.rotation.z,
          },
          target: {
            x: target.x,
            y: target.y,
            z: target.z,
          },
          zoom: 1,
        });
      }
      lastUpdateTime.current = now;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.05}
      minDistance={2}
      maxDistance={50}
      maxPolarAngle={Math.PI / 2}
    />
  );
}

/**
 * Three Viewer Props
 */
interface ThreeViewerProps {
  project: Project;
  selectedModelId: string | null;
  isPlacingAnnotation: boolean;
  onAnnotationPlaced: (position: Vector3) => void;
}

/**
 * Three Viewer Component
 * Main 3D canvas with Three.js rendering
 */
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

  /**
   * Fetch annotations
   */
  useEffect(() => {
    const fetchAnnotations = async () => {
      try {
        const data = await annotationService.getAnnotationsByProject(
          project.id
        );
        setAnnotations(data);
      } catch (error) {
        console.error("Failed to fetch annotations:", error);
      }
    };

    fetchAnnotations();

    // Refresh annotations every 5 seconds
    const interval = setInterval(fetchAnnotations, 5000);
    return () => clearInterval(interval);
  }, [project.id]);

  /**
   * Handle annotation click
   */
  const handleAnnotationClick = (annotation: Annotation) => {
    setSelectedAnnotationId(
      selectedAnnotationId === annotation.id ? null : annotation.id
    );
  };

  /**
   * Handle model update
   */
  const handleModelUpdate = () => {
    // Trigger re-fetch in parent component
  };

  useEffect(() => {
    // Check WebGL support
    if (!THREE.REVISION) {
      setError("Three.js failed to load");
      toast.error("3D Viewer Error", {
        description: "Failed to initialize 3D viewer",
      });
    }

    // Change cursor when in placing mode
    if (isPlacingAnnotation) {
      document.body.style.cursor = "crosshair";
    } else {
      document.body.style.cursor = "auto";
    }

    return () => {
      document.body.style.cursor = "auto";
    };
  }, [isPlacingAnnotation]);

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-slate-950">
        <div className="text-center text-red-400">
          <p className="text-lg font-medium">3D Viewer Error</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 canvas-container">
      <Canvas
        shadows
        gl={{
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: true,
        }}
        dpr={[1, 2]}
      >
        {/* Camera */}
        <PerspectiveCamera
          makeDefault
          position={[
            project.cameraState?.position.x || 5,
            project.cameraState?.position.y || 5,
            project.cameraState?.position.z || 10,
          ]}
          fov={50}
        />

        {/* Camera Controls */}
        <CameraController
          projectId={project.id}
          initialCamera={project.cameraState}
        />

        {/* Scene */}
        <Scene
          project={project}
          selectedModelId={selectedModelId}
          onModelUpdate={handleModelUpdate}
          isPlacingAnnotation={isPlacingAnnotation}
          onAnnotationPlaced={onAnnotationPlaced}
          annotations={annotations}
          selectedAnnotationId={selectedAnnotationId}
          onAnnotationClick={handleAnnotationClick}
        />
      </Canvas>
    </div>
  );
}

export default ThreeViewer;
