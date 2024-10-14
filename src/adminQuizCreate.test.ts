// @ts-nocheck
import { adminQuizCreate } from './quiz';
import { adminAuthRegister } from './auth';
import { clear } from './other'

// Test case for adminQuizCreate function
describe('testing for adminQuizCreate', () => {
    test('successful creation of quiz returns valid quiz id', () => {
      clear();
      const authregister = adminAuthRegister("aero@mail.com", "Aeropass1", "Jason", "Chandra");
      const name = 'name';
      const description = 'description';
      expect(adminQuizCreate(authregister.authUserId, name, description)).toStrictEqual(expect.objectContaining({
        quizId: expect.any(Number)
      }));
    });

    test('nonexistent user id returns error', () => {
      clear();
      const authUserId = -1;
      const name = 'name';
      const description = 'description';
      expect(adminQuizCreate(authUserId, name, description)).toStrictEqual({ error: expect.any(String) });
    });

    test('invalid name returns error', () => {
      clear();
      const authregister = adminAuthRegister("aero@mail.com", "Aeropass1", "Jason", "Chandra");
      const name = '1';
      const description = 'description';
      expect(adminQuizCreate(authregister.authUserId, name, description)).toStrictEqual({ error: expect.any(String) });
    });

    test.each([
      // Name shorter than 3 characters
      ['1', 'El', 'description'],
      // Name longer than 30 characters
      ['1', 'Name Thats Really Long and Over Thirty Characters', 'description'],
    ])('invalid name length returns error', (authUserId, name, description) => {
      expect(adminQuizCreate(authUserId, name, description)).toStrictEqual({ error: expect.any(String) });
    });

    test('empty description does NOT return error', () => {
      clear();
      const authregister = adminAuthRegister("aero@mail.com", "Aeropass1", "Jason", "Chandra");
      const name = 'name';
      const description = '';
      expect(adminQuizCreate(authregister.authUserId, name, description)).toStrictEqual(expect.objectContaining({
        quizId: expect.any(Number)
      }));
    });

    test('description longer than 100 characters returns error', () => {
      clear();
      const authregister = adminAuthRegister("aero@mail.com", "Aeropass1", "Jason", "Chandra");
      const name = 'name';
      const description = 'This description is longer than 100 characters and should return error yap yap yap yap yap yap yap yap yap yap';
      expect(adminQuizCreate(authregister.authUserId, name, description)).toStrictEqual({ error: expect.any(String) });
    });

    test.each([
      // missing authUserId
      ['', 'name', 'description'],
      // missing name
      ['authUserId', '', 'description'],
      // missing authUserId and name
      ['', '', 'description']
    ])('missing parameters returns error', (authUserId, name, description) => {
      return expect(adminQuizCreate(authUserId, name, description)).toStrictEqual({ error: expect.any(String) });
    });
});
