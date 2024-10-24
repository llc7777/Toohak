/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import request from 'sync-request-curl';
import config from './config.json';

const port = config.port;
const url = config.url;
const SERVER_URL = `${url}:${port}`;
const timeout = 5 * 1000;

const requestAdminQuestionUpdate = (quizId: number, questionId: number, body: {
  token: string,
  questionBody: {
    question: string,
    timeLimit: number,
    points: number,
    answerOptions: [
      {
        answer: string,
        correct: boolean
      }
    ]
  }
}) => {
  return request('PUT', `${SERVER_URL}/v1/admin/quiz/${quizId}/question/${questionId}`, {
    json: {
      token: body.token,
      questionBody: {
        question: body.questionBody.question,
        timeLimit: body.questionBody.timeLimit,
        points: body.questionBody.points,
        answerOptions: body.questionBody.answerOptions
      }
    },
  });
};

let quiz;
let token;
let questionId;

beforeEach(() => {
  request('DELETE', SERVER_URL + '/v1/clear', { timeout: timeout });

  token = request('POST', SERVER_URL + '/v1/admin/auth/register', {
    json: {
      email: 'Aerospace@gmail.com',
      password: 'Aeropass1',
      nameFirst: 'Leo',
      nameLast: 'Kim'
    },
    timeout: timeout
  });
  token = JSON.parse(token.body.toString()).token;

  quiz = request('POST', `${SERVER_URL}/v1/admin/quiz`, {
    json: { token, name: 'quiz1', description: 'random description' },
    timeout: timeout
  });
  quiz = JSON.parse(quiz.body.toString());

  const questionResponse = requestAdminQuestionCreate(quiz.quizId, {
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
  });
  questionId = JSON.parse(questionResponse.body.toString()).questionId;
});

describe('Test for PUT /v1/admin/quiz/{quizId}/question/{questionId}', () => {
  test('working case with updated question', () => {
    const response = requestAdminQuestionUpdate(quiz.quizId, questionId, {
      token: token,
      questionBody: {
        question: 'What is the largest animal in the world?',
        timeLimit: 5,
        points: 6,
        answerOptions: [
          {
            answer: 'Blue Whale',
            correct: true
          },
          {
            answer: 'Whale Shark',
            correct: false
          }
        ]
      }
    });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body.toString())).toStrictEqual({ success: true });
  });

  describe('error cases', () => {
    test('question string less than 5 or greater than 50', () => {
      const response = requestAdminQuestionUpdate(quiz.quizId, questionId, {
        token: token,
        questionBody: {
          question: 'Who?',
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
      });
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body.toString())).toStrictEqual({ error: expect.any(String) });
    });

    test('question string longer than 50 characters', () => {
      const response = requestAdminQuestionUpdate(quiz.quizId, questionId, {
        token: token,
        questionBody: {
          question: 'What is the largest animal that has ever existed in the ocean?',
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
      });
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body.toString())).toStrictEqual({ error: expect.any(String) });
    });

    test('question has less than 2 answers', () => {
      const response = requestAdminQuestionUpdate(quiz.quizId, questionId, {
        token: token,
        questionBody: {
          question: 'What is the largest animal in the world?',
          timeLimit: 5,
          points: 5,
          answerOptions: [
            {
              answer: 'Whale',
              correct: true
            }
          ]
        }
      });
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body.toString())).toStrictEqual({ error: expect.any(String) });
    });

    test('question has more than 6 answers', () => {
      const response = requestAdminQuestionUpdate(quiz.quizId, questionId, {
        token: token,
        questionBody: {
          question: 'What is the largest animal in the world?',
          timeLimit: 5,
          points: 5,
          answerOptions: [
            {
              answer: 'Whale',
              correct: true
            },
            {
              answer: 'Frog',
              correct: false
            },
            {
              answer: 'Cat',
              correct: false
            },
            {
              answer: 'Dog',
              correct: false
            },
            {
              answer: 'Mouse',
              correct: false
            },
            {
              answer: 'Spider',
              correct: false
            },
            {
              answer: 'Lizard',
              correct: false
            }
          ]
        }
      });
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body.toString())).toStrictEqual({ error: expect.any(String) });
    });

    test('timelimit not positive number', () => {
      const response = requestAdminQuestionUpdate(quiz.quizId, questionId, {
        token: token,
        questionBody: {
          question: 'What is the largest animal in the world?',
          timeLimit: -5,
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
      });
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body.toString())).toStrictEqual({ error: expect.any(String) });
    });

    test.each([
      0,
      11,
      394
    ])('Points awarded for the question are less than 1 or greater than 10',
      (wrongNumPoints) => {
        const response = requestAdminQuestionUpdate(quiz.quizId, questionId, {
          token: token,
          questionBody: {
            question: 'What is the largest animal in the world?',
            timeLimit: 5,
            points: wrongNumPoints,
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
        });
        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.body.toString())).toStrictEqual({ error: expect.any(String) });
      });

    test('length of any answers is shorter than 1 character long', () => {
      const response = requestAdminQuestionUpdate(quiz.quizId, questionId, {
        token: token,
        questionBody: {
          question: 'What is the largest animal in the world?',
          timeLimit: 5,
          points: 5,
          answerOptions: [
            {
              answer: 'Whale',
              correct: true
            },
            {
              answer: '',
              correct: false
            }
          ]
        }
      });
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body.toString())).toStrictEqual({ error: expect.any(String) });
    });

    test('length of any answers is longer than 30 characters', () => {
      const response = requestAdminQuestionUpdate(quiz.quizId, questionId, {
        token: token,
        questionBody: {
          question: 'What is the largest animal in the world?',
          timeLimit: 5,
          points: 5,
          answerOptions: [
            {
              answer: 'Whale and whale friends that swim together',
              correct: true
            },
            {
              answer: 'Frog',
              correct: false
            }
          ]
        }
      });
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body.toString())).toStrictEqual({ error: expect.any(String) });
    });

    test('answer strings are duplicates of one another for the same question', () => {
      const response = requestAdminQuestionUpdate(quiz.quizId, questionId, {
        token: token,
        questionBody: {
          question: 'What is the largest animal in the world?',
          timeLimit: 5,
          points: 5,
          answerOptions: [
            {
              answer: 'Whale',
              correct: true
            },
            {
              answer: 'Whale',
              correct: false
            }
          ]
        }
      });
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body.toString())).toStrictEqual({ error: expect.any(String) });
    });
  });
}); 