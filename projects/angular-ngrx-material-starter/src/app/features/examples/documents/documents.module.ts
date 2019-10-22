import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LazyElementsModule } from '@angular-extensions/elements';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { FEATURE_NAME, reducers } from '.././../examples/examples.state';
import {FlexLayoutModule} from '@angular/flex-layout'
import { SharedModule } from '../../../shared/shared.module';
import { environment } from '../../../../environments/environment';
import {MatTableModule} from '@angular/material/table';
import {MatTreeModule} from '@angular/material/tree'
import {MatAutocompleteModule} from '@angular/material';
import { ModalModule } from 'ngx-bootstrap/modal';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'; 
import { BrowserModule } from '@angular/platform-browser';
import {DocumentRoutingModule} from './document-routing.module';
import { DocumentGoComponent,DocumentGoPanel }from './document-go/document-go.component';
import { DocumentComponent } from './document-go/document.component';
import { IncomingDocumentComponent } from '../../../features/examples/documents/document-to/components/incoming-document.component';
import { DocumentGoDetailComponent } from './document-go/document-go-detail.component';
import { DocumentGoWaitingComponent } from './document-go/document-go-waiting.component';
import {ReportDGComponent} from '../documents/document-go/report.component';
import {ReportAdvanceDGComponent} from '../documents/document-go/report-advance.component';
import { CommentComponent } from './document-go/comment.component';
//Loan
import {DocumentAddComponent, RotiniPanel} from './document-to/components/document-add.component';
import {DocumentDetailComponent} from './document-to/components/document-detail.component';
import { DocumentWaitingComponent, ChecklistDatabase} from './document-to/components/document-waiting.component';
import { ReportComponent} from './document-to/components/report.component';
import { ReportAdvanceComponent} from './document-to/components/report-advance.component';
import { DataListComponent } from './data-list/data-list.component';
import { NumberDirective, FormatMoneyDirective } from './number-directive';

export function HttpLoaderFactory(http: HttpClient) {
    return new TranslateHttpLoader(
      http,
      `${environment.i18nPrefix}/assets/i18n/examples/`,
      '.lang'
    );
  }
@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    LazyElementsModule,
    MatTableModule,
    SharedModule,
    DocumentRoutingModule,
    ModalModule,
    StoreModule.forFeature(FEATURE_NAME, reducers),
      TranslateModule.forChild({
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
        },
        isolate: true
      }),
  MatTableModule,
  FlexLayoutModule,
  MatTreeModule,
  MatAutocompleteModule,
  // ModalModule.forRoot(),
],
  declarations: [
    DocumentComponent,
    DocumentGoComponent,
    DocumentGoPanel,
    DocumentGoDetailComponent,
    DocumentGoWaitingComponent,
    ReportDGComponent,
    ReportAdvanceDGComponent,
    CommentComponent,
    IncomingDocumentComponent,
    DocumentAddComponent,
    DocumentDetailComponent,
    DocumentWaitingComponent,
    // ChecklistDatabase,
    RotiniPanel,
    ReportComponent,
    ReportAdvanceComponent,
    DataListComponent,
    NumberDirective, 
    FormatMoneyDirective
  ],
  entryComponents: [
    DocumentGoPanel,
    CommentComponent,
    RotiniPanel
    ],
  providers: [CommentComponent]
})
export class DocumentsModule {
  constructor() {}
}
