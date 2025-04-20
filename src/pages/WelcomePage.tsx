import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import debounce from 'lodash.debounce';
import { toast } from 'react-hot-toast';

import CreateGroupModal from '../components/CreateGroupModal';
import AddFriendModal from '../components/AddFriendModal';
import { searchUsers, sendFriendRequest } from '../utils/api.util';
import { useAuth } from '../contexts/AuthContext';

// --- New Elegant Animation Variants ---

const pageVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.5, ease: "easeInOut" }
  }
};

const headerVariants = {
  initial: { opacity: 0, y: -10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1], delay: 0.1 } // Smooth cubic bezier
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
      duration: 0.6, // Slightly longer duration for smoothness
      ease: [0.4, 0, 0.2, 1], // Use smooth cubic bezier
      delay: 0.4 // Keep delay consistent for simultaneous animation
    }
  }
};

const skipButtonVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut", delay: 0.8 } // Fade in last
  }
};
// --- End of New Variants ---

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const { userId } = useAuth();

  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [groupId, setGroupId] = useState<string | null>(null);
  const [newMember, setNewMember] = useState('');
  const [shouldNavigate, setShouldNavigate] = useState(false);

  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query) {
        setSearchResults([]);
        return;
      }

      setSearchLoading(true);
      setSearchError('');

      try {
        const users = await searchUsers(query);
        setSearchResults(users.filter((u: any) => u.id !== userId));
      } catch (err) {
        setSearchError('Failed to search users');
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 500),
    [userId]
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  const handleOnboardingActionComplete = () => {
    localStorage.setItem('hasOnboarded', 'true');
    setShouldNavigate(true);
  };

  useEffect(() => {
    if (shouldNavigate) {
      const timer = setTimeout(() => {
         navigate('/dashboard');
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [shouldNavigate, navigate]);

  const handleSkip = () => {
    handleOnboardingActionComplete();
  };

  const handleAddMember = async () => {
    if (!groupId || !newMember) return;
    // TODO: Add to group logic
  };

  return (
    <motion.div 
      className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6"
      variants={pageVariants}
      initial="initial"
      animate="animate"
    >
      <motion.div 
        className="text-center mb-12"
        variants={headerVariants}
      >
        <h1 className="text-4xl font-bold text-gray-800 mb-3 flex items-center justify-center">
          <span className="inline-block mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-gray-700">
              <path d="M4.5 3.75a3 3 0 00-3 3v.75h21v-.75a3 3 0 00-3-3h-15z" />
              <path fillRule="evenodd" d="M22.5 9.75h-21v7.5a3 3 0 003 3h15a3 3 0 003-3v-7.5zm-18 3.75a.75.75 0 01.75-.75h6a.75.75 0 010 1.5h-6a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" clipRule="evenodd" />
            </svg>
          </span>
          Welcome to <span className="text-gray-700">Splitease</span>!
        </h1>
        <motion.p
          className="text-gray-600 max-w-md mx-auto"
        >
          Let's get you started in 3 simple steps.
        </motion.p>
      </motion.div>

      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl"
        variants={cardsContainerVariants}
      >
        {/* Step 1 */}
        <motion.div
          variants={cardItemVariants}
          className="bg-white rounded-lg p-6 shadow-md border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 ease-out"
        >
          <div className="bg-gray-100 p-3 rounded-full w-14 h-14 mb-5 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-gray-700">
              <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Add Your First Friend</h2>
          <p className="text-gray-500 mb-5 text-sm">Invite someone you often split expenses with.</p>
          <motion.button
            onClick={() => setShowAddFriend(true)}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2.5 px-4 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
            whileTap={{ scale: 0.99 }}
          >
            Add Friend
          </motion.button>
        </motion.div>

        {/* Step 2 */}
        <motion.div
          variants={cardItemVariants}
          className="bg-white rounded-lg p-6 shadow-md border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 ease-out"
        >
          <div className="bg-gray-100 p-3 rounded-full w-14 h-14 mb-5 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-gray-700">
              <path fillRule="evenodd" d="M8.25 6.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM15.75 9.75a3 3 0 116 0 3 3 0 01-6 0zM2.25 9.75a3 3 0 116 0 3 3 0 01-6 0zM6.31 15.117A6.745 6.745 0 0112 12a6.745 6.745 0 016.709 7.498.75.75 0 01-.372.568A12.696 12.696 0 0112 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 01-.372-.568 6.787 6.787 0 011.019-4.38z" clipRule="evenodd" />
              <path d="M5.082 14.254a8.287 8.287 0 00-1.308 5.135 9.687 9.687 0 01-1.764-.44l-.115-.04a.563.563 0 01-.373-.487l-.01-.121a3.75 3.75 0 013.57-4.047zM20.226 19.389a8.287 8.287 0 00-1.308-5.135 3.75 3.75 0 013.57 4.047l-.01.121a.563.563 0 01-.373.486l-.115.04c-.567.2-1.156.349-1.764.441z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Create Your First Group</h2>
          <p className="text-gray-500 mb-5 text-sm">Gather your squad and manage expenses together.</p>
          <motion.button
            onClick={() => setShowCreateGroup(true)}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2.5 px-4 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
            whileTap={{ scale: 0.99 }}
          >
            Create Group
          </motion.button>
        </motion.div>

        {/* Step 3 */}
        <motion.div
          variants={cardItemVariants}
          className="bg-white rounded-lg p-6 shadow-md border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 ease-out"
        >
          <div className="bg-gray-100 p-3 rounded-full w-14 h-14 mb-5 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-gray-700">
              <path d="M12 7.5a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" />
              <path fillRule="evenodd" d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 011.5 14.625v-9.75zM8.25 9.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM18.75 9a.75.75 0 00-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 00.75-.75V9.75a.75.75 0 00-.75-.75h-.008zM4.5 9.75A.75.75 0 015.25 9h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H5.25a.75.75 0 01-.75-.75V9.75z" clipRule="evenodd" />
              <path d="M2.25 18a.75.75 0 000 1.5c5.4 0 10.63.722 15.6 2.075 1.19.324 2.4-.558 2.4-1.82V18.75a.75.75 0 00-.75-.75H2.25z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Start Splitting</h2>
          <p className="text-gray-500 mb-5 text-sm">You're now ready to manage expenses!</p>
          {groupId ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
            >
              <input
                type="text"
                value={newMember}
                onChange={(e) => setNewMember(e.target.value)}
                placeholder="Add member by email"
                className="w-full px-3.5 py-2.5 mb-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 transition-all shadow-sm"
              />
              <motion.button
                onClick={handleAddMember}
                className="w-full bg-gray-800 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-gray-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                whileTap={{ scale: 0.99 }}
              >
                Add to Group
              </motion.button>
            </motion.div>
          ) : (
            <div className="flex justify-center pt-2">
              <p className="text-xs text-gray-400 text-center px-3 py-1.5 bg-gray-50 rounded-full">Create a group first</p>
            </div>
          )}
        </motion.div>
      </motion.div>

      <motion.div
        variants={skipButtonVariants}
        initial="initial"
        animate="animate"
        className="mt-12"
      >
        <motion.button
          onClick={handleSkip}
          className="px-6 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors duration-150 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
          whileTap={{ scale: 0.97 }}
        >
          Skip for now
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {showAddFriend && (
          <AddFriendModal
            isOpen={showAddFriend}
            onClose={() => setShowAddFriend(false)}
            onAdd={async (receiverId: string) => {
              if (!userId) {
                toast.error('User ID not found.');
                throw new Error('No user ID');
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
              handleOnboardingActionComplete();
              return result.data;
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreateGroup && (
          <CreateGroupModal 
            isOpen={showCreateGroup} 
            onClose={() => setShowCreateGroup(false)} 
            onGroupCreated={handleOnboardingActionComplete}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default WelcomePage;

