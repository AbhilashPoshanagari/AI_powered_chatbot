import { TestBed } from '@angular/core/testing';

import { McpElicitationService } from './mcp-elicitation.service';

describe('McpElicitationService', () => {
  let service: McpElicitationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(McpElicitationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
