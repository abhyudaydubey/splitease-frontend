import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import FriendRequestsModal from './FriendRequestsModal';
import { fetchPendingFriendRequests } from '../utils/api.util';

interface NavbarProps {
  currency: string;
  setCurrency: (currency: string) => void;
  currencySymbols: Record<string, string>;
}

const Navbar: React.FC<NavbarProps> = ({ currency, setCurrency, currencySymbols }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showFriendRequestsModal, setShowFriendRequestsModal] = useState(false);
  const [friendRequestCount, setFriendRequestCount] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const friendRequestButtonRef = useRef<HTMLButtonElement | null>(null);
  const navigate = useNavigate();
  const { logout, userInfo } = useAuth();

  // Load friend requests count on component mount and periodically
  useEffect(() => {
    const fetchFriendRequests = async () => {
      try {
        const result = await fetchPendingFriendRequests();
        if (result.success && result.data.received) {
          setFriendRequestCount(result.data.received.length);
        }
      } catch (error) {
        console.error('Error fetching friend requests:', error);
      }
    };

    // Fetch immediately on mount
    fetchFriendRequests();
    
    // Fetch every minute
    const interval = setInterval(fetchFriendRequests, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Refetch friend requests when a request is handled
  const handleRequestChange = async () => {
    try {
      const result = await fetchPendingFriendRequests();
      if (result.success && result.data.received) {
        setFriendRequestCount(result.data.received.length);
      }
    } catch (error) {
      console.error('Error updating friend requests count:', error);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    // Set a flag to indicate this is a logout action
    sessionStorage.setItem('isLogoutAction', 'true');
    toast.success('Logged out successfully');
    logout();
    // Reset the flag after a short delay (after the navigation completes)
    setTimeout(() => {
      sessionStorage.removeItem('isLogoutAction');
    }, 1000);
  };

  // Get initials from username for avatar
  const getInitials = () => {
    if (!userInfo?.username) return '?';
    
    const username = userInfo.username;
    // Handle single word usernames
    if (!username.includes(' ')) {
      return username.substring(0, 2).toUpperCase();
    }
    
    // Handle multi-word usernames
    return username
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Generate a consistent color based on username
  const getAvatarColor = () => {
    if (!userInfo?.username) return 'from-blue-400 to-indigo-500';
    
    // Simple hash function for username to generate consistent colors
    const hash = userInfo.username.split('').reduce(
      (acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0
    );
    
    // List of gradient pairs
    const gradients = [
      'from-blue-400 to-indigo-500',
      'from-purple-400 to-pink-500',
      'from-green-400 to-emerald-500',
      'from-yellow-400 to-orange-500',
      'from-pink-400 to-rose-500',
      'from-teal-400 to-cyan-500',
      'from-red-400 to-rose-500',
      'from-amber-400 to-orange-500'
    ];
    
    // Use the hash to pick a consistent gradient
    return gradients[Math.abs(hash) % gradients.length];
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-gray-300 bg-white z-10 relative shadow-sm rounded-lg">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      <div className="flex items-center gap-4">
        {/* Friend Requests Button with Notification Badge */}
        <button 
          ref={friendRequestButtonRef}
          title="Friend Requests"
          className="relative p-2 text-gray-500 hover:text-indigo-500 transition-colors"
          onClick={() => setShowFriendRequestsModal(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          
          {friendRequestCount > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 flex items-center justify-center rounded-full text-xs font-medium">
              {friendRequestCount > 9 ? '9+' : friendRequestCount}
            </span>
          )}
        </button>

        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="border border-gray-300 text-sm rounded-md px-3 py-1 bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
        >
          {Object.keys(currencySymbols).map((cur) => (
            <option key={cur} value={cur}>
              {cur}
            </option>
          ))}
        </select>

        {/* Profile dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            title="Profile & Settings"
            className="flex items-center gap-2 rounded-full focus:outline-none"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
          >
            {/* User Avatar */}
            <div className={`w-9 h-9 rounded-full bg-gradient-to-r ${getAvatarColor()} flex items-center justify-center text-white font-medium text-sm shadow-md`}>
              {loading ? '...' : getInitials()}
            </div>
            
            {/* Username display removed */}
            {/* 
            {userInfo && (
              <span className="hidden md:flex items-center">
                <span className="text-sm font-medium text-gray-700 mr-1">{userInfo.username}</span>
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </span>
            )}
            */}
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl py-2 text-sm z-20">
              {userInfo && (
                <div className="px-4 py-2 border-b border-gray-100">
                  <div className="font-medium text-gray-800">{userInfo.username}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{userInfo.email}</div>
                </div>
              )}
              
              <button className="flex items-center w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors">
                <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                <span>Settings</span>
              </button>
              
              <button
                className="flex items-center w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors text-red-500"
                onClick={handleLogout}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                </svg>
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Friend Requests Modal */}
      <FriendRequestsModal 
        isOpen={showFriendRequestsModal}
        onClose={() => setShowFriendRequestsModal(false)}
        onRequestHandled={handleRequestChange}
        buttonRef={friendRequestButtonRef}
      />
    </header>
  );
};

export default Navbar;
