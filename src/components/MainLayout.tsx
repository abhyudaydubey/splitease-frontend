import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, Outlet, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { getAllGroups, getFriendsList, Group, Friend, sendFriendRequest } from '../utils/api.util';
import { toast } from 'react-hot-toast';
import CreateGroupModal from './CreateGroupModal';
import AddFriendModal from './AddFriendModal';

interface MainLayoutProps {
  children?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userId, isLoading: authLoading } = useAuth();
  
  // Currency state (app-wide)
  const [currency, setCurrency] = useState('INR');
  const currencySymbols: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
  };
  
  // Modal states
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  
  // Groups state
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [groupsLoading, setGroupsLoading] = useState<boolean>(true);
  const [groupsError, setGroupsError] = useState<string | null>(null);
  const [isBackgroundRefreshing, setIsBackgroundRefreshing] = useState<boolean>(false);
  const [newGroupId, setNewGroupId] = useState<string | null>(null);
  
  // Friends state
  const [friends, setFriends] = useState<Friend[] | null>(null);
  const [friendsLoading, setFriendsLoading] = useState<boolean>(true);
  const [friendsError, setFriendsError] = useState<string | null>(null);
  
  // UI state
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState<boolean>(false);
  const [isFriendRequestsModalOpen, setIsFriendRequestsModalOpen] = useState<boolean>(false);
  
  // Balance state
  const [totalAmount, setTotalAmount] = useState<number>(1320);
  const [isOwed, setIsOwed] = useState<boolean>(true);
  
  // Animation variants
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
  
  // Fetch groups function
  const fetchGroups = useCallback(async () => {
    if (isBackgroundRefreshing) return;
    
    setGroupsLoading(true);
    setGroupsError(null);
    try {
      const result = await getAllGroups();
      if (result.success && result.data) {
        setGroups(result.data.groups);
        setTotalAmount(Math.abs(result.data.overallBalance));
        setIsOwed(result.data.overallBalance >= 0);
        setNewGroupId(null);
      } else {
        setGroupsError(result.error || 'Failed to fetch groups.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred.';
      setGroupsError(message);
    } finally {
      setGroupsLoading(false);
    }
  }, [isBackgroundRefreshing]);
  
  // Background refresh function
  const refreshGroupsInBackground = useCallback(async () => {
    if (isBackgroundRefreshing) return;
    
    setIsBackgroundRefreshing(true);
    try {
      const result = await getAllGroups();
      if (result.success && result.data) {
        setGroups(result.data.groups);
        setTotalAmount(Math.abs(result.data.overallBalance));
        setIsOwed(result.data.overallBalance >= 0);
        // Keep newGroupId for animation, then clear it
        setTimeout(() => {
          setNewGroupId(null);
        }, 2000);
      } else {
      }
    } catch (error) {
    } finally {
      setIsBackgroundRefreshing(false);
    }
  }, [isBackgroundRefreshing]);
  
  // Handle group creation
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
      
      // Navigate to the new group
      navigate(`/groups/${newGroup.id}`);
      
      // Refresh in background to get accurate data
      refreshGroupsInBackground();
    } else {
      // If no groups loaded yet, just do a normal fetch
      fetchGroups();
    }
  }, [groups, userId, fetchGroups, refreshGroupsInBackground, navigate]);
  
  // Fetch friends function
  const fetchFriends = useCallback(async () => {
    setFriendsLoading(true);
    setFriendsError(null);
    try {
      const friends = await getFriendsList();
      setFriends(friends);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
      setFriendsError(message);
    } finally {
      setFriendsLoading(false);
    }
  }, []);
  
  // Action handlers
  const handleCreateGroup = () => setShowGroupModal(true);
  const handleAddFriend = () => setShowAddFriendModal(true);
  const handleAddExpense = () => toast.error('Add Expense not implemented yet.');
  
  // Fetch data on component mount
  useEffect(() => {
    fetchGroups();
    fetchFriends();
  }, [fetchGroups, fetchFriends]);
  
  // Show a loading spinner if auth is still loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // Get a dummy list of recent friends for the sidebar until we have real data
  const recentFriends = friends?.map(friend => ({ 
    name: friend.name,
    amount: friend.amount
  })) || [];

  return (
    <div className="flex min-h-screen bg-gray-50">
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
        newGroupId={newGroupId}
        newGroupItemVariants={newGroupItemVariants}
      />
      
      <div className="flex-1 flex flex-col">
        <Navbar
          currency={currency}
          setCurrency={setCurrency}
          currencySymbols={currencySymbols}
          onAddFriend={handleAddFriend}
          onProfileDropdownToggle={setIsProfileDropdownOpen}
          onFriendRequestsModalToggle={setIsFriendRequestsModalOpen}
        />
        
        <div className="flex-1 overflow-auto relative">
          {/* Floating Add Expense Button - Hidden when profile dropdown or friend requests modal is open */}
          {!isProfileDropdownOpen && !isFriendRequestsModalOpen && (
            <button
              onClick={handleAddExpense}
              title="Add Expense"
              className="absolute top-4 right-8 z-10 flex items-center px-4 py-2 bg-gray-800 text-white border border-transparent text-sm font-medium rounded-lg shadow-lg hover:bg-gray-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transform transition-all duration-150 ease-in-out hover:-translate-y-0.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1.5">
                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
              </svg>
              Add Expense
            </button>
          )}
          
          {/* Render the main content via Outlet */}
          <Outlet />
        </div>
      </div>
      
      {/* Modals */}
      {showAddFriendModal && (
        <AddFriendModal
          isOpen={showAddFriendModal}
          onClose={() => setShowAddFriendModal(false)}
          onAdd={async (receiverId: string) => {
            if (!userId) {
              toast.error('User ID not found.');
              throw new Error('No user ID');
            }
            
            const result = await sendFriendRequest({ senderId: userId, receiverId });
            if (!result.success) {
              if (result.error === 'Friend request already pending') {
                toast.error('Friend request is already pending.');
              } else {
                toast.error(result.error || 'Failed to send friend request.');
              }
              throw new Error(result.error);
            }
            
            toast.success('Friend request sent successfully!');
            fetchFriends(); // Refresh friends list
            return result.data;
          }}
        />
      )}
      
      {showGroupModal && (
        <CreateGroupModal 
          isOpen={showGroupModal} 
          onClose={() => setShowGroupModal(false)} 
          onGroupCreated={handleGroupCreated}
        />
      )}
    </div>
  );
};

export default MainLayout; 