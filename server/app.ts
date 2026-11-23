import express, { NextFunction, Request, Response } from 'express';
import { CampusDb } from './db';
import { CampusError } from './errors';
import { AuthUser, UserRole } from '../src/types/auth';

type AuthedRequest = Request & { user: AuthUser };

function fail(res: Response, error: unknown) {
  if (error instanceof CampusError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  console.error(error);
  res.status(500).json({ error: 'Unexpected server error.' });
}

function recordBody(req: Request) {
  const body = req.body ?? {};
  if (!body.record || typeof body.record !== 'object' || Array.isArray(body.record)) {
    throw new CampusError('A form record is required.');
  }
  return {
    record: body.record,
    response: body.response ?? body.record,
    formVersionId: typeof body.formVersionId === 'string' ? body.formVersionId : undefined,
  };
}

export function createApp(db: CampusDb) {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const header = req.header('authorization') ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    const user = token ? db.userByToken(token) : null;
    if (!user) {
      res.status(401).json({ error: 'Sign in is required.' });
      return;
    }
    (req as AuthedRequest).user = user;
    next();
  };

  const allow =
    (...roles: UserRole[]) =>
    (req: Request, res: Response, next: NextFunction) => {
      if (!roles.includes((req as AuthedRequest).user.role)) {
        res.status(403).json({ error: 'You do not have access to this action.' });
        return;
      }
      next();
    };

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/auth/roster', (_req, res) => {
    res.json(db.roster());
  });

  app.post('/api/auth/login', (req, res) => {
    const username = typeof req.body?.username === 'string' ? req.body.username : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required.' });
      return;
    }
    const session = db.authenticate(username, password);
    if (!session) {
      res.status(401).json({ error: 'Invalid username or password.' });
      return;
    }
    res.json(session);
  });

  app.post('/api/auth/logout', (req, res) => {
    const header = req.header('authorization') ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (token) db.logout(token);
    res.status(204).end();
  });

  app.post('/api/admin/reset', (_req, res) => {
    try {
      db.reset();
      res.json({ status: 'reset' });
    } catch (error) {
      fail(res, error);
    }
  });

  app.get('/api/forms', (_req, res) => {
    res.json(db.forms());
  });

  app.get('/api/forms/:id/versions', authenticate, allow('administrator'), (req, res) => {
    try {
      res.json(db.formVersions(req.params.id));
    } catch (error) {
      fail(res, error);
    }
  });

  app.post('/api/forms/:id/versions', authenticate, allow('administrator'), (req, res) => {
    try {
      const schema = req.body?.schema ?? req.body;
      const saved = db.saveFormSchema(req.params.id, schema, (req as AuthedRequest).user);
      res.status(201).json(saved);
    } catch (error) {
      fail(res, error);
    }
  });

  app.post('/api/forms/:id/responses', authenticate, (req, res) => {
    try {
      const saved = db.submitResponse(
        req.params.id,
        typeof req.body?.formVersionId === 'string' ? req.body.formVersionId : undefined,
        (req as AuthedRequest).user,
        req.body?.response ?? req.body,
      );
      res.status(201).json(saved);
    } catch (error) {
      fail(res, error);
    }
  });

  app.get('/api/departments', authenticate, (_req, res) => {
    res.json(db.departments());
  });

  app.get('/api/programmes', authenticate, (_req, res) => {
    res.json(db.programmes());
  });

  app.get('/api/staff', authenticate, (_req, res) => {
    res.json(db.staff());
  });

  app.get('/api/advisors', authenticate, (_req, res) => {
    res.json(db.advisors());
  });

  app.get('/api/students', authenticate, (req, res) => {
    try {
      res.json(
        db.searchStudents(
          {
            name: typeof req.query.name === 'string' ? req.query.name : '',
            surname: typeof req.query.surname === 'string' ? req.query.surname : '',
            dateOfBirth: typeof req.query.dateOfBirth === 'string' ? req.query.dateOfBirth : '',
            studentNumber: typeof req.query.studentNumber === 'string' ? req.query.studentNumber : '',
          },
          (req as AuthedRequest).user,
        ),
      );
    } catch (error) {
      fail(res, error);
    }
  });

  app.get('/api/students/:id', authenticate, (req, res) => {
    try {
      const status = typeof req.query.status === 'string' ? req.query.status : '';
      const requestType = typeof req.query.requestType === 'string' ? req.query.requestType : '';
      res.json(db.getProfile(req.params.id, (req as AuthedRequest).user, { status, requestType }));
    } catch (error) {
      fail(res, error);
    }
  });

  app.post('/api/students', authenticate, allow('administrator'), (req, res) => {
    try {
      const body = recordBody(req);
      res.status(201).json(db.createStudent(body.record, (req as AuthedRequest).user, body.formVersionId, body.response));
    } catch (error) {
      fail(res, error);
    }
  });

  app.put('/api/students/:id', authenticate, allow('administrator'), (req, res) => {
    try {
      const body = recordBody(req);
      res.json(db.updateStudent(req.params.id, body.record, (req as AuthedRequest).user, body.formVersionId, body.response));
    } catch (error) {
      fail(res, error);
    }
  });

  app.delete('/api/students/:id', authenticate, allow('administrator'), (req, res) => {
    try {
      db.deleteStudent(req.params.id);
      res.status(204).end();
    } catch (error) {
      fail(res, error);
    }
  });

  app.get('/api/students/:id/advising', authenticate, (req, res) => {
    try {
      db.getProfile(req.params.id, (req as AuthedRequest).user);
      res.json(db.advising(req.params.id));
    } catch (error) {
      fail(res, error);
    }
  });

  app.post('/api/students/:id/advising', authenticate, allow('administrator', 'academic'), (req, res) => {
    try {
      const body = recordBody(req);
      res.status(201).json(db.saveAdvising(req.params.id, body.record, (req as AuthedRequest).user, body.formVersionId, body.response));
    } catch (error) {
      fail(res, error);
    }
  });

  app.put('/api/advising/:id', authenticate, allow('administrator', 'academic'), (req, res) => {
    try {
      const studentId = typeof req.body?.studentId === 'string' ? req.body.studentId : '';
      const body = recordBody(req);
      res.json(db.saveAdvising(studentId, body.record, (req as AuthedRequest).user, body.formVersionId, body.response, req.params.id));
    } catch (error) {
      fail(res, error);
    }
  });

  app.get('/api/students/:id/support-requests', authenticate, (req, res) => {
    try {
      db.getProfile(req.params.id, (req as AuthedRequest).user);
      res.json(
        db.supportRequests(req.params.id, {
          status: typeof req.query.status === 'string' ? req.query.status : '',
          requestType: typeof req.query.requestType === 'string' ? req.query.requestType : '',
        }),
      );
    } catch (error) {
      fail(res, error);
    }
  });

  app.post('/api/students/:id/support-requests', authenticate, (req, res) => {
    try {
      const body = recordBody(req);
      res.status(201).json(db.createSupport(req.params.id, body.record, (req as AuthedRequest).user, body.formVersionId, body.response));
    } catch (error) {
      fail(res, error);
    }
  });

  app.put('/api/support-requests/:id', authenticate, allow('administrator', 'support'), (req, res) => {
    try {
      const body = recordBody(req);
      res.json(db.updateSupport(req.params.id, body.record, (req as AuthedRequest).user, body.formVersionId, body.response));
    } catch (error) {
      fail(res, error);
    }
  });

  app.get('/api/courses', authenticate, (_req, res) => {
    res.json(db.courses());
  });

  app.get('/api/courses/:id', authenticate, (req, res) => {
    try {
      res.json(db.course(req.params.id));
    } catch (error) {
      fail(res, error);
    }
  });

  app.post('/api/courses', authenticate, allow('administrator'), (req, res) => {
    try {
      const body = recordBody(req);
      res.status(201).json(db.createCourse(body.record, (req as AuthedRequest).user, body.formVersionId, body.response));
    } catch (error) {
      fail(res, error);
    }
  });

  app.put('/api/courses/:id', authenticate, allow('administrator'), (req, res) => {
    try {
      const body = recordBody(req);
      res.json(db.updateCourse(req.params.id, body.record, (req as AuthedRequest).user, body.formVersionId, body.response));
    } catch (error) {
      fail(res, error);
    }
  });

  app.post('/api/courses/:id/registrations', authenticate, allow('administrator', 'academic'), (req, res) => {
    try {
      const body = recordBody(req);
      const course = db.course(req.params.id);
      if (body.record.courseCode && String(body.record.courseCode).toUpperCase() !== course.courseCode) {
        throw new CampusError('The selected course does not match this registration.');
      }
      body.record.courseCode = course.courseCode;
      res.status(201).json(db.registerForCourse(body.record, (req as AuthedRequest).user, body.formVersionId, body.response));
    } catch (error) {
      fail(res, error);
    }
  });

  app.get('/api/events', authenticate, (_req, res) => {
    res.json(db.events());
  });

  app.get('/api/events/:id', authenticate, (req, res) => {
    try {
      res.json(db.event(req.params.id));
    } catch (error) {
      fail(res, error);
    }
  });

  app.post('/api/events', authenticate, allow('administrator'), (req, res) => {
    try {
      const body = recordBody(req);
      res.status(201).json(db.createEvent(body.record, (req as AuthedRequest).user, body.formVersionId, body.response));
    } catch (error) {
      fail(res, error);
    }
  });

  app.put('/api/events/:id', authenticate, allow('administrator'), (req, res) => {
    try {
      const body = recordBody(req);
      res.json(db.updateEvent(req.params.id, body.record, (req as AuthedRequest).user, body.formVersionId, body.response));
    } catch (error) {
      fail(res, error);
    }
  });

  app.get('/api/residences', authenticate, (_req, res) => {
    res.json(db.residences());
  });

  app.get('/api/residences/:id', authenticate, (req, res) => {
    try {
      res.json(db.residence(req.params.id));
    } catch (error) {
      fail(res, error);
    }
  });

  app.post('/api/residences', authenticate, allow('administrator'), (req, res) => {
    try {
      const body = recordBody(req);
      res.status(201).json(db.createResidence(body.record, (req as AuthedRequest).user, body.formVersionId, body.response));
    } catch (error) {
      fail(res, error);
    }
  });

  app.put('/api/residences/:id', authenticate, allow('administrator'), (req, res) => {
    try {
      const body = recordBody(req);
      res.json(db.updateResidence(req.params.id, body.record, (req as AuthedRequest).user, body.formVersionId, body.response));
    } catch (error) {
      fail(res, error);
    }
  });

  app.post('/api/residences/:id/allocations', authenticate, allow('administrator', 'support', 'student'), (req, res) => {
    try {
      const body = recordBody(req);
      res.status(201).json(db.allocateResidence(req.params.id, body.record, (req as AuthedRequest).user, body.formVersionId, body.response));
    } catch (error) {
      fail(res, error);
    }
  });

  app.post('/api/events/:id/registrations', authenticate, allow('administrator', 'academic', 'student'), (req, res) => {
    try {
      const body = recordBody(req);
      res.status(201).json(db.registerForEvent(req.params.id, body.record, (req as AuthedRequest).user, body.formVersionId, body.response));
    } catch (error) {
      fail(res, error);
    }
  });

  return app;
}
