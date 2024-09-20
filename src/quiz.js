/**
 * 
 * @param {integer} authUserId Id of user
 * @param {string} name Name of user 
 * @param {string} description Description of new quiz
 * @returns 
 */
function adminQuizCreate(authUserId, name, description) {
    return {
        quizId: 2
    }
}

/**
 * 
 * @param {integer} authUserId Id of user
 * @param {integer} quizId Id of quiz
 * @returns 
 */
function adminQuizRemove(authUserId, quizId) {
    return {};
}