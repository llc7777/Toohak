/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { getData } from './dataStore';
import {
  validQuizName,
  nameUsed,
  decodeToken,
  findUserFromToken,
  encodedTokenExists
} from './helper';

/**
 * Retrieve a list of all quizzes created by the authenticated user.
 * @param {integer} authUserId
 * @returns {object}
 */
export function adminQuizList(token) {
  const data = getData();
  const arr = [];

  // Check if the token is empty
  if (token === '') {
    return {
      error: 'Token is empty',
    };
  }

  // decode the token and get the authUserId and sessionId
  const tokenData = decodeToken(token);
  const authUserId = tokenData.authUserId;
  const sessionId = tokenData.sessionId;

  // verify user with the sessionId and authUserId
  const userExists = data.users.some(user =>
    user.tokens && user.tokens.some(token => token.sessionId === sessionId)
  );

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
 * @param {integer} authUserId Id of user
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
  const sessionId = tokenData.sessionId;

  // verify user with the sessionId and authUserId
  const userExists = data.users.some(user =>
    user.tokens && user.tokens.some(token => token.sessionId === sessionId &&
      token.authUserId === authUserId)
  );

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
  console.log(data.quizzes);

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

export function adminQuizQuestionCreate(
  quizId,
  token, 
  question,
  timeLimit,
  points,
  answerOptions,
) {
  const data = getData();

  // Token, quizId, user checks 
  let user = false;
  let quiz = false;
  if (!encodedTokenExists(token)) {
    return {
      error: 'Invalid token',
    };
  };

  const tokenDecoded = decodeToken(token);
  user = findUserFromToken(tokenDecoded);
  if (!user) {
    return {
      error: 'User Id does not exist',
    };
  };

  quiz = findQuizFromQuizId(quizId);
  if (quiz.authUserId !== user.authUserId) {
    return {
      error: 'User does not own the quiz',
    }
  }

  // Question body checks
  // Question string between 5 and 50 characters
  if (question.length < 5 || question.length > 50) {
    return {
      error: 'Question must be between 5 to 50 characters',
    };
  }; 
  // Question has between 2 and 6 answers
  if (answerOptions.length < 2 || answerOptions.length > 6 ) {
    return {
      error: 'Question must have between 2 to 6 answers',
    };
  };
  // Question time limit is a positive number
  if (timeLimit < 0) {
    return {
      error: 'Time limit must be a postive number',
    };
  };
  // Sum of question time limits in quiz does not exceed 3 minutes
  let totalTime = timeLimit;
  for (const question of quiz.questions) {
    totalTime += question.timeLimit
  }
  if (totalTime > 180) {
    return {
      error: 'Total time limit across quiz must not exceed 3 minutes',
    };
  }
  
  // Points awarded for the question are between 1 and 10
  if (points < 1 || points > 10) {
    return {
      error: 'Points awarded must be between 1 and 10 points',
    };
  };
  // The length of answers are between 1 and 30 characters long
  for (const options of answerOptions) {
    if (options.answer.length < 1 || options.answer.length > 30) {
      return {
        error: 'Answers must be between 1 and 30 characters long',
      };
    }
  }

  // Answers strings are not a duplicates of one another
  for (let i = 0; i < answerOptions.length; i++) {
    for (let j = i + 1; j < answerOptions.length; j++) {
      if (answerOptions[i].answer === answerOptions[j].answer) {
        return {
          error: 'Answers must have no duplicates of one another',
        };
      }
    }
  } 
  // There is at least 1 correct answer 
  for (const options of answerOptions) {
    const hasCorrectAnswer;
    if (options.correct === true) {
      hasCorrectAnswer = true
    }

    if(!hasCorrectAnswer) {
      return {
        error: 'There must be at least one correct answer',
      };
    } 
  };

  const newQuestionId = quiz.questions.length + 1;
  const newQuestion = {
    questionId: newQuestionId,
    question: question,
    timeLimit: timeLimit,
    points: points,
    answerOptions: answerOptions
  }
  data.quizzes[quizIndex].questions.push(newQuestion);
  return { questionId: newQuestionId };
}
