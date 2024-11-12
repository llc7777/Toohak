/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import request from 'sync-request-curl';
import { port, url } from '../config.json';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;
const ERROR = { error: expect.any(String) };

let token;
let quizId;
let questionId;

beforeEach(() => {
  request('DELETE', `${SERVER_URL}/v1/clear`, { timeout: TIMEOUT_MS });

  const response = request('POST', `${SERVER_URL}/v1/admin/auth/register`, {
    json: {
      email: 'Aerospace@gmail.com',
      password: 'Aeropass1',
      nameFirst: 'Leo',
      nameLast: 'Kim',
    },
    timeout: TIMEOUT_MS,
  });

  token = JSON.parse(response.body.toString()).token;

  const quizResponse = request('POST', `${SERVER_URL}/v1/admin/quiz`, {
    json: {
      token,
      name: 'quiz1',
      description: 'description1',
    },
    timeout: TIMEOUT_MS,
  });

  quizId = JSON.parse(quizResponse.body.toString()).quizId;

  const questionResponse = request('POST', `${SERVER_URL}/v1/admin/quiz/${quizId}/question`, {
    json: {
      token,
      questionBody: {
        question: 'What is the largest mammal in the world?',
        timeLimit: 4,
        points: 5,
        answerOptions: [
          { answer: 'Whale', correct: true },
          { answer: 'Frog', correct: false },
        ],
      },
    },
    timeout: TIMEOUT_MS,
  });

  questionId = JSON.parse(questionResponse.body.toString()).questionId;
});

describe('Test for PUT /v1/admin/quiz/{quizId}/question/{questionId}', () => {
  test('should update the question successfully', () => {
    const res = request('PUT', `${SERVER_URL}/v1/admin/quiz/${quizId}/question/${questionId}`, {
      json: {
        token,
        questionBody: {
          question: 'What is the largest animal in the world?',
          timeLimit: 5,
          points: 6,
          answerOptions: [
            { answer: 'Blue Whale', correct: true },
            { answer: 'Whale Shark', correct: false },
          ],
        },
      },
      timeout: TIMEOUT_MS,
    });

    expect(res.statusCode).toStrictEqual(200);
    expect(JSON.parse(res.body.toString())).toStrictEqual({});
  });

  describe('error cases', () => {
    test('question string less than 5 characters', () => {
      const res = request('PUT', `${SERVER_URL}/v1/admin/quiz/${quizId}/question/${questionId}`, {
        json: {
          token,
          questionBody: {
            question: 'Who?',
            timeLimit: 4,
            points: 5,
            answerOptions: [
              { answer: 'Whale', correct: true },
              { answer: 'Frog', correct: false },
            ],
          },
        },
        timeout: TIMEOUT_MS,
      });

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
    });

    test('question string longer than 50 characters', () => {
      const res = request('PUT', `${SERVER_URL}/v1/admin/quiz/${quizId}/question/${questionId}`, {
        json: {
          token,
          questionBody: {
            question: 'What is the largest animal that has ever existed in the ocean?',
            timeLimit: 4,
            points: 5,
            answerOptions: [
              { answer: 'Pig', correct: true },
              { answer: 'Frog', correct: false },
            ],
          },
        },
        timeout: TIMEOUT_MS,
      });

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
    });

    test('less than 2 answer options', () => {
      const res = request('PUT', `${SERVER_URL}/v1/admin/quiz/${quizId}/question/${questionId}`, {
        json: {
          token,
          questionBody: {
            question: 'What is the largest animal in the world?',
            timeLimit: 5,
            points: 5,
            answerOptions: [{ answer: 'Whale', correct: true }],
          },
        },
        timeout: TIMEOUT_MS,
      });

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
    });

    test('more than 6 answer options', () => {
      const res = request('PUT', `${SERVER_URL}/v1/admin/quiz/${quizId}/question/${questionId}`, {
        json: {
          token,
          questionBody: {
            question: 'What is the largest animal in the world?',
            timeLimit: 5,
            points: 5,
            answerOptions: [
              { answer: 'Whale', correct: true },
              { answer: 'Frog', correct: false },
              { answer: 'Cat', correct: false },
              { answer: 'Dog', correct: false },
              { answer: 'Mouse', correct: false },
              { answer: 'Spider', correct: false },
              { answer: 'Lizard', correct: false },
            ],
          },
        },
        timeout: TIMEOUT_MS,
      });

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
    });

    test('time limit not positive', () => {
      const res = request('PUT', `${SERVER_URL}/v1/admin/quiz/${quizId}/question/${questionId}`, {
        json: {
          token,
          questionBody: {
            question: 'What is the largest animal in the world?',
            timeLimit: -5,
            points: 5,
            answerOptions: [
              { answer: 'Whale', correct: true },
              { answer: 'Frog', correct: false },
            ],
          },
        },
        timeout: TIMEOUT_MS,
      });

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
    });

    test.each([0, 11, 394])(
      'points awarded must be between 1 and 10',
      (invalidPoints) => {
        const res = request('PUT', `${SERVER_URL}/v1/admin/quiz/${quizId}/question/${questionId}`, {
          json: {
            token,
            questionBody: {
              question: 'What is the largest animal in the world?',
              timeLimit: 5,
              points: invalidPoints,
              answerOptions: [
                { answer: 'Whale', correct: true },
                { answer: 'Frog', correct: false },
              ],
            },
          },
          timeout: TIMEOUT_MS,
        });

        expect(res.statusCode).toBe(400);
        expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
      }
    );

    test('answer option length less than 1 character', () => {
      const res = request('PUT', `${SERVER_URL}/v1/admin/quiz/${quizId}/question/${questionId}`, {
        json: {
          token,
          questionBody: {
            question: 'What is the largest animal in the world?',
            timeLimit: 5,
            points: 5,
            answerOptions: [
              { answer: 'Whale', correct: true },
              { answer: '', correct: false },
            ],
          },
        },
        timeout: TIMEOUT_MS,
      });

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
    });

    test('answer option length longer than 30 characters', () => {
      const res = request('PUT', `${SERVER_URL}/v1/admin/quiz/${quizId}/question/${questionId}`, {
        json: {
          token,
          questionBody: {
            question: 'What is the largest animal in the world?',
            timeLimit: 5,
            points: 5,
            answerOptions: [
              { answer: 'Whale and whale friends that swim together', correct: true },
              { answer: 'Frog', correct: false },
            ],
          },
        },
        timeout: TIMEOUT_MS,
      });

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
    });

    test('duplicate answer strings', () => {
      const res = request('PUT', `${SERVER_URL}/v1/admin/quiz/${quizId}/question/${questionId}`,
        {
          json: {
            token,
            questionBody: {
              question: 'What is the largest animal in the world?',
              timeLimit: 5,
              points: 5,
              answerOptions: [
                { answer: 'Whale', correct: true },
                { answer: 'Whale', correct: false },
              ],
            },
          },
          timeout: TIMEOUT_MS,
        });

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
    });

    test('non existent quiz', () => {
      const res = request('PUT', `${SERVER_URL}/v1/admin/quiz/${quizId + 1}/question/${questionId}`,
        {
          json: {
            token,
            questionBody: {
              question: 'What is the largest animal in the world?',
              timeLimit: 5,
              points: 5,
              answerOptions: [
                { answer: 'Whale', correct: true },
                { answer: 'Dolphin', correct: false },
              ],
            },
          },
          timeout: TIMEOUT_MS,
        });

      expect(res.statusCode).toBe(403);
      expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
    });

    test('non existent question', () => {
      const res = request('PUT', `${SERVER_URL}/v1/admin/quiz/${quizId}/question/${questionId + 1}`,
        {
          json: {
            token,
            questionBody: {
              question: 'What is the largest animal in the world?',
              timeLimit: 5,
              points: 5,
              answerOptions: [
                { answer: 'Whale', correct: true },
                { answer: 'Dolphin', correct: false },
              ],
            },
          },
          timeout: TIMEOUT_MS,
        });

      expect(res.statusCode).toBe(403);
      expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
    });

    test('user does not own quiz', () => {
      const response = request('POST', `${SERVER_URL}/v1/admin/auth/register`, {
        json: {
          email: 'andrew.taylor@gmail.com',
          password: 'Aeropass1',
          nameFirst: 'Andrew',
          nameLast: 'Taylor',
        },
        timeout: TIMEOUT_MS,
      });
      const token1 = JSON.parse(response.body.toString()).token;

      const res = request('PUT', `${SERVER_URL}/v1/admin/quiz/${quizId}/question/${questionId}`, {
        json: {
          token: token1,
          questionBody: {
            question: 'What is the largest animal in the world?',
            timeLimit: 5,
            points: 5,
            answerOptions: [
              { answer: 'Whale', correct: true },
              { answer: 'Dolphin', correct: false },
            ],
          },
        },
        timeout: TIMEOUT_MS,
      });

      expect(res.statusCode).toBe(403);
      expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
    });

    test('empty or invalid token', () => {
      const response = request(
        'PUT', `${SERVER_URL}/v1/admin/quiz/${quizId}/question/${questionId}`,
        {
          json: {
            token: '',
            questionBody: {
              question: 'How many sides on a square?',
              timeLimit: 11,
              points: 5,
              answerOptions: [
                { answer: '4', correct: true },
                { answer: '15', correct: false },
              ],
            },
          },
          timeout: TIMEOUT_MS,
        });

      expect(response.statusCode).toBe(401);
      expect(JSON.parse(response.body.toString())).toStrictEqual({ error: expect.any(String) });
    });

    test('400: sum of question time limits in quiz exceeds 3 minutes', () => {
      const response = request(
        'PUT', `${SERVER_URL}/v1/admin/quiz/${quizId}/question/${questionId}`, {
          json: {
            token,
            questionBody: {
              question: 'How many sides on a square?',
              timeLimit: 181,
              points: 5,
              answerOptions: [
                { answer: '4', correct: true },
                { answer: '15', correct: false },
              ],
            },
          },
          timeout: TIMEOUT_MS,
        });

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body.toString())).toStrictEqual({ error: expect.any(String) });
    });

    test('400: there is not a correct answer', () => {
      const response = request(
        'PUT', `${SERVER_URL}/v1/admin/quiz/${quizId}/question/${questionId}`, {
          json: {
            token,
            questionBody: {
              question: 'How many sides on a square?',
              timeLimit: 20,
              points: 5,
              answerOptions: [
                { answer: '4', correct: false },
                { answer: '15', correct: false },
              ],
            },
          },
          timeout: TIMEOUT_MS,
        });

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body.toString())).toStrictEqual({ error: expect.any(String) });
    });
  });
});
