/**
 * Retrieve a list of all quizzes created by the authenticated user.
 * @param {integer} authUserId 
 * @returns {object} 
 */

import { getData } from './dataStore';
import { validQuizName, isUserValid, nameUsed } from './helper';

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
		timeCreated: Math.floor(Date.now() / 1000),
		timeLastEdited: Math.floor(Date.now() / 1000),
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
//export function adminQuizInfo(authUserId, quizId) {

export function adminQuizInfo(authUserId, quizId) {
	const data = getData();


	const user = data.users.find(user => user.authUserId === authUserId)
	if (!user) {
		return { error: 'Unable to find user Id ' }
	};


	const quiz = data.quizzes.find(quiz => quiz.quizId === quizId)
	if (!quiz) {
		return { error: 'Quiz unable to be found' }
	};

	const userAndQuizMatch = data.quizzes.find(quiz => quiz.authUserId === authUserId && quiz.quizId === quizId);
	if (!userAndQuizMatch) {
		return { error: 'The given user does not own the given quiz' }
	};

	return {
		quizId: quiz.quizId,
		name: quiz.name,
		timeCreated: quiz.timeCreated,
		timeLastEdited: quiz.timeLastEdited,
		description: quiz.description,
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
	let isUserExist = false;
	let isQuizExist = false;
	const data = getData();

	// Search through the data to check if the user exists
	for (let i = 0; i < data.users.length; i++) {
		if (data.users[i].authUserId === authUserId) {
			isUserExist = true;
		}
	}
	// Search through the data to check if the quiz exists
	for (let i = 0; i < data.quizzes.length; i++) {
		if (data.quizzes[i].quizId === quizId) {
			isQuizExist = true;
		}
	}
	// Check user owns the quiz
	for (let i = 0; i < data.quizzes.length; i++) {
		if (data.quizzes[i].quizId === quizId) {
			if (data.quizzes[i].authUserId !== authUserId) {
				return {
					error: 'User does not own the quiz',
				};
			}
		}
	}
	// Check quiz name is already used
	for (let i = 0; i < data.quizzes.length; i++) {
		if (data.quizzes[i].name === name) {
			return {
				error: 'Name is already used',
			};
		}
	}

	// Check user exists
	if (!isUserExist) {
		return {
			error: 'User Id does not exist',
		};
	}
	// Check quiz exists
	else if (!isQuizExist) {
		return {
			error: 'Quiz Id does not exist',
		};
	}
	// Check name contains invalid characters. Valid characters are alphanumeric and spaces.
	else if (!name.match(/^[a-zA-Z0-9 ]+$/)) {
		return {
			error: 'Name contains invalid characters (Valid characters are alphanumeric and spaces)',
		};
	}
	// Check name is less than 3 characters and more than 30 characters.
	else if (name.length < 3 || name.length > 30) {
		return {
			error: 'Name must be between 3 and 30 characters long',
		};
	}
	// Update the name of the quiz and return empty object for indication of no error
	else {
		for (let i = 0; i < data.quizzes.length; i++) {
			if (data.quizzes[i].quizId === quizId) {
				data.quizzes[i].name = name;

				return {};
			}
		}
	}
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
	let isUserExist = false;
	let isQuizExist = false;
	const data = getData();

	// Search through the data to check if the user exists
	for (let i = 0; i < data.users.length; i++) {
		if (data.users[i].authUserId === authUserId) {
			isUserExist = true;
		}
	}
	// Search through the data to check if the quiz exists
	for (let i = 0; i < data.quizzes.length; i++) {
		if (data.quizzes[i].quizId === quizId) {
			isQuizExist = true;
		}
	}
	// Check user owns the quiz
	for (let i = 0; i < data.quizzes.length; i++) {
		if (data.quizzes[i].quizId === quizId) {
			if (data.quizzes[i].authUserId !== authUserId) {
				return {
					error: 'User does not own the quiz',
				};
			}
		}
	}


	// Check user exists
	if (!isUserExist) {
		return {
			error: 'User Id does not exist',
		};
	}
	// Check quiz exists
	else if (!isQuizExist) {
		return {
			error: 'Quiz Id does not exist',
		};
	}
	// Check description is more than 100 characters.
	else if (description.length > 100) {
		return {
			error: 'Description must be less than 100 characters long',
		};
	}
	// Update the description of the quiz and return empty object for indication of no error
	else {
		for (let i = 0; i < data.quizzes.length; i++) {
			if (data.quizzes[i].quizId === quizId) {
				data.quizzes[i].description = description;
				data.quizzes[i].timeLastEdited = Math.floor(Date.now() / 1000);
				return {};
			}
		}
	}
};
