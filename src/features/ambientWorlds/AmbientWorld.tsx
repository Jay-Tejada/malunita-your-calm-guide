import { CozyRoom } from "./CozyRoom";
import { ForestClearing } from "./ForestClearing";
import { CrystalNebula } from "./CrystalNebula";
import { PastelMeadow } from "./PastelMeadow";
import { MinimalistStudio } from "./MinimalistStudio";
import { WorldId } from "./worldDefinitions";

interface AmbientWorldProps {
  worldId: WorldId;
}

export const AmbientWorld = ({ worldId }: AmbientWorldProps) => {
  const renderWorld = () => {
    switch (worldId) {
      case 'cozy-room':
        return <CozyRoom />;
      case 'forest-clearing':
        return <ForestClearing />;
      case 'crystal-nebula':
        return <CrystalNebula />;
      case 'pastel-meadow':
        return <PastelMeadow />;
      case 'minimalist-studio':
        return <MinimalistStudio />;
      default:
        return <CozyRoom />;
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {renderWorld()}
    </div>
  );
};
