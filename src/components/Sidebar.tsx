import React from 'react';

interface SidebarProps {
  currency: string;
  totalAmount: number;
  isOwed: boolean;
  recentGroups: string[];
  recentFriends: { name: string; amount: number }[];
  currencySymbols: Record<string, string>;
}

const Sidebar: React.FC<SidebarProps> = ({
  currency,
  totalAmount,
  isOwed,
  recentGroups,
  recentFriends,
  currencySymbols,
}) => {
  return (
    <aside className="w-72 bg-gray-50 border-r border-gray-200 p-6 hidden md:flex flex-col gap-6">
      <div className="text-2xl font-bold tracking-tight text-gray-900 mb-4">Splitease</div>

      <div className="text-sm text-gray-700 space-y-6">
        <div>
          <h3 className="font-semibold text-gray-800 mb-1">💸 Summary</h3>
          <p className="text-lg font-bold">
            {isOwed ? 'You are owed' : 'You owe'} {currencySymbols[currency]}{' '}
            {totalAmount.toLocaleString()}
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-gray-800 mb-1">👥 Groups</h3>
          <ul className="list-disc list-inside text-gray-600">
            {recentGroups.map((group, idx) => (
              <li key={idx}>{group}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-gray-800 mb-1">🧑‍🤝‍🧑 Friends</h3>
          <ul className="space-y-1 text-gray-600">
            {recentFriends.map((friend, idx) => (
              <li key={idx} className="flex justify-between">
                <span>{friend.name}</span>
                <span
                  className={`text-sm ${
                    friend.amount >= 0 ? 'text-green-600' : 'text-red-500'
                  }`}
                >
                  {friend.amount >= 0 ? '+' : '-'}{currencySymbols[currency]}
                  {Math.abs(friend.amount)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
