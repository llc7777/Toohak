
import request from 'sync-request-curl';
import { port, url } from '../config.json';
import { createToken } from '../helper';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

const ERROR = { error: expect.any(String) };

let token: string;
let quizId: number;
let questionId: number;

beforeEach(() => {
  request('DELETE', `${SERVER_URL}/v1/clear`, { timeout: TIMEOUT_MS });

  const response = request('POST', `${SERVER_URL}/v1/admin/auth/register`, {
    json: {
      email: 'Aerospace@gmail.com',
      password: 'Aeropass1',
      nameFirst: 'Leo',
      nameLast: 'Kim',
    },
    timeout: TIMEOUT_MS,
  });

  token = JSON.parse(response.body.toString()).token;

  const quizResponse = request('POST', `${SERVER_URL}/v1/admin/quiz`, {
    json: {
      token,
      name: 'quiz1',
      description: 'description1',
    },
    timeout: TIMEOUT_MS,
  });

  quizId = JSON.parse(quizResponse.body.toString()).quizId;

  const questionResponse = request('POST', `${SERVER_URL}/v1/admin/quiz/${quizId}/question`, {
    json: {
      token,
      questionBody: {
        question: 'What is the largest mammal in the world?',
        timeLimit: 4,
        points: 5,
        answerOptions: [
          { answer: 'Whale', correct: true },
          { answer: 'Frog', correct: false },
        ],
      },
    },
    timeout: TIMEOUT_MS,
  });

  questionId = JSON.parse(questionResponse.body.toString()).questionId;
});

describe('Test for DELETE /v1/admin/quiz/{quizId}/question/{questionId}', () => {
  test('should delete a question successfully', () => {
    const res = request('DELETE', `${SERVER_URL}/v1/admin/quiz/${quizId}/question/${questionId}`, {
      qs: { token },
      timeout: TIMEOUT_MS,
    });

    expect(res.statusCode).toStrictEqual(200);
    expect(JSON.parse(res.body.toString())).toStrictEqual({});
  });

  test('error for empty token', () => {
    const emptyToken = '';

    const res = request('DELETE', `${SERVER_URL}/v1/admin/quiz/${quizId}/question/${questionId}`, {
      qs: { token: emptyToken },
      timeout: TIMEOUT_MS,
    });

    expect(res.statusCode).toStrictEqual(401);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });

  test('error for invalid token', () => {
    const invalidToken = { sessionId: 1, authUserId: 1531 };
    const encodedInvalid = createToken(invalidToken);

    const res = request('DELETE', `${SERVER_URL}/v1/admin/quiz/${quizId}/question/${questionId}`, {
      qs: { token: encodedInvalid },
      timeout: TIMEOUT_MS,
    });

    expect(res.statusCode).toStrictEqual(401);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });

  test('error for non-existent question id', () => {
    const res = request('DELETE',
    `${SERVER_URL}/v1/admin/quiz/${quizId}/question/${questionId + 1}`, {
      qs: { token },
      timeout: TIMEOUT_MS,
    });

    expect(res.statusCode).toStrictEqual(400);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });

  test('error for non-existent quiz id', () => {
    const res = request('DELETE',
    `${SERVER_URL}/v1/admin/quiz/${quizId + 1}/question/${questionId}`, {
      qs: { token },
      timeout: TIMEOUT_MS,
    });

    expect(res.statusCode).toStrictEqual(403);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });

  test('error for valid token but incorrect owner', () => {
    const secondUserResponse = request('POST', `${SERVER_URL}/v1/admin/auth/register`, {
      json: {
        email: 'otheruser@gmail.com',
        password: 'Password1',
        nameFirst: 'Jane',
        nameLast: 'Doe',
      },
      timeout: TIMEOUT_MS,
    });

    const secondToken = JSON.parse(secondUserResponse.body.toString()).token;

    const res = request('DELETE', `${SERVER_URL}/v1/admin/quiz/${quizId}/question/${questionId}`, {
      qs: { token: secondToken },
      timeout: TIMEOUT_MS,
    });

    expect(res.statusCode).toStrictEqual(403);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });
});
