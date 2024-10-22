/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

import request from 'sync-request-curl';
import { port, url } from './config.json';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

let userToken;
let userToken2;
let quizId;
let emailToTransferTo;

beforeEach(() => {
  request('DELETE', SERVER_URL + '/v1/clear', { timeout: TIMEOUT_MS });

  // Create a user. This user is Jake Renzella
  const userTokenRes = request('POST', SERVER_URL + '/v1/admin/auth/register', {
    json: {
      email: 'jake.renzella@gmail.com',
      password: 'password123',
      nameFirst: 'Jake',
      nameLast: 'Renzella',
    }
  });
  userToken = JSON.parse(userTokenRes.body.toString()).token;

  // Create a quiz. This quiz is called 'Basic quiz'
  const quizRes = request('POST', SERVER_URL + '/v1/admin/quiz', {
    json: {
      token: userToken,
      name: 'Basic quiz',
      description: 'Just a normal quiz',
    }
  });
  quizId = JSON.parse(quizRes.body.toString()).quizId;

  // Create a second user to transfer the quizzes to. This user is Hayden Smith
  const userTokenRes2 = request('POST', SERVER_URL + '/v1/admin/auth/register', {
    json: {
      email: 'hayden.smith@gmail.com',
      password: 'password123',
      nameFirst: 'Hayden',
      nameLast: 'Smith',
    }
  });
  userToken2 = JSON.parse(userTokenRes2.body.toString()).token;
  emailToTransferTo = 'hayden.smith@gmail.com';
});

describe('POST /v1/admin/quiz/:quizid/transfer ERROR cases', () => {
  test('returns an error when trying to transfer a quiz ' +
    'to an email that does not correspond to any user', () => {
    const nonExistentEmail = 'idontexist@gmail.com';

    const result = request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}/transfer`, {
      json: {
        token: userToken,
        userEmail: nonExistentEmail,
      },
      timeout: TIMEOUT_MS
    });
    expect(JSON.parse(result.body.toString())).toStrictEqual({
      error: 'Unknown Type: string - error',
    });
    expect(result.statusCode).toStrictEqual(400);
  });

  test('returns an error when trying to transfer a quiz when the logged in user' +
    ' does not own the quiz', () => {
    // Create a user Andrew Taylor. Note, that Andrew owns NO quizzes
    const userTokenRes3 = request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email: 'andrew.taylor@gmail.com',
        password: 'password123',
        nameFirst: 'Andrew',
        nameLast: 'Taylor',
      }
    });
    userToken = JSON.parse(userTokenRes3.body.toString()).token;

    const result = request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}/transfer`, {
      json: {
        token: userToken2,
        userEmail: 'andrew.taylor@gmail.com',
      },
      timeout: TIMEOUT_MS
    });
    expect(JSON.parse(result.body.toString())).toStrictEqual({
      error: 'Unknown Type: string - error',
    });
    expect(result.statusCode).toStrictEqual(403);
  }
  );

  test('returns an error when trying to transfer a quiz that does not exist', () => {
    const result = request('POST', SERVER_URL + `/v1/admin/quiz/${quizId + 1}/transfer`, {
      json: {
        token: userToken,
        userEmail: 'hayden.smith@gmail.com',
      },
      timeout: TIMEOUT_MS
    });
    console.log(result);
    expect(JSON.parse(result.body.toString())).toStrictEqual({
      error: 'Unknown Type: string - error',
    });
    expect(result.statusCode).toStrictEqual(403);
  }
  );

  test('returns an error when trying to transer a quiz to the currently logged in user', () => {
    const result = request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}/transfer`, {
      json: {
        token: userToken,
        userEmail: 'jake.renzella@gmail.com',
      },
      timeout: TIMEOUT_MS
    });
    expect(JSON.parse(result.body.toString())).toStrictEqual({
      error: 'Unknown Type: string - error',
    });
    expect(result.statusCode).toStrictEqual(400);
  });

  test('reutrns an error when trying to transfer quiz to another user who already' +
    ' owns a quiz with the given quiz name', () => {
    // Create a quiz that is owned by Hayden Smith
    const quizRes2 = request('POST', SERVER_URL + '/v1/admin/quiz', {
      json: {
        token: userToken2,
        name: 'Basic quiz',
        description: 'An even more normal quiz',
      }
    });
    const quizId2 = JSON.parse(quizRes2.body.toString()).quizId;
    expect(quizId2).toStrictEqual(expect.any(Number));

    const result = request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}/transfer`, {
      json: {
        token: userToken,
        userEmail: emailToTransferTo,
      },
      timeout: TIMEOUT_MS
    });
    expect(JSON.parse(result.body.toString())).toStrictEqual({
      error: 'Unknown Type: string - error',
    });
    expect(result.statusCode).toStrictEqual(400);
  });

  test('returns error when trying to transfer a quiz with invalid token', () => {
    const invalidUserToken = userToken + 'a';
    const result = request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}/transfer`, {
      json: {
        token: invalidUserToken,
        userEmail: emailToTransferTo
      },
      timeout: TIMEOUT_MS
    });

    expect(JSON.parse(result.body.toString())).toStrictEqual({
      error: 'Unknown Type: string - error'
    });
    expect(result.statusCode).toStrictEqual(401);
  });

  test('returns error when trying to transfer a quiz with empty user token', () => {
    const result = request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}/transfer`, {
      json: {
        token: '',
        userEmail: emailToTransferTo
      },
      timeout: TIMEOUT_MS
    });

    expect(JSON.parse(result.body.toString())).toStrictEqual({
      error: 'Unknown Type: string - error'
    });
    expect(result.statusCode).toStrictEqual(401);
  });
});

describe('POST /v1/admin/quiz/:quizid/transfer SUCCESS cases', () => {
  test('successfully transfers a single quiz to a user', () => {
    const result = request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}/transfer`, {
      json: {
        token: userToken,
        userEmail: emailToTransferTo
      },
      timeout: TIMEOUT_MS
    });
    console.log(result);

    expect(JSON.parse(result.body.toString())).toStrictEqual({ });
    expect(result.statusCode).toStrictEqual(200);

    const quizListRes = request('GET', SERVER_URL + '/v1/admin/quiz/list', {
      json: {
        token: userToken2
      },
      timeout: TIMEOUT_MS
    });

    expect(JSON.parse(quizListRes.body.toString())).toStrictEqual({
      quizzes: [
        {
          quizId: expect.any(Number),
          name: 'Basic quiz'
        }
      ]
    });
  });
  test('successfully transfers a multiples quizzes to a user', () => {
    const result = request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}/transfer`, {
      json: {
        token: userToken,
        userEmail: emailToTransferTo
      },
      timeout: TIMEOUT_MS
    });

    expect(JSON.parse(result.body.toString())).toStrictEqual({ });
    expect(result.statusCode).toStrictEqual(200);

    // List the quizzes that Hayden Smith owns after transferring to him
    let quizListRes = request('GET', SERVER_URL + '/v1/admin/quiz/list', {
      json: {
        token: userToken2
      },
      timeout: TIMEOUT_MS
    });

    expect(JSON.parse(quizListRes.body.toString())).toStrictEqual({
      quizzes: [
        {
          quizId: expect.any(Number),
          name: 'Basic quiz'
        }
      ]
    });

    // Create a second quiz
    const quizRes2 = request('POST', SERVER_URL + '/v1/admin/quiz', {
      json: {
        token: userToken,
        name: 'A difficult quiz',
        description: 'A very challenging quiz',
      }
    });
    const quizId2 = JSON.parse(quizRes2.body.toString()).quizId;

    // Transfer the second quiz to Hayden Smith
    const result2 = request('POST', SERVER_URL + `/v1/admin/quiz/${quizId2}/transfer`, {
      json: {
        token: userToken,
        userEmail: emailToTransferTo,
      },
      timeout: TIMEOUT_MS
    });

    expect(result2.statusCode).toStrictEqual(200);
    expect(JSON.parse(result2.body.toString())).toStrictEqual({ });

    expect(JSON.parse(result.body.toString())).toStrictEqual({ });
    expect(result.statusCode).toStrictEqual(200);

    // List all the quizzes that Hayden Smith now owns
    quizListRes = request('GET', SERVER_URL + '/v1/admin/quiz/list', {
      json: {
        token: userToken2
      },
      timeout: TIMEOUT_MS
    });

    expect(JSON.parse(quizListRes.body.toString())).toStrictEqual({
      quizzes: [
        {
          quizId: expect.any(Number),
          name: 'Basic quiz'
        },
        {
          quizId: expect.any(Number),
          name: 'A difficult quiz',
        }
      ]
    });
  });
});
