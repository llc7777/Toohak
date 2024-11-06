/* eslint-disable @typescript-eslint/ban-ts-comment */
/*
Register a user with an email, password, and names, then returns
their authUserId value.
Parameters: email, password, nameFirst, nameLast
Return object: authUserId: 1
*/
// @ts-nocheck
import { getData } from './dataStore';
import {
  generateRandomSessionId,
  isValidEmail,
  isValidName,
  isValidPassword,
  createToken,
  decodeToken,
  findUserFromToken,
  encodedTokenExists,
  findUserIndexFromToken,
} from './helper';
import validator from 'validator';
import { ErrorResponse, Token, User } from './interfaces';
import { UserInfo } from 'os';

export function adminAuthRegister(email: string, password: string,
  nameFirst: string, nameLast: string, token?: string) {
  const store = getData();

  let decodedTokenData = null;

  // If a token exist, decode and check user
  if (token) {
    decodedTokenData = decodeToken(token);
    const userExist = findUserFromToken(decodedTokenData.sessionId);

    if (userExist) {
      return { error: 'You are already logged in as a different user. Please log out first.' };
    }
  }

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
export function adminAuthLogin(email: string, password: string) {
  const data = getData();

  const index = data.users.findIndex((user) => user.email === email);
  if (index === -1) {
    return {
      error: 'No user with this email exists'
    };
  }
  if (data.users[index].password !== password) {
    data.users[index].numFailedPasswordsSinceLastLogin += 1;
    return {
      error: 'Password is incorrect'
    };
  }
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
 * @returns {Object} - Returns an empty object to indicate that the user has been logged out.
 */
export function adminAuthLogout(token) {
  const data = getData();

  if (token === '') {
    return { error: 'Token is empty' };
  }

  const tokenData = decodeToken(token);

  const userIndex = findUserIndexFromToken(tokenData);

  if (userIndex === -1) {
    return { error: 'Token is invalid' };
  }

  data.users[userIndex].tokens = data.users[userIndex].tokens.filter(
    userToken => userToken.sessionId !== tokenData.sessionId &&
      userToken.authUserId === tokenData.authUserId);

  return {};
}

/**
 * Given an admin user's authUserId, return details about the user.
  "name" is the first and last name concatenated with a single space between them.
* @param {string} token
* @returns {Object} user
*/
export function adminUserDetails(token: string): UserInfo {
  if (!encodedTokenExists(token)) {
    return { error: 'Invalid token' };
  }
  const tokenDecoded: Token = decodeToken(token);

  const user: User = findUserFromToken(tokenDecoded);

  if (!user) {
    return { error: 'AuthUserId is not a valid user.' };
  }

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
  token: Token,
  email: string,
  nameFirst: string,
  nameLast:string
): object | ErrorResponse {
  const data = getData();

  // Check if the token is empty
  if (token === '') {
    return { error: 'Token is empty' };
  }

  // Find the user from the token
  const tokenData = decodeToken(token);

  const user = findUserFromToken(tokenData);
  if (!user) {
    return {
      error: 'Token is invalid',
    };
  }

  // Check if the email is valid
  if (!validator.isEmail(email)) {
    return { error: 'Email is not valid. Please try another email.' };
  }

  //  Check if the email is already in use by another user
  const emailInUse = data.users.find(
    otherUser => otherUser.email === email && otherUser.authUserId !== user.authUserId);
  if (emailInUse) {
    return { error: 'Email is currently used by another user. Please use another email.' };
  }

  // Validating first name and last name
  const firstNameError = isValidName(nameFirst, 'First');
  if (firstNameError) {
    return { error: firstNameError };
  }

  const lastNameError = isValidName(nameLast, 'Last');
  if (lastNameError) {
    return { error: lastNameError };
  }

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
export function adminUserPasswordUpdate(token, oldPassword, newPassword) {
  let checkOldPassword = false;
  let alreadyUsedThisPassword = false;
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
  alreadyUsedThisPassword = data.users[userIndex].oldPasswords.find(
    oldPassword => oldPassword === newPassword);

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
