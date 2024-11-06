/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

import { Token } from 'yaml/dist/parse/cst';
import { getData } from './dataStore';
import { decodeToken, findUserFromToken } from './helper';
import { ErrorResponse, Token } from './interfaces';

/**
 * Reset the state of the application back to the start.
 * Parameters: no parameters
 * Return object: empty object
 */
export function clear() {
  const store = getData();
  store.users = [];
  store.quizzes = [];
  store.trash = [];
  return {};
}

/**
 * Function to empty the quiz trash
 * @param {object} token - The authentication token of the user
 * @param {string} quizIds - A JSON string representing an array of quiz IDs to delete
 * @returns {Object}
 */
export function emptyTrash(token: Token, quizIds: string): object | ErrorResponse {
  const data = getData();

  if (token === '') {
    return { error: 'Token is empty' };
  }

  const tokenData = decodeToken(token);
  const user = findUserFromToken(tokenData);
  if (!user) {
    return { error: 'Token is invalid' };
  }

  if (!Array.isArray(quizIds)) {
    return { error: 'quizIds must be an array' };
  }

  if (data.quizzes.find(quiz => quiz.quizId === quizId)) {
    return { error: 'This quiz is not in the trash.' };
  }

  for (const quizId of quizIds) {
    const quizInTrash = data.trash.find(
      quiz => quiz.quizId === quizId
    );

    if (!quizInTrash) {
      return { error: 'One or more quiz IDs are not currently in the trash.' };
    }

    if (quizInTrash.authUserId !== user.authUserId) {
      return { error: 'You do not own quiz ID' };
    }
  }
  data.trash = data.trash.filter(quiz => !quizIds.includes(quiz.quizId));

  return {};
}
