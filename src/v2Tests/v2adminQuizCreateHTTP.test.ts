import request from 'sync-request-curl';
import { port, url } from '../config.json';
import { createToken } from '../helper';
import { ErrorResponse, Token } from '../interfaces';

const SERVER_URL: string = `${url}:${port}`;
const TIMEOUT_MS: number = 5 * 1000;

// Error object
const ERROR: ErrorResponse = { error: expect.any(String) };

// user token
let token: string = '';

// clear the database before each test and register a user
beforeEach(() => {
  request('DELETE', SERVER_URL + '/v1/clear', { timeout: TIMEOUT_MS });

  const res = request('POST', SERVER_URL + '/v1/admin/auth/register', {
    json: {
      email: 'Aerospace@gmail.com',
      password: 'Aeropass1',
      nameFirst: 'Leo',
      nameLast: 'Kim'
    },
    timeout: TIMEOUT_MS
  });

  token = JSON.parse(res.body.toString()).token;
});

describe('Test for POST /v2/admin/quiz', () => {
  // Test for successful cases
  test('has the correct return and has it created the quiz', () => {
    const res = request('POST', SERVER_URL + '/v2/admin/quiz', {
      headers: { token }, json: { name: 'quiz1', description: 'description' }, timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toStrictEqual(200);
    expect(JSON.parse(res.body.toString())).toStrictEqual({ quizId: expect.any(Number) });
  });

  test('has created successfully with empty description', () => {
    const res = request('POST', SERVER_URL + '/v2/admin/quiz', {
      headers: { token }, json: { name: 'quiz1', description: '' }, timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toStrictEqual(200);
    expect(JSON.parse(res.body.toString())).toStrictEqual({ quizId: expect.any(Number) });
  });

  test('has created successfully several quizzes', () => {
    const res = request('POST', SERVER_URL + '/v2/admin/quiz', {
      headers: { token }, json: { name: 'quiz1', description: 'description1' }, timeout: TIMEOUT_MS
    });

    const res2 = request('POST', SERVER_URL + '/v2/admin/quiz', {
      headers: { token }, json: { name: 'quiz2', description: '' }, timeout: TIMEOUT_MS
    });

    const res3 = request('POST', SERVER_URL + '/v2/admin/quiz', {
      headers: { token }, json: { name: 'quiz3', description: 'description3' }, timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toStrictEqual(200);
    expect(JSON.parse(res.body.toString())).toStrictEqual({ quizId: expect.any(Number) });

    expect(res2.statusCode).toStrictEqual(200);
    expect(JSON.parse(res2.body.toString())).toStrictEqual({ quizId: expect.any(Number) });

    expect(res3.statusCode).toStrictEqual(200);
    expect(JSON.parse(res3.body.toString())).toStrictEqual({ quizId: expect.any(Number) });
  });

  // Test for error cases
  test.each([
    { name: 'quiz1!' },
    { name: 'quiz1 @' },
    { name: 'qu' },
    { name: '@@@@' },
    { name: 'W'.repeat(31) },
  ])('should return error message on name = "%s" which is invalid name', ({ name }) => {
    const res = request('POST', SERVER_URL + '/v2/admin/quiz', {
      headers: { token }, json: { name, description: 'description' }, timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toStrictEqual(400);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });

  test('should return error if Name is already used for another quiz', () => {
    request('POST', SERVER_URL + '/v2/admin/quiz', {
      headers: { token }, json: { name: 'quiz1', description: 'description1' }, timeout: TIMEOUT_MS
    });

    const res = request('POST', SERVER_URL + '/v2/admin/quiz', {
      headers: { token }, json: { name: 'quiz1', description: 'description2' }, timeout: TIMEOUT_MS
    });

    request('POST', SERVER_URL + '/v2/admin/quiz', {
      headers: { token }, json: { name: 'quiz2', description: 'description3' }, timeout: TIMEOUT_MS
    });

    const res2 = request('POST', SERVER_URL + '/v2/admin/quiz', {
      headers: { token }, json: { name: 'quiz2', description: 'description4' }, timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toStrictEqual(400);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);

    expect(res2.statusCode).toStrictEqual(400);
    expect(JSON.parse(res2.body.toString())).toStrictEqual(ERROR);
  });

  test('should return error if description is more than 100 characters', () => {
    const res = request('POST', SERVER_URL + '/v2/admin/quiz', {
      headers: { token }, json: { name: 'quiz1', description: 'W'.repeat(101) }, timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toStrictEqual(400);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });

  test('Test for empty token', () => {
    const emptyToken: string = '';

    const res = request('POST', SERVER_URL + '/v2/admin/quiz', {
      headers: { token: emptyToken },
      json: { name: 'quiz1', description: 'description' },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toStrictEqual(401);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });

  test('Test for invalid token', () => {
    const invalidToken: Token = { sessionId: 1, authUserId: 1531 };
    const encodedInvalid: string = createToken(invalidToken);

    const res = request('POST', SERVER_URL + '/v2/admin/quiz', {
      headers: { token: encodedInvalid },
      json: {
        name: 'quiz1', description: 'description'
      },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toStrictEqual(401);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });
});
