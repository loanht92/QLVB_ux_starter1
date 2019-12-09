import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  ViewContainerRef,
  TemplateRef,
  Input,
  ViewRef
} from '@angular/core';
//import { IncomingDoc, AttachmentsObject, IncomingDocService, IncomingTicket} from '../incoming-doc.service';
import { environment } from '../../../../../environments/environment';
import { ActivatedRoute, Router, RoutesRecognized } from '@angular/router';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material';
import * as moment from 'moment';
import { PlatformLocation } from '@angular/common';
import {
  ROUTE_ANIMATIONS_ELEMENTS,
  NotificationService
} from '../../../../core/core.module';
import { State } from '../../../examples/examples.state';
import {
  actionFormReset,
  actionFormUpdate
} from '../../../examples/form/form.actions';
import { selectFormState } from '../../../examples/form/form.selectors';
import { SelectionModel } from '@angular/cdk/collections';
import { ResApiService } from '../../services/res-api.service';
import { DocumentGoService } from './document-go.service';
import { DocumentGoPanel } from './document-go.component';
import { DocumentComponent } from '../document-go/document.component';
import { SharedService } from '../../../../shared/shared-service/shared.service';
import {
  ItemDocumentGo,
  DocumentGoTicket,
  AttachmentsObject,
  UserProfilePropertiesObject
} from './../models/document-go';
import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { CommentComponent } from './comment.component';
import { Observable, of as observableOf, from } from 'rxjs';

export interface Comment {
  UserId: Number;
  Content: string;
  AttachFile: FileAttachment[];
}
export interface FileAttachment {
  name?: string;
  urlFile?: string;
}

export class UserOfDepartment {
  STT: Number;
  IsDepartment: boolean;
  Code: string;
  Name: string;
  Role: string;
  IsHandle: boolean;
  IsCombine: boolean;
  IsKnow: boolean;
  Icon: string;
  Class: string;
  isPerson: any;
}

export class UserChoice {
  Id: Number;
  Email: string;
  DisplayName: string;
  DeCode: string;
  DeName: string;
  RoleCode: string;
  RoleName: string;
}

export class UserRetieve {
  Id: number;
  stt: number;
  Department: string;
  Name: string;
  Role: string;
  TaskType: string;
  TaskTypeCode: string;
  UserId: number;
  Email: string;
}


@Component({
  selector: 'anms-document-go-detail',
  templateUrl: './document-go-detail.component.html',
  styleUrls: ['./document-go-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
  // providers: [ChecklistDatabase]
})
export class DocumentGoDetailComponent implements OnInit {
  @Input() comments: Comment[];
  bsModalRef: BsModalRef;
  itemDoc: ItemDocumentGo;
  isCheckPermission;
  isDisplay: boolean = false;
  ItemId;
  IndexStep = 0;
  totalStep = 0;
  historyId = 0;
  processId = 0;
  ItemAttachments: AttachmentsObject[] = [];
  urlAttachment = '';
  listName = 'ListDocumentGo';
  outputFile = [];
  outputFileHandle = [];
  outputFileReturn = [];
  outputFileAddComment = [];
  displayFile = '';
  buffer;
  content;
  deadline; //ngày hết hạn xử lý
  deadline_VB; //ngày hết hạn xử lý mà không fomat trong phần hiển thị thông tin văn bản
  strFilter = '';
  indexComment;
  Comments = null;
  listComment = [];
  AttachmentsComment: AttachmentsObject[] = [];
  overlayRef;
  assetFolder = environment.assetFolder;
  displayTime = 'none';
  displayedColumns: string[] = [
    'stt',
    'created',
    'userRequest',
    'userApprover',
    'deadline',
    'status',
    'taskType',
    'type'
  ]; //'select'
  ListItem = [];
  currentUserId;
  currentUserName = '';
  currentUserEmail = '';
  pictureCurrent;
  index = 0;
  ArrayItemId = [];
  ListDepartment = [];
  ListUserApprover = [];
  ListUserView=[];
  ListUserChoice: UserChoice[] = [];
  ListAllUserChoice: UserChoice[] = [];
  ListUserOfDepartment: UserOfDepartment[] = [];
  ListUserCombine = [];
  ListUserKnow = [];
  selectedKnower = [];
  selectedCombiner = [];
  selectedApprover;
  EmailConfig;
  IsTP;
  IsGD;
  numberOfSymbol;
  numberGo;
  currentNumberGo = 0;
  UserAppoverName = '';
  contentComment;
  selectedUserComment;
  listUserIdSelect = [];
  idItemProcess;
  ArrayUserPofile: UserProfilePropertiesObject[] = [];
  dataSource_Ticket = new MatTableDataSource<DocumentGoTicket>();
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
  ListDocument: ItemDocumentGo;
  displayedColumns2 = ['person', 'role', 'process', 'combine', 'know'];
  displayedColumns3: string[] = ['stt', 'select', 'department', 'role', 'name', 'type']; // 'userId'
  dataSource2 = new MatTableDataSource<UserOfDepartment>();
  isPermision;
  currentStep = 0;
  isRetrieve: boolean;
  isReturn: boolean;
  isCombine: boolean;
  isApproval=false;
  isExecution: boolean;
  isFinish: boolean;
  ArrCurrentRetrieve = [];
  ArrayIdRetrieve = [];
  dataSource3 = new MatTableDataSource<UserRetieve>();
  ListHistoryId = [];
  selection = new SelectionModel<UserRetieve>(true, []);
  AuthorComment;
  ContentReply;
  NumberGoMax = 0;
  currentRoleTask = '';
  UserRequestId ;
  IsFinishItem = false; IsFlag = false;
  AuthorDocument;
  Retieved = false;
  
  constructor(
    private docServices: DocumentGoService,
    private resService: ResApiService,
    private shareService: SharedService,
    private route: ActivatedRoute,
    private readonly notificationService: NotificationService,
    private ref: ChangeDetectorRef,
    public overlay: Overlay,
    public viewContainerRef: ViewContainerRef,
    private modalService: BsModalService,
    private dialog: MatDialog,
    private routes: Router,
    private documentGo: DocumentComponent,
    private location: PlatformLocation
  ) {
    this.location.onPopState(() => {
      console.log('Init: pressed back!');
      window.location.reload();
      return;
    });
  }

  ngOnInit() {
    if (environment.production) {
      this.urlAttachment = window.location.origin;
    } else {
      this.urlAttachment = environment.proxyUrl.split('/sites/')[0];
    }
    this.route.paramMap.subscribe(parames => {
      this.ItemId = this.docServices.CheckNullSetZero(parames.get('id'));
      this.IndexStep = this.docServices.CheckNullSetZero(parames.get('step'));
      if(this.IndexStep > 0) {
        this.currentStep = this.IndexStep;
      }
    });
    this.getCurrentUser();
    //this.documentGo.isAuthenticated$ = false;
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource3.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource3.data.forEach(row => this.selection.select(row));
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: UserRetieve): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${
      this.selection.isSelected(row) ? 'deselect' : 'select'
    } row ${row.stt + 1}`;
  }
  myFilter = (d: Date): boolean => {
    const day = d;
    // Prevent Saturday and Sunday from being selected.
    return day >= moment().subtract(1, 'day').toDate();
  }

  validateQty(event) {
    var key = window.event ? event.keyCode : event.which;
    if (event.keyCode === 8) {
      return true;
    } else {
      return false;
    }
  }
  //Lấy người dùng hiện tại
  getCurrentUser() {
    this.resService.getCurrentUser().subscribe(
      itemValue => {
        this.currentUserId = itemValue['Id'];
        this.currentUserName = itemValue['Title'];
        this.currentUserEmail = itemValue['Email'];
        console.log('currentUserEmail: ' + this.currentUserEmail);
      },
      error => {
        console.log('error: ' + error);
        this.closeCommentPanel();
      },
      () => {
        this.openCommentPanel();
        console.log(
          'Current user email is: \n' +
            'Current user Id is: ' +
            this.currentUserId +
            '\n' +
            'Current user name is: ' +
            this.currentUserName
        );
        this.resService.getDepartmnetOfUser(this.currentUserId).subscribe(
          itemValue => {
            let itemUserMember = itemValue['value'] as Array<any>;
            if (itemUserMember.length > 0) {
              itemUserMember.forEach(element => {
                if (element.RoleCode === 'TP') {
                  this.IsTP = true;
                  //this.documentGo.isAuthenticated$ = true;
                } else if (element.RoleCode === 'GĐ') {
                  this.IsGD = true;
                  //this.documentGo.isAuthenticated$ = true;
                } else if (element.RoleCode === 'NV') {
                  //this.documentGo.isAuthenticated$ = true;
                }
              });
              this.CheckPermission();
              this.getListEmailConfig();
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
      }
    );
  }

  CheckPermission() {
    let strSelect = '';
    if (this.IndexStep > 0) {
      strSelect =
        `' and DocumentGoID eq '` +
        this.ItemId +
        `' and IndexStep eq '` +
        this.IndexStep +
        `'`;
    } else {
      strSelect = `' and DocumentGoID eq '` + this.ItemId + `'`;
    }
    let strFilter =
      `&$filter=UserApprover/Id eq '` + this.currentUserId + strSelect;
    this.docServices.getListRequestTo(strFilter).subscribe(
      (itemValue: any[]) => {
        let item = itemValue['value'] as Array<any>;
        if (item.length < 0) {
          this.isCheckPermission = false;
        } else {
          this.isCheckPermission = true;
          if (this.IndexStep > 0) {
            this.currentRoleTask = item[0].TaskTypeCode;
            this.UserRequestId=item[0].UserRequest.Id;
            if (item[0].StatusID === 1) {
              this.routes.navigate([
                'Documents/documentgo-detail/' + this.ItemId
              ]);
            }
          }
        }
      },
      error => {
        this.closeCommentPanel();
      },
      () => {
        this.GetTotalStep();
      }
    );
  }

  // Load all user approval
  GetAllUser() {
    this.resService.getList('ListDepartment').subscribe(
      (itemValue: any[]) => {
        let item = itemValue['value'] as Array<any>;
        this.ListDepartment = [];
        item.forEach(element => {
          this.ListDepartment.push({
            Id: element.ID,
            Code: element.Code,
            Name: element.Title
          });
        });
      },
      error => {
        console.log('get list department error: ' + error);
        this.closeCommentPanel();
      },
      () => {
        this.docServices.getAllUser().subscribe(
          (itemValue: any[]) => {
            let item = itemValue['value'] as Array<any>;
            let ListDe = [];
            this.ListUserChoice = [];
            this.ListAllUserChoice = [];
            item.forEach(element => {
              if(this.ListAllUserChoice.findIndex(i => i.Id === element.User.Id) < 0) {
                this.ListAllUserChoice.push({
                  Id: element.User.Id,
                  DisplayName: element.User.Title,
                  Email: element.User.Name.split('|')[2],
                  DeCode: element.DepartmentCode,
                  DeName: element.DepartmentName,
                  RoleCode: element.RoleCode,
                  RoleName: element.RoleName
                });
              }
              if (this.IndexStep === this.totalStep - 2) {
                if(element.RoleCode=='GĐ') {
                  this.ListUserChoice.push({
                    Id: element.User.Id,
                    DisplayName: element.User.Title,
                    Email: element.User.Name.split('|')[2],
                    DeCode: element.DepartmentCode,
                    DeName: element.DepartmentName,
                    RoleCode: element.RoleCode,
                    RoleName: element.RoleName
                  });
                if (ListDe.indexOf(element.DepartmentCode) < 0) {
                  ListDe.push(element.DepartmentCode);
                }
              }
            }
            else{
              this.ListUserChoice.push({
                Id: element.User.Id,
                DisplayName: element.User.Title,
                Email: element.User.Name.split('|')[2],
                DeCode: element.DepartmentCode,
                DeName: element.DepartmentName,
                RoleCode: element.RoleCode,
                RoleName: element.RoleName
              });
              if (ListDe.indexOf(element.DepartmentCode) < 0) {
                ListDe.push(element.DepartmentCode);
              }
            }
            });
            console.log('array ' + ListDe);
            ListDe.forEach(element => {
              let DeName = '';
              let itemDe = this.ListDepartment.find(d => d.Code === element);
              if (itemDe !== undefined) {
                DeName = itemDe.Name;
              }
              this.ListUserOfDepartment.push({
                STT: 0,
                IsDepartment: true,
                Code: element,
                Name: DeName,
                Role: '',
                IsHandle: false,
                IsCombine: false,
                IsKnow: false,
                Icon: 'business',
                Class: 'dev',
                isPerson: undefined
              });
              this.ListUserChoice.forEach(user => {
                if (user.DeCode === element) {
                  this.ListUserOfDepartment.push({
                    STT: 0,
                    IsDepartment: false,
                    Code: user.Id + '|' + user.Email + '|' + user.DisplayName,
                    Name: user.DisplayName,
                    Role: user.RoleName,
                    IsHandle: false,
                    IsCombine: false,
                    IsKnow: false,
                    Icon: 'person',
                    Class: 'user-choice',
                    isPerson: true
                  });
                }
              });
            });
            console.log('List User ' + this.ListUserOfDepartment);
            this.dataSource2 = new MatTableDataSource<UserOfDepartment>(
              this.ListUserOfDepartment
            );
            if (!(this.ref as ViewRef).destroyed) {
              this.ref.detectChanges();
            }
          },
          error => {
            console.log('Load all user error ' + error);
            this.closeCommentPanel();
          },
          () => {}
        );
      }
    );
  }

  //lấy đường dẫn ảnh trên sharepoint
  getUserPofile(loginName) {
    try {
      this.resService.getUserInfo('i:0%23.f|membership|' + loginName).subscribe(
        itemss => {
          this.ArrayUserPofile = [];
          let kU = itemss['UserProfileProperties'] as Array<any>;
          kU.forEach(element => {
            this.ArrayUserPofile.push({
              Key: element.Key,
              Value: element.Value
            });
          });
        },
        error => {
          console.log(error);
          this.closeCommentPanel();
        },
        () => {
          if (this.ArrayUserPofile.length > 0) {
            let pick = this.ArrayUserPofile.find(x => x.Key == 'PictureURL');
            this.pictureCurrent = pick.Value;
          }
        }
      );
    } catch (error) {
      console.log('getUsr error: ' + error.message);
    }
  }

  GetTotalStep() {
    this.GetHistory();
    // this.resService.getListTotalStep('DG').subscribe(
    //   items => {
    //     let itemList = items['value'] as Array<any>;
    //     if (itemList.length > 0) {
    //       this.totalStep = itemList[0].TotalStep;
    //     }
    //   },
    //   error => {
    //     console.log('Load total step error: ' + error);
    //     this.closeCommentPanel();
    //   },
    //   () => {
    //     if (this.IndexStep >= this.totalStep) {
    //       if (this.currentRoleTask === 'XLC') {
    //         this.isExecution = false;
    //         this.isFinish = true;
    //       } else {
    //         this.isExecution = false;
    //         this.isFinish = false;
    //       }
    //     } else if (this.IndexStep > 0) {
    //       if (this.IndexStep === this.totalStep - 1) {
    //         this.isDisplay = true;
    //       }
    //       if (this.currentRoleTask === 'XLC') {
    //         this.isExecution = true;
    //       } else if (this.currentRoleTask === 'PH') {
    //         this.isExecution = false;
    //         this.isFinish = false;
    //         this.isCombine = true;
    //       } else {
    //         this.isExecution = false;
    //         this.isFinish = false;
    //         this.isCombine = false;
    //       }
    //     }
     //   this.getUserPofile(this.currentUserEmail);
        this.GetItemDetail();
        this.GetAllUser();
        this.getComment();
      // }
    // );
  }

  getListEmailConfig() {
    const str = `?$select=*&$filter=Title eq 'DG'&$top=1`;
    this.EmailConfig = null;
    this.resService.getItem('ListEmailConfig', str).subscribe(
      (itemValue: any[]) => {
        let item = itemValue['value'] as Array<any>;
        if (item.length > 0) {
          item.forEach(element => {
            this.EmailConfig = {
              FieldMail: element.FieldMail,
              NewEmailSubject: element.NewRequestSubject,
              NewEmailBody: element.NewRequestBody,
              ApprovedEmailSubject: element.ApprovedRequestSubject,
              ApprovedEmailBody: element.ApprovedRequestBody,
              AssignEmailSubject: element.AssignRequestSubject,
              AssignEmailBody: element.AssignRequestBody,
              FinishEmailSubject: element.FinishRequestSubject,
              FinishEmailBody: element.FinishRequestBody,
              CommentSubject: element.CommentRequestSubject,
              CommentBody: element.CommentRequestBody,
              ReplyCommentSubject: element.ReplyCommentSubject,
              ReplyCommentBody: element.ReplyCommentBody,
              ReturnEmailSubject: element.ReturnRequestSubject,
              ReturnEmailBody: element.ReturnRequestBody,
              RetrieveEmailSubject: element.RetrieveRequestSubject,
              RetrieveEmailBody: element.RetrieveRequestbody,
              OutOfDateSubject: element.OutOfDateSubject,
              OutOfDateBody:element.OutOfDateBody,
            };
          });
        }
      },
      error => {
        this.closeCommentPanel();
      }
    );
  }
  //Lấy số văn bản đi
  getNumberGo() {
    let strFilter = `?$select=NumberGo&$filter=NumberGo ne 'null'&$orderby=NumberGo desc`;
    this.shareService.getItemList('ListDocumentGo', strFilter).subscribe(
      itemValue => {
        let item = itemValue['value'] as Array<any>;
        if (item.length === 0) {
          this.currentNumberGo = 0;
        } else {
          this.currentNumberGo = item[0].NumberGo;
        }
      },
      error => {
        console.log('Load numberGo max error');
        this.closeCommentPanel();
      },
      () => {
        this.numberGo = this.docServices.formatNumberGo(
          this.currentNumberGo + 1
        );
        this.numberOfSymbol = this.numberGo + '/Văn bản đi';
      }
    );
  }

  GetItemDetail() {
    try {
      this.ItemAttachments = [];
      this.docServices.getListDocByID(this.ItemId).subscribe(
        items => {
          console.log('items: ' + items);
          let itemList = items['value'] as Array<any>;
          if (itemList[0].AttachmentFiles.length > 0) {
            itemList[0].AttachmentFiles.forEach(element => {
              this.ItemAttachments.push({
                name: element.FileName,
                urlFile: this.urlAttachment + element.ServerRelativeUrl
              });
            });
          }
          //kiểm tra số vb đi đã có chưa? chưa có thì cấp số mới
          this.numberGo= this.docServices.CheckNullSetZero(itemList[0].NumberGo);
          if(this.numberGo==0){
            this.getNumberGo();
          }
          //Lấy ds người được xem văn bản
         this.ListUserView=itemList[0].ListUserViewId;
          //lấy tổng số bước của VB
          this.totalStep=itemList[0].TotalStep==null?0:itemList[0].TotalStep;
          this.deadline_VB =
            this.docServices.checkNull(itemList[0].Deadline) === ''
              ? null
              : itemList[0].Deadline;
          this.UserAppoverName = itemList[0].ListUserApprover;
          this.AuthorDocument={Id:itemList[0].Author.Id,Name:itemList[0].Author.Title,Email:itemList[0].Author.Name.split('|')[2]};
          this.itemDoc = {
            ID: itemList[0].ID,
            DocumentID: itemList[0].DocumentGoID,
            NumberGo:
              this.docServices.CheckNullSetZero(itemList[0].NumberGo) === 0
                ? ''
                : this.docServices.formatNumberGo(itemList[0].NumberGo),
            DocTypeName: this.docServices.checkNull(itemList[0].DocTypeName),
            NumberSymbol: this.docServices.checkNull(itemList[0].NumberSymbol),
            Compendium: this.docServices.checkNull(itemList[0].Compendium),
            AuthorId:
              itemList[0].Author == undefined ? 0 : itemList[0].Author.Id,
            UserCreateName:
              itemList[0].Author == undefined ? '' : itemList[0].Author.Title,
            DateCreated: this.docServices.formatDateTime(
              itemList[0].DateCreated
            ),
            UserApproverId:  itemList[0].UserOfHandle == undefined ? '' : itemList[0].UserOfHandle.Id,
            UserOfHandleName: 
              itemList[0].UserOfHandle == undefined
                ? ''
                : itemList[0].UserOfHandle.Title,
            UserOfKnowName:
              itemList[0].UserOfKnow == undefined
                ? ''
                : itemList[0].UserOfKnow.Title,
            UserOfCombinateName:
              itemList[0].UserOfCombinate == undefined
                ? ''
                : itemList[0].UserOfCombinate.Title,

            Deadline: this.docServices.formatDateTime(itemList[0].Deadline),
            StatusName: this.docServices.checkNull(itemList[0].StatusName),
            BookTypeName: itemList[0].BookTypeName,
            UnitCreateName: itemList[0].UnitCreateName,
            RecipientsInName: itemList[0].RecipientsInName,
            RecipientsOutName: itemList[0].RecipientsOutName,
            SecretLevelName: itemList[0].SecretLevelName,
            UrgentLevelName: itemList[0].UrgentLevelName,
            SecretCode: this.docServices.checkNull(itemList[0].SecretCode),
            UrgentCode: this.docServices.checkNull(itemList[0].UrgentCode),
            TotalStep:itemList[0].TotalStep==null ? 0: itemList[0].TotalStep,
            MethodSendName: itemList[0].MethodSendName,
            DateIssued: this.docServices.formatDateTime(itemList[0].DateIssued),
            SignerName:
              itemList[0].Signer == undefined ? '' : itemList[0].Signer.Title,
            NumOfPaper: itemList[0].NumOfPaper,
            Note: itemList[0].Note,
            link: '',
            TypeCode: itemList[0].TypeCode,
            StatusID: itemList[0].StatusID
          };
        },
        error => {
          console.log('Load item detail error: ' + error);
          this.closeCommentPanel();
        },
        () => {
          
          if (this.IndexStep >= this.totalStep) {
            if (this.currentRoleTask === 'XLC') {
              this.isExecution = false;
              this.isFinish = true;
            } else {
              this.isExecution = false;
              this.isFinish = false;
            }
          } else if (this.IndexStep > 0) {
            if (this.IndexStep === this.totalStep - 2) {
              this.isDisplay = true;
            }
            if (this.currentRoleTask === 'XLC') {
              if(this.IndexStep==this.totalStep-1){
                this.isApproval = true;
              }
              else
              this.isExecution = true;
            } else if (this.currentRoleTask === 'PH') {
              this.isExecution = false;
              this.isFinish = false;
              this.isCombine = true;
            } else {
              this.isExecution = false;
              this.isFinish = false;
              this.isCombine = false;
            }
          }
          if (
            !this.isCheckPermission &&
            this.itemDoc.AuthorId !== this.currentUserId
          ) {
            this.closeCommentPanel();
            this.notificationService.info('Bạn không có quyền truy cập');
            this.routes.navigate(['/']);
          }
          if (!(this.ref as ViewRef).destroyed) {
            this.ref.detectChanges();
          }
          this.closeCommentPanel();
        }
      );
    } catch (err) {
      console.log('Load item detail error: ' + err.message);
      this.closeCommentPanel();
    }
  }
 
  GetHistory() {
    try {
      this.strFilter =
        `&$filter=DocumentGoID eq '` + this.ItemId + `'&$orderby=Created asc`;
      this.docServices.getListRequestGoByDocID(this.strFilter).subscribe(
        (itemValue: any[]) => {
          let item = itemValue['value'] as Array<any>;
          this.ListItem = [];
          let retrieveValid = false;
          let indexValid = 0;
          let retrieveInValid = false;
          item.forEach(element => {
            if (element.IndexStep === this.IndexStep) {
              if(this.IndexStep <= 1 || element.TypeCode === "TL" || element.TypeCode === "TH") {
                this.isReturn = false;
              } else {
                if(this.currentRoleTask === "NĐB") {
                  this.isReturn = false;
                } else {
                  this.isReturn = true;
                }
              }
            }
            // Check để hiển thị button thu hồi
            if(this.docServices.CheckNullSetZero(this.IndexStep) === 0) {
              // if(element.UserApprover.Id === this.currentUserId) {
              //   if(indexValid < element.IndexStep) {
              //     indexValid = element.IndexStep;
              //   }
              // }
              if(element.UserRequest.Id === this.currentUserId && element.IndexStep === 2 && element.TaskTypeCode === "XLC") {
                retrieveValid = true;
                indexValid = 1;
              }
              if(element.UserApprover.Id === this.currentUserId && element.TaskTypeCode === "XLC" 
                && element.TypeCode === "CXL" && element.StatusID === 1 && element.TaskTypeID !== -1) {
                retrieveValid = true;
                if(indexValid < element.IndexStep) {
                  indexValid = element.IndexStep;
                }
              }
              if(element.UserApprover.Id === this.currentUserId && element.TypeCode === "CXL" && element.StatusID === 0) {
                retrieveInValid = true;
              }
            } else {
              indexValid = this.IndexStep;
            }
            if (element.IsFinished === 1) {
              this.isRetrieve = false;
            }
            this.ListItem.push({
              STT: this.ListItem.length + 1,
              ID: element.ID,
              documentID: element.DocumentGoID,
              compendium: element.Compendium,
              userRequest:
                element.UserRequest !== undefined
                  ? element.UserRequest.Title
                  : '',
              userRequestId:
                element.UserRequest !== undefined ? element.UserRequest.Id : 0,
                userApproverId:
                element.UserApprover !== undefined ? element.UserApprover.Id : 0,
              userApprover:
                element.UserApprover !== undefined
                  ? element.UserApprover.Title
                  : '',
              userApproverEmail:
                element.UserApprover !== undefined
                ? element.UserApprover.Name.split('|')[2]
                : '',
              deadline:
                this.docServices.checkNull(element.Deadline) === ''
                  ? ''
                  : moment(element.Deadline).format('DD/MM/YYYY'),
              status: element.StatusName,
              statusId: element.StatusID,
              source: this.docServices.checkNull(element.Source),
              destination: this.docServices.checkNull(element.Destination),
              roleRequest: this.docServices.checkNull(element.RoleUserRequest),
              roleApprover: this.docServices.checkNull(element.RoleUserApprover),
              taskTypeCode: element.TaskTypeCode,
              taskType: element.TaskTypeCode === 'XLC'? (element.TypeCode === "XYK" ? '' : "Xử lý chính") : element.TaskTypeCode === 'PH'? 'Phối hợp' : 'Nhận để biết',
              typeCode: this.GetTypeCode(element.TypeCode),
              content: this.docServices.checkNull(element.Content),
              indexStep: element.IndexStep,
              created: this.docServices.formatDateTime(element.DateCreated),
              stsClass: this.getStatusColor(element.StatusID),
              stsTypeCode: element.TypeCode,
              stsTaskCode: element.TaskTypeCode
            });
          });
          this.dataSource_Ticket = new MatTableDataSource<DocumentGoTicket>(
            this.ListItem
          );
          this.dataSource_Ticket.paginator = this.paginator;
          if (!(this.ref as ViewRef).destroyed) {
            this.ref.detectChanges();
          }
          this.ArrayItemId = this.ListItem.filter(
            e => e.indexStep === this.IndexStep && e.stsTypeCode !== "XYK" && e.statusId !== -1
          );
          if(this.IndexStep < 1 && retrieveInValid === false && retrieveValid) {
            this.isRetrieve = true;
            this.currentStep = indexValid;
          } else {
            this.isRetrieve = false;
            this.currentStep = indexValid;
          }
        },
        error => {
          console.log('Load history item: ' + error);
          this.closeCommentPanel();
        },
        () => {
          this.ArrCurrentRetrieve = [];
          this.ListItem.forEach(element => {
            if(element.indexStep === (this.currentStep + 1) && element.statusId !== -1) {
              this.ArrCurrentRetrieve.push({
                Id: element.ID,
                UserId: element.userApproverId,
                stt: this.ArrCurrentRetrieve.length + 1,
                Department: element.destination,
                Role: element.roleApprover,
                Name: element.userApprover,
                TaskType: element.taskType,
                TaskTypeCode: element.taskTypeCode,
                Email: element.userApproverEmail
              })
            }
          });
          this.dataSource3 = new MatTableDataSource<UserRetieve>(
            this.ArrCurrentRetrieve
          );
          this.dataSource3.paginator = this.paginator;
          if (!(this.ref as ViewRef).destroyed) {
            this.ref.detectChanges();
          }
          if(this.ArrCurrentRetrieve.length === 0) {
            this.isRetrieve = false;
          }
          this.docServices
            .getHistoryStep(this.ItemId, this.currentStep)
            .subscribe(
              (itemValue: any[]) => {
                let item = itemValue['value'] as Array<any>;
                if (item.length > 0) {
                  this.historyId = item[0].ID;
                }
              },
              error => {
                console.log('Load history id item: ' + error);
                this.closeCommentPanel();
              }
            );
        }
      );
    } catch (err) {
      console.log('Load GetHistory try error: ' + err.message);
      this.closeCommentPanel();
    }
  }

  NextApprval(template: TemplateRef<any>) {
    //this.notificationService.warn('Chọn người xử lý tiếp theo');
    this.bsModalRef = this.modalService.show(template, { class: 'modal-lg' });
  }

  ReturnRequest(template: TemplateRef<any>) {
    //this.notificationService.warn('Chọn phòng ban để trả lại');
    this.bsModalRef = this.modalService.show(template, { class: 'modal-md' });
    //let strFilter = ` and IndexStep ge '` + this.currentStep + `'`;
    this.docServices.getHistoryStep(this.ItemId, this.currentStep).subscribe(
      (itemValue: any[]) => {
        let item = itemValue['value'] as Array<any>;
        this.ListHistoryId = [];
        item.forEach(element => {
          if (this.ListHistoryId.indexOf(element.ID) < 0) {
            this.ListHistoryId.push(element.ID);
          }
        });
      },
      error => {
        console.log('Load history id item: ' + error);
        this.closeCommentPanel();
      }
    );
  }

  ViewHistory(template: TemplateRef<any>) {
    this.notificationService.warn('Xem luồng có ở bản verson 2');
    // this.bsModalRef = this.modalService.show(template, {class: 'modal-lg'});
  }

  // Thu hồi
  AddTicketRetrieve() {
    // DateRetrieve
    const length = this.selection.selected.length;
    if(length > 0) {
      this.openCommentPanel();
      for(let i = 0; i < length; i++) {
        if(this.ArrayIdRetrieve.findIndex(e => e.Id === this.selection.selected[i].Id) < 0) {
          this.ArrayIdRetrieve.push({ Id: this.selection.selected[i].Id, Email: this.selection.selected[i].Email, Name: this.selection.selected[i].Name});
        }
        if(this.selection.selected[i].TaskTypeCode === "XLC" || this.selection.selected[i].TaskTypeCode === "XYK") {
          this.Retieved = true;
          this.ListItem.forEach(element => {
            if((element.stsTypeCode === "XYK" && element.indexStep >= this.currentStep) 
            || (element.stsTypeCode === "CXL" && element.indexStep > this.currentStep) ) {
              if(this.ArrayIdRetrieve.findIndex(e => e.Id === element.ID) < 0) {
                this.ArrayIdRetrieve.push({ Id: element.ID, Email: element.userApproverEmail, Name: element.userApprover});
              }
            }
          });
        }
      }
      this.UpdateTicketRetrieve(0);
    }   
  }

  UpdateTicketRetrieve(index) {
    try {
      if (
        this.ArrayIdRetrieve !== undefined &&
        this.ArrayIdRetrieve.length > 0
      ) {
        let request;
        request = this.ListAllUserChoice.find(
          item =>
            item.Id === this.docServices.CheckNullSetZero(this.currentUserId)
        );

        const dataTicket = {
          __metadata: { type: 'SP.Data.ListProcessRequestGoListItem' },
          StatusID: -1,
          StatusName: 'Bị thu hồi',
          DateRetrieve: new Date(),
          // Content:
          //   this.docServices.checkNull(this.content) === ''
          //     ? ''
          //     : this.content,
          UserRetrieveId: this.currentUserId,
          ReasonRetrieve: this.docServices.checkNull(this.content),
        };
        if (request !== undefined) {
          Object.assign(dataTicket, { Source: request.DeName });
        }
        this.resService
          .updateListById(
            'ListProcessRequestGo',
            dataTicket,
            this.ArrayIdRetrieve[index].Id
          )
          .subscribe(
            item => {},
            error => {
              this.closeCommentPanel();
              console.log(
                'error when update item to list ListProcessRequestGo: ' +
                  error.error.error.message.value
              ),
                this.notificationService.error('Thu hồi văn bản thất bại');
            },
            () => {
              console.log(
                'update item ' +
                  this.ArrayIdRetrieve[index].Id +
                  ' of approval user to list ListProcessRequestGo successfully!'
              );
              const dataSendUser = {
                __metadata: { type: 'SP.Data.ListRequestSendMailListItem' },
                Title: this.listName,
                IndexItem: this.ItemId,
                Step: this.currentStep,
                KeyList: this.listName +  '_' + this.ItemId,
                SubjectMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.RetrieveEmailSubject, this.ArrayIdRetrieve[index].Name, this.IndexStep + 1),
                BodyMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.RetrieveEmailBody, this.ArrayIdRetrieve[index].Name, this.IndexStep + 1),
                SendMailTo: this.ArrayIdRetrieve[index].Email,
              }
              this.resService.AddItemToList('ListRequestSendMail', dataSendUser).subscribe(
                itemRoomRQ => {
                  console.log(itemRoomRQ['d']);
                },
                error => {
                  console.log(error);
                  this.closeCommentPanel();
                },
                () => {
                  console.log('Save item success and send mail success');
                  index ++;
                  if(index < this.ArrayIdRetrieve.length) {
                    this.UpdateTicketRetrieve(index);
                  }
                  else {
                      // update user view cho văn bản
             let isRemove=false;
             for(let i=0; i<this.ArrayIdRetrieve.length;i++){
              if(this.ListUserView.indexOf( this.ArrayIdRetrieve[i].Id)> -1){
                let index1=this.ListUserView.indexOf( this.ArrayIdRetrieve[i].Id)
                this.ListUserView.splice(index1,1);
                isRemove=true;
              }
             }
             if(isRemove==true){
              const data = {
                __metadata: { type: 'SP.Data.ListDocumentGoListItem' },
                ListUserViewId:{results:this.ListUserView}
              };
              this.resService
                .updateListById('ListDocumentGo', data, this.ItemId)
                .subscribe(
                  item => {},
                  error => {
                    this.closeCommentPanel();
                    console.log(
                      'error when update item to list ListDocumentGo: ' +
                        error.error.error.message.value
                    );
                  },
                  () => {
                    console.log('Update user approver name successfully!');
                  }
                );
             }
                    if(this.Retieved) {
                      if(this.ListHistoryId.length > 0) {
                        this.DeleteHistoryRetrieve(0);
                      } else {
                        this.callbackRetrieve();
                      }
                    } else {
                      this.bsModalRef.hide();
                      this.closeCommentPanel();
                      this.notificationService.success('Thu hồi văn bản thành công');
                      window.location.reload(); 
                    }
                  }
                })
            }
          );
      }
    } catch (err) {
      console.log('update ticket retrieve failed');
      this.closeCommentPanel();
    }
  }

  DeleteHistoryRetrieve(index) {
    const data = {
      __metadata: { type: 'SP.Data.ListHistoryRequestGoListItem' }
    };
    this.resService
      .DeleteItemById('ListHistoryRequestGo', data, this.ListHistoryId[index])
      .subscribe(
        item => {},
        error => {
          this.closeCommentPanel();
          console.log(
            'error when delete item to list ListHistoryRequestGo: ' + error
          ),
            console.log('Xóa lịch sử thất bại');
        },
        () => {
          console.log('Delete item in list ListHistoryRequestGo successfully!');
          console.log('Xóa lịch sử thành công');
          index++;
          if (index < this.ListHistoryId.length) {
            this.DeleteHistoryRetrieve(index);
          } else {
            this.callbackRetrieve();
          }
        }
      );
  }

  callbackRetrieve() {
    let itemUpdate = this.ListItem.find(item => item.indexStep === (this.currentStep + 1) && item.taskTypeCode === "XLC");
    if (itemUpdate !== undefined) {
      const data = {
        __metadata: { type: 'SP.Data.ListProcessRequestGoListItem' },
        Title: this.itemDoc.NumberGo,
        DateCreated: new Date(),
        DocumentGoID: this.ItemId,
        UserRequestId: itemUpdate.userApproverId,
        UserApproverId: this.currentUserId,
        Deadline:
          this.docServices.checkNull(this.deadline) === ''
            ? this.deadline_VB
            : this.deadline,
        StatusID: 0,
        StatusName: 'Chờ xử lý',
        Source: this.docServices.checkNull(itemUpdate.destination),
        Destination: this.docServices.checkNull(itemUpdate.source),
        RoleUserRequest: itemUpdate.roleApprover,
        RoleUserApprover: itemUpdate.roleRequest,
        TaskTypeCode: 'XLC',
        TaskTypeName: 'Xử lý chính',
        TypeCode: 'TH',
        TypeName: 'Phiếu thu hồi',
        Content: this.docServices.checkNull(this.content),
        IndexStep: this.currentStep,
        Compendium: this.itemDoc.Compendium,
        DocTypeName: this.itemDoc.DocTypeName,
        UrgentCode: this.itemDoc.UrgentCode,
        SecretCode: this.itemDoc.SecretCode,
        DateDealine: this.docServices.checkNull(this.deadline) === '' ? (this.docServices.checkNull(this.deadline_VB) === '' ? moment().add(120, 'days').toDate() : moment(this.deadline_VB).subtract(1, 'day').toDate()) :  moment(this.deadline).subtract(1, 'day').toDate(),
        SubjectMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.OutOfDateSubject, this.currentUserName, this.currentStep),
        BodyMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.OutOfDateBody, this.currentUserName, this.currentStep),
        SendMailTo: this.currentUserEmail
        // Flag: this.itemDoc.urgentLevelId > 1 || this.itemDoc.secretLevelId > 1 ? 1 : 0
      };

      this.resService.AddItemToList('ListProcessRequestGo', data).subscribe(
        item => {},
        error => {
          this.closeCommentPanel();
          console.log(
            'error when update item to list ListProcessRequestGo: ' +
              error.error.error.message.value
          ),
            this.notificationService.error('Thu hồi văn bản thất bại');
        },
        () => {
          const dataSendUser = {
            __metadata: { type: 'SP.Data.ListRequestSendMailListItem' },
            Title: this.listName,
            IndexItem: this.ItemId,
            Step: this.currentStep,
            KeyList: this.listName +  '_' + this.ItemId,
            SubjectMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.AssignEmailSubject, this.currentUserName, this.currentStep),
            BodyMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.AssignEmailBody, this.currentUserName, this.currentStep),
            SendMailTo: this.currentUserEmail,
          }
          this.resService.AddItemToList('ListRequestSendMail', dataSendUser).subscribe(
            itemRoomRQ => {
              console.log(itemRoomRQ['d']);
            },
            error => {
              console.log(error);
              this.closeCommentPanel();
            },
            () => {
              this.bsModalRef.hide();
              this.closeCommentPanel();
              this.notificationService.success('Thu hồi văn bản thành công');
              // this.isRetrieve = false;
              window.location.reload(); 
            })
        })
    } else {
      this.bsModalRef.hide();
      this.closeCommentPanel();
      this.notificationService.success('Thu hồi văn bản thành công');
      window.location.reload(); 
    }
  }

 // Trả lại
 AddTicketReturn() {
  try {
    if (this.docServices.checkNull(this.content) === '') {
      this.notificationService.warn(
        'Bạn chưa nhập Lý do trả lại! Vui lòng kiểm tra lại.'
      );
      return;
    }
    this.bsModalRef.hide();
    let item = this.ListItem.find(
      i =>
        i.indexStep === this.IndexStep &&
        i.userApproverId === this.currentUserId &&
        i.stsTypeCode === 'CXL' &&
        i.statusId === 0
    );
    console.log('return request ' + item);
    if(item === undefined){
      console.log('không tìm thấy phiếu');
      return;
    }
    this.openCommentPanel();
    const dataTicket = {
      __metadata: { type: 'SP.Data.ListProcessRequestGoListItem' },
      StatusID: 1,
      StatusName: 'Đã xử lý',
      TaskTypeID: -1,
      IsFinished: 0,      
    };
    if(this.currentRoleTask === "PH") {
      Object.assign(dataTicket, {Content: this.docServices.checkNull(this.content)});
    }
    this.resService
      .updateListById('ListProcessRequestGo', dataTicket, item.ID)
      .subscribe(
        item => {},
        error => {
          this.closeCommentPanel();
          console.log(
            'error when update item to list ListProcessRequestGo: ' +
              error.error.error.message.value
          ),
            this.notificationService.error(
              'Cập nhật thông tin phiếu xử lý thất bại'
            );
        },
        () => {
          console.log(
            'update item return' +
              item.ID +
              ' of approval user to list ListProcessRequestGo successfully!'
          );
          // tra lai phieu cho ng xu ly chinh
          let approverId;
          approverId = item.userRequestId;
          let request, approver;
          request = this.ListAllUserChoice.find(
            item =>
              item.Id ===
              this.docServices.CheckNullSetZero(this.currentUserId)
          );
          approver = this.ListAllUserChoice.find(
            item => item.Id === this.docServices.CheckNullSetZero(approverId)
          );

          if (item.stsTaskCode === 'XLC') {
            const data = {
              __metadata: { type: 'SP.Data.ListProcessRequestGoListItem' },
              Title: this.itemDoc.NumberGo,
              DateCreated: new Date(),
              DocumentGoID: this.ItemId,
              UserRequestId: this.currentUserId,
              UserApproverId: approverId,
              Deadline: this.deadline_VB,
              StatusID: 0,
              StatusName: 'Chờ xử lý',
              Source: request === undefined ? '' : request.DeName,
              Destination: approver === undefined ? '' : approver.DeName,
              RoleUserRequest: request === undefined ? '' : request.RoleName,
              RoleUserApprover:
                approver === undefined ? '' : approver.RoleName,
              TaskTypeCode: 'XLC',
              TaskTypeName: 'Xử lý chính',
              TypeCode: 'TL',
              TypeName: 'Trả lại',
              Content: this.content,
              IndexStep: this.IndexStep - 1,
              Compendium: this.itemDoc.Compendium,
              IndexReturn: this.IndexStep + '_' + (this.IndexStep - 1),
              UrgentCode:this.itemDoc.UrgentCode ,
              SecretCode:this.itemDoc.SecretCode ,
              DateDealine: this.docServices.checkNull(this.deadline) === '' ? (this.docServices.checkNull(this.deadline_VB) === '' ? moment().add(120, 'days').toDate() : moment(this.deadline_VB).subtract(1, 'day').toDate()) :  moment(this.deadline).subtract(1, 'day').toDate(),
              SubjectMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.OutOfDateSubject, approver.DisplayName, this.IndexStep - 1),
              BodyMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.OutOfDateBody, approver.DisplayName, this.IndexStep - 1),
              SendMailTo: approver.Email,
              DocTypeName: this.itemDoc.DocTypeName
            };
            this.resService
              .AddItemToList('ListProcessRequestGo', data)
              .subscribe(
                item => {
                  this.processId = item['d'].Id;
                },
                error => {
                  this.closeCommentPanel();
                  console.log(
                    'error when add item to list ListProcessRequestGo: ' +
                      error.error.error.message.value
                  ),
                    this.notificationService.error(
                      'Thêm phiếu xử lý thất bại'
                    );
                },
                () => {
                  console.log(
                    'Add item of approval user to list ListProcessRequestGo successfully!'
                  );
                  //gui mail tra lai
                  const dataSendUser = {
                    __metadata: {
                      type: 'SP.Data.ListRequestSendMailListItem'
                    },
                    Title: this.listName,
                    IndexItem: this.ItemId,
                    Step: this.currentStep,
                    KeyList: this.listName + '_' + this.ItemId,
                    SubjectMail: this.Replace_Field_Mail(
                      this.EmailConfig.FieldMail,
                      this.EmailConfig.ReturnEmailSubject,
                      approver.DisplayName, this.IndexStep - 1
                    ),
                    BodyMail: this.Replace_Field_Mail(
                      this.EmailConfig.FieldMail,
                      this.EmailConfig.ReturnEmailBody,
                      approver.DisplayName, this.IndexStep - 1
                    ),
                    SendMailTo: approver.Email
                  };
                  this.resService
                    .AddItemToList('ListRequestSendMail', dataSendUser)
                    .subscribe(
                      itemRoomRQ => {
                        console.log(itemRoomRQ['d']);
                      },
                      error => {
                        console.log(error);
                        this.closeCommentPanel();
                      },
                      () => {
                        console.log('Send mail return success.');
                      }
                    );
                  // update user approver name
                  if (item !== undefined) {
                    this.UserAppoverName +=
                      ';' + item.userRequestId + '_' + item.userRequest;
                  }

                  const data = {
                    __metadata: { type: 'SP.Data.ListDocumentGoListItem' },
                    ListUserApprover: this.UserAppoverName
                  };
                  this.resService
                    .updateListById('ListDocumentGo', data, this.ItemId)
                    .subscribe(
                      item => {},
                      error => {
                        this.closeCommentPanel();
                        console.log(
                          'error when update item to list ListDocumentGo: ' +
                            error.error.error.message.value
                        );
                      },
                      () => {
                        console.log(
                          'Update user approver name successfully!'
                        );
                      }
                    );
                  //Update list history
                  if (this.historyId > 0) {
                    const dataTicket = {
                      __metadata: {
                        type: 'SP.Data.ListHistoryRequestGoListItem'
                      },
                      StatusID: -1,
                      StatusName: 'Đã trả lại'
                    };
                    this.resService
                      .updateListById(
                        'ListHistoryRequestGo',
                        dataTicket,
                        this.historyId
                      )
                      .subscribe(
                        item => {},
                        error => {
                          this.closeCommentPanel();
                          console.log(
                            'error when update item to list ListHistoryRequestGo: ' +
                              error.error.error.message.value
                          );
                        },
                        () => {
                          this.callbackFunc(
                            this.processId,
                            this.ItemId,
                            true
                          );
                        }
                      );
                  } else {
                    this.callbackFunc(this.processId, this.ItemId, true);
                  }
                }
              );
          } else {
            this.processId = item.ID;
            //gui mail tra lai
            const dataSendUser = {
              __metadata: { type: 'SP.Data.ListRequestSendMailListItem' },
              Title: this.listName,
              IndexItem: this.ItemId,
              Step: this.currentStep,
              KeyList: this.listName + '_' + this.ItemId,
              SubjectMail: this.Replace_Field_Mail(
                this.EmailConfig.FieldMail,
                this.EmailConfig.ReturnEmailSubject,
                approver.DisplayName, 0
              ),
              BodyMail: this.Replace_Field_Mail(
                this.EmailConfig.FieldMail,
                this.EmailConfig.ReturnEmailBody,
                approver.DisplayName, 0
              ),
              SendMailTo: approver.Email
            };
            this.resService
              .AddItemToList('ListRequestSendMail', dataSendUser)
              .subscribe(
                itemRoomRQ => {
                  console.log(itemRoomRQ['d']);
                },
                error => {
                  console.log(error);
                  this.closeCommentPanel();
                },
                () => {
                  console.log('Send mail return success.');
                  this.callbackFunc(this.processId, this.ItemId, true);
                }
              );
          }
        }
      );
  } catch (err) {
    console.log('try catch AddTicketReturn error: ' + err.message);
    this.closeCommentPanel();
  }
}

  validation() {
    if (this.docServices.checkNull(this.selectedApprover) === '') {
      this.notificationService.warn(
        'Bạn chưa chọn Người xử lý chính! Vui lòng kiểm tra lại'
      );
      return false;
    } else if (this.docServices.checkNull(this.content) === '') {
      this.notificationService.warn(
        'Bạn chưa nhập Nội dung xử lý! Vui lòng kiểm tra lại'
      );
      return false;
    }
    // else if (this.docServices.checkNull(this.deadline) === '') {
    //   this.notificationService.warn("Bạn chưa nhập Hạn xử lý! Vui lòng kiểm tra lại");
    //   return false;
    // }
    else if (
      this.IndexStep === this.totalStep - 2 &&
      (this.docServices.CheckNullSetZero(this.numberGo) === 0 ||
        this.docServices.CheckNullSetZero(this.numberGo) <=
          this.currentNumberGo)
    ) {
      this.notificationService.warn(
        'Số đi không hợp lệ ! Vui lòng kiểm tra lại'
      );
      return false;
    } else {
      return true;
    }
  }

  // Add phiếu xử lý
  AddListTicket() {
    try {
      if (this.validation()) {
        this.bsModalRef.hide();
        this.openCommentPanel();
        //let data: Array<any> = [];
        let request, approver;
        request = this.ListAllUserChoice.find(
          item =>
            item.Id === this.docServices.CheckNullSetZero(this.currentUserId)
        );
        approver = this.ListAllUserChoice.find(
          item =>
            item.Id ===
            this.docServices.CheckNullSetZero(
              this.selectedApprover.split('|')[0]
            )
        );
//phiếu XL cho người xử lý chính
        const data = {
          __metadata: { type: 'SP.Data.ListProcessRequestGoListItem' },
          Title: this.itemDoc.NumberGo,
          DateCreated: new Date(),
          DocumentGoID: this.ItemId,
          UserRequestId: this.currentUserId,
          UserApproverId: this.selectedApprover.split('|')[0],
          Deadline:
            this.docServices.checkNull(this.deadline) === ''
              ? this.deadline_VB
              : this.deadline,
          StatusID: 0,
          StatusName: 'Chờ xử lý',
          Source: request === undefined ? '' : request.DeName,
          Destination: approver === undefined ? '' : approver.DeName,
          RoleUserRequest: request === undefined ? '' : request.RoleName,
          RoleUserApprover: approver === undefined ? '' : approver.RoleName,
          TaskTypeCode: 'XLC',
          TaskTypeName: 'Xử lý chính',
          TypeCode: 'CXL',
          TypeName: 'Chuyển xử lý',
          Content: this.content,
          IndexStep: this.IndexStep + 1,
          Compendium: this.itemDoc.Compendium,
          DocTypeName: this.itemDoc.DocTypeName,
          UrgentCode:this.itemDoc.UrgentCode ,
          SecretCode:this.itemDoc.SecretCode ,
          DateDealine: this.docServices.checkNull(this.deadline) === '' ? (this.docServices.checkNull(this.deadline_VB) === '' ? moment().add(120, 'days').toDate() : moment(this.deadline_VB).subtract(1, 'day').toDate()) :  moment(this.deadline).subtract(1, 'day').toDate(),
          SubjectMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.OutOfDateSubject, this.selectedApprover.split('|')[2], this.IndexStep + 1),
          BodyMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.OutOfDateBody, this.selectedApprover.split('|')[2], this.IndexStep + 1),
          SendMailTo: this.selectedApprover.split('|')[1],
        };

        this.resService.AddItemToList('ListProcessRequestGo', data).subscribe(
          item => {
            this.processId = item['d'].Id;
          },
          error => {
            this.closeCommentPanel();
            console.log(
              'error when add item to list ListProcessRequestGo: ' +
                error.error.error.message.value
            ),
              this.notificationService.error('Thêm phiếu xử lý thất bại');
          },
          () => {
            console.log(
              'Add item of approval user to list ListProcessRequestGo successfully!'
            );
            // update user approver ,user view, số văn bản cho văn bản
            this.UserAppoverName +=
              ';' +
              this.selectedApprover.split('|')[0] +
              '_' +
              this.selectedApprover.split('|')[2];

              if(this.ListUserView.indexOf(this.selectedApprover.split('|')[0])==-1){
                this.ListUserView.push(this.selectedApprover.split('|')[0]);
              }
            const data = {
              __metadata: { type: 'SP.Data.ListDocumentGoListItem' },
              ListUserApprover: this.UserAppoverName,
              ListUserViewId:{results:this.ListUserView}
            };
            if (this.IndexStep === this.totalStep - 2) {
              Object.assign(data, {
                NumberGo: this.docServices.CheckNullSetZero(this.numberGo),
                NumberSymbol: this.numberOfSymbol
              });
            }
            this.resService
              .updateListById('ListDocumentGo', data, this.ItemId)
              .subscribe(
                item => {},
                error => {
                  this.closeCommentPanel();
                  console.log(
                    'error when update item to list ListDocumentGo: ' +
                      error.error.error.message.value
                  );
                },
                () => {
                  console.log('Update user approver name successfully!');
                }
              );
              //update lịch sử
            if (this.historyId > 0) {
              const dataTicket = {
                __metadata: { type: 'SP.Data.ListHistoryRequestGoListItem' },
                StatusID: 1,
                StatusName: 'Đã xử lý'
              };
              this.resService
                .updateListById(
                  'ListHistoryRequestGo',
                  dataTicket,
                  this.historyId
                )
                .subscribe(
                  item => {},
                  error => {
                    this.closeCommentPanel();
                    console.log(
                      'error when update item to list ListHistoryRequestGo: ' +
                        error.error.error.message.value
                    );
                  },
                  () => {}
                );
            }
            //update phiếu xl
            this.UpdateStatus(1, 0);
          }
        );
      }
    } catch (err) {
      console.log('try catch AddListTicket error: ' + err.message);
      this.closeCommentPanel();
    }
  }

//phiếu XL cho người phối hợp
  AddUserCombine() {
    let request, approver;
    request = this.ListAllUserChoice.find(
      item => item.Id === this.docServices.CheckNullSetZero(this.currentUserId)
    );
    approver = this.ListAllUserChoice.find(
      item =>
        item.Id ===
        this.docServices.CheckNullSetZero(
          this.selectedCombiner[this.index].split('|')[0]
        )
    );
    const dataCombiner = {
      __metadata: { type: 'SP.Data.ListProcessRequestGoListItem' },
      Title: this.itemDoc.NumberGo,
      DateCreated: new Date(),
      DocumentGoID: this.ItemId,
      UserRequestId: this.currentUserId,
      UserApproverId: this.selectedCombiner[this.index].split('|')[0],
      Deadline:
        this.docServices.checkNull(this.deadline) === '' ? this.deadline_VB : this.deadline,
      StatusID: 0,
      StatusName: 'Chờ xử lý',
      Source: request === undefined ? '' : request.DeName,
      Destination: approver === undefined ? '' : approver.DeName,
      RoleUserRequest: request === undefined ? '' : request.RoleName,
      RoleUserApprover: approver === undefined ? '' : approver.RoleName,
      TaskTypeCode: 'PH',
      TaskTypeName: 'Phối hợp',
      TypeCode: 'CXL',
      TypeName: 'Chuyển xử lý',
      Content: this.content,
      IndexStep: this.IndexStep + 1,
      Compendium: this.itemDoc.Compendium,
      DocTypeName: this.itemDoc.DocTypeName,
      UrgentCode:this.itemDoc.UrgentCode ,
      SecretCode:this.itemDoc.SecretCode ,
      DateDealine: this.docServices.checkNull(this.deadline) === '' ? (this.docServices.checkNull(this.deadline_VB) === '' ? moment().add(120, 'days').toDate() : moment(this.deadline_VB).subtract(1, 'day').toDate()) :  moment(this.deadline).subtract(1, 'day').toDate(),
      SubjectMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.OutOfDateSubject, approver.DisplayName, this.IndexStep + 1),
      BodyMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.OutOfDateBody, approver.DisplayName, this.IndexStep + 1),
      SendMailTo: approver.Email,
    };
    
    this.resService.AddItemToList('ListProcessRequestGo', dataCombiner).subscribe(
      item => {},
      error => {
        this.closeCommentPanel();
        console.log(
          'error when add item to list ListProcessRequestGo: ' +
            error.error.error.message.value
        ),
          this.notificationService.error('Them phiếu xử lý thất bại');
      },
      () => {
        console.log(
          'update item ' +
            this.selectedCombiner[this.index] +
            ' of approval user to list ListProcessRequestGo successfully!'
        );
        this.index++;
        if (this.index < this.selectedCombiner.length) {
          this.AddUserCombine();
        } else {
          this.index = 0;
             // update user view cho văn bản
             let isAddNew=false;
             for(let i=0; i<this.selectedCombiner.length;i++){
              if(this.ListUserView.indexOf( this.selectedCombiner[i].split('|')[0])==-1){
                this.ListUserView.push( this.selectedCombiner[i].split('|')[0]);
                isAddNew=true;
              }
             }
             if(isAddNew==true){
              const data = {
                __metadata: { type: 'SP.Data.ListDocumentGoListItem' },
                ListUserViewId:{results:this.ListUserView}
              };
              this.resService
                .updateListById('ListDocumentGo', data, this.ItemId)
                .subscribe(
                  item => {},
                  error => {
                    this.closeCommentPanel();
                    console.log(
                      'error when update item to list ListDocumentGo: ' +
                        error.error.error.message.value
                    );
                  },
                  () => {
                    console.log('Update user approver name successfully!');
                  }
                );
             }
          
             //thêm phiếu xử lý cho người nhận để biết
          if (
            this.selectedKnower !== undefined &&
            this.selectedKnower.length > 0
          ) {
            this.AddUserKnow();
          } else {
            this.callbackFunc(this.processId, this.ItemId, false);
          }
        }
      }
    );
  }
//phiếu XL cho người nhận để biết
  AddUserKnow() {
    let request, approver;
    request = this.ListAllUserChoice.find(
      item => item.Id === this.docServices.CheckNullSetZero(this.currentUserId)
    );
    approver = this.ListAllUserChoice.find(
      item =>
        item.Id ===
        this.docServices.CheckNullSetZero(
          this.selectedKnower[this.index].split('|')[0]
        )
    );

    const data = {
      __metadata: { type: 'SP.Data.ListProcessRequestGoListItem' },
      Title: this.itemDoc.NumberGo,
      DateCreated: new Date(),
      DocumentGoID: this.ItemId,
      UserRequestId: this.currentUserId,
      UserApproverId: this.selectedKnower[this.index].split('|')[0],
      Deadline:
        this.docServices.checkNull(this.deadline) === '' ? this.deadline_VB : this.deadline,
      StatusID: 0,
      StatusName: 'Chờ xử lý',
      Source: request === undefined ? '' : request.DeName,
      Destination: approver === undefined ? '' : approver.DeName,
      RoleUserRequest: request === undefined ? '' : request.RoleName,
      RoleUserApprover: approver === undefined ? '' : approver.RoleName,
      TaskTypeCode: 'NĐB',
      TaskTypeName: 'Nhận để biết',
      TypeCode: 'CXL',
      TypeName: 'Chuyển xử lý',
      Content: this.content,
      IndexStep: this.IndexStep + 1,
      Compendium: this.itemDoc.Compendium,
      DocTypeName: this.itemDoc.DocTypeName,
      UrgentCode:this.itemDoc.UrgentCode ,
      SecretCode:this.itemDoc.SecretCode ,
      DateDealine: this.docServices.checkNull(this.deadline) === '' ? (this.docServices.checkNull(this.deadline_VB) === '' ? moment().add(120, 'days').toDate() : moment(this.deadline_VB).subtract(1, 'day').toDate()) :  moment(this.deadline).subtract(1, 'day').toDate(),
      SubjectMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.OutOfDateSubject, approver.DisplayName, this.IndexStep + 1),
      BodyMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.OutOfDateBody, approver.DisplayName, this.IndexStep + 1),
      SendMailTo: approver.Email,
    };
    this.resService.AddItemToList('ListProcessRequestGo', data).subscribe(
      item => {},
      error => {
        this.closeCommentPanel();
        console.log(
          'error when add item to list ListProcessRequestGo: ' +
            error.error.error.message.value
        ),
          this.notificationService.error('Them phiếu xử lý thất bại');
      },
      () => {
        console.log(
          'update item' +
            this.selectedKnower[this.index] +
            ' of approval user to list ListProcessRequestGo successfully!'
        );
        this.index++;
        if (this.index < this.selectedKnower.length) {
          this.AddUserKnow();
        } else {
           // update user view cho văn bản
           let isAddNew=false;
           for(let i=0; i<this.selectedKnower.length;i++){
            if(this.ListUserView.indexOf( this.selectedKnower[i].split('|')[0])==-1){
              this.ListUserView.push( this.selectedKnower[i].split('|')[0]);
              isAddNew=true;
            }
           }
           if(isAddNew==true){
            const data = {
              __metadata: { type: 'SP.Data.ListDocumentGoListItem' },
              ListUserViewId:{results:this.ListUserView}
            };
            this.resService
              .updateListById('ListDocumentGo', data, this.ItemId)
              .subscribe(
                item => {},
                error => {
                  this.closeCommentPanel();
                  console.log(
                    'error when update item to list ListDocumentGo: ' +
                      error.error.error.message.value
                  );
                },
                () => {
                  console.log('Update user approver name successfully!');
                }
              );
           }
          this.callbackFunc(this.processId, this.ItemId, false);
        }
      }
    );
  }

  UpdateStatus(sts, isFinish) {
    let arr = [];
    if (isFinish === 0) {
      arr = this.ArrayItemId;
    } else if (isFinish === 1) {
      arr = this.ListItem;
    }
    if (arr !== undefined && arr.length > 0) {
      const dataTicket = {
        __metadata: { type: 'SP.Data.ListProcessRequestGoListItem' },
        StatusID: 1,
        StatusName: 'Đã xử lý',
        IsFinished: isFinish
      };
      this.resService
        .updateListById('ListProcessRequestGo', dataTicket, arr[this.index].ID)
        .subscribe(
          item => {},
          error => {
            this.closeCommentPanel();
            console.log(
              'error when update item to list ListProcessRequestGo: ' +
                error.error.error.message.value
            ),
              this.notificationService.error(
                'Cập nhật thông tin phiếu xử lý thất bại'
              );
          },
          () => {
            console.log(
              'update item ' +
                arr[this.index] +
                ' of approval user to list ListProcessRequestGo successfully!'
            );
            this.index++;
            if (this.index < arr.length) {
              this.UpdateStatus(sts, isFinish);
            } else {
              this.index = 0;
              if (sts === 0) {
                this.callbackFunc(this.processId, this.ItemId, false);
              } else if (sts === 1) {
                this.AddHistoryStep();
              }
            }
          }
        );
    }
  }

  AddHistoryStep() {
    const data = {
      __metadata: { type: 'SP.Data.ListHistoryRequestGoListItem' },
      Title: this.itemDoc.NumberGo,
      DateCreated: new Date(),
      DocumentGoID: this.itemDoc.ID,
      UserRequestId: this.currentUserId,
      UserApproverId: this.selectedApprover.split('|')[0],
      Deadline:
        this.docServices.checkNull(this.deadline) === '' ? this.deadline_VB : this.deadline,
      StatusID: 0,
      StatusName: 'Chờ xử lý',
      Content: this.itemDoc.Note,
      IndexStep: this.IndexStep + 1,
      Compendium: this.itemDoc.Compendium,
      StatusApproval: '1_0'
    };
    this.resService.AddItemToList('ListHistoryRequestGo', data).subscribe(
      item => {},
      error => {
        this.closeCommentPanel();
        console.log(
          'error when add item to list ListHistoryRequestGo: ' +
            error.error.error.message.value
        ),
          this.notificationService.error('Thêm phiếu xử lý thất bại');
      },
      () => {
        console.log(
          'Add item of approval user to list ListHistoryRequestGo successfully!'
        );
        if (
          this.selectedCombiner !== undefined &&
          this.selectedCombiner.length > 0
        ) {
          this.AddUserCombine();
        } else if (
          this.selectedKnower !== undefined &&
          this.selectedKnower.length > 0
        ) {
          this.AddUserKnow();
        } else {
          this.callbackFunc(this.processId, this.ItemId, false);
        }
      }
    );
  }
  //người phối hợp : nút xử lý
  AddListTicketCombiner() {
    if (this.docServices.checkNull(this.content) === '') {
      this.notificationService.warn("Bạn chưa nhập Nội dung xử lý! Vui lòng kiểm tra lại");
      return ;
    } else {
      let item = this.ListItem.find(i => i.indexStep === this.currentStep && i.stsTaskCode === "PH");
      if(item !== undefined) {
        this.openCommentPanel();
        const dataTicket = {
          __metadata: { type: 'SP.Data.ListProcessRequestGoListItem' },
          StatusID: 1, StatusName: "Đã xử lý",
          TaskTypeID: 1,
          IsFinished: 0
        };
        this.shareService.updateListById('ListProcessRequestGo',dataTicket,item.ID).subscribe(
          item => {},
          error => {
            this.closeCommentPanel();
            console.log(
              'error when update item to list ListProcessRequestGo: ' +
                error.message.value
            ),
              this.notificationService.error('Cập nhật thông tin phiếu xử lý thất bại');
          },
          () => {
            this.bsModalRef.hide();
            console.log(
              'update item of combiner to list ListProcessRequestGo successfully!'
            );
            if(this.outputFileHandle.length > 0) {
              this.saveItemAttachment(0,'ListProcessRequestGo', item.ID,this.outputFileHandle, null);
            } else {
              this.closeCommentPanel();
              this.notificationService.success('Xử lý văn bản thành công');
              this.routes.navigate(['/Documents/documentgo-detail/' + this.ItemId]);
            }          
          }
        );
      }
    }
  }
// Add phiếu xử lý  : nút ký duyệt
AddListTicketApproval() {
  try {
    if (this.docServices.checkNull(this.content) === '') {
      this.notificationService.warn("Bạn chưa nhập Nội dung xử lý! Vui lòng kiểm tra lại");
      return ;
    }
      this.bsModalRef.hide();
      this.openCommentPanel();
      let request, approver;
      request = this.ListAllUserChoice.find(
        item =>
          item.Id === this.docServices.CheckNullSetZero(this.currentUserId)
      );
      approver = this.ListAllUserChoice.find(
        item =>
          item.Id ===
          this.docServices.CheckNullSetZero(
            this.UserRequestId
          )
      );
      this.selectedApprover=approver.Id+"|"+ approver.Email  + "|" + approver.DisplayName;
      this.selectedCombiner=[];
      this.selectedKnower=[];
//tạo phiếu XL chính (giám đốc gửi lại cho văn thư)
      const data = {
        __metadata: { type: 'SP.Data.ListProcessRequestGoListItem' },
        Title: this.itemDoc.NumberGo,
        DateCreated: new Date(),
        DocumentGoID: this.ItemId,
        UserRequestId: this.currentUserId,
        UserApproverId: this.UserRequestId,
        Deadline:
          this.docServices.checkNull(this.deadline) === ''
            ? this.deadline_VB
            : this.deadline,
        StatusID: 0,
        StatusName: 'Chờ xử lý',
        Source: request === undefined ? '' : request.DeName,
        Destination: approver === undefined ? '' : approver.DeName,
        RoleUserRequest: request === undefined ? '' : request.RoleName,
        RoleUserApprover: approver === undefined ? '' : approver.RoleName,
        TaskTypeCode: 'XLC',
        TaskTypeName: 'Xử lý chính',
        TypeCode: 'CXL',
        TypeName: 'Chuyển xử lý',
        Content: this.content,
        IndexStep: this.IndexStep + 1,
        Compendium: this.itemDoc.Compendium,
        DocTypeName: this.itemDoc.DocTypeName,
        UrgentCode:this.itemDoc.UrgentCode ,
        SecretCode:this.itemDoc.SecretCode ,
        DateDealine: this.docServices.checkNull(this.deadline) === '' ? (this.docServices.checkNull(this.deadline_VB) === '' ? moment().add(120, 'days').toDate() : moment(this.deadline_VB).subtract(1, 'day').toDate()) :  moment(this.deadline).subtract(1, 'day').toDate(),
        SubjectMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.OutOfDateSubject, approver.DisplayName, this.IndexStep + 1),
        BodyMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.OutOfDateBody, approver.DisplayName, this.IndexStep + 1),
        SendMailTo: approver.Email,
      };

      this.resService.AddItemToList('ListProcessRequestGo', data).subscribe(
        item => {
          this.processId = item['d'].Id;
        },
        error => {
          this.closeCommentPanel();
          console.log(
            'error when add item to list ListProcessRequestGo: ' +
              error.error.error.message.value
          ),
            this.notificationService.error('Thêm phiếu xử lý thất bại');
        },
        () => {
          console.log(
            'Add item of approval user to list ListProcessRequestGo successfully!'
          );
          // update user approver
          this.UserAppoverName +=
            ';' +
            approver.Id+
            '_' +
            approver.DisplayName;
          const data = {
            __metadata: { type: 'SP.Data.ListDocumentGoListItem' },
            ListUserApprover: this.UserAppoverName,
            SignerId:this.currentUserId,
          };
          this.resService
            .updateListById('ListDocumentGo', data, this.ItemId)
            .subscribe(
              item => {},
              error => {
                this.closeCommentPanel();
                console.log(
                  'error when update item to list ListDocumentGo: ' +
                    error.error.error.message.value
                );
              },
              () => {
                console.log('Update user approver name successfully!');
              }
            );
          if (this.historyId > 0) {
            const dataTicket = {
              __metadata: { type: 'SP.Data.ListHistoryRequestGoListItem' },
              StatusID: 1,
              StatusName: 'Đã xử lý'
            };
            this.resService
              .updateListById(
                'ListHistoryRequestGo',
                dataTicket,
                this.historyId
              )
              .subscribe(
                item => {},
                error => {
                  this.closeCommentPanel();
                  console.log(
                    'error when update item to list ListHistoryRequestGo: ' +
                      error.error.error.message.value
                  );
                },
                () => {}
              );
          }
          this.UpdateStatus(1, 0);
        }
      );
  } catch (err) {
    console.log('try catch AddListTicket error: ' + err.message);
    this.closeCommentPanel();
  }
}
//Văn thư: lưu trong hoàn thành văn bản
  FinishRequest() {
    if (this.docServices.checkNull(this.content) === '') {
      this.notificationService.warn("Bạn chưa nhập Nội dung xử lý! Vui lòng kiểm tra lại");
      return ;
    }
    this.openCommentPanel();
    const data = {
      __metadata: { type: 'SP.Data.ListDocumentGoListItem' },
      StatusID: 1,
      StatusName: 'Đã xử lý',
      DateIssued: new Date()
    };
    this.resService.updateListById(this.listName, data, this.ItemId).subscribe(
      item => {},
      error => {
        this.closeCommentPanel();
        console.log(
          'error when update item to list ListDocumentGo: ' +
            error.error.error.message.value
        );
      },
      () => {
        if (this.historyId > 0) {
          const dataTicket = {
            __metadata: { type: 'SP.Data.ListHistoryRequestGoListItem' },
            StatusID: 1,
            StatusName: 'Đã xử lý'
          };
          this.resService
            .updateListById('ListHistoryRequestGo', dataTicket, this.historyId)
            .subscribe(
              item => {},
              error => {
                this.closeCommentPanel();
                console.log(
                  'error when update item to list ListHistoryRequestGo: ' +
                    error.error.error.message.value
                );
              },
              () => {
                this.UpdateStatusFinish(0);
              }
            );
        } else {
          this.UpdateStatusFinish(0);
        }
      }
    );
  }

  callbackFunc(id, idDocument, isReturn) {
     //gửi mail
     this.addItemSendMail();
    if (this.outputFileHandle.length > 0) {
      this.saveItemAttachment(
        0,
        'ListProcessRequestGo',
        id,
        this.outputFileHandle,
        1
      );
    } else if (this.outputFile.length > 0) {
      this.saveItemAttachment(0, this.listName, id, this.outputFile, 1);
    } else if (this.outputFileReturn.length > 0) {
      this.saveItemAttachment(
        0,
        'ListProcessRequestGo',
        id,
        this.outputFileReturn,
        1
      );
    } else if (this.outputFileAddComment.length > 0) {
      this.saveItemAttachment(
        0,
        'ListProcessRequestGo',
        id,
        this.outputFileAddComment,
        1
      );
    } else {
      this.notificationService.success('Xử lý văn bản thành công');
      this.closeCommentPanel();
      this.routes.navigate(['/Documents/documentgo-detail/' + idDocument]);
    }
  }
 
  gotoBack() {
    window.history.back();
  }

  AddNewComment(template) {
    this.bsModalRef = this.modalService.show(template, { class: 'modal-md' });
    this.contentComment = '';
    this.outputFileAddComment = [];
    this.selectedUserComment = null;
  }

  addAttachmentFile(sts) {
    try {
      if (sts === 0) {
        const inputNode: any = document.querySelector('#fileAttachment');
        if (this.docServices.checkNull(inputNode.files[0]) !== '') {
          console.log(inputNode.files[0]);
          if (this.outputFile.length > 0) {
            if (
              this.outputFile.findIndex(
                index => index.name === inputNode.files[0].name
              ) === -1
            ) {
              this.outputFile.push(inputNode.files[0]);
            }
          } else {
            this.outputFile.push(inputNode.files[0]);
          }
        }
      } else if (sts === 1) {
        const inputNode: any = document.querySelector('#fileAttachmentHandle');
        if (this.docServices.checkNull(inputNode.files[0]) !== '') {
          console.log(inputNode.files[0]);
          if (this.outputFileHandle.length > 0) {
            if (
              this.outputFileHandle.findIndex(
                index => index.name === inputNode.files[0].name
              ) === -1
            ) {
              this.outputFileHandle.push(inputNode.files[0]);
            }
          } else {
            this.outputFileHandle.push(inputNode.files[0]);
          }
        }
      } else if (sts === 2) {
        const inputNode: any = document.querySelector('#fileAttachmentReturn');
        if (this.docServices.checkNull(inputNode.files[0]) !== '') {
          console.log(inputNode.files[0]);
          if (this.outputFileReturn.length > 0) {
            if (
              this.outputFileReturn.findIndex(
                index => index.name === inputNode.files[0].name
              ) === -1
            ) {
              this.outputFileReturn.push(inputNode.files[0]);
            }
          } else {
            this.outputFileReturn.push(inputNode.files[0]);
          }
        }
      } else if (sts === 3) {
        const inputNode: any = document.querySelector(
          '#fileAttachmentAddComment'
        );
        if (this.docServices.checkNull(inputNode.files[0]) !== '') {
          console.log(inputNode.files[0]);
          if (this.outputFileAddComment.length > 0) {
            if (
              this.outputFileAddComment.findIndex(
                index => index.name === inputNode.files[0].name
              ) < 0
            ) {
              this.outputFileAddComment.push(inputNode.files[0]);
            }
          } else {
            this.outputFileAddComment.push(inputNode.files[0]);
          }
        }
      }
    } catch (error) {
      console.log('addAttachmentFile error: ' + error);
    }
  }

  removeAttachmentFile(index, sts) {
    try {
      if (sts === 0) {
        console.log(this.outputFile.indexOf(index));
        this.outputFile.splice(this.outputFile.indexOf(index), 1);
      } else if (sts === 1) {
        console.log(this.outputFileHandle.indexOf(index));
        this.outputFileHandle.splice(this.outputFileHandle.indexOf(index), 1);
      } else if (sts === 2) {
        console.log(this.outputFileReturn.indexOf(index));
        this.outputFileReturn.splice(this.outputFileReturn.indexOf(index), 1);
      } else if (sts === 3) {
        console.log(this.outputFileAddComment.indexOf(index));
        this.outputFileAddComment.splice(
          this.outputFileAddComment.indexOf(index),
          1
        );
      }
    } catch (error) {
      console.log('removeAttachmentFile error: ' + error);
    }
  }

  saveItemAttachment(index, listName, idItem, arr, indexUserComment) {
    try {
      this.buffer = this.getFileBuffer(arr[index]);
      this.buffer.onload = (e: any) => {
        console.log(e.target.result);
        const dataFile = e.target.result;
        this.resService
          .inserAttachmentFile(dataFile, arr[index].name, listName, idItem)
          .subscribe(
            itemAttach => {
              console.log('inserAttachmentFile success');
            },
            error => console.log(error),
            () => {
              console.log('inserAttachmentFile successfully');
              if (Number(index) < arr.length - 1) {
                this.saveItemAttachment(
                  Number(index) + 1,
                  listName,
                  idItem,
                  arr,
                  indexUserComment
                );
              } else {
                arr = [];
                this.closeCommentPanel();
                if (listName == 'ListComments') {
                  this.getComment();
                  if (
                    indexUserComment != null &&
                    indexUserComment == this.listUserIdSelect.length - 1
                  ) {
                    this.outputFileAddComment = [];
                    this.notificationService.success(
                      'Bạn gửi xin ý kiến thành công'
                    );
                    this.GetItemDetail();
                    this.GetHistory();
                    this.bsModalRef.hide();
                  } else {
                    this.outputFile = [];
                    this.notificationService.success(
                      'Bạn gửi bình luận thành công'
                    );
                  }
                } else {
                  arr = [];
                  this.notificationService.success('Xử lý văn bản thành công');
                  this.routes.navigate([
                    '/Documents/documentgo-detail/' + this.ItemId
                  ]);
                }
              }
            }
          );
      };
    } catch (error) {
      console.log('saveItemAttachment error: ' + error);
    }
  }

  CheckUserHandle(code, isCheck) {
    console.log(code);
    if (isCheck) {
      this.ListUserOfDepartment.forEach(element => {
        if (element.Code !== code) {
          element.IsHandle = false;
          // element.IsCombine = false;
          // element.IsKnow = false;
        } else {
          this.selectedApprover = element.Code;
          element.IsCombine = false;
          element.IsKnow = false;

          let index = this.selectedCombiner.indexOf(code);
          if (index >= 0) {
            this.selectedCombiner.splice(index, 1);
          }

          let index2 = this.selectedKnower.indexOf(code);
          if (index2 >= 0) {
            this.selectedKnower.splice(index2, 1);
          }
        }
      });
    } else {
      this.selectedApprover = '';
    }
  }

  CheckUserNotHandle1(code, isCheck) {
    console.log(code);
    if (isCheck) {
      this.ListUserOfDepartment.forEach(element => {
        if (element.Code === code) {
          if (code.includes('|') && this.selectedCombiner.indexOf(code) < 0) {
            this.selectedCombiner.push(element.Code);
          }
          element.IsHandle = false;
          element.IsKnow = false;

          if (this.selectedApprover === code) {
            this.selectedApprover = '';
          }

          let index2 = this.selectedKnower.indexOf(code);
          if (index2 >= 0) {
            this.selectedKnower.splice(index2, 1);
          }
        }
      });
    } else {
      let index = this.selectedCombiner.indexOf(code);
      if (index >= 0) {
        this.selectedCombiner.splice(index, 1);
      }
    }
  }

  CheckUserNotHandle2(code, isCheck) {
    console.log(code);
    if (isCheck) {
      this.ListUserOfDepartment.forEach(element => {
        if (element.Code === code) {
          if (code.includes('|') && this.selectedKnower.indexOf(code)) {
            this.selectedKnower.push(element.Code);
          }
          element.IsCombine = false;
          element.IsHandle = false;

          if (this.selectedApprover === code) {
            this.selectedApprover = '';
          }
          let index = this.selectedCombiner.indexOf(code);
          if (index >= 0) {
            this.selectedCombiner.splice(index, 1);
          }
        }
      });
    } else {
      let index = this.selectedKnower.indexOf(code);
      if (index >= 0) {
        this.selectedKnower.splice(index, 1);
      }
    }
  }

  GetTypeCode(code) {
    if (this.docServices.checkNull(code) === '') {
      return '';
    } else if (code === 'CXL') {
      return 'Chuyển xử lý';
    } else if (code === 'TL') {
      return 'Trả lại';
    } else if (code === 'XYK') {
      return 'Xin ý kiến';
    }
  }

  isNotNull(str) {
    return str !== null && str !== '' && str !== undefined;
  }

  getFileBuffer(file) {
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    return reader;
  }

  Reply(i, j) {
    if (j == undefined) {
      this.listCommentParent[i].DisplayReply = 'flex';
    } else {
      this.listCommentParent[i].children[j].DisplayReply = 'flex';
    }
  }

  //luu comment
  SendComment(content, isAddComment, index) {
    try {
      this.openCommentPanel();
      if (this.isNotNull(content)) {
        const dataComment = {
          __metadata: { type: 'SP.Data.ListCommentsListItem' },
          Title: 'ListDocumentGo_' + this.ItemId,
          Chat_Comments: content,
          KeyList: 'ListDocumentGo_' + this.ItemId,
          ProcessID: isAddComment == true ? this.idItemProcess : null,
          UserApproverId:
            isAddComment == true ? this.listUserIdSelect[index] : null,
          UserRequestId: this.currentUserId
        };
        // if (this.isNotNull(this.pictureCurrent)) {
        //   Object.assign(dataComment, { userPicture: this.pictureCurrent });
        // }
        this.resService.AddItemToList('ListComments', dataComment).subscribe(
          itemComment => {
            this.indexComment = itemComment['d'].Id;
          },
          error => {
            console.log(error);
            this.notificationService.error('Bạn gửi bình luận thất bại');
          },
          () => {
            if (isAddComment == false) {
              this.Comments = null;
              if (this.outputFile.length > 0) {
                this.saveItemAttachment(
                  0,
                  'ListComments',
                  this.indexComment,
                  this.outputFile,
                  null
                );
              } else {
                this.closeCommentPanel();
                this.notificationService.success(
                  'Bạn gửi bình luận thành công'
                );
                this.getComment();
              }
            } else if (isAddComment == true) {
              //xin ý kiến
              if (this.outputFileAddComment.length > 0) {
                this.saveItemAttachment(
                  0,
                  'ListComments',
                  this.indexComment,
                  this.outputFileAddComment,
                  index
                );
              } else {
                this.closeCommentPanel();
                console.log('Bạn gửi xin ý kiến thành công');
                //kt nếu lưu đến người cuối cùng rồi thì đóng modal
                if (index == this.listUserIdSelect.length - 1) {
                  this.notificationService.success(
                    'Bạn gửi xin ý kiến thành công'
                  );
                  this.bsModalRef.hide();
                  this.GetHistory();
                  this.getComment();
                }
              }
            }
          }
        );
      } else {
        this.closeCommentPanel();
        this.notificationService.warn('Bạn chưa nhập nội dung bình luận');
      }
    } catch (error) {
      console.log('SendComment error: ' + error);
    }
  }

  //lưu comment trả lời
  saveCommentReply(i, j) {
    try {
      this.openCommentPanel();
      let content = '';
      if (j == undefined) {
        content = this.listCommentParent[i].Content;
      } else {
        content = this.listCommentParent[i].children[j].Content;
      }
      this.ContentReply=content;
      if (this.isNotNull(content)) {
        const dataComment = {
          __metadata: { type: 'SP.Data.ListCommentsListItem' },
          Title: 'ListDocumentGo_' + this.ItemId,
          Chat_Comments: content,
          KeyList: 'ListDocumentGo_' + this.ItemId,
          ParentID:
            this.listCommentParent[i].ParentID == null
              ? this.listCommentParent[i].ID
              : this.listCommentParent[i].ParentID
        };
        // if (this.isNotNull(this.pictureCurrent)) {
        //   Object.assign(dataComment, { userPicture: this.pictureCurrent });
        // }
        this.resService.AddItemToList('ListComments', dataComment).subscribe(
          itemComment => {
            this.indexComment = itemComment['d'].Id;
          },
          error => {
            console.log(error);
            this.notificationService.error('Bạn gửi trả lời thất bại');
          },
          () => {
            this.closeCommentPanel();
            this.notificationService.success('Bạn gửi trả lời thành công');
            //update lại trạng thái cho phiếu xin ý kiến
            if (
              this.isNotNull(this.listCommentParent[i].ProcessID) &&
              this.listCommentParent[i].UserApproverId === this.currentUserId
            ) {
              this.updateProcess(this.listCommentParent[i].ProcessID);
              this.AuthorComment = {
                Title: this.listCommentParent[i].Author,
                Email: this.listCommentParent[i].AuthorEmail
              };
            }
            this.getComment();
            // }
          }
        );
      } else {
        this.closeCommentPanel();
        alert('Bạn chưa nhập nội dung trả lời');
      }
    } catch (error) {
      console.log('saveCommentReply error: ' + error);
    }
  }

  updateProcess(id) {
    try {
      const dataProcess = {
        __metadata: { type: 'SP.Data.ListProcessRequestGoListItem' },
        StatusID: 1,
        StatusName: 'Đã cho ý kiến'
      };
      this.resService
        .updateListById('ListProcessRequestGo', dataProcess, id)
        .subscribe(
          itemComment => {
            //  this.indexComment = itemComment['d'].Id;
          },
          error => console.log(error),
          () => {
            // gui mail
            const dataSendUser = {
              __metadata: { type: 'SP.Data.ListRequestSendMailListItem' },
              Title: this.listName,
              IndexItem: this.ItemId,
              Step: this.currentStep,
              KeyList: this.listName + '_' + this.ItemId,
              SubjectMail: this.Replace_Field_Mail(
                this.EmailConfig.FieldMail,
                this.EmailConfig.ReplyCommentSubject,
                '', this.IndexStep + 1
              ),
              BodyMail: this.Replace_Field_Mail(
                this.EmailConfig.FieldMail,
                this.EmailConfig.ReplyCommentBody,
                '', this.IndexStep + 1
              ),
              SendMailTo: this.AuthorComment.Email
            };
            this.resService
              .AddItemToList('ListRequestSendMail', dataSendUser)
              .subscribe(
                itemRoomRQ => {
                  console.log(itemRoomRQ['d']);
                },
                error => {
                  console.log(error);
                  this.closeCommentPanel();
                },
                () => {
                  console.log('Save item success and send mail success');
                }
              );
            this.GetHistory();
          }
        );
    } catch (error) {
      console.log('saveCommentReply error: ' + error);
    }
  }

  listCommentParent = [];
  listCommentChild = [];
  getComment(): void {
    const strComent =
      `?$select=ID,Chat_Comments,Created,userPicture,ParentID,ProcessID,Author/Title,Author/Name,UserApprover/Id,UserApprover/Title,AttachmentFiles` +
      `&$expand=Author,UserApprover,AttachmentFiles&$filter=KeyList eq 'ListDocumentGo_` +
      this.ItemId +
      `'&$orderby=Created asc`;
    this.docServices.getItem('ListComments', strComent).subscribe(
      itemValue => {
        this.listComment = [];
        this.listCommentParent = [];
        let itemList = itemValue['value'] as Array<any>;
        itemList.forEach(element => {
          let picture;
          if (environment.usingMockData) {
            picture =
              '../../../../' + this.assetFolder + '/img/default-user-image.png';
          } else {
            // this.assetFolder = this.assetFolder.replace('../', '');
            // picture = this.assetFolder + '/img/default-user-image.png';
            picture = this.getUserPicture(element.Author.Name.split('|')[2]);
          }

          if (this.isNotNull(element.AttachmentFiles)) {
            this.AttachmentsComment = [];
            element.AttachmentFiles.forEach(elementss => {
              this.AttachmentsComment.push({
                name: elementss.FileName,
                urlFile: this.urlAttachment + elementss.ServerRelativeUrl
              });
            });
          }
          this.listComment.push({
            ID: element.ID,
            Author: element.Author.Title, //element.UserApprover!=null? (element.Author.Title +'<span> xin ý kiến </span>'+ element.UserApprover.Title):
            AuthorEmail: element.Author.Name.split('|')[2],
            Chat_Comments: this.docServices.checkNull(
              element.Chat_Comments === ''
            )
              ? 'Ý kiến'
              : element.Chat_Comments,
            Created: moment(element.Created).format('DD/MM/YYYY HH:mm:ss'),
            userPicture: picture,
            UserApprover:
              element.UserApprover != null ? element.UserApprover.Title : '',
            UserApproverId:
              element.UserApprover != null ? element.UserApprover.Id : 0,
            XinYKien: ' xin ý kiến ',
            ParentID: element.ParentID,
            ProcessID: element.ProcessID,
            itemAttach: this.AttachmentsComment,
            Content: '',
            DisplayReply: 'none',
            Reply: true
            //  fileAttachment:'fileAttachment'+this.listComment.length+1
          });
        });
        this.listComment.forEach(item => {
          if (item.ParentID == null) {
            let lstChild = this.listComment.filter(
              element => element.ParentID == item.ID
            );
            if (lstChild == undefined) {
              lstChild = [];
            }
            item.children = lstChild;
            this.listCommentParent.push(item);
          }
        });
      },
      error => {
        console.log('Load listcomment error: ' + error);
      },
      () => {
        const strSelect =
          `?$select=*,UserRequest/Title,UserRequest/Name,UserApprover/Id,UserApprover/Title,UserApprover/Name,AttachmentFiles` +
          `&$expand=UserRequest,UserApprover,AttachmentFiles&$filter=DocumentGoID eq '` +
          this.ItemId +
          `' and TypeCode ne 'XYK' and (TaskTypeCode eq 'XLC' or (TaskTypeCode eq 'PH' and (TaskTypeID eq '1' or TaskTypeID eq '-1')))&$orderby=Created asc`;

        this.docServices.getItem('ListProcessRequestGo', strSelect).subscribe(
          itemValue => {
            let itemList = itemValue['value'] as Array<any>;
            itemList.forEach(element => {
              let picture;
              if (environment.usingMockData) {
                picture =
                  '../../../../' +
                  this.assetFolder +
                  '/img/default-user-image.png';
              } else {
                if(element.TaskTypeCode === 'XLC' && element.TypeCode === 'CXL') {
                  picture = this.getUserPicture(
                    element.UserRequest.Name.split('|')[2]
                  );
                } else if ((element.TaskTypeCode === 'PH' && (element.TaskTypeID === 1 || element.TaskTypeID === -1))
                          || element.TypeCode === 'TH') {
                  picture = this.getUserPicture(
                    element.UserApprover.Name.split('|')[2]
                  );
                }
              }
              if (element.IndexStep === 1 && element.TypeCode === 'CXL') {
                return;
              }
              if (this.isNotNull(element.AttachmentFiles)) {
                this.AttachmentsComment = [];
                element.AttachmentFiles.forEach(elementss => {
                  this.AttachmentsComment.push({
                    name: elementss.FileName,
                    urlFile: this.urlAttachment + elementss.ServerRelativeUrl
                  });
                });
              }
              this.listCommentParent.push({
                ID: element.ID,
                Author:element.TaskTypeCode === 'XLC' && element.TypeCode === 'CXL' ? element.UserRequest.Title : 
                    ((element.TaskTypeCode === 'PH' && (element.TaskTypeID === 1 || element.TaskTypeID === -1))
                    || element.TypeCode === 'TH') ? element.UserApprover.Title : element.UserRequest.Title,
                Chat_Comments: this.docServices.checkNull(
                  element.Content === ''
                )
                  ? 'Chuyển xử lý'
                  : element.Content,
                Created: element.TaskTypeCode === 'XLC' ? moment(element.Created).format('DD/MM/YYYY HH:mm:ss') :
                  (element.TaskTypeCode === 'PH' && (element.TaskTypeID === 1 || element.TaskTypeID === -1)) ? moment(element.Modified).format('DD/MM/YYYY HH:mm:ss') : moment(element.Created).format('DD/MM/YYYY HH:mm:ss'),
                userPicture: picture,
                UserApprover: '',
                XinYKien: '',
                itemAttach: this.AttachmentsComment,
                Content: '',
                DisplayReply: 'none',
                Reply: undefined
              });
            });
          },
          error => {
            console.log('Load process error: ' + error);
          },
          () => {
            this.listCommentParent.sort(this.compare);
            if (!(this.ref as ViewRef).destroyed) {
              this.ref.detectChanges();
            }
          }
        );
      }
    );
  }

  compare(a, b) {
    if (a.Created < b.Created) {
      return -1;
    }
    if (a.Created > b.Created) {
      return 1;
    }
    return 0;
  }

  //Lưu :xin ý kiến
  saveItem() {
    try {
      if (this.isNotNull(this.contentComment)) {
        this.listUserIdSelect = [];
        let id = this.selectedUserComment.split('|')[0];
        this.listUserIdSelect.push(id);

        this.openCommentPanel();
        //lưu attach file vào văn bản
        // if (this.outputFileAddComment.length > 0) {
        //   this.saveItemAttachment(0, this.ItemId, this.outputFileAddComment, 'ListDocumentGo', null);
        // }
        //lưu phiếu xin ý kiến và lưu comment
        for (let i = 0; i < this.listUserIdSelect.length; i++) {
          this.saveItemListProcess(i);
        }
      } else {
        alert('Bạn chưa nhập nội dung xin ý kiến');
      }
    } catch (error) {
      console.log('saveItem error: ' + error.message);
    }
  }

  saveItemListProcess(index) {
    try {
      const dataProcess = {
        __metadata: { type: 'SP.Data.ListProcessRequestGoListItem' },
        Title: this.itemDoc.NumberGo,
        DateCreated: new Date(),
        DocumentGoID: this.ItemId,
        UserRequestId: this.currentUserId,
        UserApproverId: this.listUserIdSelect[index],
        StatusID: 0,
        StatusName: 'Chờ xin ý kiến',
        TypeCode: 'XYK',
        TypeName: 'Xin ý kiến',
        TaskTypeCode: 'NĐB',
        TaskTypeName: 'Nhận để biết',
        Content: this.contentComment,
        Compendium: this.itemDoc.Compendium,
        DocTypeName: this.itemDoc.DocTypeName,
        Deadline: this.deadline_VB
      };
      this.resService
        .AddItemToList('ListProcessRequestGo', dataProcess)
        .subscribe(
          items => {
            console.log(items);
            this.idItemProcess = items['d'].Id;
          },
          error => {
            console.log(error);
            this.closeCommentPanel();
          },
          () => {
            this.closeCommentPanel();
             // update user view cho văn bản
             let isAddNew=false;
          //   for(let i=0; i<this.selectedCombiner.length;i++){
              if(this.ListUserView.indexOf( this.listUserIdSelect[index])==-1){
                this.ListUserView.push( this.listUserIdSelect[index]);
                isAddNew=true;
              }
           //  }
             if(isAddNew==true){
              const data = {
                __metadata: { type: 'SP.Data.ListDocumentGoListItem' },
                ListUserViewId:{results:this.ListUserView}
              };
              this.resService
                .updateListById('ListDocumentGo', data, this.ItemId)
                .subscribe(
                  item => {},
                  error => {
                    this.closeCommentPanel();
                    console.log(
                      'error when update item to list ListDocumentGo: ' +
                        error.error.error.message.value
                    );
                  },
                  () => {
                    console.log('Update user approver name successfully!');
                  }
                );
             }
            this.SendComment(this.contentComment, true, index);
            // gui mail
            const dataSendUser = {
              __metadata: { type: 'SP.Data.ListRequestSendMailListItem' },
              Title: this.listName,
              IndexItem: this.ItemId,
              Step: this.currentStep,
              KeyList: this.listName + '_' + this.ItemId,
              SubjectMail: this.Replace_Field_Mail(
                this.EmailConfig.FieldMail,
                this.EmailConfig.CommentSubject,
                '', this.IndexStep + 1
              ),
              BodyMail: this.Replace_Field_Mail(
                this.EmailConfig.FieldMail,
                this.EmailConfig.CommentBody,
                '', this.IndexStep + 1
              ),
              SendMailTo: this.selectedUserComment.split('|')[1]
            };
            this.resService
              .AddItemToList('ListRequestSendMail', dataSendUser)
              .subscribe(
                itemRoomRQ => {
                  console.log(itemRoomRQ['d']);
                },
                error => {
                  console.log(error);
                  this.closeCommentPanel();
                },
                () => {
                  console.log('Save item success and send mail success');
                }
              );
          }
        );
    } catch (error) {
      console.log('saveItemListProcess error: ' + error.message);
    }
  }
  UpdateStatusFinish(index) {
    if(this.ListItem !== undefined && this.ListItem.length > 0) {
      const dataTicket = {
        __metadata: { type: 'SP.Data.ListProcessRequestGoListItem' },
        StatusID: 1, StatusName: "Đã xử lý",
        IsFinished: 1
      };
      this.shareService.updateListById('ListProcessRequestGo', dataTicket, this.ListItem[index].ID).subscribe(
        item => {},
        error => {
          this.closeCommentPanel();
          console.log(
            'error when update item to list ListProcessRequestGo: ' +
              error.error.error.message.value
          ),
            this.notificationService.error('Cập nhật thông tin phiếu xử lý thất bại');
        },
        () => {
          console.log(
            'update item ' + this.ListItem[index] + ' of approval user to list ListProcessRequestGo successfully!'
          );
          index ++;
          if(index < this.ListItem.length) {
            this.UpdateStatusFinish(index);
          }
          else {
            this.bsModalRef.hide();
            this.IsFinishItem = true;
            this.callbackFunc(this.processId, this.ItemId, false);
          }
        }
      );
    }
  }

  addItemSendMail() {
    try {
      if(this.docServices.checkNull(this.selectedApprover) !== '') {
      const dataSendApprover = {
        __metadata: { type: 'SP.Data.ListRequestSendMailListItem' },
        Title: this.listName,
        IndexItem: this.ItemId,
        Step: 1,
        KeyList: this.listName + '_' + this.ItemId,
        SubjectMail: this.Replace_Field_Mail(
          this.EmailConfig.FieldMail,
          this.EmailConfig.AssignEmailSubject,
          this.selectedApprover.split('|')[2],
          this.IndexStep + 1
        ),
        BodyMail: this.Replace_Field_Mail(
          this.EmailConfig.FieldMail,
          this.EmailConfig.AssignEmailBody,
          this.selectedApprover.split('|')[2],
          this.IndexStep + 1
        ),
        SendMailTo: this.selectedApprover.split('|')[1]
      };
      this.resService
        .AddItemToList('ListRequestSendMail', dataSendApprover)
        .subscribe(
          itemCarRQ => {
            console.log(itemCarRQ['d']);
          },
          error => {
            console.log(error);
            this.closeCommentPanel();
          },
          () => {
            console.log('Add email success');
            if (this.selectedCombiner.length > 0) {
              this.SendMailCombiner(0);
            }
            if (this.selectedKnower.length > 0) {
              this.SendMailKnower(0);
            }
          }
        );
      }
      else if(this.IsFinishItem) {
        this.EmailConfig.FinishEmailBody=this.EmailConfig.FinishEmailBody.replace('{Author}',this.AuthorDocument.Name);
        const dataSendApprover = {
          __metadata: { type: 'SP.Data.ListRequestSendMailListItem' },
          Title: this.listName,
          IndexItem: this.ItemId,
          Step: this.currentStep,
          KeyList: this.listName +  '_' + this.ItemId,
          SubjectMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.FinishEmailSubject, this.currentUserName, this.IndexStep + 1),
          BodyMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.FinishEmailBody,  this.currentUserName, this.IndexStep + 1),
          SendMailTo: this.AuthorDocument.Email
        }
        this.resService.AddItemToList('ListRequestSendMail', dataSendApprover).subscribe(
          itemRoomRQ => {
            console.log(itemRoomRQ['d']);
          },
          error => {
            console.log(error);
            this.closeCommentPanel();
          },
          () => {    
            this.closeCommentPanel();
            this.routes.navigate(['/Documents/documentgo-detail/' + this.ItemId]);      
          })
      } else {
        this.closeCommentPanel();
        this.routes.navigate(['/Documents/documentgo-detail/' + this.ItemId]);
      }      
    } catch (error) {
      console.log('addItemSendMail error: ' + error.message);
    }
  }

  SendMailCombiner(index) {
    var user = this.selectedCombiner[index];
    const dataSendUser = {
      __metadata: { type: 'SP.Data.ListRequestSendMailListItem' },
      Title: this.listName,
      IndexItem: this.ItemId,
      Step: 1,
      KeyList: this.listName + '_' + this.ItemId,
      SubjectMail: this.Replace_Field_Mail(
        this.EmailConfig.FieldMail,
        this.EmailConfig.AssignEmailSubject,
        user.split('|')[2], this.IndexStep + 1
      ),
      BodyMail: this.Replace_Field_Mail(
        this.EmailConfig.FieldMail,
        this.EmailConfig.AssignEmailBody,
        user.split('|')[2], this.IndexStep + 1
      ),
      SendMailTo: user.split('|')[1]
    };
    this.resService
      .AddItemToList('ListRequestSendMail', dataSendUser)
      .subscribe(
        itemRoomRQ => {
          console.log(itemRoomRQ['d']);
        },
        error => {
          console.log(error);
          this.closeCommentPanel();
        },
        () => {
          index++;
          if (index < this.selectedCombiner.length) {
            this.SendMailCombiner(index);
          }
        }
      );
  }

  SendMailKnower(index) {
    var user = this.selectedKnower[index];
    const dataSendUser = {
      __metadata: { type: 'SP.Data.ListRequestSendMailListItem' },
      Title: this.listName,
      IndexItem: this.ItemId,
      Step: 1,
      KeyList: this.listName + '_' + this.ItemId,
      SubjectMail: this.Replace_Field_Mail(
        this.EmailConfig.FieldMail,
        this.EmailConfig.AssignEmailSubject,
        user.split('|')[2], this.IndexStep + 1
      ),
      BodyMail: this.Replace_Field_Mail(
        this.EmailConfig.FieldMail,
        this.EmailConfig.AssignEmailBody,
        user.split('|')[2], this.IndexStep + 1
      ),
      SendMailTo: user.split('|')[1]
    };
    this.resService
      .AddItemToList('ListRequestSendMail', dataSendUser)
      .subscribe(
        itemRoomRQ => {
          console.log(itemRoomRQ['d']);
        },
        error => {
          console.log(error);
          this.closeCommentPanel();
        },
        () => {
          index++;
          if (index < this.selectedKnower.length) {
            this.SendMailKnower(index);
          }
        }
      );
  }

  Replace_Field_Mail(FieldMail, ContentMail, UserApprover, indexStep) {
    try {
      if (this.isNotNull(FieldMail) && this.isNotNull(ContentMail)) {
        let strContent = FieldMail.split(',');
        console.log('ContentMail before: ' + ContentMail);
        for (let i = 0; i < strContent.length; i++) {
          switch (strContent[i]) {
            case 'DocumentType':
              ContentMail = ContentMail.replace(
                '{' + strContent[i] + '}',
                this.docServices.checkNull(this.itemDoc.DocTypeName)
              );
              break;
            case 'Compendium':
              ContentMail = ContentMail.replace(
                '{' + strContent[i] + '}',
                this.docServices.checkNull(this.itemDoc.Compendium)
              );
              break;
            case 'Content':
              ContentMail = ContentMail.replace(
                '{' + strContent[i] + '}',
                this.docServices.checkNull(this.content)
              );
              break;
            case 'UserRequest':
              ContentMail = ContentMail.replace(
                '{' + strContent[i] + '}',
                this.currentUserName
              );
              break;
            case 'CommentReply':
              ContentMail = ContentMail.replace(
                '{' + strContent[i] + '}',
                this.docServices.checkNull(this.ContentReply)
              );
              break;
            case 'authorComment':
              ContentMail = ContentMail.replace(
                '{' + strContent[i] + '}',
                this.docServices.checkNull(this.AuthorComment) === ''
                  ? ''
                  : this.AuthorComment.Title
              );
              break;
            case 'ContentComment':
              ContentMail = ContentMail.replace(
                '{' + strContent[i] + '}',
                this.contentComment
              );
              break;
            case 'userComment':
              ContentMail = ContentMail.replace(
                '{' + strContent[i] + '}',
                this.docServices.checkNull(this.selectedUserComment) === ''
                  ? ''
                  : this.selectedUserComment.split('|')[2]
              );
              break;
            case 'Author':
              ContentMail = ContentMail.replace(
                '{' + strContent[i] + '}',
                this.currentUserName
              );
              break;
            case 'userStep':
              ContentMail = ContentMail.replace(
                '{' + strContent[i] + '}',
                UserApprover
              );
              break;
            case 'UserApprover':
              ContentMail = ContentMail.replace(
                '{' + strContent[i] + '}',
                UserApprover
              );
              break;
            case 'ItemUrl':
              ContentMail = ContentMail.replace(
                '{' + strContent[i] + '}',
                window.location.href.split('#/')[0] +
                  '#/Documents/documentgo-detail/' +
                  this.ItemId
              );
              break;
            case 'TaskUrl':
              ContentMail = ContentMail.replace(
                '{' + strContent[i] + '}',
                window.location.href.split('#/')[0] +
                  '#/Documents/documentgo-detail/' +
                  this.ItemId +
                  '/' + indexStep
              );
              break;
            case 'HomeUrl':
              ContentMail = ContentMail.replace(
                '{' + strContent[i] + '}',
                window.location.href.split('#/')[0] + '#/Documents'
              );
              break;
            case 'LinkRetrieve':
              ContentMail = ContentMail.replace(
                '{' + strContent[i] + '}',
                window.location.href.split('#/')[0] +
                  '#/Documents/docGo-retrieve'
              );
              break;
          }
        }
        console.log('ContentMail after: ' + ContentMail);
        return ContentMail;
      } else {
        console.log('Field or Body email is null or undefined ');
      }
    } catch (err) {
      console.log('Replace_Field_Mail error: ' + err.message);
    }
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

  FormatNumberGo() {
    this.numberGo = this.docServices.formatNumberGo(this.numberGo);
  }

  ChangeNumberGo() {
    this.numberOfSymbol = this.numberGo + '/Văn bản đi';
  }

  getStatusName(sts) {
    let stsName = '';
    switch (sts) {
      case 0:
        stsName = 'Chờ xử lý';
        break;
      case 1:
        stsName = 'Đã xử lý';
        break;
      case -1:
        stsName = 'Bị thu hồi';
        break;
      default:
        stsName = 'Chờ xử lý';
        break;
    }
    return stsName;
  }

  getStatusColor(sts) {
    let stsName = '';
    switch(sts) {
      case 0: 
        stsName = 'Ongoing';
        break;
      case 1: 
        stsName = 'Approved';
        break;
      case -1: 
        stsName = 'Retrieve';
        break;
      default:
        stsName = 'Ongoing';
        break;
    }
    return stsName;
  }

  getUserPicture(email) {
    return (
      window.location.origin +
      '/_layouts/15/userphoto.aspx?size=M&username=' +
      email
    );
  }

  // //tree
  // /** Map from flat node to nested node. This helps us finding the nested node to be modified */
  // flatNodeMap = new Map<TodoItemFlatNode, TodoItemNode>();

  // /** Map from nested node to flattened node. This helps us to keep the same object for selection */
  // nestedNodeMap = new Map<TodoItemNode, TodoItemFlatNode>();

  // /** A selected parent node to be inserted */
  // selectedParent: TodoItemFlatNode | null = null;

  // /** The new item's name */
  // newItemName = '';

  // treeControl: FlatTreeControl<TodoItemFlatNode>;

  // treeFlattener: MatTreeFlattener<TodoItemNode, TodoItemFlatNode>;

  // dataSource: MatTreeFlatDataSource<TodoItemNode, TodoItemFlatNode>;

  // /** The selection for checklist */
  // checklistSelection = new SelectionModel<TodoItemFlatNode>(true /* multiple */);

  // // constructor(private _database: ChecklistDatabase) {
  // //   this.treeFlattener = new MatTreeFlattener(this.transformer, this.getLevel,
  // //     this.isExpandable, this.getChildren);
  // //   this.treeControl = new FlatTreeControl<TodoItemFlatNode>(this.getLevel, this.isExpandable);
  // //   this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

  // //   _database.dataChange.subscribe(data => {
  // //     this.dataSource.data = data;
  // //   });
  // // }

  // getLevel = (node: TodoItemFlatNode) => node.level;

  // isExpandable = (node: TodoItemFlatNode) => node.expandable;

  // getChildren = (node: TodoItemNode): TodoItemNode[] => node.children;

  // hasChild = (_: number, _nodeData: TodoItemFlatNode) => _nodeData.expandable;

  // hasNoContent = (_: number, _nodeData: TodoItemFlatNode) => _nodeData.item === '';

  // /**
  //  * Transformer to convert nested node to flat node. Record the nodes in maps for later use.
  //  */
  // transformer = (node: TodoItemNode, level: number) => {
  //   const existingNode = this.nestedNodeMap.get(node);
  //   const flatNode = existingNode && existingNode.item === node.item
  //       ? existingNode
  //       : new TodoItemFlatNode();
  //   flatNode.item = node.item;
  //   flatNode.level = level;
  //   flatNode.expandable = !!node.children;
  //   this.flatNodeMap.set(flatNode, node);
  //   this.nestedNodeMap.set(node, flatNode);
  //   return flatNode;
  // }

  // /** Whether all the descendants of the node are selected. */
  // descendantsAllSelected(node: TodoItemFlatNode): boolean {
  //   const descendants = this.treeControl.getDescendants(node);
  //   const descAllSelected = descendants.every(child =>
  //     this.checklistSelection.isSelected(child)
  //   );
  //   return descAllSelected;
  // }

  // /** Whether part of the descendants are selected */
  // descendantsPartiallySelected(node: TodoItemFlatNode): boolean {
  //   const descendants = this.treeControl.getDescendants(node);
  //   const result = descendants.some(child => this.checklistSelection.isSelected(child));
  //   return result && !this.descendantsAllSelected(node);
  // }

  // /** Toggle the to-do item selection. Select/deselect all the descendants node */
  // todoItemSelectionToggle(node: TodoItemFlatNode): void {
  //   this.checklistSelection.toggle(node);
  //   const descendants = this.treeControl.getDescendants(node);
  //   this.checklistSelection.isSelected(node)
  //     ? this.checklistSelection.select(...descendants)
  //     : this.checklistSelection.deselect(...descendants);

  //   // Force update for the parent
  //   descendants.every(child =>
  //     this.checklistSelection.isSelected(child)
  //   );
  //   this.checkAllParentsSelection(node);
  // }

  // /** Toggle a leaf to-do item selection. Check all the parents to see if they changed */
  // todoLeafItemSelectionToggle(node: TodoItemFlatNode): void {
  //   this.checklistSelection.toggle(node);
  //   this.checkAllParentsSelection(node);
  // }

  // /* Checks all the parents when a leaf node is selected/unselected */
  // checkAllParentsSelection(node: TodoItemFlatNode): void {
  //   let parent: TodoItemFlatNode | null = this.getParentNode(node);
  //   while (parent) {
  //     this.checkRootNodeSelection(parent);
  //     parent = this.getParentNode(parent);
  //   }
  // }

  // /** Check root node checked state and change it accordingly */
  // checkRootNodeSelection(node: TodoItemFlatNode): void {
  //   const nodeSelected = this.checklistSelection.isSelected(node);
  //   const descendants = this.treeControl.getDescendants(node);
  //   const descAllSelected = descendants.every(child =>
  //     this.checklistSelection.isSelected(child)
  //   );
  //   if (nodeSelected && !descAllSelected) {
  //     this.checklistSelection.deselect(node);
  //   } else if (!nodeSelected && descAllSelected) {
  //     this.checklistSelection.select(node);
  //   }
  // }

  // /* Get the parent node of a node */
  // getParentNode(node: TodoItemFlatNode): TodoItemFlatNode | null {
  //   const currentLevel = this.getLevel(node);

  //   if (currentLevel < 1) {
  //     return null;
  //   }

  //   const startIndex = this.treeControl.dataNodes.indexOf(node) - 1;

  //   for (let i = startIndex; i >= 0; i--) {
  //     const currentNode = this.treeControl.dataNodes[i];

  //     if (this.getLevel(currentNode) < currentLevel) {
  //       return currentNode;
  //     }
  //   }
  //   return null;
  // }

  // /** Select the category so we can insert the new item. */
  // addNewItem(node: TodoItemFlatNode) {
  //   const parentNode = this.flatNodeMap.get(node);
  //   this._database.insertItem(parentNode!, '');
  //   this.treeControl.expand(node);
  // }

  // /** Save the node to database */
  // saveNode(node: TodoItemFlatNode, itemValue: string) {
  //   const nestedNode = this.flatNodeMap.get(node);
  //   this._database.updateItem(nestedNode!, itemValue);
  // }
}
// @Component({
//   selector: 'onsite-request-panel',
//   template: '<p class="demo-rotini" style="padding: 10px; background-color: #F6753C !important;color:white;">Saving data....</p>'
// })
// export class OnsiteRequestPanel {

// }
