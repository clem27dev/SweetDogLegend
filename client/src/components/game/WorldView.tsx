import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import { Princess } from '../models/Princess';
import { Dog } from '../models/Dog';
import * as THREE from 'three';

const WorldView = () => {
  // Reference to the player to update position
  const playerRef = useRef<THREE.Group>(null);
  
  // Get keyboard controls for movement
  const [, getKeys] = useKeyboardControls();
  
  // Handle player movement
  useFrame((state, delta) => {
    const { forward, backward, leftward, rightward } = getKeys();
    
    if (playerRef.current) {
      const player = playerRef.current;
      const speed = 5 * delta;
      
      // Calculate movement based on keys
      if (forward) {
        player.position.z -= speed;
      }
      if (backward) {
        player.position.z += speed;
      }
      if (leftward) {
        player.position.x -= speed;
      }
      if (rightward) {
        player.position.x += speed;
      }
      
      // Update camera to follow player
      state.camera.position.x = player.position.x;
      state.camera.position.z = player.position.z + 8;
      state.camera.lookAt(player.position.x, 0, player.position.z);
    }
  });
  
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1} 
        castShadow 
        shadow-mapSize={[1024, 1024]} 
      />
      
      {/* Ground/Terrain */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.5, 0]} 
        receiveShadow
      >
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#c9e6ca" />
      </mesh>
      
      {/* Princess */}
      <Princess position={[0, 0, -10]} scale={1} />
      
      {/* Player's Dog */}
      <Dog 
        ref={playerRef}
        position={[0, 0, 5]} 
        scale={1} 
        name="Player's Dog" 
        level={1} 
        isAdult={false}
        color="#a87e4e"
      />
      
      {/* Decorative elements */}
      <group position={[10, 0, 0]}>
        <mesh position={[0, 1, 0]} castShadow>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color="#f8a8d4" />
        </mesh>
      </group>
      
      <group position={[-10, 0, 0]}>
        <mesh position={[0, 1, 0]} castShadow>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color="#a8c7f8" />
        </mesh>
      </group>
    </>
  );
};

export default WorldView;