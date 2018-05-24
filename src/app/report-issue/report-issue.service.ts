import { Injectable } from "@angular/core";
import { Subject } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { ReportIssueRequest } from "./ReportIssueRequest";
import { SettingsService } from "../services/settings.service";
import "rxjs/add/operator/finally";

@Injectable({
  providedIn: "root"
})
export class ReportIssueService {
  private readonly _open = new Subject<{ svgName: string, svgContent: string }>();
  private readonly _report = new Subject<ReportIssueRequest>();

  private readonly _pendingRequests = new Array<ReportIssueRequest>();

  open() {
    return this._open.asObservable();
  }

  report() {
    return this._report.asObservable();
  }

  openIssue(svgName: string, svgContent: string) {
    this._open.next({ svgName, svgContent });
  }

  constructor(
    private readonly _httpClient: HttpClient,
    private readonly _settings: SettingsService
  ) { }

  reportPendingIssues() {
    const reportIssuePendingRequests = localStorage.getItem("reportIssuePendingRequests");
    if (reportIssuePendingRequests) {
      JSON.parse(reportIssuePendingRequests).forEach(x => this.reportIssue(x.svgName, x.svgContent, x.additionalInformation));
    }
  }

  private savePendingRequests() {
    const reportIssuePendingRequests = JSON.stringify(this._pendingRequests.map(x => ({ "svgName": x.svgName, "svgContent": x.svgContent, "additionalInformation": x.additionalInformation })));
    localStorage.setItem("reportIssuePendingRequests", reportIssuePendingRequests);
  }

  reportIssue(svgName: string, svgContent: string, additionalInformation: string) {
    const request = new ReportIssueRequest(svgName, svgContent, additionalInformation, this._httpClient, this._settings);
    this._pendingRequests.push(request);
    this.savePendingRequests();
    request.error()
      .finally(() => {
        this._pendingRequests.remove(request);
        this.savePendingRequests();
      })
      .subscribe();
    this._report.next(request);
    request.load();
  }
}
