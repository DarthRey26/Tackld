import React, { useState, useEffect } from "react";
import ContractorMap from "@/components/contractor/ContractorMap";
import NewRequests from "@/components/contractor/NewRequests";
import ActiveRequest from "@/components/contractor/ActiveRequest";
import { useToast } from "@/components/ui/use-toast";
import io from 'socket.io-client';

const socket = io('http://localhost:3001');

const ContractorMain = () => {
  const { toast } = useToast();
  const [activeRequest, setActiveRequest] = useState(null);
  const [newRequests, setNewRequests] = useState([]);
  const contractorId = "contractor-1"; // In a real app, this would come from auth

  useEffect(() => {
    socket.on('service_request_update', (requests) => {
      const active = requests.find(r => r.contractorId === contractorId && r.status === 'accepted');
      const available = requests.filter(r => !r.contractorId && r.status === 'submitted');
      
      setActiveRequest(active || null);
      setNewRequests(available);
    });

    return () => {
      socket.off('service_request_update');
    };
  }, []);

  const handleAcceptRequest = (request) => {
    if (activeRequest) {
      toast({
        title: "Cannot Accept Request",
        description: "Please complete your current job before accepting a new one.",
        variant: "destructive"
      });
      return;
    }

    socket.emit('accept_request', { requestId: request.id, contractorId });
    toast({
      title: "Request Accepted",
      description: `You've accepted the service request at ${request.name}`,
    });
  };

  const handleUpdateProgress = (requestId, progress) => {
    socket.emit('update_progress', { requestId, progress, contractorId });
    
    if (progress === 100) {
      socket.emit('complete_request', { requestId, contractorId });
      toast({
        title: "Job Completed",
        description: "Great work! You can now accept new requests.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold mb-8 text-center text-blue-600">
        Contractor Dashboard
      </h1>
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          {activeRequest ? (
            <ActiveRequest
              request={activeRequest}
              onUpdateProgress={handleUpdateProgress}
            />
          ) : (
            <NewRequests
              requests={newRequests}
              onAccept={handleAcceptRequest}
            />
          )}
        </div>
        <div>
          <ContractorMap mapSrc={activeRequest?.mapSrc || newRequests[0]?.mapSrc} />
        </div>
      </div>
    </div>
  );
};

export default ContractorMain;