import { CustomizationMenu } from '@/features/customization/CustomizationMenu';
import { Header } from '@/components/Header';
import { useEffect } from 'react';
import { useCustomizationStore } from '@/features/customization/useCustomizationStore';
import { useProfile } from '@/hooks/useProfile';

export default function Customization() {
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
