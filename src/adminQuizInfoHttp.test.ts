import request from 'sync-request-curl';
import { port, url } from './config.json';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

beforeEach(() => {
  request('DELETE', SERVER_URL + '/v1/clear', { timeout: TIMEOUT_MS });
});
describe('GET /v1/admin/quiz/:quizId', () => {
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
    const invalidUserToken = userToken + 'a';
    const result = request('GET', SERVER_URL + `/v1/admin/quiz/${quiz.quizId}`, {
      qs: { token: invalidUserToken },
      timeout: TIMEOUT_MS
    });
    expect(JSON.parse(result.body.toString())).toStrictEqual({
      error: expect.any(String),
    });

    expect(result.statusCode).toStrictEqual(401);
  });
  test('returns error when trying to delete quiz with empty user token', () => {
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
    const result = request('GET', SERVER_URL + `/v1/admin/quiz/${quiz.quizId}`, {
      qs: { token: '' },
      timeout: TIMEOUT_MS
    });
    expect(JSON.parse(result.body.toString())).toStrictEqual({
      error: expect.any(String),
    });
    expect(result.statusCode).toStrictEqual(401);
  });
  test('returns error when trying to get info of a quiz that does not exist', () => {
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
    const result = request('GET', SERVER_URL + `/v1/admin/quiz/${quiz.quizId + 1}`, {
      qs: { token: userToken },
      timeout: TIMEOUT_MS
    });
    expect(JSON.parse(result.body.toString())).toStrictEqual({
      error: expect.any(String),
    });
    expect(result.statusCode).toStrictEqual(403);
  });

  test('returns error when trying to get info of a quiz that does not belong to user', () => {
    const userTokenRes1 = request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email: 'jake.renzella@gmail.com',
        password: 'password123',
        nameFirst: 'Jake',
        nameLast: 'Renzella',
      }
    });
    const userToken1 = JSON.parse(userTokenRes1.body.toString()).token;
    const quizRes1 = request('POST', SERVER_URL + '/v1/admin/quiz', {
      json: {
        token: userToken1,
        name: 'Basic quiz',
        description: 'Just a normal quiz',
      }
    });
    const quiz1 = JSON.parse(quizRes1.body.toString());
    const userTokenRes2 = request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email: 'hayden.smith@gmail.com',
        password: 'password123',
        nameFirst: 'Hayden',
        nameLast: 'Smith',
      }
    });
    const userToken2 = JSON.parse(userTokenRes2.body.toString()).token;
    const quizRes2 = request('POST', SERVER_URL + '/v1/admin/quiz', {
      json: {
        token: userToken2,
        name: 'Basic quiz',
        description: 'Just a normal quiz',
      }
    });
    const quiz2 = JSON.parse(quizRes2.body.toString());
    expect(quiz2.quizId).toStrictEqual(expect.any(Number));
    const result = request('GET', SERVER_URL + `/v1/admin/quiz/${quiz1.quizId}`, {
      qs: { token: userToken2 },
      timeout: TIMEOUT_MS
    });
    expect(JSON.parse(result.body.toString())).toStrictEqual({
      error: expect.any(String),
    });
    expect(result.statusCode).toStrictEqual(403);
  });

  test('successfully returns quiz info when a single quiz exists', () => {
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
    const result = request('GET', SERVER_URL + `/v1/admin/quiz/${quiz.quizId}`, {
      qs: { token: userToken },
      timeout: TIMEOUT_MS
    });
    expect(result.statusCode).toStrictEqual(200);
    const parsedRes = JSON.parse(result.body.toString());
    expect(parsedRes).toStrictEqual({

      quizId: quiz.quizId,
      name: 'Basic quiz',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'Just a normal quiz',
      numOfQuestions: 0,
      questions: [],
    });
  });
  test('successfully returns quiz info when a multiple quizzes exists', () => {
    const userTokenRes1 = request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email: 'jake.renzella@gmail.com',
        password: 'password123',
        nameFirst: 'Jake',
        nameLast: 'Renzella',
      }
    });
    const userToken1 = JSON.parse(userTokenRes1.body.toString()).token;
    const quizRes1 = request('POST', SERVER_URL + '/v1/admin/quiz', {
      json: {
        token: userToken1,
        name: 'Basic quiz',
        description: 'Just a normal quiz',
      }
    });
    const quiz1 = JSON.parse(quizRes1.body.toString());
    const userTokenRes2 = request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email: 'hayden.smith@gmail.com',
        password: 'password123',
        nameFirst: 'Hayden',
        nameLast: 'Smith',
      }
    });
    const userToken2 = JSON.parse(userTokenRes2.body.toString()).token;
    const quizRes2 = request('POST', SERVER_URL + '/v1/admin/quiz', {
      json: {
        token: userToken2,
        name: 'Basic quiz',
        description: 'Just a normal quiz',
      }
    });
    const quiz2 = JSON.parse(quizRes2.body.toString());
    expect(quiz2.quizId).toStrictEqual(expect.any(Number));
    const result = request('GET', SERVER_URL + `/v1/admin/quiz/${quiz1.quizId}`, {
      qs: { token: userToken1 },
      timeout: TIMEOUT_MS
    });
    expect(result.statusCode).toStrictEqual(200);
    const parsedRes = JSON.parse(result.body.toString());
    expect(parsedRes).toStrictEqual({
      quizId: quiz1.quizId,
      name: 'Basic quiz',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'Just a normal quiz',
      numOfQuestions: 0,
      questions: [],
    });
  });
});
