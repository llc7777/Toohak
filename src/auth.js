import { getData } from './dataStore.js'
/*
Register a user with an email, password, and names, then returns 
their authUserId value.
Parameters: email, password, nameFirst, nameLast
Return object: authUserId: 1
*/
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
		authUserId: 1,
	}
}

/**
 * Given an admin user's authUserId, return details about the user.
    "name" is the first and last name concatenated with a single space between them.
 * @param {Integer} authUserId 
 * @returns {Object} user
 */
function adminUserDetails(authUserId) {
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
 * @param {Integer} authUserId 
 * @param {String} email 
 * @param {String} nameFirst 
 * @param {String} nameLast 
 * @returns {object} - Returns an empty object
 */
function adminUserDetailsUpdate(authUserId, email, nameFirst, nameLast) {

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
function adminUserPasswordUpdate(authUserId, oldPassword, newPassword) {

  return {

  };
}
