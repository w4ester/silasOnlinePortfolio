#!/usr/bin/env node

const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const session = require('express-session');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const FEEDBACK_FILE = path.join(__dirname, 'feedback-data.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware for admin authentication
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Ensure feedback file exists
async function initializeFeedbackFile() {
    try {
        await fs.access(FEEDBACK_FILE);
    } catch {
        await fs.writeFile(FEEDBACK_FILE, JSON.stringify([], null, 2));
    }
}

// Load existing feedback
async function loadFeedback() {
    try {
        const data = await fs.readFile(FEEDBACK_FILE, 'utf8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

// Save feedback
async function saveFeedback(feedbacks) {
    await fs.writeFile(FEEDBACK_FILE, JSON.stringify(feedbacks, null, 2));
}

// Send macOS notification
function sendNotification(title, message, sound = 'Glass') {
    try {
        const script = `display notification "${message}" with title "${title}" sound name "${sound}"`;
        execSync(`osascript -e '${script}'`);
    } catch (error) {
        console.log('📱 Notification (fallback):', title, '-', message);
    }
}

// Authentication middleware
function requireAuth(req, res, next) {
    if (req.session && req.session.authenticated) {
        return next();
    } else {
        return res.redirect('/admin/login');
    }
}

// Admin Routes

// Admin login page
app.get('/admin/login', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Admin Login - Feedback System</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #f5f5f5; padding: 50px 20px; }
                .login-container { max-width: 400px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                h1 { text-align: center; color: #333; margin-bottom: 30px; }
                input { width: 100%; padding: 12px; margin: 10px 0; border: 1px solid #ddd; border-radius: 5px; box-sizing: border-box; }
                button { width: 100%; padding: 12px; background: #007AFF; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; }
                button:hover { background: #0056b3; }
                .error { color: red; text-align: center; margin-top: 10px; }
            </style>
        </head>
        <body>
            <div class="login-container">
                <h1>🔒 Admin Login</h1>
                <form method="POST" action="/admin/login">
                    <input type="text" name="username" placeholder="Username" required>
                    <input type="password" name="password" placeholder="Password" required>
                    <button type="submit">Login</button>
                </form>
                ${req.query.error ? '<div class="error">Invalid credentials</div>' : ''}
            </div>
        </body>
        </html>
    `);
});

// Admin login handler
app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        req.session.authenticated = true;
        res.redirect('/admin/dashboard');
    } else {
        res.redirect('/admin/login?error=1');
    }
});

// Admin logout
app.post('/admin/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/admin/login');
});

// Admin dashboard
app.get('/admin/dashboard', requireAuth, async (req, res) => {
    try {
        const feedbacks = await loadFeedback();
        const stats = {
            total: feedbacks.length,
            pending: feedbacks.filter(f => f.status === 'pending').length,
            inProgress: feedbacks.filter(f => f.status === 'in_progress').length,
            completed: feedbacks.filter(f => f.status === 'completed').length
        };

        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Admin Dashboard - Feedback System</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; background: #f5f5f5; }
                    .header { background: #007AFF; color: white; padding: 20px; display: flex; justify-content: space-between; align-items: center; }
                    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
                    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
                    .stat-card { background: white; padding: 20px; border-radius: 10px; text-align: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
                    .stat-number { font-size: 2em; font-weight: bold; color: #007AFF; }
                    .feedback-grid { display: grid; gap: 20px; }
                    .feedback-card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); border-left: 4px solid #ddd; }
                    .feedback-card.high { border-left-color: #ff3b30; }
                    .feedback-card.medium { border-left-color: #ff9500; }
                    .feedback-card.low { border-left-color: #34c759; }
                    .feedback-header { display: flex; justify-content: between; align-items: center; margin-bottom: 10px; }
                    .feedback-meta { font-size: 0.9em; color: #666; margin-bottom: 10px; }
                    .feedback-text { margin: 10px 0; }
                    .priority-badge { padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; }
                    .priority-high { background: #ffebee; color: #c62828; }
                    .priority-medium { background: #fff3e0; color: #ef6c00; }
                    .priority-low { background: #e8f5e8; color: #2e7d32; }
                    .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 0.8em; }
                    .status-pending { background: #fff3cd; color: #856404; }
                    .status-in_progress { background: #cce5ff; color: #004085; }
                    .status-completed { background: #d4edda; color: #155724; }
                    .logout-btn { background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 8px 16px; border-radius: 5px; text-decoration: none; }
                    .logout-btn:hover { background: rgba(255,255,255,0.3); }
                    .refresh-btn { background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-bottom: 20px; }
                </style>
                <script>
                    function refreshData() {
                        location.reload();
                    }
                    setInterval(refreshData, 30000); // Auto-refresh every 30 seconds
                </script>
            </head>
            <body>
                <div class="header">
                    <h1>🎯 Feedback Dashboard</h1>
                    <form method="POST" action="/admin/logout" style="margin: 0;">
                        <button type="submit" class="logout-btn">Logout</button>
                    </form>
                </div>
                <div class="container">
                    <button onclick="refreshData()" class="refresh-btn">🔄 Refresh Data</button>
                    
                    <div class="stats">
                        <div class="stat-card">
                            <div class="stat-number">${stats.total}</div>
                            <div>Total Feedback</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${stats.pending}</div>
                            <div>Pending</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${stats.inProgress}</div>
                            <div>In Progress</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${stats.completed}</div>
                            <div>Completed</div>
                        </div>
                    </div>

                    <h2>Recent Feedback</h2>
                    <div class="feedback-grid">
                        ${feedbacks.slice(0, 50).map(feedback => `
                            <div class="feedback-card ${feedback.priority}">
                                <div class="feedback-header">
                                    <strong>#${feedback.id}</strong>
                                    <div>
                                        <span class="priority-badge priority-${feedback.priority}">${feedback.priority.toUpperCase()}</span>
                                        <span class="status-badge status-${feedback.status}">${feedback.status.replace('_', ' ').toUpperCase()}</span>
                                    </div>
                                </div>
                                <div class="feedback-meta">
                                    📍 ${feedback.pageSection} • ${getTypeEmoji(feedback.type)} ${feedback.type} • ⏰ ${feedback.createdAt}
                                </div>
                                <div class="feedback-text">
                                    <strong>Request:</strong> ${feedback.text}
                                </div>
                                ${feedback.expectedResult ? `
                                    <div class="feedback-text">
                                        <strong>Expected Result:</strong> ${feedback.expectedResult}
                                    </div>
                                ` : ''}
                                ${feedback.implementation_notes ? `
                                    <div class="feedback-text">
                                        <strong>Implementation Notes:</strong> ${feedback.implementation_notes}
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </body>
            </html>
        `);
    } catch (error) {
        res.status(500).send('Error loading dashboard: ' + error.message);
    }
});

// Helper function for dashboard
function getTypeEmoji(type) {
    const emojis = {
        'update': '🔄',
        'create': '➕',
        'delete': '🗑️',
        'fix': '🔧',
        'design': '🎨'
    };
    return emojis[type] || '📝';
}

// API Routes

// Receive new feedback from website
app.post('/api/feedback', async (req, res) => {
    try {
        const feedback = {
            id: Date.now(),
            ...req.body,
            timestamp: new Date().toISOString(),
            status: 'pending',
            createdAt: new Date().toLocaleString(),
            implemented: false
        };

        // Load existing feedback
        const feedbacks = await loadFeedback();
        feedbacks.unshift(feedback);
        
        // Save to file
        await saveFeedback(feedbacks);

        // Send notification
        const priorityEmoji = {
            'high': '🚨',
            'medium': '⚡',
            'low': '📝'
        };

        const typeEmoji = {
            'update': '🔄',
            'create': '➕',
            'delete': '🗑️',
            'fix': '🔧',
            'design': '🎨'
        };

        sendNotification(
            `${priorityEmoji[feedback.priority]} New Feedback from Silas`,
            `${typeEmoji[feedback.type]} ${feedback.pageSection}: ${feedback.text.substring(0, 50)}...`
        );

        console.log(`\n🎯 NEW FEEDBACK RECEIVED:`);
        console.log(`📋 Type: ${feedback.type.toUpperCase()}`);
        console.log(`🔥 Priority: ${feedback.priority.toUpperCase()}`);
        console.log(`📍 Section: ${feedback.pageSection}`);
        console.log(`💬 Request: ${feedback.text}`);
        console.log(`⏰ Time: ${feedback.createdAt}`);
        console.log(`\n💡 Run: claude-code "Check and implement feedback #${feedback.id}"\n`);

        res.json({
            success: true,
            id: feedback.id,
            message: 'Feedback received and saved locally'
        });

    } catch (error) {
        console.error('Error saving feedback:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all feedback (for MCP server)
app.get('/api/feedback', async (req, res) => {
    try {
        const feedbacks = await loadFeedback();
        res.json(feedbacks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get specific feedback
app.get('/api/feedback/:id', async (req, res) => {
    try {
        const feedbacks = await loadFeedback();
        const feedback = feedbacks.find(f => f.id == req.params.id);
        
        if (!feedback) {
            return res.status(404).json({ error: 'Feedback not found' });
        }
        
        res.json(feedback);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update feedback status
app.patch('/api/feedback/:id', async (req, res) => {
    try {
        const feedbacks = await loadFeedback();
        const index = feedbacks.findIndex(f => f.id == req.params.id);
        
        if (index === -1) {
            return res.status(404).json({ error: 'Feedback not found' });
        }
        
        feedbacks[index] = { ...feedbacks[index], ...req.body };
        await saveFeedback(feedbacks);
        
        res.json(feedbacks[index]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'running', timestamp: new Date().toISOString() });
});

// Start server
async function startServer() {
    await initializeFeedbackFile();
    
    app.listen(PORT, 'localhost', () => {
        console.log(`\n🎯 Feedback Server Running!`);
        console.log(`📡 URL: http://localhost:${PORT}`);
        console.log(`📂 Data: ${FEEDBACK_FILE}`);
        console.log(`🔔 Notifications: Enabled`);
        console.log(`\n💡 Waiting for feedback from Silas...\n`);
    });
}

startServer().catch(console.error);