import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getGroupExpenseSummary, ExpenseSummary } from '../utils/api.util';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import AddMemberModal from '../components/AddMemberModal';
import AddExpenseModal from '../components/AddExpenseModal';
import SettleUpModal from '../components/SettleUpModal';

// Animation variants
const pageContainerVariants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { duration: 0.3, ease: "easeOut" }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

const contentVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.3,
      ease: "easeOut"
    }
  }
};

const itemVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.2, ease: "easeOut" }
  }
};

const expandVariants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: { 
    height: 'auto', 
    opacity: 1,
    transition: { duration: 0.3, ease: "easeOut" }
  }
};

// Define member type inline or let it be inferred
interface DerivedMember {
  id: string;
  username: string;
}

const GroupDetailsPage: React.FC = () => {
  const { groupId, groupName } = useParams<{ groupId?: string; groupName?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = useAuth();
  
  const [groupSummary, setGroupSummary] = useState<ExpenseSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState<boolean>(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState<boolean>(false);
  const [showMembers, setShowMembers] = useState<boolean>(false);
  const [showSettleUpModal, setShowSettleUpModal] = useState(false);
  
  // State to store derived members list with the defined type
  const [members, setMembers] = useState<DerivedMember[]>([]);
  
  const navigateToDashboard = () => {
    navigate('/dashboard');
  };
  
  // Fetch group summary and expenses (Uses getGroupExpenseSummary)
  useEffect(() => {
    setLoading(true);
    setError(null);
    setGroupSummary(null);
    setMembers([]); 
    
    const fetchGroupSummary = async () => {
      let targetGroupId = groupId;
      if (!targetGroupId && groupName) {
        const groupMapping = JSON.parse(localStorage.getItem('groupMapping') || '{}');
        targetGroupId = groupMapping[groupName];
      }
      
      if (!targetGroupId) {
        setError('Group information is missing');
        setLoading(false);
        return;
      }
      
      try {
        const result = await getGroupExpenseSummary(targetGroupId);
        if (result.success && result.data) {
          setGroupSummary(result.data);
          
          // Derive members list
          const memberMap = new Map<string, string>();
          result.data.summary.youAreOwed.forEach(b => memberMap.set(b.userId, b.username));
          result.data.summary.youOwe.forEach(b => memberMap.set(b.userId, b.username));
          result.data.expenses.forEach(exp => {
            if (exp.paidBy && exp.paidBy.id) memberMap.set(exp.paidBy.id, exp.paidBy.username);
          });

          if (userId && !memberMap.has(userId)) {
             const authUser = JSON.parse(localStorage.getItem('user') || '{}');
             if (authUser.username) {
                memberMap.set(userId, authUser.username);
             }
          }
          
          // Ensure the mapped data conforms to DerivedMember
          const derivedMembers: DerivedMember[] = Array.from(memberMap.entries()).map(([id, username]) => ({ id, username }));
          setMembers(derivedMembers);

          const currentPath = window.location.pathname;
          if (groupId && !groupName && currentPath.startsWith('/groups/')) {
            const nameSlug = result.data.group.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const groupMapping = JSON.parse(localStorage.getItem('groupMapping') || '{}');
            groupMapping[nameSlug] = targetGroupId;
            localStorage.setItem('groupMapping', JSON.stringify(groupMapping));
            navigate(`/g/${nameSlug}`, { replace: true });
          }
        } else {
          setError(result.error || 'Failed to fetch group summary');
        }
      } catch (error) {
        setError('An unexpected error occurred');
        console.error('Error fetching group summary:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGroupSummary();
  }, [groupId, groupName, navigate, location.pathname, userId]);
  
  const handleAddExpense = () => {
    if (!groupSummary) {
      toast.error('Group information is missing');
      return;
    }
    setShowAddExpenseModal(true);
  };
  
  // Handle settle up (Uses groupSummary)
  const handleSettleUp = () => {
    if (!groupSummary) {
      toast.error('Group information is missing');
      return;
    }
    setShowSettleUpModal(true);
  };
  
  // Handle adding members (Uses groupSummary)
  const handleAddMember = () => {
    if (!groupSummary) {
      toast.error('Group information is missing');
      return;
    }
    setShowAddMemberModal(true);
  };
  
  // Handle group settings (Placeholder)
  const handleGroupSettings = () => {
    toast.error('Group settings feature is not implemented yet');
  };

  // Refreshes group summary (Uses getGroupExpenseSummary)
  const refreshGroupSummary = async (successMessage: string) => {
     if (!groupId && !groupName) return;
     
     setLoading(true);
     let targetGroupId = groupId;
     if (!targetGroupId && groupName) {
        const groupMapping = JSON.parse(localStorage.getItem('groupMapping') || '{}');
        targetGroupId = groupMapping[groupName];
     }
     
     if (!targetGroupId) {
        toast.error('Group information is missing');
        setLoading(false);
        return;
     }
     
     try {
        const result = await getGroupExpenseSummary(targetGroupId);
        if (result.success && result.data) {
          setGroupSummary(result.data);
           // Re-derive members list
          const memberMap = new Map<string, string>();
          result.data.summary.youAreOwed.forEach(b => memberMap.set(b.userId, b.username));
          result.data.summary.youOwe.forEach(b => memberMap.set(b.userId, b.username));
           result.data.expenses.forEach(exp => {
             if (exp.paidBy && exp.paidBy.id) memberMap.set(exp.paidBy.id, exp.paidBy.username);
           });
          if (userId && !memberMap.has(userId)) {
             const authUser = JSON.parse(localStorage.getItem('user') || '{}');
              if (authUser.username) memberMap.set(userId, authUser.username);
          }
           // Ensure the mapped data conforms to DerivedMember
          const derivedMembers: DerivedMember[] = Array.from(memberMap.entries()).map(([id, username]) => ({ id, username }));
          setMembers(derivedMembers);

          toast.success(successMessage);
        } else {
          toast.error(result.error || 'Failed to refresh group summary');
        }
     } catch (error) {
        toast.error('An unexpected error occurred while refreshing group summary');
        console.error('Error refreshing group summary:', error);
     } finally {
        setLoading(false);
     }
  };

  const handleMemberAdded = () => refreshGroupSummary('Group updated successfully');
  const handleExpenseAdded = () => refreshGroupSummary('Expense added successfully');
  const handleSettlementComplete = () => refreshGroupSummary('Group balances updated successfully');
  
  const getBalanceStatusColor = (amount: number) => {
    if (amount < 0) return 'text-red-600'; 
    if (amount > 0) return 'text-green-600'; 
    return 'text-gray-600'; 
  };

  // Helper function for expense transaction color
  const getExpenseTransactionColor = (transactionType: string) => {
      return transactionType === 'you borrowed' ? 'text-red-600' : 'text-green-600';
  };

  // Helper function for balance text - Correct return type for JSX/string
  const getBalanceText = (total: number, youOweLength: number): React.ReactNode => {
    // Explicitly check if the total is NaN first
    if (isNaN(total)) {
      console.warn("getBalanceText received NaN for total balance. Returning styled message.");
      // Return styled JSX for this specific case
      return (
        <div className="flex items-center text-green-600 text-xs italic py-1">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
          </svg>
          You don't owe anyone here!
        </div>
      );
    }

    // Return plain strings for other cases
    if (total === 0) return 'All settled up';
    if (total < 0 && youOweLength === 0) return 'All settled up'; 
    
    const amountStr = `₹${Math.abs(total).toLocaleString()}`;
    if (total < 0) return `You owe ${amountStr}`;
    return `You are owed ${amountStr}`; 
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (error || !groupSummary) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="text-red-500 text-xl mb-4">
          {error || 'Group not found'}
        </div>
        <button 
          onClick={navigateToDashboard} 
          className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <motion.div
      className="h-full bg-gray-50"
      variants={pageContainerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <motion.div 
        className="max-w-4xl mx-auto p-6"
        variants={contentVariants}
      >
        <div className="relative mb-0">
          <button
            onClick={navigateToDashboard} 
            className="absolute -left-10 top-0 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Back to dashboard"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div className="h-0"></div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-300 shadow-sm mb-4">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-medium text-gray-900">{groupSummary.group.name} Summary</h2>
          </div>
          
          <div className="p-6">
            <div className="mb-6">
              {groupSummary.summary.total === 0 ? (
                <div className="flex items-center text-gray-700 font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2 text-gray-700">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                  All settled up in this group
                </div>
              ) : (
                <div>
                  <div className={`text-lg font-medium ${getBalanceStatusColor(groupSummary.summary.total)}`}>
                    {getBalanceText(groupSummary.summary.total, groupSummary.summary.youOwe.length)}
                  </div>
                  
                  <div className="mt-3 text-sm space-y-2">
                    {groupSummary.summary.youAreOwed.length > 0 ? (
                       groupSummary.summary.youAreOwed.map((balance) => (
                        <div 
                          key={balance.userId} 
                          className="flex items-center justify-between py-1 border-b border-gray-100 last:border-b-0"
                        >
                          <span className="text-gray-700">{balance.username}</span>
                          <span 
                            className={`font-medium ${getBalanceStatusColor(balance.amount)}`}
                          >
                             owes you ₹{Math.abs(balance.amount).toLocaleString()}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 italic text-xs">No one owes you in this group.</p>
                    )}

                    {groupSummary.summary.youOwe.length > 0 && (
                      groupSummary.summary.youOwe.map((balance) => (
                        <div 
                          key={balance.userId} 
                          className="flex items-center justify-between py-1 border-b border-gray-100 last:border-b-0"
                        >
                          <span className="text-gray-700">{balance.username}</span>
                          <span 
                            className={`font-medium ${getBalanceStatusColor(-balance.amount)}`}
                          >
                            you owe ₹{Math.abs(balance.amount).toLocaleString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => setShowMembers(!showMembers)}
                className={`flex items-center py-2 px-4 border ${showMembers ? 'border-gray-400 bg-gray-100' : 'border-gray-300'} 
                  text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors`}
                aria-label="View members"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1.5 text-gray-600">
                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 01-2.07-.654.78.78 0 01-.357.442 3 3 0 01-4.308-3.517 6.484 6.484 0 001.907 3.96 2.32 2.32 0 01-.026-.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18c-1.546 0-2.996-.47-4.247-1.268a.84.84 0 01-.449-.542z" />
                </svg>
                Members ({members.length})
              </button>
              
              <button
                onClick={handleGroupSettings}
                className="flex items-center py-2 px-4 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Group settings"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1.5 text-gray-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </button>
              
              <button
                onClick={handleSettleUp}
                className="flex items-center py-2 px-4 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Settle up"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1.5 text-gray-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
                Settle Up
              </button>
              
              <button
                onClick={handleAddExpense}
                className="flex items-center py-2 px-4 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors shadow-sm ml-auto"
                aria-label="Add expense"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1.5">
                  <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                </svg>
                Add Expense
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showMembers && (
              <motion.div 
                variants={expandVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed" 
                className="overflow-hidden border-t border-gray-200"
              >
                <div className="p-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {members.map((member) => (
                      <div 
                        key={member.id} 
                        className="flex items-center p-3 rounded-lg bg-gray-50 border border-gray-200"
                      >
                        <div className="w-8 h-8 bg-gradient-to-r from-gray-600 to-gray-800 rounded-full flex items-center justify-center text-white font-medium mr-3 flex-shrink-0">
                          {member.username.substring(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">{member.username}</div>
                          {member.id === userId && (
                            <div className="text-xs text-gray-500">You</div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    <button
                      onClick={handleAddMember}
                      className="flex items-center justify-center p-3 rounded-lg border border-dashed border-gray-300 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center text-sm text-gray-600 hover:text-gray-800">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                        </svg>
                        Add Member
                      </div>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-300 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-medium text-gray-900">Recent Expenses</h2>
          </div>

          <div className="p-6">
            {groupSummary.expenses.length > 0 ? (
              <div className="space-y-3">
                {groupSummary.expenses.map((expense) => (
                  <div 
                    key={expense.id} 
                    className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start">
                        <div className="mr-3 p-2 rounded-full bg-gray-100 flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-500">
                           <path fillRule="evenodd" d="M5.75 3a.75.75 0 01.75.75V4h7V3.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V3.75A.75.75 0 015.75 3zm-1 5.5a.75.75 0 000 1.5h10.5a.75.75 0 000-1.5H4.75z" clipRule="evenodd" />
                          </svg>
                        </div>
                        
                        <div>
                          <div className="font-medium text-gray-900">{expense.description}</div>
                          <div className="text-sm text-gray-500">
                             {expense.paidBy.id === userId ? 'You paid' : `Paid by ${expense.paidBy.username}`} • {new Date(expense.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-semibold">
                           ₹{expense.amount.toLocaleString()}
                        </div>
                        <div className={`text-sm ${getExpenseTransactionColor(expense.transactionType)}`}>
                          {expense.transactionType === 'you borrowed' ? 'You borrowed ' : 'You lent '}
                           ₹{expense.transactionAmount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 px-4 text-center border border-gray-200 rounded-lg">
                <p className="text-gray-500 mb-4">No expenses recorded yet</p>
                <button 
                  onClick={handleAddExpense}
                  className="inline-flex items-center py-2 px-4 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1.5">
                    <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                  </svg>
                  Record your first expense
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Modals Section (Pass derived members state) */}
      <AnimatePresence>
        {showAddMemberModal && groupSummary && ( 
          <AddMemberModal
            isOpen={showAddMemberModal}
            onClose={() => setShowAddMemberModal(false)}
            groupId={groupSummary.group.id}
            currentMembers={members} // Pass derived members 
            onMemberAdded={handleMemberAdded}
          />
        )}
        {showAddExpenseModal && groupSummary && ( 
          <AddExpenseModal
            isOpen={showAddExpenseModal}
            onClose={() => setShowAddExpenseModal(false)}
            groupId={groupSummary.group.id}
            groupMembers={members} // Pass derived members
            currentUserId={userId || ''}
            onExpenseAdded={handleExpenseAdded}
          />
        )}
        {showSettleUpModal && groupSummary && (
          <SettleUpModal
            isOpen={showSettleUpModal}
            onClose={() => setShowSettleUpModal(false)}
            groupId={groupSummary.group.id}
            currentUserId={userId || ''}
            onSettled={handleSettlementComplete}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default GroupDetailsPage; 