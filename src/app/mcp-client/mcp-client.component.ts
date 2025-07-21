import { Component, OnInit, OnDestroy } from '@angular/core';
import { McpService } from '../services/mcp.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-mcp-client',
  imports: [CommonModule, FormsModule],
  templateUrl: './mcp-client.component.html',
  styleUrls: ['./mcp-client.component.css'],
  standalone: true
})
export class McpClientComponent implements OnInit, OnDestroy {
  isConnected = false;
  notifications: any[] = [];
  currentElicitRequest: any = null;
  private subscriptions: Subscription[] = [];

  constructor(private mcpService: McpService) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.mcpService.connectionStatus$.subscribe((status: any) => {
        this.isConnected = status;
      }),
      
      this.mcpService.notifications$.subscribe((notification: any) => {
        this.notifications.push(notification);
      }),
      
      this.mcpService.elicitRequests$.subscribe((request: any) => {
        this.currentElicitRequest = request;
      })
    );

    this.connect();
  }

  async connect() {
    try {
      await this.mcpService.connect();
    } catch (error) {
      console.error('Connection error:', error);
    }
  }

  async disconnect() {
    await this.mcpService.disconnect();
  }

  submitElicitForm(formData: any) {
    if (this.currentElicitRequest) {
      this.mcpService.submitElicitResponse({
        action: 'accept',
        content: formData
      });
      this.currentElicitRequest = null;
    }
  }

  cancelElicit() {
    this.mcpService.submitElicitResponse({
      action: 'cancel'
    });
    this.currentElicitRequest = null;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.disconnect();
  }
}