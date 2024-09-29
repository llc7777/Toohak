/*
Register a user with an email, password, and names, then returns 
their authUserId value.
Parameters: email, password, nameFirst, nameLast
Return object: authUserId: 1
*/

const users = []; 

function isValidEmail(email) {
  const emailAt = email.indexOf('@');
  const emailDot = email.lastIndexOf('.');
  
  return (
    emailAt > 0 && emailDot > emailAt + 1 && emailDot < email.length - 1 
  );
}

function isValidName(name) {
  if (name.length < 2 || name.length > 20) {
    return false;
  }

  const validChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ '-";
  for (let char of name) {
    if (!validChars.includes(char)) {
      return false;
    }
  }
  
  return true;
}

function adminAuthRegister(email, password, nameFirst, nameLast) {
  if (users.some(user => user.email === email)) {
    return { error: "Email address is already in use." };
  }

  if (!isValidEmail(email)) {
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

  const authUserId = users.length + 1;
  users.push({ authUserId, email, password, nameFirst, nameLast });

  return { authUserId };
}

module.exports = { adminAuthRegister, users }; 

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
