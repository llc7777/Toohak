import express, { json, Request, Response } from 'express';
import { echo } from './newecho';
import morgan from 'morgan';
import config from './config.json';
import cors from 'cors';
import YAML from 'yaml';
import sui from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import process from 'process';
import {
  adminAuthRegister, adminAuthLogin,
  adminUserPasswordUpdate, adminUserDetails,
  adminUserDetailsUpdate, adminAuthLogout,
} from './auth';
import {
  adminQuizCreate, adminQuizList,
  adminQuizRemove, adminQuizInfo,
  adminQuizNameUpdate, adminQuizDescriptionUpdate,
  adminQuizTrashList,
  adminQuizRestore,
  adminQuizTransfer,
  adminQuizSessionStart,
} from './quiz';
import {
  adminQuizQuestionCreate,
  adminQuizMoveQuestion,
  adminQuizQuestionDuplicate,
  adminQuizQuestionUpdate,
  adminQuizQuestionDelete
} from './question';
import { clear, emptyTrash } from './other';
import { encodedTokenExists } from './helper';
import { getData } from './dataStore';
import {
  AdminUserDetailsUpdateRequest,
  AdminUserDetailsUpdateV2Request,
  QuestionCreateReq,
  QuestionIdObject,
  QuizID,
  AuthLoginRes,
  SessionStartReturn,
} from './interfaces';

// Set up web app
const app = express();
// Use middleware that allows us to access the JSON body of requests
app.use(json());
// Use middleware that allows for access from other domains
app.use(cors());
// for logging errors (print to terminal)
app.use(morgan('dev'));
// for producing the docs that define the API
const file = fs.readFileSync(path.join(process.cwd(), 'swagger.yaml'), 'utf8');
app.get('/', (req: Request, res: Response) => res.redirect('/docs'));
app.use('/docs', sui.serve, sui.setup(YAML.parse(file),
  { swaggerOptions: { docExpansion: config.expandDocs ? 'full' : 'list' } }));

const PORT: number = parseInt(process.env.PORT || config.port);

const HOST: string = process.env.IP || '127.0.0.1';

// ====================================================================
//  ================= WORK IS DONE BELOW THIS LINE ===================
// ====================================================================

const DATABASE_FILE = 'dataBase.json';

// Check if data file already exists. If so, get Data from it
if (fs.existsSync(DATABASE_FILE)) {
  let fileData = String(fs.readFileSync(DATABASE_FILE));
  fileData = JSON.parse(fileData);
  // Update the data in dataStore.ts to reflect the data in database file
  const localData = getData();
  Object.assign(localData, fileData);
}

// Function to save data to a file
const saveData = () => {
  fs.writeFileSync(DATABASE_FILE, JSON.stringify(getData()));
};

// Example get request
app.get('/echo', (req: Request, res: Response) => {
  const result = echo(req.query.echo as string);
  if ('error' in result) {
    res.status(400);
  }

  return res.json(result);
});

// routes for auth
app.post('/v1/admin/auth/register', (req: Request, res: Response) => {
  const { email, password, nameFirst, nameLast } = req.body;
  const result = adminAuthRegister(email, password, nameFirst, nameLast);

  if (result.error) {
    return res.status(400).json(result);
  }
  saveData();
  return res.status(200).json(result);
});

app.post('/v1/admin/auth/login', (req: Request, res: Response) => {
  const { email, password }: AuthLoginRes = req.body;

  try {
    const result = adminAuthLogin(email, password);
    saveData();
    return res.status(200).json(result);
  } catch (error) {
    saveData();
    if (error.message) {
      return res.status(400).json({ error: error.message });
    }
  }
});

// adminAuthLogout POST request
app.post('/v1/admin/auth/logout', (req: Request, res: Response) => {
  const token = req.body.token as string;

  try {
    const result: object = adminAuthLogout(token);
    saveData();
    return res.status(200).json(result);
  } catch (e) {
    saveData();
    return res.status(401).json({ error: e.message });
  }
});

app.put('/v1/admin/quiz/:quizId/name', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizId as string);
  const token = req.body.token;
  const name = req.body.name;

  try {
    adminQuizNameUpdate(token, quizId, name);
    saveData();
    return res.status(200).json({});
  } catch (error) {
    saveData();
    if (error.message.includes('401')) {
      return res.status(401).json({ error: error.message });
    } else if (error.message.includes('403')) {
      return res.status(403).json({ error: error.message });
    } else {
      return res.status(400).json({ error: error.message });
    }
  }
});

app.get('/v1/admin/user/details', (req: Request, res: Response) => {
  const token: string = req.query.token as string;

  try {
    const result = adminUserDetails(token);
    saveData();
    return res.status(200).json(result);
  } catch (error) {
    saveData();
    if (error.message) {
      return res.status(401).json({ error: error.message });
    }
  }
});

app.put('/v1/admin/user/details', (req: Request, res: Response) => {
  const { token, email, nameFirst, nameLast }: AdminUserDetailsUpdateRequest = req.body;

  try {
    adminUserDetailsUpdate(token, email, nameFirst, nameLast);
    saveData();
    return res.status(200).json({});
  } catch (error) {
    saveData();
    if (error.message.includes('401')) {
      return res.status(401).json({ error: error.message });
    }
    return res.status(400).json({ error: error.message });
  }
});

// adiminUserPasswordUpdate PUT request
app.put('/v1/admin/user/password', (req: Request, res: Response) => {
  const { token, oldPassword, newPassword } = req.body;
  const result = adminUserPasswordUpdate(token, oldPassword, newPassword);

  if (result.error === 'Token is empty' || result.error === 'Token is invalid') {
    saveData();
    return res.status(401).json(result);
  } else if ('error' in result) {
    saveData();
    return res.status(400).json(result);
  }
  saveData();
  return res.status(200).json(result);
});

// routes for quiz

// adminQuizCreate POST request
app.post('/v1/admin/quiz', (req: Request, res: Response) => {
  const { token, name, description } = req.body;

  try {
    const result: QuizID = adminQuizCreate(token, name, description);
    saveData();
    return res.status(200).json(result);
  } catch (e) {
    saveData();
    if (e.message.includes('401')) {
      return res.status(401).json({ error: e.message });
    } else {
      return res.status(400).json({ error: e.message });
    }
  }
});

// adminQuizList GET request
app.get('/v1/admin/quiz/list', (req: Request, res: Response) => {
  const token = req.query.token as string;

  const result = adminQuizList(token);

  if (result.error) {
    saveData();
    return res.status(401).json(result);
  }
  saveData();
  return res.json(result);
});

// adminQuizTrashList GET request
app.get('/v1/admin/quiz/trash', (req: Request, res: Response) => {
  const token = req.query.token as string;
  const result = adminQuizTrashList(token);

  if ('error' in result) {
    saveData();
    return res.status(401).json(result);
  }
  saveData();
  return res.status(200).json(result);
});

// adminQuizInfo GET request. Gets info for a quiz
app.get('/v1/admin/quiz/:quizId', (req: Request, res: Response) => {
  const quizid = parseInt(req.params.quizId as string);
  const token = req.query.token as string;

  try {
    const result = adminQuizInfo(token, quizid);
    saveData();
    return res.status(200).json(result);
  } catch (error) {
    saveData();
    if (error.message.includes('401')) {
      return res.status(401).json({ error: 'Token is empty or invalid' });
    } else {
      return res.status(403).json({ error: 'User does not own quiz, or it not exist' });
    }
  }
});

// adminQuizDelete DELETE request
app.delete('/v1/admin/quiz/:quizId', (req: Request, res: Response) => {
  const quizid = parseInt(req.params.quizId as string);
  const token = req.query.token as string;

  try {
    adminQuizRemove(token, quizid);
    saveData();
    return res.status(200).json({});
  } catch (err) {
    saveData();
    if (err.message.includes('401')) {
      return res.status(401).json({ error: err.message });
    } else {
      return res.status(403).json({ error: err.message });
    }
  }
});

// PUT request for adminQuizQuestionUpdate
app.put('/v1/admin/quiz/:quizId/question/:questionId', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizId as string);
  const questionId = parseInt(req.params.questionId as string);
  const token = req.body.token as string;
  const { question, answerOptions, timeLimit, points } = req.body.questionBody;

  if (token.length === 0 || !encodedTokenExists(token)) {
    return res.status(401).json({ error: 'Token is empty or invalid.' });
  }

  const updateResult = adminQuizQuestionUpdate(quizId,
    questionId,
    token,
    question,
    timeLimit,
    points,
    answerOptions);
  if ('error' in updateResult) {
    saveData();
    if (updateResult.error === 'No such quiz exists' ||
      updateResult.error === 'User does not own the quiz'
    ) {
      return res.status(403).json(updateResult);
    } else {
      return res.status(400).json(updateResult);
    }
  }

  return res.status(200).json(updateResult);
});

// adminQuizRestore POST request
app.post('/v1/admin/quiz/:quizId/restore', (req: Request, res: Response) => {
  const quizid = parseInt(req.params.quizId as string);
  const { token } = req.body;

  const result = adminQuizRestore(quizid, token);

  if ('error' in result) {
    if (result.error === 'Token is empty' || result.error === 'Token is invalid') {
      saveData();
      return res.status(401).json(result);
    } else if (result.error === 'You do not own quiz ID, or quiz does not exist' ||
      result.error === 'Quiz ID does not refer to a quiz in the trash.'
    ) {
      saveData();
      return res.status(403).json(result);
    } else if ('error' in result) {
      saveData();
      return res.status(400).json(result);
    }
  }
  saveData();
  res.status(200).json(result);
});

// PUT request for adminQuizDescription
app.put('/v1/admin/quiz/:quizId/description', (req: Request, res: Response) => {
  const quizId: number = parseInt(req.params.quizId as string);
  const token: string = req.body.token;
  const description: string = req.body.description;

  try {
    adminQuizDescriptionUpdate(token, quizId, description);
    saveData();
    return res.status(200).json({});
  } catch (error) {
    saveData();
    if ((error as Error).message.includes('401')) {
      return res.status(401).json({ error: (error as Error).message });
    } else if ((error as Error).message.includes('403')) {
      return res.status(403).json({ error: (error as Error).message });
    } else {
      return res.status(400).json({ error: (error as Error).message });
    }
  }
});

// DELETE Request for adminQuizQuestionDelete
app.delete('/v1/admin/quiz/:quizId/question/:questionId', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizId as string);
  const questionId = parseInt(req.params.questionId as string);
  const token = req.query.token as string;

  const result = adminQuizQuestionDelete(token, quizId, questionId);

  if ('error' in result) {
    saveData();
    if (result.error === 'Token is invalid') {
      return res.status(401).json(result);
    } else if (result.error === 'Quiz ID does not refer to a valid quiz.' ||
      result.error === 'User does not own the quiz.') {
      return res.status(403).json(result);
    } else {
      return res.status(400).json(result);
    }
  }
  saveData();
  return res.status(200).json({});
});

// routes for other
app.delete('/v1/clear', (req: Request, res: Response) => {
  res.json(clear());
  saveData();
});

// POST request for adminQuizQuestion
app.post('/v1/admin/quiz/:quizid/question', (req: Request, res: Response) => {
  const quizId: number = parseInt(req.params.quizid as string);
  const token: string = req.body.token;
  const { question, timeLimit, points, answerOptions }: QuestionCreateReq = req.body.questionBody;

  try {
    const result2: QuestionIdObject = adminQuizQuestionCreate(quizId, token, question,
      timeLimit, points, answerOptions, 'v1');
    saveData();
    return res.status(200).json(result2);
  } catch (error) {
    saveData();
    if (error.message.includes('401')) {
      return res.status(401).json({ error: error.message });
    } else if (error.message.includes('403')) {
      return res.status(403).json({ error: error.message });
    } else if (error.message.includes('400')) {
      return res.status(400).json({ error: error.message });
    }
  }
});

// PUT request that moves the position of question in a quiz
app.put('/v1/admin/quiz/:quizid/question/:questionid/move', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid as string);
  const questionId = parseInt(req.params.questionid as string);
  const token = req.body.token;
  const newPosition = parseInt(req.body.newPosition);

  try {
    adminQuizMoveQuestion(token, quizId, questionId, newPosition);
    saveData();
    return res.status(200).json({});
  } catch (err) {
    saveData();
    if (err.message.includes('400')) {
      return res.status(400).json({ error: err.message });
    } else if (err.message.includes('401')) {
      return res.status(401).json({ error: err.message });
    } else if (err.message.includes('403')) {
      return res.status(403).json({ error: err.message });
    }
  }
});

app.delete('/v1/admin/quiz/trash/empty', (req: Request, res: Response) => {
  const token: string = req.query.token as string;
  const quizIds: string = req.query.quizIds as string;

  try {
    const parsedQuizIds: number[] = JSON.parse(quizIds);
    const result = emptyTrash(token, parsedQuizIds);
    saveData();
    res.status(200).json(result);
  } catch (error) {
    saveData();
    if (error.message.includes('401')) {
      return res.status(401).json({ error: error.message });
    } else if (error.message.includes('403')) {
      return res.status(403).json({ error: error.message });
    }
    return res.status(400).json({ error: error.message });
  }
});

// POST request to transfer a quiz to another user
app.post('/v1/admin/quiz/:quizid/transfer', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid as string);
  const token = req.body.token;
  const email = req.body.userEmail;

  try {
    adminQuizTransfer(token, email, quizId);
    saveData();
    return res.status(200).json({});
  } catch (err) {
    saveData();
    if (err.message.includes('400')) {
      return res.status(400).json({ error: err.message });
    } else if (err.message.includes('401')) {
      return res.status(401).json({ error: err.message });
    } else {
      return res.status(403).json({ error: err.message });
    }
  }
});

// admin quiz question duplicate
app.post('/v1/admin/quiz/:quizid/question/:questionid/duplicate', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid as string);
  const token = req.body.token;
  const questionId = parseInt(req.params.questionid as string);

  try {
    const result = adminQuizQuestionDuplicate(quizId, questionId, token);
    saveData();
    return res.status(200).json(result);
  } catch (error) {
    saveData();
    if (error.message.includes('401')) {
      return res.status(401).json({ error: error.message });
    } else if (error.message.includes('403')) {
      return res.status(403).json({ error: error.message });
    } else if (error.message.includes('400')) {
      return res.status(400).json({ error: error.message });
    }
  }
});

// V1 adminQuizSessionStart POST request
app.post('/v1/admin/quiz/:quizid/session/start', (req: Request, res: Response) => {
  const quizId: number = parseInt(req.params.quizid as string);
  const token: string = req.headers.token as string;
  const autoStartNum: number = req.body.autoStartNum as number;

  try {
    const result: SessionStartReturn = adminQuizSessionStart(quizId, token, autoStartNum);
    saveData();
    return res.status(200).json(result);
  } catch (e) {
    saveData();
    if (e.message.includes('401')) {
      return res.status(401).json({ error: e.message });
    } else if (e.message.includes('403')) {
      return res.status(403).json({ error: e.message });
    } else {
      return res.status(400).json({ error: e.message });
    }
  }
});

/*
* ===========================================================================
* ============================= V2 ROUTES BELOW =============================
* ===========================================================================
*/

// adminUserDetails GET request. Gets the details of the admin (non-password)
app.get('/v2/admin/user/details', (req: Request, res: Response) => {
  const token: string = req.headers.token as string;

  try {
    const result = adminUserDetails(token);
    saveData();
    return res.status(200).json(result);
  } catch (error) {
    saveData();
    if (error.message) {
      return res.status(401).json({ error: error.message });
    }
  }
});

// adminUserDetailsUpdate PUT request. Update the details of the admin user (non-password)
app.put('/v2/admin/user/details', (req: Request, res: Response) => {
  const token: string = req.headers.token as string;
  const { email, nameFirst, nameLast }: AdminUserDetailsUpdateV2Request = req.body;

  try {
    adminUserDetailsUpdate(token, email, nameFirst, nameLast);
    saveData();
    return res.status(200).json({});
  } catch (error) {
    saveData();
    if (error.message.includes('401')) {
      return res.status(401).json({ error: error.message });
    }
    return res.status(400).json({ error: error.message });
  }
});

// auth routes
// V2 adminAuthLogout POST request
app.post('/v2/admin/auth/logout', (req: Request, res: Response) => {
  const token = req.headers.token as string;

  try {
    const result: object = adminAuthLogout(token);
    saveData();
    return res.status(200).json(result);
  } catch (e) {
    saveData();
    return res.status(401).json({ error: e.message });
  }
});

// quiz routes

// V2 adminQuizCreate POST request
app.post('/v2/admin/quiz', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const { name, description } = req.body;

  try {
    const result: QuizID = adminQuizCreate(token, name, description);
    saveData();
    return res.status(200).json(result);
  } catch (e) {
    saveData();
    if (e.message.includes('401')) {
      return res.status(401).json({ error: e.message });
    } else {
      return res.status(400).json({ error: e.message });
    }
  }
});

app.delete('/v2/admin/quiz/trash/empty', (req: Request, res: Response) => {
  const token: string = req.headers.token as string;
  const quizIds: string = req.query.quizIds as string;

  try {
    const parsedQuizIds: number[] = JSON.parse(quizIds);
    const result = emptyTrash(token, parsedQuizIds);
    saveData();
    res.status(200).json(result);
  } catch (error) {
    saveData();

    if (error.message.includes('Token')) {
      return res.status(401).json({ error: error.message });
    } else if (
      error.message === 'You do not own quiz ID' ||
      error.message === 'This quiz does not exist.'
    ) {
      return res.status(403).json({ error: error.message });
    }
    return res.status(400).json({ error: error.message });
  }
});

app.post('/v2/admin/quiz/:quizid/question', (req: Request, res: Response) => {
  const quizId: number = parseInt(req.params.quizid as string);
  const token: string = req.headers.token as string;
  const {
    question,
    timeLimit,
    points,
    answerOptions,
    thumbnailUrl
  }: QuestionCreateReq = req.body.questionBody;

  try {
    const result2: QuestionIdObject = adminQuizQuestionCreate(quizId, token, question,
      timeLimit, points, answerOptions, 'v2', thumbnailUrl);
    saveData();
    return res.status(200).json(result2);
  } catch (error) {
    saveData();

    if (error.message.includes('401')) {
      return res.status(401).json({ error: error.message });
    } else if (error.message.includes('403')) {
      return res.status(403).json({ error: error.message });
    } else if (error.message.includes('400')) {
      return res.status(400).json({ error: error.message });
    }
  }
});
// adminQuizInfo GET request. Gets info for a quiz
app.get('/v2/admin/quiz/:quizId', (req: Request, res: Response) => {
  const quizid = parseInt(req.params.quizId as string);
  const token = req.headers.token as string;

  try {
    const result = adminQuizInfo(token, quizid, true);
    saveData();
    return res.status(200).json(result);
  } catch (error) {
    saveData();
    if (error.message.includes('401')) {
      return res.status(401).json({ error: 'Token is empty or invalid' });
    } else {
      return res.status(403).json({ error: 'User does not own quiz, or it not exist' });
    }
  }
});

// PUT request that moves the position of question in a quiz
app.put('/v2/admin/quiz/:quizid/question/:questionid/move', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid as string);
  const questionId = parseInt(req.params.questionid as string);
  const token = req.headers.token as string;
  const newPosition = parseInt(req.body.newPosition);

  try {
    adminQuizMoveQuestion(token, quizId, questionId, newPosition);
    saveData();
    return res.status(200).json({});
  } catch (err) {
    saveData();
    if (err.message.includes('400')) {
      return res.status(400).json({ error: err.message });
    } else if (err.message.includes('401')) {
      return res.status(401).json({ error: err.message });
    } else if (err.message.includes('403')) {
      return res.status(403).json({ error: err.message });
    }
  }
});

app.put('/v2/admin/quiz/:quizId/name', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizId as string);
  const token = req.headers.token as string;
  const name = req.body.name;

  try {
    adminQuizNameUpdate(token, quizId, name);
    saveData();
    return res.status(200).json({});
  } catch (error) {
    saveData();
    if (error.message.includes('401')) {
      return res.status(401).json({ error: error.message });
    } else if (error.message.includes('403')) {
      return res.status(403).json({ error: error.message });
    } else {
      return res.status(400).json({ error: error.message });
    }
  }
});

app.post('/v2/admin/quiz/:quizid/question/:questionid/duplicate', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid as string);
  const token = req.headers.token as string;
  const questionId = parseInt(req.params.questionid as string);

  try {
    const result = adminQuizQuestionDuplicate(quizId, questionId, token);
    saveData();
    return res.status(200).json(result);
  } catch (error) {
    saveData();
    if (error.message.includes('401')) {
      return res.status(401).json({ error: error.message });
    } else if (error.message.includes('403')) {
      return res.status(403).json({ error: error.message });
    } else if (error.message.includes('400')) {
      return res.status(400).json({ error: error.message });
    }
  }
});

app.put('/v2/admin/quiz/:quizId/description', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizId, 10);
  const token = req.headers.token as string;
  const { description } = req.body;

  try {
    adminQuizDescriptionUpdate(token, quizId, description);
    saveData();
    return res.status(200).json({});
  } catch (error) {
    saveData();
    if (error.message.includes('401')) {
      return res.status(401).json({ error: error.message });
    } else if (error.message.startsWith('403')) {
      return res.status(403).json({ error: error.message });
    } else if (error.message.startsWith('400')) {
      return res.status(400).json({ error: error.message });
    }
  }
});

// ====================================================================
//  ================= WORK IS DONE ABOVE THIS LINE ===================
// ====================================================================

app.use((req: Request, res: Response) => {
  const error = `
    Route not found - This could be because:
      0. You have defined routes below (not above) this middleware in server.ts
      1. You have not implemented the route ${req.method} ${req.path}
      2. There is a typo in either your test or server, e.g. /posts/list in one
         and, incorrectly, /post/list in the other
      3. You are using ts-node (instead of ts-node-dev) to start your server and
         have forgotten to manually restart to load the new changes
      4. You've forgotten a leading slash (/), e.g. you have posts/list instead
         of /posts/list in your server.ts or test file
  `;
  res.status(404).json({ error });
});

// start server
const server = app.listen(PORT, HOST, () => {
  // DO NOT CHANGE THIS LINE
  console.log(`⚡️ Server started on port ${PORT} at ${HOST}`);
});

// For coverage, handle Ctrl+C gracefully
process.on('SIGINT', () => {
  server.close(() => {
    console.log('Shutting down server gracefully.');
    process.exit();
  });
});
