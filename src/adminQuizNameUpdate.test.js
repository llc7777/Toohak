import {
    adminQuizNameUpdate,
    adminQuizCreate,
    adminQuizInfo,
} from './quiz.js'

import {
    adminAuthRegister,
} from './auth.js'

import { clear } from './other.js';

beforeEach(() => {
    // reset the state of our data so that each tests can run independently
    clear();
});

/* ---------------------------------------------------|
*                                                                                                         |
*    adminQuizNameUpdate tests done by MOHAMMAD                 |
*                                                                                                           |
*   ----------------------------------------------------|
*/

describe('adminQuizNameUpdate', () => {
    describe('cases for errors', () => {
        test('authId does not correspond to any user', () => {
            let user = adminAuthRegister('jake.renzella@gmail.com', 'password1', 'Jake', 'Renzella');
            let quiz = adminQuizCreate(user.authUserId, 'VIM', 'A basic quiz on VIM commands');
            let result = adminQuizNameUpdate(user.authUserId + 1, quiz.quizId, 'VIM is bad');
            expect(result).toStrictEqual({ error: expect.any(String) });
        })
        test('quizId does not refer to an existing quiz', () => {
            let user = adminAuthRegister('jake.renzella@gmail.com', 'password1', 'Jake', 'Renzella');
            let quiz = adminQuizCreate(user.authUserId, 'VIM', 'A basic quiz on VIM commands');
            let result = adminQuizNameUpdate(user.authUserId, quiz.quizId + 1, 'VIM is bad');
            expect(result).toStrictEqual({ error: expect.any(String) });
        })
        test('quizId does not refer to a quiz that the user owns', () => {
            let user1 = adminAuthRegister('jake.renzella@gmail.com', 'password1', 'Jake', 'Renzella');
            let user2 = adminAuthRegister('hayden.smith@gmail.com', 'password1', 'Hayden', 'Smith');
            let quiz = adminQuizCreate(user1.authUserId, 'VIM', 'A basic quiz on VIM commands');
            let result = adminQuizNameUpdate(user2.authUserId, quiz.quizId, 'VIM is bad');
            expect(result).toStrictEqual({ error: expect.any(String) });
        });
        test.each([
            'VIM!!!',
            'VIM*',
            'VIM~',
            'VIM@',
            'VIM#'
        ])('new quiz name contains invalid characters', (newname) => {
            let user = adminAuthRegister('jake.renzella@gmail.com', 'password1', 'Jake', 'Renzella');
            let quiz = adminQuizCreate(user.authUserId, 'VIM', 'A basic quiz on VIM commands');
            let result = adminQuizNameUpdate(user.authUserId, quiz.quizId, newname);
            expect(result).toStrictEqual({ error: expect.any(String) });
        });
        test('new quiz name is too short. Less than 3 characters', () => {
            let user = adminAuthRegister('jake.renzella@gmail.com', 'password1', 'Jake', 'Renzella');
            let quiz = adminQuizCreate(user.authUserId, 'VIM', 'A basic quiz on VIM commands');
            let result = adminQuizNameUpdate(user.authUserId, quiz.quizId, 'vi');
            expect(result).toStrictEqual({ error: expect.any(String) });
        });
        test('new quiz name is too long. Longer than 30 characters', () => {
            let user = adminAuthRegister('jake.renzella@gmail.com', 'password1', 'Jake', 'Renzella');
            let quiz = adminQuizCreate(user.authUserId, 'VIM', 'A basic quiz on VIM commands');
            let newname = 'VIM is a better text editor than VSCode'
            let result = adminQuizNameUpdate(user.authUserId, quiz.quizId, newname);
            expect(result).toStrictEqual({ error: expect.any(String) });
        });
        test('Name is already used by the current logged in user for another quiz', () => {
            let user = adminAuthRegister('jake.renzella@gmail.com', 'password1', 'Jake', 'Renzella');
            let quiz1 = adminQuizCreate(user.authUserId, 'VIM', 'A basic quiz on VIM commands');
            let quiz2 = adminQuizCreate(user.authUserId, 'VIM is bad', 'A quiz on why VIM is bad');
            let result = adminQuizNameUpdate(user.authUserId, quiz1.quizId, 'VIM is bad');
            expect(result).toStrictEqual({ error: expect.any(String) });
        });
    });
    describe('cases for no errors', () => {
        test('change name for a quiz when a single user owns a single quiz', () => {
            let user = adminAuthRegister('jake.renzella@gmail.com', 'password1', 'Jake', 'Renzella');
            let quiz = adminQuizCreate(user.authUserId, 'VIM', 'A basic quiz on VIM commands');
            let result = adminQuizNameUpdate(user.authUserId, quiz.quizId, 'VIM is bad');
            let newDetails = adminQuizInfo(user.authUserId, quiz.quizId);
            expect(newDetails.name).toStrictEqual('VIM is bad'); // Check if we actually changed name
            expect(result).toStrictEqual({}); // Make sure correct return type is returned
        });
        test('change name for a quiz when a user owns multiple quizzes', () => {
            let user = adminAuthRegister('jake.renzella@gmail.com', 'password1', 'Jake', 'Renzella');
            let quiz1 = adminQuizCreate(user.authUserId, 'VIM', 'A basic quiz on VIM commands');
            let quiz2 = adminQuizCreate(user.authUserId, 'VSCode', 'A basic quiz on VSCode');
            let quiz3 = adminQuizCreate(user.authUserId, 'Emacs', 'A basic quiz on Emacs');
            let result = adminQuizNameUpdate(user.authUserId, quiz1.quizId, 'VIM is bad');
            let newDetails = adminQuizInfo(user.authUserId, quiz1.quizId);
            expect(newDetails.name).toStrictEqual('VIM is bad'); // Check if we actually changed name
            expect(result).toStrictEqual({}); // Make sure correct return type is returned
        });
        test('change name for a quiz when multiple users and multiple quizzes exist', () => {
            let user1 = adminAuthRegister('jake.renzella@gmail.com', 'password1', 'Jake', 'Renzella');
            let quiz1 = adminQuizCreate(user1.authUserId, 'VIM', 'A basic quiz on VIM commands');
            let user2 = adminAuthRegister('hayden.smith@gmail.com', 'password1', 'Hayden', 'Smith');
            let quiz2 = adminQuizCreate(user1.authUserId, 'VSCode', 'A basic quiz on VSCode');
            let result = adminQuizNameUpdate(user1.authUserId, quiz1.quizId, 'VIM is bad');
            let newDetails = adminQuizInfo(user1.authUserId, quiz1.quizId);
            expect(newDetails.name).toStrictEqual('VIM is bad'); // Check if we actually changed name
            expect(result).toStrictEqual({}); // Make sure correct return type is returned
        });
    })
}) 