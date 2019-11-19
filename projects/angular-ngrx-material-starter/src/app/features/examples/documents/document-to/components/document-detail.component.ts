import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  ViewContainerRef,
  TemplateRef,
  ViewRef
} from '@angular/core';
import {
  IncomingDoc,
  AttachmentsObject,
  IncomingDocService,
  IncomingTicket
} from '../incoming-doc.service';
import {PlatformLocation} from '@angular/common';
import { filter, pairwise } from 'rxjs/operators';
import { environment } from '../../../../../../environments/environment';
import {RotiniPanel} from './document-add.component';
import {ResApiService} from '../../../services/res-api.service';
import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ActivatedRoute, Router, RoutesRecognized } from '@angular/router';
import { MatPaginator } from '@angular/material/paginator';
import {SelectionModel} from '@angular/cdk/collections';
import { MatTableDataSource } from '@angular/material';
import * as moment from 'moment';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import {
  ROUTE_ANIMATIONS_ELEMENTS,
  NotificationService
} from '../../../../../core/core.module';
import { IncomingDocumentComponent } from './incoming-document.component';
import { Observable, of as observableOf, from} from 'rxjs';

export interface PeriodicElement {
  name: string;
  position: number;
  process: boolean;
  combine: boolean;
  know: boolean
}

const ELEMENT_DATA: PeriodicElement[] = [
  {position: 1, name: 'Hydrogen', process: false, combine: false, know: false},
  {position: 2, name: 'Helium', process: false, combine: false, know: false},
  {position: 3, name: 'Lithium', process: false, combine: false, know: false},
];

export class UserOfDepartment {
  STT: Number;
  IsDepartment: boolean;
  Code: string;
  Name: string;
  Role: string;
  IsHandle: boolean;
  IsCombine: boolean;
  IsKnow : boolean;
  Icon: string;
  Class: string;
  isPerson:any
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

export class UserChoice {
  STT: Number;
  Id: Number;
  Email: string;
  DisplayName: string;
  DeCode: string;
  DeName: string;
  RoleCode: string;
  RoleName: string;
}

@Component({
  selector: 'anms-document-detail',
  templateUrl: './document-detail.component.html',
  styleUrls: ['./document-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentDetailComponent implements OnInit {
  bsModalRef: BsModalRef;
  itemDoc;
  isCheckPermission;
  IsDeadline;
  deadlineDoc;
  isExecution;
  isCombine;
  isFinish;
  isReturn;
  isRetrieve;
  isAddDocGo;
  ArrayItemId = []; IncomingDocID;
  ArrCurrentRetrieve: UserRetieve[] = [];
  ArrayIdRetrieve = [];
  IndexStep = 0;
  currentDepartment = '';
  DepartmentCode = [];
  RoleCode = [];
  ListDepartment = [];
  ListUserApprover = [];
  ListHistoryId = [];
  ListUserChoice: UserChoice[] = [];
  ListAllUser: Observable<UserChoice[]>;
  ListUserOfDepartment: UserOfDepartment[] = [];
  ListUserCombine = [];
  ListUserKnow = [];
  currentUserId = 0;
  assetFolder = environment.assetFolder;
  currentUserName = '';
  currentUserEmail = '';
  RoleApprover = [];
  RoleCombine = [];
  RoleKnow = [];
  ItemAttachments = [];
  urlAttachment = environment.proxyUrl.split('/sites/', 1);
  listName = 'ListDocumentTo';
  outputFile = [];
  outputFileHandle = [];
  outputFileReturn = [];
  displayFile = '';
  closeResult = '';
  ContentReply = '';
  imgUserDefault = '../../../../' + this.assetFolder + '/img/profile.jpg'
  historyId = 0;
  processId = 0;
  buffer;
  index = 0;
  totalStep = 0;
  currentStep = 0;
  IsGD; IsTP; IsVT; IsNV
  overlayRef;
  selectedKnower = []; selectedCombiner = []; selectedApprover;
  UserAppoverName = '';
  currentRoleTask = '';
  EmailConfig;
  ReasonReturn;
  content;deadline;
  ReasonRetrieve;
  AuthorComment;
  Retieved = false;
  IsFinishItem = false;
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
  dataSource = new MatTableDataSource<IncomingTicket>();
  // @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  private paginator: MatPaginator;

  @ViewChild(MatPaginator, { static: true }) set matPaginator(mp: MatPaginator) {
    this.paginator = mp;
    this.dataSource.paginator = this.paginator;
  }

  displayedColumns2 = ['person', 'role', 'process', 'combine', 'know'];
  displayedColumns3: string[] = ['stt', 'select', 'department', 'role', 'name', 'type']; // 'userId'
  //dataSource2 = ELEMENT_DATA;
  dataSource2 = new MatTableDataSource<UserOfDepartment>();
  dataSource3 = new MatTableDataSource<UserRetieve>();
  selection = new SelectionModel<UserRetieve>(true, []);

  constructor(
    private docTo: IncomingDocService,
    private services: ResApiService,
    private route: ActivatedRoute,
    private routes: Router,
    private readonly notificationService: NotificationService,
    private ref: ChangeDetectorRef,
    private modalService: BsModalService,
    public overlay: Overlay, 
    public viewContainerRef: ViewContainerRef,
    private location: PlatformLocation,
    private incoming: IncomingDocumentComponent
  ) {
    this.location.onPopState(() => {
      console.log('Init: pressed back!');
      window.location.reload(); 
      return;
    });
  }

  ngOnInit() {
    this.route.paramMap.subscribe(parames => {
      this.IncomingDocID = this.docTo.CheckNullSetZero(parames.get('id'));
      this.IndexStep = this.docTo.CheckNullSetZero(parames.get('step'));
      this.currentStep = this.IndexStep;
    });
    this.getCurrentUser();
    this.incoming.isAuthenticated$ = false;
  }

   /** Whether the number of selected elements matches the total number of rows. */
   isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource3.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected() ?
        this.selection.clear() :
        this.dataSource3.data.forEach(row => this.selection.select(row));
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: UserRetieve): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.stt + 1}`;
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

  OpenRotiniPanel() {
    let config = new OverlayConfig();
    config.positionStrategy = this.overlay
      .position()
      .global()
      .centerVertically()
      .centerHorizontally();
    config.hasBackdrop = true;
    this.overlayRef = this.overlay.create(config);
    this.overlayRef.attach(
    new ComponentPortal(RotiniPanel, this.viewContainerRef)
    );
  }

  CloseRotiniPanel() {
    if(this.overlayRef !== undefined) {
      this.overlayRef.dispose();
    }
  }

  myFilter = (d: Date): boolean => {
    const day = d;
    // Prevent Saturday and Sunday from being selected.
    return day >= moment().subtract(1, 'day').toDate();
  }

  GetTotalStep() {
    this.services.getListTotalStep('DT').subscribe(items => {
      let itemList = items['value'] as Array<any>;
      if(itemList.length > 0){
        this.totalStep = itemList[0].TotalStep;          
      }
    },
    error => {
      console.log("Load total step error: " + error);
      this.CloseRotiniPanel();
    },
    () => {
      if(this.IndexStep >= this.totalStep) {
        if(this.currentRoleTask === "XLC") {
          this.isExecution = false;
          this.isFinish = true;
        } else if(this.currentRoleTask === "PH") {
          this.isExecution = false;
          this.isFinish = false;
        } else {
          this.isExecution = false;
          this.isFinish = false;
        }       
      } else if(this.IndexStep > 0){    
        if(this.currentRoleTask === "XLC") {
          this.isExecution = true;
          this.isAddDocGo = true;
          if(this.IsTP || this.IsGD) {
            this.isFinish = true;
          } else if(this.IsNV){
            this.isFinish = false;
          }
        } else if(this.currentRoleTask === "PH") {
          this.isExecution = false;
          this.isFinish = false;
          this.isCombine = true;
        } else {
          this.isExecution = false;
          this.isFinish = false;
          this.isCombine = false;
        }
      }
      this.GetItemDetail();
      this.getComment();
      this.GetAllUser();
    })
  }

  GetItemDetail() {  
    //this.OpenRotiniPanel();       
    // Load thong tin van ban
    this.docTo.getListDocByID(this.IncomingDocID).subscribe(items => {
      console.log('items: ' + items);
      this.ItemAttachments=[];
      let itemList = items['value'] as Array<any>;
      // if(this.docTo.CheckNull(itemList[0].ListUserApprover).indexOf(this.currentUserId + '_' + this.currentUserName) < 0) {
      //   this.notificationService.info("Bạn không có quyền truy cập");
      //   this.routes.navigate(['/']);
      // }
      if(itemList.length > 0){
        if (itemList[0].AttachmentFiles.length > 0) {
          itemList[0].AttachmentFiles.forEach(element => {
            this.ItemAttachments.push({
              name: element.FileName,
              urlFile: this.urlAttachment + element.ServerRelativeUrl + '?web=1',
              linkdown: this.urlAttachment + element.ServerRelativeUrl,
            });
          });
        }
        this.UserAppoverName = itemList[0].ListUserApprover;
        if(this.docTo.CheckNull(itemList[0].Deadline) === '' && itemList[0].IsResponse === 1 && this.IndexStep === 2) {
          this.IsDeadline = true;
        } else if(this.docTo.CheckNull(itemList[0].Deadline) !== '') {
          this.deadlineDoc = itemList[0].Deadline;
        }
        this.itemDoc = {
          ID: itemList[0].ID,
          bookType: itemList[0].BookTypeName,
          numberTo: this.docTo.formatNumberTo(itemList[0].NumberTo),
          numberToSub:
            itemList[0].NumberToSub === 0 ? '' : itemList[0].NumberToSub,
          numberOfSymbol: itemList[0].NumberOfSymbol,
          source: itemList[0].Source,
          docType: itemList[0].DocTypeName,
          promulgatedDate:
            this.docTo.CheckNull(itemList[0].PromulgatedDate) === ''
              ? ''
              : moment(itemList[0].PromulgatedDate).format('DD/MM/YYYY'),
          dateTo:
            this.docTo.CheckNull(itemList[0].DateTo) === ''
              ? ''
              : moment(itemList[0].DateTo).format('DD/MM/YYYY'),
          compendium: itemList[0].Compendium,
          secretLevel: itemList[0].SecretLevelName,
          urgentLevel: itemList[0].UrgentLevelName,
          secretLevelId: itemList[0].SecretLevelID,
          urgentLevelId: itemList[0].UrgentLevelID,
          deadline: this.docTo.CheckNull(itemList[0].Deadline) === ''
          ? null
          : itemList[0].Deadline,
          deadlineShow:
            this.docTo.CheckNull(itemList[0].Deadline) === ''
              ? ''
              : moment(itemList[0].Deadline).format('DD/MM/YYYY'),
          numberOfCopies: this.docTo.SetEmpty(itemList[0].NumOfCopies),
          methodReceipt: itemList[0].MethodReceipt,
          authorId: itemList[0].Author.Id,
          userHandle:
            itemList[0].UserOfHandle !== undefined
              ? itemList[0].UserOfHandle.Title
              : '',
          note: itemList[0].Note,
          isResponse: itemList[0].IsResponse === 0 ? 'Không' : 'Có',
          isSendMail: 'Có',
          isRetrieve: itemList[0].IsRetrieve === 0 ? 'Không' : 'Có',
          signer: itemList[0].Signer,
          authorName: itemList[0].Author.Title,
          authorEmail: itemList[0].Author.Name.split('|')[2]
        };
      }
      if (!(this.ref as ViewRef).destroyed) {
        this.ref.detectChanges();  
      }  
      this.CloseRotiniPanel();
    },
    error => {
      console.log("Load item detail : " + error);
      this.CloseRotiniPanel();
    },
    () => {
      if(this.isCheckPermission === false && this.itemDoc.authorId !== this.currentUserId) {
        this.CloseRotiniPanel();
        this.notificationService.info("Bạn không có quyền truy cập");
        this.routes.navigate(['/']);
      }
      this.CloseRotiniPanel();
      this.GetHistory();
    }
    );
  }

  CheckPermission() {
    let strSelect = '';
    if(this.IndexStep > 0) {
      strSelect = `' and NoteBookID eq '` + this.IncomingDocID + `' and IndexStep eq '` + this.IndexStep + `'`;
    } else {
      strSelect = `' and NoteBookID eq '` + this.IncomingDocID + `'`;
    }
    let strFilter = `&$filter=UserApprover/Id eq '` + this.currentUserId + strSelect;
    this.docTo.getListRequestTo(strFilter).subscribe((itemValue: any[]) => {
      let item = itemValue["value"] as Array<any>; 
      if(item.length <= 0) {
        // this.notificationService.info("Bạn không có quyền truy cập");
        // this.routes.navigate(['/']);
        this.isCheckPermission = false;
      } else {
        this.isCheckPermission = true;
        if(this.IndexStep > 0) {
          //let _item = item.indexOf(i => i.IndexStep == this.IndexStep);
          //if(_item >= 0) {
            this.currentRoleTask = item[0].TaskTypeCode;
            if(item[0].StatusID === 1) {
              this.routes.navigate(['Documents/IncomingDoc/docTo-detail/' + this.IncomingDocID]);
            }
          // } else {
          //   this.routes.navigate(['Documents/IncomingDoc/docTo-detail/' + this.IncomingDocID]);
          // }
        }
      }
    },
    error => {
      console.log("Check permission failed") ;
      this.CloseRotiniPanel();
    },
    () => {
     console.log("Check permission success");
     this.GetTotalStep();
    })
  }

  GetHistory() {
    // this.OpenRotiniPanel();
    this.docTo
      .getListRequestByDocID(this.IncomingDocID)
      .subscribe((itemValue: any[]) => {
        let item = itemValue['value'] as Array<any>;
        this.ListItem = [];
        let retrieveValid = false;
        let indexValid = 0;
        let retrieveInValid = false;
        let indexInvald = 0;
        item.forEach(element => {
          if(element.IndexStep === this.IndexStep) {
            // if(element.TypeCode === "TL") {
            if(this.IndexStep <= 1) {
              this.isReturn = false;
            } else {
              this.isReturn = true;
            }
          }
          // Check để hiển thị button thu hồi
          if(this.docTo.CheckNullSetZero(this.IndexStep) === 0) {
            if(element.UserApprover.Id === this.currentUserId && element.TaskTypeCode === "XLC" && element.StatusID === 1) {
              retrieveValid = true;
              indexValid = element.IndexStep;
            }
            if(element.UserApprover.Id === this.currentUserId && element.TaskTypeCode === "XLC" && element.StatusID === 0) {
              retrieveInValid = true;
              retrieveInValid = element.IndexStep;
            }
          }

          if(element.IsFinished === 1) {
            this.isRetrieve = false;
          }
          this.ListItem.push({
            STT: this.ListItem.length + 1,
            ID: element.ID,
            documentID: element.NoteBookID,
            compendium: element.Compendium,
            userRequest: (element.IndexStep === 1 && element.TypeCode === "CXL")?
              this.docTo.CheckNull(element.Source) :
              (element.UserRequest !== undefined ? element.UserRequest.Title : ''),
            userRequestId: element.UserRequest !== undefined ? element.UserRequest.Id : 0,
            userApprover:
              element.UserApprover !== undefined
                ? element.UserApprover.Title
                : '',
            userApproverId:
              element.UserApprover !== undefined
                ? element.UserApprover.Id
                : 0,
            userApproverEmail:
              element.UserApprover !== undefined
                ? element.UserApprover.Name.split('|')[2]
                : '',
            deadline:
              this.docTo.CheckNull(element.Deadline) === ''
                ? ''
                : moment(element.Deadline).format('DD/MM/YYYY'),
            status: this.getStatusName(element.StatusID),
            statusId: element.StatusID,
            source: this.docTo.CheckNull(element.Source),
            destination: this.docTo.CheckNull(element.Destination),
            roleRequest: this.docTo.CheckNull(element.RoleUserRequest),
            roleApprover: this.docTo.CheckNull(element.RoleUserApprover),
            taskTypeCode: element.TaskTypeCode,
            taskType: element.TaskTypeCode === 'XLC'? (element.TypeCode === "XYK" ? '' : "Xử lý chính") : element.TaskTypeCode === 'PH'? 'Phối hợp' : 'Nhận để biết',
            typeCode: this.GetTypeCode(element.TypeCode),
            content: this.docTo.CheckNull(element.Content),
            indexStep: element.IndexStep,
            created: (element.IndexStep === 1 && element.TypeCode === "CXL") ?
            (this.docTo.CheckNull(this.itemDoc.dateTo) === '' ? moment(element.DateCreated).format('DD/MM/YYYY') : this.itemDoc.dateTo) : moment(element.DateCreated).format('DD/MM/YYYY'),
            numberTo: element.Title,
            link: '',
            stsClass: this.getStatusColor(element.StatusID),
            stsTypeCode: element.TypeCode,
            stsTaskCode: element.TaskTypeCode
          });
        });
        this.dataSource = new MatTableDataSource<IncomingTicket>(this.ListItem);     
        this.dataSource.paginator = this.paginator;
        this.ArrayItemId = this.ListItem.filter(e => e.indexStep === this.IndexStep && e.stsTypeCode !== "XYK");
        if(this.IndexStep < 1 && retrieveInValid === false) {
          this.isRetrieve = true;
          this.currentStep = indexValid;
        } else {
          this.isRetrieve = undefined;
          this.currentStep = indexInvald;
        }
      },
      error => {
        console.log("Load history item: " + error);
        this.CloseRotiniPanel();
      },
      () => {
        // this.CloseRotiniPanel();
        this.ArrCurrentRetrieve = [];
        this.ListItem.forEach(element => {
          // if((element.indexStep === this.currentStep && element.stsTypeCode === "XYK") || (element.indexStep === (this.currentStep + 1) && element.stsTypeCode === "CXL")) {
          if(element.indexStep === (this.currentStep + 1)) {
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
        this.dataSource3 = new MatTableDataSource<UserRetieve>(this.ArrCurrentRetrieve);     
        this.dataSource3.paginator = this.paginator;
        if (!(this.ref as ViewRef).destroyed) {
          this.ref.detectChanges();  
        }  

        let strFilter = ` and IndexStep eq '` + this.IndexStep + `'`;
        this.docTo.getHistoryStep(this.IncomingDocID, strFilter).subscribe((itemValue: any[]) => {
          let item = itemValue['value'] as Array<any>;
          if(item.length > 0) {
            this.historyId = item[0].ID;
          }
        },
        error => {
          console.log("Load history id item: " + error);
          this.CloseRotiniPanel();
        })
      }
      );
  }

  // Load all user approval
  GetAllUser() {
    this.services.getList('ListDepartment').subscribe((itemValue: any[]) => {
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
      this.docTo.getAllUser().subscribe((itemValue: any[]) => {
        let item = itemValue['value'] as Array<any>;
        let ListDe = [];
        this.ListUserChoice = [];
        item.forEach(element => {
          if(this.IsGD || this.IsVT) {
            if(this.ListUserChoice.findIndex(i => i.Id === element.User.Id) < 0) {
              this.ListUserChoice.push({
                STT: this.ListUserChoice.length + 1,
                Id: element.User.Id,
                DisplayName: element.User.Title,
                Email: element.User.Name.split('|')[2],
                DeCode: element.DepartmentCode,
                DeName: element.DepartmentName,
                RoleCode: element.RoleCode,
                RoleName: element.RoleName
              });
            }
            if(ListDe.indexOf(element.DepartmentCode) < 0) {
              ListDe.push(element.DepartmentCode);
            }
          } else {
            if(element.DepartmentCode === this.currentDepartment) {            
              this.ListUserChoice.push({
                STT: this.ListUserChoice.length + 1,
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
            }
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
          })
          this.ListUserChoice.forEach(user => {
            if(user.DeCode === element) {
              this.ListUserOfDepartment.push({
                IsDepartment: false,
                STT: user.STT,
                Code: user.Id + '|' + user.Email + '|' + user.DisplayName,
                Name: user.DisplayName,
                Role: user.RoleName,
                IsHandle: false,
                IsCombine: false,
                IsKnow: false,
                Icon: 'person',
                Class: 'user-choice',
                isPerson: true
              })
            }
          })
        })       
      },
      error => {
        console.log("Load all user error " + error);
        this.CloseRotiniPanel();
      },
      () =>{
        console.log("List User " + this.ListUserOfDepartment);
        this.dataSource2 = new MatTableDataSource<UserOfDepartment>(this.ListUserOfDepartment);
        if (!(this.ref as ViewRef).destroyed) {
          this.ref.detectChanges();  
        }      
        this.ListAllUser = observableOf(this.ListUserChoice)
      }
      )
    })
  }

  gotoBack() {
    window.history.back();
  }

  getCurrentUser(){
    this.OpenRotiniPanel();
    this.services.getCurrentUser().subscribe(
      itemValue => {
          this.currentUserId = itemValue["Id"];
          this.currentUserName = itemValue["Title"];
          this.currentUserEmail = itemValue["Email"];
        },
      error => { 
        console.log("error: " + error);
      },
      () => {
        this.CheckPermission();
        console.log("Current user email is: \n" + "Current user Id is: " + this.currentUserId + "\n" + "Current user name is: " + this.currentUserName );
        this.services.getDepartmnetOfUser(this.currentUserId).subscribe(
          itemValue => {
            let item = itemValue['value'] as Array<any>;
            if(item.length > 0) {
              this.DepartmentCode = [];
              this.RoleCode = [];
              item.forEach(element => {
                this.DepartmentCode.push(element.DepartmentCode);
                this.RoleCode.push(element.RoleCode);
                if(element.RoleCode === "TP") {
                  this.IsTP = true;
                  this.currentDepartment = element.DepartmentCode;
                }
                else if (element.RoleCode === "GĐ") {
                  this.IsGD = true;
                }
                else if (element.RoleCode === "VT") {
                  this.IsVT = true;
                  this.incoming.isAuthenticated$ = true;
                }
                else if (element.RoleCode === "NV") {
                  this.currentDepartment = element.DepartmentCode;
                  this.IsNV = true;
                }
              });   
              this.getListEmailConfig();
            } else {
              this.notificationService.info("Bạn không có quyền truy cập");
              this.routes.navigate(['/']);
            }
          },
          error => { 
            console.log("Load department code error: " + error);
            this.CloseRotiniPanel();
          },
          () => {   
            this.CloseRotiniPanel();        
          }
        )
      }
      );
  }

  AddNewComment(template: TemplateRef<any>) {
    // this.notificationService.info('Chờ xin ý kiến');
    this.bsModalRef = this.modalService.show(template, { class: 'modal-md' });
    this.contentComment ='';
    this.outputFileAddComment = [];
    this.selectedUserComment = null;
  }

  NextApprval(template: TemplateRef<any>) {
    //this.notificationService.warn('Chọn người xử lý tiếp theo');
    this.bsModalRef = this.modalService.show(template, {class: 'modal-lg'});
  }

  ReturnRequest(template: TemplateRef<any>) {
    //this.notificationService.warn('Chọn phòng ban để trả lại');
    this.bsModalRef = this.modalService.show(template, {class: 'modal-md'});
    let strFilter = ` and IndexStep ge '` + this.currentStep + `'`;
    this.docTo.getHistoryStep(this.IncomingDocID, strFilter).subscribe((itemValue: any[]) => {
      let item = itemValue['value'] as Array<any>;
      this.ListHistoryId = [];
      item.forEach(element => {
        if(this.ListHistoryId.indexOf(element.ID) < 0) {
          this.ListHistoryId.push(element.ID);
        }
      });     
    },
    error => {
      console.log("Load history id item: " + error);
      this.CloseRotiniPanel();
    })
  }

  ViewHistory(template: TemplateRef<any>) {
    this.notificationService.warn("Xem luồng có ở bản verson 2");
    // this.bsModalRef = this.modalService.show(template, {class: 'modal-lg'});
  }

  getListEmailConfig() {
    const str = `?$select=*&$filter=Title eq 'DT'`;
    this.EmailConfig = null;
    this.services.getItem('ListEmailConfig', str).subscribe((itemValue: any[]) => {
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
            CommentBody:element.CommentRequestBody,
            ReplyCommentSubject: element.ReplyCommentSubject,
            ReplyCommentBody: element.ReplyCommentBody,
            ReturnEmailSubject: element.ReturnRequestSubject,
            ReturnEmailBody: element.ReturnRequestBody,
            RetrieveEmailSubject: element.RetrieveRequestSubject,
            RetrieveEmailBody: element.RetrieveRequestBody,
            OutOfDateSubject: element.OutOfDateSubject,
            OutOfDateBody:element.OutOfDateBody,
          }
      })
      }
    });
  }

  GetUserApprover() {
    let strFilterApprover = `&$filter=RoleCode eq '` + this.RoleApprover[0] + `'`;
    if(this.RoleApprover.length > 1) {
      strFilterApprover = `&$filter=(`;
      this.RoleApprover.forEach(element => {
        strFilterApprover += ` RoleCode eq '` + element + `' or`;
      })
      strFilterApprover = strFilterApprover.substr(0, strFilterApprover.length-2) + `)`;
    }
    if(this.RoleCode.indexOf('VT') < 0 && this.RoleCode.indexOf('GĐ') < 0 && (this.RoleApprover.includes('NV') || this.RoleApprover.includes('TP'))) {
      strFilterApprover += `and (`;
      this.DepartmentCode.forEach(element => {
        strFilterApprover += ` DepartmentCode eq '` + element + `' or`;
      })
      strFilterApprover = strFilterApprover.substr(0, strFilterApprover.length-2) + `)`;
    }
    this.services.getUserByRole2(strFilterApprover).subscribe(valueItem => {
      let item = valueItem['value'] as Array<any>;
      this.ListUserApprover = [];
      item.forEach(element => {
        this.ListUserApprover.push({
          DepartmentCode: element.DepartmentCode,
          DepartmentName: element.DepartmentName,
          UserId: element.User.Id,
          UserName: element.User.Title,
          UserEmail: element.User.Name.split('|')[2]
        })        
      })
    });

    let strFilterCombine = `&$filter=(`;
    if(this.RoleCombine.length >= 1) {
      this.RoleCombine.forEach(element => {
        strFilterCombine += ` RoleCode eq '` + element + `' or`;
      })
      strFilterCombine = strFilterCombine.substr(0, strFilterCombine.length-2) + `)`;
    }
    this.services.getUserByRole2(strFilterCombine).subscribe(valueItem => {
      let item = valueItem['value'] as Array<any>;
      this.ListUserCombine = [];
      item.forEach(element => {
        this.ListUserCombine.push({
          DepartmentCode: element.DepartmentCode,
          DepartmentName: element.DepartmentName,
          UserId: element.User.Id,
          UserName: element.User.Title,
          UserEmail: element.User.Name.split('|')[2]
        })        
      })
    });

    let strFilterKnow = `&$filter=(`;
    if(this.RoleKnow.length >= 1) {
      this.RoleKnow.forEach(element => {
        strFilterKnow += ` RoleCode eq '` + element + `' or`;
      })
      strFilterKnow = strFilterKnow.substr(0, strFilterKnow.length-2) + `)`;
    }
    this.services.getUserByRole2(strFilterKnow).subscribe(valueItem => {
      let item = valueItem['value'] as Array<any>;
      this.ListUserKnow = [];
      item.forEach(element => {
        this.ListUserKnow.push({
          DepartmentCode: element.DepartmentCode,
          DepartmentName: element.DepartmentName,
          UserId: element.User.Id,
          UserName: element.User.Title,
          UserEmail: element.User.Name.split('|')[2]
        })        
      })
    });
  }

  // Thu hồi
  AddTicketRetrieve() {
    // DateRetrieve 
    const length = this.selection.selected.length;
    if(length > 0) {
      this.OpenRotiniPanel();
      for(let i = 0; i < length; i++) {
        if(this.ArrayIdRetrieve.indexOf(e => e.Id === this.selection.selected[i].Id) < 0) {
          this.ArrayIdRetrieve.push({ Id: this.selection.selected[i].Id, Email: this.selection.selected[i].Email, Name: this.selection.selected[i].Name});
        }
        if(this.selection.selected[i].TaskTypeCode === "XLC" || this.selection.selected[i].TaskTypeCode === "XYK") {
          this.Retieved = true;
          this.ListItem.forEach(element => {
            if((element.stsTypeCode === "XYK" && element.indexStep >= this.currentStep) 
            || (element.stsTypeCode === "CXL" && element.indexStep > this.currentStep) ) {
              if(this.ArrayIdRetrieve.indexOf(e => e.Id === element.ID) < 0) {
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
      if(this.ArrayIdRetrieve !== undefined && this.ArrayIdRetrieve.length > 0) {
        let request;
        request = this.ListUserChoice.find(item => item.Id === this.docTo.CheckNullSetZero(this.currentUserId));

        const dataTicket = {
          __metadata: { type: 'SP.Data.ListProcessRequestToListItem' },
          StatusID: -1, StatusName: "Đã thu hồi",
          DateRetrieve: new Date(), Content: this.docTo.CheckNull(this.ReasonRetrieve) === '' ? '' : this.ReasonRetrieve,
          UserRetrieveId: this.currentUserId
        };
        if(request !== undefined) {
          Object.assign(dataTicket, { Source: request.DeName});
        }
        this.services.updateListById('ListProcessRequestTo', dataTicket, this.ArrayIdRetrieve[index].Id).subscribe(
          item => {},
          error => {
            this.CloseRotiniPanel();
            console.log(
              'error when update item to list ListProcessRequestTo: ' +
                error.error.error.message.value
            ),
              this.notificationService.error('Thu hồi văn bản thất bại');
          },
          () => {
            console.log(
              'update item ' + this.ArrayIdRetrieve[index].Id + ' of approval user to list ListProcessRequestTo successfully!'
            );
            const dataSendUser = {
              __metadata: { type: 'SP.Data.ListRequestSendMailListItem' },
              Title: this.listName,
              IndexItem: this.IncomingDocID,
              Step: this.currentStep,
              KeyList: this.listName +  '_' + this.IncomingDocID,
              SubjectMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.RetrieveEmailSubject, this.ArrayIdRetrieve[index].Name),
              BodyMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.RetrieveEmailBody, this.ArrayIdRetrieve[index].Name),
              SendMailTo: this.ArrayIdRetrieve[index].Email,
            }
            this.services.AddItemToList('ListRequestSendMail', dataSendUser).subscribe(
              itemRoomRQ => {
                console.log(itemRoomRQ['d']);
              },
              error => {
                console.log(error);
                this.CloseRotiniPanel();
              },
              () => {
                console.log('Save item success and send mail success');
                index ++;
                if(index < this.ArrayIdRetrieve.length) {
                  this.UpdateTicketRetrieve(index);
                }
                else {
                  if(this.Retieved) {
                    if(this.ListHistoryId.length > 0) {
                      this.DeleteHistoryRetrieve(0);
                    } else {
                      this.callbackRetrieve();
                    }
                  } else {
                    this.bsModalRef.hide();
                    this.CloseRotiniPanel();
                    this.notificationService.success('Thu hồi văn bản thành công');
                  }
                }
            });           
          }
        );
      }
    } catch(err) {
      console.log("update ticket retrieve failed");
      this.CloseRotiniPanel();
    }
  }

  DeleteHistoryRetrieve(index) {
    const data = {
      __metadata: { type: 'SP.Data.ListHistoryRequestToListItem' },
    }
    this.services.DeleteItemById('ListHistoryRequestTo', data, this.ListHistoryId[index]).subscribe(item => {},
    error => {
      this.CloseRotiniPanel();
      console.log(
        'error when delete item to list ListHistoryRequestTo: ' + error
      ),
      console.log('Xóa lịch sử thất bại');
    },
    () => {
      console.log(
        'Delete item in list ListHistoryRequestTo successfully!'
      );
      console.log('Xóa lịch sử thành công');
      index ++;
      if(index < this.ListHistoryId.length) {
        this.DeleteHistoryRetrieve(index);
      } else {
        this.callbackRetrieve();
      }
    })
  }

  callbackRetrieve() {
    let itemUpdate = this.ListItem.find(item => item.indexStep === (this.currentStep + 1) && item.taskTypeCode === "XLC");
    if(itemUpdate !== undefined) {
      const data = {
        __metadata: { type: 'SP.Data.ListProcessRequestToListItem' },
        Title: this.itemDoc.numberTo,
        DateCreated: new Date(),
        NoteBookID: this.IncomingDocID,
        UserRequestId: itemUpdate.userApproverId,
        UserApproverId: this.currentUserId,
        Deadline: this.docTo.CheckNull(this.deadline) === '' ? (this.docTo.CheckNull(this.itemDoc.deadline) === '' ? null : this.itemDoc.deadline) : this.deadline,
        StatusID: 0,
        StatusName: 'Chờ xử lý',
        Source: this.docTo.CheckNull(itemUpdate.destination),
        Destination: this.docTo.CheckNull(itemUpdate.source),
        RoleUserRequest :itemUpdate.roleApprover,
        RoleUserApprover: itemUpdate.roleRequest,
        TaskTypeCode: 'XLC',
        TaskTypeName: 'Xử lý chính',
        TypeCode: 'TH',
        TypeName: 'Phiếu thu hồi',
        Content: this.docTo.CheckNull(this.ReasonRetrieve),
        IndexStep: this.currentStep,
        Compendium: this.itemDoc.compendium,
        Flag: this.itemDoc.urgentLevelId > 1 || this.itemDoc.secretLevelId > 1 ? 1 : 0
      };   

      this.services.AddItemToList('ListProcessRequestTo', data).subscribe(
        item => {},
        error => {
          this.CloseRotiniPanel();
          console.log(
            'error when update item to list ListProcessRequestTo: ' +
              error.error.error.message.value
          ),
            this.notificationService.error('Thu hồi văn bản thất bại');
        },
        () => {
          const dataSendUser = {
            __metadata: { type: 'SP.Data.ListRequestSendMailListItem' },
            Title: this.listName,
            IndexItem: this.IncomingDocID,
            Step: this.currentStep,
            KeyList: this.listName +  '_' + this.IncomingDocID,
            SubjectMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.AssignEmailSubject, this.currentUserName),
            BodyMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.AssignEmailBody, this.currentUserName),
            SendMailTo: this.currentUserEmail,
          }
          this.services.AddItemToList('ListRequestSendMail', dataSendUser).subscribe(
            itemRoomRQ => {
              console.log(itemRoomRQ['d']);
            },
            error => {
              console.log(error);
              this.CloseRotiniPanel();
            },
            () => {
            this.bsModalRef.hide();
            this.CloseRotiniPanel();
            this.notificationService.success('Thu hồi văn bản thành công');
            this.routes.navigate(['/Documents/IncomingDoc/docTo-detail/' + this.IncomingDocID]);
            // this.isRetrieve = false;
            })
        })
    } else {
      this.bsModalRef.hide();
      this.CloseRotiniPanel();
      this.notificationService.success('Thu hồi văn bản thành công');
    }
  }
 
  // Trả lại
  AddTicketReturn() {
    try {
      if (this.docTo.CheckNull(this.content) === '') {
        this.notificationService.warn("Bạn chưa nhập Lý do trả lại! Vui lòng kiểm tra lại");
        return;
      }
      this.bsModalRef.hide();
      this.OpenRotiniPanel();
      let item  = this.ListItem.find(i => i.indexStep === this.IndexStep && i.userApproverId === this.currentUserId && i.stsTypeCode === 'CXL' && i.statusId === 0);
      console.log('return request ' + item);
      const dataTicket = {
        __metadata: { type: 'SP.Data.ListProcessRequestToListItem' },
        StatusID: 1, StatusName: "Đã xử lý",
        IsFinished: 0
      };
      this.services.updateListById('ListProcessRequestTo', dataTicket, item.ID).subscribe(
        item => {},
        error => {
          this.CloseRotiniPanel();
          console.log(
            'error when update item to list ListProcessRequestTo: ' +
              error.error.error.message.value
          ),
            this.notificationService.error('Cập nhật thông tin phiếu xử lý thất bại');
        },
        () => {
          console.log(
            'update item return' + item.ID + ' of approval user to list ListProcessRequestTo successfully!'
          );
           // tra lai phieu cho ng xu ly chinh
           let approverId;
           approverId = item.userRequestId;            
           let request, approver;
           request = this.ListUserChoice.find(item => item.Id === this.docTo.CheckNullSetZero(this.currentUserId));
           approver = this.ListUserChoice.find(item => item.Id === this.docTo.CheckNullSetZero(approverId));

          if(item.taskTypeCode === "XLC") {           
            const data = {
              __metadata: { type: 'SP.Data.ListProcessRequestToListItem' },
              Title: this.itemDoc.numberTo,
              DateCreated: new Date(),
              NoteBookID: this.IncomingDocID,
              UserRequestId: this.currentUserId,
              UserApproverId: approverId,
              Deadline: this.docTo.CheckNull(this.itemDoc.deadline) === '' ? null : this.itemDoc.deadline,
              StatusID: 0,
              StatusName: 'Chờ xử lý',
              Source: request === undefined ? '' : request.DeName,
              Destination: approver === undefined ? '' : approver.DeName,
              RoleUserRequest :request === undefined ? '' : request.RoleName,
              RoleUserApprover: approver === undefined ? '' : approver.RoleName,
              TaskTypeCode: 'XLC',
              TaskTypeName: 'Xử lý chính',
              TypeCode: 'TL',
              TypeName: 'Trả lại',
              Content: this.content,
              IndexStep: this.IndexStep - 1,
              Compendium: this.itemDoc.compendium,
              IndexReturn: this.IndexStep + '_' + (this.IndexStep - 1),
              Flag: this.itemDoc.urgentLevelId > 1 || this.itemDoc.secretLevelId > 1 ? 1 : 0
            };
            this.services.AddItemToList('ListProcessRequestTo', data).subscribe(
              item => {this.processId = item['d'].Id},
              error => {
                this.CloseRotiniPanel();
                console.log(
                  'error when add item to list ListProcessRequestTo: ' +
                    error.error.error.message.value
                ),
                  this.notificationService.error('Thêm phiếu xử lý thất bại');
              },
              () => {
                console.log(
                  'Add item of approval user to list ListProcessRequestTo successfully!'
                );
                //gui mail tra lai
                const dataSendUser = {
                  __metadata: { type: 'SP.Data.ListRequestSendMailListItem' },
                  Title: this.listName,
                  IndexItem: this.IncomingDocID,
                  Step: this.currentStep,
                  KeyList: this.listName +  '_' + this.IncomingDocID,
                  SubjectMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.ReturnEmailSubject, approver.DisplayName),
                  BodyMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.ReturnEmailBody, approver.DisplayName),
                  SendMailTo: approver.Email,
                }
                this.services.AddItemToList('ListRequestSendMail', dataSendUser).subscribe(
                  itemRoomRQ => {
                    console.log(itemRoomRQ['d']);
                  },
                  error => {
                    console.log(error);
                    this.CloseRotiniPanel();
                  },
                  () => {
                    console.log("Send mail return success.")
                  }
                );
                // update user approver name
                if(item !== undefined) {
                  this.UserAppoverName += ';' + item.userRequestId + '_' + item.userRequest;
                }
              
                const data = {
                  __metadata: { type: 'SP.Data.ListDocumentToListItem' },
                  ListUserApprover: this.UserAppoverName
                };
                this.services.updateListById('ListDocumentTo', data, this.IncomingDocID).subscribe(
                  item => {},
                  error => {
                    this.CloseRotiniPanel();
                    console.log(
                      'error when update item to list ListDocumentTo: ' +
                        error.error.error.message.value
                    );
                  },
                  () => {
                    console.log(
                      'Update user approver name successfully!'
                    );
                  }
                )
                //Update list history
                if(this.historyId > 0) {
                  const dataTicket = {
                    __metadata: { type: 'SP.Data.ListHistoryRequestToListItem' },
                    StatusID: -1, StatusName: "Đã trả lại",
                  };
                  this.services.updateListById('ListHistoryRequestTo', dataTicket, this.historyId).subscribe(
                    item => {},
                    error => {
                      this.CloseRotiniPanel();
                      console.log(
                        'error when update item to list ListHistoryRequestTo: ' +
                          error.error.error.message.value
                      );
                    },
                    () => {
                      this.callbackFunc(this.processId, this.IncomingDocID, true);
                    }
                  );
                }
              }
            );
          } else {
            //gui mail tra lai
            const dataSendUser = {
              __metadata: { type: 'SP.Data.ListRequestSendMailListItem' },
              Title: this.listName,
              IndexItem: this.IncomingDocID,
              Step: this.currentStep,
              KeyList: this.listName +  '_' + this.IncomingDocID,
              SubjectMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.ReturnEmailSubject, approver.DisplayName),
              BodyMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.ReturnEmailBody, approver.DisplayName),
              SendMailTo: approver.Email,
            }
            this.services.AddItemToList('ListRequestSendMail', dataSendUser).subscribe(
              itemRoomRQ => {
                console.log(itemRoomRQ['d']);
              },
              error => {
                console.log(error);
                this.CloseRotiniPanel();
              },
              () => {
                console.log("Send mail return success.");
                this.callbackFunc(this.processId, this.IncomingDocID, true);
              })       
            }
        }
      )
    } catch (err) {
      console.log("try catch AddTicketReturn error: " + err.message);
      this.CloseRotiniPanel();
    }
  }

  AddListTicketCombiner() {
    if (this.docTo.CheckNull(this.content) === '') {
      this.notificationService.warn("Bạn chưa nhập Nội dung xử lý! Vui lòng kiểm tra lại");
      return ;
    } else {
      let item = this.ListItem.find(i => i.indexStep === this.currentStep && i.taskTypeCode === "PH");
      if(item !== undefined) {
        this.OpenRotiniPanel();
        const dataTicket = {
          __metadata: { type: 'SP.Data.ListProcessRequestToListItem' },
          StatusID: 1, StatusName: "Đã xử lý",
          IsFinished: 0
        };
        this.services.updateListById('ListProcessRequestTo', dataTicket, item.ID).subscribe(
          item => {},
          error => {
            this.CloseRotiniPanel();
            console.log(
              'error when update item to list ListProcessRequestTo: ' +
                error.error.error.message.value
            ),
              this.notificationService.error('Cập nhật thông tin phiếu xử lý thất bại');
          },
          () => {
            this.bsModalRef.hide();
            console.log(
              'update item of combiner to list ListProcessRequestTo successfully!'
            );
            if(this.outputFileHandle.length > 0) {
              this.saveItemAttachment(0, item.ID,this.outputFileHandle,'ListProcessRequestTo', null);
            } else {
              this.CloseRotiniPanel();
              this.notificationService.success('Xử lý văn bản thành công');
              this.routes.navigate(['Documents/IncomingDoc/docTo-detail/' + this.IncomingDocID]);
            }          
          }
        );
      }
    }
  }

  // Add phiếu xử lý  
  validation() {
    if (this.docTo.CheckNull(this.selectedApprover) === '') {
      this.notificationService.warn("Bạn chưa chọn Người xử lý chính! Vui lòng kiểm tra lại");
      return false;
    }
    else if (this.docTo.CheckNull(this.content) === '') {
      this.notificationService.warn("Bạn chưa nhập Nội dung xử lý! Vui lòng kiểm tra lại");
      return false;
    }
    else if (this.IsDeadline) {
      if(this.docTo.CheckNull(this.deadlineDoc) === '') {
        this.notificationService.warn("Bạn phải nhập Hạn xử lý của văn bản vì đây là văn bản yêu cầu trả lời");
        return false;
      }
    } else if(this.docTo.CheckNull(this.deadlineDoc) !== '' && this.docTo.CheckNull(this.deadline) !== '') {
      let diff = moment(this.deadline).diff(moment(this.deadlineDoc), 'day');
      if(diff > 0) {
        this.notificationService.warn('Hạn xử lý phải nhỏ hơn hạn của văn bản! Vui lòng kiểm tra lại');
        return false;
      } else {
        return true;
      }
    }
    else {
      return true;
    }
  }

  AddDocumentGo() {
    let strId = '';
    let i = 0;
    if(this.ListItem !== undefined && this.ListItem.length > 0) {
      for(i = 0; i < this.ListItem.length; i++) {
        if(i < this.ListItem.length - 1) {
        strId += this.ListItem[i].ID + ','
        } else {
          strId += this.ListItem[i].ID;
        }
      }
    }
    this.routes.navigate(['/Documents/documentgo/' + this.IncomingDocID + '|' + this.docTo.CheckNullSetZero(this.historyId) + '|' + strId]);
  }

  AddListTicket() {
    try {
      if(this.validation()) {
      
        this.bsModalRef.hide();
        this.OpenRotiniPanel();
        //let data: Array<any> = [];
        let request, approver;
        request = this.ListUserChoice.find(item => item.Id === this.docTo.CheckNullSetZero(this.currentUserId));
        approver = this.ListUserChoice.find(item => item.Id === this.docTo.CheckNullSetZero(this.selectedApprover.split('|')[0]));

        const data = {
          __metadata: { type: 'SP.Data.ListProcessRequestToListItem' },
          Title: this.itemDoc.numberTo,
          DateCreated: new Date(),
          NoteBookID: this.IncomingDocID,
          UserRequestId: this.currentUserId,
          UserApproverId: this.selectedApprover.split('|')[0],
          Deadline: this.docTo.CheckNull(this.deadline) === '' ? (this.docTo.CheckNull(this.itemDoc.deadline) === '' ? null : this.itemDoc.deadline) : this.deadline,
          StatusID: 0,
          StatusName: 'Chờ xử lý',
          Source: request === undefined ? '' : request.DeName,
          Destination: approver === undefined ? '' : approver.DeName,
          RoleUserRequest :request === undefined ? '' : request.RoleName,
          RoleUserApprover: approver === undefined ? '' : approver.RoleName,
          TaskTypeCode: 'XLC',
          TaskTypeName: 'Xử lý chính',
          TypeCode: 'CXL',
          TypeName: 'Chuyển xử lý',
          Content: this.content,
          IndexStep: this.IndexStep + 1,
          Compendium: this.itemDoc.compendium,
          Flag: this.itemDoc.urgentLevelId > 1 || this.itemDoc.secretLevelId > 1 ? 1 : 0
        };
      
        this.services.AddItemToList('ListProcessRequestTo', data).subscribe(
          item => {this.processId = item['d'].Id},
          error => {
            this.CloseRotiniPanel();
            console.log(
              'error when add item to list ListProcessRequestTo: ' +
                error.error.error.message.value
            ),
              this.notificationService.error('Thêm phiếu xử lý thất bại');
          },
          () => {
            console.log(
              'Add item of approval user to list ListHistoryRequestTo successfully!'
            );            

            // update user approver
            this.UserAppoverName += ';' + this.selectedApprover.split('|')[0] + '_' + this.selectedApprover.split('|')[2];
            const data = {
              __metadata: { type: 'SP.Data.ListDocumentToListItem' },
              ListUserApprover: this.UserAppoverName,
              Deadline: this.IsDeadline === true ? moment(this.deadlineDoc).toDate() : this.itemDoc.deadline
            };
            this.services.updateListById('ListDocumentTo', data, this.IncomingDocID).subscribe(
              item => {},
              error => {
                this.CloseRotiniPanel();
                console.log(
                  'error when update item to list ListDocumentTo: ' +
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
                __metadata: { type: 'SP.Data.ListHistoryRequestToListItem' },
                StatusID: 1, StatusName: "Đã xử lý",
              };
              this.services.updateListById('ListHistoryRequestTo', dataTicket, this.historyId).subscribe(
                item => {},
                error => {
                  this.CloseRotiniPanel();
                  console.log(
                    'error when update item to list ListHistoryRequestTo: ' +
                      error.error.error.message.value
                  );
                },
                () => {}
              );
            }
            this.UpdateStatus(1, 0, 1);
          }
        );
      }
    } catch(err) {
      console.log("try catch AddListTicket error: " + err.message);
      this.CloseRotiniPanel();
    }
  }

  AddUserCombine() {
    let request, approver;
    request = this.ListUserChoice.find(item => item.Id === this.docTo.CheckNullSetZero(this.currentUserId));
    approver = this.ListUserChoice.find(item => item.Id === this.docTo.CheckNullSetZero(this.selectedCombiner[this.index].split('|')[0]));
    const data = {
      __metadata: { type: 'SP.Data.ListProcessRequestToListItem' },
      Title: this.itemDoc.numberTo,
      DateCreated: new Date(),
      NoteBookID: this.IncomingDocID,
      UserRequestId: this.currentUserId,
      UserApproverId: this.selectedCombiner[this.index].split('|')[0],
      Deadline: this.docTo.CheckNull(this.deadline) === '' ? (this.docTo.CheckNull(this.itemDoc.deadline) === '' ? null : this.itemDoc.deadline) : this.deadline,
      StatusID: 0,
      StatusName: 'Chờ xử lý',
      Source: request === undefined ? '' : request.DeName,
      Destination: approver === undefined ? '' : approver.DeName,
      RoleUserRequest :request === undefined ? '' : request.RoleName,
      RoleUserApprover: approver === undefined ? '' : approver.RoleName,
      TaskTypeCode: 'PH',
      TaskTypeName: 'Phối hợp',
      TypeCode: 'CXL',
      TypeName: 'Chuyển xử lý',
      Content: this.content,
      IndexStep: this.IndexStep + 1,
      Compendium: this.itemDoc.compendium,
      Flag: this.itemDoc.urgentLevelId > 1 || this.itemDoc.secretLevelId > 1 ? 1 : 0
    };
    this.services.AddItemToList('ListProcessRequestTo', data).subscribe(
      item => {},
      error => {
        this.CloseRotiniPanel();
        console.log(
          'error when add item to list ListProcessRequestTo: ' +
            error.error.error.message.value
        ),
          this.notificationService.error('Them phiếu xử lý thất bại');
      },
      () => {
        console.log(
          'update item ' + this.selectedCombiner[this.index] + ' of approval user to list ListProcessRequestTo successfully!'
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
            this.callbackFunc(this.processId, this.IncomingDocID, false);
            // this.CloseRotiniPanel();     
            // this.notificationService.success('Cập nhật thông tin xử lý thành công.');
          }
        }
      }
    );
  }

  AddUserKnow() {
    let request, approver;
    request = this.ListUserChoice.find(item => item.Id === this.docTo.CheckNullSetZero(this.currentUserId));
    approver = this.ListUserChoice.find(item => item.Id === this.docTo.CheckNullSetZero(this.selectedKnower[this.index].split('|')[0]));
    const data = {
      __metadata: { type: 'SP.Data.ListProcessRequestToListItem' },
      Title: this.itemDoc.numberTo,
      DateCreated: new Date(),
      NoteBookID: this.IncomingDocID,
      UserRequestId: this.currentUserId,
      UserApproverId: this.selectedKnower[this.index].split('|')[0],
      Deadline: this.docTo.CheckNull(this.deadline) === '' ? (this.docTo.CheckNull(this.itemDoc.deadline) === '' ? null : this.itemDoc.deadline) : this.deadline,
      StatusID: 0,
      StatusName: 'Chờ xử lý',
      Source: request === undefined ? '' : request.DeName,
      Destination: approver === undefined ? '' : approver.DeName,
      RoleUserRequest :request === undefined ? '' : request.RoleName,
      RoleUserApprover: approver === undefined ? '' : approver.RoleName,
      TaskTypeCode: 'NĐB',
      TaskTypeName: 'Nhận để biết',
      TypeCode: 'CXL',
      TypeName: 'Chuyển xử lý',
      Content: this.content,
      IndexStep: this.IndexStep + 1,
      Compendium: this.itemDoc.compendium,
      Flag: this.itemDoc.urgentLevelId > 1 || this.itemDoc.secretLevelId > 1 ? 1 : 0
    };
    this.services.AddItemToList('ListProcessRequestTo', data).subscribe(
      item => {},
      error => {
        this.CloseRotiniPanel();
        console.log(
          'error when add item to list ListProcessRequestTo: ' +
            error.error.error.message.value
        ),
          this.notificationService.error('Them phiếu xử lý thất bại');
      },
      () => {
        console.log(
          'update item' + this.selectedKnower[this.index] + ' of approval user to list ListProcessRequestTo successfully!'
        );
        this.index ++;
        if(this.index < this.selectedKnower.length) {
          this.AddUserKnow();
        }
        else {
          this.callbackFunc(this.processId, this.IncomingDocID, false);
          // this.CloseRotiniPanel();     
          // this.notificationService.success('Cập nhật thông tin xử lý thành công.');  
        }
      }
    );
  }

  UpdateStatus(sts, isFinish, callback) {
    let arr = [];
    if(isFinish === 0) {
      arr = this.ArrayItemId;
    } else if(isFinish === 1){
      arr = this.ListItem;
    }
    if(arr !== undefined && arr.length > 0) {
      const dataTicket = {
        __metadata: { type: 'SP.Data.ListProcessRequestToListItem' },
        StatusID: sts, StatusName: sts === 1 ? "Đã xử lý" : "Thu hồi",
        IsFinished: isFinish
      };
      this.services.updateListById('ListProcessRequestTo', dataTicket, arr[this.index].ID).subscribe(
        item => {},
        error => {
          this.CloseRotiniPanel();
          console.log(
            'error when update item to list ListProcessRequestTo: ' +
              error.error.error.message.value
          ),
            this.notificationService.error('Cập nhật thông tin phiếu xử lý thất bại');
        },
        () => {
          console.log(
            'update item ' + arr[this.index] + ' of approval user to list ListProcessRequestTo successfully!'
          );
          this.index ++;
          if(this.index < arr.length) {
            this.UpdateStatus(sts, isFinish, callback);
          }
          else {
            this.index = 0;
            if(callback === 0) {
              this.callbackFunc(this.processId, this.IncomingDocID, false);
            } else if(callback === 1) {
              this.AddHistoryStep(false);
            }
          }
        }
      );
    }
  }

  AddHistoryStep(isReturn) {
    const data = {
      __metadata: { type: 'SP.Data.ListHistoryRequestToListItem' },
      Title: this.itemDoc.numberTo,
      DateCreated: new Date(),
      NoteBookID: this.itemDoc.ID,
      UserRequestId: this.currentUserId,
      UserApproverId: this.selectedApprover.split('|')[0],
      Deadline: this.docTo.CheckNull(this.deadline) === '' ? (this.docTo.CheckNull(this.itemDoc.deadline) === '' ? null : this.itemDoc.deadline) : this.deadline,
      StatusID: 0,
      StatusName: 'Chờ xử lý',
      Content: this.content,
      IndexStep: this.IndexStep + 1,
      Compendium: this.itemDoc.compendium,
      StatusApproval: "1_0"
    };
    this.services.AddItemToList('ListHistoryRequestTo', data).subscribe(
      item => {},
      error => {
        this.CloseRotiniPanel();
        console.log(
          'error when add item to list ListHistoryRequestTo: ' +
            error.error.error.message.value
        ),
          this.notificationService.error('Thêm phiếu xử lý thất bại');
      },
      () => {
        console.log(
          'Add item of approval user to list ListHistoryRequestTo successfully!'
        );
       
        // Luu phieu cho nguoi phoi hop va nhan de biet
        if(this.selectedCombiner !== undefined && this.selectedCombiner.length > 0) {
          this.AddUserCombine();
        } else if(this.selectedKnower !== undefined && this.selectedKnower.length > 0) {
          this.AddUserKnow();
        } else {
          this.callbackFunc(this.processId, this.IncomingDocID, isReturn);
          // this.CloseRotiniPanel();
          // this.notificationService.success('Cập nhật thông tin xử lý thành công.');
        }
      }
    );
  }

  FinishRequest() {
    this.OpenRotiniPanel();
    const data = {
      __metadata: { type: 'SP.Data.ListDocumentToListItem' },
      StatusID: 1, StatusName: "Đã xử lý",
    };
    this.services.updateListById('ListDocumentTo', data, this.IncomingDocID).subscribe(
      item => {},
      error => {
        this.CloseRotiniPanel();
        console.log(
          'error when update item to list ListDocumentTo: ' +
            error.error.error.message.value
        );
      },
      () => {
        if(this.historyId > 0) {
          const dataTicket = {
            __metadata: { type: 'SP.Data.ListHistoryRequestToListItem' },
            StatusID: 1, StatusName: "Đã xử lý",
          };
          this.services.updateListById('ListHistoryRequestTo', dataTicket, this.historyId).subscribe(
            item => {},
            error => {
              this.CloseRotiniPanel();
              console.log(
                'error when update item to list ListHistoryRequestTo: ' +
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

  UpdateStatusFinish(index) {
    if(this.ListItem !== undefined && this.ListItem.length > 0) {
      const dataTicket = {
        __metadata: { type: 'SP.Data.ListProcessRequestToListItem' },
        StatusID: 1, StatusName: "Đã xử lý",
        IsFinished: 1
      };
      this.services.updateListById('ListProcessRequestTo', dataTicket, this.ListItem[index].ID).subscribe(
        item => {},
        error => {
          this.CloseRotiniPanel();
          console.log(
            'error when update item to list ListProcessRequestTo: ' +
              error.error.error.message.value
          ),
            this.notificationService.error('Cập nhật thông tin phiếu xử lý thất bại');
        },
        () => {
          console.log(
            'update item ' + this.ListItem[index] + ' of approval user to list ListProcessRequestTo successfully!'
          );
          index ++;
          if(index < this.ListItem.length) {
            this.UpdateStatusFinish(index);
          }
          else {
            this.bsModalRef.hide();
            this.IsFinishItem = true;
            this.callbackFunc(this.processId, this.IncomingDocID, false);
          }
        }
      );
    }
  }

  callbackFunc(id, idDocument, isReturn) {
    if (this.outputFileHandle.length > 0) {
      this.saveItemAttachment(0, id, this.outputFileHandle,'ListProcessRequestTo', null);
    }
    else if (this.outputFile.length > 0) {
      this.saveItemAttachment(0, id, this.outputFile,'ListDocumentTo', null);
    }
    else if (this.outputFileReturn.length > 0) {
      this.saveItemAttachment(0, id, this.outputFileReturn,'ListProcessRequestTo', null);
    }
    else {
       // gui mail
      this.addItemSendMail(isReturn);
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

  CheckUserNotHandle1(code, stt, isCheck) {
    console.log(code);
    if(isCheck){
      this.ListUserOfDepartment.forEach(element => {
        if(element.Code === code && element.STT === stt){
          if(code.includes('|') && this.selectedCombiner.indexOf(code) < 0) {
            this.selectedCombiner.push(element.Code);
          } else if(this.selectedCombiner.indexOf(code) >= 0) {
            element.IsCombine = false;
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

  CheckUserNotHandle2(code, stt, isCheck) {
    console.log(code);
    if(isCheck){
      this.ListUserOfDepartment.forEach(element => {
        if(element.Code === code && element.STT === stt){
          if(code.includes('|') && this.selectedKnower.indexOf(code) < 0) {
            this.selectedKnower.push(element.Code);
          } else if(this.selectedCombiner.indexOf(code) >= 0) {
            element.IsKnow = false;
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


  addAttachmentFile(sts) {
    try {
      if (sts === 0) {
        const inputNode: any = document.querySelector('#fileAttachment');
        if (this.docTo.CheckNull(inputNode.files[0]) !== '') {
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
        if (this.docTo.CheckNull(inputNode.files[0]) !== '') {
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
        if (this.docTo.CheckNull(inputNode.files[0]) !== '') {
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
      else if (sts === 3) {//dùng trong ý kiến xử lý
        const inputNode: any = document.querySelector('#fileAttachmentComment');
        if (this.docTo.CheckNull(inputNode.files[0]) !== '') {
          console.log(inputNode.files[0]);
          if (this.outputFileComment.length > 0) {
            if (
              this.outputFileComment.findIndex(
                index => index.name === inputNode.files[0].name
              ) === -1
            ) {
              this.outputFileComment.push(inputNode.files[0]);
            }
          } else {
            this.outputFileComment.push(inputNode.files[0]);
          }
        }
      }
      else if (sts === 4) {//dùng trong modal xin ý kiến 
        const inputNode: any = document.querySelector('#fileAttachmentAddComment');
        if (this.docTo.CheckNull(inputNode.files[0]) !== '') {
          console.log(inputNode.files[0]);
          if (this.outputFileAddComment.length > 0) {
            if (
              this.outputFileAddComment.findIndex(
                index => index.name === inputNode.files[0].name
              ) === -1
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
        console.log(this.outputFile.indexOf(index))
        this.outputFile.splice(this.outputFile.indexOf(index), 1);
      } else if (sts === 1) {
        console.log(this.outputFileHandle.indexOf(index))
        this.outputFileHandle.splice(this.outputFileHandle.indexOf(index), 1);
      } else if (sts === 2) {
        console.log(this.outputFileReturn.indexOf(index))
        this.outputFileReturn.splice(this.outputFileReturn.indexOf(index), 1);
      }
      else if (sts === 3) {
        console.log(this.outputFileComment.indexOf(index))
        this.outputFileComment.splice(this.outputFileComment.indexOf(index), 1);
      }
      else if (sts === 3) {
        console.log(this.outputFileAddComment.indexOf(index))
        this.outputFileAddComment.splice(this.outputFileAddComment.indexOf(index), 1);
      }
    } catch (error) {
      console.log("removeAttachmentFile error: " + error);
    }
  }

  saveItemAttachment(index, idItem, arr, listName, indexUserComment) {
    try {
      this.buffer = this.getFileBuffer(arr[index]);
      this.buffer.onload = (e: any) => {
        console.log(e.target.result);
        const dataFile = e.target.result;
        this.services.inserAttachmentFile(dataFile, arr[index].name, listName, idItem).subscribe(
          itemAttach => {
            console.log('inserAttachmentFile success');
          },
          error => console.log(error),
          () => {
            console.log('inserAttachmentFile successfully');
            if (Number(index) < (arr.length - 1)) {
              this.saveItemAttachment((Number(index) + 1), idItem, arr, listName,indexUserComment);
            }
            else {
              // this.outputFile = [];
              // this.CloseRotiniPanel();
              if (listName == 'ListComments') {
                this.CloseRotiniPanel();
                this.getComment();
                if(indexUserComment!=null && indexUserComment==this.listUserIdSelect.length-1)
                {
                  this.outputFileAddComment = [];
                  this.notificationService.success('Bạn gửi xin ý kiến thành công');
                  this.GetItemDetail();
                  this.bsModalRef.hide();
                }
                else{
                  this.outputFileComment = [];
                  this.notificationService.success('Bạn gửi bình luận thành công');
                }
              }
              else {
                arr = [];
                this.addItemSendMail(false);            
              }
            }
          }
        )
      }
    } catch (error) {
      console.log("saveItemAttachment error: " + error);
    }
  } 

  getFileBuffer(file) {
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    return reader;
  }

  GetTypeCode(code) {
    if (this.docTo.CheckNull(code) === '') {
      return '';
    }
    else if (code === "CXL") {
      return 'Chuyển xử lý';
    }
    else if (code === "TL") {
      return 'Trả lại';
    }
    else if (code === "TH") {
      return 'Thu hồi';
    }
    else if (code === "XYK") {
      return 'Xin ý kiến';
    }
  }

  //comment
  Reply(i, j) {
    if (j == undefined) {
      this.listCommentParent[i].DisplayReply = "flex";
    }
    else {

      this.listCommentParent[i].children[j].DisplayReply = "flex";
    }
  }

  isNotNull(str) {
    return (str !== null && str !== "" && str !== undefined);
  }

  //luu comment (lưu comment xin ý kiến và bình luận ở ý kiến xử lý)
  saveComment(content,isAddComment,index) {
    try {
      this.OpenRotiniPanel();
      if (this.isNotNull(content)) {
        const dataComment = {
          __metadata: { type: 'SP.Data.ListCommentsListItem' },
          Title: "ListDocumentTo_" + this.IncomingDocID,
          Chat_Comments: content,
          KeyList: "ListDocumentTo_" + this.IncomingDocID,
          ProcessID:isAddComment==true? this.idItemProcess:null,
          UserApproverId:isAddComment==true? this.listUserIdSelect[index]:null,
          UserRequestId: this.currentUserId,
        }
        if (this.isNotNull(this.pictureCurrent)) {
          Object.assign(dataComment, { userPicture: this.pictureCurrent });
        }
        this.services.AddItemToList('ListComments', dataComment).subscribe(
          itemComment => {
            this.indexComment = itemComment['d'].Id;
          },
          error => {
            console.log(error);
            this.notificationService.error('Bạn gửi bình luận thất bại');
          },
          () => {
            if(isAddComment==false){     
              this.Comments = null;
              if (this.outputFileComment.length > 0) {
                this.saveItemAttachment(0, this.indexComment, this.outputFileComment, 'ListComments', null);
              }
              else {
                this.CloseRotiniPanel();
                this.notificationService.success('Bạn gửi bình luận thành công');
                this.getComment();
              }
            }
            else  if(isAddComment==true){  //xin ý kiến
              if (this.outputFileAddComment.length > 0) {
                this.saveItemAttachment(0, this.indexComment,this.outputFileAddComment, 'ListComments', index);
              }
              else {
                this.CloseRotiniPanel();
                console.log('Bạn gửi xin ý kiến thành công');
                //kt nếu lưu đến người cuối cùng rồi thì đóng modal
                if(index==this.listUserIdSelect.length-1){
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
        this.CloseRotiniPanel();
        alert("Bạn chưa nhập nội dung ");
      }
    } catch (error) {
      console.log("SendComment error: " + error);
    }
  }

  //lưu comment trả lời
  saveCommentReply(i, j) {
    try {
      this.OpenRotiniPanel();
      let content = '';
      if (j == undefined) {
        content = this.listCommentParent[i].Content;
      }
      else {
        content = this.listCommentParent[i].children[j].Content;
      }
      if (this.isNotNull(content)) {
        this.ContentReply = content;
        const dataComment = {
          __metadata: { type: 'SP.Data.ListCommentsListItem' },
          Title: "ListDocumentTo_" + this.IncomingDocID,
          Chat_Comments: content,
          KeyList: "ListDocumentTo_" + this.IncomingDocID,
          ParentID: this.listCommentParent[i].ParentID == null ? this.listCommentParent[i].ID : this.listCommentParent[i].ParentID,
        }
        if (this.isNotNull(this.pictureCurrent)) {
          Object.assign(dataComment, { userPicture: this.pictureCurrent });
        }
        this.services.AddItemToList('ListComments', dataComment).subscribe(
          itemComment => {
            this.indexComment = itemComment['d'].Id;
          },
          error => {
            console.log(error);
            this.notificationService.error('Bạn gửi trả lời thất bại');
          },
          () => {
            // if (this.outputFile.length > 0) {
            //   this.saveItemAttachment(0, this.indexComment);
            // }
            // else {
            this.CloseRotiniPanel();
            this.notificationService.success('Bạn gửi trả lời thành công');
            //update lại trạng thái cho phiếu xin ý kiến
            if (this.isNotNull(this.listCommentParent[i].ProcessID) && this.listCommentParent[i].UserApproverId === this.currentUserId) {              
              this.updateProcess(this.listCommentParent[i].ProcessID);
              this.AuthorComment = {Title: this.listCommentParent[i].Author, Email: this.listCommentParent[i].AuthorEmail};
            }
            this.getComment();
            // }
          }
        )
      }
      else {
        this.CloseRotiniPanel();
        alert("Bạn chưa nhập nội dung trả lời");
      }
    } catch (error) {
      console.log("saveCommentReply error: " + error);
    }
  }

  updateProcess(id) {
    try {
      const dataProcess = {
        __metadata: { type: 'SP.Data.ListProcessRequestToListItem' },
        StatusID: 1,
        StatusName: "Đã cho ý kiến",
      }
      this.services.updateListById('ListProcessRequestTo', dataProcess, id).subscribe(
        itemComment => {
          //  this.indexComment = itemComment['d'].Id;
        },
        error => console.log(error),
        () => {
        // gui mail
        const dataSendUser = {
          __metadata: { type: 'SP.Data.ListRequestSendMailListItem' },
          Title: this.listName,
          IndexItem: this.IncomingDocID,
          Step: this.currentStep,
          KeyList: this.listName +  '_' + this.IncomingDocID,
          SubjectMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.ReplyCommentSubject, ''),
          BodyMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.ReplyCommentBody, ''),
          SendMailTo: this.AuthorComment.Email,
        }
        this.services.AddItemToList('ListRequestSendMail', dataSendUser).subscribe(
          itemRoomRQ => {
            console.log(itemRoomRQ['d']);
          },
          error => {
            console.log(error);
            this.CloseRotiniPanel();
          },
          () => {
            console.log('Save item success and send mail success');
          });
          this.GetHistory();
          // }
        }
      )

    } catch (error) {
      console.log("saveCommentReply error: " + error);
    }
  }

  listCommentParent = []; listComment = [];listUserIdSelect=[];
  outputFileComment: AttachmentsObject[] = []; AttachmentsComment: AttachmentsObject[] = [];
  outputFileAddComment:AttachmentsObject[]=[]; ListCommentInProcess = [];
  Comments; pictureCurrent; indexComment;selectedUserComment;idItemProcess;contentComment;
  getComment(): void {
    const strComent = `?$select=*,Author/Title,Author/Name,UserApprover/Id,UserApprover/Title,AttachmentFiles`
      + `&$expand=Author,UserApprover,AttachmentFiles&$filter=KeyList eq 'ListDocumentTo_` + this.IncomingDocID + `'&$orderby=Created asc`
    this.services.getItem("ListComments", strComent).subscribe(itemValue => {
      this.listComment = [];
      this.listCommentParent = [];
      let itemList = itemValue["value"] as Array<any>;
      itemList.forEach(element => {
        let picture;
        // if (element.userPicture !== null && element.userPicture !== '' && element.userPicture !== undefined) {
        //   picture = element.userPicture;
        // }
        // else {
        //   if(environment.usingMockData) {
        //     picture = '../../../../' + this.assetFolder + '/img/default-user-image.png';
        //   } else {
        //     this.assetFolder = this.assetFolder.replace('../', '');
        //     picture = this.assetFolder + '/img/default-user-image.png';
        //   }          
        // }
        if(environment.usingMockData) {
          picture = '../../../../' + this.assetFolder + '/img/default-user-image.png';
        } else {
          this.assetFolder = this.assetFolder.replace('../', '');
          // picture = this.assetFolder + '/img/default-user-image.png';
          picture = this.getUserPicture(element.Author.Name.split('|')[2]);
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
          Author: element.Author.Title,
          AuthorEmail: element.Author.Name.split('|')[2],
          Chat_Comments: this.docTo.CheckNull(element.Chat_Comments === '') ? 'Ý kiến' : element.Chat_Comments,
          Created: moment(element.Created).format('DD/MM/YYYY HH:mm:ss'),
          userPicture: picture,
          // UserRequest: element.UserRequest != null ? element.UserRequest.Title : '',
          // UserRequestEmail: element.UserRequest != null ? element.UserRequest.Name.split('|')[1] : '',
          UserApprover: element.UserApprover != null ? element.UserApprover.Title : '',
          UserApproverId: element.UserApprover != null ? element.UserApprover.Id : 0,
          XinYKien: ' xin ý kiến ',
          ParentID: element.ParentID,
          ProcessID: element.ProcessID,
          itemAttach: this.AttachmentsComment,
          Content: '',
          DisplayReply: "none",
          Reply: true
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
    error => {
      console.log("Load listcomment error: " + error);
      this.CloseRotiniPanel();
    },
    () => {
      const strSelect = `?$select=*,UserRequest/Title,UserRequest/Name,UserApprover/Id,UserApprover/Title,AttachmentFiles`
      + `&$expand=UserRequest,UserApprover,AttachmentFiles&$filter=NoteBookID eq '` + this.IncomingDocID + `' and TypeCode ne 'XYK' and TaskTypeCode eq 'XLC' &$orderby=Created asc`
      this.services.getItem("ListProcessRequestTo", strSelect).subscribe(itemValue => {
        let itemList = itemValue["value"] as Array<any>;
        itemList.forEach(element => { 
          if(element.IndexStep === 1 && element.TypeCode === "CXL") {
            return;
          }
          let picture;
          if(environment.usingMockData) {
            picture = '../../../../' + this.assetFolder + '/img/default-user-image.png';
          } else {
            this.assetFolder = this.assetFolder.replace('../', '');
            // picture = this.assetFolder + '/img/default-user-image.png';
            picture = this.getUserPicture(element.UserRequest.Name.split('|')[2]);
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
          this.listCommentParent.push({
            ID: element.ID,
            Author:element.UserRequest.Title,
            Chat_Comments: this.docTo.CheckNull(element.Content === '') ? 'Chuyển xử lý' : element.Content,
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
      error => {
        console.log("Load process error: " + error);
        this.CloseRotiniPanel();
      },
      () => {
        this.listCommentParent.sort(this.compare);
        if (!(this.ref as ViewRef).destroyed) {
          this.ref.detectChanges();  
        }  
        this.CloseRotiniPanel();
      })
    }
    )
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

        this.OpenRotiniPanel();
        //lưu attach file vào văn bản
        // if (this.outputFileAddComment.length > 0) {
        //   this.saveItemAttachment(0, this.IncomingDocID, this.outputFileAddComment, 'ListDocumentTo', null);
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
        __metadata: { type: 'SP.Data.ListProcessRequestToListItem' },
        Title: this.itemDoc.numberTo,
        DateCreated: new Date(),
        NoteBookID: this.IncomingDocID,
        UserRequestId: this.currentUserId,
        UserApproverId: this.listUserIdSelect[index],
        StatusID: 0,
        StatusName: "Chờ xin ý kiến",
        TypeCode: 'XYK',
        TypeName: 'Xin ý kiến',
        TaskTypeCode: 'NĐB',
        TaskTypeName: 'Nhận để biết',
        Content: this.contentComment,
        Compendium: this.itemDoc.compendium,
        IndexStep: this.currentStep,
        Deadline: this.itemDoc.deadline
      }
      this.services.AddItemToList('ListProcessRequestTo', dataProcess).subscribe(
        items => {
          console.log(items);
          this.idItemProcess = items['d'].Id;
        },
        error => {console.log(error);
          this.CloseRotiniPanel();
        },
        () => {
          this.CloseRotiniPanel();
          this.saveComment(this.contentComment,true,index);
          // gui mail
          const dataSendUser = {
            __metadata: { type: 'SP.Data.ListRequestSendMailListItem' },
            Title: this.listName,
            IndexItem: this.IncomingDocID,
            Step: this.currentStep,
            KeyList: this.listName +  '_' + this.IncomingDocID,
            SubjectMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.CommentSubject, ''),
            BodyMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.CommentBody, ''),
            SendMailTo: this.selectedUserComment.split('|')[1],
          }
          this.services.AddItemToList('ListRequestSendMail', dataSendUser).subscribe(
            itemRoomRQ => {
              console.log(itemRoomRQ['d']);
            },
            error => {
              console.log(error);
              this.CloseRotiniPanel();
            },
            () => {
              console.log('Save item success and send mail success');
            });
        }
      )
    } catch (error) {
      console.log('saveItemListProcess error: ' + error.message);
    }
  }

  addItemSendMail(isReturn) {
    try {
      if(!isReturn) {
        if(this.docTo.CheckNull(this.selectedApprover) !== '') {
          const dataSendApprover = {
            __metadata: { type: 'SP.Data.ListRequestSendMailListItem' },
            Title: this.listName,
            IndexItem: this.IncomingDocID,
            Step: this.currentStep,
            KeyList: this.listName +  '_' + this.IncomingDocID,
            SubjectMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.AssignEmailSubject, this.selectedApprover.split('|')[2]),
            BodyMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.AssignEmailBody, this.selectedApprover.split('|')[2]),
            SendMailTo: this.selectedApprover.split('|')[1]
          }
          this.services.AddItemToList('ListRequestSendMail', dataSendApprover).subscribe(
            itemRoomRQ => {
              console.log(itemRoomRQ['d']);
            },
            error => {
              console.log(error);
              this.CloseRotiniPanel();
            },
            () => {          
              console.log('Add email success approver');
              if(this.selectedCombiner.length > 0) {
                this.SendMailCombiner(0);
              } else if(this.selectedKnower.length > 0) {
                this.SendMailKnower(0);
              } else {                  
                this.CloseRotiniPanel();
                this.routes.navigate(['Documents/IncomingDoc/docTo-detail/' + this.IncomingDocID]);
              }
            }
          )
        } else if(this.IsFinishItem) {
          const dataSendApprover = {
            __metadata: { type: 'SP.Data.ListRequestSendMailListItem' },
            Title: this.listName,
            IndexItem: this.IncomingDocID,
            Step: this.currentStep,
            KeyList: this.listName +  '_' + this.IncomingDocID,
            SubjectMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.FinishEmailSubject, this.itemDoc.authorName),
            BodyMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.FinishEmailBody, this.itemDoc.authorName),
            SendMailTo: this.itemDoc.authorEmail
          }
          this.services.AddItemToList('ListRequestSendMail', dataSendApprover).subscribe(
            itemRoomRQ => {
              console.log(itemRoomRQ['d']);
            },
            error => {
              console.log(error);
              this.CloseRotiniPanel();
            },
            () => {    
              this.CloseRotiniPanel();
              this.routes.navigate(['/Documents/IncomingDoc/docTo-detail/' + this.IncomingDocID]);      
            })
        } else {
          this.CloseRotiniPanel();
          this.routes.navigate(['/Documents/IncomingDoc/docTo-detail/' + this.IncomingDocID]);
        }
      } else {
        this.CloseRotiniPanel();
        this.routes.navigate(['Documents/IncomingDoc/docTo-detail/' + this.IncomingDocID]);
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
      IndexItem: this.IncomingDocID,
      Step: this.currentStep,
      KeyList: this.listName +  '_' + this.IncomingDocID,
      SubjectMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.AssignEmailSubject, user.split('|')[2]),
      BodyMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.AssignEmailBody, user.split('|')[2]),
      SendMailTo: user.split('|')[1],
    }
    this.services.AddItemToList('ListRequestSendMail', dataSendUser).subscribe(
      itemRoomRQ => {
        console.log(itemRoomRQ['d']);
      },
      error => {
        console.log(error);
        this.CloseRotiniPanel();
      },
      () => {
        console.log('Add email success combiner');
        index ++;
        if(index < this.selectedCombiner.length) {
          this.SendMailCombiner(index);
        } else if(this.selectedKnower.length > 0) {
          this.SendMailKnower(0);
        } else {                  
          this.CloseRotiniPanel();
          this.routes.navigate(['Documents/IncomingDoc/docTo-detail/' + this.IncomingDocID]);
        }
      }
    );
  }

  SendMailKnower(index) {
    var user = this.selectedKnower[index];
    const dataSendUser = {
      __metadata: { type: 'SP.Data.ListRequestSendMailListItem' },
      Title: this.listName,
      IndexItem: this.IncomingDocID,
      Step: this.currentStep,
      KeyList: this.listName +  '_' + this.IncomingDocID,
      SubjectMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.AssignEmailSubject, user.split('|')[2]),
      BodyMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.AssignEmailBody, user.split('|')[2]),
      SendMailTo: user.split('|')[1],
    }
    this.services.AddItemToList('ListRequestSendMail', dataSendUser).subscribe(
      itemRoomRQ => {
        console.log(itemRoomRQ['d']);
      },
      error => {
        console.log(error);
        this.CloseRotiniPanel();
      },
      () => {
        console.log('Add email success knower');
        index ++;
        if(index < this.selectedKnower.length) {
          this.SendMailKnower(index);
        } else {                  
          this.CloseRotiniPanel();
          this.routes.navigate(['Documents/IncomingDoc/docTo-detail/' + this.IncomingDocID]);
        }
      }
    );
  }

  SendMailComment() {

  }

  Replace_Field_Mail(FieldMail, ContentMail, UserApprover) {
    try {
      if (this.isNotNull(FieldMail) && this.isNotNull(ContentMail)) {
        let strContent = FieldMail.split(",");
        console.log("ContentMail before: " + ContentMail);
        for (let i = 0; i < strContent.length; i++) {
          switch (strContent[i]) {
            case 'NumberTo':
              ContentMail = ContentMail.replace("{" + strContent[i] + "}", this.itemDoc.numberTo);
              break;
            case 'Compendium':
              ContentMail = ContentMail.replace("{" + strContent[i] + "}", this.docTo.CheckNull(this.itemDoc.compendium));
              break;
            case 'Content':
              ContentMail = ContentMail.replace("{" + strContent[i] + "}", this.docTo.CheckNull(this.content));
              break;
            case 'UserRequest':
              ContentMail = ContentMail.replace("{" + strContent[i] + "}", this.currentUserName);
              break;
            case 'Author':
              ContentMail = ContentMail.replace("{" + strContent[i] + "}", this.currentUserName);
              break;
            case 'CommentReply':
              ContentMail = ContentMail.replace("{" + strContent[i] + "}", this.docTo.CheckNull(this.ContentReply));
              break;
            case 'authorComment':
              ContentMail = ContentMail.replace("{" + strContent[i] + "}", this.docTo.CheckNull(this.AuthorComment) === '' ? '' : this.AuthorComment.Title);
              break;
            case 'ContentComment':
              ContentMail = ContentMail.replace("{" + strContent[i] + "}", this.contentComment);
              break;
            case 'userComment':
              ContentMail = ContentMail.replace("{" + strContent[i] + "}", this.docTo.CheckNull(this.selectedUserComment) === '' ? '' : this.selectedUserComment.split('|')[2]);
              break;
            case 'userStep':
              ContentMail = ContentMail.replace("{" + strContent[i] + "}",UserApprover);
              break;
            case 'UserApprover':
              ContentMail = ContentMail.replace("{" + strContent[i] + "}",UserApprover);
              break;
            case 'ItemUrl':
              ContentMail = ContentMail.replace("{" + strContent[i] + "}", window.location.href.split('#/')[0] + '#/Documents/IncomingDoc/docTo-detail/' + this.IncomingDocID);
              break;
            case 'TaskUrl':
              ContentMail = ContentMail.replace("{" + strContent[i] + "}", window.location.href.split('#/')[0] + '#/Documents/IncomingDoc/docTo-detail/' + this.IncomingDocID + '/' + (this.IndexStep + 1));
              break;
            case 'HomeUrl':
              ContentMail = ContentMail.replace("{" + strContent[i] + "}", window.location.href.split('#/')[0] + '#/Documents/IncomingDoc');
              break;
            case 'LinkRetrieve':
              ContentMail = ContentMail.replace("{" + strContent[i] + "}", window.location.href.split('#/')[0] + '#/Documents/IncomingDoc/docTo-retrieve');
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

  getStatusName(sts) {
    let stsName = '';
    switch(sts) {
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
    return window.location.origin + "/_layouts/15/userphoto.aspx?size=M&username=" + email;
  }
}

