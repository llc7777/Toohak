import request from 'sync-request-curl';
import { port, url } from '../config.json';
import { createToken } from '../helper';
import { ErrorResponse, AuthResponse, QuizID, AnswerOptionsReq } from '../interfaces';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

const ERROR: ErrorResponse = { error: expect.any(String) };

let token: string = '';
let nonOwnerToken: string = '';
let quizId: number = 0;
let sessionId: number = 0;

// Function to register a user
const requestAdminAuthRegister = (
  email: string,
  password: string,
  nameFirst: string,
  nameLast: string
): { statusCode: number; body: AuthResponse } => {
  const res = request('POST', `${SERVER_URL}/v1/admin/auth/register`, {
    json: {
      email,
      password,
      nameFirst,
      nameLast,
    },
    timeout: TIMEOUT_MS,
  });
  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body.toString()),
  };
};

// Function to create a quiz
const quizCreate = (
  token: string,
  name: string,
  description: string
): QuizID => {
  const res = request('POST', SERVER_URL + '/v2/admin/quiz', {
    headers: { token },
    json: { name, description },
    timeout: TIMEOUT_MS,
  });
  return JSON.parse(res.body.toString());
};

// Function to create a question
const requestAdminQuestionCreate = (quizId: number, token: string,
  body: {
  questionBody: {
    question: string,
    timeLimit: number,
    points: number,
    answerOptions: AnswerOptionsReq[],
    thumbnailUrl: string
  }
}) => {
  return request('POST', `${SERVER_URL}/v2/admin/quiz/${quizId}/question`, {
    json: {
      questionBody: {
        question: body.questionBody.question,
        timeLimit: body.questionBody.timeLimit,
        points: body.questionBody.points,
        answerOptions: body.questionBody.answerOptions,
        thumbnailUrl: body.questionBody.thumbnailUrl
      }
    },
    headers: { token }
  });
};

// Function to start a quiz session
const startQuizSession = (quizId: number, autoStartNum: number) => {
  return request('POST', `${SERVER_URL}/v1/admin/quiz/${quizId}/session/start`, {
    headers: { token },
    json: { autoStartNum },
    timeout: TIMEOUT_MS,
  });
};

// Function to get session status
const getSessionStatus = (quizId: number, sessionId: number, token: string) => {
  return request('GET', `${SERVER_URL}/v1/admin/quiz/${quizId}/session/${sessionId}`, {
    headers: { token },
    timeout: TIMEOUT_MS,
  });
};

// Setup before each test
beforeEach(() => {
  // Clear the data
  request('DELETE', SERVER_URL + '/v1/clear', { timeout: TIMEOUT_MS });

  // Register an owner
  const resultOwner = requestAdminAuthRegister(
    'owner@gmail.com',
    'password1',
    'Owner',
    'User'
  );
  token = resultOwner.body.token;

  // Register a non-owner
  const resultNonOwner = requestAdminAuthRegister(
    'nonowner@gmail.com',
    'password2',
    'NonOwner',
    'User'
  );
  nonOwnerToken = resultNonOwner.body.token;

  // Create a quiz
  const createQuiz = quizCreate(token, 'Quiz 1', 'Quiz 1 description');
  quizId = createQuiz.quizId;

  // Create a question
  requestAdminQuestionCreate(quizId, token, {
    questionBody: {
      question: 'What is two plus two?',
      timeLimit: 4,
      points: 5,
      answerOptions: [
        {
          answer: 'Four',
          correct: true
        },
        {
          answer: 'Five',
          correct: false
        }
      ],
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    }
  });

  // Start a quiz session
  const startSessionRes = startQuizSession(quizId, 2);
  sessionId = JSON.parse(startSessionRes.body.toString()).sessionId;
});

describe('/v1/admin/quiz/{quizId}/session/{sessionId}', () => {
  describe('Successful cases', () => {
    test('Retrieve session status successfully', () => {
      const res = getSessionStatus(quizId, sessionId, token);

      expect(res.statusCode).toStrictEqual(200);
      const body = JSON.parse(res.body.toString());

      expect(body).toEqual({
        state: expect.any(String),
        atQuestion: expect.any(Number),
        players: [],
        metadata: {
          quizId: quizId,
          name: expect.any(String), // 'Quiz 1'
          timeCreated: expect.any(Number),
          timeLastEdited: expect.any(Number),
          description: expect.any(String), // 'Quiz 1 description'
          numQuestions: expect.any(Number),
          questions: [
            {
              questionId: expect.any(Number),
              question: expect.any(String),
              timeLimit: expect.any(Number),
              thumbnailUrl: expect.any(String),
              points: expect.any(Number),
              answerOptions: [
                {
                  answerId: expect.any(Number),
                  answer: expect.any(String),
                  colour: expect.any(String),
                  correct: expect.any(Boolean),
                },
                {
                  answerId: expect.any(Number),
                  answer: expect.any(String),
                  colour: expect.any(String),
                  correct: expect.any(Boolean),
                },
              ],
            },
          ],
          timeLimit: expect.any(Number),
          thumbnailUrl: expect.any(String),
        },
      });
    });

    // test('Players are returned in ascending order', () => {
    //   // Add players in non-alphabetical order to the session
    //   const playerNames = ['Charlie', 'Alice', 'Bob'];
    //   playerNames.forEach(playerName => {
    //     request('POST', `${SERVER_URL}/v1/player/join`, {
    //       json: { sessionId, playerName },
    //       timeout: TIMEOUT_MS,
    //     });
    //   });

    //   const res = getSessionStatus(quizId, sessionId, token);

    //   expect(res.statusCode).toStrictEqual(200);
    //   const body = JSON.parse(res.body.toString());

    //   expect(body.players).toStrictEqual(['Alice', 'Bob', 'Charlie']);
    // });
  });

  describe('Error cases', () => {
    test('Invalid token should return 401 error', () => {
      const invalidToken = { sessionId: 1, authUserId: 1531 };
      const encodedInvalid = createToken(invalidToken);

      const res = getSessionStatus(quizId, sessionId, encodedInvalid);

      expect(res.statusCode).toStrictEqual(401);
      expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
    });

    test('Empty token should return 401 error', () => {
      const emptyToken = '';
      const res = getSessionStatus(quizId, sessionId, emptyToken);

      expect(res.statusCode).toStrictEqual(401);
      expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
    });

    test('Quiz does not exist', () => {
      const invalidQuizId = quizId + 1;
      const res = getSessionStatus(invalidQuizId, sessionId, token);

      expect(res.statusCode).toStrictEqual(403);
      expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
    });

    test('Session does not exist', () => {
      const invalidSessionId = sessionId + 1;
      const res = getSessionStatus(quizId, invalidSessionId, token);

      expect(res.statusCode).toStrictEqual(400);
      expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
    });

    test('User is not the owner of this quiz', () => {
      const res = getSessionStatus(quizId, sessionId, nonOwnerToken);

      expect(res.statusCode).toStrictEqual(403);
      const body = JSON.parse(res.body.toString());
      expect(body).toStrictEqual(ERROR);
    });
  });
});
