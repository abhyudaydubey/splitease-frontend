import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getGroupDetails, GroupDetails } from '../utils/api.util';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

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
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.4,
      ease: "easeOut",
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" }
  }
};

// Add these interfaces for the expense structure
interface Expense {
  description: string;
  amount: number;
  paidBy: string;
  date: string;
}

interface GroupExpenses {
  [month: string]: Expense[];
}

const GroupDetailsPage: React.FC = () => {
  const { groupId, groupName } = useParams<{ groupId?: string; groupName?: string }>();
  const navigate = useNavigate();
  const { userId } = useAuth();
  
  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Navigate to dashboard with proper URL
  const navigateToDashboard = () => {
    navigate('/dashboard');
  };
  
  // Fetch group details
  useEffect(() => {
    const fetchGroupDetails = async () => {
      // If we have a groupId parameter, use it directly
      let targetGroupId = groupId;
      
      // If we don't have groupId but have groupName, look up the ID from localStorage
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
        const result = await getGroupDetails(targetGroupId);
        if (result.success && result.data) {
          setGroup(result.data);
          
          // Handle URL redirection if needed
          const currentPath = window.location.pathname;
          
          // Redirect old format to new format
          if (groupId && !groupName && currentPath.startsWith('/groups/')) {
            const nameSlug = result.data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            
            // Save mapping before redirecting
            const groupMapping = JSON.parse(localStorage.getItem('groupMapping') || '{}');
            groupMapping[nameSlug] = targetGroupId;
            localStorage.setItem('groupMapping', JSON.stringify(groupMapping));
            
            navigate(`/g/${nameSlug}`, { replace: true });
          }
        } else {
          setError(result.error || 'Failed to fetch group details');
        }
      } catch (error) {
        setError('An unexpected error occurred');
        console.error('Error fetching group details:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGroupDetails();
  }, [groupId, groupName, navigate]);
  
  // Handle adding expense (placeholder)
  const handleAddExpense = () => {
    toast.error('Add expense feature is not implemented yet');
  };
  
  // Handle settle up (placeholder)
  const handleSettleUp = () => {
    toast.error('Settle up feature is not implemented yet');
  };
  
  // Handle adding members (placeholder)
  const handleAddMember = () => {
    toast.error('Add member feature is not implemented yet');
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-gray-800 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (error || !group) {
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
      className="h-full p-6"
      variants={pageContainerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <motion.div 
        className="max-w-5xl mx-auto"
        variants={contentVariants}
      >
        {/* Group Header with Actions */}
        <motion.div 
          className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200"
          variants={itemVariants}
        >
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <div className="flex items-center mb-2">
                <button 
                  onClick={navigateToDashboard} 
                  className="text-gray-600 hover:text-gray-800 mr-3"
                  title="Back to dashboard"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                </button>
                <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
              </div>
              {/* Balance Summary */}
              <div className="flex items-center">
                <span className={`text-lg font-semibold ${
                  group.totalBalance > 0 ? 'text-green-600' : 
                  group.totalBalance < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {group.balanceText}
                </span>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={handleAddExpense}
                className="flex items-center px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1.5">
                  <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                </svg>
                Add Expense
              </button>
              
              <button 
                onClick={handleSettleUp}
                className="flex items-center px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
                Settle Up
              </button>
              
              <button 
                onClick={handleAddMember}
                className="flex items-center px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                </svg>
                Add Member
              </button>
            </div>
          </div>
        </motion.div>
        
        {/* Group Content - Two Column Layout for Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Members */}
          <motion.div 
            className="md:col-span-1"
            variants={itemVariants}
          >
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-500">
                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 01-2.07-.654.78.78 0 01-.357.442 3 3 0 01-4.308-3.517 6.484 6.484 0 001.907 3.96 2.32 2.32 0 01-.026-.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18c-1.546 0-2.996-.47-4.247-1.268a.84.84 0 01-.449-.542z" />
                </svg>
                Members ({group.members.length})
              </h2>
              
              <div className="space-y-3">
                {group.members.map((member) => (
                  <div 
                    key={member.id} 
                    className="flex items-center p-3 rounded-lg bg-gray-50 border border-gray-200"
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-gray-600 to-gray-800 rounded-full flex items-center justify-center text-white font-medium mr-3">
                      {member.username.substring(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium">{member.username}</div>
                      <div className="text-sm text-gray-500">
                        {member.id === userId ? 'You' : ''}
                      </div>
                    </div>
                  </div>
                ))}
                
                {group.members.length === 0 && (
                  <div className="text-center p-4 text-gray-500">
                    No members found.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
          
          {/* Right Column - Balances and Expenses */}
          <motion.div 
            className="md:col-span-2"
            variants={itemVariants}
          >
            {/* Individual Balances */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-500">
                  <path d="M10.75 10.818v2.614A3.13 3.13 0 0011.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 00-1.138-.432zM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603a2.45 2.45 0 00-.35.13c-.14.065-.27.143-.386.233-.377.292-.514.627-.514.909 0 .184.058.39.202.592.037.051.08.102.128.152z" />
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-6a.75.75 0 01.75.75v.316a3.78 3.78 0 011.653.713c.426.33.744.74.925 1.2a.75.75 0 01-1.395.55 1.35 1.35 0 00-.447-.563 2.187 2.187 0 00-.736-.363V9.3c.698.093 1.383.32 1.959.696.787.514 1.29 1.27 1.29 2.13 0 .86-.504 1.616-1.29 2.13-.576.377-1.261.603-1.96.696v.299a.75.75 0 11-1.5 0v-.3c-.697-.092-1.382-.318-1.958-.695-.482-.315-.857-.717-1.078-1.188a.75.75 0 111.359-.636c.08.173.245.376.54.569.313.205.706.353 1.138.432v-2.748a3.782 3.782 0 01-1.653-.713C6.9 9.433 6.5 8.681 6.5 7.875c0-.805.4-1.558 1.097-2.096a3.78 3.78 0 011.653-.713V4.75A.75.75 0 0110 4z" clipRule="evenodd" />
                </svg>
                Balances
              </h2>
              
              {group.individualBalances.length > 0 ? (
                <div className="space-y-3">
                  {group.individualBalances.map((balance, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-3 rounded-lg border"
                      style={{
                        backgroundColor: balance.amount > 0 ? 'rgba(220, 252, 231, 0.5)' : 
                                       balance.amount < 0 ? 'rgba(254, 226, 226, 0.5)' : 'rgba(243, 244, 246, 0.5)',
                        borderColor: balance.amount > 0 ? 'rgb(134, 239, 172)' : 
                                    balance.amount < 0 ? 'rgb(252, 165, 165)' : 'rgb(229, 231, 235)'
                      }}
                    >
                      <div className="flex items-center">
                        <div className="font-medium">{balance.username}</div>
                      </div>
                      <div 
                        className={`font-semibold ${
                          balance.amount > 0 ? 'text-green-600' : 
                          balance.amount < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}
                      >
                        {balance.amount > 0 ? 'owes you ' : 
                         balance.amount < 0 ? 'you owe ' : ''}
                        {Math.abs(balance.amount).toLocaleString('en-US', { style: 'currency', currency: 'INR' })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                  No balances to show. All settled up!
                </div>
              )}
            </div>
            
            {/* Recent Expenses */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-500">
                  <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 013.5 2h9A1.5 1.5 0 0114 3.5v11.75A2.75 2.75 0 0016.75 18h-12A2.75 2.75 0 012 15.25V3.5zm3.75 7a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5zm0 3a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5zM5 5.75A.75.75 0 015.75 5h4.5a.75.75 0 01.75.75v2.5a.75.75 0 01-.75.75h-4.5A.75.75 0 015 8.25v-2.5z" clipRule="evenodd" />
                  <path d="M16.5 6.5h-1v8.75a1.25 1.25 0 102.5 0V8a1.5 1.5 0 00-1.5-1.5z" />
                </svg>
                Recent Expenses
              </h2>
              
              {Object.keys(group.expensesByMonth).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(group.expensesByMonth as GroupExpenses).map(([month, expenses]) => (
                    <div key={month}>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">{month}</h3>
                      <div className="space-y-3">
                        {expenses.map((expense: Expense, index: number) => (
                          <div 
                            key={index} 
                            className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200"
                          >
                            <div className="flex items-center">
                              <div className="mr-3 p-2 rounded-full bg-gray-200">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-600">
                                  <path fillRule="evenodd" d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm5-2.25A.75.75 0 017.75 7h4.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-4.5z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div>
                                <div className="font-medium">{expense.description}</div>
                                <div className="text-xs text-gray-500">
                                  Paid by {expense.paidBy} • {expense.date}
                                </div>
                              </div>
                            </div>
                            <div className="font-semibold">
                              {expense.amount.toLocaleString('en-US', { style: 'currency', currency: 'INR' })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-12 h-12 text-gray-400 mx-auto mb-3">
                    <path d="M10.75 10.818v2.614A3.13 3.13 0 0011.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 00-1.138-.432zM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603a2.45 2.45 0 00-.35.13c-.14.065-.27.143-.386.233-.377.292-.514.627-.514.909 0 .184.058.39.202.592.037.051.08.102.128.152z" />
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-6a.75.75 0 01.75.75v.316a3.78 3.78 0 011.653.713c.426.33.744.74.925 1.2a.75.75 0 01-1.395.55 1.35 1.35 0 00-.447-.563 2.187 2.187 0 00-.736-.363V9.3c.698.093 1.383.32 1.959.696.787.514 1.29 1.27 1.29 2.13 0 .86-.504 1.616-1.29 2.13-.576.377-1.261.603-1.96.696v.299a.75.75 0 11-1.5 0v-.3c-.697-.092-1.382-.318-1.958-.695-.482-.315-.857-.717-1.078-1.188a.75.75 0 111.359-.636c.08.173.245.376.54.569.313.205.706.353 1.138.432v-2.748a3.782 3.782 0 01-1.653-.713C6.9 9.433 6.5 8.681 6.5 7.875c0-.805.4-1.558 1.097-2.096a3.78 3.78 0 011.653-.713V4.75A.75.75 0 0110 4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-gray-500">No expenses yet in this group</p>
                  <button 
                    onClick={handleAddExpense}
                    className="mt-4 flex items-center px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors mx-auto"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1.5">
                      <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                    </svg>
                    Add First Expense
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GroupDetailsPage; 