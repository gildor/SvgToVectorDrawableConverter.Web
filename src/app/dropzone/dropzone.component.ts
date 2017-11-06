import {Component, ElementRef, EventEmitter, OnInit, Output, ViewChild, ViewEncapsulation} from '@angular/core';
import * as Dropzone from 'dropzone';
import {SendingEvent} from './SendingEvent';

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

  private _dropzone;

  constructor() {
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
      url: 'http://localhost:52455/api/svg2vd/v2',
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

      for (const element of this._dropzone.clickableElements) {
        element.classList.add('dz-clickable');
      }
      this._dropzone.setupEventListeners();
    }
  }

  private onSendingMultiple(files, xhr, formData) {
    this.sending.emit(new SendingEvent(xhr, formData));
  }

  cancel() {
    for (const file of this._dropzone.files) {
      this._dropzone.cancelUpload(file);
    }
  }

  private clear() {
    this._dropzone.removeAllFiles(true);
  }

  reset() {
    this.clear();
    this.restart.emit();
  }

  resubmit() {
    this.cancel();
    setTimeout(() => {
      const files = this._dropzone.files;
      this.clear();
      this._dropzone.handleFiles(files);
    });
  }
}
