/*
Register a user with an email, password, and names, then returns 
their authUserId value.
Parameters: email, password, nameFirst, nameLast
Return object: authUserId: 1
*/
import { getData } from './dataStore.js';
import { isValidName }  from './helper.js';
import  validator  from 'validator'
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
	const index = store.users.findIndex( (user) => user.email === email);

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
		authUserId: numOfUsers+ 1,
		timeCreated: Date.now(),
		numSuccessfulLogins: -1,
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
function adminAuthLogin(email, password) {
  return {
    authUserId: 1,
    authUserId: 1,
  };
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
