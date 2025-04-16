import { jwtDecode } from 'jwt-decode';

export const decodeToken = (token: string): string | null => {
  try {
    const decoded: { userId: string } = jwtDecode(token);
    return decoded.userId || null;
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};