
import request from 'sync-request-curl';
import config from '../config.json';
import {AnswerOptionsReq} from '../interfaces'

const port = config.port;
const url = config.url;
const SERVER_URL = `${url}:${port}`;
const timeout = 5 * 1000;

const requestAdminQuestionCreate = (quizId: number, body: {
  token: string,
  questionBody: {
    question: string,
    timeLimit: number,
    points: number,
    answerOptions: AnswerOptionsReq[]
  }
}) => {
  return request('POST', `${SERVER_URL}/v1/admin/quiz/${quizId}/question`, {
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

let quizId: number;
let token: string;

beforeEach(() => {
  request('DELETE', SERVER_URL + '/v1/clear', { timeout: timeout });

  const tokenRes = request('POST', SERVER_URL + '/v1/admin/auth/register', {
    json: {
      email: 'Aerospace@gmail.com',
      password: 'Aeropass1',
      nameFirst: 'Leo',
      nameLast: 'Kim'
    },
    timeout: timeout
  });
  token = JSON.parse(tokenRes.body.toString()).token;

  const quizRes = request('POST', `${SERVER_URL}/v1/admin/quiz`, {
    json: { token, name: 'quiz1', description: 'random description' },
    timeout: timeout
  });
  quizId = JSON.parse(quizRes.body.toString()).quizId;
});

describe('Test for POST /v1/admin/quiz/{quizId}/question', () => {
  // successful cases
  test('200: working case with 1 question', () => {
    const response = requestAdminQuestionCreate(quizId, {
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
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body.toString())).toStrictEqual({ questionId: expect.any(Number) });
  });

  test('200: sum of question time limits in quiz equal 3 minutes', () => {
    const response = requestAdminQuestionCreate(quizId, {
      token: token,
      questionBody: {
        question: 'What is the largest mammal in the world?',
        timeLimit: 175,
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
    const response2 = requestAdminQuestionCreate(quizId, {
      token: token,
      questionBody: {
        question: 'How many sides on a square',
        timeLimit: 5,
        points: 5,
        answerOptions: [
          {
            answer: '4',
            correct: true
          },
          {
            answer: '3',
            correct: false
          }
        ]
      }
    });
    expect(response2.statusCode).toBe(200);
    expect(JSON.parse(response.body.toString())).toStrictEqual({ questionId: expect.any(Number) });
  });

  describe('error cases', () => {
    test.each([
      'Who?',
      'A question string that is greater than fifty characters and is too long'
    ])('400: question string less than 5 or greater than 50', (WrongLengthQuestion) => {
      const response = requestAdminQuestionCreate(quizId, {
        token: token,
        questionBody: {
          question: WrongLengthQuestion,
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

    test('400: question has more than 6 answers', () => {
      const response = requestAdminQuestionCreate(quizId, {
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
            },
            {
              answer: 'Cat',
              correct: false
            },
            {
              answer: 'Mouse',
              correct: false
            },
            {
              answer: 'Dog',
              correct: false
            },
            {
              answer: 'Spider',
              correct: false
            },
            {
              answer: 'Lizard',
              correct: false
            },
          ]
        }
      });
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body.toString())).toStrictEqual({ error: expect.any(String) });
    });
    test('400: question has less than 2 answers', () => {
      const response = requestAdminQuestionCreate(quizId, {
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
          ]
        }
      });
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body.toString())).toStrictEqual({ error: expect.any(String) });
    });

    test('400: timelimit not positive number', () => {
      const response = requestAdminQuestionCreate(quizId, {
        token: token,
        questionBody: {
          question: 'What is the largest mammal in the world?',
          timeLimit: -4,
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
          ]
        }
      });
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body.toString())).toStrictEqual({ error: expect.any(String) });
    });

    test('400: sum of question time limits in quiz exceeds 3 minutes', () => {
      const response = requestAdminQuestionCreate(quizId, {
        token: token,
        questionBody: {
          question: 'What is the largest mammal in the world?',
          timeLimit: 179,
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
      const response2 = requestAdminQuestionCreate(quizId, {
        token: token,
        questionBody: {
          question: 'How many sides on a square',
          timeLimit: 5,
          points: 5,
          answerOptions: [
            {
              answer: '4',
              correct: true
            },
            {
              answer: '3',
              correct: false
            },
            {
              answer: '6',
              correct: false
            }
          ]
        }
      });
      expect(response.statusCode).toBe(200);
      expect(response2.statusCode).toBe(400);
      expect(JSON.parse(response2.body.toString())).toStrictEqual({ error: expect.any(String) });
    });

    test.each([
      0,
      11,
      394
    ])('400: Points awarded for the question are less than 1 or greater than 10)',
      (wrongNumPoints) => {
        const response = requestAdminQuestionCreate(quizId, {
          token: token,
          questionBody: {
            question: 'What is the largest mammal in the world?',
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

    test('400: length of any answers is shorter than 1 character long', () => {
      const response = requestAdminQuestionCreate(quizId, {
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
              answer: '',
              correct: false
            },
          ]
        }
      });
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body.toString())).toStrictEqual({ error: expect.any(String) });
    });

    test('400: length of any answers is longer than 30 characters', () => {
      const response = requestAdminQuestionCreate(quizId, {
        token: token,
        questionBody: {
          question: 'What is the largest mammal in the world?',
          timeLimit: 4,
          points: 5,
          answerOptions: [
            {
              answer: 'Whale and whale friends that swim together',
              correct: true
            },
            {
              answer: 'Frog',
              correct: false
            },
          ]
        }
      });
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body.toString())).toStrictEqual({ error: expect.any(String) });
    });

    test('400: answer strings are duplicates of one another for the same question', () => {
      const response = requestAdminQuestionCreate(quizId, {
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
              answer: 'Whale',
              correct: false
            },
          ]
        }
      });
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body.toString())).toStrictEqual({ error: expect.any(String) });
    });

    test('400: no correct answers', () => {
      const response = requestAdminQuestionCreate(quizId, {
        token: token,
        questionBody: {
          question: 'What is the largest mammal in the world?',
          timeLimit: 4,
          points: 5,
          answerOptions: [
            {
              answer: 'Cat',
              correct: false
            },
            {
              answer: 'Frog',
              correct: false
            },
          ]
        }
      });
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body.toString())).toStrictEqual({ error: expect.any(String) });
    });

    test('401: empty token', () => {
      const response = requestAdminQuestionCreate(quizId, {
        token: '',
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
      expect(response.statusCode).toBe(401);
      expect(JSON.parse(response.body.toString())).toStrictEqual({ error: expect.any(String) });
    });

    test('401: invalid token', () => {
      const response = requestAdminQuestionCreate(quizId, {
        token: 'notaToken',
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
      expect(response.statusCode).toBe(401);
      expect(JSON.parse(response.body.toString())).toStrictEqual({ error: expect.any(String) });
    });

    test('403: valid token with incorrect owner', () => {
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
      // to check how to retrieve token
      const response = requestAdminQuestionCreate(quizId, {
        token: incorrectUser.token,
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
      expect(response.statusCode).toBe(403);
      expect(JSON.parse(response.body.toString())).toStrictEqual({ error: expect.any(String) });
    });

    test('400: quiz id nonexistent', () => {
      const response = requestAdminQuestionCreate(quizId + 1, {
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
      expect(response.statusCode).toBe(403);
      expect(JSON.parse(response.body.toString())).toStrictEqual({ error: expect.any(String) });
    });
  });
});
