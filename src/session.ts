import { getData } from './dataStore';
import {
  decodeToken,
  findUserFromToken,
  findQuizFromQuizId,
  findQuizInTrash,
  generateRandomSessionId,
  countDownTillQuestionStart,
  adminQuizSessionViewErrorChecking,
  adminQuizSessionStatusErrorChecking,
  findSession,
  countDownTillQuestionClose,
  findSessionFromSessionId,
  generateGuestName,
  findSessionFromPlayerId,
  sendChatMessageErrorChecking,
  getChatMessageInfoErrorMessaging,
  adminQuizSessionResultsErrorChecking,
  getAvarageAnswerTime
} from './helper';
import {
  User,
  Quiz,
  Token,
  Data,
  Session,
  SessionId,
  QuizSessionsResponse,
  QuizSessionStatusResponse,
  SessionResultResponse,
  PlayerId,
  AnswerOptions,
  sessionPlayer
} from './interfaces';

/**
 * Start a new quiz session
 * @param {number} quizId - The ID of the quiz to start a session for
 * @param {string} token - The user's authentication token
 * @param {number} autoStartNum - The number of players that will automatically start the quiz
 * @returns {SessionId} - The ID of the new session
 */
export function adminQuizSessionStart(
  quizId: number,
  token: string,
  autoStartNum: number): SessionId {
  const data: Data = getData();

  // Error checking for 401s
  if (token === '') {
    throw new Error('401 - Token is empty');
  }

  const tokenData: Token = decodeToken(token);
  const user: User = findUserFromToken(tokenData);

  if (!user) {
    throw new Error('401 - Token is invalid');
  }

  // Check if the quiz is in the trash
  const quizInTrash: Quiz = findQuizInTrash(quizId);

  // Throw an error if the quiz is in the trash
  if (quizInTrash) {
    throw new Error('400 - Quiz is in trash');
  }

  // Find the quiz with the given quiz ID
  const quiz = findQuizFromQuizId(quizId);

  // Throw an error if the quiz does not exist
  if (!quiz) {
    throw new Error('403 - Quiz does not exist');
  }

  // Throw an error if the user does not own the quiz
  if (quiz.authUserId !== user.authUserId) {
    throw new Error('403 - User does not own the quiz');
  }

  // Throw an error if autoStartNum is greater than 50
  if (autoStartNum > 50) {
    throw new Error('400 - autoStartNum should be less than 50');
  }

  // Check if there are more than 10 active sessions for this quiz
  const nonEndedSessionsCount: number = data.sessions.filter(
    session => session.state !== 'END' &&
      session.metadata.quizId === quizId).length;
  // Throw an error if there are more than 10 active sessions for this quiz
  if (nonEndedSessionsCount >= 10) {
    throw new Error('400 - There are more than 10 active sessions for this quiz');
  }

  // Throw an error if the quiz does not have any questions
  if (quiz.questions.length === 0) {
    throw new Error('400 - Quiz does not have any questions');
  }

  // Generate a random session ID
  const sessionId: number = generateRandomSessionId();

  // Create a new session
  const session: Session = {
    autoStartNum,
    sessionId,
    state: 'LOBBY',
    atQuestion: 0,
    players: [],
    metadata: quiz,
    messages: [],
  };

  // Add the session to the data
  data.sessions.push(session);

  // Return the session ID
  return { sessionId };
}

/**
 * Update the state of a quiz session
 * @param {number} quizId - The ID of the quiz
 * @param {number} sessionId - The ID of the session
 * @param {string} token - The user's authentication token
 * @param {string} action - The action to perform on the session
 * @returns {object} - An empty object
 */
export function adminQuizSessionUpdate(
  quizId: number, sessionId: number, token: string, action: string): object {
  const data: Data = getData();

  // Error checking for 401s
  if (token === '') {
    throw new Error('401 - Token is empty');
  }

  const tokenData: Token = decodeToken(token);
  const user: User = findUserFromToken(tokenData);

  if (!user) {
    throw new Error('401 - Token is invalid');
  }

  // Find the quiz with the given quiz ID
  const quiz: Quiz | undefined = findQuizFromQuizId(quizId);

  // Throw an error if the quiz does not exist
  if (!quiz) {
    throw new Error('403 - Quiz does not exist');
  }
  // Throw an error if the user does not own the quiz
  if (quiz.authUserId !== user.authUserId) {
    throw new Error('403 - User does not own the quiz');
  }

  // Find the session with the given session ID and quiz ID
  const session = data.sessions.find(session => session.sessionId === sessionId &&
    session.metadata.quizId === quizId);

  // Throw an error if the session does not exist
  if (!session) {
    throw new Error('400 - Valid session does not exist');
  }

  // Array of valid action commands
  const actionCommand = [
    'NEXT_QUESTION',
    'SKIP_COUNTDOWN',
    'GO_TO_ANSWER',
    'GO_TO_FINAL_RESULTS',
    'END'];

  // Check if the action is valid
  if (!actionCommand.includes(action)) {
    throw new Error('400 - Invalid action');
  }

  let skipCountdownTimer: ReturnType<typeof setTimeout>;
  let timeLimitTimer: ReturnType<typeof setTimeout>;

  if (session.state === 'LOBBY') {
    if (action === 'END') {
      session.state = 'END';
    } else if (action === 'NEXT_QUESTION') {
      session.state = 'QUESTION_COUNTDOWN';
      session.atQuestion++;
      countDownTillQuestionStart(session, skipCountdownTimer, timeLimitTimer);
    } else {
      throw new Error('400 - Action cannot be applied to the current state');
    }
  } else if (session.state === 'QUESTION_COUNTDOWN') {
    if (action === 'END') {
      session.state = 'END';
    } else if (action === 'SKIP_COUNTDOWN') {
      clearTimeout(skipCountdownTimer);
      session.state = 'QUESTION_OPEN';
      session.metadata.questions[session.atQuestion - 1].timeOpened = Math.floor(Date.now() / 1000);
      // After clear timeout, start new timer for question close
      countDownTillQuestionClose(session, timeLimitTimer);
    } else {
      throw new Error('400 - Action cannot be applied to the current state');
    }
  } else if (session.state === 'QUESTION_OPEN') {
    if (action === 'END') {
      clearTimeout(timeLimitTimer);
      session.state = 'END';
    } else if (action === 'GO_TO_ANSWER') {
      clearTimeout(timeLimitTimer);
      session.state = 'ANSWER_SHOW';
    } else {
      throw new Error('400 - Action cannot be applied to the current state');
    }
  } else if (session.state === 'QUESTION_CLOSE') {
    if (action === 'GO_TO_ANSWER') {
      session.state = 'ANSWER_SHOW';
    } else if (action === 'END') {
      session.state = 'END';
    } else if (action === 'NEXT_QUESTION') {
      session.state = 'QUESTION_COUNTDOWN';
      countDownTillQuestionStart(session, skipCountdownTimer, timeLimitTimer);
    } else if (action === 'GO_TO_FINAL_RESULTS') {
      session.state = 'FINAL_RESULTS';
    } else {
      throw new Error('400 - Action cannot be applied to the current state');
    }
  } else if (session.state === 'ANSWER_SHOW') {
    if (action === 'NEXT_QUESTION') {
      session.state = 'QUESTION_COUNTDOWN';
      countDownTillQuestionStart(session, skipCountdownTimer, timeLimitTimer);
    } else if (action === 'GO_TO_FINAL_RESULTS') {
      session.state = 'FINAL_RESULTS';
    } else if (action === 'END') {
      session.state = 'END';
    } else {
      throw new Error('400 - Action cannot be applied to the current state');
    }
  } else if (session.state === 'FINAL_RESULTS') {
    if (action === 'END') {
      session.state = 'END';
    } else {
      throw new Error('400 - Action cannot be applied to the current state');
    }
  }

  return {};
}

/** Retrieves active and inactive sessions for a specific quiz based on the quiz ID.
  *
  * @param { number } quizId - The ID of the quiz
  * @param { string } token - The authorization token of the user
  * @returns { QuizSessionsResponse } - An object containing arrays of active and inactive sessionID
  */
export function adminQuizSessionView(
  quizId: number, token: string
): QuizSessionsResponse {
  // Error checking using helper function
  adminQuizSessionViewErrorChecking(quizId, token);

  const data: Data = getData();

  // Filter sessions for the quiz
  const activeSessions: number[] = [];
  const inactiveSessions: number[] = [];

  data.sessions.forEach((session) => {
    if (session.state !== 'END') {
      activeSessions.push(session.sessionId);
    } else {
      inactiveSessions.push(session.sessionId);
    }
  });

  // Sort sessions in ascending order
  activeSessions.sort((a, b) => a - b);
  inactiveSessions.sort((a, b) => a - b);
  // Return the session data
  return {
    activeSessions,
    inactiveSessions,
  };
}

/**
   * Retrieves the status of a quiz session for a given quiz ID and session ID.
   *
   * @param {number} quizId - The unique identifier of the quiz.
   * @param {number} sessionId - The unique identifier of the quiz session.
   * @param {string} token - The authentication token of the user.
   *
   * @returns {QuizSessionStatusResponse} - The detailed status of the quiz session.
   */
export function adminQuizSessionStatus(
  quizId: number, sessionId: number, token: string
): QuizSessionStatusResponse {
  // Helper function for error checking
  adminQuizSessionStatusErrorChecking(quizId, sessionId, token);

  const session = findSession(quizId, sessionId);
  const response: QuizSessionStatusResponse = {
    state: session.state,
    atQuestion: session.state === 'LOBBY' || session.state === 'FINAL_RESULTS' ||
      session.state === 'END'
      ? 0
      : session.atQuestion,
    players: session.players.map(player => player.name).sort(), // in ascending order
    metadata: {
      quizId: session.metadata.quizId,
      name: session.metadata.name,
      timeCreated: session.metadata.timeCreated,
      timeLastEdited: session.metadata.timeLastEdited,
      description: session.metadata.description,
      numQuestions: session.metadata.questions.length,
      questions: session.metadata.questions.map(question => ({
        questionId: question.questionId,
        question: question.question,
        timeLimit: question.timeLimit,
        thumbnailUrl: question.thumbnailUrl,
        points: question.points,
        answerOptions: question.answerOptions.map(option => ({
          answerId: option.answerId,
          answer: option.answer,
          colour: option.colour,
          correct: option.correct,
        })),
      })),
      timeLimit: session.metadata.timeLimit,
      thumbnailUrl: session.metadata.thumbnailUrl,
    }
  };
  return response;
}

export function adminQuizSessionResult(
  quizId: number, sessionId: number, token: string
): SessionResultResponse {
  // Error checking
  adminQuizSessionResultsErrorChecking(quizId, sessionId, token);

  // Session details
  const session = findSession(quizId, sessionId);

  // Ranked players sort by score in descending order
  const rankedPlayers = session.players
    .sort((a, b) => b.score - a.score)
    .map(player => ({
      playerName: player.name,
      score: player.score,
    }));

  // Map questions to results
  const questionResults = session.metadata.questions.map(question => ({
    questionId: question.questionId,
    playersCorrect: session.players
      .filter(player => question.playersCorrect.includes(player.name))
      .map(player => player.name)
      .sort(), // sort in ascending alphabetical order
    averageAnswerTime: getAvarageAnswerTime(question),
    percentCorrect: session.players.length
      ? Math.round((question.playersCorrect.length / session.players.length) * 100)
      : 0,
  }));

  return {
    usersRankedByScore: rankedPlayers,
    questionResults,
  };
}

/** Allows player to join session using session number and player name
 *
 * @param sessionId
 * @param playerName
 * @returns
 */
export function playerJoin(sessionId: number, playerName: string): PlayerId {
  const validName = /^[a-zA-z0-9 ]+$/;
  // invalid name
  if (!validName.test(playerName) && playerName !== '') {
    throw new Error('400 - Invalid name');
  }

  const session = findSessionFromSessionId(sessionId);
  // session id doesn't exist
  if (!session) {
    throw new Error('400 - Session Id does not refer to a valid session');
  }
  // session not in lobby
  if (session.state !== 'LOBBY') {
    throw new Error('400 - Session is not in lobby state');
  }

  // player needs unique name
  const duplicateName = session.players.some(player => player.name === playerName);
  if (duplicateName) {
    throw new Error('400 - Player must have a unique name');
  }

  if (playerName === '') {
    playerName = generateGuestName();
  }

  let playerId: number = 0;
  for (const session of getData().sessions) {
    playerId += session.players.length;
  }

  session.players.push({
    playerId: playerId,
    name: playerName,
    score: 0,
  });

  if (session.players.length === session.autoStartNum) {
    session.state = 'QUESTION_COUNTDOWN';
  }
  return { playerId };
}

/** Gives player status from playerid
 *
 * @param playerId
 * @returns
 */
export function playerStatus(playerId: number) {
  const session = findSessionFromPlayerId(playerId);
  // session id doesn't exist
  if (!session) {
    throw new Error('400 - Player Id does not exist');
  }

  return {
    state: session.state,
    numQuestions: session.metadata.questions.length,
    atQuestion: session.atQuestion
  };
}

export function sendChatMessage(playerId: number, message: string) {
  sendChatMessageErrorChecking(playerId, message);

  const session = findSessionFromPlayerId(playerId);
  const player = session.players.find(player => player.playerId === playerId);
  const newMessage = {
    messageBody: message,
    playerId: playerId,
    playerName: player.name,
    timeSent: Math.floor(Date.now() / 1000),
  };
  session.messages.push(newMessage);
}

export function getChatMessageInfo(playerId: number) {
  getChatMessageInfoErrorMessaging(playerId);

  const session = findSessionFromPlayerId(playerId);

  return {
    messages: session.messages
  };
}

/**
* Get the information about a question the guest player is on.
* @param {number} playerId - The ID of the player
* @param {number} questionPosition - The position of the question (starting at 1)
* @returns {object} - The question details
*/

export function getPlayerQuestion(
  playerId: number,
  questionPosition: number
): object {
  const data = getData();
  const session = data.sessions.find((s: Session) =>
    s.players.some((p: sessionPlayer) => p.playerId === playerId)
  );

  if (!session) {
    throw new Error('400 - Player ID does not exist in any session');
  }

  if (session.state !== 'QUESTION_OPEN') {
    throw new Error(`400 - Session is not in a valid state to access questions. Current state:
  ${session.state}`);
  }

  const totalQuestions = session.metadata.questions.length;

  if (
    typeof questionPosition !== 'number' ||
  questionPosition < 1 ||
  questionPosition > totalQuestions
  ) {
    throw new Error(`400 - Invalid question position. Valid range is 1 to ${totalQuestions}`);
  }
  if (session.atQuestion !== questionPosition) {
    throw new Error('400 - Session is not currently on the requested question');
  }

  const question = session.metadata.questions[questionPosition - 1];

  return {
    questionId: question.questionId,
    question: question.question,
    timeLimit: question.timeLimit,
    thumbnailUrl: question.thumbnailUrl,
    points: question.points,
    answerOptions: question.answerOptions.map((option: AnswerOptions) => ({
      answerId: option.answerId,
      answer: option.answer,
      colour: option.colour,
      correct: option.correct,
    })),
  };
}

export function playerSubmitAnswer(
  playerId: number,
  questionPosition: number,
  answerIds: number[]
): object {
  // Find the session the player belongs to
  const session = findSessionFromPlayerId(playerId);
  console.log(session);

  if (!session) {
    throw new Error('400 - Player ID does not exist in any session');
  }

  if (session.state !== 'QUESTION_OPEN') {
    throw new Error('400 - Session is not in QUESTION_OPEN state');
  }

  const totalQuestions = session.metadata.questions.length;
  if (questionPosition < 1 || questionPosition > totalQuestions) {
    throw new Error(`400 - Invalid question position. Valid range is 1 to ${totalQuestions}`);
  }

  if (session.atQuestion !== questionPosition) {
    throw new Error('400 - Session is not currently on the requested question');
  }

  const question = session.metadata.questions[questionPosition - 1];

  const validAnswerIds = question.answerOptions.map((option: AnswerOptions) => option.answerId);
  const invalidAnswers = answerIds.filter((id) => !validAnswerIds.includes(id));
  if (invalidAnswers.length > 0) {
    throw new Error(
      `400 - The following answer IDs are invalid: ${invalidAnswers.join(', ')}`
    );
  }

  const uniqueAnswers = new Set(answerIds);
  if (uniqueAnswers.size !== answerIds.length) {
    throw new Error('400 - Duplicate answer IDs provided');
  }

  if (answerIds.length < 1) {
    throw new Error('400 - At least one answer ID must be provided');
  }

  const player = session.players.find((p: sessionPlayer) => p.playerId === playerId);

  const currentTime = Math.floor(Date.now() / 1000);
  const timeTaken = currentTime - (question.timeOpened);

  // Ensure playerAnswerInfo exists for the question
  const playerAnswerIndex = question.playersAnswered.findIndex(
    (entry) => entry.playerId === playerId.toString()
  );

  if (playerAnswerIndex === -1) {
    question.playersAnswered.push({
      playerId: playerId.toString(),
      timeAnswered: timeTaken,
    });
  } else {
    question.playersAnswered[playerAnswerIndex].timeAnswered = timeTaken;
  }

  const correctAnswers =
    question.answerOptions.filter((option) => option.correct).map((option) => option.answerId);
  const isCorrect =
    answerIds.length === correctAnswers.length &&
    answerIds.every((id) => correctAnswers.includes(id));

  if (isCorrect) {
    if (!question.playersCorrect.includes(playerId.toString())) {
      question.playersCorrect.push(playerId.toString());
    }
    player.score += question.points / question.playersCorrect.length;
  }

  return {};
}

/**
 * Get the result of a question for a player session
 *
 * @param playerId {number} - The ID of the player
 * @param questionPosition {number} - The position of the question
 * @returns {object} - The question result details
 */
export function playerQuestionResult(
  playerId: number,
  questionPosition: number
): object {
  const data = getData();

  // Find the session the player belongs to
  const session = data.sessions.find(function(s) {
    return s.players.some(function(p) {
      return p.playerId === playerId;
    });
  });

  if (!session) {
    throw new Error('400 - Player ID does not exist in any session');
  }

  // Validate the session state
  if (session.state !== 'ANSWER_SHOW') {
    throw new Error('400 - Session is not in ANSWER_SHOW state');
  }

  const totalQuestions = session.metadata.questions.length;

  // Validate question position
  if (
    typeof questionPosition !== 'number' ||
    questionPosition < 1 ||
    questionPosition > totalQuestions
  ) {
    throw new Error('400 - Invalid question position. Valid range is 1 to ' + totalQuestions);
  }

  if (session.atQuestion !== questionPosition) {
    throw new Error('400 - Session is not currently on the requested question');
  }

  const question = session.metadata.questions[questionPosition - 1];
  if (!question) {
    throw new Error('400 - Question does not exist');
  }

  // Calculate the percentage of players who answered correctly
  const percentCorrect = Math.round(
    (question.playersCorrect.length / session.players.length) * 100
  );

  // Calculate the average answer time for this question
  const totalAnswerTime = question.playersAnswered.reduce(function(sum, entry) {
    return sum + entry.timeAnswered;
  }, 0);

  let averageAnswerTime = 0;
  if (question.playersAnswered.length > 0) {
    averageAnswerTime = Math.round(totalAnswerTime / question.playersAnswered.length);
  }

  // Get the names of players who answered correctly
  const playersCorrect = question.playersCorrect.map(function(playerId) {
    const player = session.players.find(function(p) {
      return p.playerId.toString() === playerId;
    });
    if (player) {
      return player.name;
    }
    return null;
  }).filter(function(name) {
    return name !== null;
  });

  return {
    questionId: question.questionId,
    playersCorrect: playersCorrect,
    averageAnswerTime: averageAnswerTime,
    percentCorrect: percentCorrect,
  };
}
