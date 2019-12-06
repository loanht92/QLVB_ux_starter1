import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';

import { SharedModule } from './shared/shared.module';
import { CoreModule } from './core/core.module';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app/app.component';
import {DocumentsModule } from './features/examples/documents/documents.module';
import { from } from 'rxjs';
import { ModalModule } from 'ngx-bootstrap/modal';
import {ShareFunction} from './shared/shared-service/shared-functions';



@NgModule({
  imports: [
    // angular
    BrowserAnimationsModule,
    BrowserModule,

    // core & shared
    CoreModule,
    SharedModule,

    // app
    AppRoutingModule,
    //
    DocumentsModule,
    ModalModule.forRoot()
  ],
  declarations: [AppComponent],
  bootstrap: [AppComponent],
  providers: [ShareFunction],
})
export class AppModule {}
