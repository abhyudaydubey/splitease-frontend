import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import CreateGroupModal from '../components/CreateGroupModal';
import AddFriendModal from '../components/AddFriendModal';
import { toast } from 'react-hot-toast';
import { sendFriendRequest, searchUsers, createGroup, getAllGroups, Group } from '../utils/api.util';
import { useAuth } from '../contexts/AuthContext';

// --- Dashboard Animation Variants ---

const pageContainerVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.4, ease: "easeInOut" }
  }
};

const mainContentVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.5, delay: 0.1, ease: "easeInOut" }
  }
};

const headerVariants = {
  initial: { opacity: 0, y: -10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1], delay: 0.2 }
  }
};

const cardsContainerVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { 
      duration: 0.3, 
      delay: 0.3 // Delay container slightly after header
    }
  }
};

const cardItemVariants = {
  initial: { 
    opacity: 0, 
    y: 15 // Start slightly lower
  },
  animate: {
    opacity: 1,
    y: 0, // Slide up to final position
    transition: {
      duration: 0.6, 
      ease: [0.4, 0, 0.2, 1], // Smooth cubic bezier
      delay: 0.4 // Keep delay consistent with WelcomePage for similar feel
    }
  }
};

const activityFeedVariants = {
  initial: { 
    opacity: 0, 
    y: 15 // Start slightly lower
  },
  animate: {
    opacity: 1,
    y: 0, // Slide up to final position
    transition: { 
      duration: 0.6, 
      ease: [0.4, 0, 0.2, 1], 
      delay: 0.6 // Delay slightly more than cards
    }
  }
};

const tabContentVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeInOut' } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2, ease: 'easeInOut' } },
};

// Animation for new group item appearing
const newGroupItemVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

// --- End of Dashboard Variants ---

const Dashboard: React.FC = () => {
  const [currency, setCurrency] = useState('INR');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const { userId, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'Overview' | 'Expenses' | 'Balances'>('Overview');

  // State for groups
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [groupsLoading, setGroupsLoading] = useState<boolean>(true);
  const [groupsError, setGroupsError] = useState<string | null>(null);
  // Track if we're refreshing in the background (not showing loading state)
  const [isBackgroundRefreshing, setIsBackgroundRefreshing] = useState<boolean>(false);
  // Track the ID of the most recently added group for animation
  const [newGroupId, setNewGroupId] = useState<string | null>(null);

  const currencySymbols: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
  };

  // Dummy data (replace with actual API later)
  const totalAmount = 1320;
  const isOwed = true;
  const recentFriends = [
    { name: 'Riya', amount: 500 },
    { name: 'Aman', amount: -200 },
    { name: 'Lena', amount: 320 },
  ];

  // Dummy data for Balances tab (replace later)
  const usersOwedTo = [{ name: 'Alice', amount: 350 }, { name: 'Bob', amount: 120 }];
  const usersOwedBy = [{ name: 'Charlie', amount: 80 }];

  // Function to fetch all groups (shows loading state)
  const fetchGroups = useCallback(async () => {
    // Don't fetch if already refreshing in background 
    if (isBackgroundRefreshing) return;
    
    setGroupsLoading(true);
    setGroupsError(null);
    try {
      const result = await getAllGroups();
      if (result.success && result.data) {
        setGroups(result.data.groups);
        // Reset new group ID after loading all groups
        setNewGroupId(null);
        // Potentially update totalAmount and isOwed based on result.data.overallBalance here
        // setTotalAmount(Math.abs(result.data.overallBalance));
        // setIsOwed(result.data.overallBalance >= 0);
      } else {
        setGroupsError(result.error || 'Failed to fetch groups.');
        toast.error(result.error || 'Could not load groups.');
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
      const message = error instanceof Error ? error.message : 'An unknown error occurred.';
      setGroupsError(message);
      toast.error(`Error loading groups: ${message}`);
    } finally {
      setGroupsLoading(false);
    }
  }, [isBackgroundRefreshing]);
  
  // Background refresh function (doesn't show loading state, keeps existing data)
  const refreshGroupsInBackground = useCallback(async () => {
    if (isBackgroundRefreshing) return; // Prevent multiple simultaneous refreshes
    
    setIsBackgroundRefreshing(true);
    try {
      const result = await getAllGroups();
      if (result.success && result.data) {
        setGroups(result.data.groups);
        // Keep newGroupId for a moment longer for animation
        setTimeout(() => {
          setNewGroupId(null);
        }, 2000); // Clear newGroupId after 2 seconds
      } else {
        console.error("Background refresh failed:", result.error);
        // Don't show error toast for background refresh failures
      }
    } catch (error) {
      console.error("Error in background refresh:", error);
    } finally {
      setIsBackgroundRefreshing(false);
    }
  }, [isBackgroundRefreshing]); // Only depends on isBackgroundRefreshing
  
  // Handle optimistic group creation
  const handleGroupCreated = useCallback((newGroupData: any) => {
    // Only perform optimistic update if we already have groups loaded
    if (groups) {
      // Format the new group to match the Group interface
      const newGroup: Group = {
        id: newGroupData.id,
        name: newGroupData.name,
        totalBalance: 0, // Start with default values
        status: 'settled up',
        amount: 0,
        balances: [],
        members: [{ id: userId }], // Add current user as a member
        iconId: newGroupData.iconId || 'users' // Default icon
      };
      
      // Add the new group to the existing list
      setGroups(prevGroups => {
        if (!prevGroups) return [newGroup];
        return [...prevGroups, newGroup];
      });
      
      // Set the newly added group ID for animation
      setNewGroupId(newGroup.id);
      
      // Refresh in background to get accurate data
      refreshGroupsInBackground();
    } else {
      // If no groups loaded yet, just do a normal fetch
      fetchGroups();
    }
  }, [groups, userId, fetchGroups, refreshGroupsInBackground]);
  
  // Fetch groups on component mount
  useEffect(() => {
    let mounted = true;
    
    const loadGroups = async () => {
      await fetchGroups();
      // Only clear newGroupId if component is still mounted
      if (mounted) {
        // Give some time for animation to complete if there was a new group
        setTimeout(() => {
          if (mounted) setNewGroupId(null);
        }, 2000);
      }
    };
    
    loadGroups();
    
    // Cleanup function to prevent state updates on unmounted component
    return () => {
      mounted = false;
    };
  }, [fetchGroups]); // Now depend on fetchGroups

  // Show a loading spinner based on the AuthContext's loading state OR groups loading
  if (authLoading) { // Still prioritize auth loading
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // --- Handlers for actions (moved from action cards) ---
  const handleAddExpense = () => { toast.error('Add Expense not implemented yet.'); };
  const handleCreateGroup = () => setShowGroupModal(true);
  const handleAddFriend = () => setShowAddFriendModal(true);
  // --- End Handlers ---

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Expenses':
        return (
          <motion.div key="expenses" variants={tabContentVariants} initial="initial" animate="animate" exit="exit">
            <h2 className="text-xl font-semibold mb-4">Expenses</h2>
            {/* Placeholder for filter */}
            <div className="mb-4 p-3 bg-gray-100 rounded-md text-sm text-gray-600">
              Filter by Group: [All Groups]
            </div>
            {/* Placeholder for expense list */}
            <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
              <p className="text-gray-500">Expense list placeholder...</p>
            </div>
          </motion.div>
        );
      case 'Balances':
        return (
          <motion.div key="balances" variants={tabContentVariants} initial="initial" animate="animate" exit="exit">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* You Are Owed Section */}
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold mb-3 text-green-700">You Are Owed</h3>
                <ul className="space-y-2">
                  {usersOwedTo.length > 0 ? (
                    usersOwedTo.map((item, idx) => (
                      <li key={idx} className="flex justify-between items-center text-sm border-b border-gray-100 pb-1.5">
                        <span>{item.name}</span>
                        <span className="font-medium text-green-600">+{currencySymbols[currency]}{item.amount.toLocaleString()}</span>
                      </li>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400 italic">No one owes you.</p>
                  )}
                </ul>
              </div>
              {/* You Owe Section */}
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold mb-3 text-red-700">You Owe</h3>
                 <ul className="space-y-2">
                  {usersOwedBy.length > 0 ? (
                    usersOwedBy.map((item, idx) => (
                      <li key={idx} className="flex justify-between items-center text-sm border-b border-gray-100 pb-1.5">
                        <span>{item.name}</span>
                        <span className="font-medium text-red-600">-{currencySymbols[currency]}{item.amount.toLocaleString()}</span>
                      </li>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400 italic">You don't owe anyone.</p>
                  )}
                </ul>
              </div>
            </div>
          </motion.div>
        );
      case 'Overview':
      default:
        return (
          <motion.div key="overview" variants={tabContentVariants} initial="initial" animate="animate" exit="exit">
            {/* Balance Summary Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm text-center">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Total balance</h4>
                <p className={`text-xl font-semibold ${isOwed ? 'text-green-600' : 'text-red-600'}`}> 
                   {isOwed ? '+' : '-'}{currencySymbols[currency]}{totalAmount.toLocaleString()}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm text-center">
                 <h4 className="text-sm font-medium text-gray-500 mb-1">You owe</h4>
                 {/* Placeholder value */}
                 <p className="text-xl font-semibold text-red-600"> 
                    -{currencySymbols[currency]}{usersOwedBy.reduce((sum, i) => sum + i.amount, 0).toLocaleString()}
                 </p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm text-center">
                 <h4 className="text-sm font-medium text-gray-500 mb-1">You are owed</h4>
                 {/* Placeholder value */}
                  <p className="text-xl font-semibold text-green-600"> 
                     +{currencySymbols[currency]}{usersOwedTo.reduce((sum, i) => sum + i.amount, 0).toLocaleString()}
                  </p>
              </div>
            </div>
            {/* Recent Activity Section */}
            <motion.div variants={activityFeedVariants} initial="initial" animate="animate">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Recent Activity</h3>
                <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors duration-150 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-300">
                  View all
                </button>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-md">
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <div className="bg-gray-100 rounded-full p-3 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-gray-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                  </div>
                  <p className="text-sm mb-4 text-center">No recent activity yet.</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        );
    }
  };

  return (
    <motion.div 
      className="flex min-h-screen bg-gray-50 text-gray-800"
      variants={pageContainerVariants}
      initial="initial"
      animate="animate"
    >
      <Sidebar
        currency={currency}
        totalAmount={totalAmount}
        isOwed={isOwed}
        groups={groups}
        groupsLoading={groupsLoading}
        groupsError={groupsError}
        recentFriends={recentFriends}
        currencySymbols={currencySymbols}
        onCreateGroup={handleCreateGroup}
        newGroupId={newGroupId} // Pass the newGroupId for animation
        newGroupItemVariants={newGroupItemVariants} // Pass animation variants
      />

      <div className="flex-1 flex flex-col">
        <Navbar
          currency={currency}
          setCurrency={setCurrency}
          currencySymbols={currencySymbols}
          onAddFriend={handleAddFriend}
        />

        <motion.main
          className="flex-1 p-8 overflow-y-auto relative"
          variants={mainContentVariants}
          initial="initial"
          animate="animate"
        >
          {/* Add Expense Button (Floating Top Right) */}
          <button 
            onClick={handleAddExpense}
            title="Add Expense"
            // Dark background, light text, floating style
            className="absolute top-4 right-8 z-10 flex items-center px-4 py-2 bg-gray-800 text-white border border-transparent text-sm font-medium rounded-lg shadow-lg hover:bg-gray-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transform transition-all duration-150 ease-in-out hover:-translate-y-0.5"
          >
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1.5">
               <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
             </svg>
            Add Expense
          </button>
          
          {/* Container for Tabs */}
          {/* Removed justify-between, items-end. Added mt-4 to account for button height */}
          <div className="mb-6 border-b border-gray-200 mt-4"> 
            <nav className="flex space-x-6" aria-label="Tabs">
              {/* Tab Buttons remain the same */}
              <button
                onClick={() => setActiveTab('Overview')}
                className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm transition-colors duration-150 ${activeTab === 'Overview' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('Expenses')}
                className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm transition-colors duration-150 ${activeTab === 'Expenses' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Expenses
              </button>
              <button
                onClick={() => setActiveTab('Balances')}
                className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm transition-colors duration-150 ${activeTab === 'Balances' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Balances
              </button>
            </nav>
          </div>

          {/* Render active tab content */}
          <AnimatePresence mode="wait">
             {renderTabContent()}
          </AnimatePresence>

        </motion.main>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showGroupModal && (
          <CreateGroupModal
            isOpen={showGroupModal}
            onClose={() => setShowGroupModal(false)}
            onGroupCreated={handleGroupCreated}
          />
        )}

        {showAddFriendModal && (
      <AddFriendModal
        isOpen={showAddFriendModal}
        onClose={() => setShowAddFriendModal(false)}
        onAdd={async (receiverId: string) => {
          if (!userId) {
            toast.error('User ID not found.');
            throw new Error('User not found');
          }

              const result = await sendFriendRequest({ senderId: userId, receiverId });
              if (!result.success) {
                // Handle specific error types
                if (result.error === 'Friend request already pending') {
                  toast.error('Friend request is already pending.');
                } else {
                  toast.error(result.error || 'Failed to send friend request.');
                }
                throw new Error(result.error);
              }
              
              toast.success('Friend request sent successfully!');
              return result.data;
        }}
        onFriendAdded={() => {
          // Optional: refresh sidebar or state
          console.log('Friend successfully added');
        }}
      />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Dashboard;

