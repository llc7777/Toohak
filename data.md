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
				numSuccessfulLogins: -1,
				numFailedPasswordsSinceLastLogin: -1,
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
						options: ['string'],
						correctAnswer: -1,
					}
				],
			}
		],
};
```

[Optional] short description: 
The data object stores information for users and quizzes using two arrays:

- Users Array: Stores user information including email, password, names, avatar, score, and timestamps for account creation and login activities.

- Quizzes Array: Contains quiz information including ID, name, creation time, description, number of questions, and time limits. Each quiz has a questions array with question numbers, prompts, options, etc. The correct answer is indicated by an integer corresponding to one of the options (e.g., 1, 2, 3, or 4 for four options).
