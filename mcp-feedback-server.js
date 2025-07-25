#!/usr/bin/env node

/**
 * MCP Server for Silas Resume Feedback System
 * Provides tools for Claude Code to manage feedback from Silas
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const FEEDBACK_FILE = path.join(__dirname, 'feedback-data.json');
const SERVER_URL = 'http://localhost:3001';

class FeedbackMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'silas-feedback',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  async loadFeedback() {
    try {
      const data = await fs.readFile(FEEDBACK_FILE, 'utf8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  async saveFeedback(feedbacks) {
    await fs.writeFile(FEEDBACK_FILE, JSON.stringify(feedbacks, null, 2));
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'list_feedback',
            description: 'List all feedback submissions from Silas, optionally filtered by status or priority',
            inputSchema: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  enum: ['pending', 'in_progress', 'completed', 'rejected'],
                  description: 'Filter by feedback status'
                },
                priority: {
                  type: 'string',
                  enum: ['high', 'medium', 'low'],
                  description: 'Filter by priority level'
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of feedback items to return'
                }
              },
              additionalProperties: false
            }
          },
          {
            name: 'get_feedback',
            description: 'Get detailed information about a specific feedback item',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  description: 'The feedback ID to retrieve'
                }
              },
              required: ['id'],
              additionalProperties: false
            }
          },
          {
            name: 'update_feedback_status',
            description: 'Update the status of a feedback item (pending, in_progress, completed, rejected)',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  description: 'The feedback ID to update'
                },
                status: {
                  type: 'string',
                  enum: ['pending', 'in_progress', 'completed', 'rejected'],
                  description: 'New status for the feedback'
                },
                implementation_notes: {
                  type: 'string',
                  description: 'Notes about the implementation or changes made'
                }
              },
              required: ['id', 'status'],
              additionalProperties: false
            }
          },
          {
            name: 'add_implementation_notes',
            description: 'Add implementation notes to a feedback item',
            inputSchema: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  description: 'The feedback ID'
                },
                notes: {
                  type: 'string',
                  description: 'Implementation notes or comments'
                },
                files_changed: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'List of files that were modified'
                }
              },
              required: ['id', 'notes'],
              additionalProperties: false
            }
          },
          {
            name: 'get_pending_feedback_summary',
            description: 'Get a summary of all pending feedback items for quick overview',
            inputSchema: {
              type: 'object',
              properties: {},
              additionalProperties: false
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'list_feedback':
            return await this.listFeedback(args);
          
          case 'get_feedback':
            return await this.getFeedback(args);
          
          case 'update_feedback_status':
            return await this.updateFeedbackStatus(args);
          
          case 'add_implementation_notes':
            return await this.addImplementationNotes(args);
          
          case 'get_pending_feedback_summary':
            return await this.getPendingFeedbackSummary(args);
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`
            }
          ],
          isError: true
        };
      }
    });
  }

  async listFeedback(args) {
    const feedbacks = await this.loadFeedback();
    let filtered = feedbacks;

    // Apply filters
    if (args.status) {
      filtered = filtered.filter(f => f.status === args.status);
    }
    if (args.priority) {
      filtered = filtered.filter(f => f.priority === args.priority);
    }
    if (args.limit) {
      filtered = filtered.slice(0, args.limit);
    }

    const summary = filtered.map(f => ({
      id: f.id,
      type: f.type,
      priority: f.priority,
      status: f.status,
      pageSection: f.pageSection,
      text: f.text.substring(0, 100) + (f.text.length > 100 ? '...' : ''),
      createdAt: f.createdAt
    }));

    return {
      content: [
        {
          type: 'text',
          text: `Found ${filtered.length} feedback items:\n\n${JSON.stringify(summary, null, 2)}`
        }
      ]
    };
  }

  async getFeedback(args) {
    const feedbacks = await this.loadFeedback();
    const feedback = feedbacks.find(f => f.id.toString() === args.id);

    if (!feedback) {
      throw new Error(`Feedback with ID ${args.id} not found`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(feedback, null, 2)
        }
      ]
    };
  }

  async updateFeedbackStatus(args) {
    const feedbacks = await this.loadFeedback();
    const index = feedbacks.findIndex(f => f.id.toString() === args.id);

    if (index === -1) {
      throw new Error(`Feedback with ID ${args.id} not found`);
    }

    // Update the feedback
    feedbacks[index].status = args.status;
    feedbacks[index].lastUpdated = new Date().toISOString();
    
    if (args.implementation_notes) {
      feedbacks[index].implementation_notes = args.implementation_notes;
    }

    await this.saveFeedback(feedbacks);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Feedback #${args.id} status updated to: ${args.status}`
        }
      ]
    };
  }

  async addImplementationNotes(args) {
    const feedbacks = await this.loadFeedback();
    const index = feedbacks.findIndex(f => f.id.toString() === args.id);

    if (index === -1) {
      throw new Error(`Feedback with ID ${args.id} not found`);
    }

    // Add implementation notes
    if (!feedbacks[index].implementation_log) {
      feedbacks[index].implementation_log = [];
    }

    feedbacks[index].implementation_log.push({
      timestamp: new Date().toISOString(),
      notes: args.notes,
      files_changed: args.files_changed || []
    });

    feedbacks[index].lastUpdated = new Date().toISOString();
    await this.saveFeedback(feedbacks);

    return {
      content: [
        {
          type: 'text',
          text: `📝 Implementation notes added to feedback #${args.id}`
        }
      ]
    };
  }

  async getPendingFeedbackSummary(args) {
    const feedbacks = await this.loadFeedback();
    const pending = feedbacks.filter(f => f.status === 'pending');
    
    if (pending.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: '✅ No pending feedback! All caught up.'
          }
        ]
      };
    }

    // Group by priority
    const byPriority = {
      high: pending.filter(f => f.priority === 'high'),
      medium: pending.filter(f => f.priority === 'medium'),
      low: pending.filter(f => f.priority === 'low')
    };

    let summary = `📋 Pending Feedback Summary (${pending.length} total):\n\n`;
    
    ['high', 'medium', 'low'].forEach(priority => {
      if (byPriority[priority].length > 0) {
        const emoji = { high: '🚨', medium: '⚡', low: '📝' }[priority];
        summary += `${emoji} ${priority.toUpperCase()} Priority (${byPriority[priority].length}):\n`;
        
        byPriority[priority].forEach(f => {
          const typeEmoji = { update: '🔄', create: '➕', delete: '🗑️', fix: '🔧', design: '🎨' }[f.type];
          summary += `  ${typeEmoji} #${f.id}: ${f.pageSection} - ${f.text.substring(0, 60)}...\n`;
        });
        summary += '\n';
      }
    });

    return {
      content: [
        {
          type: 'text',
          text: summary
        }
      ]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('🤖 Silas Feedback MCP Server running');
  }
}

// Start the server
if (require.main === module) {
  const server = new FeedbackMCPServer();
  server.run().catch(console.error);
}

module.exports = FeedbackMCPServer;