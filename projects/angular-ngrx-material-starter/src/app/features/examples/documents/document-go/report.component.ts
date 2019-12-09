import { Component, OnInit, ChangeDetectionStrategy, ViewChild, ChangeDetectorRef, ViewContainerRef, Injectable , ViewRef} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
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
import {PlatformLocation} from '@angular/common';
import {
  ROUTE_ANIMATIONS_ELEMENTS,
  NotificationService
} from '../../../../core/core.module';
import { SharedService } from '../../../../shared/shared-service/shared.service';
 // MatdataTable
 export interface ArrayHistoryObject {
  pageIndex: Number;
  data: DocumentGoTicket[];
}
@Component({
  selector: 'anms-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportDGComponent implements OnInit {
  listTitle = "ListProcessRequestTo";
  inDocs$ = [];
  displayedColumns: string[] = ['numberGo', 'numberSymbol','docType' ,'DateCreated', 'userRequest', 'deadline','dateIssued','compendium', 'sts','flag']; //'select', 'userApprover','content',
  dataSource = new MatTableDataSource<DocumentGoTicket>();
  selection = new SelectionModel<DocumentGoTicket>(true, []);
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
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
  ListDocumentID = [];
  @ViewChild(MatSort, { static: false }) sort: MatSort;
  pageSizeOptions = [10, 20, 50, 100]; pageSize = 10; lengthData = 0;
  pageIndex = 0; sortActive = "DateCreated"; sortDirection = "desc";
  urlNextPage = ""; indexPage = 0;
  ArrayHistory: ArrayHistoryObject[] = []
  constructor(private fb: FormBuilder, private docTo: DocumentGoService, 
              private services: ResApiService, private ref: ChangeDetectorRef,
              private readonly notificationService: NotificationService,
              public overlay: Overlay, public viewContainerRef: ViewContainerRef,
              private location: PlatformLocation,
              private shareService: SharedService
    ) {
      this.location.onPopState(() => {
        console.log('Init: pressed back!');
        window.location.reload(); 
        return;
      });
    }

  ngOnInit() {
    this.getDocType();
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

    let filterCount='' ;
    let strFilter1 ='';

    strFilter1 = `&$filter=StatusID ne '-1' and ListUserView/Id eq '`+this.currentUserId+`'`;
    //filterCount=`?$filter=StatusID ne -1`;
    if(this.docTo.CheckNullSetZero(this.docType) > 0) {
      strFilter1 += ` and DocTypeID eq '` + this.docType +`'`;
    //  filterCount+=` and DocTypeID eq `+ this.docType;
    }

    if(this.docTo.checkNull(this.dateIssuedFrom) !== '') {
      this.dateIssuedFrom = moment(this.dateIssuedFrom).hours(0).minutes(0).seconds(0).toDate();
      strFilter1 += ` and (DateIssued ge '` + this.ISODateStringUTC(this.dateIssuedFrom) + `' or DateIssued eq null)`;
    //  filterCount+=` and DateIssued ge datetime'` + this.ISODateStringUTC(this.dateIssuedFrom) + `' or DateIssued eq null`;
    }

    if(this.docTo.checkNull(this.dateIssuedTo) !== '') {
      this.dateIssuedTo = moment(this.dateIssuedTo).hours(23).minutes(59).seconds(59).toDate();
      strFilter1 += ` and (DateIssued le '` + this.ISODateStringUTC(this.dateIssuedTo) + `' or DateIssued eq null)`;
    //  filterCount+=` and DateIssued le datetime'` + this.ISODateStringUTC(this.dateIssuedTo) + `' or DateIssued eq null`;
    }


    // if (this.s != null) {
    //   this.strFilter += ` and DateRequest ge '` + this.ISODateString(this.startDate) + `'`;
    //   filterCount += ` and DateRequest ge datetime'` + this.ISODateString(this.startDate) + `'`
    // }
    // if (this.endDate != null) {
    //   this.strFilter += ` and DateRequest le '` + this.ISODateString(this.endDate) + `'`;
    //   filterCount += ` and DateRequest le datetime'` + this.ISODateString(this.endDate) + `'`;
    // }
    // if (this.TitleRequest != null && this.TitleRequest != '') {
    //   this.strFilter += ` and substringof('` + this.TitleRequest + `', Title) `;
    //   filterCount += ` and substringof('` + this.TitleRequest + `', Title) `;
    // }

    // if (this.selectedType != null && this.selectedType != '') {
    //   this.strFilter += ` and ListName eq '` + this.selectedType + `'`;
    //   filterCount += ` and ListName eq '` + this.selectedType + `'`;
    // }
    // if (this.selectedStatus != null && this.selectedStatus != '') {
    //   this.strFilter += ` and IsFinnish eq '` + this.selectedStatus + `'`;
    //   filterCount += ` and IsFinnish eq ` + this.selectedStatus;
    // }
   
  //  console.log(' filterCount='+filterCount);
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
          if(this.ListDocumentID.indexOf(element.ID) >= 0) {
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
              created: this.docTo.checkNull(element.DateCreated) === '' ? '' : moment(element.DateCreated).format('DD/MM/YYYY'),
              dateIssued:this.docTo.checkNull(element.DateIssued)==''?'':moment(element.DateIssued).format('DD/MM/YYYY'),
              sts: this.docTo.CheckNullSetZero(element.StatusID) === 0 ? 'Ongoing' : 'Approved',
              link: '/Documents/documentgo-detail/' + element.ID
            })
          }
        })   
        
        this.dataSource = new MatTableDataSource<DocumentGoTicket>(this.inDocs$);        
        this.dataSource.paginator = this.paginator;
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
