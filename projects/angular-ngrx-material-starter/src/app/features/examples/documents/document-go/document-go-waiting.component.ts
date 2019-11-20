import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ViewRef, ViewContainerRef } from '@angular/core';
import { Observable, from } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material';
import { FormControl } from '@angular/forms';
import * as moment from 'moment';
import {PlatformLocation} from '@angular/common';
import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { DocumentGoPanel } from './document-go.component';
import {DocumentComponent} from '../document-go/document.component';
import { ComponentPortal } from '@angular/cdk/portal';
import { ResApiService } from '../../services/res-api.service';
import {
  ROUTE_ANIMATIONS_ELEMENTS,
  NotificationService
} from '../../../../core/core.module';
import { SharedService } from '../../../../shared/shared-service/shared.service'
import { DocumentGoService } from './document-go.service';
import { ItemDocumentGo, ListDocType, ItemSeleted, ItemSeletedCode, ItemUser } from './../models/document-go';

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

  displayedColumns: string[] = ['ID', 'DocTypeName',  'DateCreated', 'UserCreateName', 'UserOfHandle', 'Deadline', 'Compendium'];
  dataSource = new MatTableDataSource<ItemDocumentGo>();
  // selection = new SelectionModel<PeriodicElement>(true, []);
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  searchText = '';
  date = new FormControl(new Date());
  addNew = false;
  showList = true;
  ListDocumentGo: ItemDocumentGo[] = [];
  id = null;
  strFilter = '';
  strFilterUser = '';
  userApproverId = '';
  userApproverEmail = '';
  currentUserId = '';
  currentUserName = '';
  currentUserEmail='';
  overlayRef;

  ngOnInit() {

   // lấy tham số truyền vào qua url
    this.route.paramMap.subscribe(parames => {
      this.id = parames.get('id');
      //Load ds văn bản
     // this.getListDocumentGo_Wait();
    });
    this.getCurrentUser();
    this.documentGo.isAuthenticated$ = false;
  }

  isNotNull(str) {
    return (str !== null && str !== "" && str !== undefined);
  }

  CheckNull(str) {
    if (!this.isNotNull(str)) {
      return "";
    }
    else {
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
        this.currentUserId = itemValue["Id"];
        this.currentUserName = itemValue["Title"];
        this.currentUserEmail = itemValue["Email"];
        console.log("currentUserEmail: " + this.currentUserEmail);
      },
      error => {
        console.log("error: " + error);
        this.closeCommentPanel
      },
      () => {
        console.log("Current user email is: \n" + "Current user Id is: " + this.currentUserId + "\n" + "Current user name is: " + this.currentUserName);
        this.resServices.getDepartmnetOfUser(this.currentUserId).subscribe(
          itemValue => {
            let itemUserMember = itemValue['value'] as Array<any>;
            if (itemUserMember.length > 0) {
              itemUserMember.forEach(element => {
                if (element.RoleCode === 'TP' || element.RoleCode === 'GĐ' || element.RoleCode === 'NV') {
                  this.documentGo.isAuthenticated$ = true;
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
        this.getListDocumentGo_Wait();
      }
    );
  }
  //lấy ds phiếu xử lý
  getListDocumentGo_Wait() {
    let idStatus;
    let TypeCode='';
    let strSelect = '';
    // {-1:Thu hồi, 1:chờ xử lý, 2:Đang xử lý, 3:Đã xử lý, 4:Chờ xin ý kiến, 5:Đã cho ý kiến}
    //chờ xử lý
    if(this.id=='1') {
      idStatus=0;
      TypeCode='CXL' ;
      strSelect = ` and (TypeCode eq 'CXL' or TypeCode eq 'TL') and StatusID eq '0'`;
    }
    //Đang xử lý
    else  if(this.id=='2') {
      idStatus=1;
      TypeCode='CXL' ;
      strSelect = ` and (TypeCode eq 'CXL' or TypeCode eq 'TL') and StatusID eq '1'`;
    }
    //Đã xử lý
    else  if(this.id=='3') {
      idStatus=1;
      TypeCode='CXL' ;
      strSelect = ` and (TypeCode eq 'CXL' or TypeCode eq 'TL') and IsFinished eq '1'`;
    }
    //Chờ xin ý kiến
    else  if(this.id=='4') {
      idStatus=0;
      TypeCode='XYK' ;
      strSelect = ` and TypeCode eq 'XYK' and StatusID eq '0'`;
    }
      //Đã cho ý kiến
    else  if(this.id=='5' ){
      idStatus=1;
      TypeCode='XYK';
      strSelect = ` and TypeCode eq 'XYK' and StatusID eq '1'`;
    }
    this.openCommentPanel();
    let strFilter = `?$select=*,Author/Id,Author/Title,UserApprover/Id,UserApprover/Title&$expand=Author,UserApprover`
     +`&$filter=UserApprover/Id eq '`+this.currentUserId+`'` + strSelect + `&$orderby=Created desc`;
     console.log('strSelect='+strSelect);
    try {
      this.ListDocumentGo = [];
      this.shareServices.getItemList('ListProcessRequestGo',strFilter).subscribe(itemValue => {
        let item = itemValue["value"] as Array<any>;
        item.forEach(element => {
          if(this.ListDocumentGo.findIndex(e => e.ID === element.DocumentGoID) < 0) {
            this.ListDocumentGo.push({
              ID: element.DocumentGoID,
              NumberGo: this.docServices.formatNumberGo(element.NumberGo),
              DocTypeName: this.CheckNull(element.DocTypeName),
              NumberSymbol:this.CheckNull(element.Title),
              Compendium: this.CheckNull(element.Compendium),
              AuthorId:  element.Author == undefined ? '' : element.Author.Id,
              UserCreateName: element.Author == undefined ? '' : element.Author.Title,
              DateCreated: this.formatDateTime(element.DateCreated),
              UserOfHandleName: element.UserApprover == undefined ? '' : element.UserApprover.Title,
              UserOfKnowName: element.UserOfKnow == undefined ? '' : element.UserOfKnow.Title,
              UserOfCombinateName: element.UserOfCombinate == undefined ? '' : element.UserOfCombinate.Title,
              Deadline: this.formatDateTime(element.Deadline),
              StatusName: this.CheckNull(element.StatusName),
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
              link: this.getLinkItemByRole(this.id, element.DocumentGoID, element.IndexStep)
            })
          }
          else if(element.IsFinished === 1) {
            let index = this.ListDocumentGo.findIndex(e => e.ID === element.DocumentGoID);
            if(index >= 0) {
              this.ListDocumentGo.splice(index, 1);
            }
          }
        })
      },
      error => { 
        console.log(error);
        this.closeCommentPanel();
      },
      () => {
        console.log("get success");
        this.dataSource = new MatTableDataSource<ItemDocumentGo>(this.ListDocumentGo);
        if (!(this.ref as ViewRef).destroyed) {
          this.ref.detectChanges();  
        } 
        this.dataSource.paginator = this.paginator;
        this.closeCommentPanel();
      });
    } catch (error) {
      console.log(error);
    }
  }
  
  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  getLinkItemByRole(type, id, step) {
    let link = '';
    if(this.docServices.CheckNullSetZero(type) === 1) {
      link = '/Documents/documentgo-detail/' + id + '/' + step;
    } 
    else if(this.docServices.CheckNullSetZero(type) === 4 || this.docServices.CheckNullSetZero(type) === 5) {
      link = '/Documents/documentgo-detail/' + id + '/-1';
    }
    else {
      link = '/Documents/documentgo-detail/' + id;
    }
    return link;
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
