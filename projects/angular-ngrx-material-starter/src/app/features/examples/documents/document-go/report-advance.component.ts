import { Component, OnInit, ChangeDetectionStrategy, ViewChild, ChangeDetectorRef, ViewContainerRef, Injectable } from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatTableDataSource} from '@angular/material';
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
import {
  ROUTE_ANIMATIONS_ELEMENTS,
  NotificationService
} from '../../../../core/core.module';
import { any } from 'bluebird';

@Component({
  selector: 'anms-report-advance',
  templateUrl: './report-advance.component.html',
  styleUrls: ['./report-advance.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportAdvanceDGComponent implements OnInit {
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
  ListUserApprover: ItemUser[] = [];
  overlayRef;
  promulgatedFrom;
  promulgatedTo;
  dateTo = new Date();
  dateFrom = moment().subtract(30,'day').toDate();
  showList = false;
  ListIdDoc = [];
  isFrist = false;
  ListBookType = [
    {id: -1, title: 'Không có sổ'},
    {id: 1, title: 'Văn bản đi'},
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
  filteredOptions: Observable<ItemUser[]>;

  constructor(private fb: FormBuilder, private docTo: DocumentGoService, 
              private services: ResApiService, private ref: ChangeDetectorRef,
              private readonly notificationService: NotificationService,
              public overlay: Overlay, public viewContainerRef: ViewContainerRef) { }

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
    this.getAllListRequest();
    this.getCurrentUser();
  }

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

      if(this.docTo.checkNull(this.singer) !== '') {
        // this.strFilter += ` and substringof('` + this.singer + `',Signer)`;
        this.strFilter += ` and substringof('` + this.singer + `',Signer)`;
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
          this.inDocs$.push({
            STT: this.inDocs$.length + 1,
            ID: element.ID,
            numberTo: this.docTo.checkNull(element.NumberGo) === '' ? '' : this.docTo.formatNumberGo(element.NumberGo), 
            numberSymbol: element.NumberSymbol, 
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
    this.singer = null;
    this.source = null;
    this.urgentLevel = null;
    this.secretLevel = null;
    this.statusDoc = null;
    this.userApprover.setValue('');
    this.compendium = null;
    this.isAttachment = false;
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

}
