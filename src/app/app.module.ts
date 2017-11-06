import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {ClarityModule} from 'clarity-angular';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';

import {AppComponent} from './app.component';
import {DropzoneComponent} from './dropzone/dropzone.component';
import {XmlViewComponent} from './xml-view/xml-view.component';
import {CodeHighlightAutoredrawDirective} from './directives/code-highlight-autoredraw.directive';
import {CardTextBeautifyPipe} from './pipes/card-text-beautify.pipe';
import {SettingsService} from './settings.service';

@NgModule({
  declarations: [
    AppComponent,
    DropzoneComponent,
    XmlViewComponent,
    CodeHighlightAutoredrawDirective,
    CardTextBeautifyPipe
  ],
  imports: [
    BrowserModule,
    ClarityModule,
    FormsModule,
    BrowserAnimationsModule
  ],
  providers: [SettingsService],
  bootstrap: [AppComponent]
})
export class AppModule {
}
