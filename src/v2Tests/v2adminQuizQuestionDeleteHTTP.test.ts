import request from 'sync-request-curl';
import { port, url } from '../config.json';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5000;
const ERROR_RESPONSE = { error: expect.any(String) };

let token: string;
let quizId: number;
let questionId: number;

beforeEach(() => {
  // Clear data
  request('DELETE', `${SERVER_URL}/v1/clear`, { timeout: TIMEOUT_MS });

  // Register user and obtain token
  const registerRes = request('POST', `${SERVER_URL}/v1/admin/auth/register`, {
    json: {
      email: 'testuser@gmail.com',
      password: 'testPassword123',
      nameFirst: 'Test',
      nameLast: 'User',
    },
    timeout: TIMEOUT_MS,
  });
  token = JSON.parse(registerRes.body.toString()).token;

  // Create a quiz
  const quizRes = request('POST', `${SERVER_URL}/v1/admin/quiz`, {
    json: {
      token,
      name: 'Sample Quiz',
      description: 'Sample Description',
    },
    timeout: TIMEOUT_MS,
  });
  quizId = JSON.parse(quizRes.body.toString()).quizId;

  // Add a question to the quiz
  const questionRes = request('POST', `${SERVER_URL}/v1/admin/quiz/${quizId}/question`, {
    json: {
      token,
      questionBody: {
        question: 'What is the largest planet?',
        timeLimit: 10,
        points: 5,
        answerOptions: [
          { answer: 'Jupiter', correct: true },
          { answer: 'Earth', correct: false },
        ],
      },
    },
    timeout: TIMEOUT_MS,
  });
  questionId = JSON.parse(questionRes.body.toString()).questionId;
});

describe('DELETE /v2/admin/quiz/{quizId}/question/{questionId}', () => {
  test('Successfully deletes a question with no active sessions', () => {
    const res = request('DELETE', `${SERVER_URL}/v2/admin/quiz/${quizId}/question/${questionId}`, {
      json: { token },
      timeout: TIMEOUT_MS,
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body.toString())).toStrictEqual({});
  });

  test('Error 400 if question does not exist in quiz', () => {
    const res = request('DELETE', `${SERVER_URL}/v2/admin/quiz/${quizId}/question/${questionId + 999}`, {
      json: { token },
      timeout: TIMEOUT_MS,
    });

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR_RESPONSE);
  });

  test('Error 400 if there is an active session for the quiz', () => {
    request('POST', `${SERVER_URL}/v1/admin/quiz/${quizId}/session/start`, {
      json: { token },
      timeout: TIMEOUT_MS,
    });

    const res = request('DELETE', `${SERVER_URL}/v2/admin/quiz/${quizId}/question/${questionId}`, {
      json: { token },
      timeout: TIMEOUT_MS,
    });

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR_RESPONSE);
  });

  test('Error 401 if token is empty or invalid', () => {
    const res = request('DELETE', `${SERVER_URL}/v2/admin/quiz/${quizId}/question/${questionId}`, {
      json: { token: '' },
      timeout: TIMEOUT_MS,
    });

    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR_RESPONSE);
  });

  test('Error 403 if user does not own the quiz', () => {
    const secondUserRes = request('POST', `${SERVER_URL}/v1/admin/auth/register`, {
      json: {
        email: 'seconduser@gmail.com',
        password: 'testPassword456',
        nameFirst: 'Second',
        nameLast: 'User',
      },
      timeout: TIMEOUT_MS,
    });
    const secondUserToken = JSON.parse(secondUserRes.body.toString()).token;

    const res = request('DELETE', `${SERVER_URL}/v2/admin/quiz/${quizId}/question/${questionId}`, {
      json: { token: secondUserToken },
      timeout: TIMEOUT_MS,
    });

    expect(res.statusCode).toBe(403);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR_RESPONSE);
  });

  test('Error 403 if quiz does not exist', () => {
    const res = request('DELETE', `${SERVER_URL}/v2/admin/quiz/${quizId + 999}/question/${questionId}`, {
      json: { token },
      timeout: TIMEOUT_MS,
    });

    expect(res.statusCode).toBe(403);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR_RESPONSE);
  });
});
