
import {
   adminQuizInfo,
   adminQuizCreate,
} from './quiz.js'
import {
   adminAuthRegister,
} from './auth.js'
import {
   clear,
} from './other.js'


beforeEach(() => {
 // Reset the state of our data so that each tests can run independently
 clear();
});

/*| ---------------------------------------------|
*   |                                                                                            |
*   |       adminQuizInfo tests done by MOHAMMAD             |
*   |                                                                                            |
*   -----------------------------------------------|
*/

describe('adminQuizInfo', () => {
   describe('cases with errors', () => {
       test('authId does not correspond to any user', () => {
           let user = adminAuthRegister('hayden.smith@gmail.com', 'password1', 'Hayden', 'Smith');
           let quiz = adminQuizCreate(user.authUserId, 'quiz', 'A quiz by Hayden Smith');
           let result = adminQuizInfo(user.authUserId + 1, quiz.quizId);
           expect(result).toStrictEqual( {error: expect.any(String)} );
       })
       test('quizId does not correspond to any quiz', () => {
           let user = adminAuthRegister('andrew.taylor@gmail.com', 'password1', 'Andrew', 'Taylor');
           let quiz = adminQuizCreate(user.authUserId, 'quiz', 'A quiz by Andrew Taylor');
           let result = adminQuizInfo(user.authUserId, quiz.quizId + 1);
           expect(result).toStrictEqual( {error: expect.any(String)} );
       })
       test('quizId does not correspond to a quiz that the user owns', () => {
           let user1 = adminAuthRegister('hayden.smith@gmail.com', 'password1', 'Hayden', 'Smith');
           let user2 = adminAuthRegister('andrew.taylor@gmail.com', 'password1', 'Andrew', 'Taylor');
           let quiz1 = adminQuizCreate(user1.authUserId, 'quiz1', 'A quiz by Hayden Smith');
           let quiz2 = adminQuizCreate(user2.authUserId, 'quiz2', 'A quiz by Andrew Taylor');
           let result = adminQuizInfo(user2.authUserId, quiz1.quizId);
           expect(result).toStrictEqual( {error: expect.any(String)} );
       })
			test.each([
     		'string',     // Non-numeric string
     		null,         // Null value
     		{},           // Object
     		[],           // Array
     		NaN,          // Not-a-Number
   		])('authId is not a number', (input) => {
       let user = adminAuthRegister('andrew.taylor@gmail.com', 'password1', 'Andrew', 'Taylor');
       let quiz = adminQuizCreate(user.authUserId, 'quiz', 'A quiz by Andrew Taylor');
       let result = adminQuizInfo(input, quiz.quizId);
       expect(result).toStrictEqual({ error: expect.any(String) });
		 	});
   })
   describe('cases with no errors', () => {
       test('successfully return value for one user and one quiz', () => {
           let user = adminAuthRegister('jake.renzella@gmail.com', 'password1', 'Jake', 'Renzella');
           let quiz = adminQuizCreate(user.authUserId, 'quiz', 'A quiz by Jake Renzella');
           let result = adminQuizInfo(user.authUserId, quiz.quizId);
           expect(result).toStrictEqual( {
               quizId: quiz.quizId,
               name: 'quiz',
               timeCreated: expect.any(Number),
               timeLastEdited: expect.any(Number),
               description: 'A quiz by Jake Renzella'
           })
       })
       test('successfullt return value when multiple users and quizzes exist', () => {
           let user1 = adminAuthRegister('jake.renzella@gmail.com', 'password1', 'Jake', 'Renzella');
           let quiz1 = adminQuizCreate(user1.authUserId, 'quiz1', 'A quiz by Jake Renzella');
           let user2 = adminAuthRegister('yuchao.zhang@gmail.com', 'password1', 'Yuchao', 'Zhang');
           let quiz2 = adminQuizCreate(user2.authUserId, 'quiz2', 'A quiz by Yuchao Zhang');
           let result = adminQuizInfo(user1.authUserId, quiz1.quizId);
           expect(result).toStrictEqual( {
               quizId: quiz1.quizId,
               name: 'quiz1',
               timeCreated: expect.any(Number),
               timeLastEdited: expect.any(Number),
               description: 'A quiz by Jake Renzella'
           })
       })
   })
})
