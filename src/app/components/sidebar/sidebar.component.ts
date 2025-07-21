import { Component, OnInit, AfterViewInit } from '@angular/core';
import { McpService } from '../../services/mcp.service';
import {MatTabsModule} from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatNavList } from '@angular/material/list';
import { MatListModule } from '@angular/material/list';
import { CommonModule } from '@angular/common';
import { McpClientComponent } from '../../mcp-client/mcp-client.component';
interface NamedItem {
  name: string;
}
interface Resource extends NamedItem {
  description: string;
  url: string;
}
interface Tool extends NamedItem {
  description: string;
  parameters: any; // Define the structure of parameters as needed
}

@Component({
  selector: 'app-sidebar',
  imports: [MatTabsModule, MatIconModule, MatNavList, MatListModule, CommonModule, McpClientComponent],
  providers: [McpService],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
  standalone: true
})
export class SidebarComponent implements OnInit {
  chats = [
    { title: 'New Chat', icon: 'add' },
    { title: 'Project Discussion', icon: 'chat' },
    { title: 'Code Review', icon: 'code' },
    { title: 'Documentation Help', icon: 'description' }
  ];

  // prompts: Array<NamedItem> = [{ name: 'No prompts available' }];
  // tools: Array<Tool> = [{ name: 'No tools available', description: '', parameters: {} }];
  // resources: Array<Resource> = [{ name: 'No resources available', description: '', url: '' }];

  constructor(private mcpService: McpService) {

  }

  ngOnInit(): void {
    // Initialization logic if needed
  }

}
