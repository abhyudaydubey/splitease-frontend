import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchPendingFriendRequests, handleFriendRequest } from '../utils/api.util';
import { toast } from 'react-hot-toast';

interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: string;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    email: string;
  };
}

interface FriendRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestHandled?: () => void;
  buttonRef: React.RefObject<HTMLButtonElement>;
}

const ITEMS_PER_PAGE = 5;

const FriendRequestsModal: React.FC<FriendRequestsModalProps> = ({ 
  isOpen, 
  onClose,
  onRequestHandled,
  buttonRef 
}) => {
  const [allRequests, setAllRequests] = useState<FriendRequest[]>([]);
  const [visibleRequests, setVisibleRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const [modalPosition, setModalPosition] = useState({ top: 0, right: 0 });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const observer = useRef<IntersectionObserver | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastItemRef = useCallback((node: HTMLDivElement) => {
    if (loadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreRequests();
      }
    }, { threshold: 1.0 });
    
    if (node) observer.current.observe(node);
  }, [loadingMore, hasMore]);
  
  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setAllRequests([]);
      setVisibleRequests([]);
      setPage(1);
      setHasMore(true);
      loadFriendRequests();
      calculatePosition();
    }
  }, [isOpen]);
  
  const calculatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setModalPosition({
        top: rect.bottom + 10,
        right: window.innerWidth - rect.right
      });
    }
  };
  
  // Recalculate position on window resize
  useEffect(() => {
    const handleResize = () => {
      if (isOpen) {
        calculatePosition();
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);
  
  const loadFriendRequests = async () => {
    setLoading(true);
    try {
      const result = await fetchPendingFriendRequests();
      if (result.success && result.data.received) {
        const receivedRequests = result.data.received;
        setAllRequests(receivedRequests);
        
        // Load initial batch
        const initialBatch = receivedRequests.slice(0, ITEMS_PER_PAGE);
        setVisibleRequests(initialBatch);
        setHasMore(receivedRequests.length > ITEMS_PER_PAGE);
      } else {
        toast.error(result.error || 'Failed to load friend requests');
      }
    } catch (error) {
      console.error('Error loading friend requests:', error);
      toast.error('An error occurred while loading friend requests');
    } finally {
      setLoading(false);
    }
  };
  
  const loadMoreRequests = () => {
    if (!hasMore || loadingMore) return;
    
    setLoadingMore(true);
    
    // Calculate next page of requests
    const nextPage = page + 1;
    const start = (nextPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const nextBatch = allRequests.slice(start, end);
    
    if (nextBatch.length > 0) {
      // Add small delay to simulate loading from server
      setTimeout(() => {
        setVisibleRequests(prev => [...prev, ...nextBatch]);
        setPage(nextPage);
        setHasMore(end < allRequests.length);
        setLoadingMore(false);
      }, 300);
    } else {
      setHasMore(false);
      setLoadingMore(false);
    }
  };
  
  const handleRequest = async (requestId: string, status: 'ACCEPTED' | 'REJECTED') => {
    setProcessingIds(prev => [...prev, requestId]);
    try {
      const result = await handleFriendRequest(requestId, status);
      if (result.success) {
        toast.success(`Friend request ${status.toLowerCase()}`);
        
        // Remove the handled request from both lists
        const updatedAllRequests = allRequests.filter(req => req.id !== requestId);
        const updatedVisibleRequests = visibleRequests.filter(req => req.id !== requestId);
        
        setAllRequests(updatedAllRequests);
        setVisibleRequests(updatedVisibleRequests);
        
        // If we've removed a visible request, try to load another one
        if (updatedVisibleRequests.length < visibleRequests.length && updatedAllRequests.length > updatedVisibleRequests.length) {
          const nextItemIndex = visibleRequests.length;
          if (updatedAllRequests[nextItemIndex]) {
            setVisibleRequests(prev => [...prev, updatedAllRequests[nextItemIndex]]);
          }
        }
        
        // Update hasMore state
        setHasMore(updatedAllRequests.length > updatedVisibleRequests.length);
        
        if (onRequestHandled) {
          onRequestHandled();
        }
      } else {
        toast.error(result.error || `Failed to ${status.toLowerCase()} request`);
      }
    } catch (error) {
      console.error(`Error ${status.toLowerCase()} friend request:`, error);
      toast.error(`An error occurred while ${status.toLowerCase()}ing the request`);
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== requestId));
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - transparent near the modal */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-40"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed z-50 w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden"
            style={{ 
              top: `${modalPosition.top}px`, 
              right: `${modalPosition.right}px`,
              maxWidth: '380px'
            }}
          >
            {/* Arrow pointing to the notification button */}
            <div 
              className="absolute w-4 h-4 bg-gray-50 rotate-45 transform"
              style={{ top: '-8px', right: '19px' }}
            />
            
            <div className="p-5 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Friend Requests</h3>
                <button 
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div ref={scrollContainerRef} className="p-5 max-h-[60vh] overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-6">
                  <div className="w-8 h-8 border-4 border-gray-300 border-t-indigo-500 rounded-full animate-spin"></div>
                </div>
              ) : allRequests.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <p>No pending friend requests</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {visibleRequests.map((request, index) => (
                    <motion.div 
                      key={request.id} 
                      className="p-4 bg-gray-50 border border-gray-200 rounded-lg"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0, padding: 0 }}
                      layout
                      ref={index === visibleRequests.length - 1 ? lastItemRef : null}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                          {request.sender.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-800 truncate">{request.sender.username}</div>
                          <div className="text-xs text-gray-500 truncate">{request.sender.email}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            {formatDate(request.createdAt)}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-sm font-medium hover:bg-gray-300 transition disabled:opacity-50"
                            onClick={() => handleRequest(request.id, 'REJECTED')}
                            disabled={processingIds.includes(request.id)}
                          >
                            Reject
                          </button>
                          <button
                            className="px-3 py-1.5 bg-indigo-500 text-white rounded text-sm font-medium hover:bg-indigo-600 transition disabled:opacity-50"
                            onClick={() => handleRequest(request.id, 'ACCEPTED')}
                            disabled={processingIds.includes(request.id)}
                          >
                            Accept
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* Loading indicator for infinite scroll */}
                  {loadingMore && (
                    <div className="flex justify-center py-3">
                      <div className="w-6 h-6 border-3 border-gray-300 border-t-indigo-500 rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FriendRequestsModal; 