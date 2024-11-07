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
  adminQuizMoveQuestionErrorChecking
} from './helper';
import {
  ErrorResponse,
  User,
  Token,
  Quiz,
  AnswerOptions,
  QuestionInfo
} from './interfaces';

export function adminQuizQuestionCreate(
  quizId: number,
  token: string,
  question: string,
  timeLimit: number,
  points: number,
  answerOptions: AnswerOptions[]
) {
  if (!encodedTokenExists(token)) {
    return {
      error: 'Invalid token',
    };
  }

  const tokenDecoded = decodeToken(token);
  const user = findUserFromToken(tokenDecoded);
  if (!user) {
    return {
      error: 'User Id does not exist',
    };
  }

  const quiz = findQuizFromQuizId(quizId);
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
  const quizIndex: number = getQuizIndex(quizId);
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
  let totalTime: number = timeLimit;
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
  let hasCorrectAnswer: boolean = false;
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

  const newQuestionId: number = quiz.questions.length + 1;
  const newQuestion: QuestionInfo = {
    questionId: newQuestionId,
    question: question,
    timeLimit: timeLimit,
    points: points,
    answerOptions: answerOptions
  };

  const data = getData();

  data.quizzes[quizIndex].timeLastEdited = Math.floor(Date.now() / 1000);

  data.quizzes[quizIndex].questions.push(newQuestion);
  return { questionId: newQuestionId };
}

export function adminQuizMoveQuestion(
  token: string,
  quizId: number,
  questionId: number,
  newPosition: number
): object | ErrorResponse {
  adminQuizMoveQuestionErrorChecking(token, quizId, questionId, newPosition);

  const quiz: Quiz = findQuizFromQuizId(quizId);
  const questionIndex: number = getQuestionIndexFromQuestionId(questionId, quizId);

  quiz.timeLastEdited = Math.floor(Date.now() / 1000);
  const tempQuestion: QuestionInfo = quiz.questions[questionIndex];
  quiz.questions[questionIndex] = quiz.questions[newPosition];
  quiz.questions[newPosition] = tempQuestion;

  return { };
}

export function adminQuizQuestionDuplicate(
  quizId: number,
  questionId: number,
  token: string
) {
  const data = getData();
  // Checks token and user is valid
  if (!encodedTokenExists(token)) {
    return {
      error: 'Invalid token',
    };
  }
  const tokenDecoded = decodeToken(token);
  const user = findUserFromToken(tokenDecoded);
  if (!user) {
    return {
      error: 'User Id does not exist',
    };
  }
  // Search through the data to check if the quiz exists
  const quiz: Quiz = findQuizFromQuizId(quizId);
  if (!quiz) {
    return {
      error: 'Quiz Id does not exist',
    };
  }
  const quizIndex: number = getQuizIndex(quizId);
  // Search through the data to check if the question exists
  const question: QuestionInfo = findQuestionFromQuestionId(questionId, quizId);
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
    questionId: newQuestionId,
    question: question.question,
    timeLimit: question.timeLimit,
    points: question.points,
    answerOptions: question.answerOptions
  };
  data.quizzes[quizIndex].timeLastEdited = Math.floor(Date.now() / 1000);
  data.quizzes[quizIndex].questions.push(duplicateQuestion);
  return { duplicatedQuestionId: newQuestionId };
}

/**
 * Updates a question in a specified quiz with new details.
 *
 * @param {number} quizId - The ID of the quiz containing the question to update.
 * @param {number} questionId - The ID of the question to update within the quiz.
 * @param {string} token - The user's authentication token.
 * @param {string} question - The new question text.
 * @param {AnswerOptions[]} answerOptions - An array of answer options.
 * @param {number} timeLimit - The time limit for answering the question.
 * @param {number} points - The points awarded for the question.
 * @returns {Object | ErrorResponse} - An empty object on success or an error message on failure.
 */
export function adminQuizQuestionUpdate(
  quizId: number,
  questionId: number,
  token: string,
  question: string,
  timeLimit: number,
  points: number,
  answerOptions: AnswerOptions[]
): object | ErrorResponse {
  if (!token) {
    return { error: 'Token is missing' };
  }

  const tokenData: Token = decodeToken(token);
  const user: User | null = findUserFromToken(tokenData);
  if (!user) {
    return { error: 'Invalid token' };
  }

  const quiz: Quiz | undefined = findQuizFromQuizId(quizId);
  if (!quiz) {
    return { error: 'No such quiz exists' };
  }

  if (quiz.authUserId !== user.authUserId) {
    return { error: 'User does not own the quiz' };
  }

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

  const totalTime = quiz.questions.reduce((total, q) => total + q.timeLimit, 0) -
                    quiz.questions[questionIndex].timeLimit + timeLimit;
  if (totalTime > 180) {
    return { error: 'Total time limit across quiz must not exceed 3 minutes' };
  }

  if (points < 1 || points > 10) {
    return { error: 'Points awarded must be between 1 and 10 points' };
  }

  const answerSet = new Set(answerOptions.map(option => option.answer));
  const allAnswersValid = answerOptions.every(option =>
    option.answer.length >= 1 && option.answer.length <= 30
  );
  if (!allAnswersValid) {
    return { error: 'Answers must be between 1 and 30 characters long' };
  }
  if (answerSet.size !== answerOptions.length) {
    return { error: 'Answers must have no duplicates of one another' };
  }

  const hasCorrectAnswer = answerOptions.some(option => option.correct);
  if (!hasCorrectAnswer) {
    return { error: 'There must be at least one correct answer' };
  }

  const updatedQuestion: QuestionInfo = {
    questionId,
    question,
    timeLimit,
    points,
    answerOptions,
  };
  quiz.questions[questionIndex] = updatedQuestion;
  quiz.timeLastEdited = Math.floor(Date.now() / 1000);

  answerOptions.forEach((option, index) => {
    option.colour = option.colour || getRandomColour();
    option.answerId = index + 1;
  });

  return {};
}

/**
 * Deletes a question from a quiz if the user is authenticated and owns the quiz.
 * @param {string} token - The authentication token of the user
 * @param {number} quizId - The ID of the quiz from which the question will be deleted
 * @param {number} questionId - The ID of the question to be deleted
 * @returns {object | ErrorResponse} - An empty object on success or an error message on failure
 */
export function adminQuizQuestionDelete(
  token: string,
  quizId: number,
  questionId: number
): object | ErrorResponse {
  if (!token) {
    return { error: 'Token is empty' };
  }

  const tokenData: Token = decodeToken(token);
  const user: User | null = findUserFromToken(tokenData);

  if (!user) {
    return { error: 'Invalid token' };
  }

  const quiz: Quiz | undefined = findQuizFromQuizId(quizId);
  if (!quiz) {
    return { error: 'Quiz ID does not refer to a valid quiz.' };
  }

  if (quiz.authUserId !== user.authUserId) {
    return { error: 'User does not own the quiz.' };
  }

  const questionIndex: number = getQuestionIndexFromQuestionId(questionId, quizId);
  if (questionIndex === -1) {
    return { error: 'Question ID does not refer to a valid question.' };
  }

  quiz.questions.splice(questionIndex, 1);
  quiz.timeLastEdited = Math.floor(Date.now() / 1000);

  return {};
}
