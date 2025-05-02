import React, { useEffect } from 'react';
import { useAuth } from '../../lib/stores/useAuth';
import { useResources } from '../../lib/stores/useResources';

const ResourcePanel: React.FC = () => {
  const { user } = useAuth();
  const { resources, fetchResources } = useResources();
  
  // Fetch resources when component mounts
  useEffect(() => {
    if (user) {
      fetchResources();
    }
  }, [user, fetchResources]);
  
  // If no user or resources, don't render anything
  if (!user || !resources) {
    return null;
  }
  
  return (
    <div className="resource-panel">
      <div className="resource">
        <div className="resource-icon">🍖</div>
        <div className="resource-value">{resources.plk}</div>
      </div>
      
      <div className="resource">
        <div className="resource-icon">🏠</div>
        <div className="resource-value">{resources.lor}</div>
      </div>
      
      <div className="resource">
        <div className="resource-icon">💎</div>
        <div className="resource-value">{resources.gems}</div>
      </div>
      
      <div className="player-level">
        <div className="level-label">Niveau:</div>
        <div className="level-value">{user.level || 1}</div>
      </div>
    </div>
  );
};

export default ResourcePanel;