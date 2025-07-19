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

@Component({
  selector: 'app-root',
  imports: [InputBoxComponent, ChatbotComponent, SidebarComponent, MatSidenavModule, 
    MatButtonModule, MatIconModule, MatToolbarModule, MatListModule],
  standalone: true,
  providers: [McpService],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  messages: any[] = [];
  title = 'FieldOn chatbot';
  isSidebarOpen = true;
  chatMessages: any[] = [
    { sender: 'bot', content: 'Hello! How can I assist you today?', timestamp: new Date() }
  ];

  constructor(private mcpService: McpService) {}

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  handleNewMessage(message: string) {
    console.log(message);
    this.chatMessages.push({ sender: 'user', content: message, timestamp: new Date() });
    // Simulate bot response
    setTimeout(() => {
      this.chatMessages.push({ sender: 'bot', content: 'Thanks for your message! I\'m processing your request.', timestamp: new Date() });
    }, 1000);
  }
}
