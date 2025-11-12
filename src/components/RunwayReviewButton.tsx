import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";
import { RunwayReview } from "@/components/RunwayReview";

export const RunwayReviewButton = () => {
  const [showReview, setShowReview] = useState(false);

  return (
    <>
      <Button
        onClick={() => setShowReview(true)}
        className="fixed bottom-6 right-6 rounded-full h-14 px-6 shadow-lg hover:shadow-xl transition-all"
        size="lg"
      >
        <Rocket className="w-5 h-5 mr-2" />
        Review My Day
      </Button>

      {showReview && <RunwayReview onClose={() => setShowReview(false)} />}
    </>
  );
};
