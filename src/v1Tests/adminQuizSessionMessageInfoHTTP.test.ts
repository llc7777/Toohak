import request from 'sync-request-curl';
import { port, url } from '../config.json';
import { AnswerOptionsReq } from '../interfaces';
import { info } from 'console';

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

function getChatMessageInfo(
  playerId: number,
) {
  const res = request('GET', SERVER_URL + `/v1/player/${playerId}/chat`);
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

    expect(JSON.parse(res.body.toString())).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toStrictEqual(400);

    const infoRes = getChatMessageInfo(12345);
    expect(JSON.parse(infoRes.body.toString())).toStrictEqual({ error: expect.any(String) });
    expect(infoRes.statusCode).toStrictEqual(400);
  });

  test('successfully get info for a single message', () => {
    const playerRes = playerJoinRequest({ sessionId: sessionId, playerName: 'Hayden Smith' });
    const playerId = JSON.parse(playerRes.body.toString()).playerId;

    const res = sendMessageWrapper(playerId, 'How is everyone doing?');

    expect(JSON.parse(res.body.toString())).toStrictEqual({ });
    expect(res.statusCode).toStrictEqual(200);
  });

  test('successfully get info for a single message', () => {
    const playerRes = playerJoinRequest({ sessionId: sessionId, playerName: 'Hayden Smith' });
    const playerId = JSON.parse(playerRes.body.toString()).playerId;

    const res = sendMessageWrapper(playerId, 'How is everyone doing?');

    expect(JSON.parse(res.body.toString())).toStrictEqual({ });
    expect(res.statusCode).toStrictEqual(200);

    const infoRes = getChatMessageInfo(playerId);
    expect(JSON.parse(infoRes.body.toString())).toStrictEqual({
      messages: [
        {
          messageBody: 'How is everyone doing?',
          playerId: playerId,
          playerName: 'HaydenSmith',
          timeSent: expect.any(Number),
        }
      ] 
    });
    expect(infoRes.statusCode).toStrictEqual(200);
  });

  test('successfully get info for a multiple message', () => {
    const playerRes = playerJoinRequest({ sessionId: sessionId, playerName: 'Hayden Smith' });
    const playerId = JSON.parse(playerRes.body.toString()).playerId;

    const res = sendMessageWrapper(playerId, 'How is everyone doing?');

    expect(JSON.parse(res.body.toString())).toStrictEqual({ });
    expect(res.statusCode).toStrictEqual(200);

    sendMessageWrapper(playerId, 'Why is no one responding :(')

    const infoRes = getChatMessageInfo(playerId);
    expect(JSON.parse(infoRes.body.toString())).toStrictEqual({
      messages: [
        {
          messageBody: 'How is everyone doing?',
          playerId: playerId,
          playerName: 'Hayden Smith',
          timeSent: expect.any(Number),
        },
        {
          messageBody: 'Why is no one responding :(',
          playerId: playerId,
          playerName: 'Hayden Smith',
          timeSent: expect.any(Number),
        }
      ] 
    });
    expect(infoRes.statusCode).toStrictEqual(200);
  });
});
