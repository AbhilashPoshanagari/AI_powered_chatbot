import { TestBed } from '@angular/core/testing';

import { ToolcallService } from './toolcall.service';

describe('ToolcallService', () => {
  let service: ToolcallService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToolcallService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
