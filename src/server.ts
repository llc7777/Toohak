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
  adminQuizTransfer,
} from './quiz';
import { clear, emptyTrash } from './other';
import { encodedTokenExists } from './helper';

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

  return res.status(200).json(result);
});

app.post('/v1/admin/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = adminAuthLogin(email, password);

  if ('error' in result) {
    return res.status(400).json(result);
  }

  res.status(200).json(result);
});

// adminAuthLogout POST request
app.post('/v1/admin/auth/logout', (req: Request, res: Response) => {
  const { token } = req.body;

  const result = adminAuthLogout(token);

  if (result.error) {
    return res.status(401).json(result);
  }

  return res.status(200).json(result);
});

app.put('/v1/admin/quiz/:quizId/name', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizId as string);
  const token = req.body.token;
  if (token.length === 0 || !encodedTokenExists(token)) {
    return res.status(401).json({ error: 'Unknown Type: string - error' });
  }
  const name = req.body.name;
  const result = adminQuizNameUpdate(token, quizId, name);

  const result2 = adminQuizInfo(token, quizId);
  if ('error' in result2) {
    return res.status(403).json(result);
  }
  if ('error' in result) {
    return res.status(400).json(result);
  }

  return res.status(200).json({});
});

app.get('/v1/admin/user/details', (req: Request, res: Response) => {
  const { token } = req.query;

  const result = adminUserDetails(token);
  if ('error' in result || token.length === 0) {
    return res.status(401).json(result);
  }

  return res.json(result);
});

app.put('/v1/admin/user/details', (req: Request, res: Response) => {
  const { token, email, nameFirst, nameLast } = req.body;

  const result = adminUserDetailsUpdate(token, email, nameFirst, nameLast);

  if (result.error === 'Token is empty' || result.error === 'Token is invalid') {
    return res.status(401).json(result);
  } else if ('error' in result) {
    return res.status(400).json(result);
  }

  res.status(200).json(result);
});

// adiminUserPasswordUpdate PUT request
app.put('/v1/admin/user/password', (req: Request, res: Response) => {
  const { token, oldPassword, newPassword } = req.body;
  const result = adminUserPasswordUpdate(token, oldPassword, newPassword);

  if (result.error === 'Token is empty' || result.error === 'Token is invalid') {
    return res.status(401).json(result);
  } else if ('error' in result) {
    return res.status(400).json(result);
  }
  return res.status(200).json(result);
});

// routes for quiz

// adminQuizCreate POST request
app.post('/v1/admin/quiz', (req: Request, res: Response) => {
  const { token, name, description } = req.body;
  const result = adminQuizCreate(token, name, description);

  if (result.error === 'Token is empty' || result.error === 'Token is invalid') {
    return res.status(401).json(result);
  } else if ('error' in result) {
    return res.status(400).json(result);
  }
  return res.status(200).json(result);
});

// adminQuizList GET request
app.get('/v1/admin/quiz/list', (req: Request, res: Response) => {
  const { token } = req.query;

  const result = adminQuizList(token);

  if ('error' in result) {
    res.status(401).json(result);
    return;
  }

  return res.json(result);
});

// adminQuizTrashList GET request
app.get('/v1/admin/quiz/trash', (req: Request, res: Response) => {
  const { token } = req.query;
  const result = adminQuizTrashList(token);

  if ('error' in result) {
    return res.status(401).json(result);
  }

  return res.status(200).json(result);
});

// adminQuizInfo GET request
app.get('/v1/admin/quiz/:quizId', (req: Request, res: Response) => {
  const quizid = parseInt(req.params.quizId as string);
  const token = req.query.token as string;
  if (!encodedTokenExists(token) || token.length === 0) {
    res.status(401).json({ error: 'Unknown Type: string - error' });
  }
  const result = adminQuizInfo(token, quizid);
  if ('error' in result) {
    res.status(403).json({ error: 'Unknown Type: string - error' });
  }
  res.status(200).json({ result });
});

// adminQuizDelete DELETE request
app.delete('/v1/admin/quiz/:quizId', (req: Request, res: Response) => {
  const quizid = parseInt(req.params.quizId as string);
  const token = req.query.token as string;
  if (!encodedTokenExists(token) || token.length === 0) {
    res.status(401).json({ error: 'Unknown Type: string - error' });
  }
  const result = adminQuizRemove(token, quizid);
  if ('error' in result) {
    res.status(403).json({ error: 'Unknown Type: string - error' });
  }
  res.status(200).json({ result });
});

// PUT request for adminQuizDescription
app.put('/v1/admin/quiz/:quizId/description', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizId as string);
  const token = req.query.token as string;
  const description = req.body.description;

  if (!token || token.length === 0 || !encodedTokenExists(token)) {
    return res.status(401).json({ error: 'Invalid or missing token.' });
  }

  const result2 = adminQuizInfo(token, quizId);
  if ('error' in result2) {
    return res.status(403).json(result2);
  }

  const result = adminQuizDescriptionUpdate(token, quizId, description);
  if ('error' in result) {
    return res.status(400).json(result);
  }

  return res.status(200).json({});
});

// routes for other
app.delete('/v1/clear', (req: Request, res: Response) => {
  res.json(clear());
});

app.delete('/v1/admin/quiz/trash/empty', (req: Request, res: Response) => {
  const token = req.query.token as string;
  const quizIds = req.query.quizIds as string;

  const result = emptyTrash(token, JSON.parse(quizIds));
  if (result.error === 'Token is empty' || result.error === 'Token is invalid') {
    return res.status(401).json(result);
  } else if (result.error === 'You do not own quiz ID') {
    return res.status(403).json(result);
  } else if ('error' in result) {
    return res.status(400).json(result);
  }

  return res.status(200).json(result);
});

app.post('/v1/admin/quiz/:quizid/transfer', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid as string);
  const token = req.body.token;
  const email = req.body.userEmail;

  if (!encodedTokenExists(token) || token.length === 0) {
    res.status(401).json({ error: 'Unknown Type: string - error' });
  }
  const result = adminQuizTransfer(token, email, quizId);
  if (result.error === 'No quiz exists with the given quizId' ||
    result.error === 'This user does not own the quiz') {
    res.status(403).json({ error: 'Unknown Type: string - error' });
  } else if ('error' in result) {
    res.status(400).json({ error: 'Unknown Type: string - error' });
  }
  res.status(200).json({});
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
