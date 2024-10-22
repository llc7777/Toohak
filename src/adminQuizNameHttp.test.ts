/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import request from 'sync-request-curl';
import config from './config.json';

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
  let quiz;
  let token;

  beforeEach(() => {
    request('DELETE', SERVER_URL + '/v1/clear', { timeout: timeout });

    token = request('POST', `${SERVER_URL}/v1/admin/auth/register`, {
      json: {
        email: 'aero@mail.com',
        password: 'Aeropass1',
        nameFirst: 'Jason',
        nameLast: 'Chandra'
      },
      timeout: timeout
    });
    token = JSON.parse(token.body.toString()).token;

    quiz = request('POST', `${SERVER_URL}/v1/admin/quiz`, {
      json: { token, name: 'quiz1', description: 'random description' },
      timeout: timeout
    });
    quiz = JSON.parse(quiz.body.toString());
  });

  describe('error cases', () => {
    test('401: empty token', () => {
      const response = requestAdminQuizName(quiz.quizId, { token: '', name: 'new name' });
      expect(response.statusCode).toBe(401);
    });

    test('401: invalid token', () => {
      const response = requestAdminQuizName(quiz.quizId, {
        token: 'notaToken', name: 'new name'
      });
      expect(response.statusCode).toBe(401);
    });

    test('403: valid token with incorrect owner', () => {
      let incorrectUser = request('POST', `${SERVER_URL}/v1/admin/auth/register`, {
        json: {
          email: 'mew@mail.com',
          password: 'Aeropass1',
          nameFirst: 'Kate',
          nameLast: 'Smith'
        },
        timeout: timeout
      });
      incorrectUser = JSON.parse(incorrectUser.body.toString());
      // to check how to retrieve token
      const response = requestAdminQuizName(quiz.quizId, {
        token: incorrectUser.token, name: 'new name'
      });
      expect(response.statusCode).toBe(403);
    });

    test('400: quiz id nonexistent', () => {
      const response = requestAdminQuizName(quiz.quizId + 1, { token: token, name: 'new name' });
      expect(response.statusCode).toBe(403);
    });

    test.each([
      'VIM!!!',
      'VIM*',
      'VIM~',
      'VIM@',
      'VIM#'
    ])('400: invalid characters for new name', (invalidName) => {
      const response = requestAdminQuizName(quiz.quizId, { token: token, name: invalidName });
      expect(response.statusCode).toBe(400);
    });

    test('400: new quiz name is too long >30 characters', () => {
      const response = requestAdminQuizName(quiz.quizId, {
        token: token, name: 'a really really long name that exceeds thirty characters'
      });
      expect(response.statusCode).toBe(400);
    });

    test('400: name is already used by loggin in user for another quiz', () => {
      let quiz2 = request('POST', `${SERVER_URL}/v1/admin/quiz`, {
        json: {
          token,
          name: 'quiz2',
          description: 'random description'
        },
        timeout: timeout
      });
      quiz2 = JSON.parse(quiz2.body.toString());
      const response = requestAdminQuizName(quiz2.quizId, { token: token, name: 'quiz1' });
      expect(response.statusCode).toBe(400);
    });
  });

  describe('successful case', () => {
    test('200: successful name change', () => {
      const response = requestAdminQuizName(quiz.quizId, { token: token, name: 'new name' });
      const resultBody = JSON.parse(response.body.toString());
      expect(response.statusCode).toBe(200);
      expect(resultBody).toEqual({});
    });
  });
});
