/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import {
  adminUserDetailsUpdate,
  adminAuthRegister,
  adminUserDetails,
} from './auth';
import {
  clear,
} from './other';

beforeEach(() => {
// Reset the state of our data so that each tests can run independently
  clear();
});

/* ----------------------------------------------|
*                                                                                                |
*   AdminUserDetailsUpdate tests done by MOHAMMAD  |
*                                                                                                |
*   -----------------------------------------------|
*/

describe('adminUserDetailsUpdate', () => {
  describe('cases for errors', () => {
    test('authId does not correspond to any user', () => {
      const user = adminAuthRegister('jake.renzella@gmail.com', 'password', 'Jake', 'Renzella'); // Create user
      const result = adminUserDetailsUpdate(user.authUserId + 1, 'jake.renzella@gmail.com', 'Jack', 'Renzella');
      expect(result).toStrictEqual({ error: expect.any(String) });
    });
    test.each([
      'string', // Non-numeric string
      null, // Null value
      undefined, // Undefined value
      {}, // Object
      [], // Array
      NaN, // Not-a-Number
    ])('authId is not a number', (input) => {
      const result = adminUserDetailsUpdate(input, 'jake.renzella@gmail.com', 'Jake', 'Renzella'); // Create user
      expect(result).toStrictEqual({ error: expect.any(String) });
    });
    test('given email already belongs to another user', () => {
      const user1 = adminAuthRegister('jake.renzella@gmail.com', 'password', 'Jake', 'Renzella'); // Create first user
      const user2 = adminAuthRegister('j.renzella@gmail.com', 'password', 'Jake', 'Renzella'); // Create second user
      const result = adminUserDetailsUpdate(user1.authUserId, 'j.renzella@gmail.com', 'Jake', 'Renzella');
      expect(result).toStrictEqual({ error: expect.any(String) });
    });
    test.each([
      'invalidEmail', // No @ symbol
      'user@.com', // No domain
      '@example.com', // No local part
      'user@com', // Missing dot in domain
      'user@domain..com', // Consecutive dots
      'user@domain.c', // .com missing characters
      'user@-domain.com', // Invalid domain
    ])('invalid email: %s', (invalidEmail) => {
      const user = adminAuthRegister('jake.renzella@gmail.com', 'password', 'Jake', 'Renzella'); // Create a user
      const result = adminUserDetailsUpdate(user.authUserId, invalidEmail, 'Jake', 'Renzella'); // Try update to invalid email
      expect(result).toStrictEqual({ error: expect.any(String) });
    });
    test.each([
      'Jake123', // Digits
      'J@ke', // Special character @
      'Jak#', // Special character #
      'Jake!', // Special character !
      'J*ke', // Special character *
      'Jake_', // Underscore
      'Jake$', // Invalid character at the end
    ])('invalid namefirst: %s', (invalidNameFirst) => {
      const user = adminAuthRegister('jake.renzella@gmail.com', 'password', 'Jake', 'Renzella'); // Create a user
      const result = adminUserDetailsUpdate(user.authUserId, 'jake.renzella@gmail.com', invalidNameFirst, 'Renzella'); // Try update to invalid first name
      expect(result).toStrictEqual({ error: expect.any(String) });
    });
    test('namefirst is too long. Longer than 20 characters', () => {
      const namefirst = 'Jake Edward Normingale Alfred Edward Renzella';
      const user = adminAuthRegister('jake.renzella@gmail.com', 'password', 'Jake', 'Renzella'); // Create user
      const result = adminUserDetailsUpdate(user.authUserId, 'jake.renzella@gmail.com', namefirst, 'Renzella'); // Update to firstname that is too long
      expect(result).toStrictEqual({ error: expect.any(String) });
    });
    test('namefirst is too short. Shorter than 2 characters', () => {
      const user = adminAuthRegister('jake.renzella@gmail.com', 'password', 'Jake', 'Renzella'); // Create a user
      const result = adminUserDetailsUpdate(user.authUserId, 'jake.renzella@gmail.com', 'J', 'Renzella'); // Update to firstname that is too short
      expect(result).toStrictEqual({ error: expect.any(String) });
    });
    test.each([
      'Renzella123', // Digits
      'Renzell@', // Special character @
      'Renzell#', // Special character #
      'Renzella!', // Special character !
      'Renzell*', // Special character *
      'Renzella_', // Underscore
      'Renzella$', // Invalid character at the end
    ])('invalid namelast: %s', (invalidNameLast) => {
      const user = adminAuthRegister('jake.renzella@gmail.com', 'password', 'Jake', 'Renzella'); // Create a user
      const result = adminUserDetailsUpdate(user.authUserId, 'jake.renzella@gmail.com', 'Jake', invalidNameLast); // Try update to invalid lastname
      expect(result).toStrictEqual({ error: expect.any(String) });
    });
    test('namelast is too long. Longer than 20 characters', () => {
      const namelast = 'ComputerScienceIsFunButSomtimesPainful';
      const user = adminAuthRegister('jake.renzella@gmail.com', 'password', 'Jake', 'Renzella');
      const result = adminUserDetailsUpdate(user.authUserId, 'jake.renzella@gmail.com', 'Jake', namelast); // Try update lastname to a lastname that is too long
      expect(result).toStrictEqual({ error: expect.any(String) });
    });
    test('namelast is too short. Shorter than 2 characters', () => {
      const user = adminAuthRegister('jake.renzella@gmail.com', 'password', 'Jake', 'Renzella'); // Create user
      const result = adminUserDetailsUpdate(user.authUserId, 'jake.renzella@gmail.com', 'Jake', 'R'); // Try update lastname to a lastname that is too short
      expect(result).toStrictEqual({ error: expect.any(String) });
    });
  });
  describe('cases for no error', () => {
    test('change first name from jake to Jake', () => {
      const user = adminAuthRegister('jake.renzella@gmail.com', 'password1', 'jake', 'Renzella'); // Create user

      const result = adminUserDetailsUpdate(user.authUserId, 'jake.renzella@gmail.com', 'Jake', 'Renzella'); // Update first name
      expect(result).toStrictEqual({ });

      const updated = adminUserDetails(user.authUserId);
      expect(updated.user.name).toStrictEqual('Jake Renzella'); // Make sure the changes actually occurred
    });

    test('change last name from renzella to Renzella', () => {
      const user = adminAuthRegister('jake.renzella@gmail.com', 'password1', 'Jake', 'renzella'); // Create user
      const result = adminUserDetailsUpdate(user.authUserId, 'jake.renzella@gmail.com', 'Jake', 'Renzella'); // Update last name
      expect(result).toStrictEqual({ });

      const updated = adminUserDetails(user.authUserId);
      expect(updated.user.name).toStrictEqual('Jake Renzella'); // Make sure the changes actually occurred
    });
    test('change email from jake.renzella@gmail.com to jake@gmail.com', () => {
      const user = adminAuthRegister('jake.renzella@gmail.com', 'password1', 'Jake', 'renzella'); // Create user
      const result = adminUserDetailsUpdate(user.authUserId, 'jake@gmail.com', 'Jake', 'Renzella'); // Update email
      expect(result).toStrictEqual({ });

      const updated = adminUserDetails(user.authUserId);
      expect(updated.user.email).toStrictEqual('jake@gmail.com'); // Make sure the changes actually occurred
    });
    test('change last name from Al-Abody to Al Abody', () => {
      const user = adminAuthRegister('mohammad.alabody@gmail.com', 'password1', 'Mohammad', 'Al-Abody'); // Create user
      const result = adminUserDetailsUpdate(user.authUserId, 'mohammad.alabody@gmail.com', 'Mohammad', 'Al Abody'); // change last name to remove '-'
      expect(result).toStrictEqual({ });

      const updated = adminUserDetails(user.authUserId);
      expect(updated.user.name).toStrictEqual('Mohammad Al Abody'); // Make sure the changes actually occurred
    });
    test('make no changes (changes are identical to current state)', () => {
      const user = adminAuthRegister('jake.renzella@gmail.com', 'password1', 'Jake', 'Renzella'); // Create user
      const result = adminUserDetailsUpdate(user.authUserId, 'jake.renzella@gmail.com', 'Jake', 'Renzella'); // Try update with identical details
      expect(result).toStrictEqual({ });
    });
    test('change first name to have exactly 20 characters', () => {
      const user = adminAuthRegister('jake.renzella@gmail.com', 'password1', 'Jake', 'Renzella'); // Create user
      const namefirst = 'AlexandriannaBethany';

      const result = adminUserDetailsUpdate(user.authUserId, 'jake.renzella@gmail.com', namefirst, 'Renzella'); // Try update with identical details
      expect(result).toStrictEqual({ });

      const updated = adminUserDetails(user.authUserId);
      expect(updated.user.name).toStrictEqual('AlexandriannaBethany Renzella'); // Make sure the changes actually occurred
    });
  });
});
