import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import CreateGroupModal from '../components/CreateGroupModal';
import AddFriendModal from '../components/AddFriendModal';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'Overview' | 'Expenses' | 'Balances'>('Overview');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  
  // Dummy currency for rendering (the real state is in MainLayout)
  const currency = 'INR';
  const currencySymbols: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
  };

  // Dummy data for Balances tab (replace later)
  const usersOwedTo = [{ name: 'Alice', amount: 350 }, { name: 'Bob', amount: 120 }];
  const usersOwedBy = [{ name: 'Charlie', amount: 80 }];
  
  // Dummy data for Overview
  const totalAmount = 1320;
  const isOwed = true;
  
  // Action handlers
  const handleAddExpense = () => { toast.error('Add Expense not implemented yet.'); };
  const handleCreateGroup = () => setShowGroupModal(true);
  const handleAddFriend = () => setShowAddFriendModal(true);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Expenses':
        return (
          <div key="expenses" className="animate-fadeIn">
            <h2 className="text-xl font-semibold mb-4">Expenses</h2>
            {/* Placeholder for filter */}
            <div className="mb-4 p-3 bg-gray-100 rounded-md text-sm text-gray-600">
              Filter by Group: [All Groups]
            </div>
            {/* Placeholder for expense list */}
            <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
              <p className="text-gray-500">Expense list placeholder...</p>
            </div>
          </div>
        );
      case 'Balances':
        return (
          <div key="balances" className="animate-fadeIn">
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
          </div>
        );
      case 'Overview':
      default:
        return (
          <div key="overview" className="animate-fadeIn">
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
            <div className="animate-fadeIn">
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
            </div>
          </div>
        );
    }
  };

  return (
    <div className="p-8 relative">
      {/* Container for Tabs */}
      <div className="mb-6 border-b border-gray-200 mt-4"> 
        <nav className="flex space-x-6" aria-label="Tabs">
          {/* Tab Buttons */}
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
      <div className="tab-content">
        {renderTabContent()}
      </div>

      {/* Create Group Modal */}
      {showGroupModal && (
        <CreateGroupModal 
          isOpen={showGroupModal} 
          onClose={() => setShowGroupModal(false)} 
          onGroupCreated={(data) => {
            setShowGroupModal(false);
            toast.success(`Group "${data.name}" created!`);
          }}
        />
      )}

      {/* Add Friend Modal */}
      {showAddFriendModal && (
        <AddFriendModal
          isOpen={showAddFriendModal}
          onClose={() => setShowAddFriendModal(false)}
          onAdd={async (receiverId: string) => {
            setShowAddFriendModal(false);
            toast.success('Friend request sent!');
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;

