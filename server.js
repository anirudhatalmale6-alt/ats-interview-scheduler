const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory database for demo
const db = {
  candidates: [
    { id: '1', name: 'Sarah Johnson', email: 'sarah.j@email.com', phone: '555-0101', position: 'Senior Developer', stage: 'interview', appliedDate: '2026-01-15', resumeUrl: '#', notes: 'Strong React experience' },
    { id: '2', name: 'Michael Chen', email: 'mchen@email.com', phone: '555-0102', position: 'Product Manager', stage: 'phone_screen', appliedDate: '2026-01-18', resumeUrl: '#', notes: 'Ex-Google PM' },
    { id: '3', name: 'Emily Davis', email: 'emily.d@email.com', phone: '555-0103', position: 'UX Designer', stage: 'applied', appliedDate: '2026-01-20', resumeUrl: '#', notes: 'Great portfolio' },
    { id: '4', name: 'James Wilson', email: 'jwilson@email.com', phone: '555-0104', position: 'Senior Developer', stage: 'offer', appliedDate: '2026-01-10', resumeUrl: '#', notes: 'Negotiating salary' },
    { id: '5', name: 'Lisa Martinez', email: 'lisa.m@email.com', phone: '555-0105', position: 'Data Analyst', stage: 'hired', appliedDate: '2026-01-05', resumeUrl: '#', notes: 'Started Jan 20' },
    { id: '6', name: 'David Brown', email: 'dbrown@email.com', phone: '555-0106', position: 'DevOps Engineer', stage: 'applied', appliedDate: '2026-01-21', resumeUrl: '#', notes: 'AWS certified' }
  ],
  interviews: [
    { id: '1', candidateId: '1', candidateName: 'Sarah Johnson', position: 'Senior Developer', date: '2026-01-24', time: '10:00', duration: 60, type: 'Technical Interview', interviewers: ['John Smith', 'Jane Doe'], location: 'Google Meet', notes: 'Focus on system design', status: 'scheduled', reminderSent: false },
    { id: '2', candidateId: '2', candidateName: 'Michael Chen', position: 'Product Manager', date: '2026-01-23', time: '14:00', duration: 30, type: 'Phone Screen', interviewers: ['HR Team'], location: 'Phone Call', notes: 'Initial screening', status: 'scheduled', reminderSent: true }
  ],
  stages: ['applied', 'phone_screen', 'interview', 'offer', 'hired'],
  settings: {
    companyName: 'Your Company',
    logo: '',
    primaryColor: '#2563eb',
    reminderHours: 24,
    emailTemplates: {
      interviewInvite: 'Dear {{candidateName}},\n\nWe are pleased to invite you for an interview for the {{position}} position.\n\nDate: {{date}}\nTime: {{time}}\nLocation: {{location}}\n\nPlease confirm your attendance.\n\nBest regards,\n{{companyName}} Recruitment Team',
      reminder: 'Dear {{candidateName}},\n\nThis is a reminder about your upcoming interview tomorrow.\n\nDate: {{date}}\nTime: {{time}}\nLocation: {{location}}\n\nWe look forward to meeting you!\n\nBest regards,\n{{companyName}} Recruitment Team'
    }
  }
};

// API Routes

// Get all candidates
app.get('/api/candidates', (req, res) => {
  res.json(db.candidates);
});

// Get candidate by ID
app.get('/api/candidates/:id', (req, res) => {
  const candidate = db.candidates.find(c => c.id === req.params.id);
  if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
  res.json(candidate);
});

// Add new candidate
app.post('/api/candidates', (req, res) => {
  const candidate = {
    id: uuidv4(),
    ...req.body,
    appliedDate: new Date().toISOString().split('T')[0],
    stage: 'applied'
  };
  db.candidates.push(candidate);
  res.status(201).json(candidate);
});

// Update candidate
app.put('/api/candidates/:id', (req, res) => {
  const index = db.candidates.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Candidate not found' });
  db.candidates[index] = { ...db.candidates[index], ...req.body };
  res.json(db.candidates[index]);
});

// Move candidate to stage
app.patch('/api/candidates/:id/stage', (req, res) => {
  const candidate = db.candidates.find(c => c.id === req.params.id);
  if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
  candidate.stage = req.body.stage;
  res.json(candidate);
});

// Delete candidate
app.delete('/api/candidates/:id', (req, res) => {
  const index = db.candidates.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Candidate not found' });
  db.candidates.splice(index, 1);
  res.status(204).send();
});

// Get all interviews
app.get('/api/interviews', (req, res) => {
  res.json(db.interviews);
});

// Get interview by ID
app.get('/api/interviews/:id', (req, res) => {
  const interview = db.interviews.find(i => i.id === req.params.id);
  if (!interview) return res.status(404).json({ error: 'Interview not found' });
  res.json(interview);
});

// Schedule new interview
app.post('/api/interviews', (req, res) => {
  const candidate = db.candidates.find(c => c.id === req.body.candidateId);
  const interview = {
    id: uuidv4(),
    ...req.body,
    candidateName: candidate ? candidate.name : req.body.candidateName,
    position: candidate ? candidate.position : req.body.position,
    status: 'scheduled',
    reminderSent: false
  };
  db.interviews.push(interview);

  // Move candidate to interview stage if they're in an earlier stage
  if (candidate && ['applied', 'phone_screen'].includes(candidate.stage)) {
    candidate.stage = 'interview';
  }

  res.status(201).json(interview);
});

// Update interview
app.put('/api/interviews/:id', (req, res) => {
  const index = db.interviews.findIndex(i => i.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Interview not found' });
  db.interviews[index] = { ...db.interviews[index], ...req.body };
  res.json(db.interviews[index]);
});

// Cancel interview
app.delete('/api/interviews/:id', (req, res) => {
  const index = db.interviews.findIndex(i => i.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Interview not found' });
  db.interviews.splice(index, 1);
  res.status(204).send();
});

// Get settings
app.get('/api/settings', (req, res) => {
  res.json(db.settings);
});

// Update settings
app.put('/api/settings', (req, res) => {
  db.settings = { ...db.settings, ...req.body };
  res.json(db.settings);
});

// Get pipeline stats
app.get('/api/stats', (req, res) => {
  const stats = {
    total: db.candidates.length,
    byStage: {},
    upcomingInterviews: db.interviews.filter(i => i.status === 'scheduled').length,
    thisWeekInterviews: db.interviews.filter(i => {
      const interviewDate = new Date(i.date);
      const today = new Date();
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      return interviewDate >= today && interviewDate <= weekFromNow;
    }).length
  };

  db.stages.forEach(stage => {
    stats.byStage[stage] = db.candidates.filter(c => c.stage === stage).length;
  });

  res.json(stats);
});

// Google Calendar OAuth simulation (for demo)
app.get('/api/calendar/auth', (req, res) => {
  res.json({
    authUrl: '#',
    message: 'In production, this would redirect to Google OAuth. For demo purposes, calendar sync is simulated.',
    connected: true
  });
});

// Simulate sending reminder
app.post('/api/interviews/:id/send-reminder', (req, res) => {
  const interview = db.interviews.find(i => i.id === req.params.id);
  if (!interview) return res.status(404).json({ error: 'Interview not found' });
  interview.reminderSent = true;
  res.json({ success: true, message: `Reminder sent to ${interview.candidateName}` });
});

// Serve the frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`ATS Server running on port ${PORT}`);
});
