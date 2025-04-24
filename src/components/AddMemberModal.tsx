import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Friend, getFriendsList, addMemberToGroup, addMembersToGroup } from '../utils/api.util';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  currentMembers: { id: string; username: string }[];
  onMemberAdded: () => void;
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

const AddMemberModal: React.FC<AddMemberModalProps> = ({ 
  isOpen, 
  onClose, 
  groupId,
  currentMembers,
  onMemberAdded
}) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<Friend[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch friends when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchFriends();
    }
  }, [isOpen]);

  // Reset selections when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedFriends([]);
    }
  }, [isOpen]);

  // Filter friends when search query changes
  useEffect(() => {
    if (friends.length > 0) {
      const filtered = friends.filter(friend => 
        friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        friend.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFriends(filtered);
    }
  }, [searchQuery, friends]);

  const fetchFriends = async () => {
    setIsLoading(true);
    try {
      const friendsList = await getFriendsList();
      
      // Filter out friends who are already members of the group
      const currentMemberIds = currentMembers.map(member => member.id);
      const availableFriends = friendsList.filter(friend => 
        !currentMemberIds.includes(friend.id)
      );
      
      setFriends(availableFriends);
      setFilteredFriends(availableFriends);
    } catch (error) {
      console.error('Error fetching friends:', error);
      toast.error('Failed to load friends');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFriendSelection = (friend: Friend) => {
    setSelectedFriends(prev => {
      // Check if friend is already selected
      const isSelected = prev.some(f => f.id === friend.id);
      
      if (isSelected) {
        // Remove from selection
        return prev.filter(f => f.id !== friend.id);
      } else {
        // Add to selection
        return [...prev, friend];
      }
    });
  };

  const handleAddMember = async () => {
    if (selectedFriends.length === 0) {
      toast.error('Please select at least one friend to add');
      return;
    }

    setIsSubmitting(true);
    try {
      let result;
      
      if (selectedFriends.length === 1) {
        // Single member addition
        result = await addMemberToGroup(groupId, selectedFriends[0].id);
        if (result.success) {
          toast.success(`${selectedFriends[0].name} added to the group!`);
        }
      } else {
        // Multiple members addition
        const userIds = selectedFriends.map(friend => friend.id);
        result = await addMembersToGroup(groupId, userIds);
        if (result.success) {
          toast.success(`${selectedFriends.length} members added to the group!`);
        }
      }
      
      if (result.success) {
        onMemberAdded();
        onClose();
      } else {
        toast.error(result.error || 'Failed to add member(s)');
      }
    } catch (error) {
      console.error('Error adding member(s):', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
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
              className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden z-10"
            >
              <div className="p-6">
                <Dialog.Title className="text-xl font-semibold text-gray-900 mb-2">
                  Add Members to Group
                </Dialog.Title>
                <Dialog.Description className="text-sm text-gray-500 mb-5">
                  Select one or more friends to add to your group.
                </Dialog.Description>

                {/* Search Box */}
                <div className="mb-5">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search friends..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 pr-10"
                    />
                    <div className="absolute right-3 top-3 text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Selected Count */}
                {selectedFriends.length > 0 && (
                  <div className="mb-3 text-sm font-medium text-gray-700">
                    {selectedFriends.length} friend{selectedFriends.length !== 1 ? 's' : ''} selected
                  </div>
                )}

                {/* Friends List */}
                <div className="max-h-60 overflow-y-auto mb-5 rounded-lg border border-gray-200">
                  {isLoading ? (
                    <div className="flex justify-center items-center py-10">
                      <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-800 rounded-full animate-spin"></div>
                    </div>
                  ) : filteredFriends.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {filteredFriends.map(friend => {
                        const isSelected = selectedFriends.some(f => f.id === friend.id);
                        return (
                          <div 
                            key={friend.id}
                            className={`p-3 cursor-pointer transition-colors hover:bg-gray-50 flex items-center ${isSelected ? 'bg-gray-100' : ''}`}
                            onClick={() => toggleFriendSelection(friend)}
                          >
                            <div className="w-10 h-10 bg-gradient-to-r from-gray-600 to-gray-800 rounded-full flex items-center justify-center text-white font-medium mr-3">
                              {friend.name.substring(0, 1).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{friend.name}</div>
                              <div className="text-sm text-gray-500">@{friend.username}</div>
                            </div>
                            <div className="w-6 h-6 flex-shrink-0">
                              {isSelected ? (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-gray-800">
                                  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-400">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-5 text-center text-gray-500">
                      {searchQuery ? 'No matching friends found' : 'No friends available to add'}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    onClick={onClose}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-800"
                    onClick={handleAddMember}
                    disabled={selectedFriends.length === 0 || isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Adding...
                      </div>
                    ) : (
                      selectedFriends.length === 1 
                        ? 'Add Member' 
                        : `Add ${selectedFriends.length} Members`
                    )}
                  </button>
                </div>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default AddMemberModal; 