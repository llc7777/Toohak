/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { getData } from './dataStore';

// helper function for adminAuthRegister
export function isValidName(name) {
  if (name.length < 2 || name.length > 20) {
    return false;
  }

  const validChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ '-";
  for (const char of name) {
    if (!validChars.includes(char)) {
      return false;
    }
  }

  return true;
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

export function createToken(token) {
  const sessionId: string = Math.floor(Date.now() / 1000) + Math.random();
  const token = {
    sessionId: sessionId,
    user: authUserId,
  };
  return encodeURIComponent(JSON.stringify(token));
}

export function decodeToken(token) {
  token = decodeURIComponent(token);
  return JSON.parse(token);
}
