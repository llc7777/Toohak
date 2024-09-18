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

/**
 * Given details relating to a password change, update the password of a logged in user.
 * @param {integer} authUserId 
 * @param {string} oldPassword 
 * @param {string} newPassword 
 * @returns {object} - Returns an empty object
 */
function adminUserPasswordUpdate(authUserId, oldPassword, newPassword) {
  
  return {};
}