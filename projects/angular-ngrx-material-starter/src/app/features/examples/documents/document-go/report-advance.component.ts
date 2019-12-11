import { Component, OnInit, ChangeDetectionStrategy, ViewChild, ChangeDetectorRef, ViewContainerRef, ViewRef } from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import {FormControl, FormBuilder} from '@angular/forms';
import {SelectionModel} from '@angular/cdk/collections';
import {map, startWith} from 'rxjs/operators';
import {BehaviorSubject, Observable} from 'rxjs';
import * as moment from 'moment';
import { ItemDocumentGo, ListDocType, ItemSeleted, ItemSeletedCode, ItemUser, DocumentGoTicket, AttachmentsObject, UserProfilePropertiesObject } from './../models/document-go';
import {DocumentGoPanel} from './document-go.component';
import { DocumentGoService } from './document-go.service';
import {ResApiService} from '../../services/res-api.service';
import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {PlatformLocation} from '@angular/common';
import {
  ROUTE_ANIMATIONS_ELEMENTS,
  NotificationService
} from '../../../../core/core.module';
import { any } from 'bluebird';
import { Router } from '@angular/router';
import { SharedService } from '../../../../shared/shared-service/shared.service';
export class ItemRetrieve {
  Department: string;
  UserName: string;
  TimeRetrieve: string;
  Reason: string;
}
 // MatdataTable
 export interface ArrayHistoryObject {
  pageIndex: Number;
  data: DocumentGoTicket[];
}
@Component({
  selector: 'anms-report-advance',
  templateUrl: './report-advance.component.html',
  styleUrls: ['./report-advance.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportAdvanceDGComponent implements OnInit {
  listTitle = "ListProcessRequestGo";
  inDocs$ = [];
  displayedColumns: string[] = ['numberGo', 'numberSymbol','docType' ,'DateCreated', 'userRequest', 'deadline','dateIssued','compendium', 'sts','flag']; //'select', 'userApprover', 'content'
  dataSource = new MatTableDataSource<DocumentGoTicket>();
  selection = new SelectionModel<DocumentGoTicket>(true, []);
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
  searchText = '';
  date = new FormControl(new Date());
  DocumentID = 0;
  currentUserId;
  currentUserName;
  strFilter = '';
  ListUserApprover: ItemUser[] = [];
  overlayRef;
  promulgatedFrom;
  promulgatedTo;
  dateTo = new Date();
  dateFrom = moment().subtract(30,'day').toDate();
  showList = false;
  ListIdDoc = [];
  ListDocumentID = [];
  ListUserSigner=[];
  Signer='';
  Author='';
  isFrist = false;
  ListBookType = [
    {id: -1, title: 'Không có sổ'},
    {id: 1, title: 'Văn bản đi'},
  ];
  ListDocType: ItemSeleted[] = [];
  ListSecret: ItemSeleted[] = [];
  ListUrgent: ItemSeleted[] = [];
  displayedColumns2: string[] = ['department', 'userName', 'time', 'reason'];
  dataSource2 = new MatTableDataSource<ItemRetrieve>();
  ListItem: ItemRetrieve[] = [];
  bsModalRef;
  ListStatus = [
    {id: 0, title: '--- Tất cả ---', code: 'All'},
  ];
  bookType; numberTo; docType; numberOfSymbol; singer; source; urgentLevel; secretLevel;
  statusDoc; compendium; isAttachment = false;
  userApprover = new FormControl();
  filteredOptions: Observable<ItemUser[]>;
  @ViewChild(MatSort, { static: false }) sort: MatSort;
  pageSizeOptions = [10, 20, 50, 100]; pageSize = 10; lengthData = 0;
  pageIndex = 0; sortActive = "DateCreated"; sortDirection = "desc";
  urlNextPage = ""; indexPage = 0;
  ArrayHistory: ArrayHistoryObject[] = []
  constructor(private fb: FormBuilder, private docTo: DocumentGoService, 
              private services: ResApiService, private ref: ChangeDetectorRef,
              private readonly notificationService: NotificationService,
              public overlay: Overlay, public viewContainerRef: ViewContainerRef,
              private routes: Router, private location: PlatformLocation,
              private modalService: BsModalService, private shareService: SharedService
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
    this. getUserSigner();
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
    this.strFilter = `&$filter=DocumentGoID eq '` + docId + `'` + strSelect;
    this.docTo.getListRequestTo(this.strFilter).subscribe((itemValue: any[]) => {
      let item = itemValue["value"] as Array<any>;
      this.ListItem = [];
      item.forEach(element => {
        if(element.StatusID === 0 || element.StatusID === 1) {
          this.CloseRotiniPanel();
          IsRetrieve = false;
          this.routes.navigate(['/Documents/documentgo-detail/' + docId]);
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
      //thu hồi
      if(IsRetrieve === true) {
        this.dataSource2 = new MatTableDataSource<ItemRetrieve>(this.ListItem);
        if (!(this.ref as ViewRef).destroyed) {
          this.ref.detectChanges();  
        } 
        this.dataSource2.paginator = this.paginator;
        this.bsModalRef = this.modalService.show(modalTemp, {class: 'modal-lg'});
        this.CloseRotiniPanel();
      }
      else  this.CloseRotiniPanel();
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
  
  onDisplayValue(user?: ItemUser): string | undefined {
    return user ? user.UserName : undefined;
  }

  private _filterStates(value: string): ItemUser[] {
    const filterValue = value.toLowerCase();
    return this.ListUserApprover.filter(item => item.UserName.toLowerCase().includes(filterValue));
  }

    // Load all user approval
    GetAllUser() {
      this.docTo.getAllUser().subscribe((itemValue: any[]) => {
        let item = itemValue['value'] as Array<any>;
        this.ListUserApprover = [];
        this.ListUserSigner=[];
        item.forEach(element => {
          //ds tất cả người dùng
          if(this.ListUserApprover.findIndex(i => i.UserId === element.User.Id) < 0) {
            this.ListUserApprover.push({
              UserId: element.User.Id,
              UserName: element.User.Title,
              UserEmail: element.User.Name.split('|')[2],
              Role: element.RoleName,
              Department: element.DepartmentName,
              RoleCode: element.RoleCode,
              DepartmentCode: element.DepartmentCode,
            });
          }
          //lấy ds người ký
          if(this.ListUserSigner.findIndex(i => i.UserId === element.User.Id) < 0) {
            this.ListUserSigner.push({
              UserId: element.User.Id,
              UserName: element.User.Title,
              UserEmail: element.User.Name.split('|')[2],
              Role: element.RoleName,
              Department: element.DepartmentName,
              RoleCode: element.RoleCode,
              DepartmentCode: element.DepartmentCode,
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
 
  //danh sách người ký
  getUserSigner() {
    let strFilterUser = `&$filter=RoleCode eq 'GĐ'`;
    this.docTo.getUser(strFilterUser).subscribe(items => {
      let itemUserMember = items['value'] as Array<any>;
      itemUserMember.forEach(element => {
        this.ListUserSigner.push({
          UserId: element.User.Id,
          UserName: element.User.Title,
          UserEmail: element.User.Name.split('|')[2],
          Role: element.RoleName,
          RoleCode: element.RoleCode,
          Department: element.DepartmentName,
          DepartmentCode: element.DepartmentCode
        });
      });
    });
  }
  getAllListRequest() {
    try {
      this.OpenRotiniPanel();
      let listName = '';
      this.strFilter = '';
      // if(this.statusDoc !== 'All' && this.statusDoc !== 'ĐXL' && this.statusDoc !== 'BTH' && !this.isFrist) {
      //   this.getTicketByStatus(this.statusDoc);
      //   this.CloseRotiniPanel();
      //   return;
      // }
      if(this.bookType == 1){
        this.strFilter = `&$filter=NumberGo ne null`;
      } else if(this.bookType == -1){
        this.strFilter = `&$filter=NumberGo eq null`;
      } else {
        this.strFilter = `&$filter=ID ne '0'`;
      }

      // if(this.docTo.checkNull(this.numberTo) !== '') {
      //   this.strFilter += ` and NumberTo eq '` + this.docTo.CheckNullSetZero(this.numberTo) + `'`;
      // }

      if(this.docTo.checkNull(this.numberOfSymbol) !== '') {
        this.strFilter += ` and substringof('` + this.numberOfSymbol + `',NumberSymbol)`;
      }

      if(this.docTo.CheckNullSetZero(this.docType) > 0) {
        this.strFilter += ` and DocTypeID eq '` + this.docType +`'`;
      }

      if(this.docTo.checkNull(this.promulgatedFrom) !== '') {
        this.promulgatedFrom = moment(this.promulgatedFrom).hours(0).minutes(0).seconds(0).toDate();
        this.strFilter += ` and (DateIssued ge '` + this.ISODateStringUTC(this.promulgatedFrom) + `' or DateIssued eq null)`;
      }

      if(this.docTo.checkNull(this.promulgatedTo) !== '') {
        this.promulgatedTo = moment(this.promulgatedTo).hours(23).minutes(59).seconds(59).toDate();
        this.strFilter += ` and (DateIssued le '` + this.ISODateStringUTC(this.promulgatedTo) + `' or DateIssued eq null)`
      }

      if(this.docTo.checkNull(this.dateFrom) !== '') {
        this.dateFrom = moment(this.dateFrom).hours(0).minutes(0).seconds(0).toDate();
        this.strFilter += ` and DateCreated ge '` + this.ISODateStringUTC(this.dateFrom) + `'`;
      }

      if(this.docTo.checkNull(this.dateTo) !== '') {
        this.dateTo = moment(this.dateTo).hours(23).minutes(59).seconds(59).toDate();
        this.strFilter += ` and DateCreated le '` + this.ISODateStringUTC(this.dateTo) + `'`;
      }

      if(this.docTo.checkNull(this.Signer) !== '') {
        // this.strFilter += ` and substringof('` + this.singer + `',Signer)`;
        this.strFilter += ` and SignerId eq'` + this.Signer + `'`;
      }

      if(this.docTo.checkNull(this.source) !== '') {
        this.strFilter += ` and (substringof('` + this.source + `',RecipientsInName) or substringof('` + this.source + `',RecipientsOutName))`;
      }

      // if(this.docTo.checkNull(this.statusDoc) !== '') {
      //   if(this.statusDoc === 'All') {          
      //   } 
      //   else if(this.statusDoc === 'CVS') {
      //     this.strFilter += ` and StatusID eq '-1'`;
      //   }
      //   else if(this.statusDoc === 'BTH') {
      //     this.strFilter += ` and StatusID eq '1' and StatusName eq 'Bị thu hồi'`;
      //   }
      //   else {
      //     this.strFilter += ` and StatusID eq '0'`;
      //     if(this.ListIdDoc.length > 0) {
      //       this.strFilter += ` and (`;
      //       this.ListIdDoc.forEach(item => {
      //         this.strFilter += ` ID eq '` + item + `' or`
      //       })
      //       this.strFilter = this.strFilter.substr(0, this.strFilter.length-3) + `)`;
      //     } else if(this.isFrist && this.ListIdDoc.length === 0) {
      //       this.strFilter = `&$filter=ID eq '-1'`;
      //     }
      //   }
      // }

      // if(this.docTo.CheckNullSetZero(this.secretLevel) > 0) {
      //   this.strFilter += ` and SecretLevelID eq '` + this.secretLevel +`'`;
      // }

      // if(this.docTo.CheckNullSetZero(this.urgentLevel) > 0) {
      //   this.strFilter += ` and UrgentLevelID eq '` + this.urgentLevel +`'`;
      // }

      // if(this.docTo.checkNull(this.userApprover.value) !== '') {
      //   this.strFilter += ` and substringof('` + this.userApprover.value.UserId + `_` + this.userApprover.value.UserName + `',ListUserApprover)`;
      // }

      this.docTo.getAllDocumentTo(this.strFilter).subscribe((itemValue: any[]) => {
        let item = itemValue["value"] as Array<any>;     
        this.inDocs$ = []; 
        item.forEach(element => {
          if(this.docTo.checkNull(this.compendium) !== '') { 
            if(!this.docTo.checkNull(element.Compendium).toLowerCase().includes(this.compendium.toLowerCase())) {
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
              numberGo: this.docTo.checkNull(element.NumberGo) === '' ? '' : this.docTo.formatNumberGo(element.NumberGo), 
              numberSymbol: element.NumberSymbol, 
              docType:element.DocTypeName,
              userRequest: element.Author.Title,
              userRequestId: element.Author.Id,
              userApprover: element.UserOfHandle !== undefined ? element.UserOfHandle.Title : '',
              deadline: this.docTo.checkNull(element.Deadline) === '' ? '' : moment(element.Deadline).format('DD/MM/YYYY'),
              status: this.docTo.CheckNullSetZero(element.StatusID) === 0 ? 'Đang xử lý' : 'Đã xử lý',
              compendium: this.docTo.checkNull(element.Compendium),
              note: this.docTo.checkNull(element.Note),
              dateIssued:this.docTo.checkNull(element.DateIssued)==''?'':moment(element.DateIssued).format('DD/MM/YYYY'),
              created: this.docTo.checkNull(element.DateCreated) === '' ? '' : moment(element.DateCreated).format('DD/MM/YYYY'),
              sts: this.docTo.CheckNullSetZero(element.StatusID) === 0 ? 'Ongoing' : 'Approved',
              link: '/Documents/documentgo-detail/' + element.ID,
              flag:((this.docTo.checkNull(element.UrgentCode)!='' && this.docTo.checkNull(element.UrgentCode)!='BT')|| (this.docTo.checkNull(element.SecretCode)!='' && this.docTo.checkNull(element.SecretCode)!='BT'))?'flag':''
            })
          }
        })   
        
        this.dataSource = new MatTableDataSource<DocumentGoTicket>(this.inDocs$);        
        this.dataSource.paginator = this.paginator;
        this.ref.detectChanges();
        this.isFrist = false;
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
    this.promulgatedFrom;
    this.promulgatedTo;
    this.dateTo = new Date();
    this.dateFrom = moment().subtract(30,'day').toDate();
    this.Signer = null;
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

  Search() {
    this.inDocs$ = [];
    this.ArrayHistory = [];
    this.paginator.pageIndex = 0;
    let filterCount='' ;
    let strFilter1 ='';
    if(this.bookType == 1){
      strFilter1 = `&$filter=NumberGo ne null`;
    } else if(this.bookType == -1){
      strFilter1 = `&$filter=NumberGo eq null`;
    } else {
      strFilter1 = `&$filter=ID ne '0'`;
    }
    strFilter1 += ` and ListUserView/Id eq '`+this.currentUserId+`'`;
    // if(this.docTo.checkNull(this.numberTo) !== '') {
    //   this.strFilter += ` and NumberTo eq '` + this.docTo.CheckNullSetZero(this.numberTo) + `'`;
    // }

    if(this.docTo.checkNull(this.numberOfSymbol) !== '') {
      strFilter1 += ` and substringof('` + this.numberOfSymbol + `',NumberSymbol)`;
    }

    if(this.docTo.CheckNullSetZero(this.docType) > 0) {
      strFilter1 += ` and DocTypeID eq '` + this.docType +`'`;
    }

    if(this.docTo.checkNull(this.promulgatedFrom) !== '') {
      this.promulgatedFrom = moment(this.promulgatedFrom).hours(0).minutes(0).seconds(0).toDate();
      strFilter1 += ` and (DateIssued ge '` + this.ISODateStringUTC(this.promulgatedFrom) + `' or DateIssued eq null)`;
    }

    if(this.docTo.checkNull(this.promulgatedTo) !== '') {
      this.promulgatedTo = moment(this.promulgatedTo).hours(23).minutes(59).seconds(59).toDate();
      strFilter1 += ` and (DateIssued le '` + this.ISODateStringUTC(this.promulgatedTo) + `' or DateIssued eq null)`
    }

    if(this.docTo.checkNull(this.dateFrom) !== '') {
      this.dateFrom = moment(this.dateFrom).hours(0).minutes(0).seconds(0).toDate();
      strFilter1 += ` and DateCreated ge '` + this.ISODateStringUTC(this.dateFrom) + `'`;
    }

    if(this.docTo.checkNull(this.dateTo) !== '') {
      this.dateTo = moment(this.dateTo).hours(23).minutes(59).seconds(59).toDate();
      strFilter1 += ` and DateCreated le '` + this.ISODateStringUTC(this.dateTo) + `'`;
    }

    if(this.docTo.checkNull(this.Signer) !== '') {
      // this.strFilter += ` and substringof('` + this.singer + `',Signer)`;
      strFilter1 += ` and SignerId eq'` + this.Signer + `'`;
    }
    if(this.docTo.checkNull(this.Author) !== '') {
      // this.strFilter += ` and substringof('` + this.singer + `',Signer)`;
      strFilter1 += ` and AuthorId eq'` + this.Author + `'`;
    }

    if(this.docTo.checkNull(this.source) !== '') {
      strFilter1 += ` and (substringof('` + this.source + `',RecipientsInName) or substringof('` + this.source + `',RecipientsOutName))`;
    }

    this.strFilter =
    `?$select=*,UserOfHandle/Title,UserOfHandle/Id,Author/Id,Author/Title,Signer/Id,Signer/Title,ListUserView/Id,AttachmentFiles&$expand=UserOfHandle,Author,Signer,ListUserView,AttachmentFiles&$top=`
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
          this.dataSource = new MatTableDataSource<DocumentGoTicket>(this.ArrayHistory[next].data);
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
          this.dataSource = new MatTableDataSource<DocumentGoTicket>(this.ArrayHistory[next].data);
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
    this.shareService.getItemList("ListDocumentGo", filter).subscribe(
      itemValue => {
        // console.log("itemValue");
        // console.log(itemValue);
        let itemList = itemValue["value"] as Array<any>;
        itemList.forEach(element => {
          this.inDocs$.push({
            STT: this.inDocs$.length + 1,
            ID: element.ID,
            numberGo: this.docTo.checkNull(element.NumberGo) !== '' ? this.docTo.formatNumberGo(element.NumberGo) : '',
            numberSymbol: this.docTo.checkNull(element.NumberSymbol) !== '' ? element.NumberSymbol : '', 
            docType: this.docTo.checkNull(element.DocTypeName) !== '' ? element.DocTypeName : '', 
            userRequest: element.Author.Title,
            userRequestId: element.Author.Id,
            userApprover: element.UserOfHandle !== undefined ? element.UserOfHandle.Title : '',
            deadline: this.docTo.checkNull(element.Deadline) === '' ? '' : moment(element.Deadline).format('DD/MM/YYYY'),
            status: this.docTo.CheckNullSetZero(element.StatusID) === 0 ? 'Đang xử lý' : 'Đã xử lý',
            compendium: this.docTo.checkNull(element.Compendium),
            note: this.docTo.checkNull(element.Note),
            DateCreated: this.docTo.checkNull(element.DateCreated) === '' ? '' : moment(element.DateCreated).format('DD/MM/YYYY'),
            dateIssued:this.docTo.checkNull(element.DateIssued)==''?'':moment(element.DateIssued).format('DD/MM/YYYY'),
            sts: this.docTo.CheckNullSetZero(element.StatusID) === 0 ? 'Ongoing' : 'Approved',
            link: '/Documents/documentgo-detail/' + element.ID,
            flag:((this.docTo.checkNull(element.UrgentCode)!='' && this.docTo.checkNull(element.UrgentCode)!='BT')|| (this.docTo.checkNull(element.SecretCode)!='' && this.docTo.checkNull(element.SecretCode)!='BT'))?'flag':''
          })
        })
        this.urlNextPage = itemValue["odata.nextLink"];
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
        this.dataSource = new MatTableDataSource<DocumentGoTicket>(this.inDocs$);
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
  getDocType() {
    this.services.getList('ListDocType').subscribe((itemValue: any[]) => {
      let item = itemValue['value'] as Array<any>;
      item.forEach(element => {
        this.ListDocType.push({
          ID: element.ID,
          Title: element.Title,
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
          ID: element.ID,
          Title: element.Title,
        });
      });
    });
  }

  getUrgentLevel() {
    this.services.getList('ListUrgent').subscribe((itemValue: any[]) => {
      let item = itemValue['value'] as Array<any>;
      item.forEach(element => {
        this.ListUrgent.push({
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
        if(this.ListDocumentID.indexOf(element.DocumentGoID) < 0) {
          this.ListDocumentID.push(element.DocumentGoID);
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
