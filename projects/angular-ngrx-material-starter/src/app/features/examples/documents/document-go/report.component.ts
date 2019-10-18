import { Component, OnInit, ChangeDetectionStrategy, ViewChild, ChangeDetectorRef, ViewContainerRef, Injectable } from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatTableDataSource} from '@angular/material';
import {FormControl, FormBuilder} from '@angular/forms';
import {SelectionModel} from '@angular/cdk/collections';
import {FlatTreeControl} from '@angular/cdk/tree';
import {MatTreeFlatDataSource, MatTreeFlattener} from '@angular/material/tree';
import {BehaviorSubject} from 'rxjs';
import * as moment from 'moment';
import { ItemDocumentGo, ListDocType, ItemSeleted, ItemSeletedCode, ItemUser, DocumentGoTicket, AttachmentsObject, UserProfilePropertiesObject } from './../models/document-go';
import {DocumentGoPanel} from './document-go.component';
import { DocumentGoService } from './document-go.service';
import {ResApiService} from '../../services/res-api.service';
import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
  ROUTE_ANIMATIONS_ELEMENTS,
  NotificationService
} from '../../../../core/core.module';

@Component({
  selector: 'anms-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportDGComponent implements OnInit {
  listTitle = "ListProcessRequestTo";
  inDocs$ = [];
  displayedColumns: string[] = ['numberGo', 'numberSymbol' ,'created', 'userRequest', 'deadline','compendium', 'content', 'sts']; //'select', 'userApprover'
  dataSource = new MatTableDataSource<DocumentGoTicket>();
  selection = new SelectionModel<DocumentGoTicket>(true, []);
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  searchText = '';
  date = new FormControl(new Date());
  DocumentID = 0;
  currentUserId;
  currentUserName;
  strFilter = '';
  overlayRef;
  dateIssuedFrom = moment().subtract(30,'day').toDate();
  dateIssuedTo = new Date();
  ListDocType: ItemSeleted[] = [];
  docType;

  constructor(private fb: FormBuilder, private docTo: DocumentGoService, 
              private services: ResApiService, private ref: ChangeDetectorRef,
              private readonly notificationService: NotificationService,
              public overlay: Overlay, public viewContainerRef: ViewContainerRef) { }

  ngOnInit() {
    this.getDocType();
    this.getAllListRequest();
    this.getCurrentUser();
  }
  
  getAllListRequest() {
    try{
      this.OpenRotiniPanel();
      this.strFilter = `&$filter=StatusID ne '-1'`;
     
      if(this.docTo.CheckNullSetZero(this.docType) > 0) {
        this.strFilter += ` and DocTypeID eq '` + this.docType +`'`;
      }

      if(this.docTo.checkNull(this.dateIssuedFrom) !== '') {
        this.dateIssuedFrom = moment(this.dateIssuedFrom).hours(0).minutes(0).seconds(0).toDate();
        this.strFilter += ` and (DateIssued ge '` + this.ISODateStringUTC(this.dateIssuedFrom) + `' or DateIssued eq null)`;
      }

      if(this.docTo.checkNull(this.dateIssuedTo) !== '') {
        this.dateIssuedTo = moment(this.dateIssuedTo).hours(23).minutes(59).seconds(59).toDate();
        this.strFilter += ` and (DateIssued le '` + this.ISODateStringUTC(this.dateIssuedTo) + `' or DateIssued eq null)`
      }

      this.docTo.getAllDocumentTo(this.strFilter).subscribe((itemValue: any[]) => {
        let item = itemValue["value"] as Array<any>;     
        this.inDocs$ = []; 
        item.forEach(element => {
          this.inDocs$.push({
            STT: this.inDocs$.length + 1,
            ID: element.ID,
            numberGo: this.docTo.checkNull(element.NumberGo) !== '' ? this.docTo.formatNumberGo(element.NumberGo) : '',
            numberSymbol: this.docTo.checkNull(element.NumberSymbol) !== '' ? element.NumberSymbol : '', 
            userRequest: element.Author.Title,
            userRequestId: element.Author.Id,
            userApprover: element.UserOfHandle !== undefined ? element.UserOfHandle.Title : '',
            deadline: this.docTo.checkNull(element.Deadline) === '' ? '' : moment(element.Deadline).format('DD/MM/YYYY'),
            status: this.docTo.CheckNullSetZero(element.StatusID) === 0 ? 'Đang xử lý' : 'Đã xử lý',
            compendium: this.docTo.checkNull(element.Compendium),
            note: this.docTo.checkNull(element.Note),
            created: this.docTo.checkNull(element.DateCreated) === '' ? '' : moment(element.DateCreated).format('DD/MM/YYYY'),
            sts: this.docTo.CheckNullSetZero(element.StatusID) === 0 ? 'Ongoing' : 'Approved',
            link: '/Documnets/documentgo-detail/' + element.ID
          })
        })   
        
        this.dataSource = new MatTableDataSource<DocumentGoTicket>(this.inDocs$);
        this.ref.detectChanges();
        this.CloseRotiniPanel();     
      },
      error => { 
        console.log("error: " + error);
        this.CloseRotiniPanel();
      },
      () => {}
      );   
    } catch(err) {
      console.log("Load all document to error:" + err.message);
      this.CloseRotiniPanel();
    }
  }

  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  resetForm() {
    this.docType = null;
    this.dateIssuedFrom = moment().subtract(30,'day').toDate();
    this.dateIssuedTo = new Date();
  }

  getCurrentUser(){
    this.services.getCurrentUser().subscribe(
      itemValue => {
          this.currentUserId = itemValue["Id"];
          this.currentUserName = itemValue["Title"];
        },
      error => { 
        console.log("error: " + error);
        this.CloseRotiniPanel();
      },
      () => {
        console.log("Current user email is: \n" + "Current user Id is: " + this.currentUserId + "\n" + "Current user name is: " + this.currentUserName );
      }
      );
  }

  getDocType() {
    this.services.getListDocType().subscribe((itemValue: any[]) => {
      let item = itemValue['value'] as Array<any>;
      item.forEach(element => {
        this.ListDocType.push({
          ID: element.ID,
          Title: element.Title,
        });
      });
    });
  }

  OpenRotiniPanel() {
    let config = new OverlayConfig();
    config.positionStrategy = this.overlay.position()
      .global().centerVertically().centerHorizontally();
    config.hasBackdrop = true;
    this.overlayRef = this.overlay.create(config);
    this.overlayRef.attach(new ComponentPortal(DocumentGoPanel, this.viewContainerRef));
  }

  CloseRotiniPanel() {
    this.overlayRef.dispose();
  }

  ISODateStringUTC(d) {
    function pad(n) { return n < 10 ? '0' + n : n }
    return d.getUTCFullYear() + '-'
      + pad(d.getUTCMonth() + 1) + '-'
      + pad(d.getUTCDate()) + 'T'
      + pad(d.getUTCHours()) + ':'
      + pad(d.getUTCMinutes()) + ':'
      + pad(d.getUTCSeconds()) + 'Z'
  }
}
