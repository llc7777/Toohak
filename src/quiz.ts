/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { getData } from './dataStore';
import {
  validQuizName,
  nameUsed,
  decodeToken,
  findUserFromToken,
  encodedTokenExists,
  userHasQuizWithSameName,
  findQuizFromQuizId,
  getQuizIndex,
  findUserFromEmail,
} from './helper';

/**
 * Retrieve a list of all quizzes created by the authenticated user.
 * @param {string} token of user
 * @returns {object}
 */
export function adminQuizList(token) {
  const data = getData();
  const arr = [];
  console.log(token);
  // Check if the token is empty
  if (token === '') {
    return {
      error: 'Token is empty',
    };
  }

  // decode the token and get the authUserId and sessionId
  const tokenData = decodeToken(token);
  const authUserId = tokenData.authUserId;

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
 *
 * @param {string} token of user
 * @param {string} name Name of user
 * @param {string} description Description of new quiz
 * @returns
 */
export function adminQuizCreate(token, name, description) {
  const data = getData();

  // Check if the token is empty
  if (token === '') {
    return {
      error: 'Token is empty',
    };
  }
  // decode the token and get the authUserId and sessionId
  const tokenData = decodeToken(token);
  const authUserId = tokenData.authUserId;

  // verify user with the sessionId and authUserId
  const userExists = findUserFromToken(tokenData);

  if (!userExists) {
    return { error: 'Token is invalid' };
  }

  if (!validQuizName(name)) {
    return {
      error: 'Name contains invalid characters. Only alphanumeric' +
        'characters and spaces are allowed.'
    };
  }

  if (name.length < 3 || name.length > 30) {
    return { error: 'Name must be between 3 and 30 characters long.' };
  }

  if (nameUsed(authUserId, name)) {
    return { error: 'Name is already used for another quiz.' };
  }

  if (description.length > 100) {
    return { error: 'Description is more than 100 characters in length.' };
  }

  const newQuizId = data.quizzes.length + 1;
  const newQuiz = {
    quizId: newQuizId,
    authUserId,
    name,
    description,
    timeCreated: Math.floor(Date.now() / 1000),
    timeLastEdited: Math.floor(Date.now() / 1000),
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
export function adminQuizRemove(token, quizId) {
  const data = getData();

  const tokenObj = decodeToken(token);
  const user = findUserFromToken(tokenObj);

  if (!user) {
    return { error: 'AuthUserId is not a valid user.' };
  }

  // Check if the quizId refers to a valid quiz
  const quizIndex = data.quizzes.findIndex(quiz => quiz.quizId === quizId);
  if (quizIndex === -1) {
    return { error: 'Quiz ID does not refer to a valid quiz.' };
  }

  // Check if the quiz belongs to the user
  const quiz = data.quizzes[quizIndex];
  if (quiz.authUserId !== tokenObj.authUserId) {
    return { error: 'Quiz ID does not refer to a quiz that this user owns.' };
  }

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
// export function adminQuizInfo(authUserId, quizId) {

export function adminQuizInfo(token, quizId) {
  const data = getData();

  const tokenObj = decodeToken(token);
  const user = findUserFromToken(tokenObj);
  if (!user) {
    return { error: 'Unable to find user Id ' };
  }

  const quiz = data.quizzes.find(quiz => quiz.quizId === quizId);
  if (!quiz) {
    return { error: 'Quiz unable to be found' };
  }

  if (quiz.authUserId !== tokenObj.authUserId) {
    return { error: 'The given user does not own the given quiz' };
  }

  return {
    quizId: quiz.quizId,
    name: quiz.name,
    timeCreated: quiz.timeCreated,
    timeLastEdited: quiz.timeLastEdited,
    description: quiz.description,
  };
}

/**
Updates the name of the relevant quiz
@param {integer} authUser Id of user
@param {integer} quizId of user
@param {string} name
@returns empty object { }
*/
export function adminQuizNameUpdate(token, quizId, name) {
  let user = false;
  let isQuizExist = false;
  const data = getData();
  if (!encodedTokenExists(token)) {
    return {
      error: 'Invalid token',
    };
  }
  // Search through the data to check if the user exists
  // for (let i = 0; i < data.users.length; i++) {
  //   if (data.users[i].authUserId === authUserId) {
  //     isUserExist = true;
  //   }
  // }
  const tokenDecoded = decodeToken(token);
  user = findUserFromToken(tokenDecoded);
  if (!user) {
    return {
      error: 'User Id does not exist',
    };
    // Check quiz exists
  }
  // Search through the data to check if the quiz exists
  for (let i = 0; i < data.quizzes.length; i++) {
    if (data.quizzes[i].quizId === quizId) {
      isQuizExist = true;
    }
  }
  // Check user owns the quiz
  for (let i = 0; i < data.quizzes.length; i++) {
    if (data.quizzes[i].quizId === quizId) {
      if (data.quizzes[i].authUserId !== user.authUserId) {
        return {
          error: 'User does not own the quiz',
        };
      }
    }
  }
  // Check quiz name is already used
  for (let i = 0; i < data.quizzes.length; i++) {
    if (data.quizzes[i].name === name) {
      return {
        error: 'Name is already used',
      };
    }
  }

  // Check user exists
  if (!isQuizExist) {
    return {
      error: 'Quiz Id does not exist',
    };
    // Check name contains invalid characters. Valid characters are alphanumeric and spaces.
  } else if (!name.match(/^[a-zA-Z0-9 ]+$/)) {
    return {
      error: 'Name contains invalid characters (Valid characters are alphanumeric and spaces)',
    };
    // Check name is less than 3 characters and more than 30 characters.
  } else if (name.length < 3 || name.length > 30) {
    return {
      error: 'Name must be between 3 and 30 characters long',
    };
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
Updates the description of the relevant quiz
@param {integer} authUser Id of user
@param {integer} quizId of user
@param {string} description
@returns empty object { }
*/
export function adminQuizDescriptionUpdate(token, quizId, description) {
  const data = getData();

  if (!token) {
    return { error: 'Token is empty' };
  }

  const tokenData = decodeToken(token);
  const authUserId = tokenData.authUserId;

  const userExists = data.users.some(user =>
    user.tokens && user.tokens.some(t => t.sessionId === tokenData.sessionId &&
    t.authUserId === authUserId)
  );

  if (!userExists) {
    return { error: 'AuthUserId is not a valid user.' };
  }

  const quiz = data.quizzes.find(q => q.quizId === quizId);
  if (!quiz) {
    return { error: 'Quiz ID does not refer to a valid quiz.' };
  }

  if (quiz.authUserId !== authUserId) {
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
export function adminQuizTransfer(token, userEmail, quizId) {
  const data = getData();

  const tokenDecoded = decodeToken(token);
  const loggedInUser = findUserFromToken(tokenDecoded);
  const userToTransferTo = findUserFromEmail(userEmail);

  if (!userToTransferTo) {
    return {
      error: 'No user has the given email',
    };
  } else if (!loggedInUser) {
    return {
      error: 'This is not a valid logged in user',
    };
  } else if (loggedInUser.email === userEmail) {
    return {
      error: 'The email is the same as the one of the current logged in user',
    };
  }

  const quizToTransfer = findQuizFromQuizId(quizId);
  if (!quizToTransfer) {
    return {
      error: 'No quiz exists with the given quizId',
    };
  } else if (quizToTransfer.authUserId !== tokenDecoded.authUserId) {
    return {
      error: 'This user does not own the quiz',
    };
  }

  if (userHasQuizWithSameName(userToTransferTo.authUserId, quizId)) {
    return {
      error: 'This user already owns a quiz with the same name',
    };
  }

  const quizIndex = getQuizIndex(quizId);
  data.quizzes[quizIndex].authUserId = userToTransferTo.authUserId;
  return { };
}
