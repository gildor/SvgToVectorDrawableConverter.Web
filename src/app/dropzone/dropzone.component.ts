import {Component, ElementRef, EventEmitter, OnInit, Output, ViewChild, ViewEncapsulation} from '@angular/core';
import * as Dropzone from 'dropzone';
import {SendingEvent} from './SendingEvent';
import {StatsService} from '../services/stats.service';
import {SettingsService} from '../services/settings.service';

@Component({
  selector: 'app-dropzone',
  templateUrl: './dropzone.component.html',
  styleUrls: ['./dropzone.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class DropzoneComponent implements OnInit {
  @ViewChild('dropzone') dropzoneView: ElementRef;

  @Output() sending = new EventEmitter<SendingEvent>();
  @Output() restart = new EventEmitter();
  enabled = true;
  canReset = false;

  private _dropzone;

  constructor(private readonly _settings: SettingsService, private readonly _stats: StatsService) {
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
      url: this._settings.backendUrl,
      acceptedFiles: '.svg',
      uploadMultiple: true,
      maxFiles: 100,
      maxFilesize: 9,
      parallelUploads: Number.POSITIVE_INFINITY,
      timeout: 0
    });
    this._dropzone.on('addedfile', this.onAddedFile.bind(this));
    this._dropzone.on('queuecomplete', this.onQueueComplete.bind(this));
    this._dropzone.on('sendingmultiple', this.onSendingMultiple.bind(this));

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
    }
  }

  private onSendingMultiple(files, xhr, formData) {
    this.sending.emit(new SendingEvent(xhr, formData));
  }

  cancel(stat?: boolean) {
    for (const file of this._dropzone.files) {
      this._dropzone.cancelUpload(file);
    }

    if (stat) {
      this._stats.reachGoal('click:cancel');
    }
  }

  private clear() {
    this._dropzone.removeAllFiles(true);
  }

  reset(stat?: boolean) {
    this.canReset = false;
    this.clear();
    this.restart.emit();

    if (stat) {
      this._stats.reachGoal('click:reset');
    }
  }

  resubmit(stat?: boolean) {
    this.cancel();
    setTimeout(() => {
      const files = this._dropzone.files;
      this.clear();
      this._dropzone.handleFiles(files.map(this.deleteAllOwnProperties));

      if (stat) {
        this._stats.reachGoal('click:resubmit');
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
