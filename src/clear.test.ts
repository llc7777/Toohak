/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/*
 Test file for clear
 */
import { clear } from './other';
import { adminAuthRegister } from './auth';
import { adminQuizCreate } from './quiz';
import { getData } from './dataStore';

describe('clear function', () => {
  test('Clear data when there is only one user', () => {
    const user1 = adminAuthRegister('aero1@mail.com', 'password1', 'Jason', 'Chandra');
    expect(user1.authUserId).toStrictEqual(expect.any(Number));
    expect(clear()).toStrictEqual({});
    const currentData = getData();
    expect(currentData).toStrictEqual({ users: [], quizzes: [] });
  });

  test('Clear data when there is two user', () => {
    const user1 = adminAuthRegister('aero1@mail.com', 'password1', 'Jason', 'Chandra');
    const user2 = adminAuthRegister('aero2@mail.com', 'password2', 'Jake', 'Renzella');
    expect(user1.authUserId).toStrictEqual(expect.any(Number));
    expect(user2.authUserId).toStrictEqual(expect.any(Number));
    expect(clear()).toStrictEqual({});
    const currentData = getData();
    expect(currentData).toStrictEqual({ users: [], quizzes: [] });
  });

  test('Clear data when there is one user and one quiz', () => {
    const user1 = adminAuthRegister('aero1@mail.com', 'password1', 'Jason', 'Chandra');
    expect(user1.authUserId).toStrictEqual(expect.any(Number));
    const quiz1 = adminQuizCreate(user1.authUserId, 'quiz1', 'Description quiz1');
    expect(quiz1.quizId).toStrictEqual(expect.any(Number));
    expect(clear()).toStrictEqual({});
    const currentData = getData();
    expect(currentData).toStrictEqual({ users: [], quizzes: [] });
  });

  test('Clear data when there is two user and two quiz', () => {
    const user1 = adminAuthRegister('aero1@mail.com', 'password1', 'Jason', 'Chandra');
    const user2 = adminAuthRegister('aero2@mail.com', 'password2', 'Jake', 'Renzella');
    expect(user1.authUserId).toStrictEqual(expect.any(Number));
    expect(user2.authUserId).toStrictEqual(expect.any(Number));

    const quiz1 = adminQuizCreate(user1.authUserId, 'quiz1', 'Description quiz1');
    const quiz2 = adminQuizCreate(user1.authUserId, 'quiz2', 'Description quiz2');
    expect(quiz1.quizId).toStrictEqual(expect.any(Number));
    expect(quiz2.quizId).toStrictEqual(expect.any(Number));

    expect(clear()).toStrictEqual({});
    const currentData = getData();
    expect(currentData).toStrictEqual({ users: [], quizzes: [] });
  });

  test('Already cleared state', () => {
    clear();
    expect(clear()).toStrictEqual({});
    const currentData = getData();
    expect(currentData).toStrictEqual({ users: [], quizzes: [] });
  });
});
