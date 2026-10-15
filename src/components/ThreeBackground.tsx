"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

function MetallicRing() {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!ringRef.current) return;

    ringRef.current.rotation.x += delta * 0.12;
    ringRef.current.rotation.y += delta * 0.2;
    ringRef.current.rotation.z += delta * 0.08;
  });

  return (
    <Float
      speed={1.2}
      rotationIntensity={0.35}
      floatIntensity={0.7}
    >
      <mesh
        ref={ringRef}
        position={[2.1, 0.1, -1]}
        rotation={[0.5, 0.2, 0.4]}
      >
        <torusGeometry args={[1.7, 0.075, 24, 160]} />

        <meshStandardMaterial
          color="#cbd5e1"
          metalness={0.95}
          roughness={0.18}
          emissive="#475569"
          emissiveIntensity={0.18}
        />
      </mesh>
    </Float>
  );
}

function GlassSphere({
  position,
  size,
  color,
}: {
  position: [number, number, number];
  size: number;
  color: string;
}) {
  const sphereRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!sphereRef.current) return;

    sphereRef.current.rotation.x += delta * 0.25;
    sphereRef.current.rotation.y += delta * 0.35;
  });

  return (
    <Float
      speed={1.5}
      rotationIntensity={0.6}
      floatIntensity={1}
    >
      <mesh ref={sphereRef} position={position}>
        <sphereGeometry args={[size, 48, 48]} />

        <meshStandardMaterial
          color={color}
          metalness={0.65}
          roughness={0.12}
          transparent
          opacity={0.82}
          emissive={color}
          emissiveIntensity={0.12}
        />
      </mesh>
    </Float>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.45} />

      <directionalLight
        position={[4, 5, 6]}
        intensity={2}
        color="#ffffff"
      />

      <pointLight
        position={[-4, 2, 3]}
        intensity={12}
        distance={10}
        color="#94a3b8"
      />

      <pointLight
        position={[4, -2, 1]}
        intensity={8}
        distance={8}
        color="#64748b"
      />

      <MetallicRing />

      <GlassSphere
        position={[-2.4, 1.35, -1]}
        size={0.42}
        color="#e2e8f0"
      />

      <GlassSphere
        position={[0.5, 1.7, -1.5]}
        size={0.22}
        color="#94a3b8"
      />

      <GlassSphere
        position={[-1.2, -1.25, -0.5]}
        size={0.18}
        color="#cbd5e1"
      />

      <Sparkles
        count={55}
        scale={[10, 6, 5]}
        size={1.4}
        speed={0.25}
        color="#cbd5e1"
      />
    </>
  );
}

export default function ThreeBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      <Canvas
        camera={{
          position: [0, 0, 7],
          fov: 45,
        }}
        dpr={[1, 1.5]}
        gl={{
          alpha: true,
          antialias: true,
        }}
      >
        <Scene />
      </Canvas>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.35)_75%,rgba(0,0,0,0.82)_100%)]" />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#050505]/80" />
    </div>
  );
}
