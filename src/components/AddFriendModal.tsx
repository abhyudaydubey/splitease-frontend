import React, { useEffect, useState, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { searchUsers, sendFriendRequest, acceptFriendRequest } from '../utils/api.util';
import { debounce } from 'lodash';
import { toast } from 'react-hot-toast';
import { decodeToken } from '../utils/tokenDecoder';

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd?: (receiverId: string) => Promise<void>;
  onFriendAdded?: () => void;
}

type RelationshipStatus = 'FRIENDS' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'NOT_CONNECTED';

interface User {
  id: string;
  username: string;
  email: string;
  relationshipStatus: RelationshipStatus;
}

const AddFriendModal: React.FC<AddFriendModalProps> = ({ isOpen, onClose, onAdd, onFriendAdded }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [sendingRequestId, setSendingRequestId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [acceptingRequestId, setAcceptingRequestId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const id = decodeToken(token || '');
    setUserId(id);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      // Try focusing immediately
      searchInputRef.current.focus();
      
      // Also try after a short delay (for modal animations)
      const timer1 = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      
      // And once more with a longer delay as a fallback
      const timer2 = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [isOpen]);
  
  // When modal is fully mounted, try focusing again with afterEnter
  const handleAfterEnter = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const debouncedSearch = debounce(async (q: string) => {
    if (!q || q.trim() === '') {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await searchUsers(q);
      setResults(data || []);
    } catch (err) {
      toast.error('Failed to search users.');
    } finally {
      setLoading(false);
    }
  }, 300);

  useEffect(() => {
    // Clear results immediately when query becomes empty
    if (!query || query.trim() === '') {
      setResults([]);
      setLoading(false);
    } else {
      debouncedSearch(query);
    }
    // Cleanup function to cancel debounced search when component unmounts
    return () => {
      debouncedSearch.cancel();
    };
  }, [query]);

  // Reset search when modal is opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setLoading(false);
    }
  }, [isOpen]);

  const handleAddFriend = async (receiverId: string) => {
    if (!userId) {
      toast.error('Failed to retrieve user ID. Please log in again.');
      return;
    }

    setSendingRequestId(receiverId);
    try {
      if (onAdd) {
        await onAdd(receiverId);
      } else {
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
      }
      
      setResults(prevResults => 
        prevResults.map(user => 
          user.id === receiverId ? { ...user, relationshipStatus: 'REQUEST_SENT' } : user
        )
      );
      
      setPendingIds((prev) => [...prev, receiverId]);
      onFriendAdded?.();
    } catch (err) {
      // Error is already handled above
    } finally {
      setSendingRequestId(null);
    }
  };

  const handleAcceptRequest = async (userId: string) => {
    setAcceptingRequestId(userId);
    try {
      // In a real implementation, you'll need the actual request ID
      // For now, assuming the user ID is enough for the demo
      const result = await acceptFriendRequest({ requestId: userId });
      if (!result.success) {
        toast.error(result.error || 'Failed to accept friend request');
        return;
      }
      
      toast.success('Friend request accepted!');
      
      // Update the local state to show the user as a friend
      setResults(prevResults => 
        prevResults.map(user => 
          user.id === userId ? { ...user, relationshipStatus: 'FRIENDS' } : user
        )
      );
      
      onFriendAdded?.();
    } catch (error) {
      toast.error('Failed to accept friend request');
    } finally {
      setAcceptingRequestId(null);
    }
  };

  const isPending = (id: string) => pendingIds.includes(id);

  const handleClose = () => {
    setQuery('');
    setResults([]);
    setLoading(false);
    setSendingRequestId(null);
    setAcceptingRequestId(null);
    debouncedSearch.cancel(); // Cancel any pending debounced search
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment} afterEnter={handleAfterEnter}>
      <Dialog as="div" className="relative z-20" onClose={handleClose} initialFocus={searchInputRef}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center px-4 py-8">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all relative">
                {/* Close button */}
                <button
                  onClick={handleClose}
                  className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                >
                  <span className="text-xl font-bold">&times;</span>
                </button>

                <Dialog.Title as="h3" className="text-lg font-semibold text-gray-800 mb-3">
                  Add a Friend
                </Dialog.Title>

                <input
                  type="text"
                  placeholder="Search by username or email..."
                  className="w-full px-3 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  ref={searchInputRef}
                  autoFocus
                />

                <div className="h-52 overflow-y-auto space-y-3 pr-1 custom-scroll">
                  {loading ? (
                    <div className="text-gray-500 italic">Searching...</div>
                  ) : !query || query.trim() === '' ? (
                    <div className="text-gray-400 italic text-center">
                      <div>Type to search for users</div>
                      <div className="text-xs mt-1">Search by username or email</div>
                    </div>
                  ) : results.length === 0 ? (
                    <div className="text-gray-400 italic">No users found.</div>
                  ) : (
                    results.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2 bg-gray-50"
                      >
                        <div>
                          <div className="font-medium text-gray-700">{user.username}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>

                        {user.relationshipStatus === 'FRIENDS' ? (
                          <span className="px-3 py-1 text-sm font-medium rounded-lg bg-green-100 text-green-700">
                            Friends
                          </span>
                        ) : user.relationshipStatus === 'REQUEST_SENT' || isPending(user.id) ? (
                          <span className="px-3 py-1 text-sm font-medium rounded-lg bg-yellow-100 text-yellow-700">
                            Pending
                          </span>
                        ) : user.relationshipStatus === 'REQUEST_RECEIVED' ? (
                          <button
                            onClick={() => handleAcceptRequest(user.id)}
                            disabled={acceptingRequestId === user.id}
                            className={`px-3 py-1 text-sm font-medium rounded-lg transition ${
                              acceptingRequestId === user.id
                                ? 'bg-blue-300 text-blue-600 cursor-not-allowed'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}
                          >
                            {acceptingRequestId === user.id ? 'Accepting...' : 'Accept Request'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAddFriend(user.id)}
                            disabled={sendingRequestId === user.id}
                            className={`px-3 py-1 text-sm font-medium rounded-lg transition ${
                              sendingRequestId === user.id
                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                : 'bg-gray-800 text-white hover:bg-gray-700'
                            }`}
                          >
                            {sendingRequestId === user.id ? 'Sending...' : 'Add'}
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default AddFriendModal;
