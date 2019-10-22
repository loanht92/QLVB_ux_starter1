import { Component, OnInit, ChangeDetectionStrategy, ViewChild, ChangeDetectorRef, ViewContainerRef, Injectable } from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatTableDataSource} from '@angular/material';
import {FormControl, FormBuilder} from '@angular/forms';
import {SelectionModel} from '@angular/cdk/collections';
import {FlatTreeControl} from '@angular/cdk/tree';
import {MatTreeFlatDataSource, MatTreeFlattener} from '@angular/material/tree';
import {BehaviorSubject} from 'rxjs';
import * as moment from 'moment';
import { ActivatedRoute } from '@angular/router';
import {IncomingDoc, ItemSeleted, IncomingDocService, IncomingTicket} from '../incoming-doc.service';
import {RotiniPanel} from './document-add.component';
import {ResApiService} from '../../../services/res-api.service';
import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
  ROUTE_ANIMATIONS_ELEMENTS,
  NotificationService
} from '../../../../../core/core.module';

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
  displayedColumns: string[] = ['numberTo', 'created', 'userRequest', 'userApprover', 'deadline','compendium']; //'select', 'userApprover'
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

  constructor(private fb: FormBuilder, private docTo: IncomingDocService, 
              private services: ResApiService, private ref: ChangeDetectorRef,
              private readonly notificationService: NotificationService,
              public overlay: Overlay, public viewContainerRef: ViewContainerRef,
              private route: ActivatedRoute,) {
                // this.route.params.subscribe(params => {
                //   this.styleId = parseInt(params.id);
                //   this.getCurrentUser();
                // });
              // private _database: ChecklistDatabase) {

                // this.treeFlattener = new MatTreeFlattener(this.transformer, this.getLevel,
                //   this.isExpandable, this.getChildren);
                // this.treeControl = new FlatTreeControl<TodoItemFlatNode>(this.getLevel, this.isExpandable);
                // this.dataSource2 = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
            
                // _database.dataChange.subscribe(data => {
                //   this.dataSource2.data = data;
                // });
              }

  ngOnInit() {
    // lấy tham số truyền vào qua url
    this.route.paramMap.subscribe(parames => {
      this.styleId = parseInt(parames.get('id'));
    });
    this.getCurrentUser();
  }

  getAllListRequest() {
    let strSelect = '';
     //chờ xử lý
     if(this.styleId === 1) {
       strSelect = ` and (TypeCode eq 'CXL' or TypeCode eq 'TL') and StatusID eq '0'`;
    }
    //Đã xử lý
    else  if(this.styleId === 2) {
      strSelect = ` and (TypeCode eq 'CXL' or TypeCode eq 'TL') and StatusID eq '1'`;
    }
    //Đã xử lý
    else  if(this.styleId === 3) {
      strSelect = ` and (TypeCode eq 'CXL' or TypeCode eq 'TL') and IsFinished eq '1'`;
    }
    //Chờ xin ý kiến
    else  if(this.styleId === 4) {
      strSelect = ` and TypeCode eq 'XYK' and StatusID eq '0'`;
    }
      //Đã cho ý kiến
    else  if(this.styleId === 5) {
      strSelect = ` and TypeCode eq 'XYK' and StatusID eq '1'`;
    }

    this.strFilter = `&$filter=UserApprover/Id eq ` + this.currentUserId + strSelect;
    this.docTo.getListRequestTo(this.strFilter).subscribe((itemValue: any[]) => {
      let item = itemValue["value"] as Array<any>;     
      this.inDocs$ = []; 
      item.forEach(element => {
        if(this.inDocs$.findIndex(e => e.documentID === element.NoteBookID) < 0) {
          this.inDocs$.push({
            STT: this.inDocs$.length + 1,
            ID: element.ID,
            documentID: element.NoteBookID, 
            compendium: element.Compendium, 
            userRequest: element.UserRequest !== undefined ? element.UserRequest.Title : '',
            userRequestId: element.UserRequest !== undefined ? element.UserRequest.Id : '',
            userApprover: element.UserApprover !== undefined ? element.UserApprover.Title : '',
            deadline: this.docTo.CheckNull(element.Deadline) === '' ? '' : moment(element.Deadline).format('DD/MM/YYYY'),
            status: 'Chờ xử lý',
            source: '',
            destination: '',
            taskType: '',
            typeCode: '',
            content: this.docTo.CheckNull(element.Content),
            indexStep: element.IndexStep,
            created: this.docTo.CheckNull(element.DateCreated) === '' ? '' : moment(element.DateCreated).format('DD/MM/YYYY'),
            numberTo: element.Title,
            link: this.getLinkItemByRole(this.styleId, element.TaskTypeCode, element.NoteBookID, element.IndexStep),
            stsClass: ''
          })
        } 
        else if(element.IsFinished === 1) {
          let index = this.inDocs$.findIndex(e => e.documentID === element.NoteBookID);
          if(index >= 0) {
            this.inDocs$.splice(index, 1);
          }
        }
      })
      this.dataSource = new MatTableDataSource<IncomingTicket>(this.inDocs$);
      this.ref.detectChanges();
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
        this.getAllListRequest();
      }
      );
  }
  
  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  getLinkItemByRole(type, taskType, id, step) {
    let link = '';
    // Cho xu ly
    if(this.docTo.CheckNullSetZero(type) === 1) {
      if(taskType === 'XLC' || taskType === 'TL') {
        link = '/Documnets/IncomingDoc/docTo-detail/' + id + '/' + step;
      } else {
        link = '/Documnets/IncomingDoc/docTo-detail/' + id;
      }
    } 
    // Cho xin y kien, da cho y kien
    else if(this.docTo.CheckNullSetZero(type) === 4 || this.docTo.CheckNullSetZero(type) === 5) {
      link = '/Documnets/IncomingDoc/docTo-detail/' + id + '/-1';
    }
    else {
      link = '/Documnets/IncomingDoc/docTo-detail/' + id;
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
