import React from 'react';
// Import the Group type and motion from framer-motion
import { Group } from '../utils/api.util'; 
import { motion } from 'framer-motion';

interface SidebarProps {
  currency: string;
  totalAmount: number;
  isOwed: boolean;
  // Replace recentGroups with actual group state
  // recentGroups: { name: string; iconId?: string | null }[];
  groups: Group[] | null;
  groupsLoading: boolean;
  groupsError: string | null;
  // Keep recentFriends for now
  recentFriends: { name: string; amount: number }[];
  currencySymbols: Record<string, string>;
  onCreateGroup: () => void;
  // New props for animation
  newGroupId?: string | null;
  newGroupItemVariants?: Record<string, any>;
}

// Map icon IDs to SVG elements (or components)
// Ideally, this mapping lives in a shared place or icons are passed as components
const groupIconMap: Record<string, React.ReactNode> = {
  users: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-2 text-slate-500 flex-shrink-0"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 01-2.07-.654.78.78 0 01-.357.442 3 3 0 01-4.308-3.517 6.484 6.484 0 001.907 3.96 2.32 2.32 0 01-.026-.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18c-1.546 0-2.996-.47-4.247-1.268a.84.84 0 01-.449-.542z" /></svg>,
  home: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-2 text-slate-500 flex-shrink-0"><path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z" clipRule="evenodd" /></svg>,
  briefcase: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-2 text-slate-500 flex-shrink-0"><path fillRule="evenodd" d="M6 3.75A2.75 2.75 0 018.75 1h2.5A2.75 2.75 0 0114 3.75v.443c.57.055 1.14.122 1.706.2C17.053 4.582 18 5.75 18 7.168V14.5A2.5 2.5 0 0115.5 17h-11A2.5 2.5 0 012 14.5V7.168c0-1.418.947-2.586 2.294-2.775A13.68 13.68 0 016 4.193V3.75zm1.5 0V4.5a12.212 12.212 0 005 0V3.75a1.25 1.25 0 00-1.25-1.25h-2.5A1.25 1.25 0 007.5 3.75z" clipRule="evenodd" /></svg>,
  gift: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-2 text-slate-500 flex-shrink-0"><path d="M10 4a2 2 0 100-4 2 2 0 000 4zM6.75 6.368a.75.75 0 01.75-1.061 11.482 11.482 0 011.077-.277 11.486 11.486 0 011.38 0c.381.05.755.118 1.123.204a.75.75 0 11-.5 1.436 10.002 10.002 0 00-1.123-.204 10.004 10.004 0 00-1.38-.001 10.002 10.002 0 00-1.077.277.75.75 0 01-1.06-.75zM10 6a2 2 0 100-4 2 2 0 000 4zM4.75 9.368a.75.75 0 01.75-1.061 11.482 11.482 0 011.077-.277 11.486 11.486 0 011.38 0c.381.05.755.118 1.123.204a.75.75 0 11-.5 1.436 10.002 10.002 0 00-1.123-.204 10.004 10.004 0 00-1.38 0 10.002 10.002 0 00-1.077.277.75.75 0 01-1.06-.75z" /></svg>,
};
const defaultIcon = groupIconMap['users']; // Fallback icon

const Sidebar: React.FC<SidebarProps> = ({
  currency,
  totalAmount,
  isOwed,
  // Destructure new group props
  groups,
  groupsLoading,
  groupsError,
  recentFriends,
  currencySymbols,
  onCreateGroup,
  // Destructure new animation props with defaults
  newGroupId = null,
  newGroupItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }
}) => {
  return (
    <aside className="w-72 bg-gray-100 border-r border-gray-200 p-5 hidden md:flex flex-col">
      <div className="text-2xl font-bold tracking-tight text-gray-900 mb-6 pt-1">Splitease</div>

      {/* Make the main content area scrollable if sidebar itself gets too tall */}
      <div className="flex-1 space-y-5 overflow-y-auto flex flex-col min-h-0 pr-1">

        <div className="bg-white rounded-lg p-4 border border-gray-300 shadow-md flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-500 flex items-center">
              <span title="Summary" className="flex items-center mr-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-400">
                  <path d="M2.5 4A1.5 1.5 0 001 5.5V6h18v-.5A1.5 1.5 0 0017.5 4h-15z" />
                  <path fillRule="evenodd" d="M1 7v8.5A1.5 1.5 0 002.5 17h15a1.5 1.5 0 001.5-1.5V7H1zm4.5 4a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </span>
              SUMMARY
            </h3>
            <div title="This is your net balance across all groups and friends.">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.061-1.061 3 3 0 112.871 5.026v.345a.75.75 0 01-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 108.94 6.94zM10 15.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <p className={`text-lg font-bold ${isOwed ? 'text-green-600' : 'text-red-600'}`}>
            {isOwed ? 'You are owed:' : 'You owe:'}
            {isOwed ? ' +' : ' -'}{currencySymbols[currency]}
            {totalAmount.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-300 shadow-md flex flex-col flex-grow min-h-0">
          <h3 className="text-sm font-semibold text-gray-500 mb-2 flex items-center flex-shrink-0">
            <span title="Groups" className="flex items-center mr-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-400">
                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 01-2.07-.654.78.78 0 01-.357.442 3 3 0 01-4.308-3.517 6.484 6.484 0 001.907 3.96 2.32 2.32 0 01-.026-.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18c-1.546 0-2.996-.47-4.247-1.268a.84.84 0 01-.449-.542z" />
              </svg>
            </span>
            GROUPS
          </h3>
          {/* Scrollable container for the list */}
          <div className="overflow-y-auto flex-grow mb-3 max-h-60 pr-1"> 
            {groupsLoading ? (
              <p className="text-sm text-gray-500 px-2 py-1">Loading groups...</p>
            ) : groupsError ? (
              <p className="text-sm text-red-600 px-2 py-1">Error: {groupsError}</p>
            ) : groups && groups.length > 0 ? (
              <ul className="space-y-1 text-gray-700">
                {groups.map((group) => {
                  // Get the specific icon based on group.iconId, or use default
                  const iconToRender = group.iconId ? groupIconMap[group.iconId] : defaultIcon;
                  // Determine text color based on group status/balance
                  let balanceColor = 'text-gray-700'; // Default
                  let balancePrefix = '';
                  if (group.status === 'owe') {
                    balanceColor = 'text-red-600';
                    balancePrefix = '-';
                  } else if (group.status === 'owed') {
                    balanceColor = 'text-green-600';
                    balancePrefix = '+';
                  } // 'settled up' or other statuses remain default gray

                  // Check if this is the newly added group
                  const isNewGroup = newGroupId === group.id;

                  // Wrap with motion.li if it's the new group
                  return isNewGroup ? (
                    <motion.li 
                      key={group.id}
                      initial="hidden"
                      animate="visible"
                      variants={newGroupItemVariants}
                      className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-slate-100 cursor-pointer font-medium"
                      style={{ backgroundColor: '#f0f9ff' }} // Light blue highlight for the new group
                    >
                      <div className="flex items-center overflow-hidden mr-2">
                        {iconToRender || defaultIcon} 
                        <span className="truncate ml-1">{group.name}</span>
                      </div>
                      {group.status !== 'settled up' && group.amount !== 0 && (
                        <span className={`font-medium text-xs flex-shrink-0 ${balanceColor}`}>
                          {balancePrefix}{currencySymbols[currency]}{Math.abs(group.amount).toLocaleString()}
                        </span>
                      )}
                      {group.status === 'settled up' && (
                        <span className="font-medium text-xs text-gray-400 flex-shrink-0">
                          Settled up
                        </span>
                      )}
                    </motion.li>
                  ) : (
                    <li 
                      key={group.id}
                      className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-slate-100 cursor-pointer font-medium"
                    >
                      <div className="flex items-center overflow-hidden mr-2">
                        {iconToRender || defaultIcon} 
                        <span className="truncate ml-1">{group.name}</span>
                      </div>
                      {group.status !== 'settled up' && group.amount !== 0 && (
                        <span className={`font-medium text-xs flex-shrink-0 ${balanceColor}`}>
                          {balancePrefix}{currencySymbols[currency]}{Math.abs(group.amount).toLocaleString()}
                        </span>
                      )}
                      {group.status === 'settled up' && (
                        <span className="font-medium text-xs text-gray-400 flex-shrink-0">
                          Settled up
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-gray-400 italic px-2 py-1">No groups yet.</p>
            )}
          </div>
          {/* Create Group Button */}
          <button 
            onClick={onCreateGroup} 
            className="flex-shrink-0 w-full mt-auto flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1.5">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            Create Group
          </button>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-300 shadow-md flex-shrink-0">
          <h3 className="text-sm font-semibold text-gray-500 mb-2 flex items-center">
            <span title="Friends" className="flex items-center mr-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-400">
                <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.095a1.23 1.23 0 00.41-1.412A9.99 9.99 0 0010 12c-2.31 0-4.438.784-6.131 2.095z" />
              </svg>
            </span>
            FRIENDS
          </h3>
          <ul className="space-y-1.5 text-gray-700 max-h-40 overflow-y-auto pr-1">
            {recentFriends.map((friend, idx) => (
              <li 
                key={idx} 
                className={`flex justify-between items-center text-sm font-medium gap-2 p-2 rounded-md ${
                  friend.amount >= 0 ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                <span className={`truncate text-left ${friend.amount >= 0 ? 'text-green-900' : 'text-red-900'}`}> 
                  {friend.name}
                </span>
                <span
                  className={`font-medium flex-shrink-0 text-sm ${ 
                    friend.amount >= 0 ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {friend.amount >= 0 ? '+' : '-'}{currencySymbols[currency]}
                  {Math.abs(friend.amount).toLocaleString()}
                </span>
              </li>
            ))}
            {recentFriends.length === 0 && (
              <li className="text-sm text-gray-400 italic px-2 py-1">No friends yet.</li>
            )}
          </ul>
        </div>

      </div>
    </aside>
  );
};

export default Sidebar;
