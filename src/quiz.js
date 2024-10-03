import { getData } from './dataStore.js';
import { validQuizName } from './helper.js'; 

/**
 * Retrieve a list of all quizzes created by the authenticated user.
 * @param {integer} authUserId 
 * @returns {object} 
 */

export function adminQuizList(authUserId) {
	let store = getData();
	let arr = [];

	const userExists = store.users.find((user) => user.authUserId === authUserId);
	if (!userExists) {
		return {
			error: 'No user with the given authUserId exists',
		}
	}

	for (let i = 0; i < store.quizzes.length; i++) {
		if (store.quizzes[i].authUserId === authUserId) {
			const item = {
				quizId: store.quizzes[i].quizId,
				name: store.quizzes[i].name,
			}
			arr.push(item);
		}
	}

	return {
		quizzes: arr,
	}
}

/**
 * 
 * @param {integer} authUserId Id of user
 * @param {string} name Name of user 
 * @param {string} description Description of new quiz
 * @returns 
 */

export function isUserValid(authUserId) {
	const { users } = getData();
	return users.some(user => user.authUserId === authUserId);
}

export function nameUsed(authUserId, name) {
	const { quizzes } = getData();
	return quizzes.some(quiz => quiz.authUserId === authUserId && quiz.name === name);
}

export function adminQuizCreate(authUserId, name, description) {
	const { quizzes } = getData();

	if (!isUserValid(authUserId)) {
		return { error: 'AuthUserId is not a valid user.' };
	}

	if (name.length < 3 || name.length > 30) {
		return { error: 'Name must be between 3 and 30 characters long.' };
	}

	if (!validQuizName(name)) {
		return { error: 'Name contains invalid characters. Only alphanumeric characters, spaces, apostrophes, and hyphens are allowed.' };
	}

	if (nameUsed(authUserId, name)) {
		return { error: 'Name is already used by the current logged-in user for another quiz.' };
	}

	if (description.length > 100) {
		return { error: 'Description is more than 100 characters in length.' };
	}

	const newQuizId = quizzes.length + 1;
	const newQuiz = {
		quizId: newQuizId,
		authUserId,
		name,
		description,
		timeCreated: Date.now(),
		timeLastEdited: Date.now(),
	};

	quizzes.push(newQuiz);

	return { quizId: newQuizId };
}


/**
 * 
 * @param {integer} authUserId Id of user
 * @param {integer} quizId Id of quiz
 * @returns 
 */
export function adminQuizRemove(authUserId, quizId) {
	const data = getData();

  // Check if the authUserId is valid using isValidUser helper function
  const user = isUserValid(authUserId);
  if (!user) {
    return { error: 'AuthUserId is not a valid user.' };
  }

  // Check if the quizId refers to a valid quiz
  const quizIndex = data.quizzes.findIndex(quiz => quiz.quizId === quizId);
  if (quizIndex === -1) {
    return { error: 'Quiz ID does not refer to a valid quiz.' };
  }

  // Check if the quiz belongs to the user
  const quiz = data.quizzes[quizIndex];
  if (quiz.authUserId !== authUserId) {
    return { error: 'Quiz ID does not refer to a quiz that this user owns.' };
  }

  // Remove the quiz
  data.quizzes.splice(quizIndex, 1);

  // return an empty object
  return {};
}

/**
*	Gets information for a given quiz given a quizId and authUserId
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
export function adminQuizInfo(authUserId, quizId) {

	return {
		quizId: 1,
		name: 'My Quiz',
		timeCreated: 1683125870,
		timeLastEdited: 1683125871,
		description: 'This is my quiz',
	};
}

/**
*	Updates the name of the relevant quiz
*	@param {integer} authUser Id of user
*	@param {integer} quizId of user
*	@param {string} name
*	@returns empty object {
* 	}
*/
export function adminQuizNameUpdate(authUserId, quizId, name) {

}
/**
*	Updates the description of the relevant quiz
*	@param {integer} authUser Id of user
*	@param {integer} quizId of user
*	@param {string} description
*	@returns empty object {
* 	}
*/
export function adminQuizDescriptionUpdate(authUserId, quizId, description) {

};