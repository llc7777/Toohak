/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/**
 * Reset the state of the application back to the start.
 * Parameters: no parameters
 * Return object: empty object
 */
import { getData } from './dataStore';

export function clear() {
  const store = getData();
  store.users = [];
  store.quizzes = [];
  return {};
}
