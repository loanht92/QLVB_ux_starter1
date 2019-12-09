import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Model, ModelFactory } from '@angular-extensions/model';
import { environment } from '../../../../../environments/environment';
import { MatListItem } from '@angular/material';
import { createAction, props } from '@ngrx/store';

export const actionFormReset = createAction('[Form] Reset');

@Injectable({
  providedIn: 'root'
})
export class IncomingDocService {
  private model: Model<IncomingDoc[]>;
  inDocs$: Observable<IncomingDoc[]>;

  private restUrl = environment.proxyUrl;
  private currentUserAPI = '/_api/web/currentUser';
  private urlUserInfo =
    '/_api/SP.UserProfiles.PeopleManager/GetPropertiesFor(accountName=@v)?@v=';

  constructor(private http: HttpClient) {
    if (environment.production) {
      this.restUrl = window.location.origin + environment.siteDBUrl;
    }
    if (environment.production) {
      http.options(this.restUrl, {
        headers: {
          accept: 'application/json;odata=verbose'
        }
      });
    }
  }
  httpOptions = {
    headers: new HttpHeaders({
      accept: 'application/json;odata=verbose',
      dataType: 'json',
      'Content-Type': 'application/json;odata=verbose',
      "x-requestdigest": window['__frmSPDigest']
    })
  };

  FindItemById(array, id) {
    return array.find(i => parseInt(i.id) === parseInt(id));
  }

  FindItemByCode(array, value) {
    return array.find(i => i.code === value);
  }

  CheckNull(value) {
    if (value === undefined || value === null) {
      return '';
    } else {
      return value;
    }
  }

  CheckNullSetZero(value) {
    if (value === undefined || value === null) {
      return 0;
    } else if (isNaN(value)) {
      return 0;
    } else {
      return Number(value);
    }
  }

  SetEmpty(value) {
    if (this.CheckNullSetZero(value) === 0) {
      return '';
    } else {
      return value;
    }
  }

  formatNumberTo(value) {
    return ('0000000' + value).slice(-4);
  }

  FormatDateShow(objDate, locale) {
    try {
      if (objDate === null) {
        return '';
      }
      var options = { year: 'numeric', month: 'numeric', day: 'numeric' };
      if (locale === undefined) {
        locale = 'en-GB';
      }
      return objDate.toLocaleString(locale, options);
    } catch (err) {
      console.log('FormatDateShow1:' + err.message);
      return objDate;
    }
  }

  urlDocumentToMax =
    "/_api/web/lists/getbytitle('ListDocumentTo')/items?$select=*,UserOfHandle/Title,UserOfHandle/Id,Author/Id,Author/Name&$expand=UserOfHandle,Author&$top=1&$orderby=ID desc";
  getDocumentToMax(): Observable<any> {
    return this.http.get(
      `${this.restUrl}${this.urlDocumentToMax}`
    );
  }

  urlDocumentTo =
    "/_api/web/lists/getbytitle('ListDocumentTo')/items?$select=*,UserOfHandle/Title,UserOfHandle/Id,Author/Id,Author/Title,Author/Name,AttachmentFiles&$expand=UserOfHandle,Author,AttachmentFiles&$orderby=ID desc&$top=1000";
  getListDocumentTo(userId): Observable<any> {
    return this.http.get(
      `${this.restUrl}${this.urlDocumentTo}&$filter=Author/Id eq ` +
        `'` +
        userId +
        `' and StatusID eq '-1'`
    );
  }

  getAllDocumentTo(strFilter) {
    return this.http.get(
      `${this.restUrl}${this.urlDocumentTo}` + strFilter
    );
  }

  getAllDocumentReport(listName, strFilter): Observable<any>  {
    return this.http.get(
      `${this.restUrl}` + `/_api/web/lists/getbytitle('` + listName + `')/items?$select=*,UserOfHandle/Title,UserOfHandle/Id,Author/Id,Author/Title,Author/Name&$expand=UserOfHandle,Author&$orderby=ID desc` + strFilter
    );
  }

  urlRequestTo =
    "/_api/web/lists/getbytitle('ListProcessRequestTo')/items?$select=*,UserRequest/Title,UserRequest/Id,UserRequest/Name,UserApprover/Title,UserApprover/Id,UserApprover/Name,UserRetrieve/Id,UserRetrieve/Title&$orderby=ID desc&$top=1000&$expand=UserApprover,UserRequest,UserRetrieve";
  getListRequestTo(strFilter): Observable<any> {
    return this.http.get(`${this.restUrl}${this.urlRequestTo}` + strFilter);
  }

  urlRequest =
    "/_api/web/lists/getbytitle('ListProcessRequestTo')/items?$select=*,UserRequest/Title,UserRequest/Id,UserRequest/Name,UserApprover/Title,UserApprover/Id,UserApprover/Name&$orderby=ID asc&$expand=UserApprover,UserRequest";
  getListRequestByDocID(docId): Observable<any> {
    return this.http.get(
      `${this.restUrl}${this.urlRequest}` +
        `&$filter=NoteBookID eq '` +
        docId +
        `'`
    );
  }

  urlGroupApprover =
    "/_api/web/lists/getbytitle('ListMapEmployee')/items?$select=*,User/Name,User/Title,User/Id&$expand=User&$orderby=RoleDefault desc&$filter=RoleCode eq ";
  getUserApprover(role) {
    return this.http.get(
      `${this.restUrl}${this.urlGroupApprover}` + `'` + role + `'`
    );
  }

  getAllUser() {
    return this.http.get(
      `${this.restUrl}` + `/_api/web/lists/getbytitle('ListMapEmployee')/items?$select=*,User/Name,User/Title,User/Id&$expand=User`
    );
  }
  
  getRoleCurrentUser(id) {
    return this.http.get(`${this.restUrl}/_api/web/lists/getbytitle('ListMapEmployee')/items?$select=*,User/Name,User/Title,User/Id&$expand=User&$filter=User/Id eq '` + id + `'`);
  }

  getHistoryStep(noteBookID, strFilter) {
    return this.http.get(
      `${this.restUrl}` + `/_api/web/lists/getbytitle('ListHistoryRequestTo')/items?$select=*,UserRequest/Title,UserRequest/Id,UserApprover/Title,UserApprover/Id,UserApprover/Name&$expand=UserRequest,UserApprover&$filter=NoteBookID eq '` + noteBookID + `'` + strFilter
    );
  }

  getNumberToMax(arr: IncomingDoc[]) {
    let result = Math.max.apply(
      Math,
      arr.map(function(element) {
        return element.numberTo;
      })
    );
    return result;
  }

  //get item by id in list document incoming
  getListDocByID(id) {
    let urlDetailLeave =
      "/_api/web/lists/getbytitle('ListDocumentTo')/items?$select=* ,Author/Id,Author/Title,Author/Name,UserOfHandle/Id,UserOfHandle/Title,UserOfHandle/Name," +
      'ListUserView/Id, AttachmentFiles&$expand=UserOfHandle,Author,ListUserView,AttachmentFiles&$filter=ID eq ';
    return this.http.get(`${this.restUrl}${urlDetailLeave}` + `'` + id + `'`);
  }
}

export interface IncomingDoc {
  ID: number;
  bookType: string;
  numberTo: string;
  numberToSub: number;
  numberOfSymbol: string;
  source: number;
  docType: number;
  promulgatedDate: string;
  dateTo: string;
  compendium: string;
  secretLevel: number;
  urgentLevel: number;
  deadline: string;
  numberOfCopies: number;
  methodReceipt: number;
  userHandle: number;
  note: string;
  isResponse: string;
  isSendMail: string;
  isRetrieve: string;
  signer: string;
  created: string;
}

export interface IncomingTicket {
  STT: number;
  ID: number;
  compendium: string;
  documentID: number;
  userRequest: string;
  userRequestId: number;
  userApproverId: number;
  userApprover: string;
  deadline: string;
  status: string;
  statusID: number;
  source: string;
  destination: string;
  taskType: string;
  typeCode: string;
  content: string;
  indexStep: number;
  created: string;
  numberTo: string;
  link: string;
  stsClass: string;
  flag: string;
}

export interface ItemSeleted {
  id: number;
  title: string;
  code: string;
}

export class ApproverObject {
  UserId: Number;
  UserName: string;
  UserEmail: string;
}

export class AttachmentsObject {
  name: string;
  urlFile: string;
}
