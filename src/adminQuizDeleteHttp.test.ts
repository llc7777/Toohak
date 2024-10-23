/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

import request from 'sync-request-curl';
import { port, url } from './config.json';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

let userToken;
let quizId;
let questionId;

beforeEach(() => {
  request('DELETE', SERVER_URL + '/v1/clear', { timeout: TIMEOUT_MS });

  const userTokenRes = request('POST', SERVER_URL + '/v1/admin/auth/register', {
    json: {
      email: 'jake.renzella@gmail.com',
      password: 'password123',
      nameFirst: 'Jake',
      nameLast: 'Renzella',
    },
  });
  userToken = JSON.parse(userTokenRes.body.toString()).token;

  const quizRes = request('POST', SERVER_URL + '/v1/admin/quiz', {
    json: {
      token: userToken,
      name: 'Basic quiz',
      description: 'Just a normal quiz',
    },
  });
  quizId = JSON.parse(quizRes.body.toString()).quizId;

  const questionRes = request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}/question`, {
    json: {
      token: userToken,
      question: 's is 2+2?',
      type: 'single',
      options: ['1', '2', '3', '4'],
      correctAnswer: '4',
    },
  });
  questionId = JSON.parse(questionRes.body.toString()).questionId;
});

describe('DELETE /v1/admin/quiz/:quizid/question/:questionid ERROR cases', () => {
  test('returns an error when trying to delete a question with an invalid question ID', () => {
    const invalidQuestionId = questionId + 'invalid';

    const result = request('DELETE', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${invalidQuestionId}`, {
      json: {
        token: userToken,
      },
      timeout: TIMEOUT_MS,
    });

    expect(result.statusCode).toStrictEqual(400);
    expect(JSON.parse(result.body.toString()).error).toBeDefined();
  });

  test('returns an error when trying to delete a question with an invalid token', () => {
    const invalidToken = userToken + 'a';

    const result = request('DELETE', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, {
      json: {
        token: invalidToken,
      },
      timeout: TIMEOUT_MS,
    });

    expect(result.statusCode).toStrictEqual(401);
    expect(JSON.parse(result.body.toString()).error).toBeDefined();
  });

  test('returns an error when trying to delete a question with an empty token', () => {
    const result = request('DELETE', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, {
      json: {
        token: '',
      },
      timeout: TIMEOUT_MS,
    });

    expect(result.statusCode).toStrictEqual(401);
    expect(JSON.parse(result.body.toString()).error).toBeDefined();
  });

  test('returns an error when trying to delete a question from a quiz the user does not own', () => {
    const userTokenRes2 = request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email: 'jason.chandr@gmail.com',
        password: 'password123',
        nameFirst: 'Jason',
        nameLast: 'Chandr',
      },
    });
    const userToken2 = JSON.parse(userTokenRes2.body.toString()).token;

    const result = request('DELETE', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, {
      json: {
        token: userToken2,
      },
      timeout: TIMEOUT_MS,
    });

    expect(result.statusCode).toStrictEqual(403);
    expect(JSON.parse(result.body.toString()).error).toBeDefined();
  });
});

describe('DELETE /v1/admin/quiz/:quizid/question/:questionid SUCCESS cases', () => {
  test('successfully deletes a question from a quiz', () => {
    const result = request('DELETE', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, {
      json: {
        token: userToken,
      },
      timeout: TIMEOUT_MS,
    });

    expect(result.statusCode).toStrictEqual(200);
    expect(result.body.toString()).toStrictEqual('{}');

    const quizDetailsRes = request('GET', SERVER_URL + `/v1/admin/quiz/${quizId}`, {
      qs: {
        token: userToken,
      },
      timeout: TIMEOUT_MS,
    });

    const quizDetails = JSON.parse(quizDetailsRes.body.toString());
    expect(quizDetails.questions).not.toContainEqual(
      expect.objectContaining({ questionId: questionId })
    );
  });
});
