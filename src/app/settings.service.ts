import {Injectable} from '@angular/core';

@Injectable()
export class SettingsService {
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
