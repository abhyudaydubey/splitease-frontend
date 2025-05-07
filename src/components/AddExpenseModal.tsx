import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { createExpense, updateExpense } from '../utils/api.util';

interface ExpenseMember {
  id: string;
  username: string;
  amount?: number;
  ratio?: number;
  isIncluded: boolean;
}

type SplitMethod = 'Equal' | 'Custom' | 'Ratio';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupMembers: { id: string; username: string }[];
  currentUserId: string;
  onExpenseAdded: () => void;
  isEditing?: boolean;
  existingExpenseId?: string;
  existingExpenseData?: {
    description: string;
    amount: string;
    paidById: string;
    splits: {
      userId: string;
      share: number;
    }[];
  };
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

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ 
  isOpen, 
  onClose, 
  groupId,
  groupMembers,
  currentUserId,
  onExpenseAdded,
  isEditing = false,
  existingExpenseId,
  existingExpenseData
}) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paidById, setPaidById] = useState(currentUserId);
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('Equal');
  const [members, setMembers] = useState<ExpenseMember[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  
  // Initialize members from group members
  useEffect(() => {
    if (isOpen && groupMembers.length > 0) {
      const initialMembers = groupMembers.map(member => ({
        id: member.id,
        username: member.username,
        isIncluded: true
      }));
      setMembers(initialMembers);
    }
  }, [isOpen, groupMembers]);
  
  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setDescription('');
      setAmount('');
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setPaidById(currentUserId);
      setSplitMethod('Equal');
      setMembers([]);
      setStep(1);
    }
  }, [isOpen, currentUserId]);
  
  // Calculate and update splits when amount or split method changes
  useEffect(() => {
    if (amount && members.length > 0) {
      updateSplitAmounts();
    }
  }, [amount, splitMethod, members.filter(m => m.isIncluded).length]);
  
  // Initialize with existing data if editing
  useEffect(() => {
    if (isOpen && isEditing && existingExpenseData) {
      setDescription(existingExpenseData.description);
      setAmount(existingExpenseData.amount);
      setPaidById(existingExpenseData.paidById);
      
      // Determine split method and initialize member data based on existing splits
      if (existingExpenseData.splits) {
        // For simplicity, we'll use Custom splitting for editing
        setSplitMethod('Custom');
        
        if (groupMembers.length > 0) {
          const initialMembers = groupMembers.map(member => {
            const existingSplit = existingExpenseData.splits.find(
              split => split.userId === member.id
            );
            
            return {
              id: member.id,
              username: member.username,
              amount: existingSplit ? existingSplit.share : 0,
              ratio: 1,
              isIncluded: !!existingSplit
            };
          });
          
          setMembers(initialMembers);
        }
      }
    }
  }, [isOpen, isEditing, existingExpenseData, groupMembers]);
  
  const updateSplitAmounts = () => {
    const numericAmount = parseFloat(amount) || 0;
    const includedMembers = members.filter(m => m.isIncluded);
    
    if (includedMembers.length === 0) return;
    
    setMembers(prevMembers => {
      return prevMembers.map(member => {
        if (!member.isIncluded) {
          return { ...member, amount: 0, ratio: 0 };
        }
        
        switch (splitMethod) {
          case 'Equal':
            return {
              ...member,
              amount: parseFloat((numericAmount / includedMembers.length).toFixed(2)),
              ratio: 1
            };
          case 'Ratio':
            // Keep existing ratios but update amount based on ratio
            const ratio = member.ratio || 1;
            const totalRatios = includedMembers.reduce((sum, m) => sum + (m.ratio || 1), 0);
            return {
              ...member,
              ratio,
              amount: parseFloat(((ratio / totalRatios) * numericAmount).toFixed(2))
            };
          case 'Custom':
            // Keep existing amounts if set, otherwise distribute equally
            const existingAmount = member.amount;
            return {
              ...member,
              amount: existingAmount !== undefined ? existingAmount : parseFloat((numericAmount / includedMembers.length).toFixed(2)),
              ratio: 1
            };
          default:
            return member;
        }
      });
    });
  };
  
  const toggleMemberInclusion = (memberId: string) => {
    setMembers(prevMembers =>
      prevMembers.map(member =>
        member.id === memberId
          ? { ...member, isIncluded: !member.isIncluded }
          : member
      )
    );
  };
  
  const updateMemberAmount = (memberId: string, newAmount: string) => {
    const numericAmount = parseFloat(newAmount) || 0;
    
    setMembers(prevMembers =>
      prevMembers.map(member =>
        member.id === memberId
          ? { 
              ...member, 
              amount: numericAmount
            }
          : member
      )
    );
  };
  
  const updateMemberRatio = (memberId: string, newRatio: string) => {
    const numericRatio = parseInt(newRatio) || 1;
    
    setMembers(prevMembers => {
      const updatedMembers = prevMembers.map(member =>
        member.id === memberId
          ? { ...member, ratio: numericRatio }
          : member
      );
      
      // Recalculate amounts based on new ratio distribution
      const includedMembers = updatedMembers.filter(m => m.isIncluded);
      const totalRatios = includedMembers.reduce((sum, m) => sum + (m.ratio || 1), 0);
      const totalAmount = parseFloat(amount) || 0;
      
      return updatedMembers.map(member => {
        if (!member.isIncluded) return member;
        
        const memberRatio = member.ratio || 1;
        return {
          ...member,
          amount: parseFloat(((memberRatio / totalRatios) * totalAmount).toFixed(2))
        };
      });
    });
  };
  
  const handleSubmit = async () => {
    // Validate form
    if (!description.trim()) {
      toast.error('Please enter a description');
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (!paidById) {
      toast.error('Please select who paid');
      return;
    }
    
    const includedMembers = members.filter(m => m.isIncluded);
    if (includedMembers.length === 0) {
      toast.error('Please include at least one member in the split');
      return;
    }
    
    // For custom amounts, validate that the sum equals the total
    if (splitMethod === 'Custom') {
      const totalSplit = includedMembers.reduce((sum, member) => sum + (member.amount || 0), 0);
      const totalAmount = parseFloat(amount);
      
      if (Math.abs(totalSplit - totalAmount) > 0.01) {
        toast.error(`Split amounts total ${totalSplit.toFixed(2)}, but expense total is ${totalAmount.toFixed(2)}`);
        return;
      }
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare data for API based on split method
      let expenseData: any = {
        description,
        amount: parseFloat(amount),
        groupId,
        paidById
      };

      if (splitMethod === 'Equal') {
        expenseData.splittingType = 'Equal';
        // If not all members are included, add participantIds
        if (includedMembers.length !== members.length) {
          expenseData.participantIds = includedMembers.map(m => m.id);
        }
      } else if (splitMethod === 'Ratio') {
        expenseData.splittingType = 'Ratio';
        expenseData.ratios = includedMembers.map(m => ({
          userId: m.id,
          ratio: m.ratio || 1
        }));
      } else if (splitMethod === 'Custom') {
        expenseData.splittingType = 'Custom';
        expenseData.splits = includedMembers.map(m => ({
          userId: m.id,
          share: m.amount
        }));
      }
      
      let result;
      
      if (isEditing && existingExpenseId) {
        // Update existing expense
        result = await updateExpense(existingExpenseId, expenseData);
        if (result.success) {
          toast.success('Expense updated successfully!');
        } else {
          toast.error(result.error || 'Failed to update expense');
        }
      } else {
        // Create new expense
        result = await createExpense(expenseData);
        if (result.success) {
          toast.success('Expense added successfully!');
        } else {
          toast.error(result.error || 'Failed to add expense');
        }
      }
      
      if (result.success) {
        onExpenseAdded();
        onClose();
      }
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'adding'} expense:`, error);
      toast.error(`Failed to ${isEditing ? 'update' : 'add'} expense`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const validateAndGoToStep2 = () => {
    if (!description.trim()) {
      toast.error('Please enter a description');
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (!paidById) {
      toast.error('Please select who paid');
      return;
    }
    
    setStep(2);
  };
  
  const goBack = () => {
    setStep(1);
  };
  
  // Calculate remaining amount for custom splits
  const getRemainingAmount = () => {
    const totalAmount = parseFloat(amount) || 0;
    const allocatedAmount = members
      .filter(m => m.isIncluded)
      .reduce((sum, member) => sum + (member.amount || 0), 0);
    
    return parseFloat((totalAmount - allocatedAmount).toFixed(2));
  };
  
  // Get payer name
  const getPayerName = () => {
    const payer = groupMembers.find(m => m.id === paidById);
    return payer ? payer.username : 'Unknown';
  };
  
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
              className="w-full max-w-lg bg-white rounded-lg shadow-xl overflow-hidden z-10"
            >
              <div className="border-b border-gray-200">
                <div className="px-6 py-4 flex items-center justify-between">
                  <Dialog.Title className="text-xl font-semibold text-gray-900">
                    {isEditing 
                      ? (step === 1 ? 'Edit Expense' : 'Edit Split Details')
                      : (step === 1 ? 'Add Expense' : 'Split Details')
                    }
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

              {step === 1 ? (
                /* Step 1: Basic Expense Details */
                <div className="p-6">
                  {/* Description */}
                  <div className="mb-5">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      id="description"
                      placeholder="What was the expense for?"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    />
                  </div>

                  {/* Amount */}
                  <div className="mb-5">
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                      Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-gray-500">₹</span>
                      <input
                        type="number"
                        id="amount"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full p-3 pl-8 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                      />
                    </div>
                  </div>

                  {/* Date */}
                  <div className="mb-5">
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      id="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    />
                  </div>

                  {/* Paid By */}
                  <div className="mb-5">
                    <label htmlFor="paidBy" className="block text-sm font-medium text-gray-700 mb-1">
                      Paid by
                    </label>
                    <select
                      id="paidBy"
                      value={paidById}
                      onChange={(e) => setPaidById(e.target.value)}
                      className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    >
                      {groupMembers.map(member => (
                        <option key={member.id} value={member.id}>
                          {member.username} {member.id === currentUserId ? '(you)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Next Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={validateAndGoToStep2}
                      className="py-3 px-6 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Next: Split Details
                    </button>
                  </div>
                </div>
              ) : (
                /* Step 2: Split Details */
                <div className="p-6">
                  {/* Expense Summary */}
                  <div className="mb-5 p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Expense</div>
                    <div className="font-medium text-gray-900">{description}</div>
                    <div className="flex justify-between mt-2">
                      <div>
                        <div className="text-sm text-gray-500">Amount</div>
                        <div className="font-medium text-gray-900">₹{parseFloat(amount || '0').toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Paid by</div>
                        <div className="font-medium text-gray-900">{getPayerName()}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Date</div>
                        <div className="font-medium text-gray-900">{date}</div>
                      </div>
                    </div>
                  </div>

                  {/* Split Method */}
                  <div className="mb-5">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Split Method
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setSplitMethod('Equal')}
                        className={`p-3 text-center rounded-lg border ${splitMethod === 'Equal' 
                          ? 'border-gray-800 bg-gray-100' 
                          : 'border-gray-300 hover:bg-gray-50'}`}
                      >
                        <div className="text-sm font-medium">Equal</div>
                      </button>
                      <button
                        onClick={() => setSplitMethod('Custom')}
                        className={`p-3 text-center rounded-lg border ${splitMethod === 'Custom' 
                          ? 'border-gray-800 bg-gray-100' 
                          : 'border-gray-300 hover:bg-gray-50'}`}
                      >
                        <div className="text-sm font-medium">Unequal</div>
                      </button>
                      <button
                        onClick={() => setSplitMethod('Ratio')}
                        className={`p-3 text-center rounded-lg border ${splitMethod === 'Ratio' 
                          ? 'border-gray-800 bg-gray-100' 
                          : 'border-gray-300 hover:bg-gray-50'}`}
                      >
                        <div className="text-sm font-medium">Ratio</div>
                      </button>
                    </div>
                  </div>

                  {/* Split Details */}
                  <div className="mb-5">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Splits
                      </label>
                      {splitMethod === 'Custom' && (
                        <div className={`text-sm font-medium ${getRemainingAmount() === 0 
                          ? 'text-green-600' 
                          : 'text-red-600'}`}>
                          Remaining: ₹{getRemainingAmount()}
                        </div>
                      )}
                    </div>
                    
                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-200">
                      {members.map(member => (
                        <div key={member.id} className="p-3 flex items-center">
                          {/* Include Checkbox */}
                          <div className="mr-3">
                            <input
                              type="checkbox"
                              id={`include-${member.id}`}
                              checked={member.isIncluded}
                              onChange={() => toggleMemberInclusion(member.id)}
                              className="h-4 w-4 rounded border-gray-300 text-gray-800 focus:ring-gray-500"
                            />
                          </div>
                          
                          {/* Member Info */}
                          <label 
                            htmlFor={`include-${member.id}`}
                            className={`flex-1 ${!member.isIncluded ? 'text-gray-400' : ''}`}
                          >
                            <div className="font-medium">{member.username}</div>
                            <div className="text-xs text-gray-500">@{member.username}</div>
                          </label>
                          
                          {/* Split Input */}
                          {member.isIncluded && (
                            <div className="w-24">
                              {splitMethod === 'Equal' && (
                                <div className="text-right font-medium">
                                  ₹{member.amount?.toFixed(2)}
                                </div>
                              )}
                              
                              {splitMethod === 'Custom' && (
                                <div className="relative">
                                  <span className="absolute left-2 top-2.5 text-gray-500 text-xs">₹</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={member.amount || ''}
                                    onChange={(e) => updateMemberAmount(member.id, e.target.value)}
                                    className="w-full py-2 px-6 text-right text-sm rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400"
                                  />
                                </div>
                              )}
                              
                              {splitMethod === 'Ratio' && (
                                <div className="relative">
                                  <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={member.ratio || ''}
                                    onChange={(e) => updateMemberRatio(member.id, e.target.value)}
                                    className="w-full py-2 px-2 text-right text-sm rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400"
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-between">
                    <button
                      onClick={goBack}
                      className="py-3 px-6 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="py-3 px-6 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {isEditing ? 'Updating...' : 'Adding...'}
                        </>
                      ) : (
                        isEditing ? 'Update Expense' : 'Add Expense'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </Dialog.Panel>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default AddExpenseModal; 