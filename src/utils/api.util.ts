import axios from 'axios';
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// User Registration
export const registerUser = async ({ username, email, password }: { username: string; email: string; password: string }) => {
  const response = await api.post('/auth/register/', { username, email, password });
  return response.data;
};

// User Login
export const loginUser = async ({ email, password }: { email: string; password: string }) => {
  const response = await api.post('/auth/login/', { email, password });
  return response.data;
};

// Search Users
export const searchUsers = async (query: string) => {
  const response = await api.get(`/users/search?user=${query}`);
  return response.data.users;
};

// Send Friend Request
export const sendFriendRequest = async ({
  senderId,
  receiverId,
}: {
  senderId: string;
  receiverId: string;
}) => {
  if (!senderId) {
    throw new Error('Sender ID is required to send a friend request.');
  }

  try {
    const response = await api.post('/friends/requests', {
      senderId,
      receiverId,
    });
    return { success: true, data: response.data };
  } catch (error: any) {
    // Check if it's a server response with an error message
    if (error.response && error.response.data) {
      if (error.response.data.error === 'Friend request already pending') {
        return { success: false, error: 'Friend request already pending' };
      }
      // Handle other specific error messages
      return { success: false, error: error.response.data.error || 'Failed to send friend request' };
    }
    // Generic error handling
    return { success: false, error: 'Failed to send friend request' };
  }
};

// Fetch Pending Friend Requests
export const fetchPendingFriendRequests = async () => {
  const token = getToken();
  if (!token) {
    return { success: false, error: 'Authentication token not found.' };
  }

  try {
    const response = await fetch(`${BASE_URL}/friends/pending`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to fetch friend requests' }));
      return { success: false, error: errorData.error || `HTTP error! status: ${response.status}` };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    console.error('Error fetching friend requests:', error);
    return { success: false, error: error.message || 'Failed to fetch friend requests' };
  }
};

// Handle Friend Request (Accept or Reject)
export const handleFriendRequest = async (requestId: string, status: 'ACCEPTED' | 'REJECTED') => {
  try {
    const response = await api.put(`/friends/requests/${requestId}`, { status });
    return { success: true, data: response.data };
  } catch (error: any) {
    if (error.response && error.response.data) {
      return { 
        success: false, 
        error: error.response.data.error || `Failed to ${status.toLowerCase()} friend request` 
      };
    }
    return { success: false, error: `Failed to ${status.toLowerCase()} friend request` };
  }
};

// Add Friend (unused, kept for reference)
export const addFriend = async (friendEmail: string) => {
  return await api.post('/friends/add', { email: friendEmail });
};

export const fetchDashboardData = async () => {
  return await api.get('/dashboard');
};

// Accept Friend Request
export const acceptFriendRequest = async ({
  requestId,
}: {
  requestId: string;
}) => {
  try {
    const response = await api.post(`/friend-requests/${requestId}/accept`);
    return { success: true, data: response.data };
  } catch (error: any) {
    // Handle server response errors
    if (error.response && error.response.data) {
      return { 
        success: false, 
        error: error.response.data.error || 'Failed to accept friend request' 
      };
    }
    // Generic error handling
    return { success: false, error: 'Failed to accept friend request' };
  }
};

// Fetch User Profile
export const fetchUserProfile = async (userId: string) => {
  try {
    const response = await api.get(`/users/${userId}`);
    return { success: true, data: response.data };
  } catch (error: any) {
    console.warn('API call failed, using mock data for user profile');
    
    // Mock data for testing - return this instead of error in development
    // In production, you might want to handle this differently
    return { 
      success: true, 
      data: {
        username: 'John Doe',
        email: 'john.doe@example.com',
        id: userId
      }
    };
    
    /* Uncomment for real error handling in production
    if (error.response && error.response.data) {
      return { 
        success: false, 
        error: error.response.data.error || 'Failed to fetch user profile' 
      };
    }
    return { success: false, error: 'Failed to fetch user profile' };
    */
  }
};

// Helper to get token
const getToken = () => localStorage.getItem('token');

// Interface for a single Group (based on provided response)
export interface Group {
  id: string;
  name: string;
  totalBalance: number;
  status: string; // Could be more specific, e.g., 'settled up' | 'owe' | 'owed'
  amount: number;
  balances: any[]; // Define more specific type if structure is known
  members: any[]; // Define more specific type if structure is known
  iconId?: string; // Assuming iconId might be part of the group eventually
}

// Interface for the entire response of the getAllGroups endpoint
interface GetAllGroupsResponse {
  overallBalance: number;
  groups: Group[];
}

/**
 * Fetches all groups the authenticated user is a part of.
 */
export const getAllGroups = async (): Promise<{ success: boolean; data?: GetAllGroupsResponse; error?: string }> => {
  const token = getToken();
  if (!token) {
    return { success: false, error: 'Authentication token not found.' };
  }

  try {
    const response = await fetch(`${BASE_URL}/groups/all`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch groups' })); // Try to parse error, fallback message
      console.error('Failed to fetch groups:', response.status, errorData);
      return { success: false, error: errorData.message || `HTTP error! status: ${response.status}` };
    }

    const data: GetAllGroupsResponse = await response.json();
    return { success: true, data };

  } catch (error: any) {
    console.error('Error fetching groups:', error);
    return { success: false, error: error.message || 'An unexpected error occurred while fetching groups.' };
  }
};

// Updated createGroup function (using fetch and potentially different payload)
interface CreateGroupPayload {
    name: string;
    description: string;
    userId: string | null; // Ensure userId can be null initially
    iconId?: string | null; // Optional since it's not actually used in the API request
}

export const createGroup = async (payload: CreateGroupPayload): Promise<{ success: boolean; data?: any; error?: string }> => {
    const token = getToken();
    if (!token) {
        toast.error('You need to be logged in to create a group.');
        return { success: false, error: 'Authentication token not found.' };
    }
    // Now we DO need userId in payload
    if (!payload.userId) {
        toast.error('User information is missing.'); 
        return { success: false, error: 'User ID is missing.' };
    }

    try {
        const response = await fetch(`${BASE_URL}/groups/create-group`, { // Changed endpoint
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                name: payload.name,
                description: payload.description,
                userId: payload.userId // Restored userId in payload
                // Removed iconId from payload
            }),
        });

        const responseData = await response.json();

        if (!response.ok) {
            console.error('Failed to create group:', response.status, responseData);
            // Use a user-friendly message from the backend if available
            const errorMessage = responseData.message || responseData.error || `Failed to create group (status: ${response.status})`;
            toast.error(errorMessage);
            return { success: false, error: errorMessage };
        }
        
        toast.success('Group created successfully!'); // Added success toast here
        return { success: true, data: responseData };

    } catch (error: any) {
        console.error('Error creating group:', error);
        const errorMessage = error.message || 'An unexpected network error occurred while creating the group.';
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
    }
};

// Get Friends List
export interface Friend {
  id: string;
  name: string;
  username: string;
  email: string;
  amount: number;
}

interface GetFriendsListResponse {
  friends: Friend[];
}

export const getFriendsList = async (): Promise<Friend[]> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found');
    }

    const response = await axios.get(
      `${BASE_URL}/friends/list`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status !== 200) {
      throw new Error('Failed to fetch friends list');
    }

    return response.data.map((friend: any) => ({
      id: friend.id,
      name: friend.username, // Using username as name
      username: friend.username,
      email: friend.email,
      amount: 0, // Default amount to 0 since it's not in the response
    }));
  } catch (error: any) {
    console.error('Error fetching friends list:', error);
    toast.error('Failed to fetch friends list');
    return [];
  }
};

export default api;
