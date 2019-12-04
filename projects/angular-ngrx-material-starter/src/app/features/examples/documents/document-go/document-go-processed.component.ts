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

@Component({
  selector: 'anms-document-go-processed',
  templateUrl: './document-go-processed.component.html',
  styleUrls: ['./document-go-processed.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentGoProcessedComponent implements OnInit {
  constructor(
    public viewContainerRef: ViewContainerRef,
    public overlay: Overlay,
    private notificationService: NotificationService,
    private docServices: DocumentGoService,
    private shareServices: SharedService,
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
    'ID',
    'DocTypeName',
    'DateCreated',
    'UserCreateName',
    // 'UserOfHandle',
    // 'TaskTypeName',
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
  pageIndex = 0;
  pageLimit:number[] = [5, 10, 20] ;
  nextLink = '';
  previousLink = '';

  ngOnInit() {
    // lấy tham số truyền vào qua url
    this.route.paramMap.subscribe(parames => {
      this.id = this.docServices.CheckNullSetZero(parames.get('id'));
    });
    this.getCurrentUser();
  }

  nextPage(event) {
    console.log(event);
    console.log("page index: " + this.pageIndex);
    if(this.pageIndex < event.pageIndex) {
      console.log("Next page");
      this.pageIndex = event.pageIndex;
      this.shareServices
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
    this.shareServices.getCurrentUser().subscribe(
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
        this.getListDocumentGo();
      }
    );
  }
  //lấy ds phiếu xử lý
  getListDocumentGo() {
    //  Đang xử lý
    if (this.id === 2) {
        this.strFilter = `&$filter=ListUserView/Id eq '` + this.currentUserId + `'and StatusID eq '0'`;
      }
   // Đã xử lý
    else if (this.id === 3) {
      this.strFilter = `&$filter=ListUserView/Id eq '` + this.currentUserId + `'and StatusID eq '1'`;
    }
   
    this.openCommentPanel();
    let strFilter1 =
      `?$select=*,Author/Id,Author/Title,ListUserView/Id&$expand=Author,ListUserView` + this.strFilter+`&$orderby=Created desc&$top=12`;
    console.log('strSelect=' + strFilter1);
    try {
      this.ListDocumentGo = [];
      this.shareServices
        .getItemList('ListDocumentGo', strFilter1)
        .subscribe(
          itemValue => {
            if(this.docServices.checkNull(itemValue['odata.nextLink']) !== '') {
             this.nextLink = itemValue['odata.nextLink'];
            }
            this.previousLink = itemValue['odata.metadata'];
            let item = itemValue['value'] as Array<any>;
            item.forEach(element => {
                this.ListDocumentGo.push({
                  ID: element.ID,
                  NumberGo: this.docServices.formatNumberGo(element.NumberGo),
                  DocTypeName: this.CheckNull(element.DocTypeName),
                  NumberSymbol: this.CheckNull(element.NumberSymbol),
                  Compendium: this.CheckNull(element.Compendium),
                  AuthorId:
                    element.Author == undefined ? '' : element.Author.Id,               
                  UserCreateName:
                    element.Author == undefined ? '' : element.Author.Title,
                  DateCreated: this.formatDateTime(element.DateCreated),
                  // UserApproverId:
                  // element.UserApprover == undefined ? '' : element.UserApprover.Id,
                  // UserOfHandleName:
                  //   element.UserApprover == undefined
                  //     ? ''
                  //     : element.UserApprover.Title,
                  // UserOfKnowName:
                  //   element.UserOfKnow == undefined
                  //     ? ''
                  //     : element.UserOfKnow.Title,
                  // UserOfCombinateName:
                  //   element.UserOfCombinate == undefined
                  //     ? ''
                  //     : element.UserOfCombinate.Title,
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
                    element.ID,
                    element.IndexStep
                  ),
                 // TypeCode: element.TaskTypeCode,
                  StatusID: element.StatusID,
                 // TaskTypeName:element.TaskTypeName,
                  flag:((this.CheckNull(element.UrgentCode)!='' && this.CheckNull(element.UrgentCode)!='BT')|| (this.CheckNull(element.SecretCode)!='' && this.CheckNull(element.SecretCode)!='BT'))?'flag':''
                });
              });
           
              this.dataSource = new MatTableDataSource<ItemDocumentGo>(this.ListDocumentGo);
            
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
    // if (this.docServices.CheckNullSetZero(type) === 1) {
    //   link = '/Documents/documentgo-detail/' + id + '/' + step;
    // } else if (
    //   this.docServices.CheckNullSetZero(type) === 4 ||
    //   this.docServices.CheckNullSetZero(type) === 5
    // ) {
    //   link = '/Documents/documentgo-detail/' + id + '/-1';
    // } else {
      link = '/Documents/documentgo-detail/' + id;
   // }
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
