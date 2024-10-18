/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { getData } from './dataStore';
import validator from 'validator';

// Helper function for adminAuthRegister
export function isValidEmail(email: string): string {
  if (!validator.isEmail(email)) {
    return 'Invalid email format.';
  }
  return '';
}

// Helper function for adminAuthRegister
export function isValidName(name: string, type: string): string {
  if (name.length < 2 || name.length > 20) {
    return `${type} name must be between 2 and 20 characters.`;
  }

  const validChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ '-";
  for (const char of name) {
    if (!validChars.includes(char)) {
      return `${type} name contains invalid characters.`;
    }
  }

  return '';
}

// Helper function for adminAuthRegister
export function isValidPassword(password: string): string {
  if (password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }

  const hasLetter = [...password].some(char => /[a-zA-Z]/.test(char));
  const hasNumber = [...password].some(char => /[0-9]/.test(char));

  if (!hasLetter || !hasNumber) {
    return 'Password must contain at least one letter and one number.';
  }

  return '';
}

// Helper function for adminAuthRegister
export function generateToken(): string {
  return [...Array(32)]
    .map(() => Math.random().toString(36)[2])
    .join('');
}

// helper function for quizcreate
export function validQuizName(name) {
  if (name.length < 2 || name.length > 20) {
    return false;
  }

  const validChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 '-";
  for (const char of name) {
    if (!validChars.includes(char)) {
      return false;
    }
  }

  return true;
}

// Check if the provided user ID corresponds to a valid user
export function isUserValid(authUserId) {
  const { users } = getData();
  return users.some(user => user.authUserId === authUserId);
}

// Check if the specified name is already used by the given user ID in quizzes
export function nameUsed(authUserId, name) {
  const { quizzes } = getData();
  return quizzes.some(quiz => quiz.authUserId === authUserId && quiz.name === name);
}

// Create a token from the given token object
export function createToken(token) {
  return encodeURIComponent(JSON.stringify(token));
}

// Decode the given token string and return the token object
export function decodeToken(token) {
  token = decodeURIComponent(token);
  return JSON.parse(token);
}

// Generate a random session ID
export function generateRandomSessionId() {
  return Math.floor(Math.random() * 1000000000);
}

// Find a user from the given token
export function findUserFromToken(token) {
  const data = getData();
  for (const user of data.users) {
    if (user.tokens.find(usersToken =>
      usersToken.sessionId === token.sessionId &&
      usersToken.authUserId === token.authUserId)) {
      return user;
    }
  }
  return null;
}

export function findQuizFromUser(authUserId, quizId) {
  const data = getData();

  const user = data.users.find(user => user.authUserId === authUserId);
  if (!user) {
    return { error: 'Unable to find user Id ' };
  }

  const quiz = data.quizzes.find(quiz => quiz.quizId === quizId);
  if (!quiz) {
    return { error: 'Quiz unable to be found' };
  }

  const userAndQuizMatch = data.quizzes.find(
    quiz => quiz.authUserId === authUserId && quiz.quizId === quizId);

  if (!userAndQuizMatch) {
    return { error: 'The given user does not own the given quiz' };
  }

  return {};
}
