import { adminQuizList, adminQuizCreate  } from './quiz.js';
import { adminAuthRegister } from './auth.js';
import { clear } from './other.js';


let validAuthUserId;
// Store the original password
const oldPassword = 'password123';


// Clear any existing data before each test
beforeEach(() => {
  clear();


  // Register a user and store the valid id
  const user = adminAuthRegister('user@gmail.com', oldPassword, 'nameFirst', 'nameLast');
  validAuthUserId = user.authUserId;
});


// // Invalid id derived from the valid user id
const invalidAuthUserId = validAuthUserId + 1;

describe('adminQuizList', () => {
  // User with id validAuthUserId exists in the system and owns/makes quizzes.
  test('should return quizzes for a valid user with quizzes', () => {
    // Create quizzes for the user
    adminQuizCreate(validAuthUserId, 'Math Quiz', 'Description for Math Quiz');
    adminQuizCreate(validAuthUserId, 'English Quiz', 'Description for English Quiz');


    const result = adminQuizList(validAuthUserId);
    expect(result).toStrictEqual({
      quizzes: [
        { quizId: 1, name: 'Math Quiz' },
        { quizId: 2, name: 'English Quiz' },
      ]
    });
  });


  // User with validAuthUserId  exists but doesn't own/make any quizzes.
  test('should return an empty quizzes array for a valid user with no quizzes', () => {
    const anotherUser = adminAuthRegister('noquizzes@gmail.com', oldPassword, 'May', 'Lee');
    const anotherUserId = anotherUser.authUserId;


    const result = adminQuizList(anotherUserId);
    expect(result).toStrictEqual({ quizzes: [] });
  });


  // User with invalidAuthUserId does not exist in the system.
  test('should return an error for an invalid user ID', () => {
    const result = adminQuizList(invalidAuthUserId);
    expect(result).toStrictEqual({ error: expect.any(String) });
  });


  // No user Id (null).
  test('should return an error for missing user ID', () => {
    const result = adminQuizList(null);
 		expect(result).toStrictEqual({ error: expect.any(String) });
  });


  // The function is called with a non-number as the user ID.
  test('should return an error for a non-number user ID', () => {
    const result = adminQuizList('');
    expect(result).toStrictEqual({ error: expect.any(String) });
  });
});
