// @ts-nocheck
import {
  adminQuizCreate,
  adminQuizRemove
} from './quiz';
import { adminAuthRegister } from './auth';
import { clear } from './other';

// Test case for adminQuizRemove function
describe('testing for adminQuizRemove', () => {
  test('successful quiz removal returns empty object', () => {
    clear();
    const authRegister = adminAuthRegister("aero@mail.com", "Aeropass1", "Jason", "Chandra");
    const name = 'name';
    const description = 'description';
    
    const quiz = adminQuizCreate(authRegister.authUserId, name, description);
    expect(quiz).toHaveProperty('quizId');

    const removalResult = adminQuizRemove(authRegister.authUserId, quiz.quizId);

    expect(removalResult).toStrictEqual({});
  });


  test('nonexistent user ID returns error', async () => {
    clear();
    const authUserId = -1;
    const quizId = 1;
    expect(adminQuizRemove(authUserId, quizId)).toStrictEqual({
      error: expect.any(String),
    });
  });


  test('nonexistent quiz ID returns error', async () => {
    clear();
    const authRegister = adminAuthRegister("aero@mail.com", "Aeropass1", "Jason", "Chandra");
    const quizId = -1; 
    expect(adminQuizRemove(authRegister.authUserId, quizId)).toStrictEqual({
      error: expect.any(String),
    });
  });


  test('user tries to remove quiz not owned by them returns error', async () => {
    clear();
    const authRegister1 = adminAuthRegister("aero@mail.com", "Aeropass1", "Jason", "Chandra");
    const authRegister2 = adminAuthRegister("other@mail.com", "OtherPass1", "John", "Doe");
    const name = 'name';
    const description = 'description';
    const quiz = adminQuizCreate(authRegister1.authUserId, name, description);
    expect(adminQuizRemove(authRegister2.authUserId, quiz.quizId)).toStrictEqual({
      error: expect.any(String),
    });
  });


  test.each([
    // Missing authUserId
    ['', 1],
    // Missing quizId
    ['authUserId', ''],
    // Missing both authUserId and quizId
    ['', '']
])('missing parameters return error', async (authUserId, quizId) => {
    expect(adminQuizRemove(authUserId, quizId)).toStrictEqual({
      error: expect.any(String),
    });
  });
});