# 🎯 Local Feedback System with Claude Code Integration

This system creates a complete feedback loop from Silas's website directly to your local development environment with Claude Code integration.

## 🏗️ Architecture

```
[Silas submits feedback] 
    ↓
[Website form (feedback.html)]
    ↓  
[Local webhook server (port 3001)]
    ↓
[macOS notification + JSON file]
    ↓
[MCP Server for Claude Code]
    ↓
[Claude Code implements changes]
    ↓
[Git commit & push to GitHub]
```

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
cd /Users/willf/silasResume
npm install
```

### 2. Start the Local Feedback Server

```bash
# Terminal 1: Start the webhook server
npm start

# Or for development with auto-restart:
npm run dev
```

You should see:
```
🎯 Feedback Server Running!
📡 URL: http://localhost:3001
📂 Data: /Users/willf/silasResume/feedback-data.json
🔔 Notifications: Enabled
💡 Waiting for feedback from Silas...
```

### 3. Configure Claude Code MCP

Add this to your Claude Code settings (`~/.config/claude-code/settings.json`):

```json
{
  "mcpServers": {
    "silas-feedback": {
      "command": "node",
      "args": ["/Users/willf/silasResume/mcp-feedback-server.js"],
      "env": {}
    }
  }
}
```

### 4. Test the System

1. **Open your website** (locally or hosted)
2. **Click "💬 Site Feedback"**
3. **Submit test feedback**
4. **Check for macOS notification**
5. **Verify data in `feedback-data.json`**

## 🎯 How to Use with Claude Code

### Check for New Feedback

```bash
claude-code "Check for any new feedback from Silas and show me a summary"
```

Claude will use the MCP server to:
- List all pending feedback
- Show priority levels
- Display detailed requests

### Implement Specific Feedback

```bash
claude-code "Implement feedback #1721234567 and update its status"
```

Claude will:
- Get the feedback details
- Understand the request
- Make the necessary code changes
- Update the feedback status
- Commit and push to GitHub

### Get Feedback Summary

```bash
claude-code "Show me a summary of all pending feedback organized by priority"
```

## 🛠️ Available MCP Tools

Claude Code can use these tools through the MCP server:

### `list_feedback`
```bash
# List all feedback
claude-code "List all feedback"

# Filter by status
claude-code "Show me only pending feedback"

# Filter by priority
claude-code "Show me high priority feedback only"
```

### `get_feedback`
```bash
claude-code "Get details for feedback #1721234567"
```

### `update_feedback_status`
```bash
claude-code "Mark feedback #1721234567 as completed"
```

### `add_implementation_notes`
```bash
claude-code "Add implementation notes to feedback #1721234567: 'Updated the navigation color in index.html'"
```

### `get_pending_feedback_summary`
```bash
claude-code "Show me a summary of all pending feedback"
```

## 📱 Notifications

When Silas submits feedback, you'll get:

### macOS Notification
- **Title**: Priority emoji + "New Feedback from Silas"
- **Body**: Type + Section + Preview of request
- **Sound**: Glass notification sound

### Console Output
```
🎯 NEW FEEDBACK RECEIVED:
📋 Type: DESIGN
🔥 Priority: HIGH
📍 Section: Navigation menu
💬 Request: Make the navigation menu have a darker blue background
⏰ Time: 7/25/2025, 1:30:00 PM

💡 Run: claude-code "Check and implement feedback #1721234567"
```

## 📂 Data Storage

All feedback is stored in `feedback-data.json`:

```json
[
  {
    "id": 1721234567,
    "type": "design",
    "priority": "high",
    "pageSection": "Navigation menu",
    "text": "Make the navigation menu have a darker blue background",
    "expectedResult": "Should be noticeably darker than current blue",
    "timestamp": "2025-07-25T17:30:00.000Z",
    "status": "pending",
    "createdAt": "7/25/2025, 1:30:00 PM",
    "implemented": false,
    "implementation_log": []
  }
]
```

## 🔄 Typical Workflow

### 1. Silas Submits Feedback
- Fills out form on website
- Gets confirmation it was sent

### 2. You Get Notified
- macOS notification appears
- Terminal shows details
- Data saved to JSON file

### 3. You Use Claude Code
```bash
# Check what's new
claude-code "Check for new feedback and show me the highest priority items"

# Implement changes
claude-code "Implement the highest priority feedback item"

# Update status
claude-code "Mark the completed feedback as done with notes about what was changed"
```

### 4. Changes Go Live
- Claude Code makes the changes
- Commits to git
- Pushes to GitHub
- Site updates automatically

## 🚨 Troubleshooting

### Server Won't Start
```bash
# Check if port 3001 is in use
lsof -i :3001

# Kill process if needed
kill -9 <PID>
```

### No Notifications
```bash
# Test notification manually
osascript -e 'display notification "Test" with title "Test"'
```

### MCP Server Issues
```bash
# Test MCP server directly
node mcp-feedback-server.js
```

### Frontend Can't Reach Server
- Check server is running on localhost:3001
- Verify CORS is enabled
- Check browser console for errors

## 🎉 Advanced Usage

### Custom Commands
```bash
# Batch process all pending feedback
claude-code "Review all pending feedback and implement any quick fixes that are safe"

# Generate implementation plan
claude-code "Create an implementation plan for all high priority feedback items"

# Weekly summary
claude-code "Show me a summary of all feedback from this week and what was implemented"
```

### Integration with Git
```bash
# Create feature branch for feedback
claude-code "Create a feature branch for feedback #1721234567 and implement the changes"

# Review changes before commit
claude-code "Show me the changes for feedback #1721234567 before committing"
```

---

## 🎯 Ready to Use!

1. **Start the server**: `npm start`
2. **Configure MCP in Claude Code**
3. **Have Silas test the feedback form**
4. **Use Claude Code to implement changes**

This creates a **super-powered development workflow** where Silas can easily communicate changes and you can implement them instantly with AI assistance! 🚀