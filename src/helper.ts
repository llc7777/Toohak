/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { getData } from './dataStore';
import validator from 'validator';
import {
  Token,
  User,
  Quiz,
  ErrorResponse,
  Data,
} from './interfaces';

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

  const validChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ -\'';
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

export function getRandomColour() {
  const colours = ['green', 'red', 'blue', 'brown', 'orange', 'yellow', 'pink', 'purple'];
  const randomIndex = Math.floor(Math.random() * colours.length);
  return colours[randomIndex];
}

export function adminUserDetailsErrorChecking(
  token: Token,
  email: string,
  nameFirst: string,
  nameLast: string
): void {
  const data = getData();

  if (token === '') {
    throw new Error('401 - Token is empty');
  }

  // Find the user from the token
  const tokenData = decodeToken(token);
  const user = findUserFromToken(tokenData);
  if (!user) {
    throw new Error('401 - Token is invalid');
  }

  // Check if the email is valid
  if (!validator.isEmail(email)) {
    throw new Error('400 - Email is not valid. Please try another email.');
  }

  //  Check if the email is already in use by another user
  const emailInUse = data.users.find(
    otherUser => otherUser.email === email && otherUser.authUserId !== user.authUserId);
  if (emailInUse) {
    throw new Error('400 - Email is currently used by another user. Please use another email.');
  }

  // Validating first name and last name
  const firstNameError = isValidName(nameFirst, 'First');
  if (firstNameError) {
    throw new Error(firstNameError);
  }

  const lastNameError = isValidName(nameLast, 'Last');
  if (lastNameError) {
    throw new Error(lastNameError);
  }
}

export function adminQuizInfoErrorChecking(token: string, quizId: number): Quiz | ErrorResponse {
  if (!encodedTokenExists(token) || token.length === 0) {
    throw new Error('401 - Token is empty or invalid');
  }

  const tokenObj: Token = decodeToken(token);
  const user: User = findUserFromToken(tokenObj);
  if (!user) {
    throw new Error('401 - Invalid Token');
  }

  const quiz: Quiz = findQuizFromQuizId(quizId);
  if (!quiz) {
    throw new Error('403 - Quiz does not exist');
  }

  if (quiz.authUserId !== tokenObj.authUserId) {
    throw new Error('403 - User does not own the quiz');
  }
}

export function adminQuizRemoveErrorChecking(
  token: string,
  quizId: number
): object | ErrorResponse {
  if (!encodedTokenExists(token) || token.length === 0) {
    throw new Error('401 - Token is empty or invalid');
  }

  const data: Data = getData();
  const tokenObj: Token = decodeToken(token);
  const user: string = findUserFromToken(tokenObj);

  if (!user) {
    throw new Error('401 - Given user is not logged in');
  }

  // Check if the quizId refers to a valid quiz
  const quizIndex: number = data.quizzes.findIndex(quiz => quiz.quizId === quizId);
  if (quizIndex === -1) {
    throw new Error('403 - Quiz does not exist or user does not own the quiz');
  }

  // Check if the quiz belongs to the user
  const quiz: Quiz = data.quizzes[quizIndex];
  if (quiz.authUserId !== tokenObj.authUserId) {
    throw new Error('403 - Quiz does not exist or user does not own the quiz');
  }
}

export function emptyTrashErrorChecking(token: Token, quizIds: number): object | ErrorResponse {
  const data = getData();

  if (token === '') {
    throw new Error('Token is empty');
  }

  const tokenData = decodeToken(token);
  const user = findUserFromToken(tokenData);
  if (!user) {
    throw new Error('Token is invalid');
  }

  if (!Array.isArray(quizIds)) {
    throw new Error('quizIds must be an array');
  }

  if (data.quizzes.find(quiz => quiz.quizIds === quizIds)) {
    throw new Error('This quiz does not exist.');
  }

  for (const quizId of quizIds) {
    const quizInTrash = data.trash.find(
      quiz => quiz.quizId === quizId
    );

    if (!quizInTrash) {
      throw new Error('One or more quiz IDs is not currently in the trash.');
    }

    if (quizInTrash.authUserId !== user.authUserId) {
      throw new Error('You do not own quiz ID');
    }
  }
}

export function adminQuizMoveQuestionErrorChecking(
  token: string,
  quizId: number,
  questionId: number,
  newPosition: number
): object | ErrorResponse {
  console.log('Error checking');

  if (!encodedTokenExists(token) || token === '') {
    throw new Error('401 - Token is empty or invalid');
  }

  const tokenObj: Token = decodeToken(token);
  const user: User = findUserFromToken(tokenObj);

  if (!user) {
    throw new Error('401 - Token is empty or invalid');
  }

  const quiz: Quiz = findQuizFromQuizId(quizId);
  if (!quiz) {
    throw new Error('403 - The given quizId does not refer to any quiz');
  }

  if (quiz.authUserId !== tokenObj.authUserId) {
    throw new Error('403 - This user does not own the quiz');
  }
  if (newPosition < 0 || newPosition > quiz.questions.length - 1) {
    throw new Error('400 - The new position is outside the bounds of questions array');
  }
  const questionIndex = getQuestionIndexFromQuestionId(questionId, quizId);
  if (questionIndex === -1) {
    throw new Error('400 - No question exists with the quiz for the given questionId');
  }
  if (questionIndex === newPosition) {
    throw new Error('400 - New position is the current position');
  }
}

export function adminQuizTransferErrorChecking(
  token: string,
  userEmail: string,
  quizId: number
): object | ErrorResponse {
  if (!encodedTokenExists(token) || token.length === 0) {
    throw new Error('401 - Token is empty or invalid');
  }

  const tokenDecoded: string = decodeToken(token);
  const loggedInUser: User = findUserFromToken(tokenDecoded);
  const userToTransferTo: User = findUserFromEmail(userEmail);

  if (!userToTransferTo) {
    throw new Error('400 - No user has this email');
  } else if (!loggedInUser) {
    throw new Error('401 - This is not a valid logged in user');
  } else if (loggedInUser.email === userEmail) {
    throw new Error('400 - Given email is the same as the current logged in user');
  }

  const quizToTransfer: Quiz = findQuizFromQuizId(quizId);
  if (!quizToTransfer) {
    throw new Error('403 - No quiz exists with the given quizId');
  } else if (quizToTransfer.authUserId !== tokenDecoded.authUserId) {
    throw new Error('403 - This user does not own the quiz');
  }

  if (userHasQuizWithSameName(userToTransferTo.authUserId, quizId)) {
    throw new Error('400 - This user already owns a quiz with the same name');
  }
}
