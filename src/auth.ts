/*
Register a user with an email, password, and names, then returns 
their authUserId value.
Parameters: email, password, nameFirst, nameLast
Return object: authUserId: 1
*/
// @ts-nocheck
import { getData } from './dataStore';
import { isValidName } from './helper';
import validator from 'validator'

export function adminAuthRegister(email, password, nameFirst, nameLast) {
  if (!validator.isEmail(email)) {
    return { error: "Invalid email format." };
  }

  if (!isValidName(nameFirst)) {
    return { error: "First name contains invalid characters or is not within length limits." };
  }

  if (!isValidName(nameLast)) {
    return { error: "Last name contains invalid characters or is not within length limits." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters long." };
  }

  const hasLetter = [...password].some(char => /[a-zA-Z]/.test(char));
  const hasNumber = [...password].some(char => /[0-9]/.test(char));

  if (!hasLetter || !hasNumber) {
    return { error: "Password must contain at least one letter and one number." };
  }

  let store = getData();
  const index = store.users.findIndex((user) => user.email === email);

  if (index !== -1) {
    return {
      error: 'This email is already registered to another user. Please use another email'
    }
  }

  let numOfUsers = store.users.length;

  let newUser = {
    email: email,
    password: password,
    nameFirst: nameFirst,
    nameLast: nameLast,
    name: nameFirst + ' ' + nameLast,
    authUserId: numOfUsers + 1,
    timeCreated: Math.floor(Date.now() / 1000),
    numSuccessfulLogins: 1,
    numFailedPasswordsSinceLastLogin: 0
  }

  store.users.push(newUser);

  return {
    authUserId: numOfUsers + 1
  }
}

/*
Given a registered user's email and password returns their authUserId value.
Parameters: email, password
Return object: authUserId: 1
*/
export function adminAuthLogin(email, password) {
  let data = getData();

  const index = data.users.findIndex((user) => user.email === email);
  if (index === -1) {
    return {
      error: 'No user with this email exists'
    }
  }
  if (data.users[index].password !== password) {
    return {
			data.users[index].numFailedPasswordsSinceLastLogin += 1;
      error: 'Password is incorrect'
    }
  }
	data.users[index].numFailedPasswordsSinceLastLogin = 0;
	data.users[index].numSuccessfulLogins += 1;
  return {
    authUserId: data.users[index].authUserId
  }
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
 * Given an admin user's authUserId and a set of properties, update the properties of this logged in admin user.
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
  const emailInUse = data.users.find(user => user.email === email && user.authUserId !== authUserId);
  if (emailInUse) {
    return { error: 'Email is currently used by another user. Please use another email.' };
  }

  // Validating first name and last name
  if (!isValidName(nameFirst)) {
    return { error: "First name contains invalid characters or is not within length limits." };
  }

  if (!isValidName(nameLast)) {
    return { error: "Last name contains invalid characters or is not within length limits." };
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
  let isUserExist = false;
  let checkOldPassword = false;
  let newPasswordExist = false;

  const data = getData();

  // Search through the data to check if the user exists
  for (let i = 0; i < data.users.length; i++) {
    if (data.users[i].authUserId === authUserId) {
      isUserExist = true;
    }
  }
  // Search through the data to check if the old password is correct
  for (let i = 0; i < data.users.length; i++) {
    if (data.users[i].password === oldPassword) {
      checkOldPassword = true;
    }
  }
  // Search through the data to check if the new password is already used
  for (let i = 0; i < data.users.length; i++) {
    if (data.users[i].password === newPassword) {
      newPasswordExist = true;
    }
  }

  // Check user exists
  if (!isUserExist) {
    return {
      error: 'User Id does not exist',
    };
  }
  // Check password is right 
  else if (!checkOldPassword) {
    return {
      error: 'Old password is incorrect',
    };
  }
  // Check new password is different to old password
  else if (oldPassword === newPassword) {
    return {
      error: 'New password must be different from the old password',
    };
  }
  // Check new password is already used
  else if (newPasswordExist) {
    return {
      error: 'New password is already used',
    };
  }
  // Check new password is less than 8 characters
  else if (newPassword.length < 8) {
    return {
      error: 'New password must be at least 8 characters long',
    };
  }
  // Check new password does not contain at least one letter and one number
  else if (!newPassword.match(/[a-zA-Z]/) || !newPassword.match(/[0-9]/)) {
    return {
      error: 'New password must contain at least one letter and one number',
    };
  }

  // Update password and return empty object for indication of no error
  for (let i = 0; i < data.users.length; i++) {
    if (data.users[i].authUserId === authUserId) {
      data.users[i].password = newPassword;
      return {};
    }
  }
}
