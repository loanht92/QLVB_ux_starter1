import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ViewContainerRef, TemplateRef, Input } from '@angular/core';
//import { IncomingDoc, AttachmentsObject, IncomingDocService, IncomingTicket} from '../incoming-doc.service';
import { environment } from '../../../../../environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material';
import * as moment from 'moment';
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
import {SelectionModel} from '@angular/cdk/collections';
import { ResApiService } from '../../services/res-api.service';
import { DocumentGoService } from './document-go.service';
import { DocumentGoPanel } from './document-go.component';
import { ItemDocumentGo, ListDocType, ItemSeleted, ItemSeletedCode, ItemUser, DocumentGoTicket, AttachmentsObject, UserProfilePropertiesObject } from './../models/document-go';
import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommentComponent } from './comment.component';
export interface Comment { UserId: Number; Content: string, AttachFile: FileAttachment[] };
export interface FileAttachment { name?: string; urlFile?: string }

export class UserOfDepartment {
  IsDepartment: boolean;
  Code: string;
  Name: string;
  Role: string;
  IsHandle: boolean;
  IsCombine: boolean;
  IsKnow : boolean;
  Icon: string;
  Class: string;
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

@Component({
  selector: 'anms-document-go-detail',
  templateUrl: './document-go-detail.component.html',
  styleUrls: ['./document-go-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // providers: [ChecklistDatabase]
})
export class DocumentGoDetailComponent implements OnInit {
  @Input() comments: Comment[];
  bsModalRef: BsModalRef;
  itemDoc: ItemDocumentGo;
  isDisplay: boolean = false;
  isExecution: boolean = false;
  isFinish: boolean = false;
  isReturn: boolean = false;
  ItemId;
  IndexStep = 0;
  totalStep = 0;
  historyId = 0;
  processId = 0;
  ItemAttachments: AttachmentsObject[] = [];
  urlAttachment = environment.proxyUrl.split("/sites/", 1)
  listName = 'ListDocumentGo';
  outputFile = [];
  outputFileHandle = [];
  outputFileReturn = [];
  outputFileAddComment = [];
  displayFile = '';
  buffer;
  content;deadline;
  strFilter = '';
  indexComment;
  Comments = null;
  listComment = [];
  AttachmentsComment: AttachmentsObject[] = [];
  overlayRef;
  assetFolder = environment.assetFolder+'/img';
  displayTime = 'none';
  displayedColumns: string[] = ['stt', 'created', 'userRequest', 'userApprover', 'deadline', 'status', 'taskType', 'type']; //'select'
  ListItem = [];
  currentUserId = '';
  currentUserName = '';
  currentUserEmail = '';
  ReasonReturn;
  pictureCurrent;
  index = 0;
  ArrayItemId = [];
  ListDepartment = [];
  ListUserApprover = [];
  ListUserChoice: UserChoice[] = [];
  ListUserOfDepartment: UserOfDepartment[] = [];
  ListUserCombine = [];
  ListUserKnow = [];
  selectedKnower = []; selectedCombiner = []; selectedApprover;
  EmailConfig;
  numberOfSymbol; numberGo; currentNumberGo = 0;
  UserAppoverName = '';
  contentComment; selectedUserComment;
  listUserIdSelect = []; idItemProcess;
  ArrayUserPofile: UserProfilePropertiesObject[] = [];
  dataSource_Ticket = new MatTableDataSource<DocumentGoTicket>();
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  ListDocument: ItemDocumentGo;
  displayedColumns2 = ['person', 'role', 'process', 'combine', 'know'];
  dataSource2 = new MatTableDataSource<UserOfDepartment>();
  selection = new SelectionModel<UserOfDepartment>(true, []);

  constructor(private docServices: DocumentGoService, private resService: ResApiService,
    private route: ActivatedRoute, private readonly notificationService: NotificationService,
    private ref: ChangeDetectorRef
    , public overlay: Overlay, public viewContainerRef: ViewContainerRef
    , private modalService: BsModalService
    , private dialog: MatDialog
    , private routes: Router,
  ) {

  }

  ngOnInit() {
    this.getCurrentUser();
    this.GetTotalStep();
    this.GetAllUser();
    this.getListEmailConfig();
  }
  //Lấy người dùng hiện tại
  getCurrentUser() {
    this.resService.getCurrentUser().subscribe(
      itemValue => {
        this.currentUserId = itemValue["Id"];
        this.currentUserName = itemValue["Title"];
        this.currentUserEmail = itemValue["Email"];
        console.log("currentUserEmail: " + this.currentUserEmail);
      },
      error => {
        console.log("error: " + error);
        this.closeCommentPanel();
      },
      () => {
        console.log("Current user email is: \n" + "Current user Id is: " + this.currentUserId + "\n" + "Current user name is: " + this.currentUserName);
        this.getUserPofile(this.currentUserEmail);
      }
    );
  }

  // Load all user approval
  GetAllUser() {
    this.resService.getList('ListDepartment').subscribe((itemValue: any[]) => {
      let item = itemValue['value'] as Array<any>;
      this.ListDepartment = [];
      item.forEach(element => {
        this.ListDepartment.push({
          Id: element.ID,
          Code: element.Code,
          Name: element.Title
        })
      })
    },
    error => {
      console.log("get list department error: " + error);
    }, 
    () => {
      this.docServices.getAllUser().subscribe((itemValue: any[]) => {
        let item = itemValue['value'] as Array<any>;
        let ListDe = [];
        this.ListUserChoice = [];
        item.forEach(element => {
          this.ListUserChoice.push({
            Id: element.User.Id,
            DisplayName: element.User.Title,
            Email: element.User.Name.split('|')[2],
            DeCode: element.DepartmentCode,
            DeName: element.DepartmentName,
            RoleCode: element.RoleCode,
            RoleName: element.RoleName
          });
          if(ListDe.indexOf(element.DepartmentCode) < 0) {
            ListDe.push(element.DepartmentCode);
          }
        })
        console.log("array " + ListDe);
        ListDe.forEach(element => {
          let DeName = '';
          let itemDe = this.ListDepartment.find(d => d.Code === element);
          if(itemDe !== undefined) {
            DeName = itemDe.Name;
          }
          this.ListUserOfDepartment.push({
            IsDepartment: true,
            Code: element,
            Name: DeName,
            Role: '',
            IsHandle: false,
            IsCombine: false,
            IsKnow: false,
            Icon: 'apartment',
            Class: 'dev'
          })
          this.ListUserChoice.forEach(user => {
            if(user.DeCode === element) {
              this.ListUserOfDepartment.push({
                IsDepartment: false,
                Code: user.Id + '|' + user.Email + '|' + user.DisplayName,
                Name: user.DisplayName,
                Role: user.RoleName,
                IsHandle: false,
                IsCombine: false,
                IsKnow: false,
                Icon: 'person',
                Class: 'user-choice'
              })
            }
          })
        })
        console.log("List User " + this.ListUserOfDepartment);
        this.dataSource2 = new MatTableDataSource<UserOfDepartment>(this.ListUserOfDepartment);
        this.ref.detectChanges();        
      },
      error => {
        console.log("Load all user error " + error);
        this.closeCommentPanel();
      },
      () =>{}
      )
    })
  }

//lấy đường dẫn ảnh trên sharepoint
  getUserPofile(loginName) {
    try {
      this.resService.getUserInfo('i:0%23.f|membership|' + loginName).subscribe(
        itemss => {
          this.ArrayUserPofile = [];
          let kU = itemss['UserProfileProperties'] as Array<any>;
          kU.forEach(element => {
            this.ArrayUserPofile.push(
              { Key: element.Key, Value: element.Value }
            )
          })
        },
        error => console.log(error),
        () => {
          if (this.ArrayUserPofile.length > 0) {
            let pick = this.ArrayUserPofile.find(x => x.Key == "PictureURL");
            this.pictureCurrent = pick.Value
          }
        }
      )
    } catch (error) {
      console.log('getUsr error: ' + error.message);
    }
  }

  GetTotalStep() {
    this.route.paramMap.subscribe(parames => {
      this.ItemId = parames.get('id');
      this.IndexStep = parseInt(parames.get('step'));
      this.GetHistory();
      this.resService.getListTotalStep('DG').subscribe(items => {
        let itemList = items['value'] as Array<any>;
        if(itemList.length > 0){
          this.totalStep = itemList[0].TotalStep;
        }
      },
      error => {
        console.log("Load total step error: " + error);
        this.closeCommentPanel();
      },
      () => {
        this.GetItemDetail();
      }
      )
    })
  }
  
  getListEmailConfig() {
    const str = `?$select=*&$filter=Title eq 'DT'&$top=1`;
    this.EmailConfig = null;
    this.resService.getItem('ListEmailConfig', str).subscribe((itemValue: any[]) => {
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
            CommentSubject:element.CommentRequestSubject,
            CommentBody:element.CommentRequestBody
          }
      })
      }
    });
  }

  GetItemDetail() {
    this.ItemAttachments=[];
    if(this.IndexStep > 0) {
      this.isExecution = true;
      this.isReturn = true;
      if(this.IndexStep >= this.totalStep) {
        this.isExecution = false;
        this.isFinish = true;
      } else {
        if(this.IndexStep === this.totalStep - 1) {
          this.isDisplay = true;

          this.docServices.getDocumentToMax().subscribe(
            (itemValue: any[]) => {
              let item = itemValue['value'] as Array<any>;
              if (item.length === 0) {
                this.currentNumberGo = 0;
              } else {
                item.forEach(element => {
                  this.currentNumberGo = element.NumberGo;
                });
              }
            },
            error => {
              console.log('Load numberTo max error');
              this.closeCommentPanel();
            },
            () => {
              this.numberGo = this.docServices.formatNumberGo(this.currentNumberGo + 1);
              this.numberOfSymbol = this.numberGo + '/Văn bản đi';
              this.closeCommentPanel();
            }
          );
        }
        this.isExecution = true;
        this.isFinish = false;
      }
    }
    this.docServices.getListDocByID(this.ItemId).subscribe(items => {
      console.log('items: ' + items);
      let itemList = items["value"] as Array<any>;
      if (itemList[0].AttachmentFiles.length > 0) {
        itemList[0].AttachmentFiles.forEach(element => {
          this.ItemAttachments.push({
            name: element.FileName,
            urlFile: this.urlAttachment + element.ServerRelativeUrl
          })
        });
      }
      this.UserAppoverName = itemList[0].ListUserApprover;
      this.itemDoc = {
        ID: itemList[0].ID,
        NumberGo: itemList[0].NumberGo === 0 ? '' : this.docServices.formatNumberGo(itemList[0].NumberGo),
        //  NumberToSub: itemList[0].NumberToSub === 0 ? '' : itemList[0].NumberToSub , 
        DocTypeName: this.docServices.checkNull(itemList[0].DocTypeName),
        NumberSymbol: this.docServices.checkNull(itemList[0].NumberSymbol),
        Compendium: this.docServices.checkNull(itemList[0].Compendium),
        UserCreateName: itemList[0].Author == undefined ? '' : itemList[0].Author.Title,
        DateCreated: this.docServices.formatDateTime(itemList[0].DateCreated),
        UserOfHandleName: itemList[0].UserOfHandle == undefined ? '' : itemList[0].UserOfHandle.Title,

        Deadline: this.docServices.formatDateTime(itemList[0].Deadline),
        StatusName: this.docServices.checkNull(itemList[0].StatusName),
        BookTypeName: itemList[0].BookTypeName,
        UnitCreateName: itemList[0].UnitCreateName,
        RecipientsInName: itemList[0].RecipientsInName,
        RecipientsOutName: itemList[0].RecipientsOutName,
        SecretLevelName: itemList[0].SecretLevelName,
        UrgentLevelName: itemList[0].UrgentLevelName,
        MethodSendName: itemList[0].MethodSendName,
        DateIssued: this.docServices.formatDateTime(itemList[0].DateIssued),
        SignerName: itemList[0].Signer == undefined ? '' : itemList[0].Signer.Title,
        NumOfPaper: itemList[0].NumOfPaper,
        Note: itemList[0].Note,
        link: ''
      };
      this.ref.detectChanges();
      this.getComment();
    })
  }

  GetHistory() {
    try {
      this.strFilter = `&$filter=DocumentGoID eq '` + this.ItemId + `'&$orderby=Created asc`;
      this.docServices.getListRequestGoByDocID(this.strFilter).subscribe((itemValue: any[]) => {
        let item = itemValue["value"] as Array<any>;
        this.ListItem = [];
        item.forEach(element => {
          this.ListItem.push({
            ID: element.ID,
            documentID: element.DocumentGoID,
            compendium: element.Compendium,
            userRequest: element.UserRequest !== undefined ? element.UserRequest.Title : '',
            userRequestId: element.UserRequest !== undefined ? element.UserRequest.Id : 0,
            userApprover: element.UserApprover !== undefined ? element.UserApprover.Title : '',
            deadline:
            this.docServices.checkNull(element.Deadline) === ''
              ? ''
              : moment(element.Deadline).format('DD/MM/YYYY'),
            status: element.StatusName,
            source: '',
            destination: '',
            taskType: element.TaskTypeCode === 'XLC'? "Xử lý chính" : element.TaskTypeCode === 'PH'? 'Phối hợp' : 'Nhận để biết',
            typeCode: this.GetTypeCode(element.TypeCode),
            content: this.docServices.checkNull(element.Content),
            indexStep: element.IndexStep,
            created: this.docServices.formatDateTime(element.DateCreated),
            numberTo: element.ID,
            stsClass: element.StatusID === 0? 'Ongoing' : 'Approved',
            stsTypeCode: element.TypeCode,
          })
        })
        this.dataSource_Ticket = new MatTableDataSource<DocumentGoTicket>(this.ListItem);
        this.dataSource_Ticket.paginator = this.paginator;
        this.ref.detectChanges();
        this.ArrayItemId = this.ListItem.filter(e => e.indexStep === this.IndexStep);
      },
      error => {
        console.log("Load history item: " + error);
        this.closeCommentPanel();
      },
      () => {
        this.docServices.getHistoryStep(this.ItemId, this.IndexStep).subscribe((itemValue: any[]) => {
          let item = itemValue['value'] as Array<any>;
          if(item.length > 0) {
            this.historyId = item[0].ID;
          }
        },
        error => {
          console.log("Load history id item: " + error);
          this.closeCommentPanel();
        })
      }
      );
    } catch(err) {
      console.log("Load GetHistory try error: " + err.message);
      this.closeCommentPanel();
    }
  }

  NextApprval(template: TemplateRef<any>) {
    //this.notificationService.warn('Chọn người xử lý tiếp theo');
    this.bsModalRef = this.modalService.show(template, {class: 'modal-lg'});
  }

  ReturnRequest(template: TemplateRef<any>) {
    //this.notificationService.warn('Chọn phòng ban để trả lại');
    this.bsModalRef = this.modalService.show(template, {class: 'modal-md'});
  }

  ViewHistory(template: TemplateRef<any>) {
    this.notificationService.warn("Xem luồng có ở bản verson 2");
    // this.bsModalRef = this.modalService.show(template, {class: 'modal-lg'});
  }

  // Tra lai
  AddTicketReturn() {
    try {
      if (this.docServices.checkNull(this.ReasonReturn) === '') {
        this.notificationService.warn("Bạn chưa nhập Lý do trả lại! Vui lòng kiểm tra lại");
        return;
      }
      this.bsModalRef.hide();
      this.openCommentPanel();
      let item  = this.ListItem.find(i => i.indexStep === this.IndexStep);
      let approver;
      if(item !== undefined) {
        approver = item.userRequestId;
      }

      const data = {
        __metadata: { type: 'SP.Data.ListProcessRequestGoListItem' },
        Title: this.itemDoc.NumberGo,
        DateCreated: new Date(),
        DocumentGoID: this.ItemId,
        UserRequestId: this.currentUserId,
        UserApproverId: approver,
        // Deadline: this.deadline,
        StatusID: 0,
        StatusName: 'Chờ xử lý',
        Source: '',
        Destination: '',
        TaskTypeCode: 'XLC',
        TaskTypeName: 'Xử lý chính',
        TypeCode: 'TL',
        TypeName: 'Trả lại',
        Content: this.ReasonReturn,
        IndexStep: this.IndexStep - 1,
        Compendium: this.itemDoc.Compendium,
        IndexReturn: this.IndexStep + '_' + (this.IndexStep - 1)
      };
      this.resService.AddItemToList('ListProcessRequestGo', data).subscribe(
        item => {this.processId = item['d'].Id},
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
          this.UserAppoverName += ';' + this.selectedApprover.split('|')[0] + '_' + this.selectedApprover.split('|')[2];
          const data = {
            __metadata: { type: 'SP.Data.ListDocumentGoListItem' },
            ListUserApprover: this.UserAppoverName
          };
          this.resService.updateListById('ListDocumentGo', data, this.ItemId).subscribe(
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
          )

          if(this.historyId > 0) {
            const dataTicket = {
              __metadata: { type: 'SP.Data.ListHistoryRequestGoListItem' },
              StatusID: -1, StatusName: "Đã trả lại",
            };
            this.resService.updateListById('ListHistoryRequestGo', dataTicket, this.historyId).subscribe(
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
          this.UpdateStatus(0);
        }
      );
    } catch (err) {
      console.log("try catch AddTicketReturn error: " + err.message);
      this.closeCommentPanel();
    }
  }

  validation() {
    if (this.docServices.checkNull(this.selectedApprover) === '') {
      this.notificationService.warn("Bạn chưa chọn Người xử lý chính! Vui lòng kiểm tra lại");
      return false;
    }
    else if (this.docServices.checkNull(this.content) === '') {
      this.notificationService.warn("Bạn chưa nhập Nội dung xử lý! Vui lòng kiểm tra lại");
      return false;
    }
    // else if (this.docServices.checkNull(this.deadline) === '') {
    //   this.notificationService.warn("Bạn chưa nhập Hạn xử lý! Vui lòng kiểm tra lại");
    //   return false;
    // } 
    else if (this.IndexStep === (this.totalStep -1) && (this.docServices.CheckNullSetZero(this.numberGo) === 0
            || this.docServices.CheckNullSetZero(this.numberGo) <= this.currentNumberGo)) {
      this.notificationService.warn("Số đi không hợp lệ ! Vui lòng kiểm tra lại");
      return false;
    } 
    else {
      return true;
    }
  }

  // Add phiếu xử lý
  AddListTicket() {
    try {
      if(this.validation()) {
        this.bsModalRef.hide();
        this.openCommentPanel();
        //let data: Array<any> = [];
        const data = {
          __metadata: { type: 'SP.Data.ListProcessRequestGoListItem' },
          Title: this.itemDoc.NumberGo,
          DateCreated: new Date(),
          DocumentGoID: this.ItemId,
          UserRequestId: this.currentUserId,
          UserApproverId: this.selectedApprover.split('|')[0],
          Deadline: this.docServices.checkNull(this.deadline) === '' ? null : this.deadline,
          StatusID: 0,
          StatusName: 'Chờ xử lý',
          Source: '',
          Destination: '',
          TaskTypeCode: 'XLC',
          TaskTypeName: 'Xử lý chính',
          TypeCode: 'CXL',
          TypeName: 'Chuyển xử lý',
          Content: this.content,
          IndexStep: this.IndexStep + 1,
          Compendium: this.itemDoc.Compendium
        };
      
        this.resService.AddItemToList('ListProcessRequestGo', data).subscribe(
          item => {this.processId = item['d'].Id},
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
            this.UserAppoverName += ';' + this.selectedApprover.split('|')[0] + '_' + this.selectedApprover.split('|')[2];
            const data = {
              __metadata: { type: 'SP.Data.ListDocumentGoListItem' },
              ListUserApprover: this.UserAppoverName
            };
            this.resService.updateListById('ListDocumentGo', data, this.ItemId).subscribe(
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
            )

            if(this.IndexStep === (this.totalStep - 1)) {
              const dataTicket = {
                __metadata: { type: 'SP.Data.ListDocumentGoListItem' },
                NumberGo: this.docServices.CheckNullSetZero(this.numberGo), NumberSymbol: this.numberOfSymbol,
              };
              this.resService.updateListById(this.listName, dataTicket, this.ItemId).subscribe(
                item => {},
                error => {
                  this.closeCommentPanel();
                  console.log(
                    'error when update item to list ListDocumentGo: ' +
                      error.error.error.message.value
                  );
                },
                () => {}
              );
            }
            if(this.historyId > 0) {
              const dataTicket = {
                __metadata: { type: 'SP.Data.ListHistoryRequestGoListItem' },
                StatusID: 1, StatusName: "Đã xử lý",
              };
              this.resService.updateListById('ListHistoryRequestGo', dataTicket, this.historyId).subscribe(
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
            this.UpdateStatus(1);
          }
        );
      }
    } catch(err) {
      console.log("try catch AddListTicket error: " + err.message);
      this.closeCommentPanel();
    }
  }

  AddUserCombine() {
    const data = {
      __metadata: { type: 'SP.Data.ListProcessRequestGoListItem' },
      Title: this.itemDoc.NumberGo,
      DateCreated: new Date(),
      DocumentGoID: this.ItemId,
      UserRequestId: this.currentUserId,
      UserApproverId: this.selectedCombiner[this.index].split('|')[0],
      Deadline: this.docServices.checkNull(this.deadline) === '' ? null : this.deadline,
      StatusID: 0,
      StatusName: 'Chờ xử lý',
      Source: '',
      Destination: '',
      TaskTypeCode: 'PH',
      TaskTypeName: 'Phối hợp',
      TypeCode: 'CXL',
      TypeName: 'Chuyển xử lý',
      Content: this.content,
      IndexStep: this.IndexStep + 1,
      Compendium: this.itemDoc.Compendium
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
          'update item ' + this.selectedCombiner[this.index] + ' of approval user to list ListProcessRequestGo successfully!'
        );
        this.index ++;
        if(this.index < this.selectedCombiner.length) {
          this.AddUserCombine();
        }
        else {
          this.index = 0;
          if(this.selectedKnower !== undefined && this.selectedKnower.length > 0) {
            this.AddUserKnow();
          } else {
            this.callbackFunc(this.processId, this.ItemId);
          }
        }
      }
    );
  }

  AddUserKnow() {
    const data = {
      __metadata: { type: 'SP.Data.ListProcessRequestGoListItem' },
      Title: this.itemDoc.NumberGo,
      DateCreated: new Date(),
      DocumentGoID: this.ItemId,
      UserRequestId: this.currentUserId,
      UserApproverId: this.selectedCombiner[this.index].split('|')[0],
      Deadline: this.docServices.checkNull(this.deadline) === '' ? null : this.deadline,
      StatusID: 0,
      StatusName: 'Chờ xử lý',
      Source: '',
      Destination: '',
      TaskTypeCode: 'NĐB',
      TaskTypeName: 'Nhận để biết',
      TypeCode: 'CXL',
      TypeName: 'Chuyển xử lý',
      Content: this.content,
      IndexStep: this.IndexStep + 1,
      Compendium: this.itemDoc.Compendium
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
          'update item' + this.selectedKnower[this.index] + ' of approval user to list ListProcessRequestGo successfully!'
        );
        this.index ++;
        if(this.index < this.selectedKnower.length) {
          this.AddUserKnow();
        }
        else {
          this.callbackFunc(this.processId, this.ItemId);
        }
      }
    );
  }

  UpdateStatus(sts) {
    if(this.ArrayItemId !== undefined && this.ArrayItemId.length > 0) {
      const dataTicket = {
        __metadata: { type: 'SP.Data.ListProcessRequestGoListItem' },
        StatusID: 1, StatusName: "Đã xử lý",
      };
      this.resService.updateListById('ListProcessRequestGo', dataTicket, this.ArrayItemId[this.index].ID).subscribe(
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
            'update item ' + this.ArrayItemId[this.index] + ' of approval user to list ListProcessRequestGo successfully!'
          );
          this.index ++;
          if(this.index < this.ArrayItemId.length) {
            this.UpdateStatus(sts);
          }
          else {
            this.index = 0;
            if(sts === 0) {
              this.callbackFunc(this.processId, this.ItemId);
            } else if(sts === 1) {
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
      Deadline: this.docServices.checkNull(this.deadline) === '' ? null : this.deadline,
      StatusID: 0,
      StatusName: 'Chờ xử lý',
      Content: this.itemDoc.Note,
      IndexStep: this.IndexStep + 1,
      Compendium: this.itemDoc.Compendium,
      StatusApproval: "1_0"
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
        if(this.selectedCombiner !== undefined && this.selectedCombiner.length > 0) {
          this.AddUserCombine();
        } else if(this.selectedKnower !== undefined && this.selectedKnower.length > 0) {
          this.AddUserKnow();
        } else {          
          this.callbackFunc(this.processId, this.ItemId);
        }
      }
    );
  }

  FinishRequest() {
    this.openCommentPanel();
    const data = {
      __metadata: { type: 'SP.Data.ListDocumentGoListItem' },
      StatusID: 1, StatusName: "Đã xử lý",
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
        if(this.historyId > 0) {
          const dataTicket = {
            __metadata: { type: 'SP.Data.ListHistoryRequestGoListItem' },
            StatusID: 1, StatusName: "Đã xử lý",
          };
          this.resService.updateListById('ListHistoryRequestGo', dataTicket, this.historyId).subscribe(
            item => {},
            error => {
              this.closeCommentPanel();
              console.log(
                'error when update item to list ListHistoryRequestGo: ' +
                  error.error.error.message.value
              );
            },
            () => {
              this.UpdateStatus(0);
            }
          );
        } else {
          this.UpdateStatus(0);
        }
      }
    );
  }

  callbackFunc(id, idDocument) {
    if (this.outputFileHandle.length > 0) {
      this.saveItemAttachment(0, 'ListProcessRequestGo', id, this.outputFileHandle, 1);
    }
    else if (this.outputFile.length > 0) {
      this.saveItemAttachment(0, this.listName, id, this.outputFile, 1);
    }
    else if (this.outputFileReturn.length > 0) {
      this.saveItemAttachment(0, 'ListProcessRequestGo', id, this.outputFileReturn, 1);
    }
    else {
      this.closeCommentPanel();
      this.routes.navigate(['/Documnets/documentgo-detail/' + idDocument]);
    }
  }

  gotoBack() {
    window.history.back()
  }

  AddNewComment(template) {
    // this.ListDocument = this.itemDoc;
    // console.log(this.itemDoc);
    // const dialogRef = this.dialog.open(CommentComponent, {
    //   width: '50%', data: [this.ListDocument, this.ListUserChoice]
    // });

    // dialogRef.afterClosed().subscribe(result => {
    //   console.log(`Dialog result: ${result}`);
    //   //Lấy lại thông tin sau khi đóng diglog
    //   this.GetItemDetail();
    //   this.GetHistory();
    //   this.getComment();
    //   // this.callbackfunc();
    // });

    this.bsModalRef = this.modalService.show(template, { class: 'modal-md' });
    this.contentComment ='';
    this.outputFileAddComment = [];
    this.selectedUserComment = null;
  }

  addAttachmentFile(sts) {
    try {
      if(sts === 0) {
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
      } else if(sts === 1) {
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
      } else if(sts === 2) {
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
      }
      else if(sts === 3) {
        const inputNode: any = document.querySelector('#fileAttachmentAddComment');
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
      if(sts === 0) {
        console.log(this.outputFile.indexOf(index))
        this.outputFile.splice(this.outputFile.indexOf(index), 1);
      } else if(sts === 1) {
        console.log(this.outputFileHandle.indexOf(index))
        this.outputFileHandle.splice(this.outputFileHandle.indexOf(index), 1);
      } else if(sts === 2) {
        console.log(this.outputFileReturn.indexOf(index))
        this.outputFileReturn.splice(this.outputFileReturn.indexOf(index), 1);
      } else if(sts === 3) {
        console.log(this.outputFileAddComment.indexOf(index))
        this.outputFileAddComment.splice(this.outputFileAddComment.indexOf(index), 1);
      }
    } catch (error) {
      console.log("removeAttachmentFile error: " + error);
    }
  }

  saveItemAttachment(index, listName, idItem, arr, indexUserComment) {
    try {
      this.buffer = this.getFileBuffer(arr[index]);
      this.buffer.onload = (e: any) => {
        console.log(e.target.result);
        const dataFile = e.target.result;
        this.resService.inserAttachmentFile(dataFile, arr[index].name, listName, idItem).subscribe(
          itemAttach => {
            console.log('inserAttachmentFile success');
          },
          error => console.log(error),
          () => {
            console.log('inserAttachmentFile successfully');
            if (Number(index) < (arr.length - 1)) {
              this.saveItemAttachment((Number(index) + 1), listName, idItem, arr, indexUserComment);
            }
            else {
              arr = [];
              this.closeCommentPanel();
              if (listName == 'ListComments') {
                this.getComment();
                if(indexUserComment!=null && indexUserComment==this.listUserIdSelect.length-1)
                {
                  this.outputFileAddComment = [];
                  this.notificationService.success('Bạn gửi xin ý kiến thành công');
                  this.GetItemDetail();
                  this.GetHistory();
                  this.bsModalRef.hide();
                }
                else{
                  this.outputFile = [];
                  this.notificationService.success('Bạn gửi bình luận thành công');
                }
              }
              else {
                arr = [];
                this.routes.navigate(['/Documnets/documentgo-detail/' + this.ItemId]);
              }

              // if(sts === 1) {
              //  this.routes.navigate(['/Documnets/documentgo-detail/' + this.ItemId]);
              // } else {
              //   this.closeCommentPanel();
              //   this.notificationService.success('Bạn gửi bình luận thành công');
              //   this.getComment();
              // }
            }
          }
        )
      }
    } catch (error) {
      console.log("saveItemAttachment error: " + error);
    }
  }

  CheckUserHandle(code, isCheck) {
    console.log(code);
    if(isCheck) {
      this.ListUserOfDepartment.forEach(element => {
        if(element.Code !== code){
          element.IsHandle = false;
          // element.IsCombine = false;
          // element.IsKnow = false;
        } else {
          this.selectedApprover = element.Code;
          element.IsCombine = false;
          element.IsKnow = false;

          let index = this.selectedCombiner.indexOf(code);
          if(index >= 0){
            this.selectedCombiner.splice(index, 1);
          }

          let index2 = this.selectedKnower.indexOf(code);
          if(index2 >= 0){
            this.selectedKnower.splice(index2, 1);
          }
        }
      })
    } else {
      this.selectedApprover = '';
    }
  }

  CheckUserNotHandle1(code, isCheck) {
    console.log(code);
    if(isCheck){
      this.ListUserOfDepartment.forEach(element => {
        if(element.Code === code){
          if(code.includes('|') && this.selectedCombiner.indexOf(code) < 0) {
            this.selectedCombiner.push(element.Code);
          }
          element.IsHandle = false;
          element.IsKnow = false;

          if(this.selectedApprover === code) {
            this.selectedApprover = '';
          }

          let index2 = this.selectedKnower.indexOf(code);
          if(index2 >= 0){
            this.selectedKnower.splice(index2, 1);
          }
        }       
      }) 
    } else {
      let index = this.selectedCombiner.indexOf(code);
      if(index >= 0){
        this.selectedCombiner.splice(index, 1);
      }
    }   
  }

  CheckUserNotHandle2(code, isCheck) {
    console.log(code);
    if(isCheck){
      this.ListUserOfDepartment.forEach(element => {
        if(element.Code === code){
          if(code.includes('|') && this.selectedKnower.indexOf(code)) {
            this.selectedKnower.push(element.Code);
          }
          element.IsCombine = false;
          element.IsHandle = false;

          if(this.selectedApprover === code) {
            this.selectedApprover = '';
          }
          let index = this.selectedCombiner.indexOf(code);
          if(index >= 0){
            this.selectedCombiner.splice(index, 1);
          }
        }       
      }) 
    } else {
      let index = this.selectedKnower.indexOf(code);
      if(index >= 0){
        this.selectedKnower.splice(index, 1);
      }
    }
  }

  GetTypeCode(code) {
    if(this.docServices.checkNull(code) === '') {
      return '';
    }
    else if(code === "CXL") {
      return 'Chuyển xử lý';
    }
    else if(code === "TL") {
      return 'Trả lại';
    }
    else if(code === "XYK") {
      return 'Xin ý kiến';
    }
  }

  isNotNull(str) {
    return (str !== null && str !== "" && str !== undefined);
  }
 
  getFileBuffer(file) {
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    return reader;
  }

  Reply(i, j) {
    if (j == undefined) {
      this.listCommentParent[i].DisplayReply = "flex";
    }
    else {
      this.listCommentParent[i].children[j].DisplayReply = "flex";
    }
  }

  //luu comment
  SendComment(content,isAddComment, index) {
    try {
      this.openCommentPanel();
      if (this.isNotNull(content)) {
        const dataComment = {
          __metadata: { type: 'SP.Data.ListCommentsListItem' },
          Title: "ListDocumentGo_" + this.ItemId,
          Chat_Comments: content,
          KeyList: "ListDocumentGo_" + this.ItemId,
          ProcessID:isAddComment==true? this.idItemProcess : null,
          UserApproverId:isAddComment==true? this.listUserIdSelect[index]:null,
        }
        if (this.isNotNull(this.pictureCurrent)) {
          Object.assign(dataComment, { userPicture: this.pictureCurrent });
        }
        this.resService.AddItemToList('ListComments', dataComment).subscribe(
          itemComment => {
            this.indexComment = itemComment['d'].Id;
          },
          error =>  {
            console.log(error);
            this.notificationService.error('Bạn gửi bình luận thất bại');
          },
          () => {
            if(isAddComment == false){     
              this.Comments = null;
              if (this.outputFile.length > 0) {
                this.saveItemAttachment(0, this.indexComment, this.outputFile, 'ListComments', null);
              }
              else {
                this.closeCommentPanel();
                this.notificationService.success('Bạn gửi bình luận thành công');
                this.getComment();
              }
            }
            else if(isAddComment == true){  //xin ý kiến
              if (this.outputFileAddComment.length > 0) {
                this.saveItemAttachment(0, this.indexComment, this.outputFileAddComment, 'ListComments', index);
              }
              else {
                this.closeCommentPanel();
                console.log('Bạn gửi xin ý kiến thành công');
                //kt nếu lưu đến người cuối cùng rồi thì đóng modal
                if(index == this.listUserIdSelect.length-1){
                  this.notificationService.success('Bạn gửi xin ý kiến thành công');
                  this.bsModalRef.hide();
                  this.GetHistory();
                  this.getComment();
                }
              }
            }
          }
        )
      }
      else {
        this.closeCommentPanel();
        this.notificationService.warn("Bạn chưa nhập nội dung bình luận");
      }
    } catch (error) {
      console.log("SendComment error: " + error);
    }
  }

  //lưu comment trả lời
  saveCommentReply(i, j) {
    try {
      this.openCommentPanel();
      let content = '';
      if (j == undefined) {
        content = this.listCommentParent[i].Content;
      }
      else {
        content = this.listCommentParent[i].children[j].Content;
      }
      if (this.isNotNull(content)) {
        const dataComment = {
          __metadata: { type: 'SP.Data.ListCommentsListItem' },
          Title: "ListDocumentGo_" + this.ItemId,
          Chat_Comments: content,
          KeyList: "ListDocumentGo_" + this.ItemId,
          ParentID: this.listCommentParent[i].ParentID == null ? this.listCommentParent[i].ID : this.listCommentParent[i].ParentID,
        }
        if (this.isNotNull(this.pictureCurrent)) {
          Object.assign(dataComment, { userPicture: this.pictureCurrent });
        }
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
            if (this.isNotNull(this.listCommentParent[i].ProcessID)) {
              this.updateProcess(this.listCommentParent[i].ProcessID);
            }
            this.getComment();
            // }
          }
        )
      }
      else {
        this.closeCommentPanel();
        alert("Bạn chưa nhập nội dung trả lời");
      }
    } catch (error) {
      console.log("saveCommentReply error: " + error);
    }
  }

  updateProcess(id) {
    try {
      const dataProcess = {
        __metadata: { type: 'SP.Data.ListProcessRequestGoListItem' },
        StatusID: 1,
        StatusName: "Đã cho ý kiến",
      }
      this.resService.updateListById('ListProcessRequestGo', dataProcess, id).subscribe(
        itemComment => {
          //  this.indexComment = itemComment['d'].Id;
        },
        error => console.log(error),
        () => {
          this.GetHistory();
        }
      )

    } catch (error) {
      console.log("saveCommentReply error: " + error);
    }
  }

  listCommentParent = [];
  listCommentChild = [];
  getComment(): void {
    const strComent = `?$select=ID,Chat_Comments,Created,userPicture,ParentID,ProcessID,Author/Title,UserApprover/Id,UserApprover/Title,AttachmentFiles`
      + `&$expand=Author/Id,UserApprover,AttachmentFiles&$filter=KeyList eq 'ListDocumentGo_` + this.ItemId + `'&$orderby=Created asc`
    this.docServices.getItem("ListComments", strComent).subscribe(itemValue => {
      this.listComment = [];
      this.listCommentParent = [];
      let itemList = itemValue["value"] as Array<any>;
      itemList.forEach(element => {
        let picture;
        if (element.userPicture !== null && element.userPicture !== '' && element.userPicture !== undefined) {
          picture = element.userPicture;
        }
        else {
          if(environment.usingMockData) {
            picture = '../../../../' + this.assetFolder + '/default-user-image.png';
          } else {
            this.assetFolder = this.assetFolder.replace('../', '');
            picture = this.assetFolder + '/default-user-image.png';
          }
        }
        if (this.isNotNull(element.AttachmentFiles)) {
          this.AttachmentsComment = [];
          element.AttachmentFiles.forEach(elementss => {
            this.AttachmentsComment.push({
              name: elementss.FileName,
              urlFile: this.urlAttachment + elementss.ServerRelativeUrl
            })
          });
        }
        this.listComment.push({
          ID: element.ID,
          Author:element.Author.Title,//element.UserApprover!=null? (element.Author.Title +'<span> xin ý kiến </span>'+ element.UserApprover.Title):
          Chat_Comments: this.docServices.checkNull(element.Chat_Comments === '') ? 'Ý kiến' : element.Chat_Comments,
          Created: moment(element.Created).format('DD/MM/YYYY HH:mm:ss'),
          userPicture: picture,
          UserApprover:element.UserApprover!=null?element.UserApprover.Title:'',
          XinYKien:' xin ý kiến ',
          ParentID: element.ParentID,
          ProcessID: element.ProcessID,
          itemAttach: this.AttachmentsComment,
          Content: '',
          DisplayReply: "none",
          Reply: true,
        //  fileAttachment:'fileAttachment'+this.listComment.length+1
        })
      })
      this.listComment.forEach(item => {
        if (item.ParentID == null) {
          let lstChild = this.listComment.filter(element => element.ParentID == item.ID);
          if (lstChild == undefined) {
            lstChild = [];
          }
          item.children = lstChild;
          this.listCommentParent.push(item);
        }
      });
    },
    error => {console.log("Load listcomment error: " + error)},
    () => {
      const strSelect = `?$select=*,UserRequest/Title,UserApprover/Id,UserApprover/Title,AttachmentFiles`
      + `&$expand=UserRequest,UserApprover,AttachmentFiles&$filter=DocumentGoID eq '` + this.ItemId + `' and TypeCode ne 'XYK' and TaskTypeCode eq 'XLC'&$orderby=Created asc`
      let picture;
      if(environment.usingMockData) {
        picture = '../../../../' + this.assetFolder + '/default-user-image.png';
      } else {
        this.assetFolder = this.assetFolder.replace('../', '');
        picture = this.assetFolder + '/default-user-image.png';
      }
      this.docServices.getItem("ListProcessRequestGo", strSelect).subscribe(itemValue => {
        let itemList = itemValue["value"] as Array<any>;
        itemList.forEach(element => {      
          if (this.isNotNull(element.AttachmentFiles)) {
            this.AttachmentsComment = [];
            element.AttachmentFiles.forEach(elementss => {
              this.AttachmentsComment.push({
                name: elementss.FileName,
                urlFile: this.urlAttachment + elementss.ServerRelativeUrl
              })
            });
          }
          this.listCommentParent.push({
            ID: element.ID,
            Author:element.UserRequest.Title,
            Chat_Comments: this.docServices.checkNull(element.Content === '') ? 'Chuyển xử lý' : element.Content,
            Created: moment(element.Created).format('DD/MM/YYYY HH:mm:ss'),
            userPicture: picture,
            UserApprover: '',
            XinYKien:'',
            itemAttach: this.AttachmentsComment,
            Content: '',
            DisplayReply: "none",
            Reply: undefined,
          })
        })
      },
      error => {console.log("Load process error: " + error)},
      () => {
        this.listCommentParent.sort(this.compare);
        this.ref.detectChanges();
      })
    })
  }

  compare( a, b ) {
    if ( a.Created < b.Created){
      return -1;
    }
    if ( a.Created > b.Created){
      return 1;
    }
    return 0;
  }

  //xin ý kiến
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
        for(let i = 0; i < this.listUserIdSelect.length; i++){
          this.saveItemListProcess(i);
        }
      }
      else {
        alert("Bạn chưa nhập nội dung xin ý kiến");
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
        NoteBookID: this.itemDoc.ID,
        UserRequestId: this.currentUserId,
        UserApproverId: this.listUserIdSelect[index],
        StatusID: 0,
        StatusName: "Chờ xin ý kiến",
        TypeCode: 'XYK',
        TypeName: 'Xin ý kiến',
        TaskTypeCode: 'XLC',
        TaskTypeName: 'Xử lý chính',
        Content: this.contentComment,
        Compendium: this.itemDoc.Compendium,
      }
      this.resService.AddItemToList('ListProcessRequestGo', dataProcess).subscribe(
        items => {
          console.log(items);
          this.idItemProcess = items['d'].Id;
        },
        error => {console.log(error);
          this.closeCommentPanel();
        },
        () => {
          this.closeCommentPanel();
          this.SendComment(this.contentComment, true, index);
          // gui mail
          const dataSendUser = {
            __metadata: { type: 'SP.Data.ListRequestSendMailListItem' },
            Title: this.listName,
            IndexItem: this.ItemId,
            Step: 1,
            KeyList: this.listName +  '_' + this.ItemId,
            SubjectMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.CommentSubject),
            BodyMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.CommentBody),
            SendMailTo: this.selectedUserComment.split('|')[1],
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
              console.log('Save item success');
            });
        }
      )
    } catch (error) {
      console.log('saveItemListProcess error: ' + error.message);
    }
  }

  addItemSendMail() {
    try {
      // send mail user created
      const dataSendUser = {
        __metadata: { type: 'SP.Data.ListRequestSendMailListItem' },
        Title: this.listName,
        IndexItem: this.ItemId,
        Step: 1,
        KeyList: this.listName +  '_' + this.ItemId,
        SubjectMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.NewEmailSubject),
        BodyMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.NewEmailBody),
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
          console.log('Save item success');

          const dataSendApprover = {
            __metadata: { type: 'SP.Data.ListRequestSendMailListItem' },
            Title: this.listName,
            IndexItem: this.ItemId,
            Step: 1,
            KeyList: this.listName +  '_' + this.ItemId,
            SubjectMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.AssignEmailSubject),
            BodyMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.AssignEmailBody),
            SendMailTo: this.selectedApprover.split('|')[1]
          }
          this.resService.AddItemToList('ListRequestSendMail', dataSendApprover).subscribe(
            itemCarRQ => {
              console.log(itemCarRQ['d']);
            },
            error => {
              console.log(error);
              this.closeCommentPanel();
            },
            () => {
              console.log('Add email success');
              if(this.selectedCombiner.length > 0) {
                this.SendMailCombiner(0);
              }
              if(this.selectedKnower.length > 0) {
                this.SendMailKnower(0);
              }
            }
          )
        }
      )
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
      KeyList: this.listName +  '_' + this.ItemId,
      SubjectMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.AssignEmailSubject),
      BodyMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.AssignEmailSubject),
      SendMailTo: user.split('|')[1],
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
        index ++;
        if(index < this.selectedCombiner.length) {
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
      KeyList: this.listName +  '_' + this.ItemId,
      SubjectMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.AssignEmailSubject),
      BodyMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.AssignEmailSubject),
      SendMailTo: user.split('|')[1],
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
        index ++;
        if(index < this.selectedKnower.length) {
          this.SendMailKnower(index);
        }
      }
    );
  }

  Replace_Field_Mail(FieldMail, ContentMail) {
    try {
      if (this.isNotNull(FieldMail) && this.isNotNull(ContentMail)) {
        let strContent = FieldMail.split(",");
        console.log("ContentMail before: " + ContentMail);
        for (let i = 0; i < strContent.length; i++) {
          switch (strContent[i]) {
            case 'NumberTo':
              ContentMail = ContentMail.replace("{" + strContent[i] + "}", this.itemDoc.NumberGo);
              break;
            case 'Compendium':
              ContentMail = ContentMail.replace("{" + strContent[i] + "}", this.docServices.checkNull(this.itemDoc.Compendium));
              break;
            case 'Content':
              ContentMail = ContentMail.replace("{" + strContent[i] + "}", this.docServices.checkNull(this.content));
              break;
            case 'UserRequest':
              ContentMail = ContentMail.replace("{" + strContent[i] + "}", this.currentUserName);
              break;
            case 'ContentComment':
              ContentMail = ContentMail.replace("{" + strContent[i] + "}", this.contentComment);
              break;
            case 'userComment':
              ContentMail = ContentMail.replace("{" + strContent[i] + "}", this.selectedUserComment.split('|')[2]);
              break;
            case 'Author':
              ContentMail = ContentMail.replace("{" + strContent[i] + "}", this.currentUserName);
              break;
            case 'userStep':
              ContentMail = ContentMail.replace("{" + strContent[i] + "}", this.UserAppoverName);
              break;
            case 'UserApprover':
              ContentMail = ContentMail.replace("{" + strContent[i] + "}", this.UserAppoverName);
              break;
            case 'ItemUrl':
              ContentMail = ContentMail.replace("{" + strContent[i] + "}", window.location.href.split('#/')[0]+ '#/Documnets/documentgo-detail/' + this.ItemId);
              break;
            case 'TaskUrl':
              ContentMail = ContentMail.replace("{" + strContent[i] + "}", window.location.href.split('#/')[0] + '#/Documnets/documentgo-detail/' + this.ItemId + '/' + (this.IndexStep + 1));
              break;
            case 'HomeUrl':
              ContentMail = ContentMail.replace("{" + strContent[i] + "}", window.location.href.split('#/')[0] + '#/Documnets/documentgo');
              break;
          }
        }
        console.log("ContentMail after: " + ContentMail);
        return ContentMail;
      }
      else {
        console.log("Field or Body email is null or undefined ")
      }
    }
    catch (err) {
      console.log("Replace_Field_Mail error: " + err.message);
    }
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

  FormatNumberGo() {
    this.numberGo = this.docServices.formatNumberGo(this.numberGo);
  }

  ChangeNumberGo() {
    this.numberOfSymbol = this.numberGo + '/Văn bản đi';
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


