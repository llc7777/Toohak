```javascript
let data = {
    // TODO: insert your data structure that contains 
    // users + quizzes here
		users: [
			{
				email: 'string',
				password: 'string',
				oldPasswords: ['strings'],
				nameFirst: 'string',
				nameLast: 'string',
				name: 'string',
				authUserId: -1,
				timeCreated: -1,
				numSuccessfulLogins: -1,
				numFailedPasswordsSinceLastLogin: -1,
			}
		],
		quizzes: [
			{
				authUserId: -1,
				quizId: -1,
				name: 'string',
				timeCreated: -1,
				timeLastEdited: -1,
				description: 'string',
			}
		],
};
```

[Optional] short description: 
The data object stores information for users and quizzes using two arrays:

- Users Array: Stores user information including email, password, names, and timestamps for account creation and login activities.

- Quizzes Array: Contains quiz information including ID, name, creation time, description. 
