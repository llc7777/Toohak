import request from 'sync-request-curl';
import { port, url } from './config.json';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

beforeEach(() => {
  request('DELETE', SERVER_URL + '/v1/clear', { timeout: TIMEOUT_MS });
});

describe('DELETE /v1/admin/quiz/:quizId/', () => {
  // ERROR CASE
  test('returns error when trying to delete quiz with invalid token', () => {
    const userTokenRes = request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email: 'jake.renzella@gmail.com',
        password: 'password123',
        nameFirst: 'Jake',
        nameLast: 'Renzella',
      }
    });

    const userToken = JSON.parse(userTokenRes.body.toString()).token;
    const quizRes = request('POST', SERVER_URL + '/v1/admin/quiz', {
      json: {
        token: userToken,
        name: 'Basic quiz',
        description: 'Just a normal quiz',
      }
    });
    const quiz = JSON.parse(quizRes.body.toString());

    const result = request('DELETE', SERVER_URL +
      `/v1/admin/quiz/${quiz.quizId}`, {
      qs: { token: userToken + '1' },
      timeout: TIMEOUT_MS
    });
    expect(JSON.parse(result.body.toString())).toStrictEqual({ error: expect.any(String) });
    expect(result.statusCode).toStrictEqual(401);
  });

  // ERROR CASE
  test('returns error when trying to delete quiz with empty token', () => {
    const userTokenRes = request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email: 'jake.renzella@gmail.com',
        password: 'password123',
        nameFirst: 'Jake',
        nameLast: 'Renzella',
      }
    });
    const userToken = JSON.parse(userTokenRes.body.toString()).token;

    const quizRes = request('POST', SERVER_URL + '/v1/admin/quiz', {
      json: {
        token: userToken,
        name: 'Basic quiz',
        description: 'Just a normal quiz',
      }
    });
    const quiz = JSON.parse(quizRes.body.toString());

    const result = request('DELETE', SERVER_URL +
      `/v1/admin/quiz/${quiz.quizId}`, {
      qs: { token: '' },
      timeout: TIMEOUT_MS
    });
    expect(JSON.parse(result.body.toString())).toStrictEqual({ error: expect.any(String) });
    expect(result.statusCode).toStrictEqual(401);
  });

  // ERROR CASE
  test('returns error when trying to delete a quiz that user does not own', () => {
    const userTokenRes1 = request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email: 'jake.renzella@gmail.com',
        password: 'password123',
        nameFirst: 'Jake',
        nameLast: 'Renzella',
      }
    });

    const userToken1 = JSON.parse(userTokenRes1.body.toString()).token;
    const quizRes = request('POST', SERVER_URL + '/v1/admin/quiz', {
      json: {
        token: userToken1,
        name: 'Basic quiz',
        description: 'Just a normal quiz',
      }
    });
    const quiz = JSON.parse(quizRes.body.toString());

    const userTokenRes2 = request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email: 'hayden.smith@gmail.com',
        password: 'password123',
        nameFirst: 'Hayden',
        nameLast: 'Smith',
      }
    });
    const userToken2 = JSON.parse(userTokenRes2.body.toString()).token;

    const result = request('DELETE', SERVER_URL +
      `/v1/admin/quiz/${quiz.quizId}`, {
      qs: { token: userToken2 },
      timeout: TIMEOUT_MS
    });
    expect(JSON.parse(result.body.toString())).toStrictEqual({ error: expect.any(String) });
    expect(result.statusCode).toStrictEqual(403);
  });

  // ERROR CASE
  test('returns error when trying to delete a quiz that does not exist', () => {
    const userTokenRes = request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email: 'jake.renzella@gmail.com',
        password: 'password123',
        nameFirst: 'Jake',
        nameLast: 'Renzella',
      }
    });
    const userToken = JSON.parse(userTokenRes.body.toString()).token;

    const result = request('DELETE', SERVER_URL +
      '/v1/admin/quiz/10', {
      qs: { token: userToken },
      timeout: TIMEOUT_MS
    });
    expect(JSON.parse(result.body.toString())).toStrictEqual({ error: expect.any(String) });
    expect(result.statusCode).toStrictEqual(403);
  });

  // SUCCESS CASE
  test('correct return type for deleting a quiz', () => {
    const userTokenRes = request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email: 'jake.renzella@gmail.com',
        password: 'password123',
        nameFirst: 'Jake',
        nameLast: 'Renzella',
      }
    });

    const userToken = JSON.parse(userTokenRes.body.toString()).token;
    const quizRes = request('POST', SERVER_URL + '/v1/admin/quiz', {
      json: {
        token: userToken,
        name: 'Basic quiz',
        description: 'Just a normal quiz',
      }
    });
    const quiz = JSON.parse(quizRes.body.toString());
    const resultRes = request('DELETE', SERVER_URL + `/v1/admin/quiz/${quiz.quizId}/`, {
      qs: { token: userToken },
      timeout: TIMEOUT_MS
    });
    const resultBody = JSON.parse(resultRes.body.toString()).result;
    expect(quiz.quizId).toStrictEqual(expect.any(Number));
    expect(resultRes.statusCode).toStrictEqual(200);
    expect(resultBody).toStrictEqual({});
  });

  // SUCCESS CASE
  test('correct status code when deleting a quiz', () => {
    const userTokenRes = request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email: 'jake.renzella@gmail.com',
        password: 'password123',
        nameFirst: 'Jake',
        nameLast: 'Renzella',
      }
    });
    const userToken = JSON.parse(userTokenRes.body.toString()).token;

    const quizRes = request('POST', SERVER_URL + '/v1/admin/quiz', {
      json: {
        token: userToken,
        name: 'Basic quiz',
        description: 'Just a normal quiz',
      }
    });
    const quiz = JSON.parse(quizRes.body.toString());

    const result = request('DELETE', SERVER_URL + `/v1/admin/quiz/${quiz.quizId}/`, {
      qs: { token: userToken },
      timeout: TIMEOUT_MS
    });
    expect(result.statusCode).toStrictEqual(200);
  });

  // SUCCESS CASE
  test('successfully deletes a quiz and moves it to trash', () => {
    const userTokenRes = request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email: 'jake.renzella@gmail.com',
        password: 'password123',
        nameFirst: 'Jake',
        nameLast: 'Renzella',
      }
    });
    const userToken = JSON.parse(userTokenRes.body.toString()).token;

    const quizRes = request('POST', SERVER_URL + '/v1/admin/quiz', {
      json: {
        token: userToken,
        name: 'Basic quiz',
        description: 'Just a normal quiz',
      }
    });
    const quiz = JSON.parse(quizRes.body.toString());

    const result = request('DELETE', SERVER_URL + `/v1/admin/quiz/${quiz.quizId}/`, {
      qs: { token: userToken },
      timeout: TIMEOUT_MS
    });

    const quizzes = request('GET', SERVER_URL + '/v1/admin/quiz/list', {
      qs: { token: userToken },
      timeout: TIMEOUT_MS
    });
    expect(JSON.parse(quizzes.body.toString())).toStrictEqual({ quizzes: [] });
    expect(result.statusCode).toStrictEqual(200);
    expect(quiz.quizId).toStrictEqual(expect.any(Number));
    expect((JSON.parse(result.body.toString())).result).toStrictEqual({});
  });
});
