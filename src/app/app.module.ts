import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { ClarityModule } from "clarity-angular";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { HttpClientModule } from "@angular/common/http";

import "./prototypes/array-prototype";
import "./prototypes/string-prototype";

import { AppComponent } from "./app.component";
import { DropzoneComponent } from "./dropzone/dropzone.component";
import { XmlViewComponent } from "./xml-view/xml-view.component";
import { CodeHighlightAutoredrawDirective } from "./directives/code-highlight-autoredraw.directive";
import { CardTextBeautifyPipe } from "./pipes/card-text-beautify.pipe";
import { SettingsService } from "./services/settings.service";
import { MainComponent } from "./main/main.component";
import { StatsService } from "./services/stats.service";
import { ConverterService } from "./conversion/converter.service";
import { ReportIssueComponent } from "./report-issue/report-issue.component";

@NgModule({
  declarations: [
    AppComponent,
    DropzoneComponent,
    XmlViewComponent,
    CodeHighlightAutoredrawDirective,
    CardTextBeautifyPipe,
    MainComponent,
    ReportIssueComponent
  ],
  imports: [
    BrowserModule,
    ClarityModule,
    FormsModule,
    BrowserAnimationsModule,
    HttpClientModule
  ],
  providers: [
    SettingsService,
    StatsService,
    ConverterService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
