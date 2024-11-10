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
				tokens = [ {sessionId: -1, authUserId = -1} ],
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
        questions: [
          {
            questionId: -1,
            question: 'string',
            timeLimit: -1,
            thumbnailUrl: 'string',
            points: -1,
            answerOptions: [
              {
                answerId: -1,
				        answer: 'string',
				        colour: 'string',
                correctAnswer: boolean,
              }
            ]
          }
        ],
        timeLimit: -1,
        thumbnailUrl: 'string'
			}
		],
    sessions: [
      {
        sessionId: -1,
        state: 'string',
        atQuestion: -1,
        players: [
          {
            name: 'name',
            playerId: -1,
            score: -1,
          }
        ],
        metaData: {
          quizId: -1,
          name: string,
          timeCreated: -1,
          timeLastEdited: -1,
          description: string,
          numOfQuestions: -1,
          questions: [
            {
              questionId: -1,
              question: 'string',
              timeLimit: -1,
              thumbnailUrl: 'string',
              points: -1,
              answerOptions: [
                {
                  answerId: -1;
                  answer: 'string';
                  colour: 'string';
                  correct: boolean;
                }
              ],
              playersCorrect: ['string'],
              averageAnswerTime: -1,
              percentCorrect: -1,
            }
          ],
        },
        messages: [
          {
            messageBody: 'string',
            playerId: 'string',
            playerName: 'string',
            timeSent: -1,
          }
        ]
      }
    ],
    trash: [
			{
				authUserId: -1,
				quizId: -1,
				name: 'string',
				timeCreated: -1,
				timeLastEdited: -1,
				description: 'string',
			}
    ]
};
```

[Optional] short description: 
The data object stores information for users and quizzes using two arrays:

- Users Array: Stores user information including email, password, names, and timestamps for account creation and login activities.

- Quizzes Array: Contains quiz information including ID, name, creation time, description. 

- Trash Array: Contains quizzes that have been deleted.
