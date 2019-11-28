import { Component, OnInit, ChangeDetectionStrategy, ViewChild, ChangeDetectorRef, ViewContainerRef, Injectable, ViewRef, HostListener } from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatTableDataSource} from '@angular/material';
import {FormControl, FormBuilder} from '@angular/forms';
import {SelectionModel} from '@angular/cdk/collections';
import {BehaviorSubject} from 'rxjs';
import * as moment from 'moment';
import {PlatformLocation} from '@angular/common';
import {ActivatedRoute, Router, RoutesRecognized } from '@angular/router';
import {IncomingDocService, IncomingTicket} from '../incoming-doc.service';
import {RotiniPanel} from './document-add.component';
import {ResApiService} from '../../../services/res-api.service';
import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { IncomingDocumentComponent } from './incoming-document.component';
import {
  ROUTE_ANIMATIONS_ELEMENTS,
  NotificationService
} from '../../../../../core/core.module';
import { element } from 'protractor';

export class TodoItemNode {
  children: TodoItemNode[];
  item: string;
}

/** Flat to-do item node with expandable and level information */
export class TodoItemFlatNode {
  item: string;
  level: number;
  expandable: boolean;
}

/**
 * The Json object for to-do list data.
 */
const TREE_DATA = {
  Groceries: {
    'Almond Meal flour': null,
    'Organic eggs': null,
    'Protein Powder': null,
    Fruits: {
      Apple: null,
      Berries: ['Blueberry', 'Raspberry'],
      Orange: null
    }
  },
  Reminders: [
    'Cook dinner',
    'Read the Material Design spec',
    'Upgrade Application to Angular'
  ]
};

/**
 * Checklist database, it can build a tree structured Json object.
 * Each node in Json object represents a to-do item or a category.
 * If a node is a category, it has children items and new items can be added under the category.
 */
@Injectable()
export class ChecklistDatabase {
  dataChange = new BehaviorSubject<TodoItemNode[]>([]);

  get data(): TodoItemNode[] { return this.dataChange.value; }

  constructor() {
    this.initialize();
  }

  initialize() {
    // Build the tree nodes from Json object. The result is a list of `TodoItemNode` with nested
    //     file node as children.
    const data = this.buildFileTree(TREE_DATA, 0);

    // Notify the change.
    this.dataChange.next(data);
  }

  /**
   * Build the file structure tree. The `value` is the Json object, or a sub-tree of a Json object.
   * The return value is the list of `TodoItemNode`.
   */
  buildFileTree(obj: {[key: string]: any}, level: number): TodoItemNode[] {
    return Object.keys(obj).reduce<TodoItemNode[]>((accumulator, key) => {
      const value = obj[key];
      const node = new TodoItemNode();
      node.item = key;

      if (value != null) {
        if (typeof value === 'object') {
          node.children = this.buildFileTree(value, level + 1);
        } else {
          node.item = value;
        }
      }

      return accumulator.concat(node);
    }, []);
  }

  /** Add an item to to-do list */
  insertItem(parent: TodoItemNode, name: string) {
    if (parent.children) {
      parent.children.push({item: name} as TodoItemNode);
      this.dataChange.next(this.data);
    }
  }

  updateItem(node: TodoItemNode, name: string) {
    node.item = name;
    this.dataChange.next(this.data);
  }
}

@Component({
  selector: 'anms-document-waiting',
  templateUrl: './document-waiting.component.html',
  styleUrls: ['./document-waiting.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentWaitingComponent implements OnInit {

  listTitle = "ListProcessRequestTo";
  inDocs$: IncomingTicket[]= [];
  displayedColumns: string[] = ['numberTo', 'created', 'userRequest', 'userApprover', 'deadline','compendium', 'taskType', 'flag']; //'select', 'userApprover'
  dataSource = new MatTableDataSource<IncomingTicket>();
  selection = new SelectionModel<IncomingTicket>(true, []);
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  searchText = '';
  date = new FormControl(new Date());
  DocumentID = 0;
  currentUserId;
  currentUserName;
  strFilter = '';
  overlayRef;
  styleId = 1;
  IsComment;
  @HostListener('window:popstate', ['$event']) onPopState(event) {
    console.log('Back button pressed');
  }
  constructor(private fb: FormBuilder, private docTo: IncomingDocService, 
              private services: ResApiService, private ref: ChangeDetectorRef,
              private readonly notificationService: NotificationService, private routes: Router,
              public overlay: Overlay, public viewContainerRef: ViewContainerRef,
              private route: ActivatedRoute, private location: PlatformLocation,
              private incoming: IncomingDocumentComponent
              ) {
                this.location.onPopState(() => {
                  console.log('Init: pressed back!');
                  window.location.reload(); 
                  return;
                });
                }

  ngOnInit() {
    // lấy tham số truyền vào qua url
    this.route.paramMap.subscribe(parames => {
      this.styleId = parseInt(parames.get('id'));
    });
    this.getCurrentUser();
    //this.incoming.isAuthenticated$ = false;
  }

  ClickItem(row) {
    console.log(row);
    this.routes.navigate([row.link]);
  }

  getAllListRequest() {
    let strSelect = '';
    this.IsComment = true;
    // {-1:Thu hồi, 1:chờ xử lý, 2:Đang xử lý, 3:Đã xử lý, 4:Chờ xin ý kiến, 5:Đã cho ý kiến}
    // and (TypeCode eq 'CXL' or TypeCode eq 'TL') and 
     //chờ xử lý
     if(this.styleId === 1) {
       strSelect = `' and TypeCode ne 'XYK' and StatusID eq '0'`;
       this.strFilter = `&$filter=UserApprover/Id eq '` + this.currentUserId + strSelect;
    }
    //Đang xử lý
    else  if(this.styleId === 2) {
      // strSelect = `') and TypeCode ne 'XYK' and (StatusID eq '1' or StatusID eq '0') and IsFinished ne '1'`;
      // this.strFilter = `&$filter=(UserRequest/Id eq '` + this.currentUserId + `' or UserApprover/Id eq '` + this.currentUserId + strSelect;
      strSelect = `') and TypeCode ne 'XYK' and IsFinished ne '1'`;
      this.strFilter = `&$filter=(UserRequest/Id eq '` + this.currentUserId + `' or UserApprover/Id eq '` + this.currentUserId + strSelect;
    }
    //Đã xử lý
    else  if(this.styleId === 3) {
      strSelect = `') and TypeCode ne 'XYK' and IsFinished eq '1' and StatusID ne '-1'`;
      this.strFilter = `&$filter=(UserRequest/Id eq '` + this.currentUserId + `' or UserApprover/Id eq '` + this.currentUserId + strSelect;
    }
    //Thu hồi
    if(this.styleId === -1) {
      strSelect = `') and TypeCode ne 'XYK' and StatusID eq '-1'`;
      this.strFilter = `&$filter=(UserRequest/Id eq '` + this.currentUserId + `' or UserApprover/Id eq '` + this.currentUserId + strSelect;
    }
    //Chờ xin ý kiến
    else  if(this.styleId === 4) {
      strSelect = `' and TypeCode eq 'XYK' and StatusID eq '0'`;
      this.strFilter = `&$filter=UserApprover/Id eq '` + this.currentUserId + strSelect;
    }
      //Đã cho ý kiến
    else  if(this.styleId === 5) {
      strSelect = `' and TypeCode eq 'XYK' and StatusID eq '1'`;
      this.strFilter = `&$filter=UserApprover/Id eq '` + this.currentUserId + strSelect;
    }

    //this.strFilter = `&$filter=(UserRequest/Id eq '` + this.currentUserId + strSelect;
    this.docTo.getListRequestTo(this.strFilter).subscribe((itemValue: any[]) => {
      let item = itemValue["value"] as Array<any>;     
      this.inDocs$ = []; 
      item.forEach(element => {
        //if(this.inDocs$.findIndex(e => e.documentID === element.NoteBookID) < 0) {
        this.inDocs$.push({
          STT: this.inDocs$.length + 1,
          ID: element.ID,
          documentID: element.NoteBookID, 
          compendium: element.Compendium, 
          userRequest: (element.IndexStep === 1 && element.TypeCode === "CXL" ) ? 
                      this.docTo.CheckNull( element.Source) : element.UserRequest !== undefined ? element.UserRequest.Title : '',
          userRequestId: element.UserRequest !== undefined ? element.UserRequest.Id : '',
          userApproverId: element.UserApprover !== undefined ? element.UserApprover.Id : '',
          userApprover: element.UserApprover !== undefined ? element.UserApprover.Title : '',
          deadline: this.docTo.CheckNull(element.Deadline) === '' ? '' : moment(element.Deadline).format('DD/MM/YYYY'),
          status: element.StatusID === 0 ? 'Chờ xử lý' : 'Đang xử lý',
          statusID: element.StatusID,
          source: '',
          destination: '',
          taskType: this.docTo.CheckNull(element.TaskTypeName),
          typeCode: element.TaskTypeCode,
          content: this.docTo.CheckNull(element.Content),
          indexStep: element.IndexStep,
          created: this.docTo.CheckNull(element.DateCreated) === '' ? '' : moment(element.DateCreated).format('DD/MM/YYYY'),
          numberTo: element.Title,
          link: this.getLinkItemByRole(this.styleId, element.NoteBookID, element.IndexStep),
          stsClass: '',
          flag: element.SecretCode === "MAT" || element.UrgentCode === "KHAN" ? 'flag' : ''
        })
        //} 
        // if(element.IsFinished === 1) {
        //   let index = this.inDocs$.findIndex(e => e.documentID === element.NoteBookID);
        //   if(index >= 0) {
        //     this.inDocs$.splice(index, 1);
        //   }
        // }
      })
      if(this.styleId === 2) {
        let listItem1 = []; // list chờ xử lý
        let listItem2 = []; // list đang xử lý
        let listItem3 = [];   // list thu hồi
        listItem1 = this.inDocs$.filter(i => i.statusID === 0 && i.userApproverId === this.currentUserId);
        listItem3 =  this.inDocs$.filter(i => i.statusID === -1 && i.userApproverId === this.currentUserId);
        this.inDocs$.forEach(element => {
          if(listItem1.findIndex(e => e.documentID === element.documentID) < 0 && 
            listItem3.findIndex(e => e.documentID === element.documentID) < 0 &&
            listItem2.findIndex(e => e.ID === element.ID || e.documentID === element.documentID) < 0) {
              if(element.typeCode === "XLC") {
                listItem2.push(element);
              }
          }
        })
        this.dataSource = new MatTableDataSource<IncomingTicket>(listItem2);
      } else {
        let listItem1 = [];
        this.inDocs$.forEach(element => {
          if(listItem1.findIndex(e => e.documentID === element.documentID) < 0) {
            listItem1.push(element);
          }
        })
        this.dataSource = new MatTableDataSource<IncomingTicket>(listItem1);
      }
      
      if (!(this.ref as ViewRef).destroyed) {
        this.ref.detectChanges();  
      } 
      this.dataSource.paginator = this.paginator;
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
  }

  getCurrentUser(){
    this.OpenRotiniPanel();
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
        this.services.getDepartmnetOfUser(this.currentUserId).subscribe(
          itemValue => {
            let item = itemValue['value'] as Array<any>;
            if(item.length > 0) {
              item.forEach(element => {
                if (element.RoleCode === "VT") {
                  //this.incoming.isAuthenticated$ = true;
                }
              });
            }
          },
          error => { 
            console.log("Load department code error: " + error);
            this.CloseRotiniPanel();
          },
        )
        this.getAllListRequest();
      }
      );
  }
  
  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  getLinkItemByRole(type, id, step) {
    let link = '';
    // Cho xu ly
    if(this.docTo.CheckNullSetZero(type) === 1) {
      link = '/Documents/IncomingDoc/docTo-detail/' + id + '/' + step;
    } 
    // Cho xin y kien, da cho y kien
    else if(this.docTo.CheckNullSetZero(type) === 4 || this.docTo.CheckNullSetZero(type) === 5) {
      link = '/Documents/IncomingDoc/docTo-detail/' + id + '/-1';
    }
    else if(this.docTo.CheckNullSetZero(type) === -1) {
      link = "";
    }
    else {
      link = '/Documents/IncomingDoc/docTo-detail/' + id;
    }
    return link;
  }

  OpenRotiniPanel() {
    let config = new OverlayConfig();
    config.positionStrategy = this.overlay.position()
      .global().centerVertically().centerHorizontally();
    config.hasBackdrop = true;
    this.overlayRef = this.overlay.create(config);
    this.overlayRef.attach(new ComponentPortal(RotiniPanel, this.viewContainerRef));
  }

  CloseRotiniPanel() {
    if(this.overlayRef !== undefined) {
      this.overlayRef.dispose();
    }
  }
}
