import {
	adminUserDetailsUpdate
} from './auth.js'

beforeEach(() => {
  // Reset the state of our data so that each tests can run independently
  clear();
});

// AdminUserDetailsUpdate function tests (MOHAMMAD)
describe('adminUserDetailsUpdate', () => {
	describe('Error cases', () => {
		test('AuthUserId is not a number', () => {
			let result = adminUserDetailsUpdate('string', 'user@gmail.com', 'namefirst', 'namelast');
			expect(result).toStrictEqual({ error: expect.any(String)});
		}) 
		test('AuthUserId does not correspond to any user', () => {
			let user = adminAuthRegister('user@gmail.com', 'password', 'namefirst', 'namelast');
			let result = adminUserDetailsUpdate(user.authUserId + 1, 'user@gmail.com', 'namefirst', 'namelast');
			expect(result).toStrictEqual({ error: expect.any(String)});
		})
		test('Email already belongs to another user', () => {
			let user = adminAuthRegister('user@gmail.com', 'password', 'namefirst', 'namelast');
	})
});

