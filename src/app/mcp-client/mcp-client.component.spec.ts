import { ComponentFixture, TestBed } from '@angular/core/testing';

import { McpClientComponent } from './mcp-client.component';

describe('McpClientComponent', () => {
  let component: McpClientComponent;
  let fixture: ComponentFixture<McpClientComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [McpClientComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(McpClientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
