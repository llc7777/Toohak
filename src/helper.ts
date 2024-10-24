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

  const validChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ ';
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

// helper function for quizcreate
export function validQuizName(name) {
  const validChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ';
  for (const char of name) {
    if (!validChars.includes(char)) {
      return false;
    }
  }

  return true;
}

// Check if the provided user ID corresponds to a valid user
export function isUserValid(authUserId) {
  const data = getData();
  return data.users.some(user => user.authUserId === authUserId);
}

// Check if the specified name is already used by the given user ID in quizzes
export function nameUsed(authUserId, name) {
  const data = getData();
  return data.quizzes.some(quiz => quiz.authUserId === authUserId && quiz.name === name);
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

// Generate a session ID based on the current time and a random two-digit number
export function generateRandomSessionId() {
  // Generates a random number between 10 and 99
  const randomTwoDigitNumber = Math.floor(Math.random() * 90 + 10);
  return Date.now() + randomTwoDigitNumber;
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

// Return true if the encodedToken does exist and belongs to user. Otherwise return false.
export function encodedTokenExists(encodedToken) {
  const data = getData();
  for (const user of data.users) {
    for (const token of user.tokens) {
      const encoded = createToken(token);
      if (encoded === encodedToken) {
        return true;
      }
    }
  }
  return false;
}

// Returns a user that corresponds to the given email
export function findUserFromEmail(email) {
  const data = getData();
  return data.users.find(user => user.email === email);
}

// Return true if the given authUserId already owns a quiz with the
// same name as the quiz name of the given quiz
export function userHasQuizWithSameName(authUserId, quizId) {
  const data = getData();
  const givenQuiz = data.quizzes.find(quiz => quiz.quizId === quizId);
  return data.quizzes.find(quiz => quiz.name === givenQuiz.name && quiz.authUserId === authUserId);
}

// Returns the quiz object of a quiz from the given quizId.
// If quiz not found, undefined is returned
export function findQuizFromQuizId(quizId) {
  const data = getData();
  return data.quizzes.find(quiz => quiz.quizId === quizId);
}

export function findQuestionFromQuestionId(questionId, quizId) {
  const data = getData();
  const quizIndex = getQuizIndex(quizId);
  return data.quizzes[quizIndex].questions.find(question => question.questionId === questionId);
}

export function getQuestionIndexFromQuestionId(questionId, quizId) {
  const data = getData();
  const quizIndex = getQuizIndex(quizId);
  return data.quizzes[quizIndex].questions.findIndex(
    question => question.questionId === questionId);
}

export function getQuizIndex(quizId) {
  const data = getData();
  return data.quizzes.findIndex(quiz => quiz.quizId === quizId);
}

export function findUserIndexFromToken(token) {
  const data = getData();

  const userIndex = data.users.findIndex(user =>
    user.tokens && user.tokens.some(userToken =>
      userToken.authUserId === token.authUserId &&
      userToken.sessionId === token.sessionId
    )
  );

  return userIndex;
}
