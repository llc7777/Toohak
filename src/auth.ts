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
  isValidEmail,
  isValidName,
  isValidPassword
} from './helper';
import validator from 'validator';

export function generateToken(): string {
  return [...Array(32)]
    .map(() => Math.random().toString(36)[2])
    .join('');
}

export function decodeToken(token: string): any {
  const decoded = decodeURIComponent(token);
  return JSON.parse(decoded);
}

export function adminAuthRegister(email: string, password: string,
  nameFirst: string, nameLast: string) {
  const store = getData();

  const emailError = isValidEmail(email);
  if (emailError) {
    return { error: emailError };
  }

  const firstNameError = isValidName(nameFirst, 'First');
  if (firstNameError) {
    return { error: firstNameError };
  }

  const lastNameError = isValidName(nameLast, 'Last');
  if (lastNameError) {
    return { error: lastNameError };
  }

  const passwordError = isValidPassword(password);
  if (passwordError) {
    return { error: passwordError };
  }

  const existingUser = store.users.find((user: any) => user.email === email);
  if (existingUser) {
    return { error: 'This email is already registered to another user. Please use another email.' };
  }

  const token = generateToken();
  const newUser = {
    email: email,
    password: password,
    oldPasswords: [password],
    nameFirst: nameFirst,
    nameLast: nameLast,
    name: `${nameFirst} ${nameLast}`,
    authUserId: store.users.length + 1,
    timeCreated: Math.floor(Date.now() / 1000),
    tokens: [token],
    numSuccessfulLogins: 1,
    numFailedPasswordsSinceLastLogin: 0,
  };

  store.users.push(newUser);

  return {
    token: token
  };
}

export function findUserFromToken(token: string) {
  const store = getData();
  const tokenData = decodeToken(token);
  const authUserId = tokenData.authUserId;

  return store.users.find((user: any) => user.authUserId === authUserId);
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

  // Generate a new token for the session
  const token = generateToken();
  data.users[index].tokens.push(token);

  return {
    token: token
  };
}

/**
 * Given an admin user's authUserId, return details about the user.
  "name" is the first and last name concatenated with a single space between them.
* @param {Integer} authUserId
* @returns {Object} user
*/
export function adminUserDetails(authUserId) {
  const data = getData();
  const user = data.users.find(user => user.authUserId === authUserId);

  if (!user) {
    return { error: 'AuthUserId is not a valid user.' };
  }

  return {
    user:
    {
      userId: user.authUserId,
      name: `${user.nameFirst} ${user.nameLast}`,
      email: user.email,
      numSuccessfulLogins: user.numSuccessfulLogins,
      numFailedPasswordsSinceLastLogin: user.numFailedPasswordsSinceLastLogin,
    }
  };
}

/**
 * Given an admin user's authUserId and a set of properties,
 * update the properties of this logged in admin user.
 * @param {number} authUserId
 * @param {string} email
 * @param {string} nameFirst
 * @param {string} nameLast
 * @returns {object} - Returns an empty object
 */
export function adminUserDetailsUpdate(authUserId, email, nameFirst, nameLast) {
  const data = getData();

  // Check if the authUserId is valid using isValidUser helper function
  const user = data.users.find(user => user.authUserId === authUserId);
  if (!user) {
    return { error: 'AuthUserId is not a valid user.' };
  }

  // Check if the email is valid
  if (!validator.isEmail(email)) {
    return { error: 'Email is not valid. Please try another email.' };
  }

  //  Check if the email is already in use by another user
  const emailInUse = data.users.find(
    user => user.email === email && user.authUserId !== authUserId);
  if (emailInUse) {
    return { error: 'Email is currently used by another user. Please use another email.' };
  }

  // Validating first name and last name
  if (!isValidName(nameFirst)) {
    return { error: 'First name contains invalid characters or is not within length limits.' };
  }

  if (!isValidName(nameLast)) {
    return { error: 'Last name contains invalid characters or is not within length limits.' };
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
 * @param {integer} authUserId
 * @param {string} oldPassword
 * @param {string} newPassword
 * @returns {object} - Returns an empty object
 */
export function adminUserPasswordUpdate(authUserId, oldPassword, newPassword) {
  let checkOldPassword = false;
  let alreadyUsedThisPassword = false;
  const data = getData();

  // Search through the data to check if the user exists
  const userIndex = data.users.findIndex(user => user.authUserId === authUserId);
  if (userIndex === -1) {
    return {
      error: 'User Id does not exist',
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
  for (let i = 0; i < data.users.length; i++) {
    if (data.users[i].authUserId === authUserId) {
      data.users[i].password = newPassword;
      data.users[i].oldPasswords.push(newPassword);
      return {};
    }
  }
}
