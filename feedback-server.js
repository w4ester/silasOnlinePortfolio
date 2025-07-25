#!/usr/bin/env node

const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

const app = express();
const PORT = 3001;
const FEEDBACK_FILE = path.join(__dirname, 'feedback-data.json');

// Middleware
app.use(cors());
app.use(express.json());

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