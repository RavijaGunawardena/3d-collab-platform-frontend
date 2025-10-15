import { useRef, useState } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
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
}

/**
 * Annotation Marker Component
 * 3D marker that appears at annotation position
 */
export function AnnotationMarker({
  annotation,
  isSelected,
  onClick,
}: AnnotationMarkerProps) {
  const markerRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  // Gentle floating animation
  useFrame((state) => {
    if (markerRef.current) {
      markerRef.current.position.y =
        annotation.position.y + Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
  });

  if (!annotation.visible) {
    return null;
  }

  const color = annotation.color || "#ff6b6b";

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
      {/* Marker Sphere */}
      <mesh scale={hovered || isSelected ? 1.2 : 1}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered || isSelected ? 0.5 : 0.2}
        />
      </mesh>

      {/* HTML Label */}
      <Html
        center
        distanceFactor={10}
        style={{
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <div
          className={`transition-all ${
            hovered || isSelected ? "scale-110" : "scale-100"
          }`}
          style={{
            backgroundColor: color,
            color: "white",
            padding: "4px 8px",
            borderRadius: "6px",
            fontSize: "11px",
            fontWeight: "500",
            whiteSpace: "nowrap",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            transform: "translateY(-30px)",
            maxWidth: "150px",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {annotation.text}
        </div>
      </Html>

      {/* Connection Line to Ground */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            //   args={}
            attach="attributes-position"
            count={2}
            array={
              new Float32Array([0, 0, 0, 0, -annotation.position.y + 0.01, 0])
            }
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} opacity={0.3} transparent />
      </line>
    </group>
  );
}

/**
 * Annotation Markers Container
 * Renders all annotation markers in the scene
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
  return (
    <>
      {annotations.map((annotation) => (
        <AnnotationMarker
          key={annotation.id}
          annotation={annotation}
          isSelected={selectedAnnotationId === annotation.id}
          onClick={() => onAnnotationClick(annotation)}
        />
      ))}
    </>
  );
}

export default AnnotationMarkers;
