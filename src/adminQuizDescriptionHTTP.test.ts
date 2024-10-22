/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

import request from 'sync-request-curl';
import { port, url } from './config.json';
import { createToken } from './helper';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

const ERROR = { error: expect.any(String) };

let token = {};
const quizId = 1;

beforeEach(() => {
  request('DELETE', `${SERVER_URL}/v1/clear`, { timeout: TIMEOUT_MS });

  token = request('POST', `${SERVER_URL}/v1/admin/auth/register`, {
    json: {
      email: 'Aerospace@gmail.com',
      password: 'Aeropass1',
      nameFirst: 'Leo',
      nameLast: 'Kim'
    },
    timeout: TIMEOUT_MS
  });

  token = JSON.parse(token.body.toString()).token;

  request('POST', `${SERVER_URL}/v1/admin/quiz`, {
    json: { token, name: 'quiz1', description: 'Initial description' },
    timeout: TIMEOUT_MS
  });
});

describe('Test for PUT v1/admin/quiz/:quizId/description', () => {
  test('should update quiz description successfully', () => {
    const newDescription = 'Updated description';
    const res = request('PUT', `${SERVER_URL}/v1/admin/quiz/${quizId}/description`, {
      qs: { token },
      json: { quizId, description: newDescription },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toStrictEqual(200);
    expect(JSON.parse(res.body.toString())).toStrictEqual({});
  });

  test('should update quiz description successfully with empty description', () => {
    const res = request('PUT', `${SERVER_URL}/v1/admin/quiz/${quizId}/description`, {
      qs: { token },
      json: { quizId, description: '' },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toStrictEqual(200);
    expect(JSON.parse(res.body.toString())).toStrictEqual({});
  });

  test('should return error if quiz does not exist', () => {
    const invalidQuizId = 999;
    const res = request('PUT', `${SERVER_URL}/v1/admin/quiz/${invalidQuizId}/description`, {
      qs: { token },
      json: { quizId: invalidQuizId, description: 'New description' },
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
      qs: { token: anotherToken },
      json: { quizId, description: newDescription },
      timeout: TIMEOUT_MS
    });
    expect(updateResponse.statusCode).toBe(403);
    expect(JSON.parse(updateResponse.body.toString())).toEqual(ERROR);
  });

  test('should return error if description is more than 100 characters', () => {
    const longDescription = 'A'.repeat(101);
    const res = request('PUT', `${SERVER_URL}/v1/admin/quiz/${quizId}/description`, {
      qs: { token },
      json: { quizId, description: longDescription },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toStrictEqual(400);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });

  test('should return error for empty token', () => {
    const emptyToken = '';

    const res = request('PUT', `${SERVER_URL}/v1/admin/quiz/${quizId}/description`, {
      json: { token: emptyToken, quizId, description: 'Some description' },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toStrictEqual(401);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });

  test('should return error for invalid token', () => {
    const invalidToken = { sessionId: 1, authUserId: 1531 };
    const encodedInvalid = createToken(invalidToken);

    const res = request('PUT', `${SERVER_URL}/v1/admin/quiz/${quizId}/description`, {
      json: { token: encodedInvalid, quizId, description: 'Some description' },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toStrictEqual(401);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });
});
