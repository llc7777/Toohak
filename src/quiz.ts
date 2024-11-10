
import { getData } from './dataStore';
import {
  validQuizName,
  nameUsed,
  decodeToken,
  findUserFromToken,
  encodedTokenExists,
  findQuizFromQuizId,
  getQuizIndex,
  findUserFromEmail,
  adminQuizInfoErrorChecking,
  adminQuizRemoveErrorChecking,
  adminQuizTransferErrorChecking,
} from './helper';
import {
  ErrorResponse,
  User,
  Quiz,
  Token,
  Data,
  QuizInfo,
  QuizInfoDetailed,
  QuizID,
} from './interfaces';

/**
 * Retrieve a list of all quizzes created by the authenticated user.
 * @param {string} token of user
 * @returns {object} - An object containing a list of quizzes created by the user
 */
export function adminQuizList(token: string) {
  const data: Data = getData();
  const arr = [];
  // Check if the token is empty
  if (token === '') {
    return {
      error: 'Token is empty',
    };
  }

  // decode the token and get the authUserId and sessionId
  const tokenData: Token = decodeToken(token);
  const authUserId: number = tokenData.authUserId;

  // verify user with the sessionId and authUserId
  const userExists = findUserFromToken(tokenData);

  if (!userExists) {
    return {
      error: 'Token is invalid',
    };
  }

  for (let i = 0; i < data.quizzes.length; i++) {
    if (data.quizzes[i].authUserId === authUserId) {
      const item = {
        quizId: data.quizzes[i].quizId,
        name: data.quizzes[i].name,
      };
      arr.push(item);
    }
  }

  return {
    quizzes: arr,
  };
}

/**
 * View the quizzes in trash
 * @param {string} token of user
 * @returns {object} - An object containing quizzes in trash
 */
export function adminQuizTrashList(token: string) {
  const data = getData();
  const arr = [];

  // Check if the token is empty
  if (token === '') {
    return {
      error: 'Token is empty',
    };
  }

  const tokenData = decodeToken(token);
  const authUserId = tokenData.authUserId;

  // verify user with the sessionId and authUserId
  const userExists = findUserFromToken(tokenData);

  if (!userExists) {
    return {
      error: 'Token is invalid',
    };
  }

  for (let i = 0; i < data.trash.length; i++) {
    if (data.trash[i].authUserId === authUserId) {
      const item = {
        quizId: data.trash[i].quizId,
        name: data.trash[i].name,
      };
      arr.push(item);
    }
  }

  return { quizzes: arr };
}

/**
 *
 * @param {string} token of user
 * @param {string} name Name of user
 * @param {string} description Description of new quiz
 * @returns
 */
export function adminQuizCreate(
  token: string,
  name: string,
  description: string
): QuizID {
  const data: Data = getData();

  // Check if the token is empty
  if (token === '') {
    throw new Error('401 - Token is empty');
  }
  // decode the token and get the authUserId and sessionId
  const tokenData: Token = decodeToken(token);
  const authUserId: number = tokenData.authUserId;

  // verify user with the sessionId and authUserId
  const userExists: User | null = findUserFromToken(tokenData);

  if (!userExists) {
    throw new Error('401 -Token is invalid');
  }

  if (!validQuizName(name)) {
    throw new Error('Name contains invalid characters only alphanumeric and spaces.');
  }

  if (name.length < 3 || name.length > 30) {
    throw new Error('Name must be between 3 and 30 characters long.');
  }

  if (nameUsed(authUserId, name)) {
    throw new Error('Name is already used for another quiz.');
  }

  if (description.length > 100) {
    throw new Error('Description is more than 100 characters in length.');
  }

  const newQuizId: number = data.quizzes.length + data.trash.length + 1;
  const newQuiz: Quiz = {
    authUserId,
    quizId: newQuizId,
    name,
    timeCreated: Math.floor(Date.now() / 1000),
    timeLastEdited: Math.floor(Date.now() / 1000),
    description,
    questions: [],
    timeLimit: 0,
    thumbnailUrl: '',
  };

  data.quizzes.push(newQuiz);

  return { quizId: newQuizId };
}

/**
 *
 * @param {string} token of user
 * @param {integer} quizId Id of quiz
 * @returns
 */
export function adminQuizRemove(token: string, quizId: number): object | ErrorResponse {
  adminQuizRemoveErrorChecking(token, quizId);

  const data: Data = getData();

  const quiz = findQuizFromQuizId(quizId);
  const quizIndex = getQuizIndex(quizId);

  // Send quiz to trash before removing it
  data.trash.push(quiz);

  // Remove the quiz
  data.quizzes.splice(quizIndex, 1);

  // return an empty object
  return {};
}

/**
Gets information for a given quiz given a quizId and authUserId
@param {string} token Id of user
@param {integer} quizId of user
@returns {object} - An object containing the following keys that show quiz info:
  - {integer} quizId:
  - {string} name:
  - {integer} timeCreated:
  - {integer} timeLastEdited:
  - {string} description:
*
*/
export function adminQuizInfo(
  token: string,
  quizId: number,
  detailed?: boolean
): QuizInfo | QuizInfoDetailed | ErrorResponse {
  adminQuizInfoErrorChecking(token, quizId);

  const quiz: Quiz = findQuizFromQuizId(quizId);

  if (detailed) {
    return {
      quizId: quiz.quizId,
      name: quiz.name,
      timeCreated: quiz.timeCreated,
      timeLastEdited: quiz.timeLastEdited,
      description: quiz.description,
      numOfQuestions: quiz.questions.length,
      questions: quiz.questions,
      timeLimit: quiz.timeLimit,
      thumbnailUrl: quiz.thumbnailUrl,
    };
  } else {
    return {
      quizId: quiz.quizId,
      name: quiz.name,
      timeCreated: quiz.timeCreated,
      timeLastEdited: quiz.timeLastEdited,
      description: quiz.description,
      numOfQuestions: quiz.questions.length,
      questions: quiz.questions,
    };
  }
}

/**
Updates the name of the relevant quiz
@param {integer} authUser Id of user
@param {integer} quizId of user
@param {string} name
@returns empty object { }
*/
export function adminQuizNameUpdate(
  token: string,
  quizId: number,
  name: string
): object | ErrorResponse {
  let user: boolean | User = false;
  const data: Data = getData();
  if (token.length === 0 || !encodedTokenExists(token)) {
    throw new Error('401- Invalid token');
  }

  const tokenDecoded: Token = decodeToken(token);
  user = findUserFromToken(tokenDecoded);

  // Search through the data to check if the quiz exists
  const quiz: Quiz = findQuizFromQuizId(quizId);

  if (!quiz) {
    throw new Error('403- Quiz Id does not exist');
  }
  // Check user owns the quiz
  if (user.authUserId !== quiz.authUserId) {
    throw new Error('403- User does not own the quiz');
  }
  // Check quiz name is already used
  for (let i = 0; i < data.quizzes.length; i++) {
    if (data.quizzes[i].name === name) {
      throw new Error('400- Name is already used');
    }
  }

  // Check user exists
  if (!name.match(/^[a-zA-Z0-9 ]+$/)) {
    throw new Error(
      '400- Name contains invalid characters (Valid characters are alphanumeric and spaces)'
    );
    // Check name is less than 3 characters and more than 30 characters.
  } else if (name.length < 3 || name.length > 30) {
    throw new Error('400- Name must be between 3 and 30 characters long');
    // Update the name of the quiz and return empty object for indication of no error
  } else {
    for (let i = 0; i < data.quizzes.length; i++) {
      if (data.quizzes[i].quizId === quizId) {
        data.quizzes[i].name = name;
        data.quizzes[i].timeLastEdited = Math.floor(Date.now() / 1000);
        return {};
      }
    }
  }
}

/**
 * Updates the description of the quiz
 * @param {string} token - The user's authentication token
 * @param {number} quizId - The ID of the quiz to be updated
 * @param {string} description - The new description for the quiz
 * @returns {object | ErrorResponse} - An empty object on success or an error
 */
export function adminQuizDescriptionUpdate(
  token: string,
  quizId: number,
  description: string
): object | ErrorResponse {
  if (token.length === 0 || !encodedTokenExists(token)) {
    return { error: 'Token is invalid' };
  }

  const tokenData: Token = decodeToken(token);
  const user: User | null = findUserFromToken(tokenData);

  const quiz: Quiz | undefined = findQuizFromQuizId(quizId);
  if (!quiz) {
    return { error: 'Quiz ID does not refer to a valid quiz.' };
  }

  if (quiz.authUserId !== user.authUserId) {
    return { error: 'Quiz ID does not refer to a quiz that this user owns.' };
  }

  if (description.length > 100) {
    return { error: 'Description is more than 100 characters in length.' };
  }

  quiz.description = description;
  quiz.timeLastEdited = Math.floor(Date.now() / 1000);

  return {};
}

/**
Updates the description of the relevant quiz
@param {string} token of a logged in user
@param {string} userEmail of a users email
@param {integer} quizId of a quiz
@returns empty object { }
*/
export function adminQuizTransfer(
  token: string,
  userEmail: string,
  quizId: number): object | ErrorResponse {
  adminQuizTransferErrorChecking(token, userEmail, quizId);

  const data: Data = getData();

  const userToTransferTo: User = findUserFromEmail(userEmail);

  const quizIndex = getQuizIndex(quizId);
  data.quizzes[quizIndex].authUserId = userToTransferTo.authUserId;
  return {};
}

/**
 * Restores a quiz from the trash back to the list of active quizzes for an authenticated user.
 *
 * @param {number} quizId Id of quiz
 * @param {string} token
 * @returns {Object} empty object on success
 */
export function adminQuizRestore(quizId: number, token: string): object | ErrorResponse {
  const data = getData();

  if (token === '') {
    return { error: 'Token is empty' };
  }

  const tokenObj = decodeToken(token);

  const user = findUserFromToken(tokenObj);

  if (!user) {
    return { error: 'Token is invalid' };
  }

  const quizInQuizzes = data.quizzes.find(quiz => quiz.quizId === quizId);
  if (quizInQuizzes) {
    return { error: 'This is an active quiz not in the trash' };
  }

  const quizIndex = data.trash.findIndex(quiz => quiz.quizId === quizId);

  if (quizIndex === -1) {
    return { error: 'Quiz ID does not refer to a quiz in the trash.' };
  }

  const quiz = data.trash[quizIndex];

  const activeQuiz = data.quizzes.find(activeQuiz => activeQuiz.name === quiz.name);

  if (activeQuiz) {
    return { error: 'Quiz name is already used by another active quiz.' };
  }

  if (quiz.authUserId !== user.authUserId) {
    return { error: 'You do not own quiz ID, or quiz does not exist' };
  }

  data.quizzes.push(quiz);
  data.trash.splice(quizIndex, 1);

  quiz.timeLastEdited = (Math.floor(new Date().getTime() / 1000)) + 1;

  return {};
}
