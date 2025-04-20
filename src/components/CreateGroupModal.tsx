import React, { useState } from 'react';
import { createGroup } from '../utils/api.util';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

// --- Sample Icons (Replace with your actual icons/logic) ---
const defaultGroupIcons = [
  { id: 'users', svg: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 01-2.07-.654.78.78 0 01-.357.442 3 3 0 01-4.308-3.517 6.484 6.484 0 001.907 3.96 2.32 2.32 0 01-.026-.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18c-1.546 0-2.996-.47-4.247-1.268a.84.84 0 01-.449-.542z" /></svg> },
  { id: 'home', svg: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z" clipRule="evenodd" /></svg> },
  { id: 'briefcase', svg: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M6 3.75A2.75 2.75 0 018.75 1h2.5A2.75 2.75 0 0114 3.75v.443c.57.055 1.14.122 1.706.2C17.053 4.582 18 5.75 18 7.168V14.5A2.5 2.5 0 0115.5 17h-11A2.5 2.5 0 012 14.5V7.168c0-1.418.947-2.586 2.294-2.775A13.68 13.68 0 016 4.193V3.75zm1.5 0V4.5a12.212 12.212 0 005 0V3.75a1.25 1.25 0 00-1.25-1.25h-2.5A1.25 1.25 0 007.5 3.75z" clipRule="evenodd" /></svg> },
  { id: 'gift', svg: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10 4a2 2 0 100-4 2 2 0 000 4zM6.75 6.368a.75.75 0 01.75-1.061 11.482 11.482 0 011.077-.277 11.486 11.486 0 011.38 0c.381.05.755.118 1.123.204a.75.75 0 11-.5 1.436 10.002 10.002 0 00-1.123-.204 10.004 10.004 0 00-1.38-.001 10.002 10.002 0 00-1.077.277.75.75 0 01-1.06-.75zM10 6a2 2 0 100-4 2 2 0 000 4zM4.75 9.368a.75.75 0 01.75-1.061 11.482 11.482 0 011.077-.277 11.486 11.486 0 011.38 0c.381.05.755.118 1.123.204a.75.75 0 11-.5 1.436 10.002 10.002 0 00-1.123-.204 10.004 10.004 0 00-1.38 0 10.002 10.002 0 00-1.077.277.75.75 0 01-1.06-.75z" /></svg> },
  // Add more icons as needed
];

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated?: (newGroup?: any) => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose, onGroupCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState<string | null>(defaultGroupIcons[0].id);
  const { userId } = useAuth();

  // Find the SVG element for the currently selected icon
  const currentIconSvg = defaultGroupIcons.find(icon => icon.id === selectedIcon)?.svg || defaultGroupIcons[0].svg;

  const handleClose = () => {
    setName('');
    setDescription('');
    setSelectedIcon(defaultGroupIcons[0].id);
    setLoading(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Group name is required');
      return;
    }
    
    if (!userId) {
      toast.error('You must be logged in to create a group');
      return;
    }
    
    setLoading(true);

    try {
      const result = await createGroup({ 
        name: name.trim(), 
        description: description.trim() || '', 
        userId,
        iconId: null
      });
      
      if (!result.success) {
        toast.error(result.error || 'Failed to create group');
        setLoading(false);
        return;
      }
      
      toast.success('Group created successfully!');
      onGroupCreated?.(result.data);
      handleClose();
    } catch (error: any) {
      console.error('Error creating group:', error);
      toast.error('Failed to create group');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95, y: -10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden"
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center">
            <div className="bg-gray-100 p-2 rounded-lg mr-3">
               <span className="text-gray-500">
                 {currentIconSvg}
               </span>
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Create New Group</h2>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <input
            type="text"
            placeholder="Group Name (e.g., Goa Trip)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 transition-all shadow-sm"
          />
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-gray-400 transition-all shadow-sm"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Choose an icon:</label>
            <div className="grid grid-cols-6 gap-2">
              {defaultGroupIcons.map(icon => (
                <button
                  key={icon.id}
                  type="button"
                  onClick={() => setSelectedIcon(icon.id)}
                  className={`p-2 rounded-lg border-2 flex items-center justify-center transition-colors duration-150 ${selectedIcon === icon.id ? 'border-gray-800 bg-gray-100' : 'border-transparent hover:bg-gray-100'}`}
                  aria-label={`Select ${icon.id} icon`}
                >
                  <span className={`${selectedIcon === icon.id ? 'text-gray-800' : 'text-gray-500'}`}>
                     {icon.svg}
                  </span>
                </button>
              ))}
               <button
                 type="button"
                 onClick={() => toast.error('Custom icon upload not implemented yet.')}
                 className="p-2 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:border-gray-400 transition-colors duration-150"
                 title="Upload custom icon (not implemented)"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                   <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
                   <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                 </svg>
               </button>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 text-sm font-medium rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default CreateGroupModal;
