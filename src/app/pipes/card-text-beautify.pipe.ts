import {Pipe, PipeTransform, SecurityContext} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';

@Pipe({
  name: 'cardTextBeautify'
})
export class CardTextBeautifyPipe implements PipeTransform {
  constructor(private readonly _sanitizer: DomSanitizer) { }

  transform(text: string): any {
    if (!text) {
      return text;
    }
    text = this._sanitizer.sanitize(SecurityContext.NONE, text);

    text = this.recognizeFileNames(text);
    text = this.recognizeLinks(text);
    text = this.replaceAll(text, '[Warning(s)]', '<span class="label label-warning card-text-warning">Warning</span>');
    text = this.replaceAll(text, '[Error]', '<span class="label label-danger card-text-error">Error</span>');
    text = this.replaceAll(text, 'Try specifying the --fix-fill-type option.', 'Restart the conversion and try to ' +
      '<button class="btn btn-sm btn-link" onclick="parentNode.fixFillTypeClick()">Fix fill type</button>');
    text = this.replaceAll(text, 'Failure due to the --fix-fill-type option.', 'Failure due to the <strong>Fix fill type</strong> option.');

    return this._sanitizer.bypassSecurityTrustHtml(text);
  }

  private recognizeFileNames(text: string): string {
    return text.replace(/(] ?)(.+?\.svg)(:)/gi, '$1<span class="card-filename">$2</span>$3');
  }

  private recognizeLinks(text: string): string {
    const endChars = '-A-Z0-9~@#%&_+=|/';
    const middleChars = endChars + '?!,.;:';
    const regex = `\\bhttps?://[${middleChars}]*[${endChars}]`;
    return text.replace(new RegExp(regex, 'gi'), url => `<a href="${url}">this</a>`);
  }

  private replaceAll(text: string, search: string, replace: string): string {
    return text.split(search).join(replace);
  }
}
