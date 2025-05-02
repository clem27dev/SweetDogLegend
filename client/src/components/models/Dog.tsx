import React, { useRef, forwardRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface DogProps {
  position?: [number, number, number];
  scale?: number;
  name?: string;
  level?: number;
  isAdult?: boolean;
  color?: string;
}

export const Dog = forwardRef<THREE.Group, DogProps>(({ 
  position = [0, 0, 0], 
  scale = 1,
  name = "Dog",
  level = 1,
  isAdult = false,
  color = "#a87e4e"
}, ref) => {
  const localRef = useRef<THREE.Group>(null);
  const groupRef = ref || localRef;
  
  // Animate the dog with a wagging tail and a bouncy walk
  useFrame((state) => {
    if (groupRef && 'current' in groupRef && groupRef.current) {
      // Wag the tail (applied to a child mesh within the group)
      const tail = groupRef.current.children.find(child => child.name === 'tail');
      if (tail) {
        (tail as THREE.Mesh).rotation.y = Math.sin(state.clock.elapsedTime * 4) * 0.5;
      }
      
      // Slightly bounce when walking
      if (!position[0] && !position[2]) { // Only animate if not controlled by player
        groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.05 + 0.05;
      }
    }
  });
  
  // Calculate size based on whether the dog is a puppy or adult
  const sizeMultiplier = isAdult ? 1 : 0.6;
  
  // Helper function to darken a color
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
  
  // Darker shade for ears, paws, etc.
  const darkColor = darkenColor(color, 40);
  
  return (
    <group 
      ref={groupRef as React.RefObject<THREE.Group>} 
      position={position} 
      scale={[scale * sizeMultiplier, scale * sizeMultiplier, scale * sizeMultiplier]}
    >
      {/* Body */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <capsuleGeometry args={[0.5, 1, 8, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Head */}
      <mesh position={[0, 0.9, 0.9]} castShadow>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Snout */}
      <mesh position={[0, 0.7, 1.3]} castShadow>
        <boxGeometry args={[0.3, 0.2, 0.4]} />
        <meshStandardMaterial color={darkColor} />
      </mesh>
      
      {/* Eyes */}
      <mesh position={[0.15, 1, 1.2]} castShadow>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="black" />
      </mesh>
      <mesh position={[-0.15, 1, 1.2]} castShadow>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="black" />
      </mesh>
      
      {/* Ears */}
      <mesh position={[0.35, 1.3, 0.8]} castShadow>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color={darkColor} />
      </mesh>
      <mesh position={[-0.35, 1.3, 0.8]} castShadow>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color={darkColor} />
      </mesh>
      
      {/* Legs */}
      <mesh position={[0.3, 0, 0.4]} castShadow>
        <capsuleGeometry args={[0.1, 0.5, 8, 8]} />
        <meshStandardMaterial color={darkColor} />
      </mesh>
      <mesh position={[-0.3, 0, 0.4]} castShadow>
        <capsuleGeometry args={[0.1, 0.5, 8, 8]} />
        <meshStandardMaterial color={darkColor} />
      </mesh>
      <mesh position={[0.3, 0, -0.4]} castShadow>
        <capsuleGeometry args={[0.1, 0.5, 8, 8]} />
        <meshStandardMaterial color={darkColor} />
      </mesh>
      <mesh position={[-0.3, 0, -0.4]} castShadow>
        <capsuleGeometry args={[0.1, 0.5, 8, 8]} />
        <meshStandardMaterial color={darkColor} />
      </mesh>
      
      {/* Tail */}
      <mesh name="tail" position={[0, 0.6, -0.8]} rotation={[0.5, 0, 0]} castShadow>
        <capsuleGeometry args={[0.08, 0.8, 8, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
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
    </group>
  );
});

export default Dog;