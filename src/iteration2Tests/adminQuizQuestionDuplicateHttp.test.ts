/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import request from 'sync-request-curl';
import config from '../config.json';

const port = config.port;
const url = config.url;
const SERVER_URL = `${url}:${port}`;
const timeout = 5 * 1000;

const requestAdminQuestionDuplicate = (
  quizId: number,
  quizQuestionId: number,
  body: { token: string }
) => {
  return request('POST',
    `${SERVER_URL}/v1/admin/quiz/${quizId}/question/${quizQuestionId}/duplicate`, {
      json: {
        token: body.token,
      }
    }
  );
};

describe('HTTP tests for /v1/admin/quiz/{quizId}/name', () => {
  let quiz;
  let token;
  let question;

  beforeEach(() => {
    request('DELETE', SERVER_URL + '/v1/clear', { timeout: timeout });

    token = request('POST', `${SERVER_URL}/v1/admin/auth/register`, {
      json: {
        email: 'aero@mail.com',
        password: 'Aeropass1',
        nameFirst: 'Jason',
        nameLast: 'Chandra'
      },
      timeout: timeout
    });
    token = JSON.parse(token.body.toString()).token;

    quiz = request('POST', `${SERVER_URL}/v1/admin/quiz`, {
      json: { token, name: 'quiz1', description: 'random description' },
      timeout: timeout
    });
    quiz = JSON.parse(quiz.body.toString());

    question = request('POST', `${SERVER_URL}/v1/admin/quiz/${quiz.quizId}/question`, {
      json: {
        token: token,
        questionBody: {
          question: 'What is the largest mammal in the world?',
          timeLimit: 4,
          points: 5,
          answerOptions: [
            {
              answer: 'Whale',
              correct: true
            },
            {
              answer: 'Frog',
              correct: false
            }
          ]
        }
      },
      timeout: timeout
    });

    question = JSON.parse(question.body.toString());
  });

  test('200: successful case', () => {
    const response = requestAdminQuestionDuplicate(quiz.quizId, question.questionId,
      { token: token });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body.toString())).toStrictEqual({
      duplicatedQuestionId: expect.any(Number)
    });
  });

  test('400: QuestionId does not refer to a valid question within the quiz', () => {
    const response = requestAdminQuestionDuplicate(quiz.quizId, question.questionId + 1,
      { token: token });

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body.toString())).toStrictEqual({ error: expect.any(String) });
  });

  test('401: Token is empty', () => {
    const response = requestAdminQuestionDuplicate(quiz.quizId, question.questionId,
      { token: '' });

    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body.toString())).toStrictEqual({ error: expect.any(String) });
  });

  test('401: Token is invalid', () => {
    const response = requestAdminQuestionDuplicate(quiz.quizId, question.questionId,
      { token: 'invalidToken' });

    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body.toString())).toStrictEqual({ error: expect.any(String) });
  });

  test('403: Valid token but the user is not an owner of the quiz', () => {
    let incorrectUser = request('POST', `${SERVER_URL}/v1/admin/auth/register`, {
      json: {
        email: 'mew@mail.com',
        password: 'Aeropass1',
        nameFirst: 'Kate',
        nameLast: 'Smith'
      },
      timeout: timeout
    });
    incorrectUser = JSON.parse(incorrectUser.body.toString());
    const response = requestAdminQuestionDuplicate(quiz.quizId, question.questionId, {
      token: incorrectUser.token
    });
    expect(response.statusCode).toBe(403);
    expect(JSON.parse(response.body.toString())).toStrictEqual({ error: expect.any(String) });
  });

  test('403: Valid token but the quiz does not exist', () => {
    const response = requestAdminQuestionDuplicate(quiz.quizId + 1, question.questionId,
      { token: token });

    expect(response.statusCode).toBe(403);
    expect(JSON.parse(response.body.toString())).toStrictEqual({ error: expect.any(String) });
  });
});
