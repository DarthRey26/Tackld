
import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import ContractorMap from "@/components/contractor/ContractorMap";
import JobListing from "@/components/contractor/JobListing";
import OngoingJob from "@/components/contractor/OngoingJob";
import JobHistory from "@/components/contractor/JobHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Star, Clock } from 'lucide-react';

// Dummy data
const initialLocations = [
  {
    id: 1,
    name: "ION Orchard",
    service: "Air conditioning repair",
    date: "12 November 2024",
    phone: "123-456-7890",
    address: "#B4-06",
    hours: "5 minutes ago",
    minPrice: 100,
    maxPrice: 300,
    image: "https://example.com/location1.jpg",
    mapSrc: "https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d15955.140648154062!2d103.8319512!3d1.3039288!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x996bdb092f510665!2sION%20Orchard!5e0!3m2!1sen!2ssg!4v1670008616430!5m2!1sen!2ssg",
  },
  {
    id: 2,
    name: "Plaza Singapura",
    service: "Plumbing",
    date: "12 November 2024",
    phone: "123-456-7890",
    address: "#B1-07",
    hours: "12 minutes ago",
    minPrice: 180,
    maxPrice: 350,
    mapSrc:
      "https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d15955.162152516255!2d103.8452356!3d1.3005317!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x73f8899801be03cf!2sPlaza%20Singapura!5e0!3m2!1sen!2ssg!4v1670051991669!5m2!1sen!2ssg",
  },
  {
    id: 3,
    name: "200 Hougang Ave",
    service: "Plumbing",
    date: "12 November 2024",
    phone: "123-456-7890",
    address: "#13-06",
    hours: "13 minutes ago",
    minPrice: 150,
    maxPrice: 280,
    mapSrc:
      "https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d15955.140648154062!2d103.8319512!3d1.3039288!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x996bdb092f510665!2sION%20Orchard!5e0!3m2!1sen!2ssg!4v1670008616430!5m2!1sen!2ssg",
  },
  {
    id: 4,
    name: "OCBC Centre",
    service: "Electrical",
    date: "12 November 2024",
    phone: "123-456-7890",
    address: "Level 7",
    hours: "16 minutes ago",
    minPrice: 200,
    maxPrice: 400,
    mapSrc:
      "https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d15955.162152516255!2d103.8452356!3d1.3005317!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x73f8899801be03cf!2sPlaza%20Singapura!5e0!3m2!1sen!2ssg!4v1670051991669!5m2!1sen!2ssg",
  },
  {
    id: 5,
    name: "Bugis Junction",
    service: "Air conditioning repair",
    date: "12 November 2024",
    phone: "123-456-7890",
    address: "#01-06",
    hours: "20 minutes ago",
    minPrice: 120,
    maxPrice: 250,
    mapSrc:
      "https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d15955.140648154062!2d103.8319512!3d1.3039288!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x996bdb092f510665!2sION%20Orchard!5e0!3m2!1sen!2ssg!4v1670008616430!5m2!1sen!2ssg",
  },
];

// Sample completed jobs
const completedJobsData = [
  {
    id: 101,
    name: "Raffles City",
    service: "Electrical repair",
    date: "5 November 2024",
    completedDate: "5 November 2024",
    price: 220,
    rating: 5,
    feedback: "Great service, fixed our issue quickly and professionally.",
    notes: "Replaced faulty circuit breaker and checked all electrical connections.",
    mapSrc: "https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d15955.140648154062!2d103.8319512!3d1.3039288!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x996bdb092f510665!2sION%20Orchard!5e0!3m2!1sen!2ssg!4v1670008616430!5m2!1sen!2ssg",
  },
  {
    id: 102,
    name: "Vivocity",
    service: "Plumbing",
    date: "28 October 2024",
    completedDate: "28 October 2024",
    price: 175,
    rating: 4,
    feedback: "Solved our leaking issue effectively.",
    additionalParts: [
      { name: "Water pipe fitting", price: 25 },
      { name: "Valve replacement", price: 30 }
    ],
    mapSrc: "https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d15955.162152516255!2d103.8452356!3d1.3005317!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x73f8899801be03cf!2sPlaza%20Singapura!5e0!3m2!1sen!2ssg!4v1670051991669!5m2!1sen!2ssg",
  }
];

const ContractorMain = () => {
  const { toast } = useToast();
  const [availableJobs, setAvailableJobs] = useState([]);
  const [activeJob, setActiveJob] = useState(null);
  const [completedJobs, setCompletedJobs] = useState([]);
  const [currentTab, setCurrentTab] = useState("available");
  const [mapSrc, setMapSrc] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);
  const [biddedJobs, setBiddedJobs] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [averageRating, setAverageRating] = useState(0);

  // Load initial data
  useEffect(() => {
    // Load from localStorage if available
    const storedActiveJob = localStorage.getItem('activeJob');
    const storedCompletedJobs = localStorage.getItem('completedJobs');
    const storedBids = localStorage.getItem('biddedJobs');
    const storedWalletBalance = localStorage.getItem('contractorWalletBalance');
    
    if (storedActiveJob) {
      const parsedJob = JSON.parse(storedActiveJob);
      setActiveJob(parsedJob);
      setMapSrc(parsedJob.mapSrc);
      setCurrentTab("active");
    } else {
      setAvailableJobs(initialLocations);
      setMapSrc(initialLocations[0]?.mapSrc || "");
    }
    
    if (storedCompletedJobs) {
      const parsedJobs = JSON.parse(storedCompletedJobs);
      setCompletedJobs(parsedJobs);
      
      // Calculate total earnings and average rating
      const earnings = parsedJobs.reduce((sum, job) => {
        const partsCost = job.additionalParts ? 
          job.additionalParts.reduce((total, part) => total + Number(part.price), 0) : 0;
        return sum + Number(job.price) + partsCost;
      }, 0);
      setTotalEarnings(earnings);
      
      const totalRating = parsedJobs.reduce((sum, job) => sum + (job.rating || 5), 0);
      setAverageRating(parsedJobs.length > 0 ? (totalRating / parsedJobs.length).toFixed(1) : "N/A");
    } else {
      setCompletedJobs(completedJobsData);
      
      // Initialize with sample data
      const earnings = completedJobsData.reduce((sum, job) => {
        const partsCost = job.additionalParts ? 
          job.additionalParts.reduce((total, part) => total + Number(part.price), 0) : 0;
        return sum + Number(job.price) + partsCost;
      }, 0);
      setTotalEarnings(earnings);
      
      const totalRating = completedJobsData.reduce((sum, job) => sum + (job.rating || 5), 0);
      setAverageRating(completedJobsData.length > 0 ? (totalRating / completedJobsData.length).toFixed(1) : "N/A");
    }
    
    if (storedBids) {
      setBiddedJobs(JSON.parse(storedBids));
    }
    
    if (storedWalletBalance) {
      setWalletBalance(parseFloat(storedWalletBalance));
    } else {
      // Initialize with sample earnings data
      const initialBalance = completedJobsData.reduce((sum, job) => sum + Number(job.price), 0);
      setWalletBalance(initialBalance);
      localStorage.setItem('contractorWalletBalance', initialBalance.toString());
    }
  }, []);

  // Save data to localStorage when it changes
  useEffect(() => {
    if (activeJob) {
      localStorage.setItem('activeJob', JSON.stringify(activeJob));
    } else {
      localStorage.removeItem('activeJob');
    }
    
    localStorage.setItem('completedJobs', JSON.stringify(completedJobs));
  }, [activeJob, completedJobs]);

  const handleAcceptJob = (job) => {
    if (activeJob) {
      toast({
        title: "Cannot Accept Job",
        description: "You already have an active job. Please complete it first.",
        variant: "destructive"
      });
      return;
    }

    setActiveJob(job);
    setAvailableJobs(availableJobs.filter(j => j.id !== job.id));
    setCurrentTab("active");
    setMapSrc(job.mapSrc);
  };

  const handleCompleteJob = (job) => {
    const jobTotal = Number(job.price) + (job.additionalParts ? 
      job.additionalParts.reduce((sum, part) => sum + Number(part.price), 0) : 0);
    
    const completedJob = {
      ...job,
      completedDate: new Date().toLocaleDateString(),
      totalPaid: jobTotal
    };
    
    setCompletedJobs([completedJob, ...completedJobs]);
    setActiveJob(null);
    setCurrentTab("completed");
    
    // Update total earnings and wallet balance
    const newTotalEarnings = totalEarnings + jobTotal;
    setTotalEarnings(newTotalEarnings);
    
    const newWalletBalance = walletBalance + jobTotal;
    setWalletBalance(newWalletBalance);
    localStorage.setItem('contractorWalletBalance', newWalletBalance.toString());
    
    toast({
      title: "Job Completed",
      description: "The job has been successfully completed and payment has been received.",
    });
  };

  const handleCancelJob = () => {
    // Return job to available jobs
    if (activeJob) {
      setAvailableJobs([activeJob, ...availableJobs]);
      setActiveJob(null);
      setCurrentTab("available");
      setMapSrc(initialLocations[0]?.mapSrc || "");
    }
  };

  const handleTabChange = (value) => {
    setCurrentTab(value);
    
    // Update map source based on selected tab
    if (value === "active" && activeJob) {
      setMapSrc(activeJob.mapSrc);
    } else if (value === "available" && availableJobs.length > 0) {
      setMapSrc(availableJobs[0].mapSrc);
    } else if (value === "completed" && completedJobs.length > 0) {
      setMapSrc(completedJobs[0].mapSrc);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold mb-8 text-center text-blue-600">
        Contractor Dashboard
      </h1>
      
      {/* Contractor Stats */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-green-50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-full">
                <Wallet className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Wallet Balance</p>
                <p className="text-2xl font-bold text-green-600">${walletBalance.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-blue-50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Completed Jobs</p>
                <p className="text-2xl font-bold text-blue-600">{completedJobs.length}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-yellow-50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="bg-yellow-100 p-3 rounded-full">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Average Rating</p>
                <p className="text-2xl font-bold text-yellow-600">{averageRating}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="available" className="flex items-center gap-2">
                Available Jobs
                {availableJobs.length > 0 && (
                  <Badge className="bg-blue-500 text-white">{availableJobs.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="active" disabled={!activeJob}>
                Current Job
              </TabsTrigger>
              <TabsTrigger value="completed">
                History
              </TabsTrigger>
            </TabsList>
            <TabsContent value="available" className="mt-4">
              <JobListing 
                requests={availableJobs} 
                onAccept={handleAcceptJob}
                biddedJobs={biddedJobs}
              />
            </TabsContent>
            <TabsContent value="active" className="mt-4">
              {activeJob ? (
                <OngoingJob 
                  job={activeJob} 
                  onComplete={handleCompleteJob}
                  onCancel={handleCancelJob}
                />
              ) : (
                <div className="text-center py-10 bg-white rounded-lg border border-gray-200">
                  <p className="text-gray-500">You don't have any active jobs.</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="completed" className="mt-4">
              <JobHistory completedJobs={completedJobs} />
            </TabsContent>
          </Tabs>
        </div>
        <div>
          <ContractorMap mapSrc={mapSrc} />
        </div>
      </div>
    </div>
  );
};

export default ContractorMain;
