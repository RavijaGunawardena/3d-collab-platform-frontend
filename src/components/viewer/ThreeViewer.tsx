import { useRef, useEffect, useState } from "react";
import { Canvas, useThree, ThreeEvent } from "@react-three/fiber";
import {
  OrbitControls,
  Grid,
  PerspectiveCamera,
  TransformControls,
} from "@react-three/drei";
import * as THREE from "three";
import { toast } from "sonner";

import { ProjectDisplay, CameraState, Vector3 } from "@/types/project.types";
import { Annotation } from "@/types/annotation.types";
import { useCameraSync, useAnnotationSync } from "@/hooks/useSocket";
import { projectService } from "@/services/projectService";
import { annotationService } from "@/services/annotationService";
import { AnnotationMarkers } from "@/components/viewer/AnnotationMarkers";

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
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <directionalLight position={[-10, -10, -5]} intensity={0.3} />

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
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#60a5fa" />
        </mesh>
      )}

      <AnnotationMarkers
        annotations={annotations}
        selectedAnnotationId={selectedAnnotationId}
        onAnnotationClick={onAnnotationClick}
      />
    </group>
  );
}

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
  const updateThrottle = 3000;

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

      lastUpdateTime.current = now;
      onUpdate();
    } catch (error) {
      console.error("Failed to update model transform:", error);
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

function CameraController({
  projectId,
  initialCamera,
}: {
  projectId: string;
  initialCamera?: CameraState;
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

  const handleCameraChange = () => {
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
  };

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.05}
      minDistance={2}
      maxDistance={50}
      maxPolarAngle={Math.PI / 2}
      onChange={handleCameraChange}
    />
  );
}

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

  const handleAnnotationClick = (annotation: Annotation) => {
    setSelectedAnnotationId(
      selectedAnnotationId === annotation.id ? null : annotation.id
    );
  };

  const handleModelUpdate = () => {
    // Trigger re-fetch in parent component
  };

  useEffect(() => {
    if (!THREE.REVISION) {
      setError("Three.js failed to load");
      toast.error("3D Viewer Error", {
        description: "Failed to initialize 3D viewer",
      });
    }

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
        <PerspectiveCamera
          makeDefault
          position={[
            project.cameraState?.position.x || 5,
            project.cameraState?.position.y || 5,
            project.cameraState?.position.z || 10,
          ]}
          fov={50}
        />

        <CameraController
          projectId={project.id}
          initialCamera={project.cameraState}
        />

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
