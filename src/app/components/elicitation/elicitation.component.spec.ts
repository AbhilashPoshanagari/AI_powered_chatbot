import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ElicitationComponent } from './elicitation.component';

describe('ElicitationComponent', () => {
  let component: ElicitationComponent;
  let fixture: ComponentFixture<ElicitationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ElicitationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ElicitationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
