import request from 'sync-request-curl';
import { port, url } from '../config.json';
import { Quiz } from '../interfaces';

const SERVER_URL: string = `${url}:${port}`;
const timeout: number = 5 * 1000;

let quiz: Quiz;
let token: string;
let questionId: number;

beforeEach(() => {
  request('DELETE', SERVER_URL + '/v1/clear', { timeout });

  const tokenRes = request('POST', SERVER_URL + '/v1/admin/auth/register', {
    json: {
      email: 'Aerospace@gmail.com',
      password: 'Aeropass1',
      nameFirst: 'Leo',
      nameLast: 'Kim'
    },
    timeout
  });
  token = JSON.parse(tokenRes.body.toString()).token;

  const quizRes = request('POST', `${SERVER_URL}/v1/admin/quiz`, {
    json: { token, name: 'quiz1', description: 'description1' },
    timeout
  });
  quiz = JSON.parse(quizRes.body.toString());

  const questionRes = request('POST', `${SERVER_URL}/v2/admin/quiz/${quiz.quizId}/question`, {
    json: {
      questionBody: {
        question: 'What is the largest planet?',
        timeLimit: 10,
        points: 5,
        answerOptions: [
          { answer: 'Jupiter', correct: true },
          { answer: 'Earth', correct: false },
        ],
        thumbnailUrl: 'http://google.com/some/image/path.jpg'
      }
    },
    headers: { token },
    timeout
  });
  questionId = JSON.parse(questionRes.body.toString()).questionId;
});

describe('DELETE /v2/admin/quiz/{quizId}/question/{questionId} Tests', () => {
  test('200: Successfully deletes a question with no active sessions', () => {
    const res =
    request('DELETE', `${SERVER_URL}/v2/admin/quiz/${quiz.quizId}/question/${questionId}`, {
      headers: { token },
      timeout
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body.toString())).toStrictEqual({});
  });

  test('401: Error for empty token', () => {
    const res =
    request('DELETE', `${SERVER_URL}/v2/admin/quiz/${quiz.quizId}/question/${questionId}`, {
      headers: { token: '' },
      timeout
    });

    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body.toString())).toStrictEqual({ error: expect.any(String) });
  });

  test('401: Error for invalid token', () => {
    const res =
    request('DELETE', `${SERVER_URL}/v2/admin/quiz/${quiz.quizId}/question/${questionId}`, {
      headers: { token: 'invalidtoken' },
      timeout
    });

    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body.toString())).toStrictEqual({ error: expect.any(String) });
  });

  test('400: Error for non-existent question ID', () => {
    const res =
    request('DELETE', `${SERVER_URL}/v2/admin/quiz/${quiz.quizId}/question/${questionId + 999}`, {
      headers: { token },
      timeout
    });

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body.toString())).toStrictEqual({ error: expect.any(String) });
  });

  test('403: Error for non-existent quiz ID', () => {
    const res =
    request('DELETE', `${SERVER_URL}/v2/admin/quiz/${quiz.quizId + 999}/question/${questionId}`, {
      headers: { token },
      timeout
    });

    expect(res.statusCode).toBe(403);
    expect(JSON.parse(res.body.toString())).toStrictEqual({ error: expect.any(String) });
  });

  test('403: Error for valid token but incorrect owner', () => {
    const secondUserRes = request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email: 'otheruser@gmail.com',
        password: 'Password1',
        nameFirst: 'Jane',
        nameLast: 'Doe'
      },
      timeout
    });
    const secondToken = JSON.parse(secondUserRes.body.toString()).token;

    const res =
    request('DELETE', `${SERVER_URL}/v2/admin/quiz/${quiz.quizId}/question/${questionId}`, {
      headers: { token: secondToken },
      timeout
    });

    expect(res.statusCode).toBe(403);
    expect(JSON.parse(res.body.toString())).toStrictEqual({ error: expect.any(String) });
  });

  test('400: Error when there is an active session for the quiz', () => {
    request('POST', `${SERVER_URL}/v1/admin/quiz/${quiz.quizId}/session/start`, {
      headers: { token },
      timeout
    });

    const res =
    request('DELETE', `${SERVER_URL}/v2/admin/quiz/${quiz.quizId}/question/${questionId}`, {
      headers: { token },
      timeout
    });

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body.toString())).toStrictEqual({ error: expect.any(String) });
  });
});
