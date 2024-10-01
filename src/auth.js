/*
Register a user with an email, password, and names, then returns 
their authUserId value.
Parameters: email, password, nameFirst, nameLast
Return object:
{
	authUserId: 
}
*/

import { getData } from './dataStore.js'
import validator from 'validator'

function adminAuthRegister(email, password, nameFirst, nameLast) {

	// Validate email
	if (!validator.isEmail(email)) {
		return {
			error: 'Email is not valid. Please try another email',
		}
	}

	// Validate first name
	if (nameFirst.length > 20) {
		return {
			error: 'First name is too long. Maximum number of characters is 20.'
		}
	}
	if (nameFirst.length < 2) {
		return {
			error: 'First name is too short. Minimum number of characters is 2.'
		}
	}

	// Validate last name
	if (nameLast.length > 20) {
		return {
			error: 'Last name is too long. Maximum number of characters is 20.'
		}
	}
	if (nameLast.length < 2) {
		return {
			error: 'Last name is too short. Minimum number of characters is 2.'
		}
	}

	const regex = /^[a-zA-Z\s'-]+$/; // a-z, A-Z, spaces, hyphens, dashes, apostrophes (regex expression)

	// Check for invalid characters in first name
	const isValidFirstName = regex.test(nameFirst);
	if (!isValidFirstName) {
		return {
			error: 'First name has invalid characters. Can only contain lowercase letters, uppercase letters, spaces, hyphens or apostrophes'
		}
	}
	// Check for invalid characters in last name
	const isValidLastName = regex.test(nameLast);
	if (!isValidLastName) {
		return {
			error: 'Last name has invalid characters. Can only contain lowercase letters, uppercase letters, spaces, hyphens or apostrophes'
		}
	}

	// Check if password is less than 8 characters
	if (password.length < 8) {
		return {
			error: 'Password is too short. Cannot be less than 8 characters'
		}
	}

	// Check if password has letters and numbers
	const hasLetter = /[a-zA-Z]/; // Checks for at least one letter
  const hasNumber = /[0-9]/;     // Checks for at least one number

  // Validate password
  if (!hasLetter.test(password) || !hasNumber.test(password)) {
 		return {
    	error: 'Password must contain at least one letter and one number.'
    };
  }


	let store = getData();	

	// store.names.pop();  *gets last name in names array*
	// store.names.push;	 *adds name to names array

	// Check if another user has the same email
	const index = store.users.findIndex( (user) => user.email === email);

	if (index !== -1) {
		return {
			error: 'This email is already registered to another user. Please use another email'
		}
	}

	numOfUsers = store.users.length;

	newUser = {
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
