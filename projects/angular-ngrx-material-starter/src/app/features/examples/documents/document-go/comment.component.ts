import { Component, OnInit, ChangeDetectionStrategy, Injectable, ViewContainerRef, Inject, ChangeDetectorRef, ViewRef} from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { BehaviorSubject, from } from 'rxjs';
import { ItemDocumentGo } from '../models/document-go'
import { SharedService } from '../../../../shared/shared-service/shared.service';
import { DocumentGoPanel } from '../document-go/document-go.component';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { DocumentGoService } from './document-go.service';
import { Router } from '@angular/router';
import { ResApiService } from '../../services/res-api.service';
import { DocumentGoDetailComponent } from './document-go-detail.component';

import {
  ROUTE_ANIMATIONS_ELEMENTS,
  NotificationService
} from '../../../../core/core.module';
import { statSync } from 'fs';
@Component({
  selector: 'anms-comment',
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // providers: [ChecklistDatabase]
})
//@Injectable()
export class CommentComponent implements OnInit {
  content = null;
  selectedApprover = null;
  listUser = [];
  listUserIdSelect = [];
  outputFile = [];
  overlayRef; buffer;
  currentUserId = null;
  currentUserName = null;
  currentUserEmail;
  indexComment = null;
  idItemProcess; listDepCode;
  ArrayUserPofile;
  pictureCurrent;
  EmailConfig;
  
  constructor(
    public dialogRef: MatDialogRef<CommentComponent>,
    private restService: SharedService,
    private apiService: ResApiService,
    private docServices: DocumentGoService,
    private routes: Router,private readonly notificationService: NotificationService,
    public overlay: Overlay, public viewContainerRef: ViewContainerRef,
    private ref: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data:any) {
  }
  ngOnInit() {
    this.getCurrentUser();
    //this.getListUser();
    this.getListEmailConfig();
    this.listUser = this.data[1];
    if (!(this.ref as ViewRef).destroyed) {
      this.ref.detectChanges();  
    } 
  }

  //Lấy người dùng hiện tại
  getCurrentUser() {
    this.restService.getCurrentUser().subscribe(
      itemValue => {
        this.currentUserId = itemValue["Id"];
        this.currentUserName = itemValue["Title"];
        this.currentUserEmail = itemValue["Email"];
      },
      error => {
        console.log("error: " + error);
        //   this.CloseDocumentGoPanel();
      },
      () => {
        console.log("Current user email is: \n" + "Current user Id is: " + this.currentUserId + "\n" + "Current user name is: " + this.currentUserName);
           this.getUserPofile(this.currentUserEmail);
      }
    );
  }

  getListEmailConfig() {
    const str = `?$select=*&$filter=Title eq 'DT'&$top=1`;
    this.EmailConfig = null;
    this.apiService.getItem('ListEmailConfig', str).subscribe((itemValue: any[]) => {
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

  //lấy đường dẫn ảnh trên sharepoint
  getUserPofile(loginName) {
    try {
      this.restService.getUserInfo('i:0%23.f|membership|' + loginName).subscribe(
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

  //lấy ds người dùng trong bảng ListMapEmployee
  getListUser() {
    try {
      const str = `?$select=ID,Title,DepartmentCode,DepartmentName,Email,User/Name,User/Title,User/Id&$expand=User`;
      this.restService.getItemList('ListMapEmployee', str).subscribe(
        item => {
          this.listDepCode=[];
          this.listUser = [];
          let lst=[];
          let UserItem = item["value"] as Array<any>;
          UserItem.forEach(element => {
            this.listUser.push({ 
              Id: element.ID,
              DepartmentCode: element.DepartmentCode,
              DepartmentName: element.DepartmentName, 
              UserName: element.User.Title, 
              UserId: element.User.Id, 
              UserEmail: element.User.Name.split('|')[2] ,
              RoleCode: element.RoleCode,
              RoleName: element.RoleName
            });
            if(this.listDepCode.indexOf(element.DepartmentCode)<0){
              this.listDepCode.push(element.DepartmentCode);
            }
          });
        },
        error => console.log(error),
        () => {
          console.log('getListUser success');
          if (!(this.ref as ViewRef).destroyed) {
            this.ref.detectChanges();  
          } 
        }
      );
    } catch (error) {
      console.log('getListUser error: ' + error.message);
    }
  }

  saveItem() {
    try {
      if (this.isNotNull(this.content)) {
        this.listUserIdSelect = [];
        let id = this.selectedApprover.split('|')[0];
        this.listUserIdSelect.push(id);

        this.openCommentPanel();
        //lưu attach file vào văn bản
        if (this.outputFile.length > 0) {
          this.saveItemAttachment(0, this.data[0].ID, 'ListDocumentGo',null);
        }
        //lưu phiếu xin ý kiến và lưu comment
       for(let i=0;i<this.listUserIdSelect.length;i++){
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
        Title: this.data[0].NumberSymbol,
        DocTypeName: this.data[0].DocTypeName,
        DateCreated: new Date(),
        DocumentGoID: this.data[0].ID,
        UserRequestId: this.currentUserId,
        UserApproverId: this.listUserIdSelect[index],
        StatusID: 0,
        StatusName: "Chờ xin ý kiến",
        TypeCode: 'XYK',
        TypeName: 'Xin ý kiến',
        Content: this.content,
        Compendium: this.data[0].Compendium,
      }
      this.restService.insertItemList('ListProcessRequestGo', dataProcess).subscribe(
        items => {
          console.log(items);
          this.idItemProcess = items['d'].Id;
        },
        error => console.log(error),
        () => {
            this.saveListComment(index);
            this.SendMailComment(0);
        }
      )
    } catch (error) {
      console.log('saveItemListProcess error: ' + error.message);
    }
  }

  SendMailComment(index) {
    var user = this.listUserIdSelect[index];
    const dataSendUser = {
      __metadata: { type: 'SP.Data.ListRequestSendMailListItem' },
      Title: 'ListDocumentGo',
      IndexItem: this.data[0].ID,
      Step: 1,
      KeyList: 'ListDocumentGo_' + this.data[0].ID,
      SubjectMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.CommentSubject),
      BodyMail: this.Replace_Field_Mail(this.EmailConfig.FieldMail, this.EmailConfig.CommentBody),
      SendMailTo: user.split('|')[1],
    }
    this.apiService.AddItemToList('ListRequestSendMail', dataSendUser).subscribe(
      itemRoomRQ => {
        console.log(itemRoomRQ['d']);
      },
      error => {
        console.log(error);
        this.closeCommentPanel();
      },
      () => {
        index ++;
        if(index < this.listUserIdSelect.length) {
          this.SendMailComment(index);
        }
      }
    );
  }

  saveListComment(index) {
    try {
    //  this.openCommentPanel();
      const dataComment = {
        __metadata: { type: 'SP.Data.ListCommentsListItem' },
        Title: "ListDocumentGo_" + this.data[0].ID,
        Chat_Comments: this.content,
        KeyList: "ListDocumentGo_" + this.data[0].ID,
        ProcessID:this.idItemProcess,
        UserApproverId: this.listUserIdSelect[index],
      }
      if (this.isNotNull(this.pictureCurrent)) {
        Object.assign(dataComment, { userPicture: this.pictureCurrent });
      }
      this.restService.insertItemList('ListComments', dataComment).subscribe(
        itemComment => {
          this.indexComment = itemComment['d'].Id;
        },
        error => console.log(error),
        () => {
          if (this.outputFile.length > 0) {
            this.saveItemAttachment(0, this.indexComment, 'ListComments',index);
          }
          else {
            this.closeCommentPanel();
            console.log('Bạn gửi xin ý kiến thành công');
            //kt nếu lưu đến người cuối cùng rồi thì đóng modal
            if(index == this.listUserIdSelect.length-1){
              this.notificationService.success('Bạn gửi xin ý kiến thành công');
              this.closeModal();
            }
            
          }
        }
      )
    } catch (error) {
      console.log("saveListComment error: " + error);
    }
  }

  isNotNull(str) {
    return (str !== null && str !== "" && str !== undefined);
  }

  addAttachmentFile() {
    try {
      const inputNode: any = document.querySelector('#fileAttachment_XYK');
      if (this.isNotNull(inputNode.files[0])) {
        console.log(inputNode.files[0]);
        if (this.outputFile.length > 0) {
          if (this.outputFile.findIndex(index => index.name === inputNode.files[0].name) === -1) {
            this.outputFile.push(inputNode.files[0]);
          }
        }
        else {
          this.outputFile.push(inputNode.files[0]);
        }
      }
    } catch (error) {
      console.log("addAttachmentFile error: " + error);
    }
  }

  removeAttachmentFile(index) {
    try {
      console.log(this.outputFile.indexOf(index))
      this.outputFile.splice(this.outputFile.indexOf(index), 1);
    } catch (error) {
      console.log("removeAttachmentFile error: " + error);
    }
  }

  saveItemAttachment(index, idItem, listName,indexUser) {
    try {
      this.buffer = this.getFileBuffer(this.outputFile[index]);
      this.buffer.onload = (e: any) => {
        console.log(e.target.result);
        const dataFile = e.target.result;
        this.restService.inserAttachmentFile(dataFile, this.outputFile[index].name, listName, idItem).subscribe(
          itemAttach => {
            console.log('inserAttachmentFile success');
          },
          error =>{
            this.notificationService.error('Bạn gửi xin ý kiến thất bại');
            console.log(error);
          } ,
          () => {
            console.log('inserAttachmentFile successfully');
            if (Number(index) < (this.outputFile.length - 1)) {
              this.saveItemAttachment((Number(index) + 1), idItem, listName,indexUser);
            }
            else {
              console.log('attachfile success');
             if (listName == 'ListComments'&& indexUser==this.listUserIdSelect.length-1) {
              this.notificationService.success('Bạn gửi xin ý kiến thành công');
              this.closeCommentPanel();
                this.closeModal();
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

  callbackfunc() {
    this.routes.navigate(['Documents/documentgo-detail/' + this.data[0].ID]);
  }

  openCommentPanel() {
    let config = new OverlayConfig();
    config.positionStrategy = this.overlay.position().global().centerVertically().centerHorizontally();
    config.hasBackdrop = true;
    this.overlayRef = this.overlay.create(config);
    this.overlayRef.attach(new ComponentPortal(DocumentGoPanel, this.viewContainerRef));
  }

  closeCommentPanel() {
    this.overlayRef.dispose();
  }

  closeModal(): void {
    this.dialogRef.close();
  //  this.callbackfunc();
  }

  Replace_Field_Mail(FieldMail, ContentMail) {
    try {
      if (this.isNotNull(FieldMail) && this.isNotNull(ContentMail)) {
        let strContent = FieldMail.split(",");
        console.log("ContentMail before: " + ContentMail);
        for (let i = 0; i < strContent.length; i++) {
          switch (strContent[i]) {
            case 'NumberTo':
              ContentMail = ContentMail.replace("{" + strContent[i] + "}", this.data[0].NumberGo);
              break;
            case 'Compendium':
              ContentMail = ContentMail.replace("{" + strContent[i] + "}", this.docServices.checkNull(this.data[0].Compendium));
              break;
            case 'Content':
              ContentMail = ContentMail.replace("{" + strContent[i] + "}", this.docServices.checkNull(this.content));
              break;
            case 'UserRequest':
              ContentMail = ContentMail.replace("{" + strContent[i] + "}", this.currentUserName);
              break;
            case 'Author':
              ContentMail = ContentMail.replace("{" + strContent[i] + "}", this.currentUserName);
              break;
            case 'ContentComment':
              ContentMail = ContentMail.replace("{" + strContent[i] + "}", this.content);
              break;
            case 'userComment':
              ContentMail = ContentMail.replace("{" + strContent[i] + "}", this.selectedApprover.split('|')[2]);
              break;
            case 'userStep':
              ContentMail = ContentMail.replace("{" + strContent[i] + "}", this.selectedApprover.split('|')[2]);
              break;
            case 'UserApprover':
              ContentMail = ContentMail.replace("{" + strContent[i] + "}", this.selectedApprover.split('|')[2]);
              break;
            case 'ItemUrl':
              ContentMail = ContentMail.replace("{" + strContent[i] + "}", window.location.href.split('#/')[0]+ '#/Documents/documentgo-detail/' + this.data[0].ID);
              break;
            case 'TaskUrl':
              ContentMail = ContentMail.replace("{" + strContent[i] + "}", window.location.href.split('#/')[0] + '#/Documents/documentgo-detail/' + this.data[0].ID + '/1');
              break;
            case 'HomeUrl':
              ContentMail = ContentMail.replace("{" + strContent[i] + "}", window.location.href.split('#/')[0] + '#/Documents');
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

  /** Map from flat node to nested node. This helps us finding the nested node to be modified */
  flatNodeMap = new Map<TodoItemFlatNode, TodoItemNode>();

  /** Map from nested node to flattened node. This helps us to keep the same object for selection */
  nestedNodeMap = new Map<TodoItemNode, TodoItemFlatNode>();

  /** A selected parent node to be inserted */
  selectedParent: TodoItemFlatNode | null = null;

  /** The new item's name */
  newItemName = '';

  treeControl: FlatTreeControl<TodoItemFlatNode>;

  treeFlattener: MatTreeFlattener<TodoItemNode, TodoItemFlatNode>;

  dataSource: MatTreeFlatDataSource<TodoItemNode, TodoItemFlatNode>;

  /** The selection for checklist */
  checklistSelection = new SelectionModel<TodoItemFlatNode>(true /* multiple */);

  // constructor(private _database: ChecklistDatabase,private restService:SharedService) {
  //   this.treeFlattener = new MatTreeFlattener(this.transformer, this.getLevel,
  //     this.isExpandable, this.getChildren);
  //   this.treeControl = new FlatTreeControl<TodoItemFlatNode>(this.getLevel, this.isExpandable);
  //   this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

  //   _database.dataChange.subscribe(data => {
  //     this.dataSource.data = data;
  //   });
  // }

  getLevel = (node: TodoItemFlatNode) => node.level;

  isExpandable = (node: TodoItemFlatNode) => node.expandable;

  getChildren = (node: TodoItemNode): TodoItemNode[] => node.children;

  hasChild = (_: number, _nodeData: TodoItemFlatNode) => _nodeData.expandable;

  hasNoContent = (_: number, _nodeData: TodoItemFlatNode) => _nodeData.item === '';

  /**
   * Transformer to convert nested node to flat node. Record the nodes in maps for later use.
   */
  transformer = (node: TodoItemNode, level: number) => {
    const existingNode = this.nestedNodeMap.get(node);
    const flatNode = existingNode && existingNode.item === node.item
      ? existingNode
      : new TodoItemFlatNode();
    flatNode.item = node.item;
    flatNode.level = level;
    flatNode.expandable = !!node.children;
    this.flatNodeMap.set(flatNode, node);
    this.nestedNodeMap.set(node, flatNode);
    return flatNode;
  }

  /** Whether all the descendants of the node are selected. */
  descendantsAllSelected(node: TodoItemFlatNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    const descAllSelected = descendants.every(child =>
      this.checklistSelection.isSelected(child)
    );
    return descAllSelected;
  }

  /** Whether part of the descendants are selected */
  descendantsPartiallySelected(node: TodoItemFlatNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    const result = descendants.some(child => this.checklistSelection.isSelected(child));
    return result && !this.descendantsAllSelected(node);
  }

  /** Toggle the to-do item selection. Select/deselect all the descendants node */
  todoItemSelectionToggle(node: TodoItemFlatNode): void {
    this.checklistSelection.toggle(node);
    const descendants = this.treeControl.getDescendants(node);
    this.checklistSelection.isSelected(node)
      ? this.checklistSelection.select(...descendants)
      : this.checklistSelection.deselect(...descendants);

    // Force update for the parent
    descendants.every(child =>
      this.checklistSelection.isSelected(child)
    );
    this.checkAllParentsSelection(node);
  }

  /** Toggle a leaf to-do item selection. Check all the parents to see if they changed */
  todoLeafItemSelectionToggle(node: TodoItemFlatNode): void {
    this.checklistSelection.toggle(node);
    this.checkAllParentsSelection(node);
  }

  /* Checks all the parents when a leaf node is selected/unselected */
  checkAllParentsSelection(node: TodoItemFlatNode): void {
    let parent: TodoItemFlatNode | null = this.getParentNode(node);
    while (parent) {
      this.checkRootNodeSelection(parent);
      parent = this.getParentNode(parent);
    }
  }

  /** Check root node checked state and change it accordingly */
  checkRootNodeSelection(node: TodoItemFlatNode): void {
    const nodeSelected = this.checklistSelection.isSelected(node);
    const descendants = this.treeControl.getDescendants(node);
    const descAllSelected = descendants.every(child =>
      this.checklistSelection.isSelected(child)
    );
    if (nodeSelected && !descAllSelected) {
      this.checklistSelection.deselect(node);
    } else if (!nodeSelected && descAllSelected) {
      this.checklistSelection.select(node);
    }
  }

  /* Get the parent node of a node */
  getParentNode(node: TodoItemFlatNode): TodoItemFlatNode | null {
    const currentLevel = this.getLevel(node);

    if (currentLevel < 1) {
      return null;
    }

    const startIndex = this.treeControl.dataNodes.indexOf(node) - 1;

    for (let i = startIndex; i >= 0; i--) {
      const currentNode = this.treeControl.dataNodes[i];

      if (this.getLevel(currentNode) < currentLevel) {
        return currentNode;
      }
    }
    return null;
  }

  /** Select the category so we can insert the new item. */
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

/**
 * Node for to-do item
 */
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
  buildFileTree(obj: { [key: string]: any }, level: number): TodoItemNode[] {
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
      parent.children.push({ item: name } as TodoItemNode);
      this.dataChange.next(this.data);
    }
  }

  updateItem(node: TodoItemNode, name: string) {
    node.item = name;
    this.dataChange.next(this.data);
  }
}