/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

import request from 'sync-request-curl';
import { port, url } from './config.json';
import { createToken, decodeToken } from './helper';
import { log } from 'console';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

// Helper function for emptyTrash
const emptyTrash = (token, quizIds) => {
  return request('DELETE', `${SERVER_URL}/v1/admin/quiz/trash/empty`, { 
    qs: { token, quizIds: JSON.stringify(quizIds) },
    timeout: TIMEOUT_MS 
  });
};

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

let token = {};
let quizzesInTrash = [];
let validQuizId = [];

beforeEach(() => {
  request('DELETE', SERVER_URL + '/v1/clear', { timeout: TIMEOUT_MS });

  const userTokenRes = registerUser('jake.renzella@gmail.com', 'Password123', 'Jake', 'Renzella');
  token = userTokenRes.token;

  const quizRes = request('GET', SERVER_URL + '/v1/admin/quiz/trash', {
    qs: { token },
    timeout: TIMEOUT_MS
  });
  quizzesInTrash = JSON.parse(quizRes.body.toString());

  const quizCreateRes = quizCreate(token, 'Test Quiz', 'Description for test quiz');
  validQuizId = quizCreateRes.quizId;
});

describe('DELETE /v1/admin/quiz/trash/empty', () => {
  describe('successfule test cases', () => {
    // test('empty the trash with different quiz IDs', () => {
    //   const res = emptyTrash(token, [1, 2, 3, 4]);

    //   expect(res.statusCode).toStrictEqual(200);
    //   const body = JSON.parse(res.body.toString());
    //   expect(body).toStrictEqual({});
    // });
    
  //   test('empty the trash with one quiz ID', () => {
  //     const res = emptyTrash(token, [1]);

  //     expect(res.statusCode).toStrictEqual(200);
  //     const body = JSON.parse(res.body.toString());
  //     expect(body).toStrictEqual({});
  //   });

  //   test('empty the trash with no quizzes in the trash', () => {
  //     const res = emptyTrash(token, []);

  //     expect(res.statusCode).toStrictEqual(200);
  //     const body = JSON.parse(res.body.toString());
  //     expect(body).toStrictEqual({});
  //   });

  //   test('empty the trash with many quizzes', () => {
  //     // Create an array of size 100 (from 1 to 100)
  //     const largeArray = Array.from({ length: 100 }, ((i) => i + 1));
  //     const res = emptyTrash(token, largeArray);

  //     expect(res.statusCode).toStrictEqual(200);
  //     const body = JSON.parse(res.body.toString());
  //     expect(body).toStrictEqual({});
  //   });
  
  //   test('empty the trash multiple times', () => {
  //     const res1 = emptyTrash(token, [1, 2]);
  //     const res2 = emptyTrash(token, [3, 4, 5, 6]);

  //     expect(res1.statusCode).toStrictEqual(200);
  //     expect(res2.statusCode).toStrictEqual(200);
  
  //     const body1 = JSON.parse(res.body.toString());
  //     const body2 = JSON.parse(res.body.toString());

  //     expect(body1).toStrictEqual({});
  //     expect(body2).toStrictEqual({});
  //   });
  });

  describe('error test cases', () => {
    test('returns error for invalid token', () => {
      const invalidToken = { sessionId: 1, authUserId: 1531 };
      const encodedInvalid = createToken(invalidToken);
      const res = emptyTrash(encodedInvalid, [1, 2]);

      expect(res.statusCode).toStrictEqual(401);
      const body = JSON.parse(res.body.toString());
      expect(body).toStrictEqual({ error: expect.any(String) });
    });

    test('returns error for empty token', () => {
      const emptyToken = '';
      const res = emptyTrash(emptyToken, [1, 2]);

      expect(res.statusCode).toStrictEqual(401);
      const body = JSON.parse(res.body.toString());
      expect(body).toStrictEqual({ error: expect.any(String) });
    });
    
    test('quizIds with invalid JSON format', () => {
      const decodedToken = decodeURIComponent(token);
      const invalidQuizId = '[invalid, blala]';
      const res = emptyTrash(decodedToken, invalidQuizId);

      expect(res.statusCode).toStrictEqual(400);
      const body = JSON.parse(res.body.toString());
      expect(body).toStrictEqual({ error: expect.any(String) });
    });

    test('one or more quiz IDs are not in the trash', () => {
      const decodedToken = decodeURIComponent(token);
      const res = emptyTrash(decodedToken, [100, 200, 300, 400]);
      
      expect(res.statusCode).toStrictEqual(400);
      const body = JSON.parse(res.body.toString());
      expect(body).toStrictEqual({ error: expect.any(String) });
    });
    test('invalid quiz ID type', () => {
      const res = emptyTrash(token, [null]);
  
      expect(res.statusCode).toStrictEqual(400);
      const body = JSON.parse(res.body.toString());
      expect(body).toStrictEqual({ error: expect.any(String) });
    });
    
    test('quiz IDs not provided', () => {
      const res = emptyTrash(token, []);
  
      expect(res.statusCode).toStrictEqual(400);
      const body = JSON.parse(res.body.toString());
      expect(body).toStrictEqual({ error: expect.any(String) });
    });

    test('quiz IDs belong to a different user', () => {
      const quizRes = quizCreate(token, 'quiz 1', 'description 1');
      const quizId = quizRes.quizId;

      const userTokenRes2 = registerUser('different2@gmail.com', 'passss123', 'May', 'Lee');
      const userToken2 = userTokenRes2.token;

      const res = emptyTrash(userToken2, [quizId]);

      expect(res.statusCode).toStrictEqual(403);
      const body = JSON.parse(res.body.toString());
      expect(body).toStrictEqual({ error: expect.any(String) });
    });

    test('returns error for a quiz ID that does not exist', () => {
      const nonExistentQuizId = [validQuizId + 1000];
      console.log('nonExistentQuizId:', nonExistentQuizId);

      const res = emptyTrash(token, nonExistentQuizId);
      console.log(res);
      
      expect(res.statusCode).toStrictEqual(403);
      const body = JSON.parse(res.body.toString());
      expect(body).toStrictEqual({ error: expect.any(String) });
      
    });
  });
});