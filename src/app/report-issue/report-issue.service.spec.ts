import { TestBed, inject } from '@angular/core/testing';

import { ReportIssueService } from './report-issue.service';

describe('ReportIssueService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ReportIssueService]
    });
  });

  it('should be created', inject([ReportIssueService], (service: ReportIssueService) => {
    expect(service).toBeTruthy();
  }));
});
