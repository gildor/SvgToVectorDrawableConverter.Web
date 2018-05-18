import { Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import * as JSZip from 'jszip';
import * as FileSaver from 'file-saver';
import { SettingsService } from '../services/settings.service';
import { StatsService } from '../services/stats.service';
import { ConvertRequest } from '../conversion/ConvertRequest';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css'],
  animations: [
    trigger('slideTop', [
      state('*', style({ opacity: 0, transform: 'translateY(100%)', display: 'none' })),
      state('visible', style({ opacity: 1, transform: 'translateY(0)' })),
      transition('* => visible', animate(300))
    ])
  ]
})
export class MainComponent implements OnInit {
  @ViewChild('cardTextContainer') cardTextContainer: ElementRef;

  readonly libs = [
    { id: '', text: 'Android 5.0+' },
    { id: 'ApiLevel24', text: 'Android 7.0+' },
    { id: 'BetterVectorDrawable', text: 'BetterVectorDrawable' },
    { id: 'res-auto', text: 'res-auto' }
  ];

  cardState: string;
  cardTitle: string;
  cardText: string;
  zip: JSZip;
  fileCount: number;
  singleFileTitle: string;
  singleFileXml: string;
  xmlViewState: string;
  abortConversionModalOpen: boolean;
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

  ngOnInit() {
    this.cardTextContainer.nativeElement.fixFillTypeClick = this.fixFillTypeClick.bind(this);
  }

  private fixFillTypeClick() {
    this._zone.run(() => this.settings.fixFillType = true);

    this._stats.reachGoal('click:fix-fill-type');
  }

  private setProgressState(value: ProgressState) {
    if (value > this.progressState) {
      this.progressState = value;
    }
  }

  restart() {
    this.cardState = null;
    this.cardTitle = null;
    this.cardText = '';
    this.zip = new JSZip();
    this.fileCount = 0;
    this.singleFileTitle = null;
    this.singleFileXml = null;
    this.xmlViewState = null;
    this.abortConversionModalOpen = false;
    this.isProgressRunning = false;
    this.progressState = ProgressState.Unknown;
  }

  converting(request: ConvertRequest) {
    if (!this.cardState) {
      this._stats.reachGoal('sending', { lib: this.settings.libId, fixFillType: this.settings.fixFillType });
    }

    request.lib = this.settings.libId;
    request.fixFillType = this.settings.fixFillType;

    this.cardState = 'visible';
    this.cardTitle = `Converting <span class="card-filename">${request.svgName()}</span>…`;
    this.cardText += '.';
    this.isProgressRunning = true;

    request.response.subscribe(x => {
      this.zip.file(request.xmlName(), x.output);
      this.fileCount++;
      if (x.warnings.length > 0) {
        this.cardText += `\n[Warning(s)] ${request.svgName()}: ${x.warnings.join('\n')}\n`;
        this.setProgressState(ProgressState.Warning);
      }
    });

    request.error.subscribe(x => {
      this.cardText += `\n[Error] ${request.svgName()}: ${x}\n`;
      this.setProgressState(ProgressState.Error);
    });
  }

  async complete(abort: boolean) {
    this.abortConversionModalOpen = false;
    this.isProgressRunning = false;

    if (abort) {
      this.cardTitle = 'Aborted';
      this.setProgressState(ProgressState.Aborted);

      this._stats.reachGoal('received:aborted');
    } else {
      this.cardTitle = this.fileCount > 0 ? 'Done' : 'Error';
      this.setProgressState(ProgressState.Success);

      if (this.fileCount === 1) {
        this.singleFileTitle = Object.keys(this.zip.files)[0];
        this.singleFileXml = await this.zip.files[this.singleFileTitle].async('text');
        this.xmlViewState = 'visible';
      }

      this._stats.reachGoal('received:good-zip', { fileCount: this.fileCount, state: ProgressState[this.progressState] });
    }
  }

  async saveZip() {
    const content = await this.zip.generateAsync({ type: 'blob' })
    FileSaver.saveAs(content, 'res-drawable.zip');

    this._stats.reachGoal('click:save-zip', { fileCount: this.fileCount, state: ProgressState[this.progressState] });
  }
}

enum ProgressState {
  Unknown,
  Success,
  Warning,
  Error,
  Aborted
}
