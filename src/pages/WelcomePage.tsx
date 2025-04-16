import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import debounce from 'lodash.debounce';
import { toast } from 'react-hot-toast';

import CreateGroupModal from '../components/CreateGroupModal';
import AddFriendModal from '../components/AddFriendModal';
import { searchUsers, sendFriendRequest } from '../utils/api.util';
import { useAuth } from '../contexts/AuthContext';

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

  const handleSkip = () => {
    localStorage.setItem('hasOnboarded', 'true');
    navigate('/dashboard');
  };

  const handleAddMember = async () => {
    if (!groupId || !newMember) return;
    // TODO: Add to group logic
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <motion.h1
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-4xl font-bold text-gray-800 mb-2 text-center"
      >
        👋 Welcome to <span className="text-gray-600">Splitease</span>!
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="text-gray-600 mb-10 text-center max-w-md"
      >
        Let's get you started in 3 simple steps.
      </motion.p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Step 1 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/80 backdrop-blur-lg border border-gray-200 rounded-2xl p-6 shadow-md hover:shadow-lg transition"
        >
          <div className="text-3xl mb-2">👤</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Add Your First Friend</h2>
          <p className="text-gray-500 mb-4 text-sm">Invite someone you often split with.</p>
          <button
            onClick={() => setShowAddFriend(true)}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 rounded-lg"
          >
            Add Friend
          </button>
        </motion.div>

        {/* Step 2 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/80 backdrop-blur-lg border border-gray-200 rounded-2xl p-6 shadow-md hover:shadow-lg transition"
        >
          <div className="text-3xl mb-2">👥</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Create Your First Group</h2>
          <p className="text-gray-500 mb-4 text-sm">Gather your squad and split smoothly.</p>
          <button
            onClick={() => setShowCreateGroup(true)}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 rounded-lg"
          >
            Create Group
          </button>
        </motion.div>

        {/* Step 3 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white/80 backdrop-blur-lg border border-gray-200 rounded-2xl p-6 shadow-md hover:shadow-lg transition"
        >
          <div className="text-3xl mb-2">✅</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Start Splitting</h2>
          <p className="text-gray-500 mb-4 text-sm">You're now ready to manage expenses!</p>
          {groupId ? (
            <>
              <input
                type="text"
                value={newMember}
                onChange={(e) => setNewMember(e.target.value)}
                placeholder="Add member by email"
                className="w-full px-3 py-2 mb-2 border border-gray-300 rounded-md"
              />
              <button
                onClick={handleAddMember}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 rounded-lg"
              >
                Add to Group
              </button>
            </>
          ) : (
            <p className="text-xs text-gray-400 text-center">Create a group first</p>
          )}
        </motion.div>
      </div>

      {/* Skip Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-10"
      >
        <button
          onClick={handleSkip}
          className="text-gray-500 hover:text-gray-700 text-sm underline"
        >
          Skip for now
        </button>
      </motion.div>

      {/* Add Friend Modal (Reusable Component) */}
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
          return result.data;
        }}
        onFriendAdded={() => {
          // Optional: refresh state if needed
          console.log('Friend added');
        }}
      />

      {/* Create Group Modal */}
      <CreateGroupModal isOpen={showCreateGroup} onClose={() => setShowCreateGroup(false)} />
    </div>
  );
};

export default WelcomePage;
