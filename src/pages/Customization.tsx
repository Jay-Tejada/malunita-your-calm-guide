import { CustomizationMenu } from '@/features/customization/CustomizationMenu';
import { Header } from '@/components/Header';
import { useEffect } from 'react';
import { useCustomizationStore } from '@/features/customization/useCustomizationStore';
import { useProfile } from '@/hooks/useProfile';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { hapticLight } from '@/utils/haptics';

export default function Customization() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const customization = useCustomizationStore();

  useEffect(() => {
    if (profile) {
      customization.loadFromProfile(profile);
    }
  }, [profile]);

  return (
    <div className="min-h-screen pb-20">
      <Header />
      <main className="container max-w-4xl mx-auto px-4 pt-20">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            hapticLight();
            navigate('/');
          }}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Customization Shop</h1>
          <p className="text-muted-foreground">
            Personalize Malunita with colors, accessories, and effects
          </p>
        </div>
        <CustomizationMenu />
      </main>
    </div>
  );
}
