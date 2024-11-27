import React, { useState } from 'react';
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const PriceBidder = ({ minPrice = 50, maxPrice = 500, onBidSubmit }) => {
  const [bidAmount, setBidAmount] = useState([minPrice]);
  const { toast } = useToast();

  const handleBidSubmit = () => {
    onBidSubmit?.(bidAmount[0]);
    toast({
      title: "Bid Submitted",
      description: `Your bid of $${bidAmount[0]} has been submitted.`,
    });
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
        />
        <div className="text-center text-xl font-bold">
          ${bidAmount[0]}
        </div>
        <Button 
          onClick={handleBidSubmit}
          className="w-full"
        >
          Submit Bid
        </Button>
      </div>
    </div>
  );
};

export default PriceBidder;