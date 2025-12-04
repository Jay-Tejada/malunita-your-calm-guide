import { LivingOrbV2 } from './LivingOrbV2';
import { IntentionLine } from './IntentionLine';

export function OrbWithIntention() {
  return (
    <div className="flex flex-col items-center gap-4">
      <LivingOrbV2 />
      <IntentionLine />
    </div>
  );
}
