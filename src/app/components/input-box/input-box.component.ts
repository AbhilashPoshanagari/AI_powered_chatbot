import { Component, EventEmitter, Output, AfterViewInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common'; 
// import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
// import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuTrigger } from '@angular/material/menu';
import { McpService } from '../../services/mcp.service';
import { NamedItem } from '../../common'; // Assuming you have a common.ts file for interfaces

@Component({
  selector: 'app-input-box',
  imports: [FormsModule, ReactiveFormsModule, CommonModule, MatMenuModule, 
    MatIconModule, MatInputModule, MatFormFieldModule, MatMenuTrigger],
  templateUrl: './input-box.component.html',
  styleUrl: './input-box.component.css',
  standalone: true
})
export class InputBoxComponent implements AfterViewInit {
  @Output() sendMessage = new EventEmitter<string>();
  message = '';
  showToolsMenu = false;
  showResourcesMenu = false;
  showPromptsMenu = false;

  tools:Array<NamedItem> = [];
  resources:Array<NamedItem> = [];
  prompts: Array<NamedItem> = [];

  selectedTool: string | null = null;
  selectedResource: string | null = null;
  selectedPrompt: string | null = null;

  constructor(private mcpService: McpService) {}

  submitMessage() {
    if (this.message.trim()) {
      this.sendMessage.emit(this.message);
      this.message = '';
    }
  }

  selectTool(tool: string) {
    this.selectedTool = tool;
    this.showToolsMenu = false;
    // You can add logic here to handle the selected tool
  }

  selectResource(resource: string) {
    this.selectedResource = resource;
    this.showResourcesMenu = false;
    // You can add logic here to handle the selected resource
  }

  selectPrompt(prompt: string) {
    this.selectedPrompt = prompt;
    this.showPromptsMenu = false;
    // You can add logic here to handle the selected prompt
    
  }

  async ngAfterViewInit(): Promise<void> {
    // Logic that needs to run after the view has been initialized
     try {
      await this.mcpService.connect();
      this.tools = await this.mcpService.listTools();
      this.prompts = await this.mcpService.listPrompts();
      this.resources = await this.mcpService.listResources();
      console.log('Tools:', this.tools);
      console.log('Prompts:', this.prompts); 
      console.log('Resources:', this.resources);
      // await this.mcpService.disconnect();
    } catch (error) {
      console.error('MCP interaction failed:', error);
    }
  }

  // async sendPrompt(promptName: string) {
  //   const args = {}; // Define your arguments here
  //   // const prompt = await this.mcpService.prompt(promptName, args);
  //   console.log('Sending prompt:', promptName);
  //   // Handle the prompt sending as needed
  // }

  // async activateTool(toolName: string) {
  //   const tool = this.tools.find(t => t.name === toolName);
  //   if (tool) {
  //     console.log('Activating tool:', tool);
  //     // Handle the tool activation as needed
  //   } else {
  //     console.error('Tool not found:', toolName);
  //   }
  // }
  
}
