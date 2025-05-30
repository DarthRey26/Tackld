import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import routes from "@/routes/routes";

// Updated contractors list with isRecommended flags
const contractors = [
  {
    id: 1,
    name: "Contractor A",
    experience: "5 years",
    rating: 4.9,
    isTacklersChoice: true,
    isRecommended: false,
    bidprice: "$95",
  },
  {
    id: 2,
    name: "Contractor B",
    experience: "3 years",
    rating: 4.5,
    isSaver: true,
    isRecommended: false,
    bidprice: "$70",
  },
  {
    id: 3,
    name: "Contractor C",
    experience: "10 years",
    rating: 4.9,
    isRecommended: false,
    bidprice: "$70",
  },
  {
    id: 4,
    name: "Contractor D",
    experience: "3 years",
    rating: 3,
    isRecommended: false,
    bidprice: "$55",
  },
];

const JobDetail = () => {
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [selectedContractor, setSelectedContractor] = useState(null);

  useEffect(() => {
    const jobData = JSON.parse(sessionStorage.getItem("latestJob"));
    if (jobData) {
      setJob(jobData);
    }
  }, []);

  const handleConfirmContractor = () => {
    sessionStorage.removeItem("isJobInProgress");
    sessionStorage.removeItem("latestJob");
    navigate(routes.customerMain);
  };

  const handleContractorSelect = (contractor) => {
    if (selectedContractor?.id === contractor.id) {
      setSelectedContractor(null);
    } else {
      setSelectedContractor(contractor);
    }
  };

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        <p>Loading job details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-3xl mx-auto shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-[#283579]">
            Job Details
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-10">
          {/* Job Info Section */}
          <div className="space-y-6 text-sm text-gray-800">
            <div className="flex justify-between">
              <span className="font-semibold">Name:</span>
              <span>{job.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Phone:</span>
              <span>{job.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Address:</span>
              <span>{job.address}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Description:</span>
              <span>{job.description || "No description provided"}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Date:</span>
              <span>{new Date(job.date).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Contractor type</span>
              <span>Recommended</span>
            </div>
            {job.image ? (
              <img
                src={job.image}
                alt="Uploaded job"
                className="w-full max-w-md h-auto mt-4 rounded-md border border-gray-200"
              />
            ) : (
              <div className="w-full mt-4 rounded-md border border-gray-200 h-48 flex justify-center items-center text-gray-400">
                No image available
              </div>
            )}
          </div>

          {/* Contractor Selection */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4 text-[#283579]">
              Available Contractors
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {contractors
                .filter((contractor) =>
                  job.contractorType === "recommended"
                    ? contractor.isRecommended
                    : !contractor.isRecommended
                )
                .map((contractor) => {
                  const isSelected = selectedContractor?.id === contractor.id;
                  const isDisabled = selectedContractor && !isSelected;

                  return (
                    <Card
                      key={contractor.id}
                      onClick={() => handleContractorSelect(contractor)}
                      className={`relative cursor-pointer transition-all border-2 rounded-lg ${
                        isSelected
                          ? "border-[#283579] ring-2 ring-blue-400"
                          : contractor.isTacklersChoice
                          ? "border-green-600"
                          : "border-gray-200 hover:border-gray-300"
                      } ${isDisabled ? "opacity-50" : ""}`}
                    >
                      {/* Badges */}
                      <div className="absolute top-2 right-2 space-y-2">
                        {contractor.isTacklersChoice && (
                          <div className="bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded shadow-sm">
                            Tackler’s Choice
                          </div>
                        )}
                        {/* {contractor.isSaver && (
                          <div className="bg-yellow-500 text-white text-xs font-semibold px-2 py-1 rounded shadow-sm">
                            💰 Saver
                          </div>
                        )} */}
                        {contractor.isRecommended && (
                          <div className="bg-purple-500 text-white text-xs font-semibold px-2 py-1 rounded shadow-sm">
                            🌟 Recommended
                          </div>
                        )}
                      </div>

                      <CardContent className="p-4 space-y-1">
                        <p className="font-medium text-gray-900">
                          {contractor.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {contractor.experience} experience
                        </p>
                        <p className="text-sm text-gray-600">
                          ⭐ {contractor.rating} / 5
                        </p>
                        <p className="text-sm text-gray-600 font-semibold">
                          Bid price: {contractor.bidprice}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>

            {selectedContractor && (
              <p className="mt-3 text-sm text-[#283579] font-medium">
                Selected: {selectedContractor.name}
              </p>
            )}
          </div>

          <div className="flex justify-between flex-wrap gap-3 pt-6">
            <Button
              variant="outline"
              onClick={() => navigate(routes.customerMain)}
            >
              Back
            </Button>

            {selectedContractor && (
              <Button
                className="bg-[#283579] hover:bg-blue-600 text-white"
                onClick={handleConfirmContractor}
              >
                Confirm Contractor
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JobDetail;
