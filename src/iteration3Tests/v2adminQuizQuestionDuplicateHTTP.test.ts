import request from 'sync-request-curl';
import config from '../config.json';
import { QuestionCreateReq, QuestionInfo, Quiz } from '../interfaces';

const port: string = config.port;
const url: string = config.url;
const SERVER_URL: string = `${url}:${port}`;
const timeout: number = 5 * 1000;

const requestAdminQuestionDuplicate = (
  quizId: number,
  quizQuestionId: number,
  token: string
) => {
  return request('POST',
    `${SERVER_URL}/v2/admin/quiz/${quizId}/question/${quizQuestionId}/duplicate`, {
      headers: { token: token }
    }
  );
};

describe('HTTP tests for /v2/admin/quiz/{quizId}/question/{questionid}/duplicate', () => {
  let quiz: Quiz
  let token: string
  let question: QuestionInfo

  beforeEach(() => {
    request('DELETE', SERVER_URL + '/v1/clear', { timeout: timeout });

    const tokenRes = request('POST', `${SERVER_URL}/v1/admin/auth/register`, {
      json: {
        email: 'aero@mail.com',
        password: 'Aeropass1',
        nameFirst: 'Jason',
        nameLast: 'Chandra'
      },
      timeout: timeout
    });
    token = JSON.parse(tokenRes.body.toString()).token;

    const quizRes = request('POST', `${SERVER_URL}/v2/admin/quiz`, {
      json: { name: 'quiz1', description: 'random description' },
      headers: token,
      timeout: timeout
    });
    quiz = JSON.parse(quizRes.body.toString());

    const questionRes = request('POST', `${SERVER_URL}/v2/admin/quiz/${quiz.quizId}/question`, {
      headers: token, 
      json: {
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

    question = JSON.parse(questionRes.body.toString());
  });

  test('200: successful case', () => {
    const response = requestAdminQuestionDuplicate(quiz.quizId, question.questionId, token);

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body.toString())).toStrictEqual({
      duplicatedQuestionId: expect.any(Number)
    });
  });

  test('400: QuestionId does not refer to a valid question within the quiz', () => {
    const response = requestAdminQuestionDuplicate(quiz.quizId, question.questionId + 1, token);

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body.toString())).toStrictEqual({ error: expect.any(String) });
  });

  test('401: Token is empty', () => {
    const response = requestAdminQuestionDuplicate(quiz.quizId, question.questionId, '');

    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body.toString())).toStrictEqual({ error: expect.any(String) });
  });

  test('401: Token is invalid', () => {
    const response = requestAdminQuestionDuplicate(quiz.quizId, question.questionId, 'invalidToken');

    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body.toString())).toStrictEqual({ error: expect.any(String) });
  });

  test('403: Valid token but the user is not an owner of the quiz', () => {
    const incorrectUserRes = request('POST', `${SERVER_URL}/v1/admin/auth/register`, {
      json: {
        email: 'mew@mail.com',
        password: 'Aeropass1',
        nameFirst: 'Kate',
        nameLast: 'Smith'
      },
      timeout: timeout
    });
    const incorrectUser = JSON.parse(incorrectUserRes.body.toString());
    const response = requestAdminQuestionDuplicate(quiz.quizId, question.questionId, incorrectUser.token);
    expect(response.statusCode).toBe(403);
    expect(JSON.parse(response.body.toString())).toStrictEqual({ error: expect.any(String) });
  });

  test('403: Valid token but the quiz does not exist', () => {
    const response = requestAdminQuestionDuplicate(quiz.quizId + 1, question.questionId, token);

    expect(response.statusCode).toBe(403);
    expect(JSON.parse(response.body.toString())).toStrictEqual({ error: expect.any(String) });
  });
});
