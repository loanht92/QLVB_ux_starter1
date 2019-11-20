import { Component, OnInit, ChangeDetectionStrategy, ViewChild, ChangeDetectorRef, ViewContainerRef, ViewRef } from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatTableDataSource} from '@angular/material';
import {FormControl, FormBuilder} from '@angular/forms';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import * as moment from 'moment';
import {PlatformLocation} from '@angular/common';
import { filter, pairwise } from 'rxjs/operators';
import { ActivatedRoute, Router, RoutesRecognized } from '@angular/router';
import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { DocumentGoPanel } from './document-go.component';
import { ComponentPortal } from '@angular/cdk/portal';
import {ResApiService} from '../../services/res-api.service';
import { ItemDocumentGo, ListDocType, ItemSeleted, ItemSeletedCode, ItemUser } from './../models/document-go';
import { SharedService } from '../../../../shared/shared-service/shared.service'
import { DocumentGoService } from './document-go.service';
import {DocumentComponent} from '../document-go/document.component';

import {
  ROUTE_ANIMATIONS_ELEMENTS,
  NotificationService
} from '../../../../core/core.module';

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
export class DocumentGoRetrieveComponent implements OnInit {
  listTitle = "ListProcessRequestGo";
  inDocs$: ItemDocumentGo[]= [];
  displayedColumns: string[] = ['numberGo', 'DocTypeName', 'created', 'userRequest', 'userApprover', 'deadline','compendium']; //'select', 'userApprover'
  dataSource = new MatTableDataSource<ItemDocumentGo>();
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

  constructor(public viewContainerRef: ViewContainerRef,
              public overlay: Overlay,
              private docServices: DocumentGoService,
              private resServices: ResApiService,
              private shareServices: SharedService,
              private routes : Router,
              private notificationService: NotificationService,
              private ref: ChangeDetectorRef,
              private documentGo: DocumentComponent,
              private location: PlatformLocation,
              private modalService: BsModalService,) { 
                this.location.onPopState(() => {
                  console.log('Init: pressed back!');
                  window.location.reload(); 
                  return;
                });
              }

  ngOnInit() {
    this.getCurrentUser();
    //this.documentGo.isAuthenticated$ = false;
  }

  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  ClickItem(template, row) {
    let docId = row.documentID;
    this.openCommentPanel();
    let strSelect = '';
    strSelect = ` and (TypeCode eq 'CXL' or TypeCode eq 'TL') and StatusID eq '-1'`;  
    this.strFilter = `&$filter=DocumentGoID eq ` + docId + strSelect;
    this.docServices.getListRequestTo(this.strFilter).subscribe((itemValue: any[]) => {
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
      this.closeCommentPanel();
    },
    () => {
      this.dataSource2 = new MatTableDataSource<ItemRetrieve>(this.ListItem);
      if (!(this.ref as ViewRef).destroyed) {
        this.ref.detectChanges();  
      } 
      this.dataSource2.paginator = this.paginator;
      this.bsModalRef = this.modalService.show(template, {class: 'modal-lg'});
      this.closeCommentPanel();
    })
  }
  
  getAllListRequest() {
    let strSelect = '';
    strSelect = ` and (TypeCode eq 'CXL' or TypeCode eq 'TL') and StatusID eq '-1'`;  
    this.strFilter = `&$filter=UserApprover/Id eq ` + this.currentUserId + strSelect;
    this.docServices.getListRequestTo(this.strFilter).subscribe((itemValue: any[]) => {
      let item = itemValue["value"] as Array<any>;     
      this.inDocs$ = []; 
      item.forEach(element => {
        if(this.inDocs$.findIndex(e => e.ID === element.DocumentGoID) < 0) {
          this.inDocs$.push({
            ID: element.DocumentGoID,
            NumberGo: this.docServices.formatNumberGo(element.NumberGo),
            DocTypeName: this.docServices.checkNull(element.DocTypeName),
            NumberSymbol:this.docServices.checkNull(element.Title),
            Compendium: this.docServices.checkNull(element.Compendium),
            AuthorId: element.Author == undefined ? '' : element.Author.Id,
            UserCreateName: element.Author == undefined ? '' : element.Author.Title,
            DateCreated: this.formatDateTime(element.DateCreated),
            UserOfHandleName: element.UserApprover == undefined ? '' : element.UserApprover.Title,
            UserOfKnowName: element.UserOfKnow == undefined ? '' : element.UserOfKnow.Title,
            UserOfCombinateName: element.UserOfCombinate == undefined ? '' : element.UserOfCombinate.Title,
            Deadline: this.formatDateTime(element.Deadline),
            StatusName: this.docServices.checkNull(element.StatusName),
            BookTypeName: '',
            UnitCreateName: '',
            RecipientsInName: '',
            RecipientsOutName: '',
            SecretLevelName: '',
            UrgentLevelName: '',
            SecretLevelId: 0,
            UrgentLevelId: 0,
            MethodSendName: '',
            DateIssued:'',
            SignerName: '',
            Note:'',
            NumOfPaper :'',
            link: ''
          })
        } 
        else if(element.IsFinished === 1) {
          let index = this.inDocs$.findIndex(e => e.ID === element.DocumentGoID);
          if(index >= 0) {
            this.inDocs$.splice(index, 1);
          }
        }
      })
      this.dataSource = new MatTableDataSource<ItemDocumentGo>(this.inDocs$);
      if (!(this.ref as ViewRef).destroyed) {
        this.ref.detectChanges();  
      } 
      this.dataSource.paginator = this.paginator;
      this.closeCommentPanel();
    },
    error => { 
      console.log("error: " + error);
      this.closeCommentPanel();
    },
    () => {
      this.closeCommentPanel();
    }
    );   
  }

  getCurrentUser(){
    this.openCommentPanel();
    this.shareServices.getCurrentUser().subscribe(
      itemValue => {
          this.currentUserId = itemValue["Id"];
          this.currentUserName = itemValue["Title"];
        },
      error => { 
        console.log("error: " + error);
        this.closeCommentPanel();
      },
      () => {
        console.log("Current user email is: \n" + "Current user Id is: " + this.currentUserId + "\n" + "Current user name is: " + this.currentUserName );
        this.resServices.getDepartmnetOfUser(this.currentUserId).subscribe(
          itemValue => {
            let itemUserMember = itemValue['value'] as Array<any>;
            if (itemUserMember.length > 0) {
              itemUserMember.forEach(element => {
                if (element.RoleCode === 'TP' || element.RoleCode === 'GĐ' || element.RoleCode === 'NV') {
                  //this.documentGo.isAuthenticated$ = true;
                }
              });
            } else {
              this.notificationService.info('Bạn không có quyền truy cập');
              this.routes.navigate(['/']);
            }
          },
          error => {
            console.log('Load department code error: ' + error);
            this.closeCommentPanel();
          },
          () => {
          });
        this.getAllListRequest();
      }
      );
  }

  getInforRetrieve(template, docId) {
    this.openCommentPanel();
    let strSelect = '';
    strSelect = ` and (TypeCode eq 'CXL' or TypeCode eq 'TL') and StatusID eq '-1'`;  
    this.strFilter = `&$filter=NoteBookID eq ` + docId + strSelect;
    this.docServices.getListRequestTo(this.strFilter).subscribe((itemValue: any[]) => {
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
      this.closeCommentPanel();
    },
    () => {
      this.dataSource2 = new MatTableDataSource<ItemRetrieve>(this.ListItem);
      if (!(this.ref as ViewRef).destroyed) {
        this.ref.detectChanges();  
      } 
      this.dataSource2.paginator = this.paginator;
      this.bsModalRef = this.modalService.show(template, {class: 'modal-lg'});
      this.closeCommentPanel();
    })
  }

  // format định dạng ngày    
  formatDateTime(date: Date): string {
    if (!date) {
      return '';
    }
    return moment(date).format('DD/MM/YYYY');
    //return moment(date).format('DD/MM/YYYY hh:mm A');
  }

  openCommentPanel() {
    let config = new OverlayConfig();
    config.positionStrategy = this.overlay.position()
      .global().centerVertically().centerHorizontally();
    config.hasBackdrop = true;
    this.overlayRef = this.overlay.create(config);
    this.overlayRef.attach(new ComponentPortal(DocumentGoPanel, this.viewContainerRef));
  }

  closeCommentPanel() {
    if(this.overlayRef !== undefined) {
      this.overlayRef.dispose();
    }
  }
}
