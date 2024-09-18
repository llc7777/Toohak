/*
*	Paramters: authUserId, quizId
*
*	Gets all the relevant information of a current quiz that
*	is specified by the quizId. 

*	Returns an object {
* quizId:
*	name:
*	timeCreated:
*	timeLastEdited:
*	description:
*	}
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
