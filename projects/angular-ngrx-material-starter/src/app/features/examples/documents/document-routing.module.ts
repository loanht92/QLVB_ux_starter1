import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AuthGuardService } from '../../../core/core.module';

import { ExamplesComponent } from './../examples/examples.component';
import { NotificationsComponent } from './../notifications/components/notifications.component';
import { ElementsComponent } from './../elements/elements.component';
import { DocumentComponent } from '../../../features/examples/documents/document-go/document.component';
import { IncomingDocumentComponent } from '../../../features/examples/documents/document-to/components/incoming-document.component';
import { DocumentGoComponent } from './document-go/document-go.component';
import { DocumentGoDetailComponent } from './document-go/document-go-detail.component';
import { DocumentGoWaitingComponent } from './document-go/document-go-waiting.component';
import {ReportDGComponent} from '../documents/document-go/report.component';
import {ReportAdvanceDGComponent} from '../documents/document-go/report-advance.component';
import {DocumentGoRetrieveComponent} from './document-go/document-retrieve.component';
import { CommentComponent }from './document-go/comment.component';

import {DocumentAddComponent} from './document-to/components/document-add.component';
import {DocumentDetailComponent} from './document-to/components/document-detail.component';
import { DocumentWaitingComponent } from './document-to/components/document-waiting.component';
import {DocumentGoProcessedComponent } from './document-go/document-go-processed.component'
import {ReportComponent} from './document-to/components/report.component';
import {ReportAdvanceComponent} from './document-to/components/report-advance.component';
import {DocumentRetrieveComponent} from './document-to/components/document-retrieve.component';
import {DataListComponent} from './data-list/data-list.component'
import { from } from 'rxjs';

const routes: Routes = [
  {
    path: '',
    component: DocumentComponent,
    children: [
      {
        path: '',
        redirectTo: '',
        pathMatch: 'full'
      },
      {
        path: 'documentgo/:value',
        component: DocumentGoComponent,
        data: { title: 'Văn bản trình ký' }
      },
      {
        path: 'docGo-retrieve',
        component: DocumentGoRetrieveComponent,
        data: { title: 'Thu hồi' }
      },
      {
        path: 'documentgo-waiting-process/:id',
        component: DocumentGoWaitingComponent,
        data: { title: 'Chờ xử lý' }
      },
      {
        path: 'documentgo-processing/:id',
        component: DocumentGoProcessedComponent,
        data: { title: 'Đang xử lý' }
      },
      {
        path: 'documentgo-processed/:id',
        component: DocumentGoProcessedComponent,
        data: { title: 'Đã xử lý' }
      },
      {
        path: 'documentgo-waiting-comment/:id',
        component: DocumentGoWaitingComponent,
        data: { title: 'Chờ xin ý kiến' }
      },
      {
        path: 'documentgo-comment/:id',
        component: DocumentGoWaitingComponent,
        data: { title: 'Đã cho ý kiến' }
      },
      {
        path: 'documentgo-detail/:id',
        component: DocumentGoDetailComponent,
        data: { title: 'Xem chi tiết' }
      },
      {
        path: 'documentgo-detail/:id/:step',
        component: DocumentGoDetailComponent,
        data: { title: 'Xử lý' }
      },
      {
        path: 'reportDocGo',
        component: ReportDGComponent,
        data: { title: 'Báo cáo, thống kê' }
      },
      {
        path: 'reportAdvanceDocGo',
        component: ReportAdvanceDGComponent,
        data: { title: 'Tra cứu văn bản' }
      },
    ]
  },
  {
    path: 'IncomingDoc',
    component: IncomingDocumentComponent,
    children: [
      {
        path: '',
        redirectTo: '',
        pathMatch: 'full'
      },
      {
        path: 'documentto',
        component: DocumentAddComponent,
        data: { title: 'Tiếp nhận văn bản' }
      },
      {
        path: 'docTo-retrieve',
        component: DocumentRetrieveComponent,
        data: { title: 'Thu hồi' }
      },
      {
        path: 'docTo-list/:id',
        component: DocumentWaitingComponent,
        data: { title: 'Chờ xử lý' }
      },
      {
        path: 'docTo-list-approving/:id',
        component: DocumentWaitingComponent,
        data: { title: 'Đang xử lý' }
      },      
      {
        path: 'docTo-list-approved/:id',
        component: DocumentWaitingComponent,
        data: { title: 'Đã xử lý' }
      },
      {
        path: 'docTo-list-waiting-comment/:id',
        component: DocumentWaitingComponent,
        data: { title: 'Chờ xin ý kiến' }
      },
      {
        path: 'docTo-list-response-comment/:id',
        component: DocumentWaitingComponent,
        data: { title: 'Đã cho ý kiến' }
      },
      {
        path: 'reportDocTo',
        component: ReportComponent,
        data: { title: 'Báo cáo, thống kê' }
      },
      {
        path: 'reportAdvanceDocTo',
        component: ReportAdvanceComponent,
        data: { title: 'Tra cứu văn bản' }
      },
      {
        path: 'docTo-detail/:id',
        component: DocumentDetailComponent,
        data: { title: 'Xem chi tiết' }
      },
      {
        path: 'docTo-detail/:id/:step',
        component: DocumentDetailComponent,
        data: { title: 'Xử lý' }
      },
    ]
  },
  {
    path: 'data-list',
    component: DataListComponent,
    data: { title: 'Danh mục' }
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DocumentRoutingModule { }
