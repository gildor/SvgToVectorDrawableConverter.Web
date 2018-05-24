import { HttpClient, HttpErrorResponse, HttpParams } from "@angular/common/http";
import { Subject } from "rxjs";
import { SettingsService } from "../services/settings.service";

export class ReportIssueRequest {
  constructor(
    readonly svgName: string,
    readonly svgContent: string,
    readonly additionalInformation: string,
    private readonly _httpClient: HttpClient,
    private readonly _settings: SettingsService
  ) { }

  issueUrl: string | null;
  errorMessage: string | null;
  autoRetryAt: number | null;

  private readonly _error = new Subject();

  error() {
    return this._error.asObservable();
  }

  success() {
    return this._error.isStopped;
  }

  loading = false;

  private _timeoutId;

  load() {
    clearTimeout(this._timeoutId);
    this._timeoutId = undefined;

    if (this.success() || this.loading) return;
    this.loading = true;

    this._httpClient.post("https://api.github.com/repos/a-student/SvgToVectorDrawableConverter.Web/issues",
      { "title": this.getIssueTitle(), "body": this.getIssueBody() },
      { "params": new HttpParams().set("access_token", this._settings.githubPersonalAccessToken) }
    )
      .subscribe(
        x => {
          this.issueUrl = x["html_url"];
          this.errorMessage = null;
          this.autoRetryAt = null;

          this.loading = false;
          this._error.complete();
        },
        (e: HttpErrorResponse) => {
          this.issueUrl = null;
          this.errorMessage = (e.error ? e.error.message : null) || e.statusText;

          const now = new Date().getTime();
          const rateLimitRemaining = parseInt(e.headers.get("X-RateLimit-Remaining"));
          const rateLimitResetAt = parseInt(e.headers.get("X-RateLimit-Reset")) * 1000;
          this.autoRetryAt = rateLimitRemaining <= 0 && rateLimitResetAt > now ? rateLimitResetAt : now + 60 * 1000;

          this.loading = false;
          this._timeoutId = setTimeout(this.load.bind(this), this.autoRetryAt - now);
          this._error.next();
        });
  }

  private getIssueTitle() {
    return `Conversion issue with ${this.svgName}`;
  }

  private getIssueBody() {
    let body = `SVG name: \`${this.svgName}\`\n\nSVG content:\n\`\`\`SVG\n${this.svgContent}\n\`\`\`\n`;
    if (this.additionalInformation) {
      body += `\n${this.additionalInformation}`;
    }
    return body;
  }
}
