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
      questionBody: {
        question: 'Who is the King of Wakanda?',
        timeLimit: 5,
        points: 3,
        answerOptions: [
          {
            answer: 'Jason Chandra',
            correct: true,
          },
          {
            answer: 'Black Panther',
            correct: false,
          },
        ],
      },
    },
  });
  questionId = JSON.parse(questionRes.body.toString()).questionId;
});

describe('PUT /v1/admin/quiz/:quizid/question/:questionid ERROR cases', () => {
  test('returns error if question ID is invalid', () => {
    const invalidQuestionId = questionId + 1;

    const result = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${invalidQuestionId}`, {
      json: {
        token: userToken,
        questionBody: {
          question: 'What is the best city in Australia?',
          timeLimit: 10,
          points: 4,
          answerOptions: [
            { answer: 'Sydney', correct: true },
            { answer: 'Melbourne', correct: false },
          ],
        },
      },
      timeout: TIMEOUT_MS,
    });

    expect(result.statusCode).toStrictEqual(400);
    expect(JSON.parse(result.body.toString())).toStrictEqual({
      error: 'Unknown Type: string - error',
    });
  });

  test('returns error if question string length is invalid', () => {
    const result = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, {
      json: {
        token: userToken,
        questionBody: {
          question: 'Too short',
          timeLimit: 5,
          points: 4,
          answerOptions: [
            { answer: 'Answer 1', correct: true },
            { answer: 'Answer 2', correct: false },
          ],
        },
      },
      timeout: TIMEOUT_MS,
    });

    expect(result.statusCode).toStrictEqual(400);
    expect(JSON.parse(result.body.toString())).toStrictEqual({
      error: 'Unknown Type: string - error',
    });
  });

  test('returns error if there are too few or too many answer options', () => {
    const result = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, {
      json: {
        token: userToken,
        questionBody: {
          question: 'What is my name?',
          timeLimit: 5,
          points: 2,
          answerOptions: [
            { answer: 'Jason', correct: true },
          ], 
        },
      },
      timeout: TIMEOUT_MS,
    });

    expect(result.statusCode).toStrictEqual(400);
    expect(JSON.parse(result.body.toString())).toStrictEqual({
      error: 'Unknown Type: string - error',
    });
  });

  test('returns error if time limit is invalid or points exceed limit', () => {
    const result = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, {
      json: {
        token: userToken,
        questionBody: {
          question: 'Who is the best football player?',
          timeLimit: 0, 
          points: 15,   
          answerOptions: [
            { answer: 'Jason Chandra', correct: true },
            { answer: 'Lionel Messi', correct: false },
          ],
        },
      },
      timeout: TIMEOUT_MS,
    });

    expect(result.statusCode).toStrictEqual(400);
    expect(JSON.parse(result.body.toString())).toStrictEqual({
      error: 'Unknown Type: string - error',
    });
  });

  test('returns error if token is invalid', () => {
    const invalidToken = userToken + 'invalid';

    const result = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, {
      json: {
        token: invalidToken,
        questionBody: {
          question: 'What is the capital of Wakanda?',
          timeLimit: 5,
          points: 3,
          answerOptions: [
            { answer: 'Zimbabwe', correct: true },
            { answer: 'Mbappe', correct: false },
          ],
        },
      },
      timeout: TIMEOUT_MS,
    });

    expect(result.statusCode).toStrictEqual(401);
    expect(JSON.parse(result.body.toString())).toStrictEqual({
      error: 'Unknown Type: string - error',
    });
  });
});

describe('PUT /v1/admin/quiz/:quizid/question/:questionid SUCCESS cases', () => {
  test('successfully updates a quiz question', () => {
    const result = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, {
      json: {
        token: userToken,
        questionBody: {
          question: 'Who is the King of Wakanda?',
          timeLimit: 7,
          points: 5,
          answerOptions: [
            { answer: 'Jason Chandra', correct: false },
            { answer: 'Black Panther', correct: true },
          ],
        },
      },
      timeout: TIMEOUT_MS,
    });

    expect(result.statusCode).toStrictEqual(200);
    expect(JSON.parse(result.body.toString())).toStrictEqual({});
  });
});
