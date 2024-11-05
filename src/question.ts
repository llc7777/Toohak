/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { getData } from './dataStore';

import {
  decodeToken,
  findUserFromToken,
  encodedTokenExists,
  findQuizFromQuizId,
  getQuizIndex,
  getRandomColour,
  findQuestionFromQuestionId,
  getQuestionIndexFromQuestionId,
} from './helper';

export function adminQuizQuestionCreate(
  quizId,
  token,
  question,
  timeLimit,
  points,
  answerOptions
) {
  const data = getData();

  // Token, quizId, user checks
  let user = false;
  let quiz = false;
  if (!encodedTokenExists(token)) {
    return {
      error: 'Invalid token',
    };
  }

  const tokenDecoded = decodeToken(token);
  user = findUserFromToken(tokenDecoded);
  if (!user) {
    return {
      error: 'User Id does not exist',
    };
  }

  quiz = findQuizFromQuizId(quizId);
  if (!quiz) {
    return {
      error: 'No such quiz exists',
    };
  }
  if (quiz.authUserId !== user.authUserId) {
    return {
      error: 'User does not own the quiz',
    };
  }
  const quizIndex = getQuizIndex(quizId);
  // Question body checks
  // Question string between 5 and 50 characters
  if (question.length < 5 || question.length > 50) {
    return {
      error: 'Question must be between 5 to 50 characters',
    };
  }
  // Question has between 2 and 6 answers
  if (answerOptions.length < 2 || answerOptions.length > 6) {
    return {
      error: 'Question must have between 2 to 6 answers',
    };
  }
  // Question time limit is a positive number
  if (timeLimit <= 0) {
    return {
      error: 'Time limit must be a postive number',
    };
  }
  // Sum of question time limits in quiz does not exceed 3 minutes
  let totalTime = timeLimit;
  for (const question of quiz.questions) {
    totalTime += question.timeLimit;
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
  }
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
  let hasCorrectAnswer = false;
  for (const options of answerOptions) {
    if (options.correct === true) {
      hasCorrectAnswer = true;
    }
  }

  if (!hasCorrectAnswer) {
    return {
      error: 'There must be at least one correct answer',
    };
  }

  for (const index in answerOptions) {
    answerOptions[index].colour = getRandomColour();
    answerOptions[index].answerId = parseInt(index) + 1;
  }

  const newQuestionId = quiz.questions.length + 1;
  const newQuestion = {
    questionId: newQuestionId,
    question: question,
    timeLimit: timeLimit,
    points: points,
    answerOptions: answerOptions
  };
  data.quizzes[quizIndex].timeLastEdited = Math.floor(Date.now() / 1000);

  data.quizzes[quizIndex].questions.push(newQuestion);
  return { questionId: newQuestionId };
}

export function adminQuizMoveQuestion(token, quizId, questionId, newPosition) {
  const tokenObj = decodeToken(token);
  const user = findUserFromToken(tokenObj);

  if (!user) {
    return { error: 'AuthUserId is not a valid user.' };
  }

  const quiz = findQuizFromQuizId(quizId);
  if (!quiz) {
    return {
      error: 'The given quizId does not refer to any quiz',
    };
  }
  if (quiz.authUserId !== tokenObj.authUserId) {
    return {
      error: 'This user does not own the given quiz',
    };
  }
  if (newPosition < 0 || newPosition > quiz.questions.length - 1) {
    return {
      error: 'The new position is outside the bounds of the questions array',
    };
  }
  const questionIndex = getQuestionIndexFromQuestionId(questionId, quizId);
  if (questionIndex === -1) {
    return {
      error: 'No question exists within the quiz for the given questionId',
    };
  }
  if (questionIndex === newPosition) {
    return {
      error: 'The new position and the current question position are the same',
    };
  }
  quiz.timeLastEdited = Math.floor(Date.now() / 1000);
  const tempQuestion = quiz.questions[questionIndex];
  quiz.questions[questionIndex] = quiz.questions[newPosition];
  quiz.questions[newPosition] = tempQuestion;

  return { };
}

export function adminQuizQuestionDuplicate(quizId, questionId, token) {
  let user = false;
  const data = getData();
  // Checks token and user is valid
  if (!encodedTokenExists(token)) {
    return {
      error: 'Invalid token',
    };
  }
  const tokenDecoded = decodeToken(token);
  user = findUserFromToken(tokenDecoded);
  if (!user) {
    return {
      error: 'User Id does not exist',
    };
  }
  // Search through the data to check if the quiz exists
  const quiz = findQuizFromQuizId(quizId);
  if (!quiz) {
    return {
      error: 'Quiz Id does not exist',
    };
  }
  const quizIndex = getQuizIndex(quizId);
  // Search through the data to check if the question exists
  const question = findQuestionFromQuestionId(questionId, quizId);
  if (!question) {
    return {
      error: 'Question Id does not exist',
    };
  }

  // Check user owns the quiz
  if (quiz.authUserId !== user.authUserId) {
    return {
      error: 'User does not own the quiz',
    };
  }

  const newQuestionId = quiz.questions.length + 1;
  const duplicateQuestion = {
    question: quiz.question,
    timeLimit: quiz.timeLimit,
    points: quiz.points,
    answerOptions: quiz.answerOptions
  };
  data.quizzes[quizIndex].timeLastEdited = Math.floor(Date.now() / 1000);
  data.quizzes[quizIndex].questions.push(duplicateQuestion);
  return { duplicatedQuestionId: newQuestionId };
}

/**
 * Updates a question in a specified quiz with new details.
 *
 * @param {string} token - The authentication token of the user.
 * @param {number} quizId - The ID of the quiz containing the question to update.
 * @param {number} questionId - The ID of the question to update within the quiz.
 * @param {string} question - The new question text.
 * @param {string[]} answers - An array of answer options.
 * @param {number} timeLimit - The time limit for answering the question.
 * @param {number} points - The points awarded for the question.
 *
 * @returns {Object} an empty object
 */
export function adminQuizQuestionUpdate(
  quizId,
  questionId,
  token,
  question,
  timeLimit,
  points,
  answerOptions
) {
  const data = getData();

  if (!encodedTokenExists(token)) {
    return { error: 'Invalid token' };
  }

  const tokenDecoded = decodeToken(token);
  const user = findUserFromToken(tokenDecoded);
  if (!user) {
    return { error: 'User Id does not exist' };
  }

  const quiz = findQuizFromQuizId(quizId);
  if (!quiz) {
    return { error: 'No such quiz exists' };
  }

  if (quiz.authUserId !== user.authUserId) {
    return { error: 'User does not own the quiz' };
  }

  const quizIndex = getQuizIndex(quizId);
  const questionIndex = quiz.questions.findIndex(q => q.questionId === questionId);
  if (questionIndex === -1) {
    return { error: 'No such question exists' };
  }

  if (question.length < 5 || question.length > 50) {
    return { error: 'Question must be between 5 to 50 characters' };
  }

  if (answerOptions.length < 2 || answerOptions.length > 6) {
    return { error: 'Question must have between 2 to 6 answers' };
  }

  if (timeLimit <= 0) {
    return { error: 'Time limit must be a positive number' };
  }

  let totalTime = quiz.questions.reduce(
    (total, q) => total + q.timeLimit, 0) - quiz.questions[questionIndex].timeLimit;
  totalTime += timeLimit;
  if (totalTime > 180) {
    return { error: 'Total time limit across quiz must not exceed 3 minutes' };
  }

  if (points < 1 || points > 10) {
    return { error: 'Points awarded must be between 1 and 10 points' };
  }

  for (const option of answerOptions) {
    if (option.answer.length < 1 || option.answer.length > 30) {
      return { error: 'Answers must be between 1 and 30 characters long' };
    }
  }

  const answerSet = new Set();
  for (const option of answerOptions) {
    if (answerSet.has(option.answer)) {
      return { error: 'Answers must have no duplicates of one another' };
    }
    answerSet.add(option.answer);
  }

  const hasCorrectAnswer = answerOptions.some(option => option.correct === true);
  if (!hasCorrectAnswer) {
    return { error: 'There must be at least one correct answer' };
  }

  const updatedQuestion = {
    questionId,
    question,
    timeLimit,
    points,
    answerOptions,
  };

  data.quizzes[quizIndex].questions[questionIndex] = updatedQuestion;
  data.quizzes[quizIndex].timeLastEdited = Math.floor(Date.now() / 1000);

  for (const index in answerOptions) {
    answerOptions[index].colour = getRandomColour();
    answerOptions[index].answerId = parseInt(index) + 1;
  }

  return {};
}

/**
 * Deletes a question from a quiz
 * @param {string} token - The token of the user
 * @param {number} quizId - The ID of the quiz
 * @param {number} questionId - The ID of the question to be deleted
 * @returns {object} - An empty object if successful
 */
export function adminQuizQuestionDelete(token, quizId, questionId) {
  if (!token) {
    return { error: 'Token is empty' };
  }

  const tokenData = decodeToken(token);
  const authUserId = tokenData.authUserId;

  const userExists = findUserFromToken(tokenData);
  if (!userExists) {
    return { error: 'Token is invalid' };
  }

  const quiz = findQuizFromQuizId(quizId);
  if (!quiz) {
    return { error: 'Quiz ID does not refer to a valid quiz.' };
  }

  if (quiz.authUserId !== authUserId) {
    return { error: 'Quiz ID does not refer to a quiz that this user owns.' };
  }

  const questionIndex = getQuestionIndexFromQuestionId(questionId, quizId);
  if (questionIndex === -1) {
    return { error: 'Question ID does not refer to a valid question.' };
  }

  quiz.questions.splice(questionIndex, 1);
  quiz.timeLastEdited = Math.floor(Date.now() / 1000);

  return {};
}
