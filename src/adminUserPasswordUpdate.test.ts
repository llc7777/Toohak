// @ts-nocheck
// Importing the function from auth.js file
import { adminAuthRegister, adminUserPasswordUpdate } from './auth';
import { clear } from './other';

let validAuthUserId;
// Store the original password
const oldPassword = 'password123';

beforeEach(() => {
  clear();

  const user = adminAuthRegister('user@gmail.com', oldPassword, 'nameFirst', 'nameLast');
  // Store the valid Id
  validAuthUserId = user.authUserId;
});

// Invalid Id
const invalidAuthUserId = validAuthUserId + 1;

// Error Tests
describe('Error Handling', () => {
  test('Returns error if authUserId is invalid', () => {
    let result = adminUserPasswordUpdate(invalidAuthUserId, oldPassword, 'newPassword456');
    expect(result).toStrictEqual({ error: expect.any(String) });
  });

  test('Returns error if oldPassword is not the correct old password', () => {
    let result = adminUserPasswordUpdate(validAuthUserId, 'wrongOldPassword', 'newPassword456');
    expect(result).toStrictEqual({ error: expect.any(String) });
  });

  test('Returns error if oldPassword and newPassword match exactly', () => {
    let result = adminUserPasswordUpdate(validAuthUserId, oldPassword, oldPassword);
    expect(result).toStrictEqual({ error: expect.any(String) });
  });

  test('Returns error if newPassword has been used before by this user', () => {
    let result = adminUserPasswordUpdate(validAuthUserId, oldPassword, 'passwordUsedBefore');
    expect(result).toStrictEqual({ error: expect.any(String) });
  });

  test('Returns error if newPassword is less than 8 characters', () => {
    let result = adminUserPasswordUpdate(validAuthUserId, oldPassword, 'Pass');
    expect(result).toStrictEqual({ error: expect.any(String) });
  });

  test('Returns error if newPassword does not contain at least one number and one letter', () => {
    let result = adminUserPasswordUpdate(validAuthUserId, oldPassword, 'password');
    expect(result).toStrictEqual({ error: expect.any(String) });
  });
});

// Successful tests
describe('Successful Updates', () => {
  test('Successfully updates password for valid user', () => {
    let result = adminUserPasswordUpdate(validAuthUserId, oldPassword, 'newPassword12');
    expect(result).toStrictEqual({});
  });

  test('Successfully updates password multiple times', () => {
    let result1 = adminUserPasswordUpdate(validAuthUserId, oldPassword, 'NewPassword1');
    expect(result1).toStrictEqual({});

    let result2 = adminUserPasswordUpdate(validAuthUserId, 'NewPassword1', 'NewPassword2');
    expect(result2).toStrictEqual({});
  });
});
