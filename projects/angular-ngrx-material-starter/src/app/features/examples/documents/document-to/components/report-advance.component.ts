import { Component, OnInit, ChangeDetectionStrategy, ViewChild, ChangeDetectorRef, ViewContainerRef, ViewRef } from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material';
import {FormControl, FormBuilder} from '@angular/forms';
import {SelectionModel} from '@angular/cdk/collections';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import {BehaviorSubject, Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import * as moment from 'moment';
import {PlatformLocation} from '@angular/common';
import {ItemSeleted, IncomingDocService, IncomingTicket, ApproverObject} from '../incoming-doc.service';
import {RotiniPanel} from './document-add.component';
import {ResApiService} from '../../../services/res-api.service';
import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { SharedService } from '../../../../../shared/shared-service/shared.service';
import {
  ROUTE_ANIMATIONS_ELEMENTS,
  NotificationService
} from '../../../../../core/core.module';
import { any } from 'bluebird';
import { Router } from '@angular/router';
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
}

@Component({
  selector: 'anms-report-advance',
  templateUrl: './report-advance.component.html',
  styleUrls: ['./report-advance.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportAdvanceComponent implements OnInit {
  listTitle = "ListProcessRequestTo";
  inDocs$ = [];
  displayedColumns: string[] = ['numberTo', 'numberSymbol' ,'DateCreated', 'userRequest', 'deadline','compendium', 'sts', 'flag']; //'select', 'userApprover', 'content'
  dataSource = new MatTableDataSource<IncomingTicket>();
  selection = new SelectionModel<IncomingTicket>(true, []);
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
  searchText = '';
  date = new FormControl(new Date());
  DocumentID = 0;
  currentUserId;
  currentUserName;
  strFilter = '';
  ListUserApprover: ApproverObject[] = [];
  overlayRef;
  promulgatedFrom = moment().subtract(30,'day').toDate();
  promulgatedTo = new Date();
  dateTo = new Date();
  dateFrom = moment().subtract(30,'day').toDate();
  showList = false;
  ListIdDoc = [];
  isFrist = false;
  displayedColumns2: string[] = ['department', 'userName', 'time', 'reason'];
  dataSource2 = new MatTableDataSource<ItemRetrieve>();
  ListItem: ItemRetrieve[] = [];
  bsModalRef;
  ListDocumentID = [];

  ListBookType = [
    {id: 0, title: 'Chưa vào sổ'},
    {id: 1, title: 'Văn bản đến'},
  ];
  ListDocType: ItemSeleted[] = [];
  ListSecret: ItemSeleted[] = [];
  ListUrgent: ItemSeleted[] = [];
  ListStatus = [
    {id: 0, title: '--- Tất cả ---', code: 'All'},
    // {id: 1, title: 'Chờ xử lý'},
    // {id: 2, title: 'Đang xử lý'},
    // {id: 3, title: 'Đã xử lý'},
    // {id: 4, title: 'Thu hồi'},
  ];
  bookType; numberTo; docType; numberOfSymbol; singer; source; urgentLevel; secretLevel;
  statusDoc; compendium; isAttachment = false;
  userApprover = new FormControl();
  filteredOptions: Observable<ApproverObject[]>;
  @ViewChild(MatSort, { static: false }) sort: MatSort;
  pageSizeOptions = [10, 20, 50, 100]; pageSize = 10; lengthData = 0;
  pageIndex = 0; sortActive = "DateCreated"; sortDirection = "desc";
  urlNextPage = ""; indexPage = 0;
  ArrayHistory: ArrayHistoryObject[] = []
  constructor(private fb: FormBuilder, private docTo: IncomingDocService, 
              private services: ResApiService, private ref: ChangeDetectorRef,
              private readonly notificationService: NotificationService,
              public overlay: Overlay, public viewContainerRef: ViewContainerRef,
              private routes: Router, private location: PlatformLocation,private shareService: SharedService,
              private modalService: BsModalService,
    ) {
      this.location.onPopState(() => {
        console.log('Init: pressed back!');
        window.location.reload(); 
        return;
      });
    }

  ngOnInit() {
    this.filteredOptions = this.userApprover.valueChanges
      .pipe(
        startWith(''),
        map(value => typeof value === 'string' ? value : value.UserName),
        map(name  => name  ? this._filterStates(name ) : this.ListUserApprover.slice())
      );
    this.getDocType();
    this.getListStatus();
    this.GetAllUser();
    this.getUrgentLevel();
    this.getSecretLevel();
    this.getCurrentUser();
  }

  ClickItem(row, modalTemp) {
    console.log(row);
    let docId = row.ID;
    let IsRetrieve = false;
    this.OpenRotiniPanel();
    let strSelect = '';
    strSelect = ` and (UserRequest/Id eq '` + this.currentUserId + `' or UserApprover/Id eq '` + this.currentUserId + `')`;  
    this.strFilter = `&$filter=NoteBookID eq '` + docId + `'` + strSelect;
    this.docTo.getListRequestTo(this.strFilter).subscribe((itemValue: any[]) => {
      let item = itemValue["value"] as Array<any>;
      this.ListItem = [];
      item.forEach(element => {
        if(element.StatusID === 0 || element.StatusID === 1) {
          this.CloseRotiniPanel();
          IsRetrieve = false;
          this.routes.navigate(['/Documents/IncomingDoc/docTo-detail/' + docId]);
        } else if(element.StatusID === -1) {
          IsRetrieve = true;
          this.ListItem.push({
            Department: element.Source,
            UserName: element.UserRetrieve !== undefined ? element.UserRetrieve.Title : '',
            TimeRetrieve: moment(element.DateRetrieve).format('DD/MM/YYYY'),
            Reason: element.ReasonRetrieve
          })
        }
      })
    },
    error => { 
      console.log("error: " + error);
      this.CloseRotiniPanel();
    },
    () => {
      if(IsRetrieve === true) {
        this.dataSource2 = new MatTableDataSource<ItemRetrieve>(this.ListItem);
        if (!(this.ref as ViewRef).destroyed) {
          this.ref.detectChanges();  
        } 
        this.dataSource2.paginator = this.paginator;
        this.bsModalRef = this.modalService.show(modalTemp, {class: 'modal-lg'});
        this.CloseRotiniPanel();
      }
    });     
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
  
  onDisplayValue(user?: ApproverObject): string | undefined {
    return user ? user.UserName : undefined;
  }

  private _filterStates(value: string): ApproverObject[] {
    const filterValue = value.toLowerCase();
    return this.ListUserApprover.filter(item => item.UserName.toLowerCase().includes(filterValue));
  }

   // Load all user approval
   GetAllUser() {
    this.docTo.getAllUser().subscribe((itemValue: any[]) => {
      let item = itemValue['value'] as Array<any>;
      this.ListUserApprover = [];
      item.forEach(element => {
        if(this.ListUserApprover.findIndex(i => i.UserId === element.User.Id) < 0) {
          this.ListUserApprover.push({
            UserId: element.User.Id,
            UserName: element.User.Title,
            UserEmail: element.User.Name.split('|')[2],
          });
        }
      })   
    },
    error => {
      console.log("Load all user error " + error);
      this.CloseRotiniPanel();
    },
    () =>{
    })
  }
  
  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  Search() {
    this.inDocs$ = [];
    this.ArrayHistory = [];
    this.paginator.pageIndex = 0;
    let filterCount='' ;
    let strFilter1 ='';
    if(this.bookType == 1){
      strFilter1 = `&$filter=NumberTo ne null`;
    } else if(this.bookType == -1){
      strFilter1 = `&$filter=NumberTo eq null`;
    } else {
      strFilter1 = `&$filter=ID ne '0'`;
    }
    strFilter1 += ` and ListUserView/Id eq '`+this.currentUserId+`'`;

    if(this.docTo.CheckNull(this.numberTo) !== '') {
      strFilter1 += ` and NumberTo eq '` + this.docTo.CheckNullSetZero(this.numberTo) + `'`;
    }

    if(this.docTo.CheckNull(this.numberOfSymbol) !== '') {
      strFilter1+= ` and substringof('` + this.numberOfSymbol + `',NumberOfSymbol)`;
    }

    if(this.docTo.CheckNullSetZero(this.docType) > 0) {
      strFilter1 += ` and DocTypeID eq '` + this.docType +`'`;
    }

    if(this.docTo.CheckNull(this.promulgatedFrom) !== '') {
      this.promulgatedFrom = moment(this.promulgatedFrom).hours(0).minutes(0).seconds(0).toDate();
      strFilter1 += ` and (PromulgatedDate ge '` + this.ISODateStringUTC(this.promulgatedFrom) + `' or PromulgatedDate eq null)`;
    }

    if(this.docTo.CheckNull(this.promulgatedTo) !== '') {
      this.promulgatedTo = moment(this.promulgatedTo).hours(23).minutes(59).seconds(59).toDate();
      strFilter1 += ` and (PromulgatedDate le '` + this.ISODateStringUTC(this.promulgatedTo) + `' or PromulgatedDate eq null)`
    }

    if(this.docTo.CheckNull(this.dateFrom) !== '') {
      this.dateFrom = moment(this.dateFrom).hours(0).minutes(0).seconds(0).toDate();
      strFilter1 += ` and (DateTo ge '` + this.ISODateStringUTC(this.dateFrom) + `' or DateTo eq null)`;
    }

    if(this.docTo.CheckNull(this.dateTo) !== '') {
      this.dateTo = moment(this.dateTo).hours(23).minutes(59).seconds(59).toDate();
      strFilter1 += ` and (DateTo le '` + this.ISODateStringUTC(this.dateTo) + `' or DateTo eq null)`;
    }

    if(this.docTo.CheckNull(this.singer) !== '') {
      strFilter1 += ` and substringof('` + this.singer + `',Signer)`;
    }

    if(this.docTo.CheckNull(this.source) !== '') {
      strFilter1 += ` and substringof('` + this.source + `',Source)`;
    }

    if(this.docTo.CheckNull(this.statusDoc) !== '') {
      if(this.statusDoc === 'All') {          
      } 
      else if(this.statusDoc === 'CVS') {
        strFilter1 += ` and StatusID eq '-1'`;
      }
      else if(this.statusDoc === 'BTH') {
        strFilter1 += ` and StatusID eq '1' and StatusName eq 'Bị thu hồi'`;
      }
      else {
        strFilter1 += ` and StatusID eq '0'`;
        if(this.ListIdDoc.length > 0) {
          strFilter1 += ` and (`;
          this.ListIdDoc.forEach(item => {
            strFilter1 += ` ID eq '` + item + `' or`
          })
          strFilter1 = strFilter1.substr(0, strFilter1.length-3) + `)`;
        } else if(this.isFrist && this.ListIdDoc.length === 0) {
          strFilter1 = `&$filter=ID eq '-1'`;
        }
      }
    }

    if(this.docTo.CheckNullSetZero(this.secretLevel) > 0) {
      strFilter1 += ` and SecretLevelID eq '` + this.secretLevel +`'`;
    }

    if(this.docTo.CheckNullSetZero(this.urgentLevel) > 0) {
      strFilter1 += ` and UrgentLevelID eq '` + this.urgentLevel +`'`;
    }

    if(this.docTo.CheckNull(this.userApprover.value) !== '') {
      strFilter1 += ` and substringof('` + this.userApprover.value.UserId + `_` + this.userApprover.value.UserName + `',ListUserApprover)`;
    }

    this.strFilter =
    `?$select=*,UserOfHandle/Title,UserOfHandle/Id,Author/Id,Author/Title,ListUserView/Id,AttachmentFiles&$expand=UserOfHandle,Author,ListUserView,AttachmentFiles&$top=`
    + this.pageSize  + strFilter1 +`&$orderby=` + this.sortActive + ` ` + this.sortDirection;
    console.log(' strFilter='+this.strFilter);
   this.getData(this.strFilter);
    //this.getLengthData(filterCount);
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
            documentID: element.ID,
            numberTo: this.docTo.formatNumberTo(element.NumberTo),
            numberSymbol: element.NumberOfSymbol, 
            userRequest: element.Author.Title,
            userRequestId: element.Author.Id,
            userApprover: element.UserOfHandle !== undefined ? element.UserOfHandle.Title : '',
            userApproverId: element.UserOfHandle !== undefined ? element.UserOfHandle.Id : 0,
            deadline: this.docTo.CheckNull(element.Deadline) === '' ? '' : moment(element.Deadline).format('DD/MM/YYYY'),
            status: this.docTo.CheckNullSetZero(element.StatusID) === 0 ? 'Đang xử lý' : 'Đã xử lý',
            compendium: this.docTo.CheckNull(element.Compendium),
            content: this.docTo.CheckNull(element.Note),
            DateCreated: this.docTo.CheckNull(element.DateCreated) === '' ? '' : moment(element.DateCreated).format('DD/MM/YYYY'),
            stsClass: this.docTo.CheckNullSetZero(element.StatusID) === 0 ? 'Ongoing' : 'Approved',
            link: element.StatusID === -1 ? '' : '/Documents/IncomingDoc/docTo-detail/' + element.ID,
            flag: element.SecretCode === "MAT" || element.UrgentCode === "KHAN" ? 'flag' : ''
            // flag: element.Flag === 0 ? '' : 'flag',            
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
    try {
      this.OpenRotiniPanel();
      let listName = '';
      this.strFilter = '';
      if(this.statusDoc !== 'All' && this.statusDoc !== 'ĐXL' && this.statusDoc !== 'BTH' && !this.isFrist) {
        this.getTicketByStatus(this.statusDoc);
        this.CloseRotiniPanel();
        return;
      }
      if(this.bookType === "0") {
        this.strFilter = `&$filter=StatusID eq '-1'`;
      } else if(this.docTo.CheckNullSetZero(this.bookType) === 1){
        this.strFilter = `&$filter=StatusID ne '-1'`;
      } else {
        this.strFilter = `&$filter=ID gt '0'`;
      }

      if(this.docTo.CheckNull(this.numberTo) !== '') {
        this.strFilter += ` and NumberTo eq '` + this.docTo.CheckNullSetZero(this.numberTo) + `'`;
      }

      if(this.docTo.CheckNull(this.numberOfSymbol) !== '') {
        this.strFilter += ` and substringof('` + this.numberOfSymbol + `',NumberOfSymbol)`;
      }

      if(this.docTo.CheckNullSetZero(this.docType) > 0) {
        this.strFilter += ` and DocTypeID eq '` + this.docType +`'`;
      }

      if(this.docTo.CheckNull(this.promulgatedFrom) !== '') {
        this.promulgatedFrom = moment(this.promulgatedFrom).hours(0).minutes(0).seconds(0).toDate();
        this.strFilter += ` and (PromulgatedDate ge '` + this.ISODateStringUTC(this.promulgatedFrom) + `' or PromulgatedDate eq null)`;
      }

      if(this.docTo.CheckNull(this.promulgatedTo) !== '') {
        this.promulgatedTo = moment(this.promulgatedTo).hours(23).minutes(59).seconds(59).toDate();
        this.strFilter += ` and (PromulgatedDate le '` + this.ISODateStringUTC(this.promulgatedTo) + `' or PromulgatedDate eq null)`
      }

      if(this.docTo.CheckNull(this.dateFrom) !== '') {
        this.dateFrom = moment(this.dateFrom).hours(0).minutes(0).seconds(0).toDate();
        this.strFilter += ` and (DateTo ge '` + this.ISODateStringUTC(this.dateFrom) + `' or DateTo eq null)`;
      }

      if(this.docTo.CheckNull(this.dateTo) !== '') {
        this.dateTo = moment(this.dateTo).hours(23).minutes(59).seconds(59).toDate();
        this.strFilter += ` and (DateTo le '` + this.ISODateStringUTC(this.dateTo) + `' or DateTo eq null)`;
      }

      if(this.docTo.CheckNull(this.singer) !== '') {
        this.strFilter += ` and substringof('` + this.singer + `',Signer)`;
      }

      if(this.docTo.CheckNull(this.source) !== '') {
        this.strFilter += ` and substringof('` + this.source + `',Source)`;
      }

      if(this.docTo.CheckNull(this.statusDoc) !== '') {
        if(this.statusDoc === 'All') {          
        } 
        else if(this.statusDoc === 'CVS') {
          this.strFilter += ` and StatusID eq '-1'`;
        }
        else if(this.statusDoc === 'BTH') {
          this.strFilter += ` and StatusID eq '1' and StatusName eq 'Bị thu hồi'`;
        }
        else {
          this.strFilter += ` and StatusID eq '0'`;
          if(this.ListIdDoc.length > 0) {
            this.strFilter += ` and (`;
            this.ListIdDoc.forEach(item => {
              this.strFilter += ` ID eq '` + item + `' or`
            })
            this.strFilter = this.strFilter.substr(0, this.strFilter.length-3) + `)`;
          } else if(this.isFrist && this.ListIdDoc.length === 0) {
            this.strFilter = `&$filter=ID eq '-1'`;
          }
        }
      }

      if(this.docTo.CheckNullSetZero(this.secretLevel) > 0) {
        this.strFilter += ` and SecretLevelID eq '` + this.secretLevel +`'`;
      }

      if(this.docTo.CheckNullSetZero(this.urgentLevel) > 0) {
        this.strFilter += ` and UrgentLevelID eq '` + this.urgentLevel +`'`;
      }

      if(this.docTo.CheckNull(this.userApprover.value) !== '') {
        this.strFilter += ` and substringof('` + this.userApprover.value.UserId + `_` + this.userApprover.value.UserName + `',ListUserApprover)`;
      }

      this.docTo.getAllDocumentTo(this.strFilter).subscribe((itemValue: any[]) => {
        let item = itemValue["value"] as Array<any>;     
        this.inDocs$ = []; 
        item.forEach(element => {
          if(this.docTo.CheckNull(this.compendium) !== '') { 
            if(!this.docTo.CheckNull(element.Compendium).toLowerCase().includes(this.compendium.toLowerCase())) {
              return;
            }
          }
          if(this.isAttachment) {
            if(element.Attachments) {
              return;
            }
          }
          if(this.ListDocumentID.indexOf(element.ID) >= 0) {
            this.inDocs$.push({
              STT: this.inDocs$.length + 1,
              ID: element.ID,
              documentID: element.ID,
              numberTo: this.docTo.formatNumberTo(element.NumberTo),
              numberSymbol: element.NumberOfSymbol, 
              userRequest: element.Author.Title,
              userRequestId: element.Author.Id,
              userApprover: element.UserOfHandle !== undefined ? element.UserOfHandle.Title : '',
              userApproverId: element.UserOfHandle !== undefined ? element.UserOfHandle.Id : 0,
              deadline: this.docTo.CheckNull(element.Deadline) === '' ? '' : moment(element.Deadline).format('DD/MM/YYYY'),
              status: this.docTo.CheckNullSetZero(element.StatusID) === 0 ? 'Đang xử lý' : 'Đã xử lý',
              compendium: this.docTo.CheckNull(element.Compendium),
              content: this.docTo.CheckNull(element.Note),
              created: this.docTo.CheckNull(element.DateCreated) === '' ? '' : moment(element.DateCreated).format('DD/MM/YYYY'),
              stsClass: this.docTo.CheckNullSetZero(element.StatusID) === 0 ? 'Ongoing' : 'Approved',
              link: element.StatusID === -1 ? '' : '/Documents/IncomingDoc/docTo-detail/' + element.ID,
              flag: element.SecretCode === "MAT" || element.UrgentCode === "KHAN" ? 'flag' : ''
              // flag: element.Flag === 0 ? '' : 'flag',            
            })
          }
        })   
        
        this.dataSource = new MatTableDataSource<IncomingTicket>(this.inDocs$);
        if (!(this.ref as ViewRef).destroyed) {
          this.ref.detectChanges();  
        }  
        this.isFrist = false;
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

  getTicketByStatus(status) {
    let strFilter = ``;
    if(status === "CXL") {
      strFilter = `&$filter=StatusID eq '0' and TypeCode eq 'CXL' and UserApprover/Id eq '` + this.currentUserId + `'`;
    }
    else if(status === "ĐAXL") {
      strFilter = `&$filter=StatusID eq '1' and TypeCode eq 'CXL' and UserApprover/Id eq '` + this.currentUserId + `'`;
    }
    else if(status === "NĐB") {
      strFilter = `&$filter=TypeCode eq 'CXL' and TaskTypeCode eq 'NĐB' and UserApprover/Id eq '` + this.currentUserId + `'`;
    }
    else if(status === "CCYK") {
      strFilter = `&$filter=StatusID eq '0' and TypeCode eq 'XYK' and UserApprover/Id eq '` + this.currentUserId + `'`;
    }
    else if(status === "ĐACYK") {
      strFilter = `&$filter=StatusID eq '1' and TypeCode eq 'XYK' and UserApprover/Id eq '` + this.currentUserId + `'`;
    }
    this.docTo.getListRequestTo(strFilter).subscribe((itemValue: any[]) => {
      this.ListIdDoc = [];
      let item = itemValue['value'] as Array<any>;
      item.forEach(element => {
        if(this.ListIdDoc.indexOf(element.NoteBookID) < 0) {
          this.ListIdDoc.push(element.NoteBookID);
        }
      });
    },
    error => {

    },
    () => {
      this.isFrist = true;
      this.getAllListRequest();
    });
  }

  resetForm() {
    this.numberTo = null;
    this.numberOfSymbol = null;
    this.docType = null;
    this.bookType = null;
    this.promulgatedFrom = moment().subtract(30,'day').toDate();
    this.promulgatedTo = new Date();
    this.dateTo = new Date();
    this.dateFrom = moment().subtract(30,'day').toDate();
    this.singer = null;
    this.source = null;
    this.urgentLevel = null;
    this.secretLevel = null;
    this.statusDoc = null;
    this.userApprover.setValue('');
    this.compendium = null;
    this.isAttachment = false;
    this.Search();
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
       // this.getAllListProcess();
       this.Search();
      }
      );
  }

  getDocType() {
    this.services.getList('ListDocType').subscribe((itemValue: any[]) => {
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

  getListStatus() {
    this.services.getList('ListStatusSearch').subscribe((itemValue: any[]) => {
      let item = itemValue['value'] as Array<any>;
      item.forEach(element => {
        this.ListStatus.push({
          id: element.ID,
          title: element.Title,
          code: element.Code
        });
      });
      this.statusDoc = 'All';
    });
  }

  getSecretLevel() {
    this.services.getList('ListSecret').subscribe((itemValue: any[]) => {
      let item = itemValue['value'] as Array<any>;
      item.forEach(element => {
        this.ListSecret.push({
          id: element.ID,
          title: element.Title,
          code: ''
        });
      });
    });
  }

  getUrgentLevel() {
    this.services.getList('ListUrgent').subscribe((itemValue: any[]) => {
      let item = itemValue['value'] as Array<any>;
      item.forEach(element => {
        this.ListUrgent.push({
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
    if(this.overlayRef !== undefined){
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
