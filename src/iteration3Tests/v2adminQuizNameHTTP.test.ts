import request from 'sync-request-curl';
import config from '../config.json';
import { Quiz } from '../interfaces';

const port: string = config.port;
const url: string = config.url;
const SERVER_URL: string = `${url}:${port}`;
const timeout: number = 5 * 1000;

const requestAdminQuizName = (quizId: number, token: string, body: { name: string }) => {
  return request('PUT', `${SERVER_URL}/v2/admin/quiz/${quizId}/name`, {
    json: { name: body.name },
    headers: { token: token }
  });
};

describe('HTTP tests for /v2/admin/quiz/{quizId}/name', () => {
  let quiz: Quiz;
  let token: string;

  beforeEach(() => {
    request('DELETE', SERVER_URL + '/v1/clear', { timeout: timeout });

    const tokenRes = request('POST', `${SERVER_URL}/v1/admin/auth/register`, {
      json: {
        email: 'aero@mail.com',
        password: 'Aeropass1',
        nameFirst: 'Jason',
        nameLast: 'Chandra'
      },
      timeout: timeout
    });
    token = JSON.parse(tokenRes.body.toString()).token;

    const quizRes = request('POST', `${SERVER_URL}/v2/admin/quiz`, {
      json: { name: 'quiz1', description: 'random description' },
      headers: { token },
      timeout: timeout
    });
    quiz = JSON.parse(quizRes.body.toString());
  });

  describe('error cases', () => {
    test('401: empty token', () => {
      const response = requestAdminQuizName(quiz.quizId, '', { name: 'new name' });
      expect(response.statusCode).toBe(401);
    });

    test('401: invalid token', () => {
      const response = requestAdminQuizName(quiz.quizId, 'notaToken', { name: 'new name' });
      expect(response.statusCode).toBe(401);
    });

    test('403: valid token with incorrect owner', () => {
      const incorrectUserRes = request('POST', `${SERVER_URL}/v1/admin/auth/register`, {
        json: {
          email: 'mew@mail.com',
          password: 'Aeropass1',
          nameFirst: 'Kate',
          nameLast: 'Smith'
        },
        timeout: timeout
      });
      const incorrectUser = JSON.parse(incorrectUserRes.body.toString());
      // to check how to retrieve token
      const response = requestAdminQuizName(quiz.quizId, incorrectUser.token, { name: 'new name' });
      expect(response.statusCode).toBe(403);
    });

    test('400: quiz id nonexistent', () => {
      const response = requestAdminQuizName(quiz.quizId + 1, token, { name: 'new name' });
      expect(response.statusCode).toBe(403);
    });

    test.each([
      'VIM!!!',
      'VIM*',
      'VIM~',
      'VIM@',
      'VIM#'
    ])('400: invalid characters for new name', (invalidName) => {
      const response = requestAdminQuizName(quiz.quizId, token, { name: invalidName });
      expect(response.statusCode).toBe(400);
    });

    test('400: new quiz name is too long >30 characters', () => {
      const response = requestAdminQuizName(quiz.quizId, token, {
        name: 'a really really long name that exceeds thirty characters'
      });
      expect(response.statusCode).toBe(400);
    });

    test('400: name is already used by loggin in user for another quiz', () => {
      const quiz2Res = request('POST', `${SERVER_URL}/v2/admin/quiz`, {
        json: {
          name: 'quiz2',
          description: 'random description'
        },
        headers: { token },
        timeout: timeout
      });
      const quiz2 = JSON.parse(quiz2Res.body.toString());
      const response = requestAdminQuizName(quiz2.quizId, token, { name: 'quiz1' });
      expect(response.statusCode).toBe(400);
    });
  });

  describe('successful case', () => {
    test('200: successful name change', () => {
      const response = requestAdminQuizName(quiz.quizId, token, { name: 'new name' });
      const resultBody = JSON.parse(response.body.toString());
      expect(response.statusCode).toBe(200);
      expect(resultBody).toEqual({});
    });
  });
});
