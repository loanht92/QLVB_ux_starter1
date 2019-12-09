import { Component, OnInit, ChangeDetectionStrategy, ViewChild, ChangeDetectorRef, ViewContainerRef, ViewRef } from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material';
import {FormControl, FormBuilder} from '@angular/forms';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import * as moment from 'moment';
import {PlatformLocation, getLocaleExtraDayPeriodRules} from '@angular/common';
import { filter, pairwise } from 'rxjs/operators';
import { ActivatedRoute, Router, RoutesRecognized } from '@angular/router';
import {IncomingDocService, IncomingTicket} from '../incoming-doc.service';
import {RotiniPanel} from './document-add.component';
import {ResApiService} from '../../../services/res-api.service';
import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { SharedService } from '../../../../../shared/shared-service/shared.service';
import {
  ROUTE_ANIMATIONS_ELEMENTS,
  NotificationService
} from '../../../../../core/core.module';
// MatdataTable
export interface ArrayHistoryObject {
  pageIndex: Number;
  data: any[];
}
export class ItemRetrieve {
  Department: string;
  UserName: string;
  TimeRetrieve: string;
  Reason: string;
  IndexStep: number
}

@Component({
  selector: 'anms-document-retrieve',
  templateUrl: './document-retrieve.component.html',
  styleUrls: ['./document-retrieve.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentRetrieveComponent implements OnInit {
  listTitle = "ListProcessRequestTo";
  inDocs$= [];
  displayedColumns: string[] = ['numberTo', 'DateCreated', 'userRequest', 'userApprover', 'deadline','compendium', 'flag']; //'select', 'userApprover'
  dataSource = new MatTableDataSource<IncomingTicket>();
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
   constructor(private docTo: IncomingDocService, 
              private services: ResApiService, private ref: ChangeDetectorRef,
              private readonly notificationService: NotificationService,
              public overlay: Overlay, public viewContainerRef: ViewContainerRef,
              private route: ActivatedRoute, private modalService: BsModalService,private shareService: SharedService,
              private location: PlatformLocation, private routes: Router
    ) {
      this.location.onPopState(() => {
        console.log('Init: pressed back!');
        window.location.reload(); 
        return;
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
        if(this.ListItem.findIndex(i => i.IndexStep === element.IndexStep) < 0) {
          this.ListItem.push({
            Department: element.Source,
            UserName: element.UserRetrieve !== undefined ? element.UserRetrieve.Title : '',
            TimeRetrieve: moment(element.DateRetrieve).format('DD/MM/YYYY'),
            Reason: element.ReasonRetrieve,
            IndexStep: element.IndexStep
          })
        }
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
    `?$select=*,Author/Id,Author/Title,UserApprover/Id,UserApprover/Title&$expand=Author,UserApprover&$top=`
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
      this.OpenRotiniPanel();
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
    const urlFilter = `ListProcessRequestTo/$count` + filterCount;
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
    this.shareService.getItemList("ListProcessRequestTo", filter).subscribe(
      itemValue => {
        // console.log("itemValue");
        // console.log(itemValue);
        let itemList = itemValue["value"] as Array<any>;
        itemList.forEach(element => {
          this.inDocs$.push({
            STT: this.inDocs$.length + 1,
            ID: element.ID,
            documentID: element.NoteBookID, 
            compendium: element.Compendium, 
            userRequest: element.UserRequest !== undefined ? element.UserRequest.Title : '',
            userRequestId: element.UserRequest !== undefined ? element.UserRequest.Id : '',
            userApproverId: element.UserApprover !== undefined ? element.UserApprover.Id : '',
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
            DateCreated: this.docTo.CheckNull(element.DateCreated) === '' ? '' : moment(element.DateCreated).format('DD/MM/YYYY'),
            numberTo: element.Title,
            link: '',
            stsClass: '',
            // flag: element.Flag === 0 ? '' : 'flag'
            flag: element.SecretCode === "MAT" || element.UrgentCode === "KHAN" ? 'flag' : ''
          })
        })
        this.urlNextPage = itemValue["odata.nextLink"];
        this.lengthData
      },
      error => {
        console.log(error);
        this.CloseRotiniPanel();
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
          this.CloseRotiniPanel();
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
            userApproverId: element.UserApprover !== undefined ? element.UserApprover.Id : '',
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
            stsClass: '',
            // flag: element.Flag === 0 ? '' : 'flag'
            flag: element.SecretCode === "MAT" || element.UrgentCode === "KHAN" ? 'flag' : ''
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
       // this.getAllListRequest();
       this.Search();
      }
      );
  }

  getInforRetrieve(template, docId) {
    this.OpenRotiniPanel();
    let strSelect = '';
    strSelect = ` and (TypeCode eq 'CXL' or TypeCode eq 'TL' or TypeCode eq 'XYK') and StatusID eq '-1'`;  
    this.strFilter = `&$filter=NoteBookID eq ` + docId + strSelect;
    this.docTo.getListRequestTo(this.strFilter).subscribe((itemValue: any[]) => {
      let item = itemValue["value"] as Array<any>; 
      this.ListItem = [];
      item.forEach(element => {
        if(this.ListItem.findIndex(i => i.IndexStep === element.IndexStep) < 0) {
          this.ListItem.push({
            Department: element.Source,
            UserName: element.UserRetrieve !== undefined ? element.UserRetrieve.Title : '',
            TimeRetrieve: moment(element.DateRetrieve).format('DD/MM/YYYY'),
            Reason: element.Content,
            IndexStep: element.IndexStep
          })
        }
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
