
import { getData } from './dataStore';
import validator from 'validator';
import {
  Token,
  User,
  Quiz,
  Data,
  QuestionInfo,
  Session,
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
export function validQuizName(name: string) {
  const validChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ';
  for (const char of name) {
    if (!validChars.includes(char)) {
      return false;
    }
  }

  return true;
}

// Check if the specified name is already used by the given user ID in quizzes
export function nameUsed(authUserId: number, name: string) {
  const data = getData();
  return data.quizzes.some(quiz => quiz.authUserId === authUserId && quiz.name === name);
}

// Create a token from the given token object
export function createToken(token: Token) {
  return encodeURIComponent(JSON.stringify(token));
}

// Decode the given token string and return the token object
export function decodeToken(token: string) {
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
export function findUserFromToken(token: Token) {
  const data = getData();
  for (const user of data.users) {
    if (user.tokens.find((usersToken: Token) =>
      usersToken.sessionId === token.sessionId &&
      usersToken.authUserId === token.authUserId)) {
      return user;
    }
  }
  return null;
}

// Return true if the encodedToken does exist and belongs to user. Otherwise return false.
export function encodedTokenExists(encodedToken: string) {
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
export function findUserFromEmail(email: string) {
  const data = getData();
  return data.users.find(user => user.email === email);
}

// Return true if the given authUserId already owns a quiz with the
// same name as the quiz name of the given quiz
export function userHasQuizWithSameName(authUserId: number, quizId: number) {
  const data = getData();
  const givenQuiz = data.quizzes.find(quiz => quiz.quizId === quizId);
  return data.quizzes.find(quiz => quiz.name === givenQuiz.name && quiz.authUserId === authUserId);
}

// Returns the quiz object of a quiz from the given quizId.
// If quiz not found, undefined is returned
export function findQuizFromQuizId(quizId: number) {
  const data = getData();
  return data.quizzes.find(quiz => quiz.quizId === quizId);
}

export function findQuizInTrash(quizId: number) {
  const data = getData();
  return data.trash.find(quiz => quiz.quizId === quizId);
}

export function findQuestionFromQuestionId(questionId: number, quizId: number) {
  const data = getData();
  const quizIndex = getQuizIndex(quizId);
  return data.quizzes[quizIndex].questions.find(
    (question: QuestionInfo) => question.questionId === questionId);
}

export function getQuestionIndexFromQuestionId(questionId: number, quizId: number) {
  const data = getData();
  const quizIndex = getQuizIndex(quizId);
  return data.quizzes[quizIndex].questions.findIndex(
    (question: QuestionInfo) => question.questionId === questionId);
}

export function getQuizIndex(quizId: number) {
  const data = getData();
  return data.quizzes.findIndex(quiz => quiz.quizId === quizId);
}

export function findUserIndexFromToken(token: Token) {
  const data = getData();

  const userIndex = data.users.findIndex(user =>
    user.tokens && user.tokens.some((userToken: Token) =>
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

export function quizHasSessionNotInEnd(quizId: number) {
  const data: Data = getData();

  for (const session of data.sessions) {
    if (session.metaData.quizId === quizId && session.state !== 'END') {
      return true;
    }
  }
  return false;
}

// Function Error Checking
export function adminAuthLoginErrorChecking(email: string, password: string) {
  const data = getData();

  const index = data.users.findIndex((user) => user.email === email);
  if (index === -1) {
    throw new Error('400 - No user with this email exists');
  }

  if (data.users[index].password !== password) {
    data.users[index].numFailedPasswordsSinceLastLogin += 1;
    throw new Error('400 - Password is incorrect');
  }
}

export function adminUserDetailsErrorChecking(token: string) {
  if (token === '') {
    throw new Error('401 - Token is empty');
  }

  // Find the user from the token
  const tokenData = decodeToken(token);
  const user = findUserFromToken(tokenData);
  if (!user) {
    throw new Error('401 - Token is invalid');
  }
}

export function adminUserDetailsUpdateErrorChecking(
  token: string,
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

export function adminQuizInfoErrorChecking(token: string, quizId: number): void {
  if (!encodedTokenExists(token) || token.length === 0) {
    throw new Error('401 - Token is empty or invalid');
  }

  const tokenObj: Token = decodeToken(token);

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
  quizId: number,
  version: string
) {
  if (!encodedTokenExists(token) || token.length === 0) {
    throw new Error('401 - Token is empty or invalid');
  }

  const data: Data = getData();
  const tokenObj: Token = decodeToken(token);

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

  if (version === 'v2') {
    if (quizHasSessionNotInEnd(quizId)) {
      throw new Error('400 - Quiz has a session that is not in active state');
    }
  }
}

export function emptyTrashErrorChecking(token: string, quizIds: number[]) {
  const data = getData();

  if (token === '') {
    throw new Error('401 - Token is empty');
  }

  const tokenData = decodeToken(token);
  const user = findUserFromToken(tokenData);
  if (!user) {
    throw new Error('401 - Token is invalid');
  }

  if (!Array.isArray(quizIds)) {
    throw new Error('400 - quizIds must be an array');
  }

  for (const quizId of quizIds) {
    if (data.quizzes.find(quiz => quiz.quizId === quizId)) {
      throw new Error('400 - One or more quiz IDs is not currently in the trash.');
    }

    for (const quizId of quizIds) {
      const quizInTrash = data.trash.find(quiz => quiz.quizId === quizId);

      if (!quizInTrash) {
        throw new Error('400 - One or more quiz IDs is not currently in the trash.');
      }

      if (quizInTrash && quizInTrash.authUserId !== user.authUserId) {
        throw new Error('403 - You do not own quiz ID');
      }
    }
  }
}

export function adminQuizMoveQuestionErrorChecking(
  token: string,
  quizId: number,
  questionId: number,
  newPosition: number
) {
  if (!encodedTokenExists(token) || token === '') {
    throw new Error('401 - Token is empty or invalid');
  }

  const tokenObj: Token = decodeToken(token);

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
  quizId: number,
  version: string
) {
  if (!encodedTokenExists(token) || token.length === 0) {
    throw new Error('401 - Token is empty or invalid');
  }

  const tokenDecoded: Token = decodeToken(token);
  const loggedInUser: User = findUserFromToken(tokenDecoded);
  const userToTransferTo: User = findUserFromEmail(userEmail);

  if (!userToTransferTo) {
    throw new Error('400 - No user has this email');
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

  if (version === 'v2') {
    if (quizHasSessionNotInEnd(quizId)) {
      throw new Error('400 - Quiz has a session that is not in active state');
    }
  }
}

export function countDownAndStartGame(session: Session) {
  session.state = 'QUESTION_COUNTDOWN';
  const duration = session.metaData.timeLimit;

  // Start the countdown and open the question
  setTimeout(() => {
    session.state = 'QUESTION_OPEN';
  }, 3000);

  // Close the question after the duration
  setTimeout(() => {
    session.state = 'QUESTION_CLOSED';
  }, duration * 1000);
}

export function adminQuizSessionViewErrorChecking(
  quizId: number, token: string
): void {
  if (token === '') {
    throw new Error('401 - Token is empty');
  }

  // Find the user from the token
  const tokenData = decodeToken(token);
  const user = findUserFromToken(tokenData);
  if (!user) {
    throw new Error('401 - Token is invalid');
  }

  const quiz: Quiz = findQuizFromQuizId(quizId);
  if (!quiz) {
    throw new Error('403 - Quiz not found');
  }

  if (quiz.authUserId !== user.authUserId) {
    throw new Error('403 - User does not own the quiz');
  }
}


export function adminQuizSessionStatusErrorChecking(
  quizId: number, sessionId: number, token: string
): void {
  if (token === '') {
    throw new Error('401 - Token is empty');
  }

  // Find the user from the token
  const tokenData = decodeToken(token);
  const user = findUserFromToken(tokenData);
  if (!user) {
    throw new Error('401 - Token is invalid');
  }

  const quiz: Quiz = findQuizFromQuizId(quizId);
  if (!quiz) {
    throw new Error('403 - Quiz not found');
  }

  if (quiz.authUserId !== user.authUserId) {
    throw new Error('403 - User does not own the quiz');
  }

  const session = findSession(quizId, sessionId);
  if (!session) {
    throw new Error ('400 - Session does not exist for this quiz');
  }
}

export function findSession(quizId: number, sessionId: number) {
  const data = getData();
  return data.sessions.find(
    session => session.sessionId === sessionId &&
    session.metaData.quizId === quizId
  );
}