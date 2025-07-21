import { Injectable } from '@angular/core';
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { 
  SystemMessagePromptTemplate, 
  HumanMessagePromptTemplate 
} from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { Runnable, RunnableSequence } from "@langchain/core/runnables";
import { McpService } from './mcp.service';
// import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { OPENAI_API_KEY } from '../../../api_keys';
import { RestApiService } from './rest-api.service';
import { urls } from '../apiUrl';

@Injectable({
  providedIn: 'root'
})
export class OpenAiService {
  openAI_key: string = OPENAI_API_KEY;
  langchain_model: any = null;
  openAi_format: string = urls.open_ai_funcs;

  constructor(private mcpService: McpService, private restApiService: RestApiService) {
    if (!this.openAI_key) { 
      console.error('OpenAI API key is not set. Please set the OPENAI_API_KEY environment variable.');
    }
    console.log('OpenAI API Key:', this.openAI_key);
    // this.langchain_model = await this.getOpenAiClient();
  }

  async getOpenAiClient(): Promise<any> {
    if (!this.openAI_key) {
      throw new Error('OpenAI API key is not set');
    }
    if (this.langchain_model) {
      return this.langchain_model;
    }
    
   const llm = new ChatOpenAI({
                        apiKey: this.openAI_key,
                        model: 'gpt-4o-mini',
                        temperature: 0,
                        maxTokens: 512
                        });
    return llm;
  }

  async getResponse(message: string): Promise<string> {
      const llm = await this.getOpenAiClient();                  
      let openAiTools: any = this.fetchOpenAIfuncs(this.openAi_format);
      console.log("openAitools : ", openAiTools)
      llm.bindTools(openAiTools.openai_functions, { tool_choice: "auto"});
    const prompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate("You are a helpful assistant."),
      HumanMessagePromptTemplate.fromTemplate("{input}")
    ]);

    const runnable = RunnableSequence.from([
      prompt,
      this.langchain_model,
      new StringOutputParser()
    ]);

    const response = await runnable.invoke({ input: message });
    console.log("Response from OpenAI:", response);
    return response;
  }

fetchOpenAIfuncs(url: string){
return this.restApiService.getRequest(url);
}

async createAgent(question: string): Promise<void> {
    const llm = await this.getOpenAiClient();                  
    this.fetchOpenAIfuncs(this.openAi_format).subscribe(async (res: any) => {
        if(res.status == "OK"){
          const agent = createReactAgent({
                  llm: llm,
                  tools: res.open_ai
                });

                const agentNextState = await agent.invoke({ 
                  messages: [new HumanMessage(question)] },
                  { configurable: { thread_id: "42" } });
              console.log("Agent Next State:", agentNextState);
              return agentNextState
        }else {
          console.log("Error : ")
          return "Error"
        }
      });
  }
  
}
