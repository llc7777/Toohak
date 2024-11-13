import request from 'sync-request-curl';
import { port, url } from '../config.json';
import { createToken } from '../helper';
import { ErrorResponse, Token } from '../interfaces';

const SERVER_URL: string = `${url}:${port}`;
const TIMEOUT_MS: number = 5 * 1000;

// Error object
const ERROR: ErrorResponse = { error: expect.any(String) };

// parameters for test functions
let token: string = '';
let quizId: number = 0;
let sessionId: number = 0;

// function to start a quiz session
const startQuizSession = (quizId: number, autoStartNum: number) => {
  return request('POST', `${SERVER_URL}/v1/admin/quiz/${quizId}/session/start`, {
    headers: { token },
    json: { autoStartNum },
    timeout: TIMEOUT_MS,
  });
};

// function to update a quiz session
const updateQuizSession = (action: string, sessionId: number, token: string, quizId: number) => {
  return request('PUT', `${SERVER_URL}/v1/admin/quiz/${quizId}/session/${sessionId}`, {
    headers: { token },
    json: { action },
    timeout: TIMEOUT_MS,
  });
};

// const getQuizSessionStatus = () => {
//     return request('GET', `${SERVER_URL}/v1/quiz/${quizId}/session/${sessionId}`, {
//         headers: { token },
//         timeout: TIMEOUT_MS,
//     });
// };

// clear the database before each test and set parameters for session start
beforeEach(() => {
  request('DELETE', SERVER_URL + '/v1/clear', { timeout: TIMEOUT_MS });

  // register a user
  const res = request('POST', SERVER_URL + '/v1/admin/auth/register', {
    json: {
      email: 'Aerospace@gmail.com',
      password: 'Aeropass1',
      nameFirst: 'Leo',
      nameLast: 'Kim'
    },
    timeout: TIMEOUT_MS
  });

  token = JSON.parse(res.body.toString()).token;

  // create a quiz
  const res2 = request('POST', SERVER_URL + '/v2/admin/quiz', {
    headers: { token },
    json: { name: 'quiz1', description: 'description' },
    timeout: TIMEOUT_MS
  });

  quizId = JSON.parse(res2.body.toString()).quizId;

  // create a quiz question
  request('POST', `${SERVER_URL}/v2/admin/quiz/${quizId}/question`, {
    headers: { token },
    json: {
      questionBody: {
        question: 'What is the largest mammal in the world?',
        timeLimit: 4,
        points: 5,
        answerOptions: [
          {
            answer: 'Whale',
            correct: true
          },
          {
            answer: 'Frog',
            correct: false
          }
        ],
        thumbnailUrl: 'http://google.com/some/image/path.jpg'
      }
    },
    timeout: TIMEOUT_MS
  });

  const res4 = startQuizSession(quizId, 2);

  sessionId = JSON.parse(res4.body.toString()).sessionId;
});

describe('Test for PUT /v1/admin/quiz/{quizid}/session/{sessionid}', () => {
  // successful cases
  // test('Update a session gives back right return value', () => {
  //     const res = updateQuizSession('NEXT_QUESTION', sessionId);

  //     expect(res.statusCode).toStrictEqual(200);
  //     expect(JSON.parse(res.body.toString())).toStrictEqual({});

  //     const res2 = getQuizSessionStatus();
  //     expect(res2.statusCode).toStrictEqual(200);
  //     expect(JSON.parse(res2.body.toString())).state.toStrictEqual({
  //     });

  // error cases

  // 400 errors
  test('Test for invalid session id', () => {
    const invalidSessionId: number = 100;

    const res = updateQuizSession('NEXT_QUESTION', invalidSessionId, token, quizId);

    expect(res.statusCode).toStrictEqual(400);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });

  test('Test for invalid action', () => {
    const res = updateQuizSession('INVALID_ACTION', sessionId, token, quizId);

    expect(res.statusCode).toStrictEqual(400);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });

  test('Test for action cannot be applied in the current state', () => {
    const res = updateQuizSession('SKIP_COUNTDOWN', sessionId, token, quizId);

    expect(res.statusCode).toStrictEqual(400);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });

  // 401 errors
  test('Test for empty token', () => {
    const emptyToken: string = '';

    const res = updateQuizSession('NEXT_QUESTION', sessionId, emptyToken, quizId);

    expect(res.statusCode).toStrictEqual(401);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });

  test('Test for invalid token', () => {
    const invalidToken: Token = { sessionId: 1, authUserId: 1531 };
    const encodedInvalid: string = createToken(invalidToken);

    const res = updateQuizSession('NEXT_QUESTION', sessionId, encodedInvalid, quizId);

    expect(res.statusCode).toStrictEqual(401);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });

  // 403 errors
  test('User does not own the quiz', () => {
    // register a user
    const res = request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email: 'Aerospace2@gmail.com',
        password: 'Aeropass2',
        nameFirst: 'Jin',
        nameLast: 'Kim',
      },
      timeout: TIMEOUT_MS
    });

    const token2: string = JSON.parse(res.body.toString()).token;

    const res2 = updateQuizSession('NEXT_QUESTION', sessionId, token2, quizId);

    expect(res2.statusCode).toStrictEqual(403);
    expect(JSON.parse(res2.body.toString())).toStrictEqual(ERROR);
  });

  test('Quiz does not exist', () => {
    const wrongQuizId: number = 1531;

    const res = updateQuizSession('NEXT_QUESTION', sessionId, token, wrongQuizId);

    expect(res.statusCode).toStrictEqual(403);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });
});
