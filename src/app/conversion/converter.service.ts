import { Injectable } from '@angular/core';
import { ConvertRequest } from './ConvertRequest';

@Injectable()
export class ConverterService {
  private _worker: Worker;
  private _currentRequest: ConvertRequest;

  constructor() {
    this.init();
  }

  private init() {
    this._worker = new Worker('bundle.js');
    this._worker.onmessage = e => {
      const request = this._currentRequest;
      if (!request || e.data.id !== request.id) return;
      this._currentRequest = null;
      if (e.data.error) {
        request.response.error(e.data.error);
      } else {
        request.response.next({ 'output': e.data.output, 'warnings': e.data.warnings });
        request.response.complete();
      }
    };
    this._worker.onerror = e => {
      const request = this._currentRequest;
      this._currentRequest = null;
      this._worker.terminate();
      this.init();
      if (request) {
        request.response.error(e.message);
      }
      e.preventDefault();
    };
  }

  private abort(request: ConvertRequest) {
    if (request !== this._currentRequest) return;
    this._currentRequest = null;
    this._worker.terminate();
    this.init();
  }

  convert(request: ConvertRequest) {
    if (this._currentRequest) throw new Error('Invalid operation.');
    this._currentRequest = request;
    request.abort.subscribe(() => this.abort(request));
    this._worker.postMessage({ 'id': request.id, 'file': request.inputFile, 'lib': request.lib, 'fixFillType': request.fixFillType });
  }
}
