import {Component, ElementRef, NgZone, OnInit, ViewChild} from '@angular/core';
import {animate, state, style, transition, trigger} from '@angular/animations';
import * as base64js from 'base64-js';
import * as JSZip from 'jszip';
import * as FileSaver from 'file-saver';
import {SendingEvent} from '../dropzone/SendingEvent';
import {SettingsService} from '../services/settings.service';
import {StatsService} from '../services/stats.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css'],
  animations: [
    trigger('slideTop', [
      state('*', style({opacity: 0, transform: 'translateY(100%)', display: 'none'})),
      state('visible', style({opacity: 1, transform: 'translateY(0)'})),
      transition('* => visible', animate(300))
    ])
  ]
})
export class MainComponent implements OnInit {
  @ViewChild('cardTextContainer') cardTextContainer: ElementRef;

  readonly libs = [
    {id: '', text: 'Android 5.0+'},
    {id: 'ApiLevel24', text: 'Android 7.0+'},
    {id: 'BetterVectorDrawable', text: 'BetterVectorDrawable'},
    {id: 'res-auto', text: 'res-auto'}
  ];

  cardState: string;
  cardTitle: string;
  cardText: string;
  zipBlob: Blob;
  singleFileTitle: string;
  singleFileXml: string;
  xmlViewState: string;
  canAbortConversion: boolean;
  abortConversionModalOpen: boolean;
  canRetryConversion: boolean;
  retryButtonText: string;
  fileCount: number;
  isProgressRunning: boolean;
  progressState: ProgressState;

  readonly progressStateEnum = ProgressState;

  constructor(readonly settings: SettingsService, private readonly _zone: NgZone, private readonly _stats: StatsService) {
    this.restart();
  }

  libText(): string {
    let lib = this.libs.find(x => x.id === this.settings.libId);
    if (!lib) {
      lib = this.libs[0];
      this.settings.libId = lib.id;
    }
    return lib.text;
  }

  ngOnInit(): void {
    this.cardTextContainer.nativeElement.fixFillTypeClick = this.fixFillTypeClick.bind(this);
  }

  private fixFillTypeClick(): void {
    this._zone.run(() => this.settings.fixFillType = true);

    this._stats.reachGoal('click:fix-fill-type');
  }

  restart(): void {
    this.cardState = null;
    this.cardTitle = null;
    this.cardText = null;
    this.zipBlob = null;
    this.singleFileTitle = null;
    this.singleFileXml = null;
    this.xmlViewState = null;
    this.canAbortConversion = false;
    this.abortConversionModalOpen = false;
    this.canRetryConversion = false;
    this.retryButtonText = 'Retry';
    this.fileCount = -1;
    this.isProgressRunning = false;
    this.progressState = ProgressState.Unknown;
  }

  sending(event: SendingEvent): void {
    this._stats.reachGoal('sending', {lib: this.settings.libId, fixFillType: this.settings.fixFillType});

    event.formData.append('lib', this.settings.libId);
    event.formData.append('fixFillType', this.settings.fixFillType ? 'on' : '');

    event.xhr.upload.addEventListener('progress', e => {
      this.cardState = 'visible';
      this.cardTitle = 'Uploading';
      this.cardText = e.lengthComputable ? Math.round(e.loaded / e.total * 100) + '%' : '';
      this.canAbortConversion = true;
      this.isProgressRunning = true;
    });
    event.xhr.addEventListener('progress', () => {
      this.cardState = 'visible';
      this.cardTitle = 'Converting';
      this.cardText = this.getCardText(event.xhr.response);
      this.canAbortConversion = true;
      this.isProgressRunning = true;
      this.updateProgressState(false);
    });
    event.xhr.addEventListener('load', () => {
      this.cardState = 'visible';
      this.cardTitle = 'Done';
      this.cardText = this.getCardText(event.xhr.response);
      this.canAbortConversion = false;
      this.abortConversionModalOpen = false;
      this.isProgressRunning = false;
      this.updateProgressState(false);
      if (event.xhr.status === 200) {
        const index = event.xhr.response.indexOf('\0');
        if (index < 0) {
          this.cardTitle = 'Failed';
          this.canRetryConversion = true;
          this.progressState = ProgressState.Error;

          this._stats.reachGoal('received:failed');
        } else {
          const data = base64js.toByteArray(event.xhr.response.substring(index + 1));
          this.zipBlob = new Blob([data], {type: 'application/zip'});
          new JSZip()
            .loadAsync(data, {checkCRC32: true})
            .then(
              async zip => {
                this.updateProgressState(true);
                const keys = Object.keys(zip.files);
                this.fileCount = keys.length;
                switch (this.fileCount) {
                  case 0:
                    this.cardTitle = 'Error';
                    this.zipBlob = null;
                    break;
                  case 1:
                    this.singleFileTitle = keys[0];
                    this.singleFileXml = await zip.files[this.singleFileTitle].async('text');
                    this.xmlViewState = 'visible';
                }

                this._stats.reachGoal('received:good-zip', {fileCount: this.fileCount, state: ProgressState[this.progressState]});
              },
              (e: Error) => {
                this.cardTitle = 'Corrupted ZIP';
                this.canRetryConversion = true;
                this.progressState = ProgressState.Error;

                this._stats.reachGoal('received:corrupted-zip', {message: e.message});
              }
            );
        }
      } else {
        this.cardTitle = event.xhr.statusText;
        this.canRetryConversion = true;
        this.progressState = ProgressState.Error;

        this._stats.reachGoal('received:status-error', {status: event.xhr.status, text: this.cardText});
      }
    });
    event.xhr.addEventListener('error', () => {
      this.cardState = 'visible';
      this.cardTitle = 'Network Error';
      this.canAbortConversion = false;
      this.abortConversionModalOpen = false;
      this.canRetryConversion = true;
      this.isProgressRunning = false;
      this.progressState = ProgressState.Error;

      this._stats.reachGoal('received:network-error');
    });
    event.xhr.addEventListener('abort', () => {
      this.cardState = 'visible';
      this.cardTitle = 'Aborted';
      this.canAbortConversion = false;
      this.abortConversionModalOpen = false;
      this.canRetryConversion = true;
      this.retryButtonText = 'Rerun';
      this.isProgressRunning = false;
      this.progressState = ProgressState.Aborted;

      this._stats.reachGoal('received:aborted');
    });
  }

  private getCardText(response: string): string {
    if (!response) {
      return response;
    }
    let i = 0;
    for (; i < response.length; i++) {
      if (response[i] !== ' ') {
        break;
      }
    }
    let j = response.indexOf('\0', i);
    if (j < 0) {
      j = response.length;
    }
    return response.substring(i, j);
  }

  private updateProgressState(canSuccess: boolean): void {
    if (this.cardText.includes('[Error]')) {
      this.progressState = ProgressState.Error;
    } else if (this.cardText.includes('[Warning(s)]')) {
      this.progressState = ProgressState.Warning;
    } else if (canSuccess) {
      this.progressState = ProgressState.Success;
    }
  }

  saveZip(): void {
    FileSaver.saveAs(this.zipBlob, 'res-drawable.zip');

    this._stats.reachGoal('click:save-zip', {fileCount: this.fileCount, state: ProgressState[this.progressState]});
  }
}

enum ProgressState {
  Unknown,
  Success,
  Warning,
  Error,
  Aborted
}
