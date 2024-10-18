/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import request from 'sync-request-curl';
import config from './config.json';
import { adminAuthRegister } from './auth';
import { adminQuizCreate } from './quiz';
import { decodeToken } from './helper';

const port = config.port;
const url = config.url;
const SERVER_URL = `${url}:${port}`;
const timeout = 5 * 1000;

const requestAdminQuizName = (quizId: number, body: { token: string, name: string }) => {
  return request('PUT', `${SERVER_URL}/v1/admin/quiz/${quizId}/name`, {
    json: { name: body.name },
  });
};

describe('HTTP tests for /v1/admin/quiz/{quizId}/name', () => {
  
  let user;
  let quiz;

  beforeEach(() => {
    request('DELETE', SERVER_URL + 'v1/clear', { timeout: timeout });
    
    user = decodeToken(adminAuthRegister('jake.renzella@gmail.com', 'password1', 'Jake', 'Renzella'));
    quiz = adminQuizCreate(user.authUserId, 'VIM', 'A basic quiz on VIM commands');

  });

  describe('error cases', () => {
    test('401: empty token', () => {
      const response = requestAdminQuizName(quiz.quizId, { token: '', name: 'new name' });
      expect(response.statusCode).toBe(401);
    });

    test('401: invalid token', () => {
      const response = requestAdminQuizName(quiz.quizId, { token: 'notaToken', name: 'new name' });
      expect(response.statusCode).toBe(401);
    });

    test('403: valid token with incorrect owner', () => {
      const incorrectUser = adminAuthRegister('incorrectuser@gmail.com', 'password1', 'Incorrect', 'User')
      // to check how to retrieve token
      const response = requestAdminQuizName(quiz.quizId, { token: incorrectUser.token, name: 'new name' });
      expect(response.statusCode).toBe(403);
    });

    test('400: quiz id nonexistent', () => {
      const response = requestAdminQuizName(quiz.quizId, { token: user.token, name: 'new name' });
      expect(response.statusCode).toBe(400);
    });

    test.each([
      'VIM!!!', 
      'VIM*',
      'VIM~',
      'VIM@',
      'VIM#'
    ]) ('400: invalid characters for new name', (invalidName) => {
      const response = requestAdminQuizName(quiz.quizId, { token: user.token, name: invalidName });
      expect(response.statusCode).toBe(400);
    });

    test('400: new quiz name is too long >30 characters', ()=> {
      const response = requestAdminQuizName(quiz.quizId, { token: user.token, name: 'a really really long name that exceeds thirty characters' });
      expect(response.statusCode).toBe(400);
    });

    test('400: name is already used by loggin in user for another quiz', ()=> {
      const anotherQuiz = adminQuizCreate(user.authUserId, 'new quiz', 'A new quiz');
      const response = requestAdminQuizName(quiz.quizId, { token: user.token, name: 'new name' });
      expect(response.statusCode).toBe(400);
    });
  });

  describe('successful case', () => {
    test('200: successful name change', ()=> {
      const response = requestAdminQuizName(quiz.quizId, { token: user.token, name: 'new name' });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({});
    });
  });
});




