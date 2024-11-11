import request from 'sync-request-curl';
import { port, url } from '../config.json';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

function adminAuthRegisterWrapper(
    email: string,
    password: string,
    nameFirst: string,
    nameLast: string,
): string {
    const userTokenRes = request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email,
        password,
        nameFirst,
        nameLast,
      }
    });
    return JSON.parse(userTokenRes.body.toString()).token;
}

function adminQuizCreateWrapper(
  token: string,
  name: string,
  description: string,
) {
  const quizRes = request('POST', SERVER_URL + '/v2/admin/quiz', {
    json: {
      name,
      description,
    },
    headers: { token },
  });
  return JSON.parse(quizRes.body.toString()).quizId;
}

beforeEach(() => {
  request('DELETE', SERVER_URL + '/v1/clear', { timeout: TIMEOUT_MS });
});

describe('DELETE /v2/admin/quiz/:quizId/', () => {
  // ERROR CASE
  test('returns error when trying to delete quiz with invalid token', () => {

    const userToken = adminAuthRegisterWrapper(
      'jake.renzella', 'password123', 'Jake', 'Renzella'
    );

    const quizId = adminQuizCreateWrapper(
      userToken, 'A basic quiz', 'Just a normal quiz'
    );

    const result = request('DELETE', SERVER_URL +`/v2/admin/quiz/${quizId}`,{
      headers: { token: userToken + '1' },
      timeout: TIMEOUT_MS
    });
    expect(JSON.parse(result.body.toString())).toStrictEqual({ error: expect.any(String) });
    expect(result.statusCode).toStrictEqual(401);
  });

  // ERROR CASE
  test('returns error when trying to delete quiz with empty token', () => {

    const userToken = adminAuthRegisterWrapper(
      'jake.renzella', 'password123', 'Jake', 'Renzella'
    );

    const quizId = adminQuizCreateWrapper(
      userToken, 'A basic quiz', 'Just a normal quiz'
    );

    const result = request('DELETE', SERVER_URL +
      `/v2/admin/quiz/${quizId}`, {
      headers: { token: '' },
      timeout: TIMEOUT_MS
    });
    expect(JSON.parse(result.body.toString())).toStrictEqual({ error: expect.any(String) });
    expect(result.statusCode).toStrictEqual(401);
  });

  // ERROR CASE
  test('returns error when trying to delete a quiz that user does not own', () => {

    const userToken1 = adminAuthRegisterWrapper(
      'jake.renzella', 'password123', 'Jake', 'Renzella'
    );

    const quizId = adminQuizCreateWrapper(
      userToken1, 'A basic quiz', 'Just a normal quiz'
    );

    const userToken2 = adminAuthRegisterWrapper(
      'hayden.smith@gmail.com', 'password123', 'Hayden', 'Smith'
    )

    const result = request('DELETE', SERVER_URL +
      `/v2/admin/quiz/${quizId}`, {
      headers: { token: userToken2 },
      timeout: TIMEOUT_MS
    });
    expect(JSON.parse(result.body.toString())).toStrictEqual({ error: expect.any(String) });
    expect(result.statusCode).toStrictEqual(403);
  });

  // ERROR CASE
  test('returns error when trying to delete a quiz that does not exist', () => {
    const userToken = adminAuthRegisterWrapper(
      'jake.renzella', 'password123', 'Jake', 'Renzella'
    );

    const result = request('DELETE', SERVER_URL +
      '/v2/admin/quiz/10', {
      headers: { token: userToken },
      timeout: TIMEOUT_MS
    });
    expect(JSON.parse(result.body.toString())).toStrictEqual({ error: expect.any(String) });
    expect(result.statusCode).toStrictEqual(403);
  });

  // SUCCESS CASE
  test('correct return type for deleting a quiz', () => {

    const userToken = adminAuthRegisterWrapper(
      'jake.renzella', 'password123', 'Jake', 'Renzella'
    );

    const quizId = adminQuizCreateWrapper(
      userToken, 'A basic quiz', 'Just a normal quiz'
    );

    const resultRes = request('DELETE', SERVER_URL + `/2/admin/quiz/${quizId}/`, {
      headers: { token: userToken },
      timeout: TIMEOUT_MS
    });
    const resultBody = JSON.parse(resultRes.body.toString());
    expect(resultRes.statusCode).toStrictEqual(200);
    expect(resultBody).toStrictEqual({});
  });

  // SUCCESS CASE
  test('correct status code when deleting a quiz', () => {

    const userToken = adminAuthRegisterWrapper(
      'jake.renzella', 'password123', 'Jake', 'Renzella'
    );

    const quizId = adminQuizCreateWrapper(
      userToken, 'A basic quiz', 'Just a normal quiz'
    );

    const result = request('DELETE', SERVER_URL + `/v2/admin/quiz/${quizId}/`, {
      qs: { token: userToken },
      timeout: TIMEOUT_MS
    });
    expect(result.statusCode).toStrictEqual(200);
  });

  // SUCCESS CASE
  test('successfully deletes a quiz and moves it to trash', () => {

    const userToken = adminAuthRegisterWrapper(
      'jake.renzella', 'password123', 'Jake', 'Renzella'
    );

    const quizId = adminQuizCreateWrapper(
      userToken, 'A basic quiz', 'Just a normal quiz'
    );

    const result = request('DELETE', SERVER_URL + `/v2/admin/quiz/${quizId}/`, {
      qs: { token: userToken },
      timeout: TIMEOUT_MS
    });

    const quizzes = request('GET', SERVER_URL + '/v2/admin/quiz/list', {
      headers: { token: userToken },
      timeout: TIMEOUT_MS
    });
    expect(JSON.parse(quizzes.body.toString())).toStrictEqual({ quizzes: [] });
    expect(result.statusCode).toStrictEqual(200);
    expect((JSON.parse(result.body.toString()))).toStrictEqual({});
  });
});
