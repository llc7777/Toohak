import { adminQuizCreate } from './Quiz.js';
import { adminAuthRegister } from './auth.js';
import { clear } from './other.js'

// Test case for adminQuizCreate function
describe('testing for adminQuizCreate', () => {
    test('successful creation of quiz returns valid quiz id', async () => {
      clear();
      const authregister = adminAuthRegister("aero@mail.com", "Aeropass1", "Jason", "Chandra");
      const name = 'name';
      const description = 'description';
      await expect(adminQuizCreate(authregister.authUserId, name, description)).toStrictEqual(expect.objectContaining({
         quizId: expect.any(Number)
      }));
    });

    test('nonexistent user id returns error', async () => {
      clear();
      const authUserId = -1;
      const name = 'name';
      const description = 'description';
      await expect(adminQuizCreate(authUserId, name, description)).toStrictEqual({ error: expect.any(String) });
    });

    test('invalid name returns error', async () => {
      clear();
      const authregister = adminAuthRegister("aero@mail.com", "Aeropass1", "Jason", "Chandra");
      const name = '1';
      const description = 'description';
      await expect(adminQuizCreate(authregister.authUserId, name, description)).toStrictEqual({ error: expect.any(String) });
    });

    test.each([
      // Name shorter than 3 characters
      ['1', 'El', 'description'],
      // Name longer than 30 characters
      ['1', 'Name Thats Really Long and Over Thirty Characters', 'description'],
    ])('invalid name length returns error', async (authUserId, name, description) => {
      await expect(adminQuizCreate(authUserId, name, description)).toStrictEqual({ error: expect.any(String) });
    });


    test('empty description does NOT return error', async () => {
      clear();
      const authregister = adminAuthRegister("aero@mail.com", "Aeropass1", "Jason", "Chandra");
      const name = 'name';
      const description = '';
      await expect(adminQuizCreate(authregister.authUserId, name, description)).toStrictEqual(expect.objectContaining({
         quizId: expect.any(Number)
       }));
    });


    test('description longer than 100 characters returns error', async () => {
      clear();
      const authregister = adminAuthRegister("aero@mail.com", "Aeropass1", "Jason", "Chandra");
      const name = 'name';
      const description = 'This description is longer than 100 characters and should return error yap yap yap yap yap yap yap yap yap yap';
      await expect(adminQuizCreate(authregister.authUserId, name, description)).toStrictEqual({ error: expect.any(String) });
    });

    test.each([
      // missing authUserId
      ['', 'name', 'description'],
      // missing name
      ['authUserId', '', 'description'],
      // missing authUserId and name
      ['', '', 'description']
    ])('missing parameters returns error', async (authUserId, name, description) => {
      await expect(adminQuizCreate(authUserId, name, description)).toStrictEqual({ error: expect.any(String) });
    });
});


