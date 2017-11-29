import {Injectable} from '@angular/core';

@Injectable()
export class SettingsService {
  readonly backendUrl = 'http://193.124.64.166:5000/api/svg2vd/v2';

  get libId(): string {
    return localStorage.libId;
  }

  set libId(value: string) {
    localStorage.libId = value;
  }

  get fixFillType(): boolean {
    return localStorage.fixFillType === 'true';
  }

  set fixFillType(value: boolean) {
    localStorage.fixFillType = value.toString();
  }
}
