import React, { useEffect, useState } from 'react';
import { useAuth } from '../../lib/stores/useAuth';
import { useResources } from '../../lib/stores/useResources';

const ResourcePanel = () => {
  const { user } = useAuth();
  const { resources, fetchResources } = useResources();
  
  // Set up automatic resource fetching
  useEffect(() => {
    if (user) {
      // Initial fetch
      fetchResources();
      
      // Set up interval for passive resource generation updates
      const intervalId = setInterval(() => {
        fetchResources();
      }, 60000); // Check for resource updates every minute
      
      return () => clearInterval(intervalId);
    }
  }, [user, fetchResources]);
  
  if (!user || !resources) {
    return null;
  }
  
  return (
    <div className="resource-panel">
      <div className="resource plk">
        <span className="resource-icon">🍖</span>
        <span className="resource-value">{resources.plk}</span>
      </div>
      
      <div className="resource lor">
        <span className="resource-icon">🧱</span>
        <span className="resource-value">{resources.lor}</span>
      </div>
      
      <div className="resource gems">
        <span className="resource-icon">💎</span>
        <span className="resource-value">{resources.gems}</span>
      </div>
      
      <div className="player-level">
        <span className="level-label">Level</span>
        <span className="level-value">{user.level}</span>
      </div>
    </div>
  );
};

export default ResourcePanel;