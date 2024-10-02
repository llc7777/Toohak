/*
Test file for clear
*/
import { clear, users, quizzes, currentQuiz } from './other.js';

describe('clear function', () => {
    beforeEach(() => {
        users.push(
            { authUserId: 1, email: 'aero1@mail.com', nameFirst: 'Jason', nameLast: 'Chandra' },
            { authUserId: 2, email: 'aero2@mail.com', nameFirst: 'Jake', nameLast: 'Renzella' }
        );
        quizzes.push({ quizId: 999, name: 'Quiz 1', description: 'Quiz Example' });
        currentQuiz.authUserId = 1;
    });

    test('reset users, quizzes, and current session', () => {
        const result = clear();
        expect(result).toEqual({});
        expect(users).toEqual([]);
        expect(quizzes).toEqual([]);
        expect(currentQuiz.authUserId).toBeNull(); 
    });

    test('handle already cleared state', () => {
        clear();
        const result = clear();
        expect(result).toEqual({});
        expect(users).toEqual([]);
        expect(quizzes).toEqual([]);
        expect(currentQuiz.authUserId).toBeNull(); 
    });
});
