import { Injectable } from '@angular/core';
import { Observable, from, Subject, BehaviorSubject } from 'rxjs';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { getDisplayName } from '@modelcontextprotocol/sdk/shared/metadataUtils.js';
import {
  ListToolsRequest,
  ListToolsResultSchema,
  CallToolRequest,
  CallToolResultSchema,
  ListPromptsRequest,
  ListPromptsResultSchema,
  GetPromptRequest,
  GetPromptResultSchema,
  ListResourcesRequest,
  ListResourcesResultSchema,
  LoggingMessageNotificationSchema,
  ResourceListChangedNotificationSchema,
  ElicitRequestSchema,
  ResourceLink,
  ReadResourceRequest,
  ReadResourceResultSchema,
  ToolSchema,
  PromptSchema,
  ResourceSchema
} from '@modelcontextprotocol/sdk/types.js';
import Ajv from "ajv";

export interface ElicitPrompt {
  message: string;
  schema: any;
  fields: ElicitField[];
}

export interface ElicitField {
  name: string;
  title: string;
  description?: string;
  type: string;
  required: boolean;
  enum?: string[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  format?: string;
  default?: any;
}

@Injectable({ providedIn: 'root' })
export class McpService {
  private serverUrl = 'http://localhost:3000/fieldOn_rag/mcp/';
  private client: Client | null = null;
  private transport: StreamableHTTPClientTransport | null = null;
  public sessionId: string | undefined = undefined;
  public notificationCount = 0;
  
  // Subjects for handling events and state
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  private notificationsSubject = new Subject<any>();
  private elicitRequestSubject = new Subject<ElicitPrompt>();
  
  // Public observables
  public connectionStatus$ = this.connectionStatusSubject.asObservable();
  public notifications$ = this.notificationsSubject.asObservable();
  public elicitRequests$ = this.elicitRequestSubject.asObservable();

  constructor() {}

  async connect(url?: string): Promise<void> {
    let serverUrl = url || this.serverUrl;
    let storedSessionId: string | null = null
    // if (this.client) {
    //   console.log('Already connected. Disconnect first.');
    //   return;
    // }
    if (this.client) {
    await this.disconnect(); // Clean up existing connection first
  }

    console.log(`Connecting to ${serverUrl}...`);

    try {
      // Clear invalid session ID if exists
      storedSessionId = localStorage.getItem('mcp_session_id');
      if (storedSessionId) {
        try {
          // Verify if session is still valid
          const testResponse = await fetch(`${serverUrl}/session/check`, {
            headers: { 'X-Session-ID': storedSessionId }
          });
          if (!testResponse.ok) {
            localStorage.removeItem('mcp_session_id');
          }
        } catch (e) {
          localStorage.removeItem('mcp_session_id');
        }
      }
      // Create a new client with elicitation capability
      this.client = new Client({
        name: 'angular-mcp-client',
        version: '1.0.0'
      }, {
        capabilities: {
          elicitation: {},
        },
      });

       // Configure transport with proper headers and session management
    this.transport = new StreamableHTTPClientTransport(
      new URL(serverUrl),
      {
        sessionId: localStorage.getItem('mcp_session_id') || undefined,
        requestInit: {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          cache: 'no-store', // Disable caching
        },
        reconnectionOptions: {
          maxReconnectionDelay: 30000,
          initialReconnectionDelay: 1000,
          reconnectionDelayGrowFactor: 1.5,
          maxRetries: 3
        }
      }
    );

    // Set up error handler
    this.transport.onerror = (error) => {
      console.error('Transport error:', error);
      if (error.message.includes('session')) {
        localStorage.removeItem('mcp_session_id');
      }
    };

      this.client.onerror = (error) => {
        console.error('Client error:', error);
        this.notificationsSubject.next({
          type: 'error',
          message: error.message
        });
      };

      // Set up elicitation request handler with proper validation
      this.client.setRequestHandler(ElicitRequestSchema, async (request) => {
        console.log('Elicitation Request Received:', request);
        
        const schema = request.params.requestedSchema;
        const properties = schema.properties;
        const required = schema.required || [];
        
        // Convert schema to a more Angular-friendly format
        const fields: ElicitField[] = Object.entries(properties).map(([fieldName, fieldSchema]: [string, any]) => ({
          name: fieldName,
          title: fieldSchema.title || fieldName,
          description: fieldSchema.description,
          type: fieldSchema.type || 'string',
          required: required.includes(fieldName),
          enum: fieldSchema.enum,
          minimum: fieldSchema.minimum,
          maximum: fieldSchema.maximum,
          minLength: fieldSchema.minLength,
          maxLength: fieldSchema.maxLength,
          format: fieldSchema.format,
          default: fieldSchema.default
        }));

        const prompt: ElicitPrompt = {
          message: request.params.message,
          schema: schema,
          fields: fields
        };

        // Emit the elicit request to subscribers
        this.elicitRequestSubject.next(prompt);
        
        // Return a promise that will be resolved when the user submits the form
        return new Promise((resolve) => {
          const subscription = this.elicitRequestSubject.subscribe((nextPrompt) => {
            if (nextPrompt === prompt) { // Check if it's the same request
              // When the UI component calls submitElicitResponse, this promise will resolve
              // The actual response handling is done in submitElicitResponse method
            }
          });
        });
      });

      // storedSessionId = localStorage.getItem('mcp_session_id');
      // this.transport = new StreamableHTTPClientTransport(
      //   new URL(serverUrl),
      //   {
      //     sessionId: storedSessionId || undefined,
      //   }
      // );

      // Set up notification handlers
      this.client.setNotificationHandler(LoggingMessageNotificationSchema, (notification) => {
        this.notificationCount++;
        const notificationMessage = {
          type: 'log',
          level: notification.params.level,
          message: notification.params.data,
          count: this.notificationCount
        };
        console.log('MCP Notification:', notificationMessage);
        this.notificationsSubject.next(notificationMessage);
      });

      this.client.setNotificationHandler(ResourceListChangedNotificationSchema, async (_) => {
        console.log('Resource list changed notification received');
        this.notificationsSubject.next({
          type: 'resource-change',
          message: 'Resource list has changed'
        });
        
        try {
          if (!this.client) {
            console.log('Client disconnected, cannot fetch resources');
            return;
          }
          const resourcesResult = await this.client.request({
            method: 'resources/list',
            params: {}
          }, ListResourcesResultSchema);
          this.notificationsSubject.next({
            type: 'resource-list',
            resources: resourcesResult.resources
          });
        } catch (error) {
          console.log('Failed to list resources after change notification', error);
          this.notificationsSubject.next({
            type: 'error',
            message: 'Failed to fetch updated resources'
          });
        }
      });

      // Connect the client
      await this.client.connect(this.transport);
      this.sessionId = this.transport.sessionId;
      if (this.sessionId) {
        localStorage.setItem('mcp_session_id', this.sessionId);
      }
      console.log('Transport created with session ID:', this.sessionId);
      console.log('Connected to MCP server');
      this.connectionStatusSubject.next(true);
    } catch (error) {
      console.error('Failed to connect:', error);
      this.client = null;
      this.transport = null;
      this.connectionStatusSubject.next(false);
      throw error; // Re-throw to allow error handling by caller
    }
  }

// Add this method to handle reconnection with existing session
async reconnect(): Promise<void> {
  const storedSessionId = localStorage.getItem('mcp_session_id');
  if (storedSessionId) {
    this.sessionId = storedSessionId;
    await this.connect();
  } else {
    throw new Error('No stored session ID found');
  }
}

  // Method to submit elicit responses from UI components
  submitElicitResponse(response: { action: 'accept' | 'decline' | 'cancel', content?: any }): void {
    this.elicitRequestSubject.next(response as any); // Trigger the promise resolution
  }

  // Wrapper methods for common MCP operations
  listTools(): Observable<any> {
    if (!this.client) {
      throw new Error('Client not connected');
    }
    return from(this.client.request({
      method: 'tools/list',
      params: {}
    }, ListToolsResultSchema));
  }

  callTool(toolId: string, parameters: any): Observable<any> {
    if (!this.client) {
      throw new Error('Client not connected');
    }
    return from(this.client.request({
      method: 'tools/call',
      params: {
        toolId,
        parameters
      }
    }, CallToolResultSchema));
  }

  listPrompts(): Observable<any> {
    if (!this.client) {
      throw new Error('Client not connected');
    }
    return from(this.client.request({
      method: 'prompts/list',
      params: {}
    }, ListPromptsResultSchema));
  }

  getPrompt(promptId: string): Observable<any> {
    if (!this.client) {
      throw new Error('Client not connected');
    }
    return from(this.client.request({
      method: 'prompts/get',
      params: {
        promptId
      }
    }, GetPromptResultSchema));
  }

  listResources(): Observable<any> {
    if (!this.client) {
      throw new Error('Client not connected');
    }
    return from(this.client.request({
      method: 'resources/list',
      params: {}
    }, ListResourcesResultSchema));
  }

  readResource(resourceLink: ResourceLink): Observable<any> {
    if (!this.client) {
      throw new Error('Client not connected');
    }
    return from(this.client.request({
      method: 'resources/read',
      params: {
        resourceLink
      }
    }, ReadResourceResultSchema));
  }

// async disconnect(): Promise<void> {
//   if (!this.client || !this.transport) {
//     console.log('Not connected.');
//     return;
//   }

//   try {
//     await this.transport.close();
//     console.log('Disconnected from MCP server');
//     this.client = null;
//     this.transport = null;
//   } catch (error) {
//     console.error('Error disconnecting:', error);
//   }
// }

// Update your disconnect method
async disconnect(): Promise<void> {
  if (this.client || !this.transport) {
    try {
      // Clear the stored session ID
      await this.transport?.close();
      localStorage.removeItem('mcp_session_id');
    } catch (error) {
      console.error('Error during disconnect:', error);
    }
    this.client = null;
    this.transport = null;
    this.sessionId = undefined;
    this.connectionStatusSubject.next(false);
  }
}

}