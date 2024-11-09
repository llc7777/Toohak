/*
Register a user with an email, password, and names, then returns
their authUserId value.
Parameters: email, password, nameFirst, nameLast
Return object: authUserId: 1
*/

import { getData } from './dataStore';
import {
  generateRandomSessionId,
  isValidEmail,
  isValidName,
  isValidPassword,
  createToken,
  decodeToken,
  findUserFromToken,
  findUserIndexFromToken,
  adminUserDetailsErrorChecking,
  adminUserDetailsUpdateErrorChecking,
  adminAuthLoginErrorChecking
} from './helper';
import { ErrorResponse, Token, User, UserInfo, AuthResponse } from './interfaces';

export function adminAuthRegister(email: string, password: string,
  nameFirst: string, nameLast: string) {
  const store = getData();

  const wrongEmail = isValidEmail(email);
  if (wrongEmail) {
    return { error: wrongEmail };
  }

  const wrongFirstName = isValidName(nameFirst, 'First');
  if (wrongFirstName) {
    return { error: wrongFirstName };
  }

  const wrongLastName = isValidName(nameLast, 'Last');
  if (wrongLastName) {
    return { error: wrongLastName };
  }

  const wrongPassword = isValidPassword(password);
  if (wrongPassword) {
    return { error: wrongPassword };
  }
  const userExist = store.users.find((user) => user.email === email);
  if (userExist) {
    return { error: 'This email is already registered to another user. Please use another email.' };
  }

  // Generate new token object
  const newToken = {
    authUserId: store.users.length + 1, // Assign new user ID
    sessionId: generateRandomSessionId() // Generate random session ID
  };

  const encodedToken = createToken(newToken);

  const newUser = {
    authUserId: store.users.length + 1,
    email: email,
    password: password,
    oldPasswords: [password],
    nameFirst: nameFirst,
    nameLast: nameLast,
    name: `${nameFirst} ${nameLast}`,
    timeCreated: Math.floor(Date.now() / 1000),
    tokens: [newToken], // Store the token object before encoding
    numSuccessfulLogins: 1,
    numFailedPasswordsSinceLastLogin: 0,
  };
  store.users.push(newUser);

  // Return the encoded token as a string
  return {
    token: encodedToken
  };
}

/*
Given a registered user's email and password returns their authUserId value.
Parameters: email, password
Return object: authUserId: 1
*/
export function adminAuthLogin(
  email: string, password: string
): AuthResponse | ErrorResponse {
  adminAuthLoginErrorChecking(email, password);

  const data = getData();
  const index = data.users.findIndex((user) => user.email === email);

  data.users[index].numFailedPasswordsSinceLastLogin = 0;
  data.users[index].numSuccessfulLogins += 1;

  const sessionId = generateRandomSessionId();

  const token = {
    authUserId: data.users[index].authUserId,
    sessionId
  };

  data.users[index].tokens.push(token);

  return {
    token: createToken(token)
  };
}

/**
 * Logs out an admin user who has an active user session.
 *
 * @param {string} token
 * @returns {object} - Returns an empty object to indicate that the user has been logged out.
 */
export function adminAuthLogout(token: string): object {
  const data = getData();

  if (token === '') {
    throw new Error('401 - Token is empty');
  }

  const tokenData: Token = decodeToken(token);

  const userIndex: number = findUserIndexFromToken(tokenData);

  if (userIndex === -1) {
    throw new Error('401 - Token is invalid');
  }

  data.users[userIndex].tokens = data.users[userIndex].tokens.filter(
    (userToken: Token) => userToken.sessionId !== tokenData.sessionId &&
      userToken.authUserId === tokenData.authUserId);

  return {};
}

/**
 * Given an admin user's authUserId, return details about the user.
  "name" is the first and last name concatenated with a single space between them.
* @param {string} token
* @returns {Object} user
*/

export function adminUserDetails(token: string): UserInfo | ErrorResponse {
  adminUserDetailsErrorChecking(token);

  const tokenDecoded: Token = decodeToken(token);
  const user: User = findUserFromToken(tokenDecoded);

  return {
    user:
    {
      userId: tokenDecoded.authUserId,
      name: `${user.nameFirst} ${user.nameLast}`,
      email: user.email,
      numSuccessfulLogins: user.numSuccessfulLogins,
      numFailedPasswordsSinceLastLogin: user.numFailedPasswordsSinceLastLogin,
    }
  };
}

/**
 * Given an admin user's token and a set of properties,
 * update the properties of this logged-in admin user.
 * @param {object} token
 * @param {string} email
 * @param {string} nameFirst
 * @param {string} nameLast
 * @returns {object} - Returns an empty object
 */
export function adminUserDetailsUpdate(
  token: string,
  email: string,
  nameFirst: string,
  nameLast: string
): object | ErrorResponse {
  // Check for errors
  adminUserDetailsUpdateErrorChecking(token, email, nameFirst, nameLast);

  const tokenData = decodeToken(token);
  const user = findUserFromToken(tokenData);

  // Update user properties
  user.email = email;
  user.nameFirst = nameFirst;
  user.nameLast = nameLast;
  user.name = `${nameFirst} ${nameLast}`;

  return {};
}

/**
 * Given details relating to a password change, update the password of a logged in user.
 * @param {string} token
 * @param {string} oldPassword
 * @param {string} newPassword
 * @returns {object} - Returns an empty object
 */
export function adminUserPasswordUpdate(
  token: string,
  oldPassword: string,
  newPassword: string
) {
  let checkOldPassword = false;
  const data = getData();

  // Check if the token is empty
  if (token === '') {
    return {
      error: 'Token is empty',
    };
  }

  // Find the user from the token
  const tokenData = decodeToken(token);

  // Search through the data to check if the user exists
  const userIndex = findUserIndexFromToken(tokenData);

  if (userIndex === -1) {
    return {
      error: 'Token is invalid',
    };
  }
  // Search through the data to check if the old password is correct
  if (data.users[userIndex].password === oldPassword) {
    checkOldPassword = true;
  }
  // Search through the users old passwords to see if the new password has already been used
  const alreadyUsedThisPassword = data.users[userIndex].oldPasswords.find(
    (oldPassword: string) => oldPassword === newPassword);

  // Check password is right
  if (!checkOldPassword) {
    return {
      error: 'Old password is incorrect',
    };
    // Check new password is different to old password
  } else if (oldPassword === newPassword) {
    return {
      error: 'New password must be different from the old password',
    };
    // Check new password is already used
  } else if (alreadyUsedThisPassword) {
    return {
      error: 'New password has already been used',
    };
    // Check new password is less than 8 characters
  } else if (newPassword.length < 8) {
    return {
      error: 'New password must be at least 8 characters long',
    };
    // Check new password does not contain at least one letter and one number
  } else if (!newPassword.match(/[a-zA-Z]/) || !newPassword.match(/[0-9]/)) {
    return {
      error: 'New password must contain at least one letter and one number',
    };
  }

  // Update password and return empty object for indication of no error
  data.users[userIndex].oldPasswords.push(newPassword);
  data.users[userIndex].password = newPassword;
  return {};
}
