import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import CreateGroupModal from '../components/CreateGroupModal';
import AddFriendModal from '../components/AddFriendModal';
import { toast } from 'react-hot-toast';
import { sendFriendRequest, searchUsers, createGroup } from '../utils/api.util';
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
// --- End of Dashboard Variants ---

const Dashboard: React.FC = () => {
  const [currency, setCurrency] = useState('INR');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const { userId, isLoading } = useAuth();

  const currencySymbols: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
  };

  // Dummy data (replace with actual API later)
  const totalAmount = 1320;
  const isOwed = true;
  const recentGroups = [
    { name: 'Goa Trip', iconId: 'gift' }, 
    { name: 'College Buddies', iconId: 'users' }, 
    { name: 'Flatmates', iconId: 'home' },
    { name: 'Office Lunch', iconId: 'briefcase' }
  ];
  const recentFriends = [
    { name: 'Riya', amount: 500 },
    { name: 'Aman', amount: -200 },
    { name: 'Lena', amount: 320 },
  ];

  // Show a loading spinner based on the AuthContext's loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Action cards data - Use neutral colors for icons
  const actionCards = [
    {
      label: 'Add Expense',
      icon: ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
        <path d="M12 7.5a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" />
        <path fillRule="evenodd" d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 011.5 14.625v-9.75zM8.25 9.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM18.75 9a.75.75 0 00-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 00.75-.75V9.75a.75.75 0 00-.75-.75h-.008zM4.5 9.75A.75.75 0 015.25 9h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H5.25a.75.75 0 01-.75-.75V9.75z" clipRule="evenodd" />
        <path d="M2.25 18a.75.75 0 000 1.5c5.4 0 10.63.722 15.6 2.075 1.19.324 2.4-.558 2.4-1.82V18.75a.75.75 0 00-.75-.75H2.25z" />
      </svg> ),
      color: "bg-gray-100", // Changed from blue-50
      textColor: "text-gray-700", // Changed from blue-700
      action: () => { toast.error('Add Expense functionality not implemented yet.'); }
    },
    {
      label: 'Create Group',
      icon: ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
        <path fillRule="evenodd" d="M8.25 6.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM15.75 9.75a3 3 0 116 0 3 3 0 01-6 0zM2.25 9.75a3 3 0 116 0 3 3 0 01-6 0zM6.31 15.117A6.745 6.745 0 0112 12a6.745 6.745 0 016.709 7.498.75.75 0 01-.372.568A12.696 12.696 0 0112 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 01-.372-.568 6.787 6.787 0 011.019-4.38z" clipRule="evenodd" />
        <path d="M5.082 14.254a8.287 8.287 0 00-1.308 5.135 9.687 9.687 0 01-1.764-.44l-.115-.04a.563.563 0 01-.373-.487l-.01-.121a3.75 3.75 0 013.57-4.047zM20.226 19.389a8.287 8.287 0 00-1.308-5.135 3.75 3.75 0 013.57 4.047l-.01.121a.563.563 0 01-.373.486l-.115.04c-.567.2-1.156.349-1.764.441z" />
      </svg> ),
      color: "bg-gray-100", // Changed from purple-50
      textColor: "text-gray-700", // Changed from purple-700
      action: () => setShowGroupModal(true)
    },
    {
      label: 'Add Friend',
      icon: ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
        <path d="M6.25 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM3.25 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM19.75 7.5a.75.75 0 00-1.5 0v2.25H16a.75.75 0 000 1.5h2.25v2.25a.75.75 0 001.5 0v-2.25H22a.75.75 0 000-1.5h-2.25V7.5z" />
      </svg> ),
      color: "bg-gray-100", // Changed from green-50
      textColor: "text-gray-700", // Changed from green-700
      action: () => setShowAddFriendModal(true)
    }
  ];

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
        recentGroups={recentGroups}
        recentFriends={recentFriends}
        currencySymbols={currencySymbols}
      />

      <div className="flex-1 flex flex-col">
        <Navbar
          currency={currency}
          setCurrency={setCurrency}
          currencySymbols={currencySymbols}
        />

        <motion.main 
          className="flex-1 p-8 overflow-y-auto"
          variants={mainContentVariants}
          initial="initial"
          animate="animate"
        >
          <motion.div
            variants={headerVariants}
            initial="initial"
            animate="animate"
            className="mb-10"
          >
            <h2 className="text-3xl font-semibold text-gray-800">
              Welcome back!
            </h2>
            <p className="text-base text-gray-500 mt-1">
              Here's your financial overview for today.
            </p>
          </motion.div>

          <motion.div
            variants={cardsContainerVariants}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
          >
            {actionCards.map((item, idx) => (
              <motion.div
                key={idx}
                variants={cardItemVariants}
                initial="initial"
                animate="animate"
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-lg p-5 shadow-md border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 ease-out cursor-pointer overflow-hidden"
                onClick={item.action}
              >
                <div className={`flex items-center`}>
                  <div className={`flex-shrink-0 w-11 h-11 rounded-lg ${item.color} flex items-center justify-center ${item.textColor} mr-4`}>
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800 text-base">{item.label}</h3>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            variants={activityFeedVariants}
            initial="initial"
            animate="animate"
          >
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
        </motion.main>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showGroupModal && (
          <CreateGroupModal
            isOpen={showGroupModal}
            onClose={() => setShowGroupModal(false)}
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

