// routes/tasks.js — FINAL VERCEL + NEON (direct queries)
const express = require('express');
const { neon } = require('@neondatabase/serverless');
const router = express.Router();

const sql = neon(process.env.DATABASE_URL);

const requireLogin = (req, res, next) => {
  if (!req.session.user) return res.redirect('/auth/login');
  next();
};
router.use(requireLogin);

router.get('/', async (req, res) => {
  try {
    const { rows } = await sql`
      SELECT * FROM tasks WHERE "userId" = ${req.session.user.id} ORDER BY "createdAt" DESC
    `;
    res.render('tasks', { tasks: rows, success: req.query.success });
  } catch (err) {
    console.error(err);
    res.render('tasks', { tasks: [], error: 'Failed to load tasks' });
  }
});

router.get('/add', (req, res) => {
  res.render('add-task', { errors: [], taskData: {} });
});

router.post('/add', async (req, res) => {
  try {
    await sql`
      INSERT INTO tasks (title, description, "dueDate", "userId")
      VALUES (${req.body.title}, ${req.body.description || null}, ${req.body.dueDate || null}, ${req.session.user.id})
    `;
    res.redirect('/tasks?success=Task created!');
  } catch (err) {
    console.error(err);
    res.render('add-task', { errors: [{ msg: 'Failed to create task' }], taskData: req.body });
  }
});

router.get('/edit/:id', async (req, res) => {
  try {
    const { rows } = await sql`
      SELECT * FROM tasks WHERE id = ${req.params.id} AND "userId" = ${req.session.user.id}
    `;
    if (rows.length === 0) return res.redirect('/tasks');
    res.render('edit-task', { task: rows[0], errors: [], taskData: rows[0] });
  } catch (err) {
    res.redirect('/tasks');
  }
});

router.post('/edit/:id', async (req, res) => {
  try {
    await sql`
      UPDATE tasks SET title = ${req.body.title}, description = ${req.body.description || null}, "dueDate" = ${req.body.dueDate || null}
      WHERE id = ${req.params.id} AND "userId" = ${req.session.user.id}
    `;
    res.redirect('/tasks?success=Task updated!');
  } catch (err) {
    console.error(err);
    const { rows } = await sql`
      SELECT * FROM tasks WHERE id = ${req.params.id}
    `;
    res.render('edit-task', { task: rows[0] || {}, errors: [{ msg: 'Failed to update' }], taskData: req.body });
  }
});

router.post('/status/:id', async (req, res) => {
  try {
    await sql`
      UPDATE tasks SET status = CASE WHEN status = 'completed' THEN 'pending' ELSE 'completed' END
      WHERE id = ${req.params.id} AND "userId" = ${req.session.user.id}
    `;
  } catch (err) {
    console.error(err);
  }
  res.redirect('/tasks');
});

router.post('/delete/:id', async (req, res) => {
  try {
    await sql`
      DELETE FROM tasks WHERE id = ${req.params.id} AND "userId" = ${req.session.user.id}
    `;
  } catch (err) {
    console.error(err);
  }
  res.redirect('/tasks');
});

module.exports = router;