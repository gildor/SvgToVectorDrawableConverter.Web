import {AfterViewChecked, Directive} from '@angular/core';
import {CodeHighlight} from 'clarity-angular';

@Directive({
  selector: '[clr-code-highlight][appCodeHighlightAutoredraw]'
})
export class CodeHighlightAutoredrawDirective implements AfterViewChecked {
  constructor(private readonly _codeHighlight: CodeHighlight) { }

  ngAfterViewChecked(): void {
    this._codeHighlight.redraw();
  }
}
