import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { getExpenseDetail, deleteExpense, ExpenseDetail } from '../utils/api.util';
import AddExpenseModal from './AddExpenseModal';

interface ExpenseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseId: string;
  onExpenseUpdated: () => void;
  onExpenseDeleted: () => void;
  currentUserId: string;
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

const ExpenseDetailModal: React.FC<ExpenseDetailModalProps> = ({ 
  isOpen, 
  onClose, 
  expenseId,
  onExpenseUpdated,
  onExpenseDeleted,
  currentUserId
}) => {
  const [expenseDetail, setExpenseDetail] = useState<ExpenseDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  
  useEffect(() => {
    if (isOpen && expenseId) {
      fetchExpenseDetail();
    }
  }, [isOpen, expenseId]);
  
  const fetchExpenseDetail = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getExpenseDetail(expenseId);
      if (result.success && result.data) {
        setExpenseDetail(result.data);
      } else {
        setError(result.error || 'Failed to fetch expense details');
      }
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Error fetching expense details:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleEditExpense = () => {
    setShowEditModal(true);
  };
  
  const handleDeleteExpense = async () => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }
    
    setIsDeleting(true);
    
    try {
      const result = await deleteExpense(expenseId);
      if (result.success) {
        toast.success(result.message || 'Expense deleted successfully');
        onExpenseDeleted();
        onClose();
      } else {
        toast.error(result.error || 'Failed to delete expense');
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('An unexpected error occurred while deleting the expense');
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleExpenseEditClosed = () => {
    setShowEditModal(false);
  };
  
  const handleExpenseEdited = () => {
    fetchExpenseDetail();
    onExpenseUpdated();
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
              className="w-full max-w-lg bg-white rounded-lg shadow-xl overflow-hidden z-10"
            >
              <div className="border-b border-gray-200">
                <div className="px-6 py-4 flex items-center justify-between">
                  <Dialog.Title className="text-xl font-semibold text-gray-900">
                    Expense Details
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
                ) : expenseDetail ? (
                  <div>
                    {/* Expense Basic Info */}
                    <div className="mb-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{expenseDetail.expense.description}</h3>
                      <div className="flex justify-between">
                        <div>
                          <div className="text-sm text-gray-500">Total amount</div>
                          <div className="text-xl font-semibold">₹{expenseDetail.expense.amount.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Paid by</div>
                          <div className="font-medium">
                            {expenseDetail.expense.paidBy.id === currentUserId 
                              ? 'You' 
                              : expenseDetail.expense.paidBy.username}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Date</div>
                          <div className="font-medium">
                            {new Date(expenseDetail.expense.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="text-sm text-gray-500">Group</div>
                        <div className="font-medium">{expenseDetail.expense.group.name}</div>
                      </div>
                    </div>
                    
                    {/* Split Details */}
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Split Details</h4>
                      <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                        {expenseDetail.splits.map((split, index) => (
                          <div key={index} className="p-3 flex justify-between items-center">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gradient-to-r from-gray-600 to-gray-800 rounded-full flex items-center justify-center text-white font-medium mr-3">
                                {split.user.username.substring(0, 1).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium">
                                  {split.relationship === 'you' 
                                    ? 'You' 
                                    : split.user.username}
                                </div>
                                <div className="text-xs text-gray-500 capitalize">
                                  {split.relationship === 'you' 
                                    ? (split.user.id === expenseDetail.expense.paidBy.id ? 'you paid' : '') 
                                    : split.relationship}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">₹{split.share.toFixed(2)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Transactions */}
                    {expenseDetail.transactions.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Transactions</h4>
                        <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                          {expenseDetail.transactions.map((transaction, index) => (
                            <div key={index} className="p-3">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                  <span className="font-medium">
                                    {transaction.from.id === currentUserId ? 'You' : transaction.from.username}
                                  </span>
                                  <span className="mx-2 text-gray-500">→</span>
                                  <span className="font-medium">
                                    {transaction.to.id === currentUserId ? 'You' : transaction.to.username}
                                  </span>
                                </div>
                                <div className="font-medium">₹{transaction.amount.toFixed(2)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={handleDeleteExpense}
                        disabled={isDeleting}
                        className="py-2 px-4 border border-red-300 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </button>
                      <button
                        onClick={handleEditExpense}
                        className="py-2 px-4 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Edit Expense
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 px-4 text-center">
                    <p className="text-gray-500">No expense details found</p>
                  </div>
                )}
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      )}
      
      {/* Edit Expense Modal */}
      {showEditModal && expenseDetail && (
        <AddExpenseModal
          isOpen={showEditModal}
          onClose={handleExpenseEditClosed}
          groupId={expenseDetail.expense.group.id}
          groupMembers={expenseDetail.splits.map(split => ({
            id: split.user.id,
            username: split.user.username
          }))}
          currentUserId={currentUserId}
          onExpenseAdded={handleExpenseEdited}
          isEditing={true}
          existingExpenseId={expenseId}
          existingExpenseData={{
            description: expenseDetail.expense.description,
            amount: expenseDetail.expense.amount.toString(),
            paidById: expenseDetail.expense.paidBy.id,
            splits: expenseDetail.splits.map(split => ({
              userId: split.user.id,
              share: split.share
            }))
          }}
        />
      )}
    </AnimatePresence>
  );
};

export default ExpenseDetailModal; 