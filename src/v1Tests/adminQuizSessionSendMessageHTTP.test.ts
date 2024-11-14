import request from 'sync-request-curl';
import { port, url } from '../config.json';
import { AnswerOptionsReq } from '../interfaces';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

let token: string;
let quizId: number;
let sessionId: number;

function adminAuthRegisterWrapper(
  email: string,
  password: string,
  nameFirst: string,
  nameLast: string
): string {
  const userTokenRes = request('POST', SERVER_URL + '/v1/admin/auth/register', {
    json: {
      email,
      password,
      nameFirst,
      nameLast,
    }
  });
  return JSON.parse(userTokenRes.body.toString()).token;
}

function adminQuizCreateWrapper(
  token: string,
  name: string,
  description: string
) {
  const quizRes = request('POST', SERVER_URL + '/v2/admin/quiz', {
    json: {
      name,
      description,
    },
    headers: { token },
  });
  return JSON.parse(quizRes.body.toString()).quizId;
}

function adminQuizQuestionCreateWrapper(
  token: string,
  quizId: number,
  questionBody: {
      question: string,
      timeLimit: number,
      points: number,
      answerOptions: AnswerOptionsReq[]
      thumbnailUrl: string,
    }
) {
  request('POST', SERVER_URL + `/v2/admin/quiz/${quizId}/question`, {
    json: { questionBody },
    headers: { token },
  });
}

function sessionCreateWrapper(
  token: string,
  quizId: number,
  autoStartNum: number
) {
  const req = request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}/session/start`, {
    json: {
      autoStartNum,
    },
    headers: { token },
  });
  return (JSON.parse(req.body.toString())).sessionId;
}
const playerJoinRequest = (body: { sessionId: number, playerName: string }) => {
  return request('POST', `${SERVER_URL}/v1/player/join`, {
    json: {
      sessionId: body.sessionId,
      playerName: body.playerName
    },
  });
};

function sendMessageWrapper(
  playerId: number,
  messageToSend: string
) {
  const res = request('POST', SERVER_URL + `/v1/player/${playerId}/chat`, {
    json: {
      message: {
        messageBody: messageToSend,
      }
    }
  });
  return res;
}

beforeEach(() => {
  request('DELETE', SERVER_URL + '/v1/clear', { timeout: TIMEOUT_MS });

  token = adminAuthRegisterWrapper(
    'jake.renzella@gmail.com', 'password123', 'Jake', 'Renzella'
  );

  quizId = adminQuizCreateWrapper(
    token, 'A basic quiz', 'Just a normal quiz'
  );

  request('POST', `${SERVER_URL}/v2/admin/quiz/${quizId}/question`, {
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
        ],
        thumbnailUrl: 'http://google.com/some/image/path.jpg'
      }
    },
    headers: { token }
  });

  adminQuizQuestionCreateWrapper(token, quizId, {
    question: 'What is two plus two',
    timeLimit: 5,
    points: 5,
    answerOptions: [
      {
        answer: 'Four',
        correct: true,
      },
      {
        answer: 'Five',
        correct: false,
      }
    ],
    thumbnailUrl: 'http://google.com/some/image/path.jpg',
  });

  sessionId = sessionCreateWrapper(token, quizId, 3);
});

describe('/v1/player/{playersId}/chat', () => {
  test('playerId does not exists', () => {
    const res = sendMessageWrapper(12345, 'hello everyone');

    expect(JSON.parse(toString())).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toStrictEqual(400);
  });

  test('message body is less than one character', () => {
    const playerRes = playerJoinRequest({ sessionId: sessionId, playerName: 'Hayden Smith' });
    const playerId = JSON.parse(playerRes.body.toString()).playerId;

    const res = sendMessageWrapper(playerId, '');

    expect(JSON.parse(toString())).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toStrictEqual(400);
  });

  test('message body is more than one-hundred characters', () => {
    const playerRes = playerJoinRequest({ sessionId: sessionId, playerName: 'Hayden Smith' });
    const playerId = JSON.parse(playerRes.body.toString()).playerId;

    const longMessage = 'Hey everyone! I would like to give you all a warm welcome to this quiz.' +
      'I think it would be really great if everyone could turn of their mobile devices and give' +
      'their undivided attention to me.';

    const res = sendMessageWrapper(playerId, longMessage);

    expect(JSON.parse(toString())).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toStrictEqual(400);
  });

  test('successfully send message', () => {
    const playerRes = playerJoinRequest({ sessionId: sessionId, playerName: 'Hayden Smith' });
    const playerId = JSON.parse(playerRes.body.toString()).playerId;

    const res = sendMessageWrapper(playerId, 'How is everyone doing?');

    expect(JSON.parse(toString())).toStrictEqual({ });
    expect(res.statusCode).toStrictEqual(200);
  });
});
