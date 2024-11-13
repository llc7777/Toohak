
import { getData } from './dataStore';
import { emptyTrashErrorChecking } from './helper';
import { Data } from './interfaces';

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
  store.sessions = [];
  return {};
}

/**
 * Function to empty the quiz trash
 * @param {object} token - The authentication token of the user
 * @param {number} quizIds - A JSON number representing an array of quiz IDs to delete
 * @returns {Object}
 */
export function emptyTrash(token: string, quizIds: number[]): object {
  emptyTrashErrorChecking(token, quizIds);

  const data: Data = getData();
  data.trash = data.trash.filter(quiz => !quizIds.includes(quiz.quizId));

  return {};
}
