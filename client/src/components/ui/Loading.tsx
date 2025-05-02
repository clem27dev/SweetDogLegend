import React from 'react';

const Loading: React.FC = () => {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <h2>Chargement du monde de Sweet Dog...</h2>
        <div className="loading-paw-prints">
          <span className="bounce">🐾</span>
          <span className="bounce">🐾</span>
          <span className="bounce">🐾</span>
        </div>
      </div>
    </div>
  );
};

export default Loading;