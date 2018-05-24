import { Injectable } from "@angular/core";

@Injectable()
export class SettingsService {
  readonly githubPersonalAccessToken = "f8c88ca4be04231de3f6" +
                                       "289f3be503ec2df0af78";

  get libId(): string {
    return localStorage.libId;
  }

  set libId(value: string) {
    localStorage.libId = value;
  }

  get fixFillType(): boolean {
    return localStorage.fixFillType === "true";
  }

  set fixFillType(value: boolean) {
    localStorage.fixFillType = value.toString();
  }
}
