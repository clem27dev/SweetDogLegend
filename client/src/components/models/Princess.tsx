import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PrincessProps {
  position?: [number, number, number];
  scale?: number;
}

export const Princess = ({ 
  position = [0, 0, 0], 
  scale = 1 
}: PrincessProps) => {
  const group = useRef<THREE.Group>(null);
  
  // Animate the princess with a gentle floating effect
  useFrame((state) => {
    if (group.current) {
      group.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.1 + 0.1;
      group.current.rotation.y += 0.01;
    }
  });
  
  return (
    <group ref={group} position={position} scale={[scale, scale, scale]}>
      {/* Body */}
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.5, 1.2, 16]} />
        <meshStandardMaterial color="#f8c8ff" />
      </mesh>
      
      {/* Head */}
      <mesh position={[0, 1.9, 0]} castShadow>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial color="#ffdfea" />
      </mesh>
      
      {/* Crown */}
      <mesh position={[0, 2.3, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.4, 0.3, 8]} />
        <meshStandardMaterial color="#ffd700" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 2.5, 0]} castShadow>
        <coneGeometry args={[0.2, 0.4, 32]} />
        <meshStandardMaterial color="#ffd700" metalness={0.7} roughness={0.3} />
      </mesh>
      
      {/* Arms */}
      <mesh position={[0.5, 1.1, 0]} castShadow>
        <capsuleGeometry args={[0.1, 0.7, 8, 8]} />
        <meshStandardMaterial color="#f8c8ff" />
      </mesh>
      <mesh position={[-0.5, 1.1, 0]} castShadow>
        <capsuleGeometry args={[0.1, 0.7, 8, 8]} />
        <meshStandardMaterial color="#f8c8ff" />
      </mesh>
      
      {/* Dress bottom */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <coneGeometry args={[0.7, 0.7, 16]} />
        <meshStandardMaterial color="#f8c8ff" />
      </mesh>
      
      {/* Magic wand */}
      <mesh position={[0.7, 1.3, 0.2]} rotation={[0, 0, -Math.PI / 4]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.8, 8]} />
        <meshStandardMaterial color="#6a0dad" />
      </mesh>
      <mesh position={[1.0, 1.6, 0.2]} castShadow>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial 
          color="#ff00ff" 
          emissive="#ff00ff"
          emissiveIntensity={0.5}
        />
      </mesh>
      
      {/* Magical aura */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <sphereGeometry args={[1.5, 16, 16]} />
        <meshStandardMaterial 
          color="#ffccff" 
          transparent={true} 
          opacity={0.2} 
          emissive="#ffccff"
          emissiveIntensity={0.2}
        />
      </mesh>
    </group>
  );
};

export default Princess;