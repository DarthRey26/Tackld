import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { bookingDataCleanup } from '@/utils/bookingDataCleanup';
import { Wrench, CheckCircle, AlertTriangle } from 'lucide-react';

const CleanupBookingData = () => {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const handleRunCleanup = async () => {
    setIsRunning(true);
    try {
      const results = await bookingDataCleanup.runFullCleanup();
      setLastResult(results);
      
      toast({
        title: "Cleanup Complete",
        description: `Updated ${results.stageConsistency.updatedCount || 0} bookings`,
      });
    } catch (error) {
      console.error('Cleanup error:', error);
      toast({
        title: "Cleanup Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="w-5 h-5" />
          Data Cleanup Tool
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          Fix booking stage inconsistencies and clean up expired data.
        </p>
        
        <Button 
          onClick={handleRunCleanup} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? "Running..." : "Run Cleanup"}
        </Button>
        
        {lastResult && (
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              {lastResult.stageConsistency.success ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-500" />
              )}
              <span>
                Stage Consistency: {lastResult.stageConsistency.success ? 'Fixed' : 'Failed'}
                {lastResult.stageConsistency.updatedCount > 0 && 
                  ` (${lastResult.stageConsistency.updatedCount} updated)`}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {lastResult.expiredBids.success ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-500" />
              )}
              <span>
                Expired Bids: {lastResult.expiredBids.success ? 'Cleaned' : 'Failed'}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CleanupBookingData;