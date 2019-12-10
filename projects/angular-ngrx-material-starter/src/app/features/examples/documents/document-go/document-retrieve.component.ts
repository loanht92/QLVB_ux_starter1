import { Component, OnInit, ChangeDetectionStrategy, ViewChild, ChangeDetectorRef, ViewContainerRef, ViewRef } from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
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
// MatdataTable
export interface ArrayHistoryObject {
  pageIndex: Number;
  data: any[];
}
@Component({
  selector: 'anms-document-retrieve',
  templateUrl: './document-retrieve.component.html',
  styleUrls: ['./document-retrieve.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentGoRetrieveComponent implements OnInit {
  listTitle = "ListProcessRequestGo";
  inDocs$= [];
  displayedColumns: string[] = ['DocumentID', 'DocTypeName', 'DateCreated', 'UserCreateName', 'UserOfHandleName', 'Deadline','Compendium','flag']; //'select', 'userApprover'
  dataSource = new MatTableDataSource<ItemDocumentGo>();
  displayedColumns2: string[] = ['department', 'userName', 'time', 'reason'];
  dataSource2 = new MatTableDataSource<ItemRetrieve>();
  ListItem: ItemRetrieve[] = [];
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
  searchText = '';
  date = new FormControl(new Date());
  DocumentID = 0;
  currentUserId;
  currentUserName;
  strFilter = '';
  overlayRef;
  bsModalRef;
  @ViewChild(MatSort, { static: false }) sort: MatSort;
  pageSizeOptions = [10, 20, 50, 100]; pageSize = 10; lengthData = 0;
  pageIndex = 0; sortActive = "DateCreated"; sortDirection = "desc";
  urlNextPage = ""; indexPage = 0;
  ArrayHistory: ArrayHistoryObject[] = [];
  constructor(public viewContainerRef: ViewContainerRef,
              public overlay: Overlay,
              private docServices: DocumentGoService,
              private resServices: ResApiService,
              private shareService: SharedService,
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
    let docId = row.DocumentID;
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
          Reason: element.ReasonRetrieve
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
  Search() {
    this.inDocs$ = [];
    this.ArrayHistory = [];
    this.paginator.pageIndex = 0;

    let filterCount='' ;
    let strFilter1 ='';
    let strSelect = '';
    strSelect = ` and (TypeCode eq 'CXL' or TypeCode eq 'TL') and StatusID eq '-1'`;  
    strFilter1 = `&$filter=UserApprover/Id eq ` + this.currentUserId + strSelect;
    filterCount=`?$filter=UserApprover/Id eq ` + this.currentUserId +` and (TypeCode eq 'CXL' or TypeCode eq 'TL') and StatusID eq -1`;
    this.strFilter =
    `?$select=*,Author/Id,Author/Title,UserApprover/Id,UserApprover/Title,UserRequest/Id,UserRequest/Title&$expand=Author,UserApprover,UserRequest&$top=`
    + this.pageSize  + strFilter1 +`&$orderby=` + this.sortActive + ` ` + this.sortDirection;
    console.log(' strFilter='+this.strFilter);
  // this.getData(this.strFilter);
    this.getLengthData(filterCount);
  }
  onPageChange($event) {
    // console.log("$event");
    // console.log($event)
    if ($event.pageSize !== this.pageSize) {
      this.pageSize = this.paginator.pageSize;
      this.openCommentPanel();
      this.Search();
    }
    else {
      if ($event.pageIndex > this.indexPage) {
        let next = this.ArrayHistory.findIndex(x => x.pageIndex === $event.pageIndex);
        if (next !== -1) {
          this.dataSource = new MatTableDataSource(this.ArrayHistory[next].data);
        }
        else {
          if (this.urlNextPage !== undefined) {
            const url = this.urlNextPage.split("/items")[1];
            this.getData(url);
          }
        }
      }
      else {
        let next = this.ArrayHistory.findIndex(x => x.pageIndex === $event.pageIndex);
        if (next !== -1) {
          this.dataSource = new MatTableDataSource(this.ArrayHistory[next].data);
        }
        else {
          this.pageSize = this.paginator.pageSize;
          this.paginator.pageIndex = 0;
          this.indexPage = 0;
          this.Search();
        }
      }
    }
    this.indexPage = $event.pageIndex;
 
  }

  sortData($event) {
    // console.log("$event");
    // console.log($event);
    this.sortActive = $event.active;
    this.sortDirection = $event.direction;
    this.paginator.pageIndex = 0;
    this.indexPage = 0;
    this.Search();
  }
  getLengthData(filterCount) {
    const urlFilter = `ListProcessRequestGo/$count` + filterCount;
    this.shareService.getCountItem(urlFilter).subscribe(
      items => {
        // console.log(items);
        // this.lengthData = Number(items);
        this.lengthData = items as number;
        // console.log("this.lengthData: " + this.lengthData);
       
      },
      error => {
        console.log(error);
      },
      () => {
        this.getData(this.strFilter);
        console.log("lengthData: " + this.lengthData);
        // if (!(this.ref as ViewRef).destroyed) {
        //   this.ref.detectChanges();
        // }
      }
    )
  }
  getData(filter) {
    this.inDocs$ = [];
    this.shareService.getItemList("ListProcessRequestGo", filter).subscribe(
      itemValue => {
        // console.log("itemValue");
        // console.log(itemValue);
        let itemList = itemValue["value"] as Array<any>;
        itemList.forEach(element => {
          this.inDocs$.push({
            ID: element.ID,
            DocumentID: element.DocumentGoID,
            NumberGo: this.docServices.formatNumberGo(element.NumberGo),
            DocTypeName: this.docServices.checkNull(element.DocTypeName),
            NumberSymbol:this.docServices.checkNull(element.Title),
            Compendium: this.docServices.checkNull(element.Compendium),
            AuthorId: element.UserRequest == undefined ? '' : element.UserRequest.Id,
            UserCreateName: element.UserRequest == undefined ? '' : element.UserRequest.Title,
            DateCreated: this.formatDateTime(element.DateCreated),
            UserApproverId: element.UserApprover == undefined ? '' : element.UserApprover.Id,
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
            SecretCode:  this.docServices.checkNull(element.SecretCode),
            UrgentCode: this.docServices.checkNull(element.UrgentCode),
            TotalStep:0,
            MethodSendName: '',
            SignerName: '',
            Note:'',
            NumOfPaper :'',
            link: '',
            TypeCode: element.TypeCode,
            StatusID: element.StatusID,
            
            flag:((this.docServices.checkNull(element.UrgentCode)!='' && this.docServices.checkNull(element.UrgentCode)!='BT')|| (this.docServices.checkNull(element.SecretCode)!='' && this.docServices.checkNull(element.SecretCode)!='BT'))?'flag':''
          })
        })
        this.urlNextPage = itemValue["odata.nextLink"];
        this.lengthData
      },
      error => {
        console.log(error);
        this.closeCommentPanel();
      },
      () => {
        this.dataSource = new MatTableDataSource(this.inDocs$);
        this.ArrayHistory.push({
          pageIndex: this.paginator.pageIndex,
          data: this.inDocs$
        });
        if (!(this.ref as ViewRef).destroyed) {
          this.ref.detectChanges();
        }
        if (this.overlayRef !== undefined) {
          this.closeCommentPanel();
        }
      })
  }
  isNotNull(str) {
    return str !== null && str !== '' && str !== undefined;
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
            ID: element.ID,
            DocumentID: element.DocumentGoID,
            NumberGo: this.docServices.formatNumberGo(element.NumberGo),
            DocTypeName: this.docServices.checkNull(element.DocTypeName),
            NumberSymbol:this.docServices.checkNull(element.Title),
            Compendium: this.docServices.checkNull(element.Compendium),
            AuthorId: element.UserRequest == undefined ? '' : element.UserRequest.Id,
            UserCreateName: element.UserRequest == undefined ? '' : element.UserRequest.Title,
            DateCreated: this.formatDateTime(element.DateCreated),
            UserApproverId: element.UserApprover == undefined ? '' : element.UserApprover.Id,
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
            SecretCode:  this.docServices.checkNull(element.SecretCode),
            UrgentCode: this.docServices.checkNull(element.UrgentCode),
            TotalStep:0,
            MethodSendName: '',
            SignerName: '',
            Note:'',
            NumOfPaper :'',
            link: '',
            TypeCode: element.TypeCode,
            StatusID: element.StatusID,
            
            flag:((this.docServices.checkNull(element.UrgentCode)!='' && this.docServices.checkNull(element.UrgentCode)!='BT')|| (this.docServices.checkNull(element.SecretCode)!='' && this.docServices.checkNull(element.SecretCode)!='BT'))?'flag':''
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
    this.shareService.getCurrentUser().subscribe(
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
      //  this.getAllListRequest();
      this.Search();
      }
      );
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
