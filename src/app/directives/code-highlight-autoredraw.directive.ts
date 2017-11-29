import {AfterViewChecked, Directive, ElementRef} from '@angular/core';
import {CodeHighlight} from 'clarity-angular';

@Directive({
  selector: '[clr-code-highlight][appCodeHighlightAutoredraw]'
})
export class CodeHighlightAutoredrawDirective implements AfterViewChecked {
  private _wasEmpty = true;

  constructor(private readonly _element: ElementRef, private readonly _codeHighlight: CodeHighlight) { }

  ngAfterViewChecked(): void {
    const isEmpty = !this._element.nativeElement.textContent;
    if (this._wasEmpty && !isEmpty) {
      this._codeHighlight.redraw();
    }
    this._wasEmpty = isEmpty;
  }
}
