/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// Test: adminUserDetails
import { clear } from './other';

import {
  adminAuthRegister,
  adminUserDetails,
} from './auth';

// Constant for error object
const ERROR = { error: expect.any(String) };

beforeEach(() => {
  // Reset the database for each test
  clear();
});

// Test for correct return value
describe('Test for correct return value', () => {
  // Test for correct return value and type
  test('Should return userDetail with 5 correct properties', () => {
    // Variable for test
    const admin = adminAuthRegister('a@gmail.com', 'password1', 'Hayden', 'Smith');

    expect(adminUserDetails(admin.authUserId)).toStrictEqual({
      user:
            {
              userId: admin.authUserId,
              name: 'Hayden Smith',
              email: 'a@gmail.com',
              numSuccessfulLogins: expect.any(Number),
              numFailedPasswordsSinceLastLogin: expect.any(Number),
            }
    });

    // Check if numSuccessfulLogins is at least 1
    expect(adminUserDetails(admin.authUserId).user.numSuccessfulLogins).toBeGreaterThanOrEqual(1);
  });

  // Test for multiple correct return values
  test.each([
    { email: 'a@gmail.com', password: 'password1', firstName: 'Hayden', lastName: 'Smith' },
    { email: 'b@gmail.com', password: 'passss123', firstName: 'John', lastName: 'Doe' },
    { email: 'c@gmail.com', password: 'mypassword1', firstName: 'Jane', lastName: 'Doe' },
  ])('Should return userDetail with correct properties for each user', 
    ({ email, password, firstName, lastName }) => {
    // Register the admin user
    const admin = adminAuthRegister(email, password, firstName, lastName);
    // Get the full name of the user
    const fullName = `${firstName} ${lastName}`;
    // Check if user details are returned correctly
    expect(adminUserDetails(admin.authUserId)).toStrictEqual({
      user:
            {
              userId: admin.authUserId,
              name: fullName,
              email: email,
              numSuccessfulLogins: expect.any(Number),
              numFailedPasswordsSinceLastLogin: expect.any(Number),
            }
    });

    // Check if numSuccessfulLogins is at least 1
    expect(adminUserDetails(admin.authUserId).user.numSuccessfulLogins).toBeGreaterThanOrEqual(1);
  });
});

// Test for error handling
describe('Test for error handling', () => {
  // Test for multiple invalid authUserIds
  test.each([
    { email: 'a@gmail.com', password: 'password1', firstName: 'Hayden', lastName: 'Smith' },
    { email: 'b@gmail.com', password: 'pass123', firstName: 'John', lastName: 'Doe' },
    { email: 'c@gmail.com', password: 'mypassword1', firstName: 'Jane', lastName: 'Doe' },
  ])('Should return error with invalid authUserId', ({ email, password, firstName, lastName }) => {
    // Register the admin user
    const admin = adminAuthRegister(email, password, firstName, lastName);

    // Check if error is returned for invalid authUserId by adding random number to the authUserId
    expect(adminUserDetails(admin.authUserId + 1531)).toStrictEqual(ERROR);
  });
});
