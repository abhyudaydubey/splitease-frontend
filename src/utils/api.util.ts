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

// Interface for the detailed group response
export interface GroupDetails {
  id: string;
  name: string;
  totalBalance: number;
  balanceText: string;
  individualBalances: any[];
  expensesByMonth: Record<string, any>;
  members: {
    id: string;
    username: string;
  }[];
}

/**
 * Fetches details for a specific group
 * @param groupId - The ID of the group to fetch
 */
export const getGroupDetails = async (groupId: string): Promise<{ success: boolean; data?: GroupDetails; error?: string }> => {
  const token = getToken();
  if (!token) {
    return { success: false, error: 'Authentication token not found.' };
  }

  try {
    const response = await fetch(`${BASE_URL}/groups/${groupId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch group details' }));
      console.error('Failed to fetch group details:', response.status, errorData);
      return { success: false, error: errorData.message || `HTTP error! status: ${response.status}` };
    }

    const data: GroupDetails = await response.json();
    return { success: true, data };

  } catch (error: any) {
    console.error('Error fetching group details:', error);
    return { success: false, error: error.message || 'An unexpected error occurred while fetching group details.' };
  }
};

/**
 * Adds a member to a group
 * @param groupId - The ID of the group to add a member to
 * @param userId - The ID of the user to add to the group
 */
export const addMemberToGroup = async (groupId: string, userId: string): Promise<{ success: boolean; data?: any; error?: string }> => {
  const token = getToken();
  if (!token) {
    return { success: false, error: 'Authentication token not found.' };
  }

  try {
    const response = await fetch(`${BASE_URL}/groups/${groupId}/add-member`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ userId, groupId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to add member to group' }));
      console.error('Failed to add member:', response.status, errorData);
      return { success: false, error: errorData.message || `HTTP error! status: ${response.status}` };
    }

    const data = await response.json();
    return { success: true, data };

  } catch (error: any) {
    console.error('Error adding member to group:', error);
    return { success: false, error: error.message || 'An unexpected error occurred while adding member to group.' };
  }
};

/**
 * Adds multiple members to a group at once
 * @param groupId - The ID of the group to add members to
 * @param userIds - Array of user IDs to add to the group
 */
export const addMembersToGroup = async (groupId: string, userIds: string[]): Promise<{ success: boolean; data?: any; error?: string }> => {
  const token = getToken();
  if (!token) {
    return { success: false, error: 'Authentication token not found.' };
  }

  try {
    const response = await fetch(`${BASE_URL}/groups/${groupId}/add-member`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ userIds, groupId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to add members to group' }));
      console.error('Failed to add members:', response.status, errorData);
      return { success: false, error: errorData.message || `HTTP error! status: ${response.status}` };
    }

    const data = await response.json();
    return { success: true, data };

  } catch (error: any) {
    console.error('Error adding members to group:', error);
    return { success: false, error: error.message || 'An unexpected error occurred while adding members to group.' };
  }
};

// Interface for expense creation with the new format
export interface CreateExpensePayload {
  description: string;
  amount: number;
  groupId: string;
  paidById: string;
  splittingType: 'Equal' | 'Ratio' | 'Custom';
  participantIds?: string[]; // For Equal splitting with selected members
  ratios?: { userId: string; ratio: number }[]; // For Ratio-based splitting
  splits?: { userId: string; share: number }[]; // For Custom splitting
}

/**
 * Creates a new expense in a group
 * @param payload - The expense details
 */
export const createExpense = async (payload: CreateExpensePayload): Promise<{ success: boolean; data?: any; error?: string }> => {
  const token = getToken();
  if (!token) {
    return { success: false, error: 'Authentication token not found.' };
  }

  try {
    const response = await fetch(`${BASE_URL}/expenses/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create expense' }));
      console.error('Failed to create expense:', response.status, errorData);
      return { success: false, error: errorData.message || `HTTP error! status: ${response.status}` };
    }

    const data = await response.json();
    return { success: true, data };

  } catch (error: any) {
    console.error('Error creating expense:', error);
    return { success: false, error: error.message || 'An unexpected error occurred while creating the expense.' };
  }
};

// Interface for expense details
export interface ExpenseDetails {
  id: string;
  description: string;
  amount: number;
  date: string;
  paidBy: {
    id: string;
    username: string;
  };
  splitMethod: 'equal' | 'exact' | 'percentage' | 'shares';
  splits: {
    userId: string;
    username: string;
    amount: number;
    percentage: number;
    shares: number;
  }[];
  group: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Gets details for a specific expense
 * @param expenseId - The ID of the expense to fetch
 */
export const getExpenseDetails = async (expenseId: string): Promise<{ success: boolean; data?: ExpenseDetails; error?: string }> => {
  const token = getToken();
  if (!token) {
    return { success: false, error: 'Authentication token not found.' };
  }

  try {
    const response = await fetch(`${BASE_URL}/expenses/${expenseId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch expense details' }));
      console.error('Failed to fetch expense details:', response.status, errorData);
      return { success: false, error: errorData.message || `HTTP error! status: ${response.status}` };
    }

    const data: ExpenseDetails = await response.json();
    return { success: true, data };

  } catch (error: any) {
    console.error('Error fetching expense details:', error);
    return { success: false, error: error.message || 'An unexpected error occurred while fetching expense details.' };
  }
};

// Group expense summary response interfaces
export interface ExpenseSummary {
  group: {
    id: string;
    name: string;
  };
  summary: {
    youAreOwed: {
      userId: string;
      username: string;
      amount: number;
    }[];
    youOwe: {
      userId: string;
      username: string;
      amount: number;
    }[];
    total: number;
  };
  expenses: {
    id: string;
    description: string;
    amount: number;
    date: string;
    paidBy: {
      id: string;
      username: string;
    };
    transactionType: string;
    transactionAmount: number;
  }[];
}

/**
 * Get expense summary for a group
 * @param groupId - The ID of the group to fetch summary for
 */
export const getGroupExpenseSummary = async (groupId: string): Promise<{ success: boolean; data?: ExpenseSummary; error?: string }> => {
  const token = getToken();
  if (!token) {
    return { success: false, error: 'Authentication token not found.' };
  }

  try {
    const response = await fetch(`${BASE_URL}/expenses/group/${groupId}/summary`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch expense summary' }));
      console.error('Failed to fetch expense summary:', response.status, errorData);
      return { success: false, error: errorData.message || `HTTP error! status: ${response.status}` };
    }

    const data: ExpenseSummary = await response.json();
    return { success: true, data };

  } catch (error: any) {
    console.error('Error fetching expense summary:', error);
    return { success: false, error: error.message || 'An unexpected error occurred while fetching expense summary.' };
  }
};

// Expense detail response interfaces
export interface ExpenseDetail {
  expense: {
    id: string;
    description: string;
    amount: number;
    date: string;
    group: {
      id: string;
      name: string;
    };
    paidBy: {
      id: string;
      username: string;
    };
  };
  splits: {
    user: {
      id: string;
      username: string;
    };
    share: number;
    relationship: 'paid' | 'you' | 'owes';
  }[];
  transactions: {
    from: {
      id: string;
      username: string;
    };
    to: {
      id: string;
      username: string;
    };
    amount: number;
  }[];
}

/**
 * Get detailed view of a specific expense
 * @param expenseId - The ID of the expense to fetch details for
 */
export const getExpenseDetail = async (expenseId: string): Promise<{ success: boolean; data?: ExpenseDetail; error?: string }> => {
  const token = getToken();
  if (!token) {
    return { success: false, error: 'Authentication token not found.' };
  }

  try {
    const response = await fetch(`${BASE_URL}/expenses/${expenseId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch expense details' }));
      console.error('Failed to fetch expense details:', response.status, errorData);
      return { success: false, error: errorData.message || `HTTP error! status: ${response.status}` };
    }

    const data: ExpenseDetail = await response.json();
    return { success: true, data };

  } catch (error: any) {
    console.error('Error fetching expense details:', error);
    return { success: false, error: error.message || 'An unexpected error occurred while fetching expense details.' };
  }
};

// Update expense request interface
export interface UpdateExpensePayload {
  description: string;
  amount: number;
  paidById: string;
  splittingType: 'Equal' | 'Ratio' | 'Custom';
  participantIds?: string[]; // For Equal splitting with selected members
  ratios?: { userId: string; ratio: number }[]; // For Ratio-based splitting
  splits?: { userId: string; share: number }[]; // For Custom splitting
}

// Update expense response interface
export interface UpdateExpenseResponse {
  message: string;
  expense: {
    id: string;
    description: string;
    amount: number;
    paidBy: {
      id: string;
      username: string;
    };
    splits: {
      user: {
        id: string;
        username: string;
      };
      share: number;
    }[];
  };
}

/**
 * Update an existing expense
 * @param expenseId - The ID of the expense to update
 * @param payload - The updated expense data
 */
export const updateExpense = async (expenseId: string, payload: UpdateExpensePayload): Promise<{ success: boolean; data?: UpdateExpenseResponse; error?: string }> => {
  const token = getToken();
  if (!token) {
    return { success: false, error: 'Authentication token not found.' };
  }

  try {
    const response = await fetch(`${BASE_URL}/expenses/${expenseId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update expense' }));
      console.error('Failed to update expense:', response.status, errorData);
      return { success: false, error: errorData.message || `HTTP error! status: ${response.status}` };
    }

    const data: UpdateExpenseResponse = await response.json();
    return { success: true, data };

  } catch (error: any) {
    console.error('Error updating expense:', error);
    return { success: false, error: error.message || 'An unexpected error occurred while updating the expense.' };
  }
};

/**
 * Delete an expense
 * @param expenseId - The ID of the expense to delete
 */
export const deleteExpense = async (expenseId: string): Promise<{ success: boolean; message?: string; error?: string }> => {
  const token = getToken();
  if (!token) {
    return { success: false, error: 'Authentication token not found.' };
  }

  try {
    const response = await fetch(`${BASE_URL}/expenses/${expenseId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to delete expense' }));
      console.error('Failed to delete expense:', response.status, errorData);
      return { success: false, error: errorData.message || `HTTP error! status: ${response.status}` };
    }

    const data = await response.json();
    return { success: true, message: data.message };

  } catch (error: any) {
    console.error('Error deleting expense:', error);
    return { success: false, error: error.message || 'An unexpected error occurred while deleting the expense.' };
  }
};

/**
 * Record a settlement between the current user and another user in a group
 * @param groupId - The ID of the group
 * @param userId - The ID of the user to settle up with
 * @param amount - The amount to settle
 */
export const settleUpWithUser = async (groupId: string, userId: string, amount: number): Promise<{ success: boolean; message?: string; error?: string }> => {
  const token = getToken();
  if (!token) {
    return { success: false, error: 'Authentication token not found.' };
  }

  try {
    const response = await fetch(`${BASE_URL}/expenses/settle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        groupId,
        settledWithUserId: userId,
        amount
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to record settlement' }));
      console.error('Failed to record settlement:', response.status, errorData);
      return { success: false, error: errorData.message || `HTTP error! status: ${response.status}` };
    }

    const data = await response.json();
    return { success: true, message: data.message || 'Settlement recorded successfully' };

  } catch (error: any) {
    console.error('Error recording settlement:', error);
    return { success: false, error: error.message || 'An unexpected error occurred while recording the settlement.' };
  }
};
