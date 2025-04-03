
import React, { useState } from 'react';
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const PriceBidder = ({ minPrice = 50, maxPrice = 500, onSubmit, onAccept }) => {
  const [bidAmount, setBidAmount] = useState([minPrice]);
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleBidSubmit = () => {
    onSubmit?.(bidAmount[0]);
    setIsSubmitted(true);
    toast({
      title: "Bid Submitted",
      description: `Your bid of $${bidAmount[0]} has been submitted.`,
    });
  };

  const handleAccept = () => {
    onAccept?.();
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-background">
      <h3 className="text-lg font-semibold">Set Your Price</h3>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Min: ${minPrice}</span>
          <span>Max: ${maxPrice}</span>
        </div>
        <Slider
          value={bidAmount}
          onValueChange={setBidAmount}
          max={maxPrice}
          min={minPrice}
          step={5}
          disabled={isSubmitted}
        />
        <div className="text-center text-xl font-bold">
          ${bidAmount[0]}
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <Button 
            onClick={handleBidSubmit}
            disabled={isSubmitted}
            className="w-full"
          >
            Submit Bid
          </Button>
          
          <Button 
            onClick={handleAccept}
            disabled={!isSubmitted}
            className="w-full bg-green-500 hover:bg-green-600"
          >
            Accept Job
          </Button>
        </div>
        
        {isSubmitted && (
          <p className="text-xs text-gray-500 text-center mt-2">
            After accepting, please wait for customer confirmation.
          </p>
        )}
      </div>
    </div>
  );
};

export default PriceBidder;
