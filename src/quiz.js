/*
*	Gets information for a given quiz given a quizId and authUserId
*
*	@param {integer} authUser Id of user
*	@param {integer} quizId of user
* @returns {object} - An object containing the following keys that show quiz info:
*		- {integer} quizId:
*		- {string} name:
*		- {integer} timeCreated:
*		- {integer} timeLastEdited:
*		- {string} description:
*
*/
function adminQuizInfo (authUserId, quizId) {

	return {
		quizId: 1,
  	name: 'My Quiz',
  	timeCreated: 1683125870,
  	timeLastEdited: 1683125871,
  	description: 'This is my quiz',
	};
}
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
