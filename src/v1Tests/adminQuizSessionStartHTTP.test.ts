import request from 'sync-request-curl';
import { port, url } from '../config.json';
import { createToken } from '../helper';
import { ErrorResponse, Token } from '../interfaces';

const SERVER_URL: string = `${url}:${port}`;
const TIMEOUT_MS: number = 5 * 1000;

// Error object
const ERROR: ErrorResponse = { error: expect.any(String) };

// parameters of session start
let token: string = '';
let quizId: number = 0;
let questionId: number = 0;

// function to start a quiz session
const startQuizSession = (quizId: number, autoStartNum: number, token: string) => {
  return request('POST', `${SERVER_URL}/v1/admin/quiz/${quizId}/session/start`, {
    headers: { token },
    json: { autoStartNum },
    timeout: TIMEOUT_MS,
  });
};

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
  const res3 = request('POST', `${SERVER_URL}/v2/admin/quiz/${quizId}/question`, {
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

  questionId = JSON.parse(res3.body.toString()).questionId;
});

describe('Test for POST /v1/admin/quiz/{quizId}/session/start', () => {
  // successful cases
  test('Create a session', () => {
    const res = startQuizSession(quizId, 2, token);

    expect(res.statusCode).toStrictEqual(200);
    expect(JSON.parse(res.body.toString())).toStrictEqual({ sessionId: expect.any(Number) });
  });

  test('Create up to 9 sessions', () => {
    for (let i = 0; i < 10; i++) {
      const res = startQuizSession(quizId, 2, token);

      expect(res.statusCode).toStrictEqual(200);
      expect(JSON.parse(res.body.toString())).toStrictEqual({ sessionId: expect.any(Number) });
    }
  });

  test('Create sessions with different quizzes', () => {
    let res = request('POST', SERVER_URL + '/v2/admin/quiz', {
      headers: { token },
      json: { name: 'quiz2', description: 'description' },
      timeout: TIMEOUT_MS
    });

    const quizId2 = JSON.parse(res.body.toString()).quizId;

    request('POST', `${SERVER_URL}/v2/admin/quiz/${quizId2}/question`, {
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

    res = startQuizSession(quizId, 2, token);
    expect(res.statusCode).toStrictEqual(200);
    expect(JSON.parse(res.body.toString())).toStrictEqual({ sessionId: expect.any(Number) });

    const res2 = startQuizSession(quizId2, 2, token);
    expect(res2.statusCode).toStrictEqual(200);
    expect(JSON.parse(res2.body.toString())).toStrictEqual({ sessionId: expect.any(Number) });
  });

  // 400 error cases
  test('autoStartNum is a number greater than 50', () => {
    const res = startQuizSession(quizId, 51, token);

    expect(res.statusCode).toStrictEqual(400);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });

  test('10 sessions that are not in END state currently exist for this quiz', () => {
    for (let i = 0; i < 10; i++) {
      startQuizSession(quizId, 2, token);
    }

    const res = startQuizSession(quizId, 2, token);

    expect(res.statusCode).toStrictEqual(400);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });

  test('The quiz does not have any questions in it', () => {
    request('DELETE', `${SERVER_URL}/v1/admin/quiz/${quizId}/question/${questionId}`, {
      qs: { token },
      timeout: TIMEOUT_MS
    });

    const res = startQuizSession(quizId, 2, token);

    expect(res.statusCode).toStrictEqual(400);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });

  test('The quiz is in trash', () => {
    request('DELETE', `${SERVER_URL}/v1/admin/quiz/${quizId}`, {
      qs: { token },
      timeout: TIMEOUT_MS
    });

    const res = startQuizSession(quizId, 2, token);

    expect(res.statusCode).toStrictEqual(400);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });

  // 401 error cases
  test('Test for empty token', () => {
    const emptyToken: string = '';

    const res = startQuizSession(quizId, 2, emptyToken);

    expect(res.statusCode).toStrictEqual(401);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });

  test('Test for invalid token', () => {
    const invalidToken: Token = { sessionId: 1, authUserId: 1531 };
    const encodedInvalid: string = createToken(invalidToken);

    const res = startQuizSession(quizId, 2, encodedInvalid);

    expect(res.statusCode).toStrictEqual(401);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });

  // 403 error cases
  test('Test for invalid quizId', () => {
    const res = startQuizSession(9999, 2, token);

    expect(res.statusCode).toStrictEqual(403);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });

  test('Test for user not owning the quiz', () => {
    const res = request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email: 'Aerospace2@gmail.com',
        password: 'Aeropass2',
        nameFirst: 'Jin',
        nameLast: 'Kim'
      },
      timeout: TIMEOUT_MS
    });

    const token2 = JSON.parse(res.body.toString()).token;

    const res2 = startQuizSession(quizId, 2, token2);

    expect(res2.statusCode).toStrictEqual(403);
    expect(JSON.parse(res2.body.toString())).toStrictEqual(ERROR);
  });

});
