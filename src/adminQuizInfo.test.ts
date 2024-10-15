/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import {
  adminQuizInfo,
  adminQuizCreate,
} from './quiz';
import {
  adminAuthRegister,
} from './auth';
import {
  clear,
} from './other';

beforeEach(() => {
  // Reset the state of our data so that each tests can run independently
  clear();
});

/* | ---------------------------------------------|
*   |                                                                                            |
*   |       adminQuizInfo tests done by MOHAMMAD             |
*   |                                                                                            |
*   -----------------------------------------------|
*/

describe('adminQuizInfo', () => {
  describe('cases with errors', () => {
    test('authId does not correspond to any user', () => {
      const user = adminAuthRegister('hayden.smith@gmail.com', 'password1', 'Hayden', 'Smith');
      const quiz = adminQuizCreate(user.authUserId, 'quiz', 'A quiz by Hayden Smith');
      const result = adminQuizInfo(user.authUserId + 1, quiz.quizId);
      expect(result).toStrictEqual({ error: expect.any(String) });
    });
    test('quizId does not correspond to any quiz', () => {
      const user = adminAuthRegister('andrew.taylor@gmail.com', 'password1', 'Andrew', 'Taylor');
      const quiz = adminQuizCreate(user.authUserId, 'quiz', 'A quiz by Andrew Taylor');
      const result = adminQuizInfo(user.authUserId, quiz.quizId + 1);
      expect(result).toStrictEqual({ error: expect.any(String) });
    });
    test('quizId does not correspond to a quiz that the user owns', () => {
      const user1 = adminAuthRegister('hayden.smith@gmail.com', 'password1', 'Hayden', 'Smith');
      const user2 = adminAuthRegister('andrew.taylor@gmail.com', 'password1', 'Andrew', 'Taylor');
      const quiz1 = adminQuizCreate(user1.authUserId, 'quiz1', 'A quiz by Hayden Smith');
      const quiz2 = adminQuizCreate(user2.authUserId, 'quiz2', 'A quiz by Andrew Taylor');
      expect(quiz2.quizId).toStrictEqual(expect.any(Number));
      const result = adminQuizInfo(user2.authUserId, quiz1.quizId);
      expect(result).toStrictEqual({ error: expect.any(String) });
    });
    test.each([
      'string', // Non-numeric string
      null, // Null value
      {}, // Object
      [], // Array
      NaN, // Not-a-Number
    ])('authId is not a number', (input) => {
      const user = adminAuthRegister('andrew.taylor@gmail.com', 'password1', 'Andrew', 'Taylor');
      const quiz = adminQuizCreate(user.authUserId, 'quiz', 'A quiz by Andrew Taylor');
      const result = adminQuizInfo(input, quiz.quizId);
      expect(result).toStrictEqual({ error: expect.any(String) });
    });
  });
  describe('cases with no errors', () => {
    test('successfully return value for one user and one quiz', () => {
      const user = adminAuthRegister('jake.renzella@gmail.com', 'password1', 'Jake', 'Renzella');
      const quiz = adminQuizCreate(user.authUserId, 'quiz', 'A quiz by Jake Renzella');
      const result = adminQuizInfo(user.authUserId, quiz.quizId);
      expect(result).toStrictEqual({
        quizId: quiz.quizId,
        name: 'quiz',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'A quiz by Jake Renzella'
      });
    });
    test('successfullt return value when multiple users and quizzes exist', () => {
      const user1 = adminAuthRegister('jake.renzella@gmail.com', 'password1', 'Jake', 'Renzella');
      const quiz1 = adminQuizCreate(user1.authUserId, 'quiz1', 'A quiz by Jake Renzella');
      const user2 = adminAuthRegister('yuchao.zhang@gmail.com', 'password1', 'Yuchao', 'Zhang');
      const quiz2 = adminQuizCreate(user2.authUserId, 'quiz2', 'A quiz by Yuchao Zhang');
      expect(quiz2.quizId).toStrictEqual(expect.any(Number));
      const result = adminQuizInfo(user1.authUserId, quiz1.quizId);
      expect(result).toStrictEqual({
        quizId: quiz1.quizId,
        name: 'quiz1',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'A quiz by Jake Renzella'
      });
    });
  });
});
