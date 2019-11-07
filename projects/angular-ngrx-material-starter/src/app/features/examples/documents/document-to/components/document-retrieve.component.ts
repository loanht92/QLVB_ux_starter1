import { Component, OnInit, ChangeDetectionStrategy, ViewChild, ChangeDetectorRef, ViewContainerRef, ViewRef } from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatTableDataSource} from '@angular/material';
import {FormControl, FormBuilder} from '@angular/forms';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import * as moment from 'moment';
import {PlatformLocation} from '@angular/common';
import { filter, pairwise } from 'rxjs/operators';
import { ActivatedRoute, Router, RoutesRecognized } from '@angular/router';
import {IncomingDocService, IncomingTicket} from '../incoming-doc.service';
import {RotiniPanel} from './document-add.component';
import {ResApiService} from '../../../services/res-api.service';
import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
  ROUTE_ANIMATIONS_ELEMENTS,
  NotificationService
} from '../../../../../core/core.module';

export class ItemRetrieve {
  Department: string;
  UserName: string;
  TimeRetrieve: string;
  Reason: string;
}

@Component({
  selector: 'anms-document-retrieve',
  templateUrl: './document-retrieve.component.html',
  styleUrls: ['./document-retrieve.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentRetrieveComponent implements OnInit {
  listTitle = "ListProcessRequestTo";
  inDocs$: IncomingTicket[]= [];
  displayedColumns: string[] = ['numberTo', 'created', 'userRequest', 'userApprover', 'deadline','compendium']; //'select', 'userApprover'
  dataSource = new MatTableDataSource<IncomingTicket>();
  displayedColumns2: string[] = ['department', 'userName', 'time', 'reason'];
  dataSource2 = new MatTableDataSource<ItemRetrieve>();
  ListItem: ItemRetrieve[] = [];
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  searchText = '';
  date = new FormControl(new Date());
  DocumentID = 0;
  currentUserId;
  currentUserName;
  strFilter = '';
  overlayRef;
  bsModalRef;

   constructor(private fb: FormBuilder, private docTo: IncomingDocService, 
              private services: ResApiService, private ref: ChangeDetectorRef,
              private readonly notificationService: NotificationService,
              public overlay: Overlay, public viewContainerRef: ViewContainerRef,
              private route: ActivatedRoute, private modalService: BsModalService,
              private location: PlatformLocation, private routes: Router
    ) {
      location.onPopState(() => {
        //alert(window.location);
        //window.location.reload();
        this.routes.events
      .pipe(filter((e: any) => e instanceof RoutesRecognized),
          pairwise()
      ).subscribe((e: any) => {
          let url = e[0].urlAfterRedirects;
          console.log(url);
          this.ngOnInit();
      });
    });
    }

  ngOnInit() {
    this.getCurrentUser();
  }
  
  ClickItem(template, row) {
    let docId = row.documentID;
    this.OpenRotiniPanel();
    let strSelect = '';
    strSelect = ` and (TypeCode eq 'CXL' or TypeCode eq 'TL') and StatusID eq '-1'`;  
    this.strFilter = `&$filter=NoteBookID eq ` + docId + strSelect;
    this.docTo.getListRequestTo(this.strFilter).subscribe((itemValue: any[]) => {
      let item = itemValue["value"] as Array<any>; 
      this.ListItem = [];
      item.forEach(element => {
        this.ListItem.push({
          Department: element.Source,
          UserName: element.UserRetrieve !== undefined ? element.UserRetrieve.Title : '',
          TimeRetrieve: moment(element.DateRetrieve).format('DD/MM/YYYY'),
          Reason: element.Content
        })
      })
    },
    error => { 
      console.log("error: " + error);
      this.CloseRotiniPanel();
    },
    () => {
      this.dataSource2 = new MatTableDataSource<ItemRetrieve>(this.ListItem);
      if (!(this.ref as ViewRef).destroyed) {
        this.ref.detectChanges();  
      } 
      this.dataSource2.paginator = this.paginator;
      this.bsModalRef = this.modalService.show(template, {class: 'modal-lg'});
      this.CloseRotiniPanel();
    })
  }
  
  getAllListRequest() {
    let strSelect = '';
    strSelect = ` and (TypeCode eq 'CXL' or TypeCode eq 'TL') and StatusID eq '-1'`;  
    this.strFilter = `&$filter=UserApprover/Id eq ` + this.currentUserId + strSelect;
    this.docTo.getListRequestTo(this.strFilter).subscribe((itemValue: any[]) => {
      let item = itemValue["value"] as Array<any>;     
      this.inDocs$ = []; 
      item.forEach(element => {
        if(this.inDocs$.findIndex(e => e.documentID === element.NoteBookID) < 0) {
          this.inDocs$.push({
            STT: this.inDocs$.length + 1,
            ID: element.ID,
            documentID: element.NoteBookID, 
            compendium: element.Compendium, 
            userRequest: element.UserRequest !== undefined ? element.UserRequest.Title : '',
            userRequestId: element.UserRequest !== undefined ? element.UserRequest.Id : '',
            userApprover: element.UserApprover !== undefined ? element.UserApprover.Title : '',
            deadline: this.docTo.CheckNull(element.Deadline) === '' ? '' : moment(element.Deadline).format('DD/MM/YYYY'),
            status: 'Chờ xử lý',
            statusID: element.StatusID,
            source: '',
            destination: '',
            taskType: '',
            typeCode: '',
            content: this.docTo.CheckNull(element.Content),
            indexStep: element.IndexStep,
            created: this.docTo.CheckNull(element.DateCreated) === '' ? '' : moment(element.DateCreated).format('DD/MM/YYYY'),
            numberTo: element.Title,
            link: '',
            stsClass: ''
          })
        } 
        else if(element.IsFinished === 1) {
          let index = this.inDocs$.findIndex(e => e.documentID === element.NoteBookID);
          if(index >= 0) {
            this.inDocs$.splice(index, 1);
          }
        }
      })
      this.dataSource = new MatTableDataSource<IncomingTicket>(this.inDocs$);
      if (!(this.ref as ViewRef).destroyed) {
        this.ref.detectChanges();  
      } 
      this.dataSource.paginator = this.paginator;
      this.CloseRotiniPanel();
    },
    error => { 
      console.log("error: " + error);
      this.CloseRotiniPanel();
    },
    () => {
      this.CloseRotiniPanel();
    }
    );   
  }

  getCurrentUser(){
    this.OpenRotiniPanel();
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
        this.getAllListRequest();
      }
      );
  }

  getInforRetrieve(template, docId) {
    this.OpenRotiniPanel();
    let strSelect = '';
    strSelect = ` and (TypeCode eq 'CXL' or TypeCode eq 'TL') and StatusID eq '-1'`;  
    this.strFilter = `&$filter=NoteBookID eq ` + docId + strSelect;
    this.docTo.getListRequestTo(this.strFilter).subscribe((itemValue: any[]) => {
      let item = itemValue["value"] as Array<any>; 
      this.ListItem = [];
      item.forEach(element => {
        this.ListItem.push({
          Department: element.Source,
          UserName: element.UserRetrieve !== undefined ? element.UserRetrieve.Title : '',
          TimeRetrieve: moment(element.DateRetrieve).format('DD/MM/YYYY'),
          Reason: element.Content
        })
      })
    },
    error => { 
      console.log("error: " + error);
      this.CloseRotiniPanel();
    },
    () => {
      this.dataSource2 = new MatTableDataSource<ItemRetrieve>(this.ListItem);
      if (!(this.ref as ViewRef).destroyed) {
        this.ref.detectChanges();  
      } 
      this.dataSource2.paginator = this.paginator;
      this.bsModalRef = this.modalService.show(template, {class: 'modal-lg'});
      this.CloseRotiniPanel();
    })
  }
  
  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  OpenRotiniPanel() {
    let config = new OverlayConfig();
    config.positionStrategy = this.overlay.position()
      .global().centerVertically().centerHorizontally();
    config.hasBackdrop = true;
    this.overlayRef = this.overlay.create(config);
    this.overlayRef.attach(new ComponentPortal(RotiniPanel, this.viewContainerRef));
  }

  CloseRotiniPanel() {
    if(this.overlayRef !== undefined) {
      this.overlayRef.dispose();
    }
  }

}
