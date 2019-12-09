import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  ViewRef,
  ViewContainerRef
} from '@angular/core';
import { Observable, from } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material';
import { FormControl } from '@angular/forms';
import * as moment from 'moment';
import { PlatformLocation } from '@angular/common';
import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { DocumentGoPanel } from './document-go.component';
import { DocumentComponent } from '../document-go/document.component';
import { ComponentPortal } from '@angular/cdk/portal';
import { ResApiService } from '../../services/res-api.service';
import {
  ROUTE_ANIMATIONS_ELEMENTS,
  NotificationService
} from '../../../../core/core.module';
import { SharedService } from '../../../../shared/shared-service/shared.service';
import { DocumentGoService } from './document-go.service';
import {
  ItemDocumentGo,
  ListDocType,
  ItemSeleted,
  ItemSeletedCode,
  ItemUser
} from './../models/document-go';
 // MatdataTable
 export interface ArrayHistoryObject {
  pageIndex: Number;
  data: ItemDocumentGo[];
}

@Component({
  selector: 'anms-document-go-waiting',
  templateUrl: './document-go-waiting.component.html',
  styleUrls: ['./document-go-waiting.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentGoWaitingComponent implements OnInit {
  constructor(
    public viewContainerRef: ViewContainerRef,
    public overlay: Overlay,
    private notificationService: NotificationService,
    private docServices: DocumentGoService,
    private shareService: SharedService,
    private resServices: ResApiService,
    private route: ActivatedRoute,
    private ref: ChangeDetectorRef,
    private routes: Router,
    private location: PlatformLocation,
    private documentGo: DocumentComponent
  ) {
    this.location.onPopState(() => {
      console.log('Init: pressed back!');
      window.location.reload();
      return;
    });
  }

  displayedColumns: string[] = [
    'DocumentID',
    'DocTypeName',
    'DateCreated',
    'UserCreateName',
    'UserOfHandle',
    'TaskTypeName',
    'Note',
    'Deadline',
    'Compendium',
    'flag'
  ];
  dataSource = new MatTableDataSource<ItemDocumentGo>();
  // selection = new SelectionModel<PeriodicElement>(true, []);
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
  searchText = '';
  date = new FormControl(new Date());
  addNew = false;
  showList = true;
  ListDocumentGo= [];
  id = null;
  strFilter = '';
  strFilterUser = '';
  userApproverId = '';
  userApproverEmail = '';
  currentUserId;
  currentUserName = '';
  currentUserEmail = '';
  overlayRef;
 
  pageLimit:number[] = [5, 10, 20] ;
  nextLink = '';
  previousLink = '';
  @ViewChild(MatSort, { static: false }) sort: MatSort;
  pageSizeOptions = [10, 20, 50, 100]; pageSize = 10; lengthData = 0;
  pageIndex = 0; sortActive = "DateCreated"; sortDirection = "desc";
  urlNextPage = ""; indexPage = 0;
  ArrayHistory: ArrayHistoryObject[] = []
  ngOnInit() {
    // lấy tham số truyền vào qua url
    this.route.paramMap.subscribe(parames => {
      this.id = this.docServices.CheckNullSetZero(parames.get('id'));
      //Load ds văn bản
      // this.getListDocumentGo_Wait();
    });
    this.getCurrentUser();
    //this.documentGo.isAuthenticated$ = false;
  }

  nextPage(event) {
    console.log(event);
    console.log("page index: " + this.pageIndex);
    if(this.pageIndex < event.pageIndex) {
      console.log("Next page");
      this.pageIndex = event.pageIndex;
      this.shareService
      .getItemList2(this.nextLink)
      .subscribe(
        itemValue => {
          if(this.docServices.checkNull(itemValue['odata.nextLink']) !== '') {
            this.nextLink = itemValue['odata.nextLink'];
          }
          this.previousLink = itemValue['odata.metadata'];
          let item = itemValue['value'] as Array<any>;
        });
    } else if(this.pageIndex > event.pageIndex) {
      console.log("Previous page");
    } else {
      console.log("No change");
    }
  }

  isNotNull(str) {
    return str !== null && str !== '' && str !== undefined;
  }

  CheckNull(str) {
    if (!this.isNotNull(str)) {
      return '';
    } else {
      return str;
    }
  }
  // format định dạng ngày
  formatDateTime(date: Date): string {
    if (!date) {
      return '';
    }
    return moment(date).format('DD/MM/YYYY');
    //return moment(date).format('DD/MM/YYYY hh:mm A');
  }

  ClickItem(row) {
    console.log(row);
    this.routes.navigate([row.link]);
  }

  //Lấy người dùng hiện tại
  getCurrentUser() {
    this.shareService.getCurrentUser().subscribe(
      itemValue => {
        this.currentUserId = itemValue['Id'];
        this.currentUserName = itemValue['Title'];
        this.currentUserEmail = itemValue['Email'];
        console.log('currentUserEmail: ' + this.currentUserEmail);
      },
      error => {
        console.log('error: ' + error);
        this.closeCommentPanel;
      },
      () => {
        console.log(
          'Current user email is: \n' +
            'Current user Id is: ' +
            this.currentUserId +
            '\n' +
            'Current user name is: ' +
            this.currentUserName
        );
        this.resServices.getDepartmnetOfUser(this.currentUserId).subscribe(
          itemValue => {
            let itemUserMember = itemValue['value'] as Array<any>;
            if (itemUserMember.length > 0) {
              itemUserMember.forEach(element => {
                if (
                  element.RoleCode === 'TP' ||
                  element.RoleCode === 'GĐ' ||
                  element.RoleCode === 'NV'
                ) {
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
          () => {}
        );
       // this.getListDocumentGo_Wait();
       this.Search();
      }
    );
  }
  Search() {
    this.ListDocumentGo = [];
    this.ArrayHistory = [];
    this.paginator.pageIndex = 0;

    let filterCount='' ;
    let strFilter1 ='';

      let strSelect = '';
    // {-1:Thu hồi, 1:chờ xử lý, 2:Đang xử lý, 3:Đã xử lý, 4:Chờ xin ý kiến, 5:Đã cho ý kiến}
    //chờ xử lý
    if (this.id === 1) {
      strSelect = `'and TypeCode ne 'XYK' and StatusID eq '0'`;
      strFilter1 = `&$filter=UserApprover/Id eq '` + this.currentUserId + strSelect;
     filterCount=`?$filter=UserApprover/Id eq ` + this.currentUserId +`and TypeCode ne 'XYK' and StatusID eq 0`;
    }
    //Đang xử lý
  //  else if (this.id === 2) {
    //   strSelect = `') and TypeCode ne 'XYK' and IsFinished ne '1'`;
    //   strFilter1 = `&$filter=(UserRequest/Id eq '` + this.currentUserId + `' or UserApprover/Id eq '` + this.currentUserId + strSelect;
    // }
   
     //Thu hồi
     else if(this.id === -1) {
      strSelect = `') and TypeCode ne 'XYK' and StatusID eq '-1'`;
      strFilter1 = `&$filter=(UserRequest/Id eq '` + this.currentUserId + `' or UserApprover/Id eq '` + this.currentUserId + strSelect;
      filterCount=`?$filter=(UserRequest/Id eq ` + this.currentUserId + ` or UserApprover/Id eq ` + this.currentUserId +`) and TypeCode ne 'XYK' and StatusID eq -1`;
    }
    //Chờ xin ý kiến
    else if (this.id === 4) {
   strSelect = `' and TypeCode eq 'XYK' and StatusID eq '0'`;
   strFilter1 = `&$filter=UserApprover/Id eq '` + this.currentUserId + strSelect;
   filterCount=`?$filter=UserApprover/Id eq ` + this.currentUserId +`and TypeCode eq 'XYK' and StatusID eq 0`;
    }
    //Đã cho ý kiến
    else if (this.id === 5) {
     strSelect = `' and TypeCode eq 'XYK' and StatusID eq '1'`;
     strFilter1 = `&$filter=UserApprover/Id eq '` + this.currentUserId + strSelect;
     filterCount=`?$filter=UserApprover/Id eq ` + this.currentUserId +`and TypeCode eq 'XYK' and StatusID eq 1`;
    }
   
    
    // if (this.startDate != null) {
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
   
    console.log(' filterCount='+filterCount);
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
      this.openCommentPanel();
      this.Search();
    }
    else {
      if ($event.pageIndex > this.indexPage) {
        let next = this.ArrayHistory.findIndex(x => x.pageIndex === $event.pageIndex);
        if (next !== -1) {
          this.dataSource = new MatTableDataSource<ItemDocumentGo>(this.ArrayHistory[next].data);
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
          this.dataSource = new MatTableDataSource<ItemDocumentGo>(this.ArrayHistory[next].data);
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
    this.ListDocumentGo = [];
    this.shareService.getItemList("ListProcessRequestGo", filter).subscribe(
      itemValue => {
        // console.log("itemValue");
        // console.log(itemValue);
        let itemList = itemValue["value"] as Array<any>;
        itemList.forEach(element => {
          this.ListDocumentGo.push({
            ID: element.ID,
            DocumentID: element.DocumentGoID,
            NumberGo: this.docServices.formatNumberGo(element.NumberGo),
            DocTypeName: this.CheckNull(element.DocTypeName),
            NumberSymbol: this.CheckNull(element.Title),
            Compendium: this.CheckNull(element.Compendium),
            AuthorId:
              element.Author == undefined ? '' : element.Author.Id,               
            UserCreateName:
              element.Author == undefined ? '' : element.Author.Title,
            DateCreated: this.formatDateTime(element.DateCreated),
            UserApproverId:
            element.UserApprover == undefined ? '' : element.UserApprover.Id,
            UserOfHandleName:
              element.UserApprover == undefined
                ? ''
                : element.UserApprover.Title,
            UserOfKnowName:
              element.UserOfKnow == undefined
                ? ''
                : element.UserOfKnow.Title,
            UserOfCombinateName:
              element.UserOfCombinate == undefined
                ? ''
                : element.UserOfCombinate.Title,
            Deadline: this.formatDateTime(element.Deadline),
            StatusName: this.CheckNull(element.StatusName),
            BookTypeName: '',
            UnitCreateName: '',
            RecipientsInName: '',
            RecipientsOutName: '',
            SecretLevelName: '',
            UrgentLevelName: '',
            UrgentCode:  this.CheckNull(element.UrgentCode),
            SecretCode:  this.CheckNull(element.SecretCode),
            TotalStep: 0,
            MethodSendName: '',
            DateIssued: '',
            SignerName: '',
            Note: this.CheckNull(element.Content),
            NumOfPaper: '',
            link: this.getLinkItemByRole(
              this.id,
              element.DocumentGoID,
              element.IndexStep
            ),
            TypeCode: element.TaskTypeCode,
            StatusID: element.StatusID,
            TaskTypeName:element.TaskTypeName,
            flag:((this.CheckNull(element.UrgentCode)!='' && this.CheckNull(element.UrgentCode)!='BT')|| (this.CheckNull(element.SecretCode)!='' && this.CheckNull(element.SecretCode)!='BT'))?'flag':''
          });
        })
        this.urlNextPage = itemValue["odata.nextLink"];
      },
      error => {
        console.log(error);
        this.closeCommentPanel();
      },
      () => {
        this.dataSource = new MatTableDataSource<ItemDocumentGo>(this.ListDocumentGo);
        this.ArrayHistory.push({
          pageIndex: this.paginator.pageIndex,
          data: this.ListDocumentGo
        });
        if (!(this.ref as ViewRef).destroyed) {
          this.ref.detectChanges();
        }
        if (this.overlayRef !== undefined) {
          this.closeCommentPanel();
        }
      })
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
  //lấy ds phiếu xử lý
  getListDocumentGo_Wait() {
    let strSelect = '';
    // {-1:Thu hồi, 1:chờ xử lý, 2:Đang xử lý, 3:Đã xử lý, 4:Chờ xin ý kiến, 5:Đã cho ý kiến}
    //chờ xử lý
    if (this.id === 1) {
      strSelect = `'and TypeCode ne 'XYK' and StatusID eq '0'`;
      this.strFilter = `&$filter=UserApprover/Id eq '` + this.currentUserId + strSelect;
    }
    //Đang xử lý
    else if (this.id === 2) {
   //   strSelect = ` and (TypeCode eq 'CXL' or TypeCode eq 'TL') and StatusID eq '1'`;
      strSelect = `') and TypeCode ne 'XYK' and IsFinished ne '1'`;
      this.strFilter = `&$filter=(UserRequest/Id eq '` + this.currentUserId + `' or UserApprover/Id eq '` + this.currentUserId + strSelect;
    }
    //Đã xử lý
    else if (this.id === 3) {
     // strSelect = ` and (TypeCode eq 'CXL' or TypeCode eq 'TL') and IsFinished eq '1'`;
      strSelect = `') and TypeCode ne 'XYK' and IsFinished eq '1' and StatusID ne '-1'`;
      this.strFilter = `&$filter=(UserRequest/Id eq '` + this.currentUserId + `' or UserApprover/Id eq '` + this.currentUserId + strSelect;
    }
     //Thu hồi
     else if(this.id === -1) {
      strSelect = `') and TypeCode ne 'XYK' and StatusID eq '-1'`;
      this.strFilter = `&$filter=(UserRequest/Id eq '` + this.currentUserId + `' or UserApprover/Id eq '` + this.currentUserId + strSelect;
    }
    //Chờ xin ý kiến
    else if (this.id === 4) {
   strSelect = `' and TypeCode eq 'XYK' and StatusID eq '0'`;
   this.strFilter = `&$filter=UserApprover/Id eq '` + this.currentUserId + strSelect;
    }
    //Đã cho ý kiến
    else if (this.id === 5) {
     strSelect = `' and TypeCode eq 'XYK' and StatusID eq '1'`;
     this.strFilter = `&$filter=UserApprover/Id eq '` + this.currentUserId + strSelect;
    }
    this.openCommentPanel();
    let strFilter1 =
      `?$select=*,Author/Id,Author/Title,UserApprover/Id,UserApprover/Title&$expand=Author,UserApprover` + this.strFilter+`&$orderby=Created desc&$top=12`;
    console.log('strSelect=' + strFilter1);
    try {
      this.ListDocumentGo = [];
      this.shareService
        .getItemList('ListProcessRequestGo', strFilter1)
        .subscribe(
          itemValue => {
            if(this.docServices.checkNull(itemValue['odata.nextLink']) !== '') {
             this.nextLink = itemValue['odata.nextLink'];
            }
            this.previousLink = itemValue['odata.metadata'];
            let item = itemValue['value'] as Array<any>;
            item.forEach(element => {
              if (this.ListDocumentGo.findIndex(e => e.DocumentID === element.DocumentGoID ) < 0 ) {
                this.ListDocumentGo.push({
                  ID: element.ID,
                  DocumentID: element.DocumentGoID,
                  NumberGo: this.docServices.formatNumberGo(element.NumberGo),
                  DocTypeName: this.CheckNull(element.DocTypeName),
                  NumberSymbol: this.CheckNull(element.Title),
                  Compendium: this.CheckNull(element.Compendium),
                  AuthorId:
                    element.Author == undefined ? '' : element.Author.Id,               
                  UserCreateName:
                    element.Author == undefined ? '' : element.Author.Title,
                  DateCreated: this.formatDateTime(element.DateCreated),
                  UserApproverId:
                  element.UserApprover == undefined ? '' : element.UserApprover.Id,
                  UserOfHandleName:
                    element.UserApprover == undefined
                      ? ''
                      : element.UserApprover.Title,
                  UserOfKnowName:
                    element.UserOfKnow == undefined
                      ? ''
                      : element.UserOfKnow.Title,
                  UserOfCombinateName:
                    element.UserOfCombinate == undefined
                      ? ''
                      : element.UserOfCombinate.Title,
                  Deadline: this.formatDateTime(element.Deadline),
                  StatusName: this.CheckNull(element.StatusName),
                  BookTypeName: '',
                  UnitCreateName: '',
                  RecipientsInName: '',
                  RecipientsOutName: '',
                  SecretLevelName: '',
                  UrgentLevelName: '',
                  UrgentCode:  this.CheckNull(element.UrgentCode),
                  SecretCode:  this.CheckNull(element.SecretCode),
                  TotalStep: 0,
                  MethodSendName: '',
                  DateIssued: '',
                  SignerName: '',
                  Note: '',
                  NumOfPaper: '',
                  link: this.getLinkItemByRole(
                    this.id,
                    element.DocumentGoID,
                    element.IndexStep
                  ),
                  TypeCode: element.TaskTypeCode,
                  StatusID: element.StatusID,
                  TaskTypeName:element.TaskTypeName,
                  flag:((this.CheckNull(element.UrgentCode)!='' && this.CheckNull(element.UrgentCode)!='BT')|| (this.CheckNull(element.SecretCode)!='' && this.CheckNull(element.SecretCode)!='BT'))?'flag':''
                });
              } else if (element.IsFinished === 1) {
                let index = this.ListDocumentGo.findIndex(
                  e => e.ID === element.DocumentGoID
                );
                if (index >= 0) {
                  this.ListDocumentGo.splice(index, 1);
                }
              }
            });
            if(this.id === 2) {
              let listItem1 = []; // list chờ xử lý
              let listItem2 = []; // list đang xử lý
              let listItem3 = [];   // list thu hồi
              listItem1 = this.ListDocumentGo.filter(i => i.StatusID === 0 && i.UserApproverId === this.currentUserId);
              listItem3 =  this.ListDocumentGo.filter(i => i.StatusID === -1 && i.UserApproverId === this.currentUserId);
              this.ListDocumentGo.forEach(element => {
                if(listItem1.findIndex(e => e.DocumentID === element.DocumentID) < 0 && 
                  listItem3.findIndex(e => e.DocumentID === element.DocumentID) < 0 &&
                  listItem2.findIndex(e => e.DocumentID === element.DocumentID) < 0) {
                    if(element.AuthorId === this.currentUserId && element.TypeCode === "XLC"
                      || (element.UserApproverId === this.currentUserId && (element.TypeCode === "PH" || element.TypeCode === "NĐB"))) {
                      listItem2.push(element);
                    }
                }
              })
              this.dataSource = new MatTableDataSource<ItemDocumentGo>(listItem2);
            } else {
              let listItem1 = [];
              this.ListDocumentGo.forEach(element => {
                if(listItem1.findIndex(e => e.ID === element.ID) < 0) {
                  listItem1.push(element);
                }
              })
              this.dataSource = new MatTableDataSource<ItemDocumentGo>(listItem1);
            }
            if (!(this.ref as ViewRef).destroyed) {
              this.ref.detectChanges();
            }
            this.dataSource.paginator = this.paginator;
          },
          error => {
            console.log(error);
            this.closeCommentPanel();
          },
          () => {
            this.closeCommentPanel();
          }
        );
    } catch (error) {
      console.log(error);
    }
  }

  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  getLinkItemByRole(type, id, step) {
    let link = '';
    if (this.docServices.CheckNullSetZero(type) === 1) {
      link = '/Documents/documentgo-detail/' + id + '/' + step;
    } else if (
      this.docServices.CheckNullSetZero(type) === 4 ||
      this.docServices.CheckNullSetZero(type) === 5
    ) {
      link = '/Documents/documentgo-detail/' + id + '/-1';
    } else {
      link = '/Documents/documentgo-detail/' + id;
    }
    return link;
  }

  openCommentPanel() {
    let config = new OverlayConfig();
    config.positionStrategy = this.overlay
      .position()
      .global()
      .centerVertically()
      .centerHorizontally();
    config.hasBackdrop = true;
    this.overlayRef = this.overlay.create(config);
    this.overlayRef.attach(
      new ComponentPortal(DocumentGoPanel, this.viewContainerRef)
    );
  }

  closeCommentPanel() {
    if (this.overlayRef !== undefined) {
      this.overlayRef.dispose();
    }
  }
}
