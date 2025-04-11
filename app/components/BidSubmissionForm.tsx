import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface BidSubmissionFormProps {
  onSubmit: (bid: { amount: number; remarks: string }) => void;
  onCancel: () => void;
}

export const BidSubmissionForm: React.FC<BidSubmissionFormProps> = ({ onSubmit, onCancel }) => {
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [remarks, setRemarks] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ amount: bidAmount, remarks });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-lg shadow-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Bid Amount</label>
          <input
            type="number"
            required
            min="0"
            value={bidAmount}
            onChange={(e) => setBidAmount(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Remarks (Optional)</label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={3}
            placeholder="Add any additional notes or remarks about your bid..."
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Submit Bid
          </button>
        </div>
      </form>
    </motion.div>
  );
}; 