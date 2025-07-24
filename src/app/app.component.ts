import { Component } from '@angular/core';
// import { RouterOutlet } from '@angular/router';
import { McpService } from './services/mcp.service';
import { InputBoxComponent } from './components/input-box/input-box.component';
import { ChatbotComponent } from './components/chatbot/chatbot.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import {MatSidenavModule} from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { OpenAiService } from './services/open-ai.service';
import { McpClientComponent } from './mcp-client/mcp-client.component';
import { OpenAIFunctions } from './common';
import { AIMessage } from "@langchain/core/messages";
import { RunnableSequence } from "@langchain/core/runnables";
import { ElicitationComponent } from './components/elicitation/elicitation.component';
import { McpElicitationService } from './services/mcp/mcp-elicitation.service';

@Component({
  selector: 'app-root',
  imports: [InputBoxComponent, ChatbotComponent, SidebarComponent, MatSidenavModule, McpClientComponent,
    MatButtonModule, MatIconModule, MatToolbarModule, MatListModule, ElicitationComponent],
  standalone: true,
  providers: [McpService, McpElicitationService],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  messages: any[] = [];
  title = 'AI powered chatbot';
  isSidebarOpen = true;
  chatMessages: any[] = [
    { sender: 'bot', content: 'Hello! How can I assist you today?', timestamp: new Date() }
  ];
  opentAI_functions: OpenAIFunctions[] | undefined;
  llm_model: any;
  llm_with_tools: any;
  errorMessage: string = '';
  system_prompt: string = '';
  human_prompt: string = '';
  llm_runnable: any;
  tool_response: any;
  chatOutput: any;
  intermediateSteps: Array<[any, any]> = [];

  constructor(private mcpService: McpService, private openAIService: OpenAiService) {

    this.system_prompt = "You are a helpful assistant. Use tools *only* when needed. \
     If you already have the answer, reply normally instead of calling a tool again.";
    this.human_prompt = "{input}";
    this.openAIService.getOpenAIFunctions().subscribe(result => {
      if (result.status === 200) {
         try {
            this.llm_model = this.openAIService.getOpenAiClient()
            this.llm_with_tools = this.openAIService.openAImodels("langchain", 
            this.llm_model,
            result.open_ai,
            this.system_prompt,
            this.human_prompt
            )
            this.llm_runnable = RunnableSequence.from([
                    this.llm_with_tools.overall_prompt,
                    this.llm_with_tools.mode_with_tools
                  ]);

          } catch (error) {
            
          }
      } else {
        this.errorMessage = result.message;
        console.error('Error loading OpenAI functions:', result.message);
      }
    });    

  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

appendMessages(messages: any){
  this.chatMessages.push({ sender: 'bot', 
      content: messages,
      timestamp: new Date() });
}

async toolCall(toolname: string, args: any){
  const toolName = toolname;
  const toolArgs = args;
  const rag_response: any = await this.mcpService.callTool(toolName, toolArgs);
      console.log("rag response : ", rag_response)
}

async agentWorkflow(userInput: string) {
  // Initial user message
  const inputMessages: any[] = [
    { role: 'user', content: userInput }
  ];
 // Optionally add user's question to chat
      this.chatMessages.push({
        sender: 'user',
        content: userInput,
        timestamp: new Date()
      });
  // First call to the model
  const firstResponse = await this.llm_runnable.invoke({ input: inputMessages });

  if (firstResponse instanceof AIMessage) {
    // 📡 Tool call expected
    if (firstResponse.tool_calls && firstResponse.tool_calls.length > 0) {
      console.log("Open AI func res : ", firstResponse.tool_calls)
      const tool_call = firstResponse.tool_calls[0];  // handle one tool for now

      const toolArgs = tool_call.args;
      const toolName = tool_call.name;

      console.log(`Tool call: ${toolName}(${JSON.stringify(toolArgs)})`);

      const rag_response: any = await this.mcpService.callTool(toolName, toolArgs);
      console.log("rag response : ", rag_response)
      const toolOutput = rag_response["structuredContent"].result;

      this.appendMessages(toolOutput);

      // Add assistant tool_call response
      inputMessages.push({
        type: 'function_call',
        id: tool_call.id,
        name: tool_call.name,
        arguments: JSON.stringify(toolArgs),
      });

      // Add tool output as structured message
      inputMessages.push({
        type: "function_call_output",
        id: tool_call.id,
        output: toolOutput
      });

      // Second call to model with appended context
      const secondResponse = await this.llm_runnable.invoke({ input: inputMessages });

      if (secondResponse instanceof AIMessage && secondResponse.content) {
        this.appendMessages(secondResponse.content);
      } else {
        this.appendMessages(secondResponse);
      }
    } else if (firstResponse.content) {
      // LLM gave final response without any tool
      this.appendMessages(firstResponse.content);
    }
  } else {
    // 🛠 Fallback
    this.appendMessages(firstResponse);
  }
}

  
}
