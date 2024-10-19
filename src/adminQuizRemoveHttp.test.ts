import request from 'sync-request-curl';
import { port, url } from './config.json';
import { getData } from './dataStore';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

beforeEach(() => {
  request('DELETE', SERVER_URL + '/v1/clear', { timeout: TIMEOUT_MS });
});

describe('DELETE /v1/admin/quiz/:quizId/', () => {
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
    const quizRes = request('POST', SERVER_URL + '/v1/admin/quiz' + {
      json: {
        token: userToken,
        name: 'Basic quiz',
        description: 'Just a normal quiz',
      }
    });
    const quiz = JSON.parse(quizRes.body.toString());
    const result = request('DELETE', SERVER_URL +
        `/v1/admin/quiz/${quiz.quizId}/${userToken + '1'}`);
    expect(result).toStrictEqual({ error: expect.any(String) });
    expect(result.statusCode).toStrictEqual(401);
  });

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
    const quizRes = request('POST', SERVER_URL + '/v1/admin/quiz' + {
      json: {
        token: userToken,
        name: 'Basic quiz',
        description: 'Just a normal quiz',
      }
    });
    const quiz = JSON.parse(quizRes.body.toString());
    const result = request('DELETE', SERVER_URL + `/v1/admin/quiz/${quiz.quizId}/`, {qs: {
      token: userToken},
      timeout: TIMEOUT_MS
    });
    expect(result).toStrictEqual({ error: expect.any(String) });
    expect(result.statusCode).toStrictEqual(401);
  });
  test('returns error when trying to delete a quiz that user does not own', () => {
    const userTokenRes1 = request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email: 'jake.renzella@gmail.com',
        password: 'password123',
        nameFirst: 'Jake',
        nameLast: 'Renzella',
      }
    });
    const userToken1 = JSON.parse(userTokenRes1.body.toString());
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
    const userToken2 = JSON.parse(userTokenRes1.body.toString());

    const result = request('DELETE', SERVER_URL + `/v1/admin/quiz/${quiz.quizId}/`, {qs: {
      token: userToken2},
      timeout: TIMEOUT_MS
    });    expect(result).toStrictEqual({ error: expect.any(String) });
    expect(result.statusCode).toStrictEqual(403);
  });

  test('returns error when trying to delete a quiz that does not exist', () => {
    const userToken = request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email: 'jake.renzella@gmail.com',
        password: 'password123',
        nameFirst: 'Jake',
        nameLast: 'Renzella',
      }
    });
    const result = request('DELETE', SERVER_URL + `/v1/admin/quiz/5/${userToken}`);
    expect(result).toStrictEqual({ error: expect.any(String) });
  });

  test('correct return type for deleting a quiz', () => {
    const userTokenRes = request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email: 'jake.renzella@gmail.com',
        password: 'password123',
        nameFirst: 'Jake',
        nameLast: 'Renzella',
      }
    });
    const userToken = JSON.parse(userTokenRes.body.toString());
    const quizRes = request('POST', SERVER_URL + '/v1/admin/quiz' + {
      json: {
        token: userToken,
        name: 'Basic quiz',
        description: 'Just a normal quiz',
      }
    });
    const quiz = JSON.parse(quizRes.body.toString());
    // Delete quiz and move to trash
    const result = request('DELETE', SERVER_URL + `/v1/admin/quiz/${quiz.quizId}/`, {qs: {
      token: userToken},
      timeout: TIMEOUT_MS
    });
    expect(quiz.quizId).toStrictEqual(expect.any(Number));
    expect(result).toStrictEqual({});
  });

  test('correct status code when deleting a quiz', () => {
    const userTokenRes = request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email: 'jake.renzella@gmail.com',
        password: 'password123',
        nameFirst: 'Jake',
        nameLast: 'Renzella',
      }
    });
    const userToken = JSON.parse(userTokenRes.body.toString());
    const quizRes = request('POST', SERVER_URL + '/v1/admin/quiz' + {
      json: {
        token: userToken,
        name: 'Basic quiz',
        description: 'Just a normal quiz',
      }
    });
    const quiz = JSON.parse(quizRes.body.toString());
    const result = request('DELETE', SERVER_URL + `/v1/admin/quiz/${quiz.quizId}/`, {qs: {
      token: userToken},
      timeout: TIMEOUT_MS
    });    expect(result.statusCode).toStrictEqual(200);
  });

  test('successfully deletes a quiz and moves it to trash', () => {
    const userTokenRes = request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email: 'jake.renzella@gmail.com',
        password: 'password123',
        nameFirst: 'Jake',
        nameLast: 'Renzella',
      }
    });
    const userToken = JSON.parse(userTokenRes.body.toString());
    const quizRes = request('POST', SERVER_URL + '/v1/admin/quiz', {
      json: {
        token: userToken,
        name: 'Basic quiz',
        description: 'Just a normal quiz',
      }
    });
    const quiz = JSON.parse(quizRes.body.toString());
    const data = getData();

    expect(data.quizzes.length).toStrictEqual(1);
    expect(data.users.length).toStrictEqual(1);
    expect(data.trash.length).toStrictEqual(0);

    // Delete quiz and move to trash
    const result = request('DELETE', SERVER_URL + `/v1/admin/quiz/${quiz.quizId}/`, {qs: {
      token: userToken},
      timeout: TIMEOUT_MS
    });    expect(result.statusCode).toStrictEqual(200);
    expect(quiz.quizId).toStrictEqual(expect.any(Number));
    expect(result).toStrictEqual({});
    expect(data.quizzes.length).toStrictEqual(0);
    expect(data.trash.length).toStrictEqual(1);
  });
});
