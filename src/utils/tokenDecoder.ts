import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
    userId: string;
    iat: number;
    exp: number;
  }

export async function decodeToken(token: string): Promise<string | null> {
  try {
    const decoded: DecodedToken = jwtDecode(token);
    return decoded.userId;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}   