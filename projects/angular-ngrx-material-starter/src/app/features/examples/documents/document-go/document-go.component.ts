import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  ViewContainerRef,
  ViewRef
} from '@angular/core';
import { Observable, from } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
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
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import * as moment from 'moment';

import { PlatformLocation } from '@angular/common';
import { IncomingDocService } from '../document-to/incoming-doc.service';

import {
  ROUTE_ANIMATIONS_ELEMENTS,
  NotificationService
} from '../../../../core/core.module';

import { ResApiService } from '../../services/res-api.service';
import { DocumentGoService } from './document-go.service';
import {
  ItemDocumentGo,
  ListDocType,
  ItemSeleted,
  ItemSeletedCode,
  ItemUser,
  DocumentGoTicket,
  AttachmentsObject,
  UserProfilePropertiesObject
} from './../models/document-go';
import { ErrorStateMatcher } from '@angular/material/core';
import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

@Component({
  selector: 'anms-document-go',
  templateUrl: './document-go.component.html',
  styleUrls: ['./document-go.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentGoComponent implements OnInit {
  bsModalRef: BsModalRef;
  form = this.fb.group({
    Compendium: [
      '',
      [
        Validators.required
        // Validators.minLength(2),
        // Validators.maxLength(1000)
      ]
    ],
    UnitCreate: null,
    UserCreate: null,
    BookType: ['DG', [Validators.required]],
    // NumberGo: null,
    NumberSymbol: '',
    DocType: null,
    RecipientsIn: null,
    RecipientsOut: null,
    UserOfHandle: ['', [Validators.required]],
    UserOfCombinate: null,
    UserOfKnow: null,
    SecretLevel: null,
    UrgentLevel: null,
    MethodSend: null,
    //Signer: null,
    Note: '',
    NumOfPaper: null,
    Deadline: null,
    // DateIssued: null,
    isRespinse: false,
    isSendMail: false
  });
  formValueChanges$: Observable<ItemDocumentGo>;
  displayedColumns: string[] = [
    'ID',
    'DocTypeName',
    'Compendium',
    'UserCreateName',
    'DateCreated',
    //'UserOfHandle',
    'Deadline',
    'StatusName',
    'Edit',
    'Delete'
  ];
  listTitle = 'ListDocumentGo';
  dataSource = new MatTableDataSource<ItemDocumentGo>();
  // selection = new SelectionModel<PeriodicElement>(true, []);
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  searchText = '';
  date = new FormControl(new Date());
  addNew = false;
  showList = true;
  ListDocumentGo: ItemDocumentGo[] = [];
  ListBookType: ItemSeletedCode[] = [];
  ListDocType: ItemSeleted[] = [];
  ListSecret: ItemSeleted[] = [];
  ListUrgent: ItemSeleted[] = [];
  ListMethodSend: ItemSeleted[] = [];
  ListDepartment: ItemSeleted[] = [];
  ListSource: ItemSeletedCode[] = [];
  ListApproverStep: ItemUser[] = [];
  ListAllUser: ItemUser[] = [];
  //  ListUserSigner: ItemUser[] = [];
  ListUserCreate: ItemUser[] = [];
  SelectUserKnower;
  SelectUserCombiner;
  BookType = 'DG';
  idStatus = '';
  strFilter = '';
  strFilterUser = '';
  userApproverId = '';
  userApproverEmail = '';
  userApproverName = '';
  currentUserId = 0;
  currentUserName = '';
  currentUserEmail = '';
  currentNumberGo = 0;
  DocumentID = 0;
  outputFile = [];
  displayFile = '';
  buffer;
  overlayRef;
  IdEdit = 0;
  itemDoc: ItemDocumentGo;
  ItemAttachments: AttachmentsObject[] = [];
  urlAttachment;
  EmailConfig;
  EmailConfigDT;
  UserOfCombinate = 0;
  UserOfKnow = 0;
  DocumentToId = '';
  IdDelete = 0;
  ChuyenXL = 0;IsTP=false;IsNV=false;IsFlag=false;
  constructor(
    private fb: FormBuilder,
    private notificationService: NotificationService,
    private docServices: DocumentGoService,
    private services: ResApiService,
    private docToServices: IncomingDocService,
    private route: ActivatedRoute,
    private ref: ChangeDetectorRef,
    public overlay: Overlay,
    public viewContainerRef: ViewContainerRef,
    private location: PlatformLocation,
    private routes: Router,
    private modalService: BsModalService
  ) {
    this.location.onPopState(() => {
      console.log('Init: pressed back!');
      window.location.reload();
      return;
    });
  }

  ngOnInit() {
    console.log('DocumentToId=' + this.DocumentToId);
    this.route.paramMap.subscribe(parames => {
      this.DocumentToId = this.docServices.checkNull(parames.get('value'));
    });
    this.getCurrentUser();
    // danh mục
    this.getListBookType();
    this.getListDepartment();
    this.getListDocType();
    this.getListMethodSend();
    this.getListSecret();
    this.getListUrgent();
    this.getSourceAddress();
    //this.getUserApproverStep();
    //  this.getUserSigner();
    this.getUserCreate();
   // this.getListEmailConfig();
  }

  ClickItem(row) {
    console.log(row);
    this.routes.navigate(['/Documents/documentgo-detail/' + row.ID]);
  }

  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  myFilter = (d: Date): boolean => {
    const day = d;
    // Prevent Saturday and Sunday from being selected.
    return (
      day >=
      moment()
        .subtract(1, 'day')
        .toDate()
    );
  };

  myFilter2 = (d: Date): boolean => {
    const day = d;
    // Prevent Saturday and Sunday from being selected.
    return day < moment().toDate();
  };

  validateQty(event) {
    var key = window.event ? event.keyCode : event.which;
    if (event.keyCode === 8) {
      return true;
    } else {
      return false;
    }
  }

  //Lấy người dùng hiện tại
  // getCurrentUser() {
  //   this.services.getCurrentUser().subscribe(
  //     itemValue => {
  //       this.currentUserId = itemValue['Id'];
  //       this.currentUserName = itemValue['Title'];
  //       this.currentUserEmail = itemValue['Email'];
  //     },
  //     error => {
  //       console.log('error: ' + error);
  //       this.CloseDocumentGoPanel();
  //     },
  //     () => {
  //       this.CheckPermission();
  //       console.log(
  //         'Current user email is: \n' +
  //           'Current user Id is: ' +
  //           this.currentUserId +
  //           '\n' +
  //           'Current user name is: ' +
  //           this.currentUserName
  //       );
  //       this.getListDocumentGo();
  //     }
  //   );
  // }
 //Lấy người dùng hiện tại
 getCurrentUser() {
  this.services.getCurrentUser().subscribe(
    itemValue => {
      this.currentUserId = itemValue['Id'];
      this.currentUserName = itemValue['Title'];
      this.currentUserEmail = itemValue['Email'];
      console.log('currentUserEmail: ' + this.currentUserEmail);
    },
    error => {
      console.log('error: ' + error);
      this.CloseDocumentGoPanel();
    },
    () => {
      this.OpenDocumentGoPanel();
      console.log(
        'Current user email is: \n' +
          'Current user Id is: ' +
          this.currentUserId +
          '\n' +
          'Current user name is: ' +
          this.currentUserName
      );
      this.services.getDepartmnetOfUser(this.currentUserId).subscribe(
        itemValue => {
          let itemUserMember = itemValue['value'] as Array<any>;
          if (itemUserMember.length > 0) {
            itemUserMember.forEach(element => {
              if (element.RoleCode === 'TP') {
                this.IsTP = true;
              } else if (element.RoleCode === 'NV') {
                this.IsNV = true;
              } 
            });
            this.CheckPermission();
            this.getListEmailConfig();
            this.getListDocumentGo();
            this.getUserApproverStep();
            this.CloseDocumentGoPanel();
          } else {
            this.notificationService.info('Bạn không có quyền truy cập');
            this.routes.navigate(['/']);
            this.CloseDocumentGoPanel();
          }
        },
        error => {
          console.log('Load department code error: ' + error);
          this.CloseDocumentGoPanel();
        },
        () => {}
      );
    }
  );
}

  CheckPermission() {
  //  this.OpenDocumentGoPanel();
    this.docServices.getRoleCurrentUser(this.currentUserId).subscribe(
      (itemValue: any[]) => {
        let item = itemValue['value'] as Array<any>;
        if (item.length <= 0) {
          this.notificationService.info('Bạn không có quyền truy cập');
          this.routes.navigate(['/']);
        }
      },
      error => {
        console.log('Check permission failed');
        this.CloseDocumentGoPanel();
      },
      () => {
        console.log('Check permission success');
      //  this.CloseDocumentGoPanel();
      }
    );
  }

  OpenDocumentGoPanel() {
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

  CloseDocumentGoPanel() {
    this.overlayRef.dispose();
  }

  getListEmailConfig() {
    //&$top=1
    const str = `?$select=*&$filter=Title eq 'DG' or Title eq 'DT'`;
    this.EmailConfig = null;
    this.services
      .getItem('ListEmailConfig', str)
      .subscribe((itemValue: any[]) => {
        let item = itemValue['value'] as Array<any>;
        if (item.length > 0) {
          item.forEach(element => {
            if (element.Title === 'DG') {
              this.EmailConfig = {
                FieldMail: element.FieldMail,
                NewEmailSubject: element.NewRequestSubject,
                NewEmailBody: element.NewRequestBody,
                ApprovedEmailSubject: element.ApprovedRequestSubject,
                ApprovedEmailBody: element.ApprovedRequestBody,
                AssignEmailSubject: element.AssignRequestSubject,
                AssignEmailBody: element.AssignRequestBody,
                FinishEmailSubject: element.FinishRequestSubject,
                FinishEmailBody: element.FinishRequestBody
              };
            } else if (element.Title === 'DT') {
              this.EmailConfigDT = {
                FieldMail: element.FieldMail,
                FinishEmailSubject: element.FinishRequestSubject,
                FinishEmailBody: element.FinishRequestBody
              };
            }
          });
        }
      });
  }

  //lấy ds văn bản
  getListDocumentGo() {
    this.strFilter =
      `&$filter=Author/Id eq '` + this.currentUserId + `'and StatusID eq '-1'`;
    //   this.strFilter += `and StatusID eq '-1'`;
    try {
      this.ListDocumentGo = [];
      this.docServices.getListDocumentGo(this.strFilter).subscribe(
        itemValue => {
          let item = itemValue['value'] as Array<any>;
          item.forEach(element => {
            // console.log('UserCreate:'+ element.UserCreate.Title);
            // console.log('UserOfHandle:'+ element.UserOfHandle.Title);
            this.ListDocumentGo.push({
              ID: element.ID,
              NumberGo: this.docServices.checkNull(element.NumberGo),
              DocTypeName: this.docServices.checkNull(element.DocTypeName),
              NumberSymbol: this.docServices.checkNull(element.NumberSymbol),
              Compendium: this.docServices.checkNull(element.Compendium),
              AuthorId:
                element.UserCreate == undefined ? '' : element.UserCreate.Id,
              UserCreateName:
                element.UserCreate == undefined ? '' : element.UserCreate.Title,
              DateCreated: this.docServices.formatDateTime(element.DateCreated),
              UserOfHandleName:
                element.UserOfHandle == undefined
                  ? ''
                  : element.UserOfHandle.Title,
              UserOfKnowName:
                element.UserOfKnow == undefined ? '' : element.UserOfKnow.Title,
              UserOfCombinateName:
                element.UserOfCombinate == undefined
                  ? ''
                  : element.UserOfCombinate.Title,
              Deadline: this.docServices.formatDateTime(element.Deadline),
              StatusName: this.docServices.checkNull(element.StatusName),
              BookTypeName: '',
              UnitCreateName: '',
              RecipientsInName: '',
              RecipientsOutName: '',
              SecretLevelName: '',
              UrgentLevelName: '',
              SecretLevelId: 0,
              UrgentLevelId: 0,
              MethodSendName: '',
              DateIssued: '',
              SignerName: '',
              Note: '',
              NumOfPaper: '',
              link: ''
            });
          });
        },
        error =>{
          console.log(error);
          this.CloseDocumentGoPanel();
        } ,
        () => {
          console.log('get success');
          this.dataSource = new MatTableDataSource<ItemDocumentGo>(
            this.ListDocumentGo
          );
          if (!(this.ref as ViewRef).destroyed) {
            this.ref.detectChanges();
          }
          this.dataSource.paginator = this.paginator;
        }
      );
    } catch (error) {
      console.log(error);
      this.CloseDocumentGoPanel();
    }
  }
  // danh mục phong ban
  getListDepartment() {
    this.services.getListDepartment().subscribe(itemValue => {
      let item = itemValue['value'] as Array<any>;
      item.forEach(element => {
        this.ListDepartment.push({
          ID: element.ID,
          Title: element.Title
        });
      });
    });
  }
  // danh mục loại văn bản
  getListDocType() {
    this.services.getListDocType().subscribe(itemValue => {
      let item = itemValue['value'] as Array<any>;
      item.forEach(element => {
        this.ListDocType.push({
          ID: element.ID,
          Title: element.Title
        });
      });
    });
  }
  // danh mục sổ văn bản
  getListBookType() {
    this.services.getListBookType().subscribe(itemValue => {
      let item = itemValue['value'] as Array<any>;
      item.forEach(element => {
        this.ListBookType.push({
          ID: element.ID,
          Title: element.Title,
          Code: element.Code
        });
      });
    });
  }
  //dm độ mật
  getListSecret() {
    this.services.getListSecret().subscribe(itemValue => {
      let item = itemValue['value'] as Array<any>;
      item.forEach(element => {
        this.ListSecret.push({
          ID: element.ID,
          Title: element.Title
        });
      });
    });
  }
  //dm độ khẩn
  getListUrgent() {
    this.services.getListUrgent().subscribe(itemValue => {
      let item = itemValue['value'] as Array<any>;
      item.forEach(element => {
        this.ListUrgent.push({
          ID: element.ID,
          Title: element.Title
        });
      });
    });
  }
  //dm phương thức gửi
  getListMethodSend() {
    this.services.getListMethodSend().subscribe(itemValue => {
      let item = itemValue['value'] as Array<any>;
      item.forEach(element => {
        this.ListMethodSend.push({
          ID: element.ID,
          Title: element.Title
        });
      });
    });
  }
  //dm đơn vị ngoài
  getSourceAddress() {
    this.services.getListSourceAddress().subscribe((itemValue: any[]) => {
      let item = itemValue['value'] as Array<any>;
      item.forEach(element => {
        this.ListSource.push({
          ID: element.ID,
          Title: element.Title,
          Code: element.Address
        });
      });
    });
  }
  //danh sách người xử lý
  getUserApproverStep() {
    let strFilterUser;
    //nếu người tạo là trưởng phòng
    if(this.IsTP){
      strFilterUser  = `&$filter=RoleCode eq 'VT' or RoleCode eq 'NV'`;
    }
    //nếu người tạo là nhân viên
    else  if(this.IsNV){
       strFilterUser = `&$filter=RoleCode eq 'TP'`;
    }
    this.docServices.getUser(strFilterUser).subscribe(
      items => {
        let itemUserMember = items['value'] as Array<any>;
        this.ListApproverStep = [];
        itemUserMember.forEach(element => {
          if (
            this.ListApproverStep.findIndex(u => u.UserId === element.User.Id) <
            0
          ) {
            this.ListApproverStep.push({
              UserId: element.User.Id,
              UserName: element.User.Title,
              UserEmail: element.User.Name.split('|')[2],
              Role: element.RoleName,
              RoleCode: element.RoleCode,
              Department: element.DepartmentName,
              DepartmentCode: element.DepartmentCode
            });
          }
        });
      },
      error => {},
      () => {
        this.docServices.getAllUser().subscribe(
          (itemValue: any[]) => {
            let item = itemValue['value'] as Array<any>;
            this.ListAllUser = [];
            item.forEach(element => {
              if (
                this.ListAllUser.findIndex(u => u.UserId === element.User.Id) <
                0
              ) {
                this.ListAllUser.push({
                  UserId: element.User.Id,
                  UserName: element.User.Title,
                  UserEmail: element.User.Name.split('|')[2],
                  Role: element.RoleName,
                  RoleCode: element.RoleCode,
                  Department: element.DepartmentName,
                  DepartmentCode: element.DepartmentCode
                });
              }
            });
          },
          error => {
            console.log('Load all user error ' + error);
            this.CloseDocumentGoPanel();
          },
          () => {}
        );
      }
    );
  }

  //danh sách người ký
  // getUserSigner() {
  //   let strFilterUser = `&$filter=RoleCode eq 'GĐ'`;
  //   this.docServices.getUser(strFilterUser).subscribe(items => {
  //     let itemUserMember = items['value'] as Array<any>;
  //     itemUserMember.forEach(element => {
  //       this.ListUserSigner.push({
  //         UserId: element.User.Id,
  //         UserName: element.User.Title,
  //         UserEmail: element.User.Name.split('|')[2],
  //         Role: element.RoleName,
  //         RoleCode: element.RoleCode,
  //         Department: element.DepartmentName,
  //         DepartmentCode: element.DepartmentCode
  //       });
  //     });
  //   });
  // }
  //danh sách tạo
  getUserCreate() {
    this.docServices.getUser('').subscribe(items => {
      let itemUserMember = items['value'] as Array<any>;
      itemUserMember.forEach(element => {
        this.ListUserCreate.push({
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

  //lấy ra id , email
  splitDataUserApprover(value) {
    this.userApproverId = value.split('|')[0];
    this.userApproverEmail = value.split('|')[1];
    this.userApproverName = value.split('|')[2];
  }

  //Thêm mới văn bản đi
  //ChuyenXL = 0: chuyển xử lý, -1 là lưu tạm
  save(ChuyenXL) {
    try {
      this.ChuyenXL = ChuyenXL;
      const dataForm = this.form.getRawValue();
      if (this.form.valid) {
        this.OpenDocumentGoPanel();
        let itemBookType = this.docServices.FindItemByCode(
          this.ListBookType,
          this.form.get('BookType').value
        );
        let itemDocType = this.docServices.FindItemById(
          this.ListDocType,
          this.form.get('DocType').value
        );
        let itemRecipientsIn = this.docServices.FindItemById(
          this.ListDepartment,
          this.form.get('RecipientsIn').value
        );
        let itemRecipientsOut = this.docServices.FindItemById(
          this.ListSource,
          this.form.get('RecipientsOut').value
        );
        let itemSecretLevel = this.docServices.FindItemById(
          this.ListSecret,
          this.form.get('SecretLevel').value
        );
        let itemUrgentLevel = this.docServices.FindItemById(
          this.ListUrgent,
          this.form.get('UrgentLevel').value
        );
        let itemMethodSend = this.docServices.FindItemById(
          this.ListMethodSend,
          this.form.get('MethodSend').value
        );
        let itemUnitCreate = this.ListAllUser.find(
          item =>
            item.UserId == this.currentUserId &&
            (item.RoleCode === 'NV' || item.RoleCode === 'TP')
        );
        //  console.log('UserOfHandle:'+ this.form.get('UserOfHandle').value);
        // console.log('UserOfHandle:'+ dataForm.UserOfHandle);

        this.UserOfCombinate =
          dataForm.UserOfCombinate == null || dataForm.UserOfCombinate == 0
            ? 0
            : dataForm.UserOfCombinate.split('|')[0];
        this.UserOfKnow =
          dataForm.UserOfKnow == null || dataForm.UserOfKnow == 0
            ? 0
            : dataForm.UserOfKnow.split('|')[0];

        this.splitDataUserApprover(dataForm.UserOfHandle);
        let UserOfHandle =
          dataForm.UserOfHandle == null || dataForm.UserOfHandle == 0
            ? null
            : dataForm.UserOfHandle.split('|')[0];
        this.userApproverId = UserOfHandle;
        this.SelectUserCombiner = dataForm.UserOfCombinate;
        this.SelectUserKnower = dataForm.UserOfKnow;
        // let Signer =
        //   dataForm.Signer == null || dataForm.Signer == 0
        //     ? null
        //     : dataForm.Signer.split('|')[0];
        const data = {
          __metadata: { type: 'SP.Data.ListDocumentGoListItem' },
          Title: 'Văn bản đi',
          BookTypeName: itemBookType == undefined ? '' : itemBookType.Title,
          BookTypeCode: this.form.get('BookType').value,
          // NumberSymbol: this.form.get('NumberSymbol').value,
          DocTypeID: this.form.get('DocType').value,
          Compendium: this.form.get('Compendium').value,
          RecipientsInID: this.form.get('RecipientsIn').value,
          RecipientsOutID: this.form.get('RecipientsOut').value,
          UserOfHandleId: this.userApproverId,
          UserOfCombinateId: { results: [this.UserOfCombinate] }, //cho luu nhiều người
          UserOfKnowId: { results: [this.UserOfKnow] },
          UserCreateId: this.currentUserId,
          // SignerId: Signer,
          SecretLevelID: this.form.get('SecretLevel').value,
          UrgentLevelID: this.form.get('UrgentLevel').value,
          MethodSendID: this.form.get('MethodSend').value,
          DocTypeName: itemDocType == undefined ? '' : itemDocType.Title,
          RecipientsInName:
            itemRecipientsIn == undefined ? '' : itemRecipientsIn.Title,
          RecipientsOutName:
            itemRecipientsOut == undefined ? '' : itemRecipientsOut.Title,
          SecretLevelName:
            itemSecretLevel == undefined ? '' : itemSecretLevel.Title,
          UrgentLevelName:
            itemUrgentLevel == undefined ? '' : itemUrgentLevel.Title,
          MethodSendName:
            itemMethodSend == undefined ? '' : itemMethodSend.Title,
          UnitCreateName:
            itemUnitCreate == undefined ? '' : itemUnitCreate.Department,
          Note: this.form.get('Note').value,
          UnitCreateID: this.form.get('UnitCreate').value,
          NumOfPaper: this.form.get('NumOfPaper').value,
          DateCreated: this.date.value,
          Deadline: this.form.get('Deadline').value,
          // DateIssued: this.form.get('DateIssued').value,
          isRespinse: this.form.get('isRespinse').value == true ? 1 : 0,
          isSendMail: this.form.get('isSendMail').value == true ? 1 : 0,
          StatusID: ChuyenXL,
          StatusName: ChuyenXL === 0 ? 'Chờ xử lý' : 'Dự thảo',
          ListUserApprover: this.userApproverId + '_' + this.userApproverName
        };
        console.log('data=' + data);
        if (this.IdEdit == 0) {
          this.services.AddItemToList(this.listTitle, data).subscribe(
            item => {
              this.DocumentID = item['d'].Id;
            },
            error => {
              this.CloseDocumentGoPanel();
              console.log(
                'error when add item to list ' +
                  this.listTitle +
                  ': ' +
                  error.error.error.message.value
              ),
                this.notificationService.error('Thêm văn bản trình thất bại');
            },
            () => {
              console.log(
                'Add item of approval user to list ' +
                  this.listTitle +
                  ' successfully!'
              );
              if (ChuyenXL === 0) {
                //chuyển xử lý
                this.FinishDocumentTo();
                // this.AddHistoryStep();
              } else {
                if (this.outputFile.length > 0) {
                  this.saveItemAttachment(0, this.DocumentID);
                } else {
                  this.callbackfunc();
                }
              }
            }
          );
        } else {
          this.services
            .updateListById(this.listTitle, data, this.IdEdit)
            .subscribe(
              item => {
                this.DocumentID = this.IdEdit;
              },
              error => {
                this.CloseDocumentGoPanel();
                console.log(
                  'error when update item to list ' +
                    this.listTitle +
                    ': ' +
                    error
                ),
                  this.notificationService.error('Sửa văn bản đến thất bại');
              },
              () => {
                console.log(
                  'update item of approval user to list ' +
                    this.listTitle +
                    ' successfully!'
                );
                if (ChuyenXL === 0) {
                  this.FinishDocumentTo();
                } else {
                  if (this.outputFile.length > 0) {
                    this.saveItemAttachment(0, this.DocumentID);
                  } else {
                    this.callbackfunc();
                  }
                }
              }
            );
        }
      }
    } catch (error) {
      console.log('error add:' + error);
    }
  }

  FinishDocumentTo() {
    try {
      if (this.docServices.checkNull(this.DocumentToId).indexOf('|') > 0) {
        let idDocTo = 0;
        idDocTo = this.docServices.CheckNullSetZero(
          this.DocumentToId.split('|')[0]
        );
        let idHisTo = this.docServices.CheckNullSetZero(
          this.DocumentToId.split('|')[1]
        );
        let arrIdProcessTo = this.docServices.checkNull(
          this.DocumentToId.split('|')[2]
        );
        const data = {
          __metadata: { type: 'SP.Data.ListDocumentToListItem' },
          StatusID: 1,
          StatusName: 'Đã xử lý'
        };
        this.services.updateListById('ListDocumentTo', data, idDocTo).subscribe(
          item => {},
          error => {
            this.CloseDocumentGoPanel();
            console.log(
              'error when update item to list ListDocumentTo: ' +
                error.error.error.message.value
            );
          },
          () => {
            this.sendMailFinishDocumentTo(idDocTo);
            let arrItem = arrIdProcessTo.split(',');
            this.UpdateDocToFinish(arrItem, 0);
            if (idHisTo > 0) {
              const dataTicket = {
                __metadata: { type: 'SP.Data.ListHistoryRequestToListItem' },
                StatusID: 1,
                StatusName: 'Đã xử lý'
              };
              this.services
                .updateListById('ListHistoryRequestTo', dataTicket, idHisTo)
                .subscribe(
                  item => {},
                  error => {
                    this.CloseDocumentGoPanel();
                    console.log(
                      'error when update item to list ListHistoryRequestTo: ' +
                        error.error.error.message.value
                    );
                  },
                  () => {
                    console.log('Update list HistoryRequestTo success');
                  }
                );
            }
          }
        );
      } else {
        this.AddHistoryStep();
      }
    } catch (err) {
      console.log('FinishDocumentTo failed: ' + err);
      this.CloseDocumentGoPanel();
    }
  }

  UpdateDocToFinish(listItem, index) {
    if (listItem !== undefined && listItem.length > 0) {
      const dataTicket = {
        __metadata: { type: 'SP.Data.ListProcessRequestToListItem' },
        StatusID: 1,
        StatusName: 'Đã xử lý',
        IsFinished: 1
      };
      this.services
        .updateListById('ListProcessRequestTo', dataTicket, listItem[index])
        .subscribe(
          item => {},
          error => {
            this.CloseDocumentGoPanel();
            console.log(
              'error when update item to list ListProcessRequestTo: ' +
                error.error.error.message.value
            ),
              this.notificationService.error(
                'Cập nhật thông tin phiếu xử lý thất bại'
              );
          },
          () => {
            console.log(
              'update item ' +
                listItem[index] +
                ' of approval user to list ListProcessRequestTo successfully!'
            );
            index++;
            if (index < listItem.length) {
              this.UpdateDocToFinish(listItem, index);
            } else {
              this.AddHistoryStep();
            }
          }
        );
    }
  }

  sendMailFinishDocumentTo(docID) {
    this.docToServices.getListDocByID(docID).subscribe(
      items => {
        console.log('items: ' + items);
        this.ItemAttachments = [];
        let itemList = items['value'] as Array<any>;
        if (itemList.length > 0) {
          //gui mail tra lai
          let email;
          let userApprover;
          let author;
          email = itemList[0].Author.Name.split('|')[2];
          author = itemList[0].Author.Title;
          const dataSendUser = {
            __metadata: { type: 'SP.Data.ListRequestSendMailListItem' },
            Title: 'ListDocumentTo',
            IndexItem: docID,
            Step: 0,
            KeyList: 'ListDocumentTo' + '_' + docID,
            SubjectMail: this.ReplateDocumentTo(
              this.EmailConfigDT.FieldMail,
              this.EmailConfigDT.FinishEmailSubject,
              itemList[0].NumberTo,
              itemList[0].Compendium,
              author,
              this.currentUserName,
              docID
            ),
            BodyMail: this.ReplateDocumentTo(
              this.EmailConfigDT.FieldMail,
              this.EmailConfigDT.FinishEmailBody,
              itemList[0].NumberTo,
              itemList[0].Compendium,
              author,
              this.currentUserName,
              docID
            ),
            SendMailTo: email
          };
          this.services
            .AddItemToList('ListRequestSendMail', dataSendUser)
            .subscribe(
              itemRoomRQ => {
                console.log(itemRoomRQ['d']);
              },
              error => {
                console.log(error);
                this.CloseDocumentGoPanel();
              },
              () => {
                console.log('Send mail return success.');
              }
            );
        }
      },
      error => {
        console.log(error);
        this.CloseDocumentGoPanel();
      },
      () => {
        console.log('Load item document to success.');
      }
    );
  }

  ReplateDocumentTo(
    FieldMail,
    ContentMail,
    numberTo,
    compendium,
    author,
    UserApprover,
    docID
  ) {
    try {
      if (this.isNotNull(FieldMail) && this.isNotNull(ContentMail)) {
        let strContent = FieldMail.split(',');
        console.log('ContentMail before: ' + ContentMail);
        for (let i = 0; i < strContent.length; i++) {
          switch (strContent[i]) {
            case 'NumberTo':
              ContentMail = ContentMail.replace(
                '{' + strContent[i] + '}',
                numberTo
              );
              break;
            case 'Compendium':
              ContentMail = ContentMail.replace(
                '{' + strContent[i] + '}',
                compendium
              );
              break;
            case 'Content':
              ContentMail = ContentMail.replace(
                '{' + strContent[i] + '}',
                'Hoàn thành'
              );
              break;
            case 'Author':
              ContentMail = ContentMail.replace(
                '{' + strContent[i] + '}',
                author
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
                  '#/Documents/IncomingDoc/docTo-detail/' +
                  docID
              );
              break;
            case 'HomeUrl':
              ContentMail = ContentMail.replace(
                '{' + strContent[i] + '}',
                window.location.href.split('#/')[0] + '#/Documents/IncomingDoc'
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

  //lưu lịch sử duyệt
  AddHistoryStep() {
    const dataForm = this.form.getRawValue();
    const data = {
      __metadata: { type: 'SP.Data.ListHistoryRequestGoListItem' },
      // Title: dataForm.NumberSymbol,
      DateCreated: new Date(),
      DocumentGoID: this.DocumentID,
      UserRequestId: this.currentUserId,
      UserApproverId: this.userApproverId,
      Deadline: dataForm.Deadline,
      StatusID: 0,
      StatusName: 'Chờ xử lý',
      Content: dataForm.Note,
      IndexStep: 1,
      Compendium: dataForm.Compendium,
      StatusApproval: '1_0'
    };
    this.services.AddItemToList('ListHistoryRequestGo', data).subscribe(
      item => {},
      error => {
        this.CloseDocumentGoPanel();
        console.log(
          'error when add item to list ListHistoryRequestTo: ' +
            error.error.error.message.value
        ),
          this.notificationService.error('Thêm phiếu xử lý thất bại');
      },
      () => {
        console.log(
          'Add item of approval user to list ListHistoryRequestGo successfully!'
        );
        this.AddListTicket();
      }
    );
  }

  AddListTicket() {
    const dataForm = this.form.getRawValue();
    let DocTypeName = this.docServices.FindItemById(
      this.ListDocType,
      dataForm.DocType
    );
    //phiếu xử lý cho người tạo
    const data = {
      __metadata: { type: 'SP.Data.ListProcessRequestGoListItem' },
      // Title:dataForm.NumberSymbol,
      DocTypeName: DocTypeName == undefined ? '' : DocTypeName.Title,
      DateCreated: new Date(),
      DocumentGoID: this.DocumentID,
      UserRequestId: this.currentUserId,
      UserApproverId: this.currentUserId,
      Deadline: dataForm.Deadline,
      StatusID: 1,
      StatusName: 'Đã xử lý',
      TaskTypeCode: 'XLC',
      TaskTypeName: 'Xử lý chính',
      TypeCode: 'CXL',
      TypeName: 'Chuyển xử lý',
      Content: dataForm.Note,
      IndexStep: 1,
      Compendium: dataForm.Compendium
    };
    //phiếu cho người xử lý tiếp theo
    const data1 = {
      __metadata: { type: 'SP.Data.ListProcessRequestGoListItem' },
      // Title:dataForm.NumberSymbol,
      DocTypeName: DocTypeName == undefined ? '' : DocTypeName.Title,
      DateCreated: new Date(),
      DocumentGoID: this.DocumentID,
      UserRequestId: this.currentUserId,
      UserApproverId: this.userApproverId,
      Deadline: dataForm.Deadline,
      StatusID: 0,
      StatusName: 'Chờ xử lý',
      TaskTypeCode: 'XLC',
      TaskTypeName: 'Xử lý chính',
      TypeCode: 'CXL',
      TypeName: 'Chuyển xử lý',
      Content: dataForm.Note,
      IndexStep: 2,
      Compendium: dataForm.Compendium
    };
    this.services.AddItemToList('ListProcessRequestGo', data).subscribe(
      item => {},
      error => {
        this.CloseDocumentGoPanel();
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
        this.services.AddItemToList('ListProcessRequestGo', data1).subscribe(
          item => {},
          error => {
            this.CloseDocumentGoPanel();
            console.log(
              'error when add item to list ListProcessRequestGo: ' +
                error.error.error.message.value
            ),
              this.notificationService.error('Thêm phiếu xử lý thất bại');
          },
          () => {
            // this.CloseDocumentGoPanel();
            //  this.callbackfunc();
            if (this.UserOfCombinate > 0) {
              this.AddUserCombine();
            } else if (this.UserOfKnow > 0) {
              this.AddUserKnow();
            } else {
              this.saveItemAttachment(0, this.DocumentID);
            }
            console.log(
              'Add item of approval user to list ListProcessRequestGo successfully!'
            );
          }
        );
      }
    );
  }

  AddUserCombine() {
    const dataForm = this.form.getRawValue();
    let DocTypeName = this.docServices.FindItemById(
      this.ListDocType,
      dataForm.DocType
    );
    const data = {
      __metadata: { type: 'SP.Data.ListProcessRequestGoListItem' },
      // Title:dataForm.NumberSymbol,
      DocTypeName: DocTypeName == undefined ? '' : DocTypeName.Title,
      DateCreated: new Date(),
      DocumentGoID: this.DocumentID,
      UserRequestId: this.currentUserId,
      UserApproverId: this.UserOfCombinate,
      Deadline: dataForm.Deadline,
      StatusID: 0,
      StatusName: 'Chờ xử lý',
      TaskTypeCode: 'PH',
      TaskTypeName: 'Phối hợp',
      TypeCode: 'CXL',
      TypeName: 'Chuyển xử lý',
      Content: dataForm.Note,
      IndexStep: 2,
      Compendium: dataForm.Compendium
    };
    this.services.AddItemToList('ListProcessRequestGo', data).subscribe(
      item => {},
      error => {
        this.CloseDocumentGoPanel();
        console.log(
          'error when add item to list ListProcessRequestTo: ' +
            error.error.error.message.value
        ),
          this.notificationService.error('Thêm phiếu xử lý thất bại');
      },
      () => {
        if (this.UserOfKnow > 0) {
          this.AddUserKnow();
        } else {
          this.saveItemAttachment(0, this.DocumentID);
        }
      }
    );
  }

  AddUserKnow() {
    const dataForm = this.form.getRawValue();
    let DocTypeName = this.docServices.FindItemById(
      this.ListDocType,
      dataForm.DocType
    );
    const data = {
      __metadata: { type: 'SP.Data.ListProcessRequestGoListItem' },
      // Title:dataForm.NumberSymbol,
      DocTypeName: DocTypeName == undefined ? '' : DocTypeName.Title,
      DateCreated: new Date(),
      DocumentGoID: this.DocumentID,
      UserRequestId: this.currentUserId,
      UserApproverId: this.UserOfKnow,
      Deadline: dataForm.Deadline,
      StatusID: 0,
      StatusName: 'Chờ xử lý',
      TaskTypeCode: 'NĐB',
      TaskTypeName: 'Nhận để biết',
      TypeCode: 'CXL',
      TypeName: 'Chuyển xử lý',
      Content: dataForm.Note,
      IndexStep: 2,
      Compendium: dataForm.Compendium
    };
    this.services.AddItemToList('ListProcessRequestGo', data).subscribe(
      item => {},
      error => {
        this.CloseDocumentGoPanel();
        console.log(
          'error when add item to list ListProcessRequestTo: ' +
            error.error.error.message.value
        ),
          this.notificationService.error('Thêm phiếu xử lý thất bại');
      },
      () => {
        this.saveItemAttachment(0, this.DocumentID);
      }
    );
  }

  ShowConfirm(template, IdDelete) {
    this.bsModalRef = this.modalService.show(template, { class: 'modal-sm' });
    this.IdDelete = IdDelete;
  }

  DeleteItem() {
    if (this.IdDelete > 0) {
      this.OpenDocumentGoPanel();
      const data = {
        __metadata: { type: 'SP.Data.ListDocumentGoListItem' }
      };
      this.services
        .DeleteItemById(this.listTitle, data, this.IdDelete)
        .subscribe(
          item => {},
          error => {
            this.CloseDocumentGoPanel();
            console.log('error when delete item to list DocumentTo: ' + error),
              this.notificationService.error('Xóa văn bản thất bại');
          },
          () => {
            this.bsModalRef.hide();
            console.log('Delete item in list DocumentTo successfully!');
            this.notificationService.success('Xóa văn bản thành công');
            let index = this.ListDocumentGo.findIndex(
              i => i.ID === this.IdDelete
            );
            if (index >= 0) {
              this.ListDocumentGo.splice(index, 1);
            }
            this.dataSource = new MatTableDataSource<ItemDocumentGo>(
              this.ListDocumentGo
            );
            this.dataSource.paginator = this.paginator;
            if (!(this.ref as ViewRef).destroyed) {
              this.ref.detectChanges();
            }
            this.CloseDocumentGoPanel();
            this.IdDelete = 0;
          }
        );
    }
  }

  EditItem(id) {
    this.OpenDocumentGoPanel();
    this.IdEdit = id;
    this.addNew = !this.addNew;
    this.showList = !this.showList;
    this.docServices.getListDocByID(id).subscribe(items => {
      console.log('items: ' + items);
      let itemList = items['value'] as Array<any>;
      this.ItemAttachments = [];
      this.outputFile = [];
      if (itemList[0].AttachmentFiles.length > 0) {
        itemList[0].AttachmentFiles.forEach(element => {
          this.ItemAttachments.push({
            name: element.FileName,
            urlFile: this.urlAttachment + element.ServerRelativeUrl
          });
        });
        // this.outputFile=this.ItemAttachments;
      }
      //người phối hợp
      let arrUserOfCombinate = [];
      if (itemList[0].UserOfCombinate != null && itemList[0].UserOfCombinate.length > 0) {
        itemList[0].UserOfCombinate.forEach(element => {
          let str =
            element.Id + '|' + element.Name.split('|')[2] + '|' + element.Title;
          arrUserOfCombinate.push(str);
        });
      }
      //người nhận để biết
      let arrUserOfKnow = [];
      if (itemList[0].UserOfKnow !=null && itemList[0].UserOfKnow.length > 0) {
        itemList[0].UserOfKnow.forEach(element => {
          let str =
            element.Id + '|' + element.Name.split('|')[2] + '|' + element.Title;
          arrUserOfKnow.push(str);
        });
      }
      this.itemDoc = {
        ID: itemList[0].ID,
        NumberGo: '', // (itemList[0].NumberGo === 0 || itemList[0].NumberGo == null)? '' : itemList[0].NumberGo,
        DocTypeName: this.docServices.checkNull(itemList[0].DocTypeID),
        NumberSymbol: this.docServices.checkNull(itemList[0].NumberSymbol),
        Compendium: this.docServices.checkNull(itemList[0].Compendium),
        AuthorId:
          itemList[0].UserCreate == undefined ? '' : itemList[0].UserCreate.Id,
        UserCreateName:
          itemList[0].Author == undefined ? '' : itemList[0].Author.Title,
        DateCreated: this.docServices.formatDateTime(itemList[0].DateCreated),
        UserOfHandleName:
          itemList[0].UserOfHandle == undefined
            ? ''
            : itemList[0].UserOfHandle.Id +
              '|' +
              itemList[0].UserOfHandle.Name.split('|')[2] +
              '|' +
              itemList[0].UserOfHandle.Title,
        UserOfKnowName: arrUserOfKnow.length > 0 ? arrUserOfKnow[0] : '', // itemList[0].UserOfKnow == undefined ? '' : itemList[0].UserOfKnow.Id + '|' + itemList[0].UserOfKnow.Name.split('|')[2] + '|' + itemList[0].UserOfKnow.Title,
        UserOfCombinateName:
          arrUserOfCombinate.length > 0 ? arrUserOfCombinate[0] : '', //itemList[0].UserOfCombinate == undefined ? '' : itemList[0].UserOfCombinate.Id + '|' + itemList[0].UserOfCombinate.Name.split('|')[2] + '|' + itemList[0].UserOfCombinate.Title,
        Deadline: itemList[0].Deadline,
        link: '',
        StatusName: this.docServices.checkNull(itemList[0].StatusName),
        BookTypeName: itemList[0].BookTypeName,
        UnitCreateName: itemList[0].UnitCreateName,
        RecipientsInName: this.docServices.checkNull(
          itemList[0].RecipientsInID
        ),
        RecipientsOutName: this.docServices.checkNull(
          itemList[0].RecipientsOutID
        ),
        SecretLevelName: this.docServices.checkNull(itemList[0].SecretLevelID),
        UrgentLevelName: this.docServices.checkNull(itemList[0].UrgentLevelID),
        SecretLevelId: this.docServices.CheckNullSetZero(itemList[0].SecretLevelID),
        UrgentLevelId: this.docServices.CheckNullSetZero(itemList[0].UrgentLevelID),
        MethodSendName: this.docServices.checkNull(itemList[0].MethodSendID),
        DateIssued: itemList[0].DateIssued,
        SignerName: '',
        //   itemList[0].Signer == undefined
        //     ? ''
        //     : itemList[0].Signer.Id +
        //       '|' +
        //       itemList[0].Signer.Name.split('|')[2],
        NumOfPaper: itemList[0].NumOfPaper,
        Note: itemList[0].Note
      };
      this.form.patchValue({
        // NumberSymbol: this.itemDoc.NumberSymbol,
        DocType:
          this.itemDoc.DocTypeName == ''
            ? null
            : Number(this.itemDoc.DocTypeName) + '',
        Compendium: this.itemDoc.Compendium,
        RecipientsIn:
          this.itemDoc.RecipientsInName == ''
            ? null
            : Number(this.itemDoc.RecipientsInName) + '',
        RecipientsOut:
          this.itemDoc.RecipientsOutName == ''
            ? null
            : Number(this.itemDoc.RecipientsOutName) + '',
        UserOfHandle: this.itemDoc.UserOfHandleName,
        UserOfCombinate: this.itemDoc.UserOfCombinateName,
        UserOfKnow: this.itemDoc.UserOfKnowName,
        SecretLevel:
          this.itemDoc.SecretLevelName == ''
            ? null
            : Number(this.itemDoc.SecretLevelName) + '',
        UrgentLevel:
          this.itemDoc.UrgentLevelName == ''
            ? null
            : Number(this.itemDoc.UrgentLevelName) + '',
        MethodSend:
          this.itemDoc.MethodSendName == ''
            ? null
            : Number(this.itemDoc.MethodSendName) + '',
        //  Signer: this.itemDoc.SignerName,
        Note: this.itemDoc.Note,
        NumOfPaper: this.itemDoc.NumOfPaper,
        Deadline: this.itemDoc.Deadline
        // DateIssued: this.itemDoc.DateIssued,
      });
      if (!(this.ref as ViewRef).destroyed) {
        this.ref.detectChanges();
      }
      this.CloseDocumentGoPanel();
    });
  }

  reset() {
    this.form.reset();
    this.form.clearValidators();
    this.form.clearAsyncValidators();
    this.form.controls['BookType'].setValue('DG');
    this.ItemAttachments = [];
  }

  addAttachmentFile() {
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
      if (indexNew >= 0) {
        console.log(indexNew);
        this.outputFile.splice(indexNew, 1);
      } else {
        const data = {
          __metadata: { type: 'SP.Data.ListDocumentGoListItem' }
        };
        this.services
          .DeleteAttachmentById('ListDocumentGo', data, this.IdEdit, index.name)
          .subscribe(
            item => {},
            error => {
              console.log(
                'error when delete attachment item to list DocumentTo: ' + error
              );
            },
            () => {}
          );
      }
      let indexOld = this.ItemAttachments.findIndex(i => i.name === index.name);
      if (indexOld >= 0) {
        this.ItemAttachments.splice(indexOld, 1);
      }
    } catch (error) {
      console.log('removeAttachmentFile error: ' + error);
      this.CloseDocumentGoPanel();
    }
  }

  isNotNull(str) {
    return str !== null && str !== '' && str !== undefined;
  }

  saveItemAttachment(index, idItem) {
    try {
      if (this.outputFile.length > 0) {
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
                this.CloseDocumentGoPanel();
              },
              () => {
                console.log('inserAttachmentFile successfully');
                if (Number(index) < this.outputFile.length - 1) {
                  this.saveItemAttachment(Number(index) + 1, idItem);
                } else {
                  //lưu và gửi đi mới có mail
                  if (this.ChuyenXL == 0) {
                    this.addItemSendMail();
                  } else {
                    this.callbackfunc();
                  }
                }
              }
            );
        };
      } else {
        //lưu và gửi đi mới có mail
        if (this.ChuyenXL == 0) {
          this.addItemSendMail();
        }
      }
    } catch (error) {
      console.log('saveItemAttachment error: ' + error);
    }
  }

  addItemSendMail() {
    try {
      // send mail user created
      const dataSendUser = {
        __metadata: { type: 'SP.Data.ListRequestSendMailListItem' },
        Title: this.listTitle,
        IndexItem: this.DocumentID,
        Step: 1,
        KeyList: this.listTitle + '_' + this.DocumentID,
        SubjectMail: this.Replace_Field_Mail(
          this.EmailConfig.FieldMail,
          this.EmailConfig.NewEmailSubject,
          this.userApproverName
        ),
        BodyMail: this.Replace_Field_Mail(
          this.EmailConfig.FieldMail,
          this.EmailConfig.NewEmailBody,
          this.userApproverName
        ),
        SendMailTo: this.currentUserEmail
      };
      this.services
        .AddItemToList('ListRequestSendMail', dataSendUser)
        .subscribe(
          itemRoomRQ => {
            console.log(itemRoomRQ['d']);
          },
          error => {
            console.log(error);
            this.CloseDocumentGoPanel();
          },
          () => {
            console.log('Save item success');
            const dataSendApprover = {
              __metadata: { type: 'SP.Data.ListRequestSendMailListItem' },
              Title: this.listTitle,
              IndexItem: this.DocumentID,
              Step: 1,
              KeyList: this.listTitle + '_' + this.DocumentID,
              SubjectMail: this.Replace_Field_Mail(
                this.EmailConfig.FieldMail,
                this.EmailConfig.AssignEmailSubject,
                this.userApproverName
              ),
              BodyMail: this.Replace_Field_Mail(
                this.EmailConfig.FieldMail,
                this.EmailConfig.AssignEmailBody,
                this.userApproverName
              ),
              SendMailTo: this.userApproverEmail
            };
            this.services
              .AddItemToList('ListRequestSendMail', dataSendApprover)
              .subscribe(
                itemCarRQ => {
                  console.log(itemCarRQ['d']);
                },
                error => {
                  console.log(error);
                  this.CloseDocumentGoPanel();
                },
                () => {
                  console.log('Add email success');
                  console.log('Add email success');
                  if (
                    this.docServices.checkNull(this.SelectUserCombiner) !== ''
                  ) {
                    this.SendMailCombiner(0);
                  } else if (
                    this.docServices.checkNull(this.SelectUserKnower) !== ''
                  ) {
                    this.SendMailKnower(0);
                  } else {
                    this.callbackfunc();
                  }
                }
              );
          }
        );
    } catch (error) {
      console.log('addItemSendMail error: ' + error.message);
    }
  }

  SendMailCombiner(index) {
    const dataSendUser = {
      __metadata: { type: 'SP.Data.ListRequestSendMailListItem' },
      Title: this.listTitle,
      IndexItem: this.DocumentID,
      Step: 1,
      KeyList: this.listTitle + '_' + this.DocumentID,
      SubjectMail: this.Replace_Field_Mail(
        this.EmailConfig.FieldMail,
        this.EmailConfig.AssignEmailSubject,
        this.SelectUserCombiner.split('|')[2]
      ),
      BodyMail: this.Replace_Field_Mail(
        this.EmailConfig.FieldMail,
        this.EmailConfig.AssignEmailBody,
        this.SelectUserCombiner.split('|')[2]
      ),
      SendMailTo: this.SelectUserCombiner.split('|')[1]
    };

    this.services.AddItemToList('ListRequestSendMail', dataSendUser).subscribe(
      itemRoomRQ => {
        console.log(itemRoomRQ['d']);
      },
      error => {
        console.log(error);
        this.CloseDocumentGoPanel();
      },
      () => {
        if (this.docServices.checkNull(this.SelectUserKnower) !== '') {
          this.SendMailKnower(0);
        } else {
          this.callbackfunc();
        }
      }
    );
  }

  SendMailKnower(index) {
    const dataSendUser = {
      __metadata: { type: 'SP.Data.ListRequestSendMailListItem' },
      Title: this.listTitle,
      IndexItem: this.DocumentID,
      Step: 1,
      KeyList: this.listTitle + '_' + this.DocumentID,
      SubjectMail: this.Replace_Field_Mail(
        this.EmailConfig.FieldMail,
        this.EmailConfig.AssignEmailSubject,
        this.SelectUserKnower.split('|')[2]
      ),
      BodyMail: this.Replace_Field_Mail(
        this.EmailConfig.FieldMail,
        this.EmailConfig.AssignEmailBody,
        this.SelectUserKnower.split('|')[2]
      ),
      SendMailTo: this.SelectUserKnower.split('|')[1]
    };

    this.services.AddItemToList('ListRequestSendMail', dataSendUser).subscribe(
      itemRoomRQ => {
        console.log(itemRoomRQ['d']);
      },
      error => {
        console.log(error);
        this.CloseDocumentGoPanel();
      },
      () => {
        this.callbackfunc();
      }
    );
  }

  Replace_Field_Mail(FieldMail, ContentMail, UserApprover) {
    try {
      if (this.isNotNull(FieldMail) && this.isNotNull(ContentMail)) {
        let strContent = FieldMail.split(',');
        console.log('ContentMail before: ' + ContentMail);
        for (let i = 0; i < strContent.length; i++) {
          switch (strContent[i]) {
            case 'DocumentType':
              let itemDocType = this.docServices.FindItemById(
                this.ListDocType,
                this.form.get('DocType').value
              );
              ContentMail = ContentMail.replace(
                '{' + strContent[i] + '}',
                itemDocType == undefined ? '' : itemDocType.Title
              );
              break;
            case 'Compendium':
              ContentMail = ContentMail.replace(
                '{' + strContent[i] + '}',
                this.docServices.checkNull(
                  this.form.controls['Compendium'].value
                )
              );
              break;
            case 'Content':
              ContentMail = ContentMail.replace(
                '{' + strContent[i] + '}',
                this.docServices.checkNull(this.form.controls['Note'].value)
              );
              break;
            case 'UserRequest':
              ContentMail = ContentMail.replace(
                '{' + strContent[i] + '}',
                this.currentUserName
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
                  this.DocumentID
              );
              break;
            case 'TaskUrl':
              ContentMail = ContentMail.replace(
                '{' + strContent[i] + '}',
                window.location.href.split('#/')[0] +
                  '#/Documents/documentgo-detail/' +
                  this.DocumentID +
                  '/2'
              );
              break;
            case 'HomeUrl':
              ContentMail = ContentMail.replace(
                '{' + strContent[i] + '}',
                window.location.href.split('#/')[0] + '#/Documents'
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

  getFileBuffer(file) {
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    return reader;
  }

  callbackfunc() {
    this.CloseDocumentGoPanel();
    this.notificationService.success('Thêm văn bản trình thành công');
    this.routes.navigate(['/Documents/documentgo-detail/' + this.DocumentID]);
    // this.getListDocumentGo();
    // this.addNew = !this.addNew;
    // this.showList = !this.showList;
  }
}
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
  selector: 'document-go-panel',
  template:
    '<p class="demo-rotini" style="padding: 10px; background-color: #F6753C !important;color:white;">Waiting....</p>'
})
export class DocumentGoPanel {}
