import request from 'sync-request-curl';
import { port, url } from '../config.json';
import { createToken } from '../helper';
import { ErrorResponse, Token } from '../interfaces';

const SERVER_URL: string = `${url}:${port}`;
const TIMEOUT_MS: number = 5 * 1000;

// Error object
const ERROR: ErrorResponse = { error: expect.any(String) };

// parameters for test functions
let token: string = '';
let quizId: number = 0;
let mainThumbnail: string = 'http://google.com/some/image/path.jpg';

// function to create a quiz
const createQuizRequest = (token: string, name: string, description: string) => {
    return request('POST', SERVER_URL + '/v2/admin/quiz', {
        headers: { token },
        json: { name, description },
        timeout: TIMEOUT_MS
    });
};

const getQuizInfoRequest = (quizId: number, token: string) => {
    return request('GET', `${SERVER_URL}/v2/admin/quiz/${quizId}`, {
        headers: { token },
        timeout: TIMEOUT_MS
    });
}

// function to update a quiz thumbnail
const updateQuizThumbnailRequest = (quizId: number, token: string, thumbnail: string) => {
    return request('PUT', `${SERVER_URL}/v1/admin/quiz/${quizId}/thumbnail`, {
        headers: { token },
        json: { thumbnail },
        timeout: TIMEOUT_MS
    });
};

// clear the database before each test and set parameters for session start
beforeEach(() => {
    request('DELETE', SERVER_URL + '/v1/clear', { timeout: TIMEOUT_MS });

    // register a user
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

    // create a quiz
    const res2 = createQuizRequest(token, 'Quiz 1', 'This is a quiz');

    quizId = JSON.parse(res2.body.toString()).quizId;
});

describe('Test for PUT /v1/admin/quiz/{quizid}/thumbnail', () => {
    // 200 success cases
    test('Has updated the thumbnail successfully', () => {
        const initial = getQuizInfoRequest(quizId, token);
        const timeLastEdited = JSON.parse(initial.body.toString()).timeLastEdited;

        const res = updateQuizThumbnailRequest(quizId, token, mainThumbnail);

        expect(res.statusCode).toStrictEqual(200);
        expect(JSON.parse(res.body.toString())).toStrictEqual({});

        const res2 = getQuizInfoRequest(quizId, token);

        console.log(res2.body.toString());

        expect(JSON.parse(res2.body.toString()).thumbnailUrl).toStrictEqual(mainThumbnail);
        expect(JSON.parse(res2.body.toString()).timeLastEdited).toBeGreaterThan(timeLastEdited);
    });

    test.each([
        ['http://google.com/some/image/path.jpg'],
        ['http://google.com/some/image/path.png'],
        ['http://google.com/some/image/path.jpeg'],
        ['https://google.com/some/image/path.jpg'],
        ['https://google.com/some/image/path.jpeg'],
        ['https://google.com/some/image/path.png'],
        ['https://google.com/some/image/path.JPG'],
        ['https://google.com/some/image/path.JPEG'],
        ['https://google.com/some/image/path.PNG'],
    ])('Test for valid URL: %s', (thumbnail: string) => {
        const res = updateQuizThumbnailRequest(quizId, token, thumbnail);

        expect(res.statusCode).toStrictEqual(200);
        expect(JSON.parse(res.body.toString())).toStrictEqual({});

        const res2 = getQuizInfoRequest(quizId, token);

        expect(JSON.parse(res2.body.toString()).thumbnailUrl).toStrictEqual(thumbnail);
    });

    test('Has updated the thumbnail of quizzes', () => {
        const quiz2 = createQuizRequest(token, 'Quiz 2', 'This is a quiz');
        const quizId2 = JSON.parse(quiz2.body.toString()).quizId;

        const quiz3 = createQuizRequest(token, 'Quiz 3', 'This is a quiz');
        const quizId3 = JSON.parse(quiz3.body.toString()).quizId;


        updateQuizThumbnailRequest(quizId, token, mainThumbnail);
        const test = getQuizInfoRequest(quizId, token);
        expect(JSON.parse(test.body.toString()).thumbnailUrl).toStrictEqual(mainThumbnail);

        updateQuizThumbnailRequest(quizId2, token, mainThumbnail);
        const test2 = getQuizInfoRequest(quizId2, token);
        expect(JSON.parse(test2.body.toString()).thumbnailUrl).toStrictEqual(mainThumbnail);

        updateQuizThumbnailRequest(quizId3, token, mainThumbnail);
        const test3 = getQuizInfoRequest(quizId3, token);
        expect(JSON.parse(test3.body.toString()).thumbnailUrl).toStrictEqual(mainThumbnail);
    });

    // 401 errors
    test('Test for empty token', () => {
        const emptyToken: string = '';

        const res = updateQuizThumbnailRequest(quizId, emptyToken, mainThumbnail);

        expect(res.statusCode).toStrictEqual(401);
        expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
    });

    test('Test for invalid token', () => {
        const invalidToken: Token = { sessionId: 1, authUserId: 1531 };
        const encodedInvalid: string = createToken(invalidToken);

        const res = updateQuizThumbnailRequest(quizId, encodedInvalid, mainThumbnail);

        expect(res.statusCode).toStrictEqual(401);
        expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
    });

    // 403 errors
    test('User does not own the quiz', () => {
        // register a user
        const register = request('POST', SERVER_URL + '/v1/admin/auth/register', {
            json: {
                email: 'Aerospace2@gmail.com',
                password: 'Aeropass2',
                nameFirst: 'Jin',
                nameLast: 'Kim',
            },
            timeout: TIMEOUT_MS
        });

        const token2: string = JSON.parse(register.body.toString()).token;

        const res = updateQuizThumbnailRequest(quizId, token2, mainThumbnail);

        expect(res.statusCode).toStrictEqual(403);
        expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
    });

    test('Quiz does not exist', () => {
        const wrongQuizId: number = 1531;

        const res = updateQuizThumbnailRequest(wrongQuizId, token, mainThumbnail);

        expect(res.statusCode).toStrictEqual(403);
        expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
    });
});
