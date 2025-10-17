import { useRef, useState, useMemo } from "react";
import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { MapPin, MessageSquare } from "lucide-react";

import { Annotation } from "@/types/annotation.types";

/**
 * Annotation Marker Props
 */
interface AnnotationMarkerProps {
  annotation: Annotation;
  isSelected: boolean;
  onClick: () => void;
  distanceToCamera?: number;
}

/**
 * Enhanced Annotation Marker Component
 * 3D marker with improved visuals and responsive behavior
 */
export function AnnotationMarker({
  annotation,
  isSelected,
  onClick,
  distanceToCamera = 10,
}: AnnotationMarkerProps) {
  const markerRef = useRef<THREE.Group>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const { camera } = useThree();

  // Calculate scale based on distance to camera
  const scale = useMemo(() => {
    const baseScale = 1;
    const minScale = 0.5;
    const maxScale = 2;
    const scaleFactor = Math.max(
      minScale,
      Math.min(maxScale, baseScale * (15 / Math.max(distanceToCamera, 5)))
    );
    return scaleFactor;
  }, [distanceToCamera]);

  // Smooth floating animation
  useFrame((state) => {
    if (markerRef.current) {
      const time = state.clock.elapsedTime;
      const floatOffset = Math.sin(time * 2 + annotation.id.length) * 0.03;
      markerRef.current.position.y = annotation.position.y + floatOffset;

      // Scale based on distance
      const currentScale = hovered || isSelected ? scale * 1.2 : scale;
      markerRef.current.scale.setScalar(currentScale);
    }

    // Pulse effect for selected annotations
    if (pulseRef.current && isSelected) {
      const pulseScale = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.1;
      pulseRef.current.scale.setScalar(pulseScale);
    }
  });

  // Don't render if not visible
  if (!annotation.visible) {
    return null;
  }

  const color = annotation.color || "#ff6b6b";
  const isInteractive = hovered || isSelected;

  return (
    <group
      ref={markerRef}
      position={[
        annotation.position.x,
        annotation.position.y,
        annotation.position.z,
      ]}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
    >
      {/* Pulse Ring for Selected State */}
      {isSelected && (
        <mesh ref={pulseRef} position={[0, 0, 0]}>
          <ringGeometry args={[0.3, 0.35, 32]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Main Marker Sphere */}
      <mesh scale={1}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isInteractive ? 0.4 : 0.2}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>

      {/* Outer Glow Ring */}
      <mesh scale={1.5}>
        <ringGeometry args={[0.15, 0.18, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isInteractive ? 0.6 : 0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Connection Line to Ground */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={
              new Float32Array([
                0,
                0,
                0,
                0,
                Math.max(-annotation.position.y + 0.01, -10),
                0,
              ])
            }
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color={color}
          opacity={isInteractive ? 0.5 : 0.2}
          transparent
        />
      </line>

      {/* HTML Label */}
      <Html
        center
        distanceFactor={8}
        occlude
        style={{
          pointerEvents: "none",
          userSelect: "none",
          transition: "all 0.2s ease-out",
        }}
      >
        <AnnotationLabel
          annotation={annotation}
          isSelected={isSelected}
          isHovered={hovered}
          color={color}
          scale={scale}
        />
      </Html>
    </group>
  );
}

/**
 * Annotation Label Component
 * HTML overlay for annotation text and metadata
 */
function AnnotationLabel({
  annotation,
  isSelected,
  isHovered,
  color,
  scale,
}: {
  annotation: Annotation;
  isSelected: boolean;
  isHovered: boolean;
  color: string;
  scale: number;
}) {
  const isActive = isSelected || isHovered;
  const shouldShowFullText = isActive || annotation.text.length <= 30;
  const displayText = shouldShowFullText
    ? annotation.text
    : `${annotation.text.substring(0, 27)}...`;

  return (
    <div
      className={`annotation-label ${isActive ? "active" : ""}`}
      style={{
        transform: `translateY(-${40 * scale}px) scale(${Math.max(
          0.8,
          scale
        )})`,
        transformOrigin: "center bottom",
      }}
    >
      {/* Main Label */}
      <div
        className={`
          relative px-3 py-2 rounded-lg shadow-lg transition-all duration-200 ease-out
          ${isActive ? "scale-110" : "scale-100"}
        `}
        style={{
          backgroundColor: color,
          color: "white",
          fontSize: `${Math.max(11, 12 * scale)}px`,
          fontWeight: "500",
          whiteSpace: "nowrap",
          maxWidth: isActive ? "250px" : "150px",
          wordBreak: "break-word",
          whiteSpace: isActive ? "normal" : "nowrap",
          overflow: "hidden",
          textOverflow: isActive ? "visible" : "ellipsis",
          boxShadow: `0 4px 12px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)`,
        }}
      >
        {displayText}

        {/* Arrow pointing to marker */}
        <div
          className="absolute top-full left-1/2 transform -translate-x-1/2"
          style={{
            width: 0,
            height: 0,
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderTop: `6px solid ${color}`,
          }}
        />
      </div>

      {/* Extended Info Panel for Selected State */}
      {isSelected && (
        <div
          className="mt-2 p-2 bg-slate-800/90 backdrop-blur rounded-md border border-slate-600 text-white"
          style={{
            fontSize: `${10 * scale}px`,
            minWidth: "120px",
          }}
        >
          <div className="flex items-center gap-1 mb-1">
            <MessageSquare className="w-3 h-3" />
            <span className="text-xs font-medium">
              {typeof annotation.userId === "object"
                ? annotation.userId.username
                : annotation.username || "Unknown"}
            </span>
          </div>

          <div className="text-xs text-slate-300">
            {new Date(annotation.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>

          {/* Position Info */}
          <div className="text-xs text-slate-400 mt-1 font-mono">
            ({annotation.position.x.toFixed(1)},{" "}
            {annotation.position.y.toFixed(1)},{" "}
            {annotation.position.z.toFixed(1)})
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Annotation Markers Container
 * Renders all annotation markers with performance optimizations
 */
export function AnnotationMarkers({
  annotations,
  selectedAnnotationId,
  onAnnotationClick,
}: {
  annotations: Annotation[];
  selectedAnnotationId: string | null;
  onAnnotationClick: (annotation: Annotation) => void;
}) {
  const { camera } = useThree();

  // Calculate distances to camera for scaling
  const annotationsWithDistance = useMemo(() => {
    return annotations.map((annotation) => {
      const distance = camera.position.distanceTo(
        new THREE.Vector3(
          annotation.position.x,
          annotation.position.y,
          annotation.position.z
        )
      );
      return { annotation, distance };
    });
  }, [annotations, camera.position]);

  // Filter visible annotations
  const visibleAnnotations = annotationsWithDistance.filter(
    ({ annotation }) => annotation.visible
  );

  // Sort by distance (far to near) for proper rendering order
  const sortedAnnotations = useMemo(() => {
    return [...visibleAnnotations].sort((a, b) => b.distance - a.distance);
  }, [visibleAnnotations]);

  return (
    <group name="annotation-markers">
      {sortedAnnotations.map(({ annotation, distance }) => (
        <AnnotationMarker
          key={annotation.id}
          annotation={annotation}
          isSelected={selectedAnnotationId === annotation.id}
          onClick={() => onAnnotationClick(annotation)}
          distanceToCamera={distance}
        />
      ))}
    </group>
  );
}

/**
 * Annotation Overview Component
 * Shows a minimap or overview of all annotations
 */
export function AnnotationOverview({
  annotations,
  selectedAnnotationId,
  onAnnotationClick,
  visible = true,
}: {
  annotations: Annotation[];
  selectedAnnotationId: string | null;
  onAnnotationClick: (annotation: Annotation) => void;
  visible?: boolean;
}) {
  if (!visible || annotations.length === 0) return null;

  return (
    <Html
      position={[0, 5, 0]}
      center
      style={{
        pointerEvents: "auto",
      }}
    >
      <div className="bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg p-3 max-w-xs">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-white">
            Annotations ({annotations.filter((a) => a.visible).length})
          </span>
        </div>

        <div className="space-y-1 max-h-40 overflow-y-auto">
          {annotations
            .filter((annotation) => annotation.visible)
            .slice(0, 5)
            .map((annotation) => (
              <button
                key={annotation.id}
                onClick={() => onAnnotationClick(annotation)}
                className={`
                  w-full text-left p-2 rounded text-xs transition-colors
                  ${
                    selectedAnnotationId === annotation.id
                      ? "bg-primary/20 border border-primary/40"
                      : "hover:bg-slate-800/50"
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: annotation.color }}
                  />
                  <span className="text-white truncate">
                    {annotation.text.length > 30
                      ? `${annotation.text.substring(0, 27)}...`
                      : annotation.text}
                  </span>
                </div>
              </button>
            ))}

          {annotations.filter((a) => a.visible).length > 5 && (
            <div className="text-xs text-slate-400 text-center py-1">
              +{annotations.filter((a) => a.visible).length - 5} more
            </div>
          )}
        </div>
      </div>
    </Html>
  );
}

export default AnnotationMarkers;
