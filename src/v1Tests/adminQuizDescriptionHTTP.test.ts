import request from 'sync-request-curl';
import { port, url } from '../config.json';
import { createToken } from '../helper';
import { ErrorResponse, Token } from '../interfaces';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

// Define an expected error response for tests
const ERROR: ErrorResponse = { error: expect.any(String) };

// Declare variables to store user token and quiz ID
let token: string = '';
let quizId: number = 0;

// Clear the database and register a user before each test
beforeEach(() => {
  // Clear the database
  request('DELETE', `${SERVER_URL}/v1/clear`, { timeout: TIMEOUT_MS });

  // Register a new user and retrieve the token
  const res = request('POST', `${SERVER_URL}/v1/admin/auth/register`, {
    json: {
      email: 'Aerospace@gmail.com',
      password: 'Aeropass1',
      nameFirst: 'Leo',
      nameLast: 'Kim'
    },
    timeout: TIMEOUT_MS,
  });

  token = JSON.parse(res.body.toString()).token;

  // Create a quiz to obtain quizId
  const quizRes = request('POST', `${SERVER_URL}/v1/admin/quiz`, {
    json: { token, name: 'quiz1', description: 'Initial description' },
    timeout: TIMEOUT_MS
  });

  quizId = JSON.parse(quizRes.body.toString()).quizId;
});

describe('Test for PUT v1/admin/quiz/:quizId/description', () => {
  test('should update quiz description successfully', () => {
    const newDescription = 'Updated description';
    const res = request('PUT', `${SERVER_URL}/v1/admin/quiz/${quizId}/description`, {
      json: { token, description: newDescription },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toStrictEqual(200);
    expect(JSON.parse(res.body.toString())).toStrictEqual({});
  });

  test('should update quiz description successfully with empty description', () => {
    const res = request('PUT', `${SERVER_URL}/v1/admin/quiz/${quizId}/description`, {
      json: { token, description: '' },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toStrictEqual(200);
    expect(JSON.parse(res.body.toString())).toStrictEqual({});
  });

  test('should return error if quiz does not exist', () => {
    const invalidQuizId = 999;
    const res = request('PUT', `${SERVER_URL}/v1/admin/quiz/${invalidQuizId}/description`, {
      json: { token, description: 'New description' },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toStrictEqual(403);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });

  test('should return error if user does not own the quiz', () => {
    const newDescription = 'Updated description';
    const newUser = request('POST', `${SERVER_URL}/v1/admin/auth/register`, {
      json: {
        email: 'anotherUser@gmail.com',
        password: 'AnotherPass1',
        nameFirst: 'John',
        nameLast: 'Doe'
      },
      timeout: TIMEOUT_MS
    });

    const anotherToken = JSON.parse(newUser.body.toString()).token;
    const updateResponse = request('PUT', `${SERVER_URL}/v1/admin/quiz/${quizId}/description`, {
      json: { token: anotherToken, description: newDescription },
      timeout: TIMEOUT_MS
    });
    expect(updateResponse.statusCode).toBe(403);
    expect(JSON.parse(updateResponse.body.toString())).toEqual(ERROR);
  });

  test('should return error if description is more than 100 characters', () => {
    const longDescription = 'A'.repeat(101);
    const res = request('PUT', `${SERVER_URL}/v1/admin/quiz/${quizId}/description`, {
      json: { token, description: longDescription },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toStrictEqual(400);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });

  test('should return error for empty token', () => {
    const emptyToken = '';

    const res = request('PUT', `${SERVER_URL}/v1/admin/quiz/${quizId}/description`, {
      json: { token: emptyToken, description: 'Some description' },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toStrictEqual(401);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });

  test('should return error for invalid token', () => {
    const invalidToken: Token = { sessionId: 1, authUserId: 1531 };
    const encodedInvalid: string = createToken(invalidToken);

    const res = request('PUT', `${SERVER_URL}/v1/admin/quiz/${quizId}/description`, {
      json: { token: encodedInvalid, description: 'Some description' },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toStrictEqual(401);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });
});
