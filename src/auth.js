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