/**
 * Reset the state of the application back to the start.
 * Parameters: no parameters
 * Return object: empty object
 */
import { getData } from './dataStore.js'

export function clear() {
  let store = getData();
  store.users = [];
  store.quizzes = [];
  return {};
}





