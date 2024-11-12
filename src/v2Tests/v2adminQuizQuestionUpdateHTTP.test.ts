import request from 'sync-request-curl';
import { port, url } from '../config.json';
import { AnswerOptionsReq, Quiz } from '../interfaces';

const SERVER_URL: string = `${url}:${port}`;
const timeout: number = 5 * 1000;

const requestAdminQuestionUpdate = (
  quizId: number,
  questionId: number,
  token: string,
  body: {
    questionBody: {
      question: string,
      timeLimit: number,
      points: number,
      answerOptions: AnswerOptionsReq[],
      thumbnailUrl?: string
    }
  }
) => {
  return request('PUT', `${SERVER_URL}/v2/admin/quiz/${quizId}/question/${questionId}`, {
    json: {
      questionBody: {
        question: body.questionBody.question,
        timeLimit: body.questionBody.timeLimit,
        points: body.questionBody.points,
        answerOptions: body.questionBody.answerOptions,
        thumbnailUrl: body.questionBody.thumbnailUrl
      }
    },
    headers: { token }
  });
};

let quiz: Quiz;
let token: string;
let questionId: number;

beforeEach(() => {
  request('DELETE', SERVER_URL + '/v1/clear', { timeout: timeout });
  const tokenRes = request('POST', SERVER_URL + '/v1/admin/auth/register', {
    json: {
      email: 'testuser@gmail.com',
      password: 'Testpass1',
      nameFirst: 'Test',
      nameLast: 'User'
    },
    timeout: timeout
  });
  token = JSON.parse(tokenRes.body.toString()).token;

  const quizRes = request('POST', `${SERVER_URL}/v1/admin/quiz`, {
    json: { token, name: 'Sample Quiz', description: 'Sample Description' },
    timeout: timeout
  });
  quiz = JSON.parse(quizRes.body.toString());

  const questionRes = request('POST', `${SERVER_URL}/v1/admin/quiz/${quiz.quizId}/question`, {
    json: {
      token,
      questionBody: {
        question: 'What is the largest mammal?',
        timeLimit: 4,
        points: 5,
        answerOptions: [
          { answer: 'Blue Whale', correct: true },
          { answer: 'Elephant', correct: false }
        ]
      }
    },
    timeout: timeout
  });
  questionId = JSON.parse(questionRes.body.toString()).questionId;
});

describe('PUT /v2/admin/quiz/{quizId}/question/{questionId}', () => {
  test('200: successfully updates a question', () => {
    const response = requestAdminQuestionUpdate(quiz.quizId, questionId, token, {
      questionBody: {
        question: 'What is the largest animal?',
        timeLimit: 5,
        points: 6,
        answerOptions: [
          { answer: 'Blue Whale', correct: true },
          { answer: 'Whale Shark', correct: false }
        ],
        thumbnailUrl: 'https://example.com/image.jpg'
      }
    });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body.toString())).toStrictEqual({});
  });

  describe('Error cases', () => {
    test('401: invalid token', () => {
      const response = requestAdminQuestionUpdate(quiz.quizId, questionId, 'invalidToken', {
        questionBody: {
          question: 'What is the largest animal?',
          timeLimit: 5,
          points: 6,
          answerOptions: [
            { answer: 'Blue Whale', correct: true },
            { answer: 'Whale Shark', correct: false }
          ],
          thumbnailUrl: 'https://example.com/image.jpg'
        }
      });
      expect(response.statusCode).toBe(401);
      expect(JSON.parse(response.body.toString())).toStrictEqual({ error: expect.any(String) });
    });

    test('400: invalid question length', () => {
      const response = requestAdminQuestionUpdate(quiz.quizId, questionId, token, {
        questionBody: {
          question: 'Hi',
          timeLimit: 5,
          points: 6,
          answerOptions: [
            { answer: 'Blue Whale', correct: true },
            { answer: 'Whale Shark', correct: false }
          ],
          thumbnailUrl: 'https://example.com/image.jpg'
        }
      });
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body.toString())).toStrictEqual({ error: expect.any(String) });
    });

    test('400: not enough answer options', () => {
      const response = requestAdminQuestionUpdate(quiz.quizId, questionId, token, {
        questionBody: {
          question: 'What is the largest animal?',
          timeLimit: 5,
          points: 6,
          answerOptions: [{ answer: 'Blue Whale', correct: true }],
          thumbnailUrl: 'https://example.com/image.jpg'
        }
      });
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body.toString())).toStrictEqual({ error: expect.any(String) });
    });

    test('400: duplicate answer options', () => {
      const response = requestAdminQuestionUpdate(quiz.quizId, questionId, token, {
        questionBody: {
          question: 'What is the largest animal?',
          timeLimit: 5,
          points: 6,
          answerOptions: [
            { answer: 'Blue Whale', correct: true },
            { answer: 'Blue Whale', correct: false }
          ],
          thumbnailUrl: 'https://example.com/image.jpg'
        }
      });
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body.toString())).toStrictEqual({ error: expect.any(String) });
    });

    test('400: no correct answer', () => {
      const response = requestAdminQuestionUpdate(quiz.quizId, questionId, token, {
        questionBody: {
          question: 'What is the largest animal?',
          timeLimit: 5,
          points: 6,
          answerOptions: [
            { answer: 'Blue Whale', correct: false },
            { answer: 'Whale Shark', correct: false }
          ],
          thumbnailUrl: 'https://example.com/image.jpg'
        }
      });
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body.toString())).toStrictEqual({ error: expect.any(String) });
    });

    test('400: invalid thumbnail URL', () => {
      const response = requestAdminQuestionUpdate(quiz.quizId, questionId, token, {
        questionBody: {
          question: 'What is the largest animal?',
          timeLimit: 5,
          points: 6,
          answerOptions: [
            { answer: 'Blue Whale', correct: true },
            { answer: 'Whale Shark', correct: false }
          ],
          thumbnailUrl: 'ftp://invalid-url'
        }
      });
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body.toString())).toStrictEqual({ error: expect.any(String) });
    });

    test('401: empty token', () => {
      const response = requestAdminQuestionUpdate(quiz.quizId, questionId, '', {
        questionBody: {
          question: 'What is the largest animal?',
          timeLimit: 5,
          points: 6,
          answerOptions: [
            { answer: 'Blue Whale', correct: true },
            { answer: 'Whale Shark', correct: false }
          ],
          thumbnailUrl: 'https://example.com/image.jpg'
        }
      });
      expect(response.statusCode).toBe(401);
      expect(JSON.parse(response.body.toString())).toStrictEqual({ error: expect.any(String) });
    });

    test('403: valid token, but user does not own quiz', () => {
      const newUserRes = request('POST', `${SERVER_URL}/v1/admin/auth/register`, {
        json: {
          email: 'anotheruser@gmail.com',
          password: 'Anotherpass1',
          nameFirst: 'Another',
          nameLast: 'User'
        },
        timeout: timeout
      });
      const newToken = JSON.parse(newUserRes.body.toString()).token;

      const response = requestAdminQuestionUpdate(quiz.quizId, questionId, newToken, {
        questionBody: {
          question: 'What is the largest animal?',
          timeLimit: 5,
          points: 6,
          answerOptions: [
            { answer: 'Blue Whale', correct: true },
            { answer: 'Whale Shark', correct: false }
          ],
          thumbnailUrl: 'https://example.com/image.jpg'
        }
      });
      expect(response.statusCode).toBe(403);
      expect(JSON.parse(response.body.toString())).toStrictEqual({ error: expect.any(String) });
    });

    test('403: quiz does not exist', () => {
      const response = requestAdminQuestionUpdate(quiz.quizId + 1, questionId, token, {
        questionBody: {
          question: 'What is the largest animal?',
          timeLimit: 5,
          points: 6,
          answerOptions: [
            { answer: 'Blue Whale', correct: true },
            { answer: 'Whale Shark', correct: false }
          ],
          thumbnailUrl: 'https://example.com/image.jpg'
        }
      });
      expect(response.statusCode).toBe(403);
      expect(JSON.parse(response.body.toString())).toStrictEqual({ error: expect.any(String) });
    });
  });
});
