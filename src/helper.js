import { getData } from './dataStore.js';

//helper function for adminAuthRegister
export function isValidName(name) {
  if (name.length < 2 || name.length > 20) {
    return false;
  }

  const validChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ '-";
  for (let char of name) {
    if (!validChars.includes(char)) {
      return false;
    }
  }
  
  return true;
}

// Helper function to check if the user is valid
export function isValidUser(authUserId) {
  const data = getData();
  return data.users.find(user => user.authUserId === authUserId) || null;
}