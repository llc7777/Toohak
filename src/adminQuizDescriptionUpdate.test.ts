/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// Test: adminQuizDescriptionUpdate
import { clear } from './other';

import {
  adminAuthRegister,
} from './auth';

import {
  adminQuizCreate,
  adminQuizDescriptionUpdate,
  adminQuizInfo,
} from './quiz';

// Constant for error object
const ERROR = { error: expect.any(String) };

beforeEach(() => {
  // Reset the database for each test
  clear();
});

// Test for correct return value
describe('Test for correct return value', () => {
  // Test does it return empty object
  test('Should return empty object', () => {
    const user = adminAuthRegister('leo.kim@gmail.com', 'password1', 'Hayden', 'Smith');
    const quiz = adminQuizCreate(user.authUserId, 'Quiz 1', 'This is a quiz');
    const result = adminQuizDescriptionUpdate(user.authUserId, quiz.quizId, 'This is a new quiz');
    expect(result).toStrictEqual({});
  });

  // Test does it update the description
  test('Should update the description', () => {
    const user = adminAuthRegister('leo.kim@gmail.com', 'password1', 'Hayden', 'Smith');
    const quiz = adminQuizCreate(user.authUserId, 'Quiz 1', 'This is a quiz');
    adminQuizDescriptionUpdate(user.authUserId, quiz.quizId, 'This is a new quiz');
    expect(adminQuizInfo(user.authUserId, quiz.quizId)).toStrictEqual({
      quizId: quiz.quizId,
      name: 'Quiz 1',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'This is a new quiz',
    });
  });

  // Test does it update the description with 100 characters
  test('Should update the description with 100 characters', () => {
    const user = adminAuthRegister('leo.kim@gmail.com', 'password1', 'Hayden', 'Smith');
    const quiz = adminQuizCreate(user.authUserId, 'Quiz 1', 'This is a quiz');
    adminQuizDescriptionUpdate(user.authUserId, quiz.quizId, 'quiz'.repeat(25));
    expect(adminQuizInfo(user.authUserId, quiz.quizId)).toStrictEqual({
      quizId: quiz.quizId,
      name: 'Quiz 1',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'quiz'.repeat(25),
    });
  });

  // Test does it update the empty description
  test('Should update the empty description', () => {
    const user = adminAuthRegister('leo.kim@gmail.com', 'password1', 'Hayden', 'Smith');
    const quiz = adminQuizCreate(user.authUserId, 'Quiz 1', 'This is a new quiz');
    adminQuizDescriptionUpdate(user.authUserId, quiz.quizId, '');
    expect(adminQuizInfo(user.authUserId, quiz.quizId)).toStrictEqual({
      quizId: quiz.quizId,
      name: 'Quiz 1',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: '',
    });
  });

  // Test does it change descriptions multiple times
  test('Should update the description multiple times', () => {
    const user = adminAuthRegister('leo.kim@gmail.com', 'password1', 'Hayden', 'Smith');
    const quiz = adminQuizCreate(user.authUserId, 'Quiz 1', 'This is a quiz');
    adminQuizDescriptionUpdate(user.authUserId, quiz.quizId, 'This is a new quiz');
    // First update
    expect(adminQuizInfo(user.authUserId, quiz.quizId)).toStrictEqual({
      quizId: quiz.quizId,
      name: 'Quiz 1',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'This is a new quiz',
    });
    // Second update
    adminQuizDescriptionUpdate(user.authUserId, quiz.quizId, 'This is a newer quiz');
    expect(adminQuizInfo(user.authUserId, quiz.quizId)).toStrictEqual({
      quizId: quiz.quizId,
      name: 'Quiz 1',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'This is a newer quiz',
    });
    // Third update
    adminQuizDescriptionUpdate(user.authUserId, quiz.quizId, 'This is the newest quiz');
    expect(adminQuizInfo(user.authUserId, quiz.quizId)).toStrictEqual({
      quizId: quiz.quizId,
      name: 'Quiz 1',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'This is the newest quiz',
    });
  });

  // Test does it update multiple quizzes
  test('Should update multiple quizzes', () => {
    const user = adminAuthRegister('leo.kim@gmail.com', 'password1', 'Hayden', 'Smith');
    const quiz1 = adminQuizCreate(user.authUserId, 'Quiz 1', 'This is a quiz');
    const quiz2 = adminQuizCreate(user.authUserId, 'Quiz 2', 'This is a quiz');
    adminQuizDescriptionUpdate(user.authUserId, quiz1.quizId, 'This is a new quiz');
    adminQuizDescriptionUpdate(user.authUserId, quiz2.quizId, 'This is a newer quiz');
    // Check if both quizzes have been updated
    expect(adminQuizInfo(user.authUserId, quiz1.quizId)).toStrictEqual({
      quizId: quiz1.quizId,
      name: 'Quiz 1',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'This is a new quiz',
    });
    expect(adminQuizInfo(user.authUserId, quiz2.quizId)).toStrictEqual({
      quizId: quiz2.quizId,
      name: 'Quiz 2',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'This is a newer quiz',
    });
  });
});

// Test for error handling
describe('Test for error handling', () => {
  // Test for invalid authUserId
  test('Should return error with invalid authUserId', () => {
    const user = adminAuthRegister('leo.kim@gmail.com', 'password1', 'Hayden', 'Smith');
    const quiz = adminQuizCreate(user.authUserId, 'Quiz 1', 'This is a quiz');
    // Check if error is returned for invalid authUserId by adding random number to the authUserId
    expect(adminQuizDescriptionUpdate(user.authUserId + 1531, quiz.quizId, 'This is a new quiz')).toStrictEqual(ERROR);
  });

  // Test for invalid quizId
  test('Should return error with invalid quizId', () => {
    const user = adminAuthRegister('leo.kim@gmail.com', 'password1', 'Hayden', 'Smith');
    const quiz = adminQuizCreate(user.authUserId, 'Quiz 1', 'This is a quiz');
    // Check if error is returned for invalid quizId by adding random number to the quizId
    expect(adminQuizDescriptionUpdate(user.authUserId, quiz.quizId + 1531, 'This is a new quiz')).toStrictEqual(ERROR);
  });

  // Test for invalid authUserId and quizId
  test('Should return error with invalid authUserId and quizId', () => {
    const user = adminAuthRegister('leo.kim@gmail.com', 'password1', 'Hayden', 'Smith');
    const quiz = adminQuizCreate(user.authUserId, 'Quiz 1', 'This is a quiz');
    // Check if error is returned for invalid authUserId and quizId by adding random number to both
    expect(adminQuizDescriptionUpdate(user.authUserId + 1531, quiz.quizId + 1531, 'This is a new quiz')).toStrictEqual(ERROR);
  });

  // Test for invalid quiz owner
  test('Should return error with invalid quiz owner', () => {
    const user = adminAuthRegister('leo.kim@gmail.com', 'password1', 'Hayden', 'Smith');
    const user2 = adminAuthRegister('w@gmail', 'password1', 'John', 'Doe');
    const quiz = adminQuizCreate(user.authUserId, 'Quiz 1', 'This is a quiz');
    const quiz2 = adminQuizCreate(user2.authUserId, 'Quiz 2', 'This is a quiz');
    // Check if error is returned for invalid quiz owner
    expect(adminQuizDescriptionUpdate(user2.authUserId, quiz.quizId, 'This is a new quiz')).toStrictEqual(ERROR);
    // Check vice versa
    expect(adminQuizDescriptionUpdate(user.authUserId, quiz2.quizId, 'This is a new quiz')).toStrictEqual(ERROR);
  });

  // Test for more than 100 description characters
  test('Should return error with more than 100 characters in description', () => {
    const user = adminAuthRegister('leo.kim@gmail.com', 'password1', 'Hayden', 'Smith');
    const quiz = adminQuizCreate(user.authUserId, 'Quiz 1', 'This is a quiz');
    // Check if error is returned for more than 100 characters
    expect(adminQuizDescriptionUpdate(user.authUserId, quiz.quizId, 'q'.repeat(101))).toStrictEqual(ERROR);
  });
});
