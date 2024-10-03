/*
 Test file for clear
 */
 import { clear } from './other.js';
 import { adminAuthRegister } from './auth.js';
 import { adminQuizCreate } from './quiz.js'; 
 import { getData } from './dataStore.js';

 describe('clear function', () => {
     test('Clear data when there is only one user', () => {
         let user1 = adminAuthRegister('aero1@mail.com', 'password1', 'Jason', 'Chandra');
         expect(clear()).toStrictEqual({});
         let currentData = getData();
         expect(currentData).toStrictEqual({ users: [], quizzes: [] });
     });

     test('Clear data when there is two user', () => {
         let user1 = adminAuthRegister('aero1@mail.com', 'password1', 'Jason', 'Chandra');
         let user2 = adminAuthRegister('aero2@mail.com', 'password2', 'Jake', 'Renzella');
         expect(clear()).toStrictEqual({});
         let currentData = getData();
         expect(currentData).toStrictEqual({ users: [], quizzes: [] });
     });

     test('Clear data when there is one user and one quiz', () => {
         let user1 = adminAuthRegister('aero1@mail.com', 'password1', 'Jason', 'Chandra');
         let quiz1 = adminQuizCreate('user1.authUserId', 'quiz1', 'Description quiz1');
         expect(clear()).toStrictEqual({});
         let currentData = getData();
         expect(currentData).toStrictEqual({ users: [], quizzes: [] });
     });

     test('Clear data when there is two user and two quiz', () => {
         let user1 = adminAuthRegister('aero1@mail.com', 'password1', 'Jason', 'Chandra');
         let user2 = adminAuthRegister('aero2@mail.com', 'password2', 'Jake', 'Renzella');
         let quiz1 = adminQuizCreate('user1.authUserId', 'quiz1', 'Description quiz1');
         let quiz2 = adminQuizCreate('user1.authUserId', 'quiz2', 'Description quiz2');
         expect(clear()).toStrictEqual({});
         let currentData = getData();
         expect(currentData).toStrictEqual({ users: [], quizzes: [] });
     });

     test('Already cleared state', () => {
         clear();
         expect(clear()).toStrictEqual({});
         let currentData = getData();
         expect(currentData).toStrictEqual({ users: [], quizzes: [] });
     });
 });
