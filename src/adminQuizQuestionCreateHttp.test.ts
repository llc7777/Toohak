/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import request from 'sync-request-curl';
import config from './config.json';

const port = config.port;
const url = config.url;
const SERVER_URL = `${url}:${port}`;
const timeout = 5 * 1000;
let token = {},

const requestAdminQuestionCreate = (quizId: number, quizQuestionId: number, body: { 
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
  return request('POST', `${SERVER_URL}/v1/admin/quiz/${quizId}/question`, {
    json: { 
      token: body.token, 
      questionBody:{
        question: body.questionBody.question,
        timeLimit: body.questionBody.timeLimit,
        points: body.questionBody.points,
        answerOptions: body.questionBody.answerOptions
      } },
  });
};

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

});

describe('Test for POST /v1/admin/quiz/{quizId}/question', () => {
  // successful cases
  test('200: working case with 1 question', ()=> {
    const response = requestAdminQuestionCreate(quiz.quizId, { 
      token: token,
      questionBody: {
        question: "What is the largest mammal in the world?",
        timeLimit: 4,
        points: 5,
        answerOptions: [
          {
            answer: "Whale",
            correct: true
          },
          {
            answer: "Frog",
            correct: false
          }
        ]
      } 
    });
    expect(response.statusCode).toBe(200);
  });

  describe('error cases', () => {
    test.each([
      "Who?",
      "A question string that is greater than fifty characters and is too long"
    ])('400: question string less than 5 or greater than 50', (WrongLengthQuestion) => {
      const response = requestAdminQuestionCreate(quiz.quizId, { 
        token: token,
        questionBody: {
          question: WrongLengthQuestion,
          timeLimit: 4,
          points: 5,
          answerOptions: [
            {
              answer: "Whale",
              correct: true
            },
            {
              answer: "Frog",
              correct: false
            }
          ]
        } 
      });
    })
      expect(response.statusCode).toBe(400);
    });

    test('400: question has more than 6 answers', ()=> {
      const response = requestAdminQuestionCreate(quiz.quizId, { 
        token: token,
        questionBody: {
          question: "What is the largest mammal in the world?",
          timeLimit: 4,
          points: 5,
          answerOptions: [
            {
              answer: "Whale",
              correct: true
            },
            {
              answer: "Frog",
              correct: false
            },
            {
              answer: "Cat",
              correct: false
            },
            {
              answer: "Mouse",
              correct: false
            },
            {
              answer: "Dog",
              correct: false
            },
            {
              answer: "Spider",
              correct: false
            },
            {
              answer: "Lizard",
              correct: false
            },
          ]
        } 
      });
      expect(response.statusCode).toBe(400);
    });
    test('400: question has less than 2 answers', ()=> {
      const response = requestAdminQuestionCreate(quiz.quizId, { 
        token: token,
        questionBody: {
          question: "What is the largest mammal in the world?",
          timeLimit: 4,
          points: 5,
          answerOptions: [
            {
              answer: "Whale",
              correct: true
            },
          ]
        } 
      });
      expect(response.statusCode).toBe(400);
    });

    test('400: timelimit not positive number', ()=> {
      const response = requestAdminQuestionCreate(quiz.quizId, { 
        token: token,
        questionBody: {
          question: "What is the largest mammal in the world?",
          timeLimit: -4,
          points: 5,
          answerOptions: [
            {
              answer: "Whale",
              correct: true
            },
            {
              answer: "Frog",
              correct: false
            },
          ]
        } 
      });
      expect(response.statusCode).toBe(400);
    });
    
    // TO DO COMPLETE THIS TEST
    test.todo('400: sum of question time limits in quiz are less than 1 or greater than 10');
    
    test('400: length of any answers is shorter than 1 character long', ()=> {
      const response = requestAdminQuestionCreate(quiz.quizId, { 
        token: token,
        questionBody: {
          question: "What is the largest mammal in the world?",
          timeLimit: 4,
          points: 5,
          answerOptions: [
            {
              answer: "Whale",
              correct: true
            },
            {
              answer: "",
              correct: false
            },
          ]
        } 
      });
      expect(response.statusCode).toBe(400);
    });

    test('400: length of any answers is longer than 30 characters', ()=> {
      const response = requestAdminQuestionCreate(quiz.quizId, { 
        token: token,
        questionBody: {
          question: "What is the largest mammal in the world?",
          timeLimit: 4,
          points: 5,
          answerOptions: [
            {
              answer: "Whale and whale friends that swim together",
              correct: true
            },
            {
              answer: "Frog",
              correct: false
            },
          ]
        } 
      });
      expect(response.statusCode).toBe(400);
    });
    
    test('400: answer strings are duplicates of one another for the same question', ()=> {
      const response = requestAdminQuestionCreate(quiz.quizId, { 
        token: token,
        questionBody: {
          question: "What is the largest mammal in the world?",
          timeLimit: 4,
          points: 5,
          answerOptions: [
            {
              answer: "Whale",
              correct: true
            },
            {
              answer: "Whale",
              correct: false
            },
          ]
        } 
      });
      expect(response.statusCode).toBe(400);
    });

    test('400: no correct answers', ()=> {
      const response = requestAdminQuestionCreate(quiz.quizId, { 
        token: token,
        questionBody: {
          question: "What is the largest mammal in the world?",
          timeLimit: 4,
          points: 5,
          answerOptions: [
            {
              answer: "Cat",
              correct: false
            },
            {
              answer: "Frog",
              correct: false
            },
          ]
        } 
      });
      expect(response.statusCode).toBe(400);
    });

    test('401: empty token', () => {
      const response = requestAdminQuestionCreate(quiz.quizId, { 
        token: '',
        questionBody: {
          question: "What is the largest mammal in the world?",
          timeLimit: 4,
          points: 5,
          answerOptions: [
            {
              answer: "Whale",
              correct: true
            },
            {
              answer: "Frog",
              correct: false
            }
          ]
        } 
      });
      expect(response.statusCode).toBe(401);
    });

    test('401: invalid token', () => {
      const response = requestAdminQuestionCreate(quiz.quizId, { 
        token: 'notaToken', 
        questionBody: {
          question: "What is the largest mammal in the world?",
          timeLimit: 4,
          points: 5,
          answerOptions: [
            {
              answer: "Whale",
              correct: true
            },
            {
              answer: "Frog",
              correct: false
            }
          ]
        } 
      });
      expect(response.statusCode).toBe(401);
    });

    test('403: valid token with incorrect owner', () => {
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
      // to check how to retrieve token
      const response = requestAdminQuestionCreate(quiz.quizId, { 
        token: incorrectUser.token,
        questionBody: {
          question: "What is the largest mammal in the world?",
          timeLimit: 4,
          points: 5,
          answerOptions: [
            {
              answer: "Whale",
              correct: true
            },
            {
              answer: "Frog",
              correct: false
            }
          ]
        } 
      });
      expect(response.statusCode).toBe(403);
    });

    test('400: quiz id nonexistent', () => {
      const response = requestAdminQuestionCreate(quiz.quizId + 1, { 
        token: incorrectUser.token,
        questionBody: {
          question: "What is the largest mammal in the world?",
          timeLimit: 4,
          points: 5,
          answerOptions: [
            {
              answer: "Whale",
              correct: true
            },
            {
              answer: "Frog",
              correct: false
            }
          ]
        } 
      });
      expect(response.statusCode).toBe(403);
    });
})