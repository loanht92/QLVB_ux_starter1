import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ViewChild,
  ChangeDetectorRef,
  ViewContainerRef,
  ViewRef
} from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material';
import {
  FormControl,
  FormBuilder,
  FormGroup,
  FormGroupDirective,
  Validators,
  NgForm
} from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
import { Observable } from 'rxjs';
import * as moment from 'moment';
import {
  IncomingDoc,
  ItemSeleted,
  IncomingDocService,
  ApproverObject
} from '../incoming-doc.service';
import { ResApiService } from '../../../services/res-api.service';
import { ErrorStateMatcher } from '@angular/material/core';
import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { environment } from '../../../../../../environments/environment';
import { filter, pairwise } from 'rxjs/operators';
import { ActivatedRoute, Router, RoutesRecognized } from '@angular/router';
import {PlatformLocation} from '@angular/common';
import {
  ROUTE_ANIMATIONS_ELEMENTS,
  NotificationService
} from '../../../../../core/core.module';
import { UserChoice } from '../../document-go/document-go-detail.component';
import { AppComponent } from '../../../../../app/app.component';

declare const _spPageContextInfo;  
/** Error when invalid control is dirty, touched, or submitted. */
export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(
    control: FormControl | null,
    form: FormGroupDirective | NgForm | null
  ): boolean {
    const isSubmitted = form && form.submitted;
    return !!(
      control &&
      control.invalid &&
      (control.dirty || control.touched || isSubmitted)
    );
  }
}

@Component({
  selector: 'anms-document-add',
  templateUrl: './document-add.component.html',
  styleUrls: ['./document-add.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentAddComponent implements OnInit {
  listTitle = 'ListDocumentTo';
  inDocs$: IncomingDoc[] = [];
  displayedColumns: string[] = [
    'numberTo',
    'bookType',
    'compendium',
    'dateTo',
    'edit',
    'delete',
  ]; //'select'
  dataSource = new MatTableDataSource<IncomingDoc>();
  selection = new SelectionModel<IncomingDoc>(true, []);
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  searchText = '';
  date = new FormControl(new Date());
  addNew = false;
  showList = true;
  userApproverId = '';
  currentUserName = '';
  currentUserEmail = '';
  currentUserId = '';
  userApproverEmail = '';
  userApproverName = '';
  currentNumberTo = 0;
  EmailConfig;
  CurrentItem;
  IncomingDocform: FormGroup;
  ListBookType: ItemSeleted[] = [];
  ListDocType: ItemSeleted[] = [];
  ListSecret: ItemSeleted[] = [];
  ListUrgent: ItemSeleted[] = [];
  ListMethodReceipt: ItemSeleted[] = [];
  ListSource: ItemSeleted[] = [];
  ListAllUser: UserChoice[] = [];
  ApproverStep = [];
  DocumentID = 0;
  outputFile = [];
  outputFileHandle = [];
  displayFile = '';
  buffer;
  overlayRef;
  ItemAttachments = [];
  itemDocEdit;
  urlAttachment = environment.proxyUrl.split('/sites/', 1);
  IdEdit = 0;
  Title = '';
  IsClerical = true;
  EmailStepConfig;
  _numberTo;
  constructor(
    private fb: FormBuilder,
    private docTo: IncomingDocService,
    private services: ResApiService,
    private ref: ChangeDetectorRef,
    private readonly notificationService: NotificationService,
    public overlay: Overlay,
    public viewContainerRef: ViewContainerRef,
    private routes: Router,
    private location: PlatformLocation,
    private app: AppComponent
    ) {
    //   location.onPopState(() => {
    //     //alert(window.location);
    //     //window.location.reload();
    //     this.routes.events
    //   .pipe(filter((e: any) => e instanceof RoutesRecognized),
    //       pairwise()
    //   ).subscribe((e: any) => {
    //       let url = e[0].urlAfterRedirects;
    //       console.log(url);
    //       this.ngOnInit();
    //   });
    // });
    }

  ngOnInit() {
    this.getCurrentUser();
    this.getBookType();
    this.getDocType();
    this.getSecretLevel();
    this.getUrgentLevel();
    this.getMethodReceipt();
    this.getSourceAddress();
    this.getUserApprovalList('GĐ');
    this.getListEmailConfig();

    this.IncomingDocform = this.fb.group({
      bookType: ['DT', [Validators.required]],
      numberTo: ['', [Validators.required]],
      numberToSub: '',
      numberOfSymbol: '',
      source: ['', [Validators.required]],
      docType: ['', [Validators.required]],
      promulgatedDate: null,
      dateTo: new Date(),
      compendium: ['', [Validators.required]],
      secretLevel: '',
      urgentLevel: '',
      deadline: null,
      numberOfCopies: '',
      methodReceipt: '',
      userHandle: ['', [Validators.required]],
      note: '',
      isResponse: false,
      isRetrieve: false,
      signer: ''
      //surname: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  myFilter = (d: Date): boolean => {
    const day = d;
    // Prevent Saturday and Sunday from being selected.
    return day >= moment().subtract(1, 'day').toDate();
  }

  myFilter2 = (d: Date): boolean => {
    const day = d;
    // Prevent Saturday and Sunday from being selected.
    return day < moment().toDate();
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

  getAllListDocument() {
    this.OpenRotiniPanel();
    this.docTo.getListDocumentTo(this.currentUserId).subscribe(
      (itemValue: any[]) => {
        let item = itemValue['value'] as Array<any>;
        this.inDocs$ = [];
        item.forEach(element => {
          this.inDocs$.push({
            ID: element.ID,
            bookType: element.BookTypeName,
            numberTo: this.docTo.formatNumberTo(element.NumberTo),
            numberToSub: element.NumberToSub,
            numberOfSymbol: element.NumberOfSymbol,
            source: element.Source,
            docType: element.DocTypeName,
            promulgatedDate:
              this.docTo.CheckNull(element.PromulgatedDate) === ''
                ? ''
                : moment(element.PromulgatedDate).format('DD/MM/YYYY'),
            dateTo:
              this.docTo.CheckNull(element.DateTo) === ''
                ? ''
                : moment(element.DateTo).format('DD/MM/YYYY'),
            compendium: element.Compendium,
            secretLevel: element.SecretLevelName,
            urgentLevel: element.UrgentLevelName,
            deadline:
              this.docTo.CheckNull(element.Deadline) === ''
                ? ''
                : moment(element.Deadline).format('DD/MM/YYYY'),
            numberOfCopies: element.NumOfCopies,
            methodReceipt: element.MethodReceipt,
            userHandle:
              element.UserOfHandle !== undefined
                ? element.UserOfHandle.Title
                : '',
            note: element.Note,
            isResponse: element.IsResponse === 0 ? 'Không' : 'Có',
            isSendMail: 'Có',
            isRetrieve: element.IsRetrieve === 0 ? 'Không' : 'Có',
            signer: element.signer,
            created: element.Author.Title
          });
        });
        this.dataSource = new MatTableDataSource<IncomingDoc>(this.inDocs$);
        if (!(this.ref as ViewRef).destroyed) {
          this.ref.detectChanges();
        }
        this.dataSource.paginator = this.paginator;
      },
      error => {
        console.log('error: ' + error);
        this.CloseRotiniPanel();
      },
      () => {
        this.CloseRotiniPanel();
      }
    );
  }

  ShowFormAddNew(){
    this.addNew = !this.addNew; 
    this.showList = !this.showList;
    this.OpenRotiniPanel();
    this.docTo.getDocumentToMax().subscribe(
      (itemValue: any[]) => {
        let item = itemValue['value'] as Array<any>;
        if (item.length === 0) {
          this.currentNumberTo = 0;
        } else {
          item.forEach(element => {
            this.currentNumberTo = element.NumberTo;
          });
        }
      },
      error => {
        console.log('Load numberTo max error');
        this.CloseRotiniPanel();
      },
      () => {
        this.IncomingDocform.controls['numberTo'].setValue(
          this.docTo.formatNumberTo(++this.currentNumberTo)
        );
        this.IncomingDocform.controls['numberOfSymbol'].setValue(
          this.docTo.formatNumberTo(this.currentNumberTo) + '/Văn bản đến'
        );
        this.CloseRotiniPanel();
      }
    );
  }

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
    this.overlayRef.dispose();
  }
  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource.data.forEach(row => this.selection.select(row));
  }

  checkboxLabel(row?: IncomingDoc): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${
      row.numberTo
    }`;
  }

  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  getCurrentUser() {
    this.services.getCurrentUser().subscribe(
      itemValue => {
        this.currentUserId = itemValue['Id'];
        this.currentUserName = itemValue['Title'];
        this.currentUserEmail = itemValue['Email'];
      },
      error => {
        console.log('error: ' + error);
        this.CloseRotiniPanel();
      },
      () => {
        this.CheckPermission();
        console.log(
          'Current user email is: \n' +
            'Current user Id is: ' +
            this.currentUserId +
            '\n' +
            'Current user name is: ' +
            this.currentUserName
        );
        this.getAllListDocument();
      }
    );
  }

  CheckPermission() {
    this.docTo.getRoleCurrentUser(this.currentUserId).subscribe((itemValue: any[]) => {
      let item = itemValue["value"] as Array<any>; 
      if(item.length < 0) {
        this.notificationService.info("Bạn không có quyền truy cập");
        this.routes.navigate(['/']);
      }
    },
    error => {
      console.log("Check permission failed") ;
      this.CloseRotiniPanel();
    },
    () => {
     console.log("Check permission success");
    })
  }

  getBookType() {
    this.services.getList('ListBookType').subscribe((itemValue: any[]) => {
      let item = itemValue['value'] as Array<any>;
      item.forEach(element => {
        this.ListBookType.push({
          id: element.ID,
          title: element.Title,
          code: element.Code
        });
      });
    });
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

  getMethodReceipt() {
    this.services.getList('ListMethodSend').subscribe((itemValue: any[]) => {
      let item = itemValue['value'] as Array<any>;
      item.forEach(element => {
        this.ListMethodReceipt.push({
          id: element.ID,
          title: element.Title,
          code: ''
        });
      });
    });
  }
  
  getListEmailConfig() {
    const str = `?$select=*&$filter=Title eq 'DT'&$top=1`;
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
          }
      })
      }
    });
  }

  getSourceAddress() {
    this.services.getList('ListSourceAddress').subscribe((itemValue: any[]) => {
      let item = itemValue['value'] as Array<any>;
      item.forEach(element => {
        this.ListSource.push({
          id: element.ID,
          title: element.Title,
          code: element.Address
        });
      });
    });
  }

  getUserApprovalList(role) {
    this.docTo.getUserApprover(role).subscribe(items => {
      let itemUserMember = items['value'] as Array<any>;
      itemUserMember.forEach(element => {
        this.ApproverStep.push({
          UserId: element.User.Id,
          UserName: element.User.Title,
          UserEmail: element.User.Name.split('|')[2],
          Role: element.RoleName,
          Department: element.DepartmentName
        });
      });
    },
    error => {},
    () => {
      this.docTo.getAllUser().subscribe((itemValue: any[]) => {
        let item = itemValue['value'] as Array<any>;
        this.ListAllUser = [];
        item.forEach(element => {
          this.ListAllUser.push({
            Id: element.User.Id,
            DisplayName: element.User.Title,
            Email: element.User.Name.split('|')[2],
            DeCode: element.DepartmentCode,
            DeName: element.DepartmentName,
            RoleCode: element.RoleCode,
            RoleName: element.RoleName
          })         
        })
      })
    });
  }

  splitDataUserApprover(value) {
    this.userApproverId = value.split('_')[0];
    this.userApproverEmail = value.split('_')[1];
    this.userApproverName = value.split('_')[2];
  }

  validation() {
    const dataForm = this.IncomingDocform.getRawValue();

    // if(this.IdEdit <= 0 && this.docTo.CheckNullSetZero(dataForm.numberTo) < this.currentNumberTo) {
    //   this.notificationService.warn('Số đến không hợp lệ! Vui lòng kiểm tra lại');
    //   return false;
    // } 
    if(this.docTo.CheckNull(dataForm.numberOfSymbol).indexOf(this.docTo.formatNumberTo(this.currentNumberTo) + '/') < 0) {
      this.notificationService.warn('Số ký hiệu không hợp lệ! Vui lòng kiểm tra lại');
      return false;
    }
    else if(this.docTo.CheckNull(dataForm.promulgatedDate) !== '' && this.docTo.CheckNull(dataForm.dateTo) !== '') {
      let diff = moment(dataForm.dateTo).diff(moment(dataForm.promulgatedDate), 'day');
      if(diff < 0) {
        this.notificationService.warn('Ngày đến phải lớn hơn hoặc bằng ngày ban hành! Vui lòng kiểm tra lại');
        return false;
      } else {
        return true;
      }
    } else {
      return true;
    }
  }

  AddNewItem(sts) {
    if(!this.validation()) {
      return;
    }
    else if(this.validation()) {
      const dataForm = this.IncomingDocform.getRawValue();  
      if (this.IncomingDocform.valid) {
        this.OpenRotiniPanel();      
        let bookT = this.docTo.FindItemByCode(
          this.ListBookType,
          dataForm.bookType
        );
        let docT = this.docTo.FindItemById(this.ListDocType, dataForm.docType);
        let secretL = this.docTo.FindItemById(
          this.ListSecret,
          dataForm.secretLevel
        );
        let urgentL = this.docTo.FindItemById(
          this.ListUrgent,
          dataForm.urgentLevel
        );
        let method = this.docTo.FindItemById(
          this.ListMethodReceipt,
          dataForm.methodReceipt
        );
        let sourceT = this.docTo.FindItemById(this.ListSource, dataForm.source);
        this.splitDataUserApprover(dataForm.userHandle);
        this.Title =  dataForm.numberTo + '/Văn bản đến'
        const data = {
          __metadata: { type: 'SP.Data.ListDocumentToListItem' },
          Title: dataForm.bookType,
          BookTypeCode: dataForm.bookType,
          BookTypeName: bookT === undefined ? '' : bookT.title,
          NumberTo: dataForm.numberTo,
          NumberToSub: this.docTo.CheckNullSetZero(dataForm.numberToSub),
          NumberOfSymbol: dataForm.numberOfSymbol,
          SourceID: this.docTo.CheckNullSetZero(dataForm.source),
          Source: sourceT === undefined ? '' : sourceT.title,
          DocTypeID: this.docTo.CheckNullSetZero(dataForm.docType),
          DocTypeName: docT === undefined ? '' : docT.title,
          PromulgatedDate: this.docTo.CheckNull(dataForm.promulgatedDate) === '' ? null : moment(dataForm.promulgatedDate).toDate(),
          DateTo: this.docTo.CheckNull(dataForm.dateTo) === '' ? null : moment(dataForm.dateTo).toDate(),
          DateCreated: new Date(),
          Compendium: dataForm.compendium,
          SecretLevelID: this.docTo.CheckNullSetZero(dataForm.secretLevel),
          SecretLevelName: secretL === undefined ? '' : secretL.title,
          UrgentLevelID: this.docTo.CheckNullSetZero(dataForm.urgentLevel),
          UrgentLevelName: urgentL === undefined ? '' : urgentL.title,
          Deadline: this.docTo.CheckNull(dataForm.deadline) === '' ? null : moment(dataForm.deadline).toDate(),
          NumOfCopies: this.docTo.CheckNullSetZero(dataForm.numberOfCopies),
          MethodReceiptID: this.docTo.CheckNullSetZero(dataForm.methodReceipt),
          MethodReceipt: method === undefined ? '' : method.title,
          UserOfHandleId: this.userApproverId,
          Note: dataForm.note,
          IsResponse: dataForm.isResponse ? 1 : 0,
          // IsRetrieve: dataForm.isRetrieve ? 1 : 0,
          StatusID: sts,
          StatusName: sts === 0 ? 'Chờ xử lý' : 'Lưu tạm',
          Signer: dataForm.signer,
          ListUserApprover: this.userApproverId + '_' + this.userApproverName,
        };
        if(this.IdEdit <= 0) {
          this.services.AddItemToList(this.listTitle, data).subscribe(
            item => {
              this.DocumentID = item['d'].Id;
              this.CurrentItem = item['d'];
            },
            error => {
              this.CloseRotiniPanel();
              console.log(
                'error when add item to list ' +
                  this.listTitle +
                  ': ' +
                  error.error.error.message.value
              ),
                this.notificationService.error('Thêm văn bản đến thất bại');
            },
            () => {
              console.log(
                'Add item of approval user to list ' +
                  this.listTitle +
                  ' successfully!'
              );
              if (sts === 0) {
                this.AddHistoryStep();
              } else {
                this.saveItemAttachment(0, this.DocumentID);
              }
            }
          );
        } else {
          this.services.updateListById(this.listTitle, data, this.IdEdit).subscribe(
            item => {
              this.DocumentID = this.IdEdit;
            },
            error => {
              this.CloseRotiniPanel();
              console.log(
                'error when update item to list ' +
                  this.listTitle +
                  ': ' +
                  error
              ),
                this.notificationService.error('Thêm văn bản đến thất bại');
            },
            () => {
              console.log(
                'update item of approval user to list ' +
                  this.listTitle +
                  ' successfully!'
              );
              if (sts === 0) {
                this.AddHistoryStep();
              } else {
                this.saveItemAttachment(0, this.DocumentID);
              }
            }
          );
        }
      }
    }
  }

  AddListTicket() {
    const dataForm = this.IncomingDocform.getRawValue();
    let request, approver;
    request = this.ListAllUser.find(item => item.Id === this.docTo.CheckNullSetZero(this.currentUserId) && item.RoleCode === "VT");
    approver = this.ListAllUser.find(item => item.Id === this.docTo.CheckNullSetZero(this.userApproverId));
    const data = {
      __metadata: { type: 'SP.Data.ListProcessRequestToListItem' },
      Title: dataForm.numberTo,
      DateCreated: new Date(),
      NoteBookID: this.DocumentID,
      UserRequestId: this.currentUserId,
      UserApproverId: this.userApproverId,
      Deadline:  this.docTo.CheckNull(dataForm.deadline) === '' ? null : moment(dataForm.deadline).toDate(),
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
      Content: dataForm.note,
      IndexStep: 2,
      Compendium: dataForm.compendium
    };

    let sourceT = this.docTo.FindItemById(this.ListSource, dataForm.source);
    const data2 = {
      __metadata: { type: 'SP.Data.ListProcessRequestToListItem' },
      Title: dataForm.numberTo,
      DateCreated: new Date(),
      NoteBookID: this.DocumentID,
      UserRequestId: this.currentUserId,
      UserApproverId: this.currentUserId,
      Deadline: this.docTo.CheckNull(dataForm.deadline) === '' ? null : moment(dataForm.deadline).toDate(),
      StatusID: 1,
      StatusName: 'Đã xử lý',
      Source: sourceT === undefined ? '' : sourceT.title,
      Destination: request === undefined ? '' : request.DeName,
      RoleUserRequest :'',
      RoleUserApprover: request === undefined ? '' : request.RoleName,
      TaskTypeCode: 'XLC',
      TaskTypeName: 'Xử lý chính',
      TypeCode: 'CXL',
      TypeName: 'Chuyển xử lý',
      Content: dataForm.note,
      IndexStep: 1,
      Compendium: dataForm.compendium
    };

    this.services.AddItemToList('ListProcessRequestTo', data2).subscribe(
      item => {},
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
        this.addItemSendMail();
        this.services.AddItemToList('ListProcessRequestTo', data).subscribe(
          item => {},
          error => {
            this.CloseRotiniPanel();
            console.log(
              'error when add item to list ListProcessRequestTo: ' +
                error.error.error.message.value
            ),
              this.notificationService.error('Thêm phiếu xử lý thất bại');
          },
          () => {}
        );
        this.saveItemAttachment(0, this.DocumentID);
      }
    );
  }

  AddHistoryStep() {
    const dataForm = this.IncomingDocform.getRawValue();
    let sourceT = this.docTo.FindItemById(this.ListSource, dataForm.source);
    const data = {
      __metadata: { type: 'SP.Data.ListHistoryRequestToListItem' },
      Title: dataForm.numberTo,
      DateCreated: new Date(),
      NoteBookID: this.DocumentID,
      UserRequestId: this.currentUserId,
      UserApproverId: this.userApproverId,
      Deadline: this.docTo.CheckNull(dataForm.deadline) === '' ? null : moment(dataForm.deadline).toDate(),
      StatusID: 0,
      StatusName: 'Chờ xử lý',
      Content: dataForm.note,
      IndexStep: 1,
      Compendium: dataForm.compendium,
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
        this.AddListTicket();
      }
    );
  }

  addItemSendMail() {
    try {
      // send mail user created
      const dataSendUser = {
        __metadata: { type: 'SP.Data.ListRequestSendMailListItem' },
        Title: this.listTitle,
        IndexItem: this.DocumentID,
        Step: 1,
        KeyList: this.listTitle +  '_' + this.DocumentID,
        SubjectMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.NewEmailSubject),
        BodyMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.NewEmailBody),
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
          console.log('Save item success');

          const dataSendApprover = {
            __metadata: { type: 'SP.Data.ListRequestSendMailListItem' },
            Title: this.listTitle,
            IndexItem: this.DocumentID,
            Step: 1,
            KeyList: this.listTitle +  '_' + this.DocumentID,
            SubjectMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.AssignEmailSubject),
            BodyMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.AssignEmailBody),
            SendMailTo: this.userApproverEmail
          }
          this.services.AddItemToList('ListRequestSendMail', dataSendApprover).subscribe(
            itemCarRQ => {
              console.log(itemCarRQ['d']);
            },
            error => {
              console.log(error);
              this.CloseRotiniPanel();
            },
            () => {
              console.log('Add email success');
            }
          )
        }
      )
    } catch (error) {
      console.log('addItemSendMail error: ' + error.message);
    }
  }

  Replace_Field_Mail(FieldMail, ContentMail) {
    try {
      if (this.isNotNull(FieldMail) && this.isNotNull(ContentMail)) {
        let strContent = FieldMail.split(",");
        console.log("ContentMail before: " + ContentMail);
        for (let i = 0; i < strContent.length; i++) {
          switch (strContent[i]) {
            case 'NumberTo':
              ContentMail = ContentMail.replace("{" + strContent[i] + "}", this.docTo.formatNumberTo(this.currentNumberTo));
              break;
            case 'Compendium':
              // ContentMail = ContentMail.replace("{" + strContent[i] + "}", this.docTo.CheckNull(this.IncomingDocform.controls['compendium'].value));
              ContentMail = ContentMail.replace("{" + strContent[i] + "}", this.CurrentItem.Compendium);
              break;
            case 'Content':
              // ContentMail = ContentMail.replace("{" + strContent[i] + "}", this.docTo.CheckNull(this.IncomingDocform.controls['note'].value));
              ContentMail = ContentMail.replace("{" + strContent[i] + "}", this.CurrentItem.Note);
              break;
            case 'UserRequest':
              ContentMail = ContentMail.replace("{" + strContent[i] + "}", this.currentUserName);
              break;
            case 'Author':
              ContentMail = ContentMail.replace("{" + strContent[i] + "}", this.currentUserName);
              break;
            case 'userStep':
              ContentMail = ContentMail.replace("{" + strContent[i] + "}", this.userApproverName);
              break;
            case 'UserApprover':
              ContentMail = ContentMail.replace("{" + strContent[i] + "}", this.userApproverName);
              break;
            case 'ItemUrl':
              ContentMail = ContentMail.replace("{" + strContent[i] + "}", window.location.href.split('#/')[0]+ '#/Documents/IncomingDoc/docTo-detail/' + this.DocumentID);
              break;
            case 'TaskUrl':
              ContentMail = ContentMail.replace("{" + strContent[i] + "}", window.location.href.split('#/')[0] + '#/Documents/IncomingDoc/docTo-detail/' + this.DocumentID + "/1");
              break;
            case 'HomeUrl':
              ContentMail = ContentMail.replace("{" + strContent[i] + "}", window.location.href.split('#/')[0] + '#/Documents/IncomingDoc');
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

  reset() {
    this.IncomingDocform.reset();
    this.IncomingDocform.clearValidators();
    this.IncomingDocform.clearAsyncValidators();
    this.IncomingDocform.controls['bookType'].setValue('DT');
    this.IncomingDocform.controls['numberTo'].setValue(
      this.docTo.formatNumberTo(this.currentNumberTo)
    );
    this.IncomingDocform.controls['numberOfSymbol'].setValue(
      this.docTo.formatNumberTo(this.currentNumberTo) + '/Văn bản đến'
    );
    this.IncomingDocform.controls['dateTo'].setValue(
      new Date()
    );
    this.outputFile = [];
    this.ItemAttachments = [];
  }

  addAttachmentFile(sts) {
    try {
      const inputNode: any = document.querySelector('#fileAttachment');
      if (this.isNotNull(inputNode.files[0])) {
        console.log(inputNode.files[0]);
        if (this.outputFile.length > 0) {
          if (
            this.outputFile.findIndex(
              index => index.name === inputNode.files[0].name
            ) === -1
          ) {
            this.outputFile.push(inputNode.files[0]);
            this.ItemAttachments.push(inputNode.files[0]);
          }
        } else {
          this.outputFile.push(inputNode.files[0]);
          this.ItemAttachments.push(inputNode.files[0]);
        }
      }
    } catch (error) {
      console.log('addAttachmentFile error: ' + error);
    }
  }

  removeAttachmentFile(index) {
    try {
      let indexNew = this.outputFile.indexOf(index);
      if(indexNew >= 0) {
        console.log(indexNew);
        this.outputFile.splice(indexNew, 1);
      } else {
        const data = {
          __metadata: { type: 'SP.Data.ListDocumentToListItem' },
        }
        this.services.DeleteAttachmentById(this.listTitle, data, this.IdEdit, index.name).subscribe(item => {},
          error => {
            console.log(
              'error when delete attachment item to list DocumentTo: ' + error
            )
          },
          () => {}
        );
      }  
      let indexOld = this.ItemAttachments.findIndex(i => i.name === index.name);
      if(indexOld >= 0) {
        this.ItemAttachments.splice(indexOld, 1);   
      }
    } catch (error) {
      console.log('removeAttachmentFile error: ' + error);
      this.CloseRotiniPanel();
    }
  }

  isNotNull(str) {
    return str !== null && str !== '' && str !== undefined;
  }

  saveItemAttachment(index, idItem) {
    if (this.outputFile.length > 0) {
      try {
        this.buffer = this.getFileBuffer(this.outputFile[index]);
        this.buffer.onload = (e: any) => {
          console.log(e.target.result);
          const dataFile = e.target.result;
          this.services
            .inserAttachmentFile(
              dataFile,
              this.outputFile[index].name,
              this.listTitle,
              idItem
            )
            .subscribe(
              itemAttach => {
                console.log('inserAttachmentFile success');
              },
              error => {
                console.log('error: ' + error);
                this.CloseRotiniPanel();
              },
              () => {
                console.log('inserAttachmentFile successfully');
                if (Number(index) < this.outputFile.length - 1) {
                  this.saveItemAttachment(Number(index) + 1, idItem);
                } else {
                  //alert("Save request successfully");
                  this.callbackfunc();
                }
              }
            );
        };
      } catch (error) {
        this.notificationService.error('Thêm tệp đính kèm thất bại');
        console.log('saveItemAttachment error: ' + error);
        this.CloseRotiniPanel();
      }
    } else {
      this.callbackfunc();
    }
  }

  getFileBuffer(file) {
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    return reader;
  }

  callbackfunc() {
    // window.location.href = '/workflows/LeaveofAbsence/detail/'+ id;
    this.CloseRotiniPanel();
    this.notificationService.success('Thêm văn bản đến thành công');
    this.routes.navigate(['Documents/IncomingDoc/docTo-detail/' + this.CurrentItem.Id]);
    // this.getAllListDocument();
    // this.addNew = !this.addNew;
    // this.showList = !this.showList;
    // this.reset();
  }

  DeleteItem(id){
    if(id > 0) {
      this.OpenRotiniPanel();
      const data = {
        __metadata: { type: 'SP.Data.ListDocumentToListItem' },
      }
      this.services.DeleteItemById(this.listTitle, data, id).subscribe(item => {},
      error => {
        this.CloseRotiniPanel();
        console.log(
          'error when delete item to list DocumentTo: ' + error
        ),
        this.notificationService.error('Xóa văn bản thất bại');
      },
      () => {
        console.log(
          'Delete item in list DocumentTo successfully!'
        );
        this.notificationService.success('Xóa văn bản thành công');
        let index = this.inDocs$.findIndex(i => i.ID === id);
        if(index >= 0) {
          this.inDocs$.splice(index, 1);
        }
        this.dataSource = new MatTableDataSource<IncomingDoc>(this.inDocs$);
        if (!(this.ref as ViewRef).destroyed) {
          this.ref.detectChanges();
        }
        this.dataSource.paginator = this.paginator;
        this.CloseRotiniPanel();
      })
    }
  }

  EditItem(id){
    this.OpenRotiniPanel();
    this.IdEdit = id;
    this.addNew = !this.addNew; 
    this.showList = !this.showList;
    this.docTo.getListDocByID(id).subscribe(items => {
      console.log('items: ' + items);
      let itemList = items['value'] as Array<any>;
      if(itemList.length > 0){
        if (itemList[0].AttachmentFiles.length > 0) {
          itemList[0].AttachmentFiles.forEach(element => {
            this.ItemAttachments.push({name: element.FileName});
          });
        }
        this.currentNumberTo = itemList[0].NumberTo;
        this.itemDocEdit = {
          ID: itemList[0].ID,
          bookType: itemList[0].BookTypeID,
          numberTo: this.docTo.formatNumberTo(itemList[0].NumberTo),
          numberToSub:
            itemList[0].NumberToSub === 0 ? '' : itemList[0].NumberToSub,
          numberOfSymbol: this.docTo.CheckNull(itemList[0].NumberOfSymbol) === '' ? '' : itemList[0].NumberOfSymbol,
          source: itemList[0].SourceID,
          docType: itemList[0].DocTypeID,
          promulgatedDate:
            this.docTo.CheckNull(itemList[0].PromulgatedDate) === ''
              ? ''
              : itemList[0].PromulgatedDate,
          dateTo:
            this.docTo.CheckNull(itemList[0].DateTo) === ''
              ? ''
              : itemList[0].DateTo,
          compendium: itemList[0].Compendium,
          secretLevel: itemList[0].SecretLevelID,
          urgentLevel: itemList[0].UrgentLevelID,
          deadline:
            this.docTo.CheckNull(itemList[0].Deadline) === ''
              ? ''
              : itemList[0].Deadline,
          numberOfCopies: this.docTo.CheckNullSetZero(itemList[0].NumOfCopies) === 0 ? '' : itemList[0].NumOfCopies,
          methodReceipt: itemList[0].MethodReceiptID,
          userHandle:
            itemList[0].UserOfHandle !== undefined
              ? itemList[0].UserOfHandle.Id + '_' + itemList[0].UserOfHandle.Name.split('|')[2] + '_' + itemList[0].UserOfHandle.Title
              : '',
          note: this.docTo.CheckNull(itemList[0].Note) === '' ? '' : itemList[0].Note,
          isResponse: itemList[0].IsResponse,
          isSendMail: 'Có',
          isRetrieve: itemList[0].IsRetrieve,
          signer: this.docTo.CheckNull(itemList[0].Signer) === '' ? '' : itemList[0].Signer,
          created: itemList[0].Author.Id
        };

        this.IncomingDocform.patchValue({
          numberTo: this.docTo.formatNumberTo(this.itemDocEdit.numberTo),
          numberToSub: this.itemDocEdit.numberToSub,
          numberOfSymbol: this.docTo.formatNumberTo(this.itemDocEdit.numberTo) + '/Văn bản đến',
          source: this.itemDocEdit.source + '',
          docType: this.itemDocEdit.docType + '',
          promulgatedDate: this.itemDocEdit.promulgatedDate,
          dateTo: this.itemDocEdit.dateTo,
          compendium: this.itemDocEdit.compendium,
          secretLevel: this.itemDocEdit.secretLevel + '',
          urgentLevel: this.itemDocEdit.urgentLevel + '',
          deadline: this.itemDocEdit.deadline,
          numberOfCopies: this.itemDocEdit.numberOfCopies,
          methodReceipt: this.itemDocEdit.methodReceipt + '',
          userHandle: this.itemDocEdit.userHandle + '',
          note: this.itemDocEdit.note,
          isResponse: this.itemDocEdit.isResponse === 0 ? false : true,
          isRetrieve: this.itemDocEdit.isRetrieve === 0 ? false : true,
          signer: this.itemDocEdit.signer
        });
      }
      if (!(this.ref as ViewRef).destroyed) {
        this.ref.detectChanges();
      }
      this.CloseRotiniPanel();
    });
  }
}

@Component({
  selector: 'rotini-panel',
  template:
    '<p class="demo-rotini" style="padding: 10px; background-color: #F6753C !important;color:white;">Waiting....</p>'
})
export class RotiniPanel {}
