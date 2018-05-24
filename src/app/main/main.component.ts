import { Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import * as JSZip from 'jszip';
import * as FileSaver from 'file-saver';
import { SettingsService } from '../services/settings.service';
import { StatsService } from '../services/stats.service';
import { ConvertRequest } from '../conversion/ConvertRequest';
import { ReportIssueService } from '../report-issue/report-issue.service';
import { DropzoneComponent } from '../dropzone/dropzone.component';

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
  @ViewChild('dropzone') dropzone: DropzoneComponent;

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

  private readonly _nativeEventsHandler: NativeEventsHandler;

  constructor(
    readonly settings: SettingsService,
    private readonly _stats: StatsService,
    element: ElementRef,
    zone: NgZone,
    reportIssueService: ReportIssueService
  ) {
    this.restart();
    this._nativeEventsHandler = new NativeEventsHandler(settings, _stats, element, zone, reportIssueService);
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
    this._nativeEventsHandler.init(this.dropzone);
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
      this._stats.event({ "main.converting:lib": this.settings.libId, "main.converting:fix-fill-type": this.settings.fixFillType });
    }

    request.lib = this.settings.libId;
    request.fixFillType = this.settings.fixFillType;

    this.cardState = 'visible';
    this.cardTitle = `Converting <span class="card-filename">${request.svgName()}</span>…`;
    this.cardText += '.';
    this.isProgressRunning = true;

    request.response.subscribe(
      x => {
        this.zip.file(request.xmlName(), x.output);
        this.fileCount++;
        if (x.warnings.length > 0) {
          this.cardText += `\n[Warning(s)] ${request.svgName()}: ${x.warnings.join('\n')}\n`;
          this.setProgressState(ProgressState.Warning);
        }
      },
      x => {
        this.cardText += `\n[Error] ${request.svgName()}: ${x}\n`;
        this.setProgressState(ProgressState.Error);
      }
    );
  }

  async complete(abort: boolean) {
    this.abortConversionModalOpen = false;
    this.isProgressRunning = false;

    if (abort) {
      this.cardTitle = 'Aborted';
      this.setProgressState(ProgressState.Aborted);
    } else {
      this.cardTitle = this.fileCount ? 'Done' : 'Error';
      this.setProgressState(ProgressState.Success);

      if (this.fileCount === 1) {
        this.singleFileTitle = Object.keys(this.zip.files)[0];
        this.singleFileXml = await this.zip.files[this.singleFileTitle].async('text');
        this.xmlViewState = 'visible';
      }

      this._stats.event({ "main.complete.success:file-count": this.fileCount });
    }

    this._stats.event({ "main.complete:abort": abort, "main.complete:state": ProgressState[this.progressState] });
  }

  async saveZip() {
    const content = await this.zip.generateAsync({ type: 'blob' });
    FileSaver.saveAs(content, 'res-drawable.zip');

    this._stats.event({ "main.save-zip:file-count": this.fileCount });
  }
}

enum ProgressState {
  Unknown,
  Success,
  Warning,
  Error,
  Aborted
}

class NativeEventsHandler {
  constructor(
    private readonly _settings: SettingsService,
    private readonly _stats: StatsService,
    element: ElementRef,
    private readonly _zone: NgZone,
    private readonly _reportIssueService: ReportIssueService
  ) {
    // ReSharper disable Html.EventNotResolved
    element.nativeElement.addEventListener('fixFillTypeClick', this.fixFillTypeClick.bind(this));
    element.nativeElement.addEventListener('openIssueClick', e => this.openIssueClick(e.detail));
    // ReSharper restore Html.EventNotResolved
  }

  private fixFillTypeClick() {
    this._zone.run(() => this._settings.fixFillType = true);

    this._stats.event({ "main.fix-fill-type-click": this._stats.noValue });
  }

  private openIssueClick(svgName?: string) {
    this._stats.event({ "main.open-issue-click:svg-name": svgName ? true : false });

    this._zone.run(() => {
      if (!svgName) {
        svgName = this._lastSuccessSvgName;
      }
      const file = this._svgNameToFileMap.get(svgName);
      if (file) {
        const reader = new FileReader();
        reader.onload = () => this._reportIssueService.openIssue(svgName, reader.result);
        reader.readAsText(file);
      }
    });
  }

  private readonly _svgNameToFileMap = new Map<string, File>();
  private _lastSuccessSvgName: string;

  init(dropzone: DropzoneComponent) {
    dropzone.restart.subscribe(() => {
      this._svgNameToFileMap.clear();
      this._lastSuccessSvgName = null;
    });
    dropzone.converting.subscribe(x => {
      this._svgNameToFileMap.set(x.svgName(), x.inputFile);
      x.response.subscribe(() => this._lastSuccessSvgName = x.svgName());
    });
  }
}
