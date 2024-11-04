/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

import request from 'sync-request-curl';
import { port, url } from './config.json';
import { createToken } from './helper';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

// Helper function for creating quiz
const quizCreate = (token, name, description) => {
  const res = request('POST', SERVER_URL + '/v1/admin/quiz', {
    json: { token, name, description },
    timeout: TIMEOUT_MS
  });
  return JSON.parse(res.body.toString());
};

// Helper function to register a user
const registerUser = (email, password, nameFirst, nameLast) => {
  const res = request('POST', SERVER_URL + '/v1/admin/auth/register', {
    json: { email, password, nameFirst, nameLast },
    timeout: TIMEOUT_MS
  });
  return JSON.parse(res.body.toString());
};

// Helper function to restore quiz from trash
const restoreQuiz = (quizId, token) => {
  const res = request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}/restore`, {
    json: { token },
    timeout: TIMEOUT_MS
  });
  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body.toString()),
  };
};

// Helper function to get the timeLastEdited timestamp from adminQuizInfo
const quizInfo = (token, quizId) => {
  const result = request('GET', SERVER_URL + `/v1/admin/quiz/${quizId}`, {
    qs: { token },
    timeout: TIMEOUT_MS
  });
  return JSON.parse(result.body.toString()).timeLastEdited;
};

let token = {};
let validQuizId = [];

describe('POST /v1/admin/quiz/:quizId/restore', () => {
  beforeEach(() => {
    request('DELETE', SERVER_URL + '/v1/clear', { timeout: TIMEOUT_MS });

    const userTokenRes = registerUser('jake.renzella@gmail.com', 'Password123', 'Jake', 'Renzella');
    token = userTokenRes.token;

    const quizCreateRes = quizCreate(token, 'Test Quiz', 'Description for test quiz');
    validQuizId = quizCreateRes.quizId;
  });

  describe('Successful test cases', () => {
    test('restore a quiz from trash', () => {
      const timeBefore = quizInfo(token, validQuizId);

      request('DELETE', SERVER_URL + `/v1/admin/quiz/${validQuizId}`, {
        qs: { token },
        timeout: TIMEOUT_MS
      });

      const res = restoreQuiz(validQuizId, token);
      const timeAfter = quizInfo(token, validQuizId);

      expect(timeAfter).toBeGreaterThan(timeBefore);
      expect(res.statusCode).toStrictEqual(200);
      expect(res.body).toStrictEqual({});
    });

    test('restore multiple deleted quizzes from trash', () => {
      // Creating the second quiz
      const secondQuizRes = quizCreate(token, 'quiz 2', 'description 2');
      const quizId = secondQuizRes.quizId;

      const timeBeforeQuiz1 = quizInfo(token, validQuizId);
      const timeBeforeQuiz2 = quizInfo(token, quizId);

      // Delete the first quiz
      request('DELETE', SERVER_URL + `/v1/admin/quiz/${validQuizId}`, {
        qs: { token },
        timeout: TIMEOUT_MS
      });

      // Delete the second quiz
      request('DELETE', SERVER_URL + `/v1/admin/quiz/${quizId}`, {
        qs: { token },
        timeout: TIMEOUT_MS
      });

      // Restore the first and second quizzes
      const res = restoreQuiz(validQuizId, token);
      const res2 = restoreQuiz(quizId, token);

      const timeAfterQuiz1 = quizInfo(token, validQuizId);
      const timeAfterQuiz2 = quizInfo(token, quizId);

      expect(timeAfterQuiz1).toBeGreaterThan(timeBeforeQuiz1);
      expect(res.statusCode).toStrictEqual(200);
      expect(res.body).toStrictEqual({});

      expect(timeAfterQuiz2).toBeGreaterThan(timeBeforeQuiz2);
      expect(res2.statusCode).toStrictEqual(200);
      expect(res2.body).toStrictEqual({});
    });
  });
});

describe('POST /v1/admin/quiz/:quizId/restore', () => {
  beforeEach(() => {
    request('DELETE', SERVER_URL + '/v1/clear', { timeout: TIMEOUT_MS });

    const userTokenRes = registerUser('jake.renzella@gmail.com', 'Password123', 'Jake', 'Renzella');
    token = userTokenRes.token;

    const quizCreateRes = quizCreate(token, 'Test Quiz', 'Description for test quiz');
    validQuizId = quizCreateRes.quizId;

    request('DELETE', SERVER_URL + `/v1/admin/quiz/${validQuizId}`, {
      qs: { token },
      timeout: TIMEOUT_MS
    });
  });

  describe('Error test cases', () => {
    test('returns error for invalid token', () => {
      const invalidToken = { sessionId: 1, authUserId: 1531 };
      const encodedInvalid = createToken(invalidToken);
      const res = restoreQuiz(validQuizId, encodedInvalid);

      expect(res.statusCode).toStrictEqual(401);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
    });

    test('returns error for empty token', () => {
      const emptyToken = '';
      const res = restoreQuiz(validQuizId, emptyToken);

      expect(res.statusCode).toStrictEqual(401);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
    });

    test('quiz IDs does not exist in trash', () => {
      const invalidQuizId = validQuizId + '1';
      const res = restoreQuiz(invalidQuizId, token);

      expect(res.statusCode).toStrictEqual(403);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
    });

    test('quiz name is already used by another active quiz', () => {
      // Create second quiz
      quizCreate(token, 'Test Quiz', 'Description for the second quiz');
      const res = restoreQuiz(validQuizId, token);

      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
    });

    test('user is not the owner of this quiz', () => {
      const quizRes = quizCreate(token, 'quiz 1', 'description 1');
      const quizId = quizRes.quizId;

      const userTokenRes2 = registerUser('different2@gmail.com', 'passss123', 'May', 'Lee');
      const userToken2 = userTokenRes2.token;

      request('DELETE', SERVER_URL + `/v1/admin/quiz/${quizId}`, {
        qs: { token },
        timeout: TIMEOUT_MS
      });
      const res = restoreQuiz(quizId, userToken2);

      expect(res.statusCode).toStrictEqual(403);
      expect(res.body).toStrictEqual({ error: expect.any(String) });
    });
  });
});
