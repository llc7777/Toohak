import {
	adminUserDetailsUpdate,
	adminAuthRegister,
} from './auth.js'
import {
	clear,
} from './other.js'

beforeEach(() => {
  // Reset the state of our data so that each tests can run independently
  clear();
});

/* ----------------------------------------------|
*																								 |
*	AdminUserDetailsUpdate tests done by MOHAMMAD  |
*																								 |
*	-----------------------------------------------|
*/

describe('adminUserDetailsUpdate', () => {
	describe('cases for errors', () => {
		test('authId does not correspond to any user', () => {
			let user = adminAuthRegister('jake.renzella@gmail.com', 'password', 'Jake', 'Renzella');
			let result = adminUserDetailsUpdate(user.authUserId + 1, 'jake.renzella@gmail.com', 'Jack', 'Renzella');
			expect(result).toStrictEqual( {error: expect.any(String)} );
		})
    test.each([
      'string',     // Non-numeric string
      null,         // Null value
      undefined,    // Undefined value
      {},           // Object
      [],           // Array
      NaN,          // Not-a-Number
    ])('authId is not a number', (input) => {
      let result = adminUserDetailsUpdate(input, 'jake.renzella@gmail.com', 'Jake', 'Renzella');
      expect(result).toStrictEqual({ error: expect.any(String) });
    });
		test('given email already belongs to another user', () => {
			let user1 = adminAuthRegister('jake.renzella@gmail.com', 'password', 'Jake', 'Renzella');
			let user2 = adminAuthRegister('j.renzella@gmail.com', 'password', 'Jake', 'Renzella');
			let result = adminUserDetailsUpdate(user1.authUserId, 'j.renzella@gmail.com', 'Jake', 'Renzella');
			expect(result).toStrictEqual( {error: expect.any(String)} );
		})
		test.each([
      'invalidEmail',              // No @ symbol
      'user@.com',                 // No domain
      '@example.com',              // No local part
      'user@com',                  // Missing dot in domain
      'user@domain..com',          // Consecutive dots
      'user@domain.c',             // .com missing characters 
      'user@-domain.com',          // Invalid domain
    ])('invalid email: %s', (invalidEmail) => {
      let user = adminAuthRegister('jake.renzella@gmail.com', 'password', 'Jake', 'Renzella');
      let result = adminUserDetailsUpdate(user.authUserId, invalidEmail, 'Jake', 'Renzella');
      expect(result).toStrictEqual({ error: expect.any(String) });
    })    
		test.each([
      'Jake123',          		// Digits
      'J@ke',        					// Special character @
      'Jak#',        					// Special character #
      'Jake!',        				// Special character !
      'J*ke',        					// Special character *
      'Jake_',        				// Underscore
      'Jake$',       					// Invalid character at the end
    ])('invalid namefirst: %s', (invalidNameFirst) => {
      let user = adminAuthRegister('jake.renzella@gmail.com', 'password', 'Jake', 'Renzella');
      let result = adminUserDetailsUpdate(user.authUserId, 'jake.renzella@gmail.com', invalidNameFirst, 'Renzella');
      expect(result).toStrictEqual({ error: expect.any(String) });
    });
		test('namefirst is too long. Longer than 20 characters', () => {
			let namefirst = 'Jake Edward Normingale Alfred Edward Renzella';
			let user = adminAuthRegister('jake.renzella@gmail.com', 'password', 'Jake', 'Renzella');
			let result = adminUserDetailsUpdate(user.authUserId, 'jake.renzella@gmail.com', invalidNameFirst, 'Renzella');
      expect(result).toStrictEqual({ error: expect.any(String) });
		})
		test('namefirst is too short. Shorter than 2 characters', () => {
			let user = adminAuthRegister('jake.renzella@gmail.com', 'password', 'Jake', 'Renzella');
			let result = adminUserDetailsUpdate(user.authUserId, 'jale.renzella@gmail.com', 'J', 'Renzella');
      expect(result).toStrictEqual({ error: expect.any(String) });
		})
		test.each([
      'Renzella123',          // Digits
      'Renzell@',        			// Special character @
      'Renzell#',        			// Special character #
      'Renzella!',        		// Special character !
      'Renzell*',        			// Special character *
      'Renzella_',        		// Underscore
      'Renzella$',       			// Invalid character at the end
    ])('invalid namelast: %s', (invalidNameLast) => {
      let user = adminAuthRegister('jake.renzella@gmail.com', 'password', 'Jake', 'Renzella');
      let result = adminUserDetailsUpdate(user.authUserId, 'jake.renzella@gmail.com', 'Jake', invalidNameLast);
      expect(result).toStrictEqual({ error: expect.any(String) });
    });
		test('namelast is too long. Longer than 20 characters', () => {
			let namelast = 'ComputerScienceIsFunButSomtimesPainful';
			let user = adminAuthRegister('jake.renzella@gmail.com', 'password', 'Jake', 'Renzella');
			let result = adminUserDetailsUpdate(user.authUserId, 'jake.renzella@gmail.com', 'Jake', namelast);
      expect(result).toStrictEqual({ error: expect.any(String) });
		})
		test('namelast is too short. Shorter than 2 characters', () => {
			let user = adminAuthRegister('jake.renzella@gmail.com', 'password', 'Jake', 'Renzella');
			let result = adminUserDetailsUpdate(user.authUserId, 'jake.renzella@gmail.com', 'Jake', 'R');
      expect(result).toStrictEqual({ error: expect.any(String) });
		})
	})
	describe('cases for no error', () => {
		test('change first name from jake to Jake', () => {
			let user = adminAuthRegister('jake.renzella@gmail.com', 'password', 'jake', 'Renzella');
			let result = adminUserDetailsUpdate(user.authUserId, 'jake.renzella@gmail.com', 'Jake', 'Renzella');
      expect(result).toStrictEqual({ });
		})
		test('change last name from renzella to Renzella', () => {
			let user = adminAuthRegister('jake.renzella@gmail.com', 'password', 'Jake', 'renzella');
			let result = adminUserDetailsUpdate(user.authUserId, 'jake.renzella@gmail.com', 'Jake', 'Renzella');
      expect(result).toStrictEqual({ });
		})
		test('change email from jake.renzella@gmail.com to jake@gmail.com', () => {
			let user = adminAuthRegister('jake.renzella@gmail.com', 'password', 'Jake', 'renzella');
			let result = adminUserDetailsUpdate(user.authUserId, 'jake@gmail.com', 'Jake', 'Renzella');
      expect(result).toStrictEqual({ });
		})
		test('change last name from Al-Abody to Al Abody', () => {
			let user = adminAuthRegister('mohammad.alabody@gmail.com', 'password', 'Mohammad', 'Al-Abody');
			let result = adminUserDetailsUpdate(user.authUserId, 'mohammad.alabody@gmail.com', 'Mohammad', 'Al Abody');
      expect(result).toStrictEqual({ });
		})
		test('make no changes (changes are identical to current state)', () => {
			let user = adminAuthRegister('jake.renzella@gmail.com', 'password', 'Jake', 'Renzella');
			let result = adminUserDetailsUpdate(user.authUserId, 'jake.renzella@gmail.com', 'Jake', 'Renzella');
      expect(result).toStrictEqual({ });
		})
	})
})
