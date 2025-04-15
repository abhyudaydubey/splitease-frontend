import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import CreateGroupModal from '../components/CreateGroupModal';
import AddFriendModal from '../components/AddFriendModal';
import { toast } from 'react-hot-toast';
import { sendFriendRequest } from '../utils/api.util';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const [currency, setCurrency] = useState('INR');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const { userId } = useAuth();

  const currencySymbols: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
  };

  // Dummy data (replace with actual API later)
  const totalAmount = 1320;
  const isOwed = true;
  const recentGroups = ['Goa Trip', 'College Buddies', 'Flatmates'];
  const recentFriends = [
    { name: 'Riya', amount: 500 },
    { name: 'Aman', amount: -200 },
    { name: 'Lena', amount: 320 },
  ];

  return (
    <div className="flex min-h-screen bg-white text-gray-800">
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

        <main className="flex-1 p-6 bg-white">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <h2 className="text-2xl font-semibold mb-1">Your Overview</h2>
            <p className="text-sm text-gray-500">
              Manage all your groups, friends, and shared expenses.
            </p>
          </motion.div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {[
              { label: 'Add Expense', icon: '💸', action: () => {} },
              { label: 'Create Group', icon: '👥', action: () => setShowGroupModal(true) },
              { label: 'Add Friend', icon: '➕', action: () => setShowAddFriendModal(true) },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                className="p-4 bg-gray-50 border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition cursor-pointer"
                onClick={item.action}
              >
                <div className="text-3xl mb-2">{item.icon}</div>
                <div className="font-medium">{item.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Activity Feed */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-lg font-semibold mb-3">Recent Activity</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-500 italic">
              No recent activity. Start adding expenses or add friends to get going.
            </div>
          </motion.div>
        </main>
      </div>

      {/* Modals */}
      <CreateGroupModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
      />

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
    </div>
  );
};

export default Dashboard;
