import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { getGroupDetails, GroupDetails, settleUpWithUser } from '../utils/api.util';

interface SettleUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  currentUserId: string;
  onSettled: () => void;
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

const modalVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: 'spring', duration: 0.5, bounce: 0.3 }
  },
  exit: { 
    opacity: 0, 
    y: 50, 
    scale: 0.95,
    transition: { duration: 0.2 }
  }
};

interface SettlementOption {
  userId: string;
  username: string;
  amount: number;
}

const SettleUpModal: React.FC<SettleUpModalProps> = ({ 
  isOpen, 
  onClose,
  groupId,
  currentUserId,
  onSettled
}) => {
  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [settlementOptions, setSettlementOptions] = useState<SettlementOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  useEffect(() => {
    if (isOpen && groupId) {
      fetchGroupDetails();
    }
  }, [isOpen, groupId]);
  
  const fetchGroupDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getGroupDetails(groupId);
      if (result.success && result.data) {
        setGroup(result.data);
        
        // Prepare settlement options based on individual balances
        const options: SettlementOption[] = [];
        
        result.data.individualBalances.forEach(balance => {
          if (balance.amount !== 0) {
            options.push({
              userId: balance.userId || '', // Adjust based on actual structure
              username: balance.username || '', // Adjust based on actual structure
              amount: Math.abs(balance.amount)
            });
          }
        });
        
        setSettlementOptions(options);
        
        // Set default selected user if there's only one option
        if (options.length === 1) {
          setSelectedUser(options[0].userId);
        }
      } else {
        setError(result.error || 'Failed to fetch group details');
      }
    } catch (error: any) {
      setError('An unexpected error occurred');
      console.error('Error fetching group details:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSettleUp = async () => {
    if (!selectedUser) {
      toast.error('Please select a user to settle up with');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const selectedOption = settlementOptions.find(option => option.userId === selectedUser);
      if (!selectedOption) {
        throw new Error('Selected user information not found');
      }
      
      const result = await settleUpWithUser(groupId, selectedUser, selectedOption.amount);
      
      if (result.success) {
        toast.success(result.message || 'Settlement recorded successfully!');
        onSettled();
        onClose();
      } else {
        toast.error(result.error || 'Failed to record settlement');
      }
    } catch (error: any) {
      console.error('Error settling up:', error);
      toast.error('Failed to settle up. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getSelectedUserAmount = () => {
    const selected = settlementOptions.find(option => option.userId === selectedUser);
    return selected ? selected.amount : 0;
  };
  
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog
          as={motion.div}
          static
          open={isOpen}
          onClose={onClose}
          className="fixed inset-0 z-50 overflow-y-auto"
        >
          {/* Backdrop */}
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-50"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          />

          <div className="flex items-center justify-center min-h-screen px-4">
            {/* Modal */}
            <Dialog.Panel
              as={motion.div}
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden z-10"
            >
              <div className="border-b border-gray-200">
                <div className="px-6 py-4 flex items-center justify-between">
                  <Dialog.Title className="text-xl font-semibold text-gray-900">
                    Settle Up
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6">
                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin"></div>
                  </div>
                ) : error ? (
                  <div className="py-8 px-4 text-center">
                    <p className="text-red-500 mb-4">{error}</p>
                    <button 
                      onClick={onClose}
                      className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                ) : settlementOptions.length === 0 ? (
                  <div className="py-8 px-4 text-center">
                    <p className="text-gray-700 mb-4">There are no balances to settle in this group.</p>
                    <button 
                      onClick={onClose}
                      className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select a person to settle with
                      </label>
                      <select
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                      >
                        <option value="">Select a person</option>
                        {settlementOptions.map((option) => (
                          <option key={option.userId} value={option.userId}>
                            {option.username} - ₹{option.amount.toFixed(2)}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {selectedUser && (
                      <div className="bg-gray-50 p-4 rounded-lg mb-6">
                        <div className="text-sm text-gray-600 mb-2">Settlement Summary</div>
                        <div className="text-lg font-semibold">
                          You will record a payment of ₹{getSelectedUserAmount().toFixed(2)}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSettleUp}
                        disabled={!selectedUser || isSubmitting}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Recording Payment...' : 'Record Payment'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default SettleUpModal; 