import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { mcp_base_url } from '../apiUrl';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import {
  ListToolsRequest,
  ListToolsResultSchema,
  ListPromptsRequest,
  ListPromptsResultSchema,
  ListResourcesRequest,
  ListResourcesResultSchema,
  ToolSchema,
  PromptSchema,
  ResourceSchema
} from '@modelcontextprotocol/sdk/types.js';
import { getDisplayName } from '@modelcontextprotocol/sdk/shared/metadataUtils.js';

@Injectable({ providedIn: 'root' })
export class McpService {
  private serverUrl = 'http://localhost:3000/fieldOn_rag/mcp/';
  private client: Client;
  private transport: StreamableHTTPClientTransport;

  constructor() {
    this.client = new Client(
      { name: 'angular-client', version: '1.0.0' },
      { capabilities: {} }
    );
    this.transport = new StreamableHTTPClientTransport(new URL(this.serverUrl));
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect(this.transport);
      console.log(`Connected to MCP server at ${this.serverUrl}`);
    } catch (err) {
      console.error('Connection error:', err);
      throw err;
    }
  }


  // async getAllTools(){
  //   let result: any = await this.client.listTools();
  //   let resources_map = result.resources.map((res: any) => ({
  //       name: res.name,
  //       displayName: getDisplayName(res),
  //       uri: res.uri
  //     }));
  //   return resources_map;
  // }


  // async getAllPrompts(){
  //   let result: any = await this.client.listPrompts();
  //   let resources_map = result.resources.map((res: any) => ({
  //       name: res.name,
  //       displayName: getDisplayName(res),
  //       uri: res.uri
  //     }));
  //   return resources_map;
  // }



  // async getAllResources(){
  //   let result: any = await this.client.listResources();
  //   let resources_map = result.resources.map((res: any) => ({
  //       name: res.name,
  //       displayName: getDisplayName(res),
  //       uri: res.uri
  //     }));
  //   return resources_map;
  // }

  // async getAllActions(){
  //   let tools: any = await this.client.listTools();

  //   // List tools
  //   console.log('Tools:', tools);
  //   // List prompts
  //   let prompts: any = await this.client.listPrompts();

  //   console.log('Prompts:', prompts);
  //   // Get a prompt
  //   const prompt = await this.client.getPrompt({
  //     name: prompts.prompts[0].name,
  //     arguments: {
  //       topic: 'llms'
  //     }
  //   });

  //   console.log('Prompt:', prompt);
  //   // List resources
  //   const resources: any = await this.client.listResources();

  //   console.log('Resources:', resources);

  //   // Read a resource
  //   const resource = await this.client.readResource({
  //     uri: resources.resources[0].uri
  //   });
  //   console.log('Resource:', resource);
  // }

  async disconnect(): Promise<void> {
    await this.transport.close();
    console.log('Disconnected from MCP server');
  }

  async listTools(): Promise<any[]> {
    const request: ListToolsRequest = {
      method: 'tools/list',
      params: {}
    };

    try {
      const result = await this.client.request(request, ListToolsResultSchema);
      if (!result.tools || result.tools.length === 0) {
        console.warn('No tools found');
        return [];
      }else {
        let tools_map = result.tools.map(tool => ({
                name: tool.name,
                displayName: getDisplayName(tool).replaceAll('_', ' '),
                description: tool.description
              }));
        // console.log('Tools found:', tools_map);
        return tools_map;
      }
    } catch (err) {
      console.warn('Tools not supported:', err);
      return [];
    }
  }

    async listPrompts(): Promise<any[]> {
    const request: ListPromptsRequest = {
      method: 'prompts/list',
      params: {}
    };

    try {
      const result = await this.client.request(request, ListPromptsResultSchema);
      let prompts_map = result.prompts.map(prompt => ({
                name: prompt.name,
                displayName: getDisplayName(prompt).replaceAll('_', ' '),
                description: prompt.description
              }));
      // console.log('Prompts found:', prompts_map);
      return prompts_map
    } catch (err) {
      console.warn('Prompts not supported:', err);
      return [];
    }
  }

  async listResources(): Promise<any[]> {
    const request: ListResourcesRequest = {
      method: 'resources/list',
      params: {}
    };

    try {
      const result = await this.client.request(request, ListResourcesResultSchema);
      let resources_map = result.resources.map(res => ({
        name: res.name,
        displayName: getDisplayName(res).replaceAll('_', ' '),
        uri: res.uri
      }));
      // console.log('Resources found:', resources_map);
      return resources_map
    } catch (err) {
      console.warn('Resources not supported:', err);
      return [];
    }
  }

async callTool(toolName: string, args: any): Promise<any> {
  if (!toolName || !args) {
      throw new Error('Tool name and arguments are required');
    }
    console.log('Calling tool:', toolName, 'with args:', args);
    const request = { 
      method: 'tools/call',
      params: {
        toolName,
        args
      }
    };
    return await this.client.request(request, ToolSchema);
  }

async prompt(promptName: string, args: any): Promise<any> {
  if (!promptName || !args) { 
    throw new Error('Prompt name and arguments are required');
  }
  console.log('Calling tool:', promptName, 'with args:', args);
  const request = {
    method: 'prompts/call',
    params: {
      promptName,
      args
    }
  };
  return await this.client.request(request, PromptSchema);
}

async resource(uri: string): Promise<any> {
  if (!uri) {
    throw new Error('Resource URI is required');
  }
  console.log('Resource:', uri);
  const request = {
    method: 'resources/read',
    params: {
      uri
    }
  };
  return await this.client.request(request, ResourceSchema);
}

}
