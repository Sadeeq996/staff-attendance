import { TestBed } from '@angular/core/testing';

import { ShiftPlannerService } from './shift-planner-service';

describe('ShiftPlannerService', () => {
  let service: ShiftPlannerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ShiftPlannerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
