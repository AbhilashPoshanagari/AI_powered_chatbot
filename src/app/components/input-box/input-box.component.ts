import { Component, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core';
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
import { Subscription } from 'rxjs';
import { filter } from 'rxjs';
@Component({
  selector: 'app-input-box',
  imports: [FormsModule, ReactiveFormsModule, CommonModule, MatMenuModule, 
    MatIconModule, MatInputModule, MatFormFieldModule, MatMenuTrigger],
  templateUrl: './input-box.component.html',
  styleUrl: './input-box.component.css',
  standalone: true
})
export class InputBoxComponent implements OnInit, OnDestroy {
  @Output() sendMessage = new EventEmitter<string>();
  @Output() sendTool = new EventEmitter<Array<NamedItem>>();
  @Output() sendResource = new EventEmitter<string>();
  @Output() sendPrompt = new EventEmitter<string>();
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
  isConnected: boolean = false;
  private subs = new Subscription();
  constructor(private mcpService: McpService) {

  }


  ngOnInit(): void {
    this.subs.add(
          this.mcpService.connectionStatus$
            .pipe(filter(status => status === true))  // <--- FIXED HERE
            .subscribe((state) => {
              console.log("mcp input-box : ", state)
              this.subs.add(this.mcpService.tools$.subscribe(tools => this.tools = tools));
              this.subs.add(this.mcpService.promtps$.subscribe(prompts => this.prompts = prompts));
              this.subs.add(this.mcpService.resources$.subscribe(resources => this.resources = resources));
            })
        );
  }

  submitMessage() {
    if (this.message.trim()) {
      this.sendMessage.emit(this.message);
      this.sendTool.emit(this.tools);
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

  ngOnDestroy(): void {
    this.subs.unsubscribe();
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
