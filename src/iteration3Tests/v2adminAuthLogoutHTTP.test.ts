
import request from 'sync-request-curl';
import { port, url } from './config.json';
import { createToken } from './helper';
import { Token, ErrorResponse } from './interfaces';

const SERVER_URL: string = `${url}:${port}`;
const TIMEOUT_MS: number = 5 * 1000;

// Error object
const ERROR: ErrorResponse = { error: expect.any(String) };

// user token
let token = '';

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

describe('Test for POST /v2/admin/auth/logout', () => {
    // Test for successful cases
    test('has the correct return and has it logged out the user', () => {
        let token2 = request('POST', SERVER_URL + '/v1/admin/auth/login', {
            json: {
                email: 'Aerospace@gmail.com', password: 'Aeropass1'
            },
            timeout: TIMEOUT_MS
        });

        token2 = JSON.parse(token2.body.toString()).token;

        const res = request('POST', SERVER_URL + '/v2/admin/auth/logout', {
            headers: { token }, timeout: TIMEOUT_MS
        });

        const result = request('GET', SERVER_URL + '/v1/admin/quiz/list?token=' + token, {
            timeout: TIMEOUT_MS
        });

        const result2 = request('GET', SERVER_URL + '/v1/admin/quiz/list?token=' + token2, {
            timeout: TIMEOUT_MS
        });

        expect(res.statusCode).toStrictEqual(200);
        expect(JSON.parse(res.body.toString())).toStrictEqual({});

        expect(result.statusCode).toStrictEqual(401);
        expect(JSON.parse(result.body.toString())).toStrictEqual(ERROR);

        expect(result2.statusCode).toStrictEqual(200);
        expect(JSON.parse(result2.body.toString())).toStrictEqual({ quizzes: [] });
    });

    test('has logged out the user several times', () => {
        let token2 = request('POST', SERVER_URL + '/v1/admin/auth/login', {
            json: {
                email: 'Aerospace@gmail.com', password: 'Aeropass1'
            },
            timeout: TIMEOUT_MS
        });

        const token2Value: string = JSON.parse(token2.body.toString()).token;

        let token3 = request('POST', SERVER_URL + '/v1/admin/auth/login', {
            json: {
                email: 'Aerospace@gmail.com', password: 'Aeropass1'
            },
            timeout: TIMEOUT_MS
        });

        const token3Value: string = JSON.parse(token3.body.toString()).token;

        request('POST', SERVER_URL + '/v2/admin/auth/logout', {
            headers: { token }, timeout: TIMEOUT_MS
        });

        request('POST', SERVER_URL + '/v2/admin/auth/logout', {
            headers: { token: token2Value }, timeout: TIMEOUT_MS
        });

        const result = request('GET', SERVER_URL + '/v1/admin/quiz/list?token=' + token, {
            timeout: TIMEOUT_MS
        });

        const result2 = request('GET', SERVER_URL + '/v1/admin/quiz/list?token=' + token2Value, {
            timeout: TIMEOUT_MS
        });

        const result3 = request('GET', SERVER_URL + '/v1/admin/quiz/list?token=' + token3Value, {
            timeout: TIMEOUT_MS
        });

        expect(result.statusCode).toStrictEqual(401);
        expect(JSON.parse(result.body.toString())).toStrictEqual(ERROR);

        expect(result2.statusCode).toStrictEqual(401);
        expect(JSON.parse(result2.body.toString())).toStrictEqual(ERROR);

        expect(result3.statusCode).toStrictEqual(200);
        expect(JSON.parse(result3.body.toString())).toStrictEqual({ quizzes: [] });
    });

    test('has logged out all user sessions', () => {
        let token2 = request('POST', SERVER_URL + '/v1/admin/auth/login', {
            json: {
                email: 'Aerospace@gmail.com', password: 'Aeropass1'
            },
            timeout: TIMEOUT_MS
        });

        const token2Value: string = JSON.parse(token2.body.toString()).token;

        request('POST', SERVER_URL + '/v2/admin/auth/logout', {
            headers: { token }, timeout: TIMEOUT_MS
        });

        request('POST', SERVER_URL + '/v2/admin/auth/logout', {
            headers: { token: token2Value }, timeout: TIMEOUT_MS
        });

        const result = request('GET', SERVER_URL + '/v1/admin/quiz/list?token=' + token, {
            timeout: TIMEOUT_MS
        });

        const result2 = request('GET', SERVER_URL + '/v1/admin/quiz/list?token=' + token2Value, {
            timeout: TIMEOUT_MS
        });

        expect(result.statusCode).toStrictEqual(401);
        expect(JSON.parse(result.body.toString())).toStrictEqual(ERROR);

        expect(result2.statusCode).toStrictEqual(401);
        expect(JSON.parse(result2.body.toString())).toStrictEqual(ERROR);
    });

    // Test for error cases
    test('error for empty token', () => {
        const emptyToken: string = '';

        const res = request('POST', SERVER_URL + '/v2/admin/auth/logout', {
            headers: {
                token: emptyToken
            },
            timeout: TIMEOUT_MS
        });

        expect(res.statusCode).toStrictEqual(401);
        expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
    });

    test('error for invalid token', () => {
        const invalidToken: Token = { sessionId: 1, authUserId: 1531 };
        const encodedInvalid: string = createToken(invalidToken);

        const res = request('POST', SERVER_URL + '/v2/admin/auth/logout', {
            headers: {
                token: encodedInvalid
            },
            timeout: TIMEOUT_MS
        });

        expect(res.statusCode).toStrictEqual(401);
        expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
    });
});