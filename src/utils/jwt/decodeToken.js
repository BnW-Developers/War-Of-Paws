import { jwtDecode } from 'jwt-decode';

export const decodeToken = (token) => {
  const decoded = jwtDecode(token);
  return decoded;
};
