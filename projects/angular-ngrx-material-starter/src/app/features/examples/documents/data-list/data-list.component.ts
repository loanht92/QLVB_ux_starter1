import { Component, OnInit, ChangeDetectionStrategy, ViewChild, ChangeDetectorRef, ViewContainerRef, ElementRef, ViewRef} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatTableDataSource} from '@angular/material';
import {SelectionModel} from '@angular/cdk/collections';
import {BehaviorSubject, fromEvent} from 'rxjs';
import * as moment from 'moment';
import {DocumentGoPanel} from '../document-go/document-go.component';
import {ResApiService} from '../../services/res-api.service';
import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {DataListService} from './data-list.service';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { PeoplePickerUser, PeoplePickerQuery } from '../../services/people-picker';
import { debounceTime, map, distinctUntilChanged, filter, startWith } from 'rxjs/operators';

import {
  ROUTE_ANIMATIONS_ELEMENTS,
  NotificationService
} from '../../../../core/core.module';
import { isatty } from 'tty';
import { ColdObservable } from 'rxjs/internal/testing/ColdObservable';

export class ItemList {
  STT: Number;
  Name: string;
  Code: string;
}

export class ItemListEmp {
  STT: Number;
  Name: string;
  Department: string;
  Role: string;
}

export class ItemUser {
  Key: string;
  DisplayText: string
}

@Component({
  selector: 'anms-data-list',
  templateUrl: './data-list.component.html',
  styleUrls: ['./data-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataListComponent implements OnInit {
  bsModalRef: BsModalRef;
  displayedColumns: string[] = ['stt', 'name' ,'code']; //'select', 'userApprover'
  dataSource = new MatTableDataSource<ItemList>();
  dataSource2 = new MatTableDataSource<ItemListEmp>();
  displayedColumns2: string[] = ['stt', 'name' ,'department', 'role']; //'select', 'userApprover'
  selection = new SelectionModel<ItemList>(true, []);
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
  searchText = '';
  selectedType;
  ListAllItem: ItemList[] = [];
  ListAllEmployee: ItemListEmp[] = [];
  ListDepartment = []; ListRole = [];
  ArrFields = [];
  overlayRef; isDisplay = true;
  isAdd; isEmployee;
  Title; Code;
  EmployeeName; EmployeeId; EmployeeEmail;
  @ViewChild('movieSearchInput', { static: false }) movieSearchInput: ElementRef;
  EmpName; objUserRequest: PeoplePickerUser;
  Role; Department;
  public multipleUsers: PeoplePickerUser[];
  peoplePickerQuery: PeoplePickerQuery = {
    queryParams: {
      QueryString: '',
      MaximumEntitySuggestions: 10,
      AllowEmailAddresses: true,
      AllowOnlyEmailAddresses: false,
      PrincipalSource: 15,
      PrincipalType: 1,
      SharePointGroupID: 0
    }
  };

  listType = [
    {
      type: 'ListDepartment', name: 'Danh sách phòng ban'
    },
    {
      type: 'ListRole', name: 'Chức vụ'
    },
    {
      type: 'ListSecret', name: 'Độ mật'
    },
    {
      type: 'ListUrgent', name: 'Độ khẩn'
    },
    {
      type: 'ListSourceAddress', name: 'Nơi gửi'
    },
    {
      type: 'ListDestinationAddress', name: 'Nơi nhận'
    },
    {
      type: 'ListMethodSend', name: 'Phương thức gửi'
    },
    {
      type: 'ListDocType', name: 'Loại văn bản'
    },
    {
      type: 'ListMapEmployee', name: 'Danh sách nhân viên'
    },
  ]

  constructor(private listServer: DataListService,
              private modalService: BsModalService,
              private services: ResApiService, private ref: ChangeDetectorRef,
              private readonly notificationService: NotificationService,
              public overlay: Overlay, public viewContainerRef: ViewContainerRef) { }

  ngOnInit() {
    this.loadDepartment();
    this.loadRole();
  }

  loadDepartment() {
    this.OpenRotiniPanel();
    this.services.getList('ListDepartment').subscribe((itemValue: any[]) => {
      let item = itemValue['value'] as Array<any>;
      this.ListDepartment = [];
      item.forEach(element => {
        this.ListDepartment.push({
          Name: element.Title,
          Code: element.Code
        });
      });
    },
    error => {
      console.log("Load department error " + error);
      this.CloseRotiniPanel();
    },
    () => {
      this.CloseRotiniPanel();
    }
    );
  }

  loadRole() {
    this.services.getList('ListRole').subscribe((itemValue: any[]) => {
      let item = itemValue['value'] as Array<any>;
      this.ListRole = [];
      item.forEach(element => {
        this.ListRole.push({
          Name: element.Title,
          Code: element.Code
        });
      });
    },
    error => {
      console.log("Load role error " + error);
      this.CloseRotiniPanel();
    },);
  }

  getAllItem() {
    this.searchText = '';
    if(this.selectedType === "ListMapEmployee") {
      this.OpenRotiniPanel();
      this.isAdd = undefined;
      this.isDisplay = undefined;
      this.isEmployee = true;
      let strSelect = `?$select=*,User/Id,User/Title,User/Name&$expand=User&$orderby=ID desc`;
      this.listServer.getAllItemList(this.selectedType, strSelect).subscribe((itemValue: any[]) => {
        let item = itemValue["value"] as Array<any>;    
        this.ListAllEmployee = [];
        let i = 1;
        item.forEach(element => {
          this.ListAllEmployee.push({
            STT: i,
            Name: element.User.Title,
            Department: element.DepartmentName,
            Role: element.RoleName,
          })
          i++;
        }) 
      },
      error => {
        console.log("Load item in list " + this.selectedType + " " + error);
        this.CloseRotiniPanel();
      },
      () => {
        this.dataSource2 = new MatTableDataSource<ItemListEmp>(this.ListAllEmployee);
        this.dataSource2.paginator = this.paginator;
        if (!(this.ref as ViewRef).destroyed) {
          this.ref.detectChanges();  
        } 
        this.CloseRotiniPanel();
      }
      )
    } else if(this.listServer.CheckNull(this.selectedType) !== ''){
      // let strSelect = `?$select=*&$orderby=ID desc`;
      this.OpenRotiniPanel();
      this.isDisplay = true;
      let strSelect = ``;
      this.listServer.getAllItemList(this.selectedType, strSelect).subscribe((itemValue: any[]) => {
        let item = itemValue["value"] as Array<any>;    
        this.ListAllItem = [];
        let i = 1;
        item.forEach(element => {
          this.ListAllItem.push({
            STT: i,
            Name: element.Title,
            Code: element.Code !== undefined ? element.Code : ''
          })
          i++;
        }) 
      },
      error => {
        console.log("Load item in list " + this.selectedType + " " + error);
        this.CloseRotiniPanel();
      },
      () => {
        this.dataSource = new MatTableDataSource<ItemList>(this.ListAllItem);
        this.dataSource.paginator = this.paginator;
        this.isAdd = true;
        if (!(this.ref as ViewRef).destroyed) {
          this.ref.detectChanges();  
        } 
        this.CloseRotiniPanel();
        // this.services.getFieldInList(this.selectedType).subscribe((itemValue: any[]) => {
        //   let item = itemValue["value"] as Array<any>;    
        // },
        // error => {
        //   console.log("Load fields in list " + this.selectedType + " " + error);
        // })
      }
      )
    }
  }

  SearchPeoplePicker(value) {
    this.OpenRotiniPanel();
    this.peoplePickerQuery = Object.assign({
      queryParams: {
        QueryString: value,
        MaximumEntitySuggestions: 10,
        AllowEmailAddresses: true,
        AllowOnlyEmailAddresses: false,
        PrincipalSource: 15,
        PrincipalType: 1,
        SharePointGroupID: 0
      }
    });

    this.services
      .getUserSuggestions(this.peoplePickerQuery)
      .subscribe((result: any) => {
        this.multipleUsers = [];
        const allUsers: PeoplePickerUser[] = JSON.parse(
          result.d.ClientPeoplePickerSearchUser
        );
        allUsers.forEach(user => {
          this.multipleUsers = [...this.multipleUsers, user];
        });
      },
        error => {
          console.log(error);
          this.CloseRotiniPanel();
        },
        () => {
          console.log("load user success");
          if (!(this.ref as ViewRef).destroyed) {
            this.ref.detectChanges();  
          } 
          this.CloseRotiniPanel();
        });
  }

  selectPeoplePicker(value) {
    this.multipleUsers = [];
    this.objUserRequest = value.value;
    this.loadUserId();
    this.EmpName = value.value.DisplayText;
  }

  onDisplayValue(user?: ItemUser): string | undefined {
    return user ? user.DisplayText : undefined; 
  }

  loadUserId() {
    try {
      this.services.getUserFormSite(this.objUserRequest.Key.replace('#','%23')).subscribe(
        itemUser => {
          console.log(itemUser);
          this.EmployeeId = itemUser["Id"];
          this.EmployeeName = itemUser["Title"];
          this.EmployeeEmail = itemUser["Email"];
        },
        error => {
          console.log(error);
          this.CloseRotiniPanel();
        },
        () => {
          console.log("Load user id success");
        }
      )
    } catch (error) {
      console.log('loadUserId error: ' + error.message);
    }
  }

  AddNewClick(template) {
    this.bsModalRef = this.modalService.show(template, {class: 'modal-lg'});
  }

  HideModal() {
    this.bsModalRef.hide();
    this.Title = '';
    this.Code = '';
  }

  validation() {
    if (this.listServer.CheckNull(this.Title) === '') {
      this.notificationService.warn("Bạn chưa nhập Tên! Vui lòng kiểm tra lại");
      return false;
    }
    else if(this.listServer.CheckNull(this.Code) === '') {
      this.notificationService.warn("Bạn chưa nhập Mã! Vui lòng kiểm tra lại");
      return false;
    }
    else if(this.listServer.CheckNull(this.Code) !== '') {
      if(this.ListAllItem.findIndex(e => e.Code === this.Code) >= 0) {
        this.notificationService.warn("Mã bạn vừa nhập hiện đã có! Vui lòng kiểm tra lại");
        return false;
      } else {
        return true;
      }
    }
    else {
      return true;
    }
  }

  saveItem() {
    if(this.validation() === true) {
      this.bsModalRef.hide();
      let _type = 'SP.Data.' + this.selectedType.trim() + 'ListItem';
      const data = {
        __metadata: { type: _type },
        Title: this.Title,
        Code: this.Code,
      };
      this.services.AddItemToList(this.selectedType, data).subscribe(
        item => { },
        error => {
          this.CloseRotiniPanel();
          console.log(
            'error when add item to list ' + this.selectedType + ': ' + error
          ),
          this.notificationService.error('Thêm mới thất bại');
        },
        () => {
          console.log(
            'Add item of approval user to list ' +  this.selectedType + ' successfully!'
          );
          this.notificationService.success('Thêm mới thành công');
          this.ListAllItem.unshift({
            STT: this.ListAllItem.length,
            Name: this.Title,
            Code: this.Code
          })
          if(this.selectedType === "ListDepartment") {
            this.ListDepartment.unshift({
              Name: this.Title,
              Code: this.Code
            })
          } else if(this.selectedType === "ListRole") {
            this.Role.unshift({
              Name: this.Title,
              Code: this.Code
            })
          }
          if (!(this.ref as ViewRef).destroyed) {
            this.ref.detectChanges();  
          } 
        }
      )
    }
  }

  validationEmployee() {
    if (this.listServer.CheckNull(this.EmpName) === '') {
      this.notificationService.warn("Bạn chưa nhập Tên nhân viên! Vui lòng kiểm tra lại");
      return false;
    }
    else if(this.listServer.CheckNull(this.Department) === '') {
      this.notificationService.warn("Bạn chưa chọn Phòng ban! Vui lòng kiểm tra lại");
      return false;
    } 
    else if(this.listServer.CheckNull(this.Role) === '') {
      this.notificationService.warn("Bạn chưa chọn Chức vụ! Vui lòng kiểm tra lại");
      return false;
    }
    else {
      return true;
    }
  }
  
  saveItemEmployee() {
    if(this.validationEmployee() === true) {
      this.bsModalRef.hide();

      let _type = 'SP.Data.ListMapEmployeeListItem';
      const data = {
        __metadata: { type: _type },
        Title: this.EmployeeName,
        UserId: this.EmployeeId,
        Email: this.EmployeeEmail,
        RoleCode: this.Role.split('|')[0],
        RoleName: this.Role.split('|')[1],
        DepartmentCode: this.Department.split('|')[0],
        DepartmentName: this.Department.split('|')[1],
      };
      this.services.AddItemToList(this.selectedType, data).subscribe(
        item => { },
        error => {
          this.CloseRotiniPanel();
          console.log(
            'error when add item to list ' + this.selectedType + ': ' + error
          ),
          this.notificationService.error('Thêm mới thất bại');
        },
        () => {
          console.log(
            'Add item of approval user to list ' +  this.selectedType + ' successfully!'
          );
          this.notificationService.success('Thêm mới thành công');
          this.ListAllEmployee.unshift({
            STT: this.ListAllEmployee.length,
            Name: this.EmployeeName,
            Department: this.Department.split('|')[1],
            Role: this.Role.split('|')[1],
          })
          if (!(this.ref as ViewRef).destroyed) {
            this.ref.detectChanges();  
          } 
        }
      )
    }
  }

  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
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
    if(this.overlayRef !== undefined) {
      this.overlayRef.dispose();
    }
  }
}
