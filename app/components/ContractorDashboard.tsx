import React, { useState, useEffect } from 'react';
import { BidSubmissionForm } from './BidSubmissionForm';
import { useTabNotification } from '../hooks/useTabNotification';

export const ContractorDashboard: React.FC = () => {
  const [currentTab, setCurrentTab] = useState('new');
  const [jobs, setJobs] = useState<any[]>([]);
  const [hasOngoingJobs, setHasOngoingJobs] = useState(false);

  useTabNotification(hasOngoingJobs, currentTab, 'ongoing');

  const handleBidSubmit = async (jobId: string, bidData: { amount: number; remarks: string }) => {
    // Simulate bid submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update job status
    setJobs(prevJobs => prevJobs.map(job => 
      job.id === jobId 
        ? { ...job, status: 'bidSubmitted', bidAmount: bidData.amount, remarks: bidData.remarks }
        : job
    ));

    // Simulate delay before moving to ongoing
    setTimeout(() => {
      setJobs(prevJobs => prevJobs.map(job =>
        job.id === jobId
          ? { ...job, status: 'ongoing' }
          : job
      ));
      setHasOngoingJobs(true);
    }, 5000);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex space-x-4 mb-4">
        <TabButton
          active={currentTab === 'new'}
          onClick={() => setCurrentTab('new')}
          label="New Jobs"
        />
        <TabButton
          active={currentTab === 'ongoing'}
          onClick={() => setCurrentTab('ongoing')}
          label="Ongoing Jobs"
          notification={hasOngoingJobs && currentTab !== 'ongoing'}
        />
      </div>

      {/* Rest of the dashboard content */}
    </div>
  );
};

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  label: string;
  notification?: boolean;
}> = ({ active, onClick, label, notification }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg ${
      active 
        ? 'bg-blue-600 text-white' 
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    } ${
      notification 
        ? 'animate-pulse border-2 border-red-500' 
        : ''
    }`}
  >
    {label}
  </button>
); 