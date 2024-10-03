import { getData } from './dataStore.js';
/*
Register a user with an email, password, and names, then returns 
their authUserId value.
Parameters: email, password, nameFirst, nameLast
Return object: authUserId: 1
*/

let data = getData();

function adminAuthRegister(email, password, nameFirst, nameLast) {
  return {
    authUserId: 1,
  };
}

/*
Given a registered user's email and password returns their authUserId value.
Parameters: email, password
Return object: authUserId: 1
*/
function adminAuthLogin(email, password) {
  return {
    authUserId: 1,
  };
}

/**
 * Given an admin user's authUserId, return details about the user.
    "name" is the first and last name concatenated with a single space between them.
 * @param {number} authUserId 
 * @returns {Object} user
 */
export function adminUserDetails(authUserId) {
  return {
    user:
    {
      userId: 1,
      name: 'Hayden Smith',
      email: 'hayden.smith@unsw.edu.au',
      numSuccessfulLogins: 3,
      numFailedPasswordsSinceLastLogin: 1,
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

  return {

  };
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