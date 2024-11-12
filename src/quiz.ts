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
  findQuizInTrash,
  generateRandomSessionId,
  countDownAndStartGame,
  adminQuizSessionViewErrorChecking,
  checkUrlIsValid,
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
  Session,
  SessionId,
  QuizInfoSimpleArray,
  QuizSessionsResponse,
} from './interfaces';

/**
 * Retrieve a list of all quizzes created by the authenticated user.
 * @param {string} token of user
 * @returns {object} - An object containing a list of quizzes created by the user
 */
export function adminQuizList(token: string): QuizInfoSimpleArray {
  const data: Data = getData();

  // Check if the token is empty
  if (token === '') {
    throw new Error('Token is empty');
  }

  // decode the token and get the authUserId and sessionId
  const tokenData: Token = decodeToken(token);
  const authUserId: number = tokenData.authUserId;

  // verify user with the sessionId and authUserId
  const userExists = findUserFromToken(tokenData);

  // If the token is invalid, throw an error
  if (!userExists) {
    throw new Error('Token is invalid');
  }

  // Filter quizzes by authUserId and map to a new array
  const arr = data.quizzes
    .filter(quiz => quiz.authUserId === authUserId)
    .map(quiz => ({
      quizId: quiz.quizId,
      name: quiz.name,
    }));

  return {
    quizzes: arr,
  };
}

/**
 * View the quizzes in trash
 * @param {string} token of user
 * @returns {object} - An object containing quizzes in trash
 */
export function adminQuizTrashList(token: string): QuizInfoSimpleArray {
  const data: Data = getData();

  // Check if the token is empty
  if (token === '') {
    throw new Error('401 - Token is empty');
  }

  const tokenData = decodeToken(token);
  const authUserId = tokenData.authUserId;

  // verify user with the sessionId and authUserId
  const userExists = findUserFromToken(tokenData);

  if (!userExists) {
    throw new Error('401 - Token is invalid');
  }

  // Find quizzes in trash for the logged in user
  const arr = data.trash
    .filter(trashItem => trashItem.authUserId === authUserId)
    .map(trashItem => ({
      quizId: trashItem.quizId,
      name: trashItem.name,
    }));

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
    thumbnailUrl: 'http://naver.com/some/image/path.jpg',
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

    console.log(quiz);

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
): object {
  if (token.length === 0 || !encodedTokenExists(token)) {
    throw new Error('401 - Token is invalid');
  }

  const tokenData: Token = decodeToken(token);
  const user: User | null = findUserFromToken(tokenData);

  const quiz: Quiz | undefined = findQuizFromQuizId(quizId);
  if (!quiz) {
    throw new Error('403 - Quiz ID does not refer to a valid quiz');
  }

  if (quiz.authUserId !== user.authUserId) {
    throw new Error('403 - Quiz ID does not refer to a quiz that this user owns');
  }

  if (description.length > 100) {
    throw new Error('400 - Description is more than 100 characters in length');
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

// Iteration 3 New Functions

export function adminQuizThumbnailUpdate(quizId: number, token: string, thumbnailUrl: string) {
  const data: Data = getData();

  // Error checking for 401s
  if (token === '') {
    throw new Error('401 - Token is empty');
  }

  const tokenData: Token = decodeToken(token);
  const user: User = findUserFromToken(tokenData);

  if (!user) {
    throw new Error('401 - Token is invalid');
  }

  // Find the quiz with the given quiz ID
  const quiz: Quiz | undefined = findQuizFromQuizId(quizId);

  // Throw an error if the quiz does not exist
  if (!quiz) {
    throw new Error('403 - Quiz does not exist');
  }
  if (quiz.authUserId !== user.authUserId) {
    throw new Error('403 - User does not own the quiz');
  }

  // Check if the thumbnail URL is valid and throw an error if it is not
  checkUrlIsValid(thumbnailUrl);

  // Update the thumbnail URL
  quiz.thumbnailUrl = thumbnailUrl;
  quiz.timeLastEdited = Math.floor(Date.now() / 1000);

  return {};
}

/**
 * Start a new quiz session
 * @param {number} quizId - The ID of the quiz to start a session for
 * @param {string} token - The user's authentication token
 * @param {number} autoStartNum - The number of players that will automatically start the quiz
 * @returns {SessionId} - The ID of the new session
 */
export function adminQuizSessionStart(
  quizId: number,
  token: string,
  autoStartNum: number): SessionId {
  const data: Data = getData();

  // Error checking for 401s
  if (token === '') {
    throw new Error('401 - Token is empty');
  }

  const tokenData: Token = decodeToken(token);
  const user: User = findUserFromToken(tokenData);

  if (!user) {
    throw new Error('401 - Token is invalid');
  }

  // Find the quiz with the given quiz ID
  const quiz = findQuizFromQuizId(quizId);

  // Throw an error if the quiz does not exist
  if (!quiz) {
    throw new Error('403 - Quiz does not exist');
  }

  // Throw an error if the user does not own the quiz
  if (quiz.authUserId !== user.authUserId) {
    throw new Error('403 - User does not own the quiz');
  }

  // Throw an error if autoStartNum is greater than 50
  if (autoStartNum > 50) {
    throw new Error('400 - autoStartNum should be less than 50');
  }

  // Check if there are more than 10 active sessions for this quiz
  const nonEndedSessionsCount: number = data.sessions.filter(
    session => session.state !== 'END' &&
      session.metaData.quizId === quizId).length;

  // Throw an error if there are more than 10 active sessions for this quiz
  if (nonEndedSessionsCount >= 10) {
    throw new Error('400 - There are more than 10 active sessions for this quiz');
  }

  // Throw an error if the quiz does not have any questions
  if (quiz.questions.length === 0) {
    throw new Error('400 - Quiz does not have any questions');
  }

  // Check if the quiz is in the trash
  const quizInTrash: Quiz = findQuizInTrash(quizId);

  // Throw an error if the quiz is in the trash
  if (quizInTrash) {
    throw new Error('400 - Quiz is in trash');
  }

  // Generate a random session ID
  const sessionId: number = generateRandomSessionId();

  // Create a new session
  const session: Session = {
    autoStartNum,
    sessionId,
    state: 'LOBBY',
    atQuestion: 0,
    players: [],
    metaData: quiz,
    messages: [],
  };

  // Add the session to the data
  data.sessions.push(session);

  // Return the session ID
  return { sessionId };
}

/**
 * Update the state of a quiz session
 * @param {number} quizId - The ID of the quiz
 * @param {number} sessionId - The ID of the session
 * @param {string} token - The user's authentication token
 * @param {string} action - The action to perform on the session
 * @returns {object} - An empty object
 */
export function adminQuizSessionUpdate(
  quizId: number, sessionId: number, token: string, action: string): object {
  const data: Data = getData();

  // Error checking for 401s
  if (token === '') {
    throw new Error('401 - Token is empty');
  }

  const tokenData: Token = decodeToken(token);
  const user: User = findUserFromToken(tokenData);

  if (!user) {
    throw new Error('401 - Token is invalid');
  }

  // Find the quiz with the given quiz ID
  const quiz: Quiz | undefined = findQuizFromQuizId(quizId);

  // Throw an error if the quiz does not exist
  if (!quiz) {
    throw new Error('403 - Quiz does not exist');
  }

  // Throw an error if the user does not own the quiz
  if (quiz.authUserId !== user.authUserId) {
    throw new Error('403 - User does not own the quiz');
  }

  // Find the session with the given session ID and quiz ID
  const session = data.sessions.find(session => session.sessionId === sessionId &&
    session.metaData.quizId === quizId);

  // Throw an error if the session does not exist
  if (!session) {
    throw new Error('400 - Valid session does not exist');
  }

  // Array of valid action commands
  const actionCommand = [
    'NEXT_QUESTION',
    'SKIP_COUNTDOWN',
    'GO_TO_ANSWER',
    'GO_TO_FINAL_RESULTS',
    'END'];

  // Check if the action is valid
  if (!actionCommand.includes(action)) {
    throw new Error('400 - Invalid action');
  }

  // When the action is NEXT_QUESTION
  if (action === 'NEXT_QUESTION') {
    if (session.state === 'LOBBY') {
      countDownAndStartGame(session);
    } else if (session.state === 'ANSWER_SHOW') {
      countDownAndStartGame(session);
    } else if (session.state === 'QUIZ_CLOSE') {
      countDownAndStartGame(session);
    }
  } else if (action === 'SKIP_COUNTDOWN' && session.state === 'QUESTION_COUNTDOWN') {
    session.state = 'QUESTION_OPEN';
  } else if (action === 'GO_TO_ANSWER') {
    if (session.state === 'QUESTION_OPEN') {
      session.state = 'ANSWER_SHOW';
    } else if (session.state === 'QUESTION_CLOSE') {
      session.state = 'ANSWER_SHOW';
    }
  } else if (action === 'GO_TO_FINAL_RESULTS') {
    if (session.state === 'ANSWER_SHOW') {
      session.state = 'FINAL_RESULTS';
    } else if (session.state === 'QUESTION_CLOSE') {
      session.state = 'FINAL_RESULTS';
    }
  } else if (action === 'END') {
    session.state = 'END';
  } else {
    throw new Error('400 - Action cannot be applied to the current state');
  }

  return {};
}

/** Retrieves active and inactive sessions for a specific quiz based on the quiz ID.
*
* @param { number } quizId - The ID of the quiz
* @param { string } token - The authorization token of the user
* @returns { QuizSessionsResponse } - An object containing arrays of active and inactive session IDs
*/
export function adminQuizSessionView(
  quizId: number, token: string
): QuizSessionsResponse {
  // Error checking using helper function
  adminQuizSessionViewErrorChecking(quizId, token);

  const data: Data = getData();

  // Filter sessions for the quiz
  const activeSessions: number[] = [];
  const inactiveSessions: number[] = [];

  data.sessions.forEach((session) => {
    if (session.metaData.quizId === quizId) {
      if (session.state !== 'END') {
        activeSessions.push(session.sessionId);
      } else {
        inactiveSessions.push(session.sessionId);
      }
    }
  });

  // Sort sessions in ascending order
  activeSessions.sort((a, b) => a - b);
  inactiveSessions.sort((a, b) => a - b);

  // Return the session data
  return {
    activeSessions,
    inactiveSessions,
  };
}
