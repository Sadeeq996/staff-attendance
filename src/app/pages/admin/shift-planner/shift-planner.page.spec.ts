import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShiftPlannerPage } from './shift-planner.page';

describe('ShiftPlannerPage', () => {
  let component: ShiftPlannerPage;
  let fixture: ComponentFixture<ShiftPlannerPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ShiftPlannerPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
