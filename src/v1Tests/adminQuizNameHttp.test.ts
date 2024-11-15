
import request from 'sync-request-curl';
import config from '../config.json';

const port = config.port;
const url = config.url;
const SERVER_URL = `${url}:${port}`;
const timeout = 5 * 1000;

const requestAdminQuizName = (quizId: number, body: { token: string, name: string }) => {
  return request('PUT', `${SERVER_URL}/v1/admin/quiz/${quizId}/name`, {
    json: { token: body.token, name: body.name },
  });
};

describe('HTTP tests for /v1/admin/quiz/{quizId}/name', () => {
  let quizId: number;
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

    const quizRes = request('POST', `${SERVER_URL}/v1/admin/quiz`, {
      json: { token, name: 'quiz1', description: 'random description' },
      timeout: timeout
    });
    quizId = JSON.parse(quizRes.body.toString()).quizId;
  });

  describe('error cases', () => {
    test('401: empty token', () => {
      const response = requestAdminQuizName(quizId, { token: '', name: 'new name' });
      expect(response.statusCode).toBe(401);
    });

    test('401: invalid token', () => {
      const response = requestAdminQuizName(quizId, {
        token: 'notaToken', name: 'new name'
      });
      expect(response.statusCode).toBe(401);
    });

    test('403: valid token with incorrect owner', () => {
      let incorrectUserRes = request('POST', `${SERVER_URL}/v1/admin/auth/register`, {
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
      const response = requestAdminQuizName(quizId, {
        token: incorrectUser.token, name: 'new name'
      });
      expect(response.statusCode).toBe(403);
    });

    test('400: quiz id nonexistent', () => {
      const response = requestAdminQuizName(quizId + 1, { token: token, name: 'new name' });
      expect(response.statusCode).toBe(403);
    });

    test.each([
      'VIM!!!',
      'VIM*',
      'VIM~',
      'VIM@',
      'VIM#'
    ])('400: invalid characters for new name', (invalidName) => {
      const response = requestAdminQuizName(quizId, { token: token, name: invalidName });
      expect(response.statusCode).toBe(400);
    });

    test('400: new quiz name is too long >30 characters', () => {
      const response = requestAdminQuizName(quizId, {
        token: token, name: 'a really really long name that exceeds thirty characters'
      });
      expect(response.statusCode).toBe(400);
    });

    test('400: name is already used by loggin in user for another quiz', () => {
      let quiz2Res = request('POST', `${SERVER_URL}/v1/admin/quiz`, {
        json: {
          token,
          name: 'quiz2',
          description: 'random description'
        },
        timeout: timeout
      });
      const quiz2 = JSON.parse(quiz2Res.body.toString());
      const response = requestAdminQuizName(quiz2.quizId, { token: token, name: 'quiz1' });
      expect(response.statusCode).toBe(400);
    });
  });

  describe('successful case', () => {
    test('200: successful name change', () => {
      const response = requestAdminQuizName(quizId, { token: token, name: 'new name' });
      const resultBody = JSON.parse(response.body.toString());
      expect(response.statusCode).toBe(200);
      expect(resultBody).toEqual({});
    });
  });
});
