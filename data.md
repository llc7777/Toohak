```javascript
let data = {
    // TODO: insert your data structure that contains 
    // users + quizzes here
		users: [
			{
				email: 'string',
				password: 'string',
				nameFirst: 'string',
				nameLast: 'string',
				avatar: 'string',
				score: -1,
				authUserId: -1,
				timeCreated: -1,
			}
		],
		quizzes: [
			{
				quizId: -1,
				name: 'string',
				timeCreated: -1,
				timeLastEdited: -1,
				description: 'string',
				numQuestions: -1,
				timeLimit: -1,
				questions: [
					{
						questionNumber: -1,
						questionPrompt: 'string',
						numberOfOptions: -1,
						correctAnswer: -1,
					}
				],
			}
		],
};
```

[Optional] short description: The data currently stores information for users, and quizzes. It uses an array of users, and an array of quizzes that are both
stored within a data object. The users array stores basic personal information such as name, email, password, the users current score, etc. The quizzes key stores
information such as quizId, the name of the quiz, a description of the quiz, the time limit for each question, etc. Note that in the quizzes key, there is another key
that is called 'questions'. This is an array of objects that stores information about the questions within the quiz such as the question number, what the actual
question is (questionPrompt), etc. The correct answer key is given by an integer. So, suppose there are 4 options. Then the correct answer will be EITHER 1, or 2,
or 3, or 4.
