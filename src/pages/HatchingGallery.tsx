import { HatchingGallery as HatchingGalleryComponent } from '@/components/HatchingGallery';
import { SimpleHeader } from '@/components/SimpleHeader';
import { BottomNav } from '@/components/BottomNav';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function HatchingGallery() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <div className="container max-w-4xl mx-auto px-4">
        <SimpleHeader title="Hatching Gallery" />
      </div>
      
      <div className="container max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6 md:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
        
        <HatchingGalleryComponent />
      </div>
      
      <BottomNav />
    </div>
  );
}
