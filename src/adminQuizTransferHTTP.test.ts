/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

import request from 'sync-request-curl';
import { port, url } from './config.json';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

let userToken;
let quizId;
let emailToTransferTo;

beforeEach(() => {
  request('DELETE', SERVER_URL + '/v1/clear', { timeout: TIMEOUT_MS });

  const userTokenRes = request('POST', SERVER_URL + '/v1/admin/auth/register', {
    json: {
      email: 'jake.renzella@gmail.com',
      password: 'password123',
      nameFirst: 'Jake',
      nameLast: 'Renzella',
    }
  });
  userToken = JSON.parse(userTokenRes.body.toString()).token;

  const quizRes = request('POST', SERVER_URL + '/v1/admin/quiz', {
    json: {
      token: userToken,
      name: 'Basic quiz',
      description: 'Just a normal quiz',
    }
  });
  quizId = JSON.parse(quizRes.body.toString()).quizId;

  // Create a second user to transfer the quizzes to
  const userTokenRes2 = request('POST', SERVER_URL + '/v1/admin/auth/register', {
    json: {
      email: 'hayden.smith@gmail.com',
      password: 'password123',
      nameFirst: 'Hayden',
      nameLast: 'Smith',
    }
  });
  userToken2 = JSON.parse(userTokenRes2.body.toString()).token;
  emailToTransferTo = 'hayden.smith@gmail.com'
});

describe('POST /v1/admin/quiz/:quizid/transfer ERROR cases', () => {

  test('returns an error when trying to transfer a' + 
    'to an email that does not correspond to any user', () => {

    const nonExistentEmail = 'idontexist@gmail.com';

    const result = request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}`, {
      json: {
        token: userToken,
        userEmail: nonExistentEmail,
      },
      timeout: TIMEOUT_MS
    })
    expect(JSON.parse(result.body.toString())).toStrictEqual({
      error: 'Unknown Type: string - error',
    })
    expect(result.statusCode).toStrictEqual(400);
  })

  test('returns an error when trying to transer a quiz to the currently logged in user', () => {
    const result = request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}`, {
      json: {
        token: userToken,
        userEmail: 'jake.renzella@gmail.com',
      },
      timeout: TIMEOUT_MS
    })
    expect(JSON.parse(result.body.toString())).toStrictEqual({
      error: 'Unknown Type: string - error',
    })
    expect(result.statusCode).toStrictEqual(400);
  })

  test('reutrns an error when trying to transfer quiz to another user who already' +
    ' owns a quiz with the given quiz name', () => {

    const quizRes2 = request('POST', SERVER_URL + '/v1/admin/quiz', {
      json: {
        token: userToken2,
        name: 'Basic quiz',
        description: 'An even more normal quiz',
      }
    });
    quizId2 = JSON.parse(quizRes.body.toString()).quizId;

    const result = request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}`, {
      json: {
        token: userToken2,
        userEmail: emailToTransferTo,
      },
      timeout: TIMEOUT_MS
    })
    expect(JSON.parse(result.body.toString())).toStrictEqual({
      error: 'Unknown Type: string - error',
    })
    expect(result.statusCode).toStrictEqual(400);
  });

  test('returns error when trying to transfer a quiz with invalid token', () => {
    const invalidUserToken = userToken + 'a';
    const result = request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}`, {
      json: { 
        token: invalidUserToken,
        userEmail:  emailToTransferTo
      },
      timeout: TIMEOUT_MS
    });

    expect(JSON.parse(result.body.toString())).toStrictEqual({
      error: 'Unknown Type: string - error'
    });
    expect(result.statusCode).toStrictEqual(401);
  });

  test('returns error when trying to transfer a quiz with empty user token', () => {
    const result = request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}`, {
      json: { 
        token: '',
        userEmail:  emailToTransferTo
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
    const result = request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}`, {
      json: { 
        token: userToken,
        userEmail:  emailToTransferTo
      },
      timeout: TIMEOUT_MS
    });

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
    const result = request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}`, {
      json: { 
        token: userToken,
        userEmail:  emailToTransferTo
      },
      timeout: TIMEOUT_MS
    });

    expect(JSON.parse(result.body.toString())).toStrictEqual({ });
    expect(result.statusCode).toStrictEqual(200);

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

    const quizRes2 = request('POST', SERVER_URL + '/v1/admin/quiz', {
      json: {
        token: userToken,
        name: 'A difficult quiz',
        description: 'A very challenging quiz',
      }
    });
    quizId2 = JSON.parse(quizRes.body.toString()).quizId;

    const result2 = request('POST', SERVER_URL + `/v1/admin/quiz/${quizId2}`, {
      json: { 
        token: userToken,
        userEmail:  emailToTransferTo
      },
      timeout: TIMEOUT_MS
    });

    expect(JSON.parse(result.body.toString())).toStrictEqual({ });
    expect(result.statusCode).toStrictEqual(200);

    quizListRe = request('GET', SERVER_URL + '/v1/admin/quiz/list', {
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
  })
})