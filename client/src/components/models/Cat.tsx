import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CatProps {
  position?: [number, number, number];
  scale?: number;
  name?: string;
  level?: number;
  color?: string;
  isEvil?: boolean;
}

export const Cat = ({ 
  position = [0, 0, 0], 
  scale = 1,
  name = "Cat",
  level = 1,
  color = "#8f8f8f",
  isEvil = true
}: CatProps) => {
  const group = useRef<THREE.Group>(null);
  
  // Animate the cat with a swishing tail and evil glow if it's an evil cat
  useFrame((state) => {
    if (group.current) {
      // Swish the tail
      const tail = group.current.children.find(child => child.name === 'tail');
      if (tail) {
        (tail as THREE.Mesh).rotation.y = Math.sin(state.clock.elapsedTime * 3) * 0.7;
      }
      
      // Make evil cats slowly circle their position
      if (isEvil) {
        group.current.rotation.y += 0.005;
      }
    }
  });
  
  // Helper functions for color manipulation
  function darkenColor(color: string, amount: number): string {
    const hex = color.replace('#', '');
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    
    r = Math.max(0, r - amount);
    g = Math.max(0, g - amount);
    b = Math.max(0, b - amount);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
  
  function lightenColor(color: string, amount: number): string {
    const hex = color.replace('#', '');
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    
    r = Math.min(255, r + amount);
    g = Math.min(255, g + amount);
    b = Math.min(255, b + amount);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
  
  // Darker and lighter shades for details
  const darkColor = darkenColor(color, 30);
  const lightColor = lightenColor(color, 30);
  
  // Evil cats have red eyes and a dark aura
  const eyeColor = isEvil ? "#ff0000" : "#00ff00";
  
  return (
    <group 
      ref={group} 
      position={position} 
      scale={[scale, scale, scale]}
    >
      {/* Body */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <capsuleGeometry args={[0.4, 0.8, 8, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Head */}
      <mesh position={[0, 0.7, 0.7]} castShadow>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Ears */}
      <mesh position={[0.25, 1.1, 0.6]} rotation={[0, 0, 0.5]} castShadow>
        <coneGeometry args={[0.1, 0.3, 32]} />
        <meshStandardMaterial color={darkColor} />
      </mesh>
      <mesh position={[-0.25, 1.1, 0.6]} rotation={[0, 0, -0.5]} castShadow>
        <coneGeometry args={[0.1, 0.3, 32]} />
        <meshStandardMaterial color={darkColor} />
      </mesh>
      
      {/* Eyes */}
      <mesh position={[0.15, 0.8, 1]} castShadow>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial 
          color={eyeColor} 
          emissive={isEvil ? eyeColor : undefined}
          emissiveIntensity={isEvil ? 0.5 : 0}
        />
      </mesh>
      <mesh position={[-0.15, 0.8, 1]} castShadow>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial 
          color={eyeColor} 
          emissive={isEvil ? eyeColor : undefined}
          emissiveIntensity={isEvil ? 0.5 : 0}
        />
      </mesh>
      
      {/* Snout */}
      <mesh position={[0, 0.7, 1.05]} castShadow>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color={lightColor} />
      </mesh>
      
      {/* Whiskers */}
      <mesh position={[0.2, 0.7, 1.1]} rotation={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.005, 0.005, 0.4, 8]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[-0.2, 0.7, 1.1]} rotation={[0, -0.5, 0]} castShadow>
        <cylinderGeometry args={[0.005, 0.005, 0.4, 8]} />
        <meshStandardMaterial color="white" />
      </mesh>
      
      {/* Legs */}
      <mesh position={[0.2, 0, 0.3]} castShadow>
        <capsuleGeometry args={[0.07, 0.4, 8, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[-0.2, 0, 0.3]} castShadow>
        <capsuleGeometry args={[0.07, 0.4, 8, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0.2, 0, -0.3]} castShadow>
        <capsuleGeometry args={[0.07, 0.4, 8, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[-0.2, 0, -0.3]} castShadow>
        <capsuleGeometry args={[0.07, 0.4, 8, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Tail */}
      <mesh name="tail" position={[0, 0.4, -0.7]} rotation={[0.3, 0, 0]} castShadow>
        <capsuleGeometry args={[0.05, 1, 8, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Evil aura for evil cats */}
      {isEvil && (
        <mesh position={[0, 0.5, 0]} castShadow>
          <sphereGeometry args={[1.2, 16, 16]} />
          <meshStandardMaterial 
            color="#660000" 
            transparent={true} 
            opacity={0.15} 
            emissive="#ff0000"
            emissiveIntensity={0.1}
          />
        </mesh>
      )}
      
      {/* Level indicator */}
      <group position={[0, 1.5, 0]}>
        <mesh>
          <planeGeometry args={[0.6, 0.2]} />
          <meshBasicMaterial 
            color="#333333" 
            transparent={true} 
            opacity={0.7} 
          />
        </mesh>
        
        {/* Text is rendered as a simple plane since textGeometry requires extra setup */}
        <mesh position={[0, 0, 0.01]}>
          <planeGeometry args={[0.5, 0.15]} />
          <meshBasicMaterial color="white" transparent={true} opacity={0} />
        </mesh>
      </group>
      
      {/* Viking helmet for evil cats if they're Viking Rico's cats */}
      {isEvil && (
        <>
          <mesh position={[0, 1.1, 0.6]} castShadow>
            <cylinderGeometry args={[0.25, 0.35, 0.2, 8]} />
            <meshStandardMaterial color="#555555" metalness={0.7} roughness={0.3} />
          </mesh>
          
          <mesh position={[0.3, 1.3, 0.6]} rotation={[0, 0, 0.5]} castShadow>
            <coneGeometry args={[0.1, 0.3, 8]} />
            <meshStandardMaterial color="#555555" metalness={0.7} roughness={0.3} />
          </mesh>
          
          <mesh position={[-0.3, 1.3, 0.6]} rotation={[0, 0, -0.5]} castShadow>
            <coneGeometry args={[0.1, 0.3, 8]} />
            <meshStandardMaterial color="#555555" metalness={0.7} roughness={0.3} />
          </mesh>
        </>
      )}
    </group>
  );
};

export default Cat;