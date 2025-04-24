import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Clock,
  DollarSign,
  Wrench,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import PriceBidder from "@/components/PriceBidder";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const JobListing = ({ requests, onAccept, biddedJobs = [] }) => {
  const { toast } = useToast();
  const [selectedJob, setSelectedJob] = useState(null);
  const [proposedPrice, setProposedPrice] = useState(0);
  const [jobDetail, setJobDetail] = useState(null);

  const handleBidSubmit = (price) => {
    setProposedPrice(price);

    const bid = {
      jobId: selectedJob.id,
      price: price,
      timestamp: new Date().toISOString(),
    };

    const storedBids = JSON.parse(localStorage.getItem("biddedJobs") || "[]");
    const updatedBids = [...storedBids, bid];
    localStorage.setItem("biddedJobs", JSON.stringify(updatedBids));

    toast({
      title: "Bid Submitted",
      description: `Your bid of $${price} has been submitted for the job at ${selectedJob.name}.`,
    });
  };

  const handleAccept = () => {
    if (!selectedJob) return;

    if (proposedPrice === 0) {
      toast({
        title: "Price Required",
        description: "Please propose a price before accepting the job.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Processing Your Request",
      description: "Waiting for customer confirmation...",
    });

    // Simulate customer acceptance after 5-second delay
    setTimeout(() => {
      onAccept({ ...selectedJob, price: proposedPrice });
      setSelectedJob(null);

      // Remove from bidded jobs in localStorage
      const storedBids = JSON.parse(localStorage.getItem("biddedJobs") || "[]");
      const updatedBids = storedBids.filter(
        (bid) => bid.jobId !== selectedJob.id
      );
      localStorage.setItem("biddedJobs", JSON.stringify(updatedBids));

      toast({
        title: "Job Accepted",
        description: `Customer has accepted your bid of $${proposedPrice}!`,
        variant: "success",
      });
    }, 500);
  };

  const checkIfBidded = (jobId) => {
    const storedBids = JSON.parse(localStorage.getItem("biddedJobs") || "[]");
    return storedBids.find((bid) => bid.jobId === jobId);
  };

  const getBidAmount = (jobId) => {
    const storedBids = JSON.parse(localStorage.getItem("biddedJobs") || "[]");
    const bid = storedBids.find((bid) => bid.jobId === jobId);
    return bid ? bid.price : null;
  };

  const viewJobDetail = (job) => {
    setJobDetail(job);
  };

  return (
    <>
      <Card className="bg-white shadow-lg">
        <CardHeader className="bg-blue-50">
          <CardTitle className="text-xl font-bold text-blue-600 flex justify-between items-center">
            <span>Available Jobs</span>
            {biddedJobs.length > 0 && (
              <Badge
                variant="outline"
                className="bg-yellow-100 text-yellow-700 border-yellow-300"
              >
                {biddedJobs.length} Pending Bids
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4 max-h-[400px] overflow-auto">
            {requests.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                No available jobs at the moment.
              </p>
            ) : (
              requests.map((request) => {
                const hasBid = checkIfBidded(request.id);
                const bidAmount = getBidAmount(request.id);

                return (
                  <Card
                    key={request.id}
                    className={`p-4 hover:shadow-md transition-shadow border ${
                      hasBid
                        ? "border-yellow-300 bg-yellow-50"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {request.service}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4 text-blue-500" />
                            <span>{request.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>Posted: {request.hours}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <DollarSign className="h-4 w-4" />
                            <span>
                              Budget: ${request.minPrice} - ${request.maxPrice}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                            <Wrench className="h-4 w-4" />
                            <span>Service type: {request.service}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>Preferred date: {request.date}</span>
                          </div>
                          {hasBid && (
                            <div className="mt-2">
                              <Badge
                                variant="outline"
                                className="bg-yellow-100 text-yellow-700"
                              >
                                Your bid: ${bidAmount}
                              </Badge>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewJobDetail(request)}
                          >
                            View Details
                          </Button>
                          {!hasBid && (
                            <Button
                              size="sm"
                              onClick={() => setSelectedJob(request)}
                            >
                              Place Bid
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Place Your Bid</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <PriceBidder onSubmit={handleBidSubmit} onAccept={handleAccept} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!jobDetail} onOpenChange={() => setJobDetail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Job Details</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {jobDetail && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{jobDetail.service}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{jobDetail.name}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium">Budget Range</h4>
                    <p className="text-sm mt-1 text-green-600">
                      ${jobDetail.minPrice} - ${jobDetail.maxPrice}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">Preferred Date</h4>
                    <p className="text-sm mt-1">{jobDetail.date}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="font-medium">Job Description</h4>
                  <p className="text-sm mt-1">
                    {jobDetail.description ||
                      `The customer has requested professional ${jobDetail.service} services at the specified location. Please review the details and submit your bid if you are available to provide this service.`}
                  </p>
                </div>

                <div className="mt-4">
                  <h4 className="font-medium">Special Requirements</h4>
                  <p className="text-sm mt-1">
                    {jobDetail.requirements ||
                      `No special requirements specified. Standard ${jobDetail.service} service is requested.`}
                  </p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setJobDetail(null)}>
              Close
            </Button>
            {!checkIfBidded(jobDetail?.id) && (
              <Button
                onClick={() => {
                  setSelectedJob(jobDetail);
                  setJobDetail(null);
                }}
              >
                Place Bid
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default JobListing;
