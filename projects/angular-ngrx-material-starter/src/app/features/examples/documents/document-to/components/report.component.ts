import { Component, OnInit, ChangeDetectionStrategy, ViewChild, ChangeDetectorRef, ViewContainerRef, ViewRef } from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material';
import {FormControl, FormBuilder} from '@angular/forms';
import {SelectionModel} from '@angular/cdk/collections';
import {FlatTreeControl} from '@angular/cdk/tree';
import {MatTreeFlatDataSource, MatTreeFlattener} from '@angular/material/tree';
import {BehaviorSubject} from 'rxjs';
import * as moment from 'moment';
import {PlatformLocation} from '@angular/common';
import {IncomingDoc, ItemSeleted, IncomingDocService, IncomingTicket} from '../incoming-doc.service';
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
@Component({
  selector: 'anms-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportComponent implements OnInit {
  listTitle = "ListProcessRequestTo";
  inDocs$ = [];
  displayedColumns: string[] = ['numberTo', 'numberSymbol' ,'DateCreated', 'userRequest', 'deadline','compendium', 'sts']; //'select', 'userApprover'
  dataSource = new MatTableDataSource<IncomingTicket>();
  selection = new SelectionModel<IncomingTicket>(true, []);
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
  searchText = '';
  date = new FormControl(new Date());
  DocumentID = 0;
  currentUserId;
  currentUserName;
  strFilter = '';
  overlayRef;
  deadlineFrom = moment().subtract(30,'day').toDate();
  deadlineTo;
  dateTo = new Date();
  dateFrom = moment().subtract(30,'day').toDate();
  ListDocType: ItemSeleted[] = [];
  numberTo; docType;
  ListDocumentID = [];
  @ViewChild(MatSort, { static: false }) sort: MatSort;
  pageSizeOptions = [10, 20, 50, 100]; pageSize = 10; lengthData = 0;
  pageIndex = 0; sortActive = "DateCreated"; sortDirection = "desc";
  urlNextPage = ""; indexPage = 0;
  ArrayHistory: ArrayHistoryObject[] = []
  constructor(private fb: FormBuilder, private docTo: IncomingDocService, 
              private services: ResApiService, private ref: ChangeDetectorRef,
              private readonly notificationService: NotificationService,
              public overlay: Overlay, public viewContainerRef: ViewContainerRef,private shareService: SharedService,
              private location: PlatformLocation
    ) {
      this.location.onPopState(() => {
        console.log('Init: pressed back!');
        window.location.reload(); 
        return;
      });
    }

  ngOnInit() {
    this.getDocType();
    //this.getAllListRequest();
    this.getCurrentUser();
  }
  
  validateQty(event) {
    var key = window.event ? event.keyCode : event.which;
    if (event.keyCode === 8) {
        return true;
    }
    else {
      return false;
    }
  };
  Search() {
    this.inDocs$ = [];
    this.ArrayHistory = [];
    this.paginator.pageIndex = 0;
    let strFilter1 ='';
    strFilter1 = `&$filter=StatusID ne '-1'`;
    strFilter1 += ` and ListUserView/Id eq '`+this.currentUserId+`'`;
    if(this.docTo.CheckNull(this.numberTo) !== '') {
      strFilter1 += ` and(NumberTo eq '` + this.docTo.CheckNullSetZero(this.numberTo) + `' or substringof('` + this.numberTo + `',NumberOfSymbol))`;
    }

    if(this.docTo.CheckNullSetZero(this.docType) > 0) {
      strFilter1 += ` and DocTypeID eq '` + this.docType +`'`;
    }

    if(this.docTo.CheckNull(this.deadlineFrom) !== '') {
      this.deadlineFrom =  new Date(moment(this.deadlineFrom).hours(0).minutes(0).seconds(0).toDate());
      strFilter1 += ` and (Deadline ge '` + this.ISODateStringUTC(this.deadlineFrom) + `' or Deadline eq null)`;
    }

    if(this.docTo.CheckNull(this.deadlineTo) !== '') {
      this.deadlineTo =  new Date(moment(this.deadlineTo).hours(23).minutes(59).seconds(59).toDate());
      strFilter1 += ` and (Deadline le '` + this.ISODateStringUTC(this.deadlineTo) + `' or Deadline eq null)`
    }

    if(this.docTo.CheckNull(this.dateFrom) !== '') {
      this.dateFrom =  new Date(moment(this.dateFrom).hours(0).minutes(0).seconds(0).toDate());
      strFilter1 += ` and (DateTo ge '` + this.ISODateStringUTC(this.dateFrom) + `' or DateTo eq null)`;
    }

    if(this.docTo.CheckNull(this.dateTo) !== '') {
      this.dateTo =  new Date(moment(this.dateTo).hours(23).minutes(59).seconds(59).toDate());
      strFilter1 += ` and (DateTo le '` + this.ISODateStringUTC(this.dateTo) + `' or DateTo eq null)`;
    }

    this.strFilter =
    `?$select=*,Author/Id,Author/Title,ListUserView/Id&$expand=Author,ListUserView&$top=`
    + this.pageSize  + strFilter1 +`&$orderby=` + this.sortActive + ` ` + this.sortDirection;
    console.log(' strFilter='+this.strFilter);
   this.getData(this.strFilter);
   // this.getLengthData(filterCount);
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

  getData(filter) {
    this.inDocs$ = [];
    this.shareService.getItemList("ListDocumentTo", filter).subscribe(
      itemValue => {
        // console.log("itemValue");
        // console.log(itemValue);
        let itemList = itemValue["value"] as Array<any>;
        itemList.forEach(element => {
          this.inDocs$.push({
            STT: this.inDocs$.length + 1,
            ID: element.ID,
            numberTo: this.docTo.formatNumberTo(element.NumberTo), 
            numberSub: element.NumberToSub,
            numberSymbol: element.NumberOfSymbol, 
            userRequest: element.Author.Title,
            userRequestId: element.Author.Id,
            userApprover: element.UserOfHandle !== undefined ? element.UserOfHandle.Title : '',
            deadline: this.docTo.CheckNull(element.Deadline) === '' ? '' : moment(element.Deadline).format('DD/MM/YYYY'),
            status: this.docTo.CheckNullSetZero(element.StatusID) === 0 ? 'Đang xử lý' : 'Đã xử lý',
            compendium: this.docTo.CheckNull(element.Compendium),
            note: this.docTo.CheckNull(element.Note),
            DateCreated: this.docTo.CheckNull(element.DateCreated) === '' ? '' : moment(element.DateCreated).format('DD/MM/YYYY'),
            sts: this.docTo.CheckNullSetZero(element.StatusID) === 0 ? 'Ongoing' : 'Approved',
            link: element.StatusID !== -1 ? '/Documents/IncomingDoc/docTo-detail/' + element.ID : ''
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
        //gán lại lengthdata
        if(this.indexPage > 0){
          if(this.isNotNull(this.urlNextPage)){
            this.lengthData += this.inDocs$.length;
          }
          else{
            this.lengthData += this.inDocs$.length -1;
          }
        }
        else{
          if(this.inDocs$.length < this.pageSize){
            this.lengthData = this.inDocs$.length;
          }
          else{
            if(this.isNotNull(this.urlNextPage)){
              this.lengthData = this.inDocs$.length + 1;
            }
            else{
              this.lengthData = this.inDocs$.length;
            }
          }
        }

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
    try{
      this.OpenRotiniPanel();
      this.strFilter = `&$filter=StatusID ne '-1'`;
      if(this.docTo.CheckNull(this.numberTo) !== '') {
        this.strFilter += ` and(NumberTo eq '` + this.docTo.CheckNullSetZero(this.numberTo) + `' or substringof('` + this.numberTo + `',NumberOfSymbol))`;
      }

      if(this.docTo.CheckNullSetZero(this.docType) > 0) {
        this.strFilter += ` and DocTypeID eq '` + this.docType +`'`;
      }

      if(this.docTo.CheckNull(this.deadlineFrom) !== '') {
        this.deadlineFrom = new Date(moment(this.deadlineFrom).hours(0).minutes(0).seconds(0).toDate());
        this.strFilter += ` and (Deadline ge '` + this.ISODateStringUTC(this.deadlineFrom) + `' or Deadline eq null)`;
      }

      if(this.docTo.CheckNull(this.deadlineTo) !== '') {
        this.deadlineTo =  new Date(moment(this.deadlineTo).hours(23).minutes(59).seconds(59).toDate());
        this.strFilter += ` and (Deadline le '` + this.ISODateStringUTC(this.deadlineTo) + `' or Deadline eq null)`
      }

      if(this.docTo.CheckNull(this.dateFrom) !== '') {
        this.dateFrom =  new Date(moment(this.dateFrom).hours(0).minutes(0).seconds(0).toDate());
        this.strFilter += ` and (DateTo ge '` + this.ISODateStringUTC(this.dateFrom) + `' or DateTo eq null)`;
      }

      if(this.docTo.CheckNull(this.dateTo) !== '') {
        this.dateTo =  new Date(moment(this.dateTo).hours(23).minutes(59).seconds(59).toDate());
        this.strFilter += ` and (DateTo le '` + this.ISODateStringUTC(this.dateTo) + `' or DateTo eq null)`;
      }

      this.docTo.getAllDocumentTo(this.strFilter).subscribe((itemValue: any[]) => {
        let item = itemValue["value"] as Array<any>;     
        this.inDocs$ = []; 
        item.forEach(element => {
          if(this.ListDocumentID.indexOf(element.ID) >= 0) {
            this.inDocs$.push({
              STT: this.inDocs$.length + 1,
              ID: element.ID,
              numberTo: this.docTo.formatNumberTo(element.NumberTo), 
              numberSub: element.NumberToSub,
              numberSymbol: element.NumberOfSymbol, 
              userRequest: element.Author.Title,
              userRequestId: element.Author.Id,
              userApprover: element.UserOfHandle !== undefined ? element.UserOfHandle.Title : '',
              deadline: this.docTo.CheckNull(element.Deadline) === '' ? '' : moment(element.Deadline).format('DD/MM/YYYY'),
              status: this.docTo.CheckNullSetZero(element.StatusID) === 0 ? 'Đang xử lý' : 'Đã xử lý',
              compendium: this.docTo.CheckNull(element.Compendium),
              note: this.docTo.CheckNull(element.Note),
              created: this.docTo.CheckNull(element.DateCreated) === '' ? '' : moment(element.DateCreated).format('DD/MM/YYYY'),
              sts: this.docTo.CheckNullSetZero(element.StatusID) === 0 ? 'Ongoing' : 'Approved',
              link: element.StatusID !== -1 ? '/Documents/IncomingDoc/docTo-detail/' + element.ID : ''
            })
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
    } catch(err) {
      console.log("Load all document to error:" + err.message);
      this.CloseRotiniPanel();
    }
  }

  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
  
  resetForm() {
    this.numberTo = null;
    this.docType = null;
    this.deadlineFrom = moment().subtract(30,'day').toDate();
    this.deadlineTo = new Date();
    this.dateTo = new Date();
    this.dateFrom = moment().subtract(30,'day').toDate();
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
        this.CloseRotiniPanel();
       // this.getAllListProcess();
       this.Search();
      }
      );
  }

  getDocType() {
    this.services.getListDocType().subscribe((itemValue: any[]) => {
      let item = itemValue['value'] as Array<any>;
      item.forEach(element => {
        this.ListDocType.push({
          id: element.ID,
          title: element.Title,
          code: ''
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
    this.overlayRef.attach(new ComponentPortal(RotiniPanel, this.viewContainerRef));
  }

  CloseRotiniPanel() {
    if(this.overlayRef !== undefined) {
      this.overlayRef.dispose();
    }
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

  getAllListProcess() {
    this.OpenRotiniPanel();
    let strSelect = `&$filter=(UserRequest/Id eq '` + this.currentUserId + `' or UserApprover/Id eq '` + this.currentUserId + `')`;   
    this.docTo.getListRequestTo(strSelect).subscribe((itemValue: any[]) => {
      let item = itemValue["value"] as Array<any>;
      this.ListDocumentID = [];
      item.forEach(element => {
        if(this.ListDocumentID.indexOf(element.NoteBookID) < 0) {
          this.ListDocumentID.push(element.NoteBookID);
        }
      })  
    },
    error => { 
      console.log("error: " + error);
      this.CloseRotiniPanel();
    },
    () => {
      this.CloseRotiniPanel();
      this.getAllListRequest();
    }
    );   
  }
}
