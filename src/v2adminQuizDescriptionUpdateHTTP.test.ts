import request from 'sync-request-curl';
import config from '../config.json';
import { Quiz } from '../interfaces';

const port: string = config.port;
const url: string = config.url;
const SERVER_URL: string = `${url}:${port}`;
const TIMEOUT_MS: number = 5 * 1000;

const requestAdminQuizDescription = (
  quizId: number,
  token: string,
  body: { description: string }
) => {
  return request('PUT', `${SERVER_URL}/v2/admin/quiz/${quizId}/description`, {
    json: { description: body.description },
    headers: { token },
    timeout: TIMEOUT_MS
  });
};

describe('HTTP tests for /v2/admin/quiz/{quizId}/description', () => {
  let quiz: Quiz;
  let token: string;

  beforeEach(() => {
    request('DELETE', `${SERVER_URL}/v1/clear`, { timeout: TIMEOUT_MS });

    const tokenRes = request('POST', `${SERVER_URL}/v1/admin/auth/register`, {
      json: {
        email: 'user@example.com',
        password: 'SecurePass123',
        nameFirst: 'John',
        nameLast: 'Doe'
      },
      timeout: TIMEOUT_MS
    });
    token = JSON.parse(tokenRes.body.toString()).token;

    const quizRes = request('POST', `${SERVER_URL}/v2/admin/quiz`, {
      json: { name: 'Sample Quiz', description: 'Initial description' },
      headers: { token },
      timeout: TIMEOUT_MS
    });
    quiz = JSON.parse(quizRes.body.toString());
  });

  describe('Error cases', () => {
    test('401: Empty token', () => {
      const response = requestAdminQuizDescription(quiz.quizId, '', { description: 'Updated description' });
      expect(response.statusCode).toBe(401);
    });

    test('401: Invalid token', () => {
      const response = requestAdminQuizDescription(quiz.quizId, 'invalidToken', { description: 'Updated description' });
      expect(response.statusCode).toBe(401);
    });

    test('403: Valid token but incorrect owner', () => {
      const newUserRes = request('POST', `${SERVER_URL}/v1/admin/auth/register`, {
        json: {
          email: 'otheruser@example.com',
          password: 'OtherPass123',
          nameFirst: 'Jane',
          nameLast: 'Smith'
        },
        timeout: TIMEOUT_MS
      });
      const newToken = JSON.parse(newUserRes.body.toString()).token;

      const response = requestAdminQuizDescription(quiz.quizId, newToken, { description: 'Updated description' });
      expect(response.statusCode).toBe(403);
    });

    test('400: Nonexistent quiz ID', () => {
      const invalidQuizId = quiz.quizId + 999; 
      const response = requestAdminQuizDescription(invalidQuizId, token, { description: 'Updated description' });
      expect(response.statusCode).toBe(400);
    });

    test('400: Description exceeds 100 characters', () => {
      const longDescription = 'A'.repeat(101);
      const response = requestAdminQuizDescription(quiz.quizId, token, { description: longDescription });
      expect(response.statusCode).toBe(400);
    });
  });

  describe('Successful cases', () => {
    test('200: Successfully update description', () => {
      const response = requestAdminQuizDescription(quiz.quizId, token, { description: 'Updated description' });
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body.toString())).toEqual({});
    });

    test('200: Successfully update to empty description', () => {
      const response = requestAdminQuizDescription(quiz.quizId, token, { description: '' });
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body.toString())).toEqual({});
    });
  });
});
