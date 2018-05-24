import { Component, ElementRef, EventEmitter, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import * as Dropzone from 'dropzone';
import { StatsService } from '../services/stats.service';
import { ConverterService } from '../conversion/converter.service';
import { ConvertRequest } from '../conversion/ConvertRequest';

@Component({
  selector: 'app-dropzone',
  templateUrl: './dropzone.component.html',
  styleUrls: ['./dropzone.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class DropzoneComponent implements OnInit {
  @ViewChild('dropzone') dropzoneView: ElementRef;

  @Output() converting = new EventEmitter<ConvertRequest>();
  @Output() restart = new EventEmitter();
  @Output() complete = new EventEmitter<boolean>();
  enabled = true;
  canReset = false;

  private _dropzone;

  constructor(
    private readonly _converter: ConverterService,
    private readonly _stats: StatsService
  ) {
    Dropzone.autoDiscover = false;
  }

  ngOnInit() {
    const ne = this.dropzoneView.nativeElement;

    // Stop click propagation after resizing
    let ch;
    ne.onmousedown = () => ch = ne.clientHeight;
    ne.onclick = event => {
      if (ch !== ne.clientHeight) {
        event.stopImmediatePropagation();
      }
    };

    this._dropzone = new Dropzone(ne, {
      url: '.',
      acceptedFiles: '.svg',
      parallelUploads: 1,
      dictUploadCanceled: 'Aborted.'
    });
    this._dropzone._uploadData = this.uploadData.bind(this);
    this._dropzone.on('addedfile', this.onAddedFile.bind(this));
    this._dropzone.on('queuecomplete', this.onQueueComplete.bind(this));

    // Make the whole page to be droppable
    this._dropzone.removeEventListeners();
    for (const elementListeners of this._dropzone.listeners) {
      if ('drop' in elementListeners.events) {
        elementListeners.element = document;
      }
    }
    this._dropzone.setupEventListeners();

    document.ondragover = event => {
      if (!this.enabled) {
        event.dataTransfer.dropEffect = 'none';
      }
      return false;
    };
    document.ondrop = () => false;
  }

  private uploadData(files) {
    if (files.length !== 1) throw new Error('Application error.');
    const file = files[0];
    const request = new ConvertRequest(file);
    const xhr: any = {};
    file.xhr = xhr;
    xhr.abort = () => {
      request.abort.next();
      file.abort = true;
    };
    request.response.subscribe(
      () => {
        xhr.readyState = XMLHttpRequest.DONE;
        xhr.responseType = 'arraybuffer';
        xhr.status = 200;
        this._dropzone._finishedUploading(files, xhr);
      },
      message =>
        this._dropzone._handleUploadError(files, xhr, message)
    );
    this.converting.emit(request);
    this._converter.convert(request);
  }

  private onAddedFile() {
    if (this.enabled) {
      this.enabled = false;
      this.canReset = false;

      for (const element of this._dropzone.clickableElements) {
        element.classList.remove('dz-clickable');
      }
      this._dropzone.removeEventListeners();

      while (this._dropzone.files.length > 1) {
        this._dropzone.removeFile(this._dropzone.files[0]);
      }

      this.restart.emit();

      this._stats.event({ "dropzone.added-files": this._stats.noValue });
    }
  }

  private onQueueComplete() {
    if (!this.enabled) {
      this.enabled = true;
      this.canReset = true;

      for (const element of this._dropzone.clickableElements) {
        element.classList.add('dz-clickable');
      }
      this._dropzone.setupEventListeners();

      const abort = this._dropzone.files.some(x => x.abort);
      this.complete.emit(abort);

      this._stats.event({ "dropzone.queue-complete:files-length": this._dropzone.files.length, "dropzone.queue-complete:abort": abort });
    }
  }

  cancel(stat?: boolean) {
    for (let i = this._dropzone.files.length - 1; i >= 0; i--) {
      this._dropzone.cancelUpload(this._dropzone.files[i]);
    }

    if (stat) {
      this._stats.event({ "dropzone.cancel": this._stats.noValue });
    }
  }

  private clear() {
    this._dropzone.removeAllFiles(true);
  }

  reset() {
    this.canReset = false;
    this.clear();
    this.restart.emit();

    this._stats.event({ "dropzone.reset": this._stats.noValue });
  }

  resubmit(stat?: boolean) {
    this.cancel();
    setTimeout(() => {
      const files = this._dropzone.files;
      this.clear();
      this._dropzone.handleFiles(files.map(this.deleteAllOwnProperties));

      if (stat) {
        this._stats.event({ "dropzone.resubmit": this._stats.noValue });
      }
    });
  }

  private deleteAllOwnProperties(obj: any): any {
    for (const propertyName of Object.getOwnPropertyNames(obj)) {
      delete obj[propertyName];
    }
    return obj;
  }
}
