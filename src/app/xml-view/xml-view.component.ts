import {Component, Input} from '@angular/core';
import {trigger, state, style, transition, animate} from '@angular/animations';
import * as FileSaver from 'file-saver';

@Component({
  selector: 'app-xml-view',
  templateUrl: './xml-view.component.html',
  styleUrls: ['./xml-view.component.css'],
  animations: [
    trigger('alertState', [
      state('*, hidden', style({opacity: 0})),
      state('visible', style({opacity: 1})),
      transition('* => *', animate(200))
    ])
  ]
})
export class XmlViewComponent {
  @Input() title: string;
  hidePreview: boolean;
  copyCodeAlertState = '';

  private _xml: string;

  get xml(): string {
    return this.hidePreview ? null : this._xml;
  }

  @Input()
  set xml(value: string) {
    this.hidePreview = value && value.length > 500000;
    this._xml = value;
  }

  private _timeoutId;

  constructor() { }

  saveToFile() {
    FileSaver.saveAs(new Blob([this._xml], {type: 'text/xml;charset=utf-8'}), this.title, true);
  }

  copyCode() {
    const ta = document.createElement('textarea');
    ta.style.position = 'fixed';
    ta.style.left = '0';
    ta.style.top = '0';
    ta.style.opacity = '0';
    ta.value = this._xml;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);

    clearTimeout(this._timeoutId);
    this.copyCodeAlertState = 'visible';
    this._timeoutId = setTimeout(() => {
      this.copyCodeAlertState = 'hidden';
    }, 2000);
  }
}
