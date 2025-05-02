import { useState, useEffect, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { KeyboardControls } from "@react-three/drei";
import { useAudio } from "./lib/stores/useAudio";
import { useAuth } from "./lib/stores/useAuth";
import { useGame, GamePhase } from "./lib/stores/useGame";
import AuthForm from "./components/auth/AuthForm";
import GameMenu from "./components/game/GameMenu";
import WorldView from "./components/game/WorldView";
import DogPanel from "./components/game/DogPanel";
import ResourcePanel from "./components/game/ResourcePanel";
import CombatArena from "./components/game/CombatArena";
import "@fontsource/inter";

// Define control keys for the game
const controls = [
  { name: "forward", keys: ["KeyW", "ArrowUp"] },
  { name: "backward", keys: ["KeyS", "ArrowDown"] },
  { name: "leftward", keys: ["KeyA", "ArrowLeft"] },
  { name: "rightward", keys: ["KeyD", "ArrowRight"] },
  { name: "action", keys: ["Space", "KeyE"] },
  { name: "menu", keys: ["Escape", "KeyM"] },
];

// Loading component
const Loading = () => (
  <div className="loading-screen">
    <div className="loading-content">
      <h2>Loading Sweet Dog...</h2>
      <div className="loading-paw-prints">
        <i className="fas fa-paw bounce"></i>
        <i className="fas fa-paw bounce"></i>
        <i className="fas fa-paw bounce"></i>
      </div>
    </div>
  </div>
);

// Sound Manager
const SoundManager = () => {
  const { setBackgroundMusic, toggleMute, isMuted } = useAudio();
  
  useEffect(() => {
    // Create and set up background music
    const bgMusic = new Audio("/sounds/background.mp3");
    bgMusic.loop = true;
    bgMusic.volume = 0.5;
    setBackgroundMusic(bgMusic);
    
    // Load other game sounds
    const hitSound = new Audio("/sounds/hit.mp3");
    const successSound = new Audio("/sounds/success.mp3");
    
    return () => {
      // Clean up
      bgMusic.pause();
      bgMusic.src = "";
    };
  }, []);
  
  return (
    <div className="sound-control">
      <button onClick={toggleMute} className="sound-button">
        {isMuted ? (
          <i className="fas fa-volume-mute"></i>
        ) : (
          <i className="fas fa-volume-up"></i>
        )}
      </button>
    </div>
  );
};

// Main App component
function App() {
  const { user, token, isLoading, checkAuthState } = useAuth();
  const { phase } = useGame();
  const [showCanvas, setShowCanvas] = useState(false);

  // Verify user token on component mount
  useEffect(() => {
    checkAuthState();
  }, [checkAuthState]);

  // Show the canvas once everything is loaded
  useEffect(() => {
    if (!isLoading) {
      setShowCanvas(true);
    }
  }, [isLoading]);
  
  if (isLoading) {
    return <Loading />;
  }

  // If not authenticated, show auth form
  if (!user || !token) {
    return <AuthForm />;
  }

  return (
    <div className="game-container">
      {showCanvas && (
        <KeyboardControls map={controls}>
          <ResourcePanel />
          
          {phase === "ready" && <GameMenu />}
          
          {phase === "playing" && (
            <>
              <Canvas
                shadows
                camera={{
                  position: [0, 10, 15],
                  fov: 45,
                  near: 0.1,
                  far: 1000
                }}
                gl={{
                  antialias: true,
                  powerPreference: "default"
                }}
              >
                <color attach="background" args={["#f8ceff"]} />
                <fog attach="fog" args={["#f8ceff", 30, 100]} />
                
                <Suspense fallback={null}>
                  <WorldView />
                </Suspense>
              </Canvas>
              
              <DogPanel />
            </>
          )}
          
          {phase === "ended" && (
            <CombatArena />
          )}

          <SoundManager />
        </KeyboardControls>
      )}
    </div>
  );
}

export default App;
