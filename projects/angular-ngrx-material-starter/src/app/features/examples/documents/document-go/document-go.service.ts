import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ItemDocumentGo} from '../models/document-go'
import * as moment from 'moment';
@Injectable({
  providedIn: 'root'
})
export class DocumentGoService {
  private restUrl = environment.proxyUrl;

  httpOptions = {
    headers: new HttpHeaders({
      'accept': 'application/json;odata=verbose',
      'dataType': 'json',
      'Content-Type': 'application/json;odata=verbose',
      "x-requestdigest": window['__frmSPDigest']
    })
  }

  httpOptionsUpdate = {
    headers: new HttpHeaders({
      'accept': 'application/json;odata=verbose',
      'dataType': 'json',
      'Content-Type': 'application/json;odata=verbose',
      "x-requestdigest": window['__frmSPDigest'],
      "X-HTTP-Method": "MERGE",
      "IF-MATCH": "*",
    })
  }

  httpOptionsFile = {
    headers: new HttpHeaders({
      'accept': 'application/json;odata=verbose',
      // 'dataType': 'json',
      'Content-Type': 'application/json;odata=verbose',
      "x-requestdigest": window['__frmSPDigest']
    })
  }

  constructor(private http: HttpClient) {
    if (environment.production) {
      this.restUrl = window.location.origin + environment.siteDBUrl;
    }
    http.options(this.restUrl,
      {
        headers: {
          "accept": 'application/json;odata=verbose',
        }
      }),
      this.httpOptions = {
        headers: new HttpHeaders({
          'accept': 'application/json;odata=verbose',
          'dataType': 'json',
          'Content-Type': 'application/json;odata=verbose',
          "x-requestdigest": window['__frmSPDigest']
        })
      },
      this.httpOptionsUpdate = {
        headers: new HttpHeaders({
          'accept': 'application/json;odata=verbose',
          'dataType': 'json',
          'Content-Type': 'application/json;odata=verbose',
          "x-requestdigest": window['__frmSPDigest'],
          "X-HTTP-Method": "MERGE",
          "IF-MATCH": "*",
        })
      },
      this.httpOptionsFile = {
        headers: new HttpHeaders({
          'accept': 'application/json;odata=verbose',
          'Content-Type': 'application/json;odata=verbose',
          "x-requestdigest": window['__frmSPDigest'],
        })
      };
  }

  getItem(listName, select) {
    return this.http.get(`${this.restUrl}/_api/web/lists/getbytitle('` + listName + `')/items` + select);
  }

  insertItem(listName, data) {
    return this.http.post(`${this.restUrl}/_api/web/lists/getbytitle('` + listName + `')/items`, data, this.httpOptions);
  }

  updateItem(listName, id, data) {
    return this.http.post(`${this.restUrl}/_api/web/lists/getbytitle('` + listName + `')/items(` + id + `)`, data, this.httpOptionsUpdate);
  }

  getCurrentUserAPI() {
    return this.http.get(`${this.restUrl}/_api/web/currentUser`);
  }

  getRoleCurrentUser(id) {
    return this.http.get(`${this.restUrl}/_api/web/lists/getbytitle('ListMapEmployee')/items?$select=*,User/Name,User/Title,User/Id&$expand=User&$filter=User/Id eq '` + id + `'`);
  }

  //attachment file
  inserAttachmentFile(data, filename, listName, indexItem) {
    return this.http.post(`${this.restUrl}/_api/web/lists/GetByTitle('` + listName + `')/items(` + indexItem + `)/AttachmentFiles/add(FileName='` + filename + `')`, data, this.httpOptionsFile);
  }

  urlDocumentgo =
  "/_api/web/lists/getbytitle('ListDocumentGo')/items?$select=*,UserOfHandle/Title,UserOfHandle/Id,Author/Id,Author/Title,Signer/Id,Signer/Title,AttachmentFiles&$expand=UserOfHandle,Author,Signer,AttachmentFiles&$orderby=ID desc";
  getAllDocumentTo(strFilter) {
    return this.http.get(
      `${this.restUrl}${this.urlDocumentgo}` + strFilter
    );
  }

  urlRequestGo =
  "/_api/web/lists/getbytitle('ListProcessRequestGo')/items?$select=*, UserRequest/Title,UserRequest/Id,UserApprover/Title,UserApprover/Id,UserRetrieve/Id,UserRetrieve/Title&$orderby=ID desc&$expand=UserApprover,UserRequest,UserRetrieve";
  getListRequestTo(strFilter): Observable<any> {
    return this.http.get(`${this.restUrl}${this.urlRequestGo}` + strFilter);
  }

  getUserInfo(loginName) {
    // loginName = 'i:0%23.f|membership|tuyen.nguyen@tsg.net.vn';
    return this.http.get(`${this.restUrl}/_api/SP.UserProfiles.PeopleManager/GetPropertiesFor(accountName=@v)?@v=` + `'` + loginName + `'`);
  }

  getUserFormSite(loginName){
    return this.http.get(`${this.restUrl}/_api/web/siteusers(@v)?@v=` + `'` + loginName + `'`);
  }
  private urlAddDocumentGo="/_api/web/lists/getbytitle('ListDocumentGo')/items";
  private getDocumentGoAPI = "/_api/web/lists/getbytitle('ListDocumentGo')/items?$select=ID,NumberGo,DocTypeName,NumberSymbol,Compendium,DateCreated,Deadline,StatusName,UserCreate/Title,UserOfHandle/Title&$expand=UserCreate/Id,UserOfHandle/Id";
  private getProcessRequestGo= "/_api/web/lists/getbytitle('ListProcessRequestGo')/items?$select=*,UserRequest/Title,UserRequest/Name,UserRequest/Id,Author/Id,Author/Title,Author/Name,UserApprover/Id,UserApprover/Title,UserApprover/Name&$expand=Author,UserApprover,UserRequest";
  private  urlGroupApprover = "/_api/web/lists/getbytitle('ListMapEmployee')/items?$select=*,User/Name,User/Title,User/Id&$expand=User"
  private urlDetailLeave = "/_api/web/lists/getbytitle('ListDocumentGo')/items?$select=*,Author/Id,Author/Title,Author/Name,UserOfHandle/Id,UserOfHandle/Title,UserOfHandle/Name,"
  + "UserOfCombinate/Title,UserOfCombinate/Id,UserOfCombinate/Name,UserOfKnow/Title,UserOfKnow/Id,UserOfKnow/Name,Signer/Id,Signer/Title,Signer/Name,AttachmentFiles,ListUserView/Id,ListUserView/Title"
  + "&$expand=UserOfHandle,UserOfCombinate,UserOfKnow,Author,Signer,AttachmentFiles,ListUserView&$filter=ID eq ";
 
  getHistoryStep(noteBookID, step) {
    return this.http.get(
      `${this.restUrl}` + `/_api/web/lists/getbytitle('ListHistoryRequestGo')/items?$select=*,UserRequest/Title,UserRequest/Id,UserApprover/Title,UserApprover/Id,UserApprover/Name&$expand=UserRequest,UserApprover&$filter=DocumentGoID eq '` + noteBookID + `' and IndexStep eq '` + step + `'`
    );
  }

  urlDocumentGoMax =
    "/_api/web/lists/getbytitle('ListDocumentGo')/items?$select=*,UserOfHandle/Title,UserOfHandle/Id,Author/Id&$expand=UserOfHandle,Author&$top=1&$orderby=ID desc";
  getDocumentToMax(): Observable<any> {
    return this.http.get(
      `${this.restUrl}${this.urlDocumentGoMax}`
    );
  }

   // format định dạng ngày    
   formatDateTime(date: Date): string {
    if (!date) {
      return '';
    }
    return moment(date).format('DD/MM/YYYY');
    //return moment(date).format('DD/MM/YYYY hh:mm A');
  }
  ISODateString(d) {
    function pad(n) { return n < 10 ? '0' + n : n }
    return d.getFullYear() + '-'
      + pad(d.getMonth() + 1) + '-'
      + pad(d.getDate()) + 'T'
      + pad(d.getHours()) + ':'
      + pad(d.getMinutes()) + ':'
      + pad(d.getSeconds()) + 'Z'
  }
   //    
   checkNull(value): string {
    if (!value) {
      return '';
    }
    return value;
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

  formatNumberGo(value) {
    return ('0000000' + value).slice(-4);
  }

  FindItemById(array, id) {
    return array.find(i => parseInt(i.ID) === parseInt(id));
  }

  FindItemByCode(array, value) {
    return array.find(i => i.Code === value);

  }

  //thêm mới vbđi
  createDocumentGo(data) {
    return this.http.post(`${this.restUrl}${this.urlAddDocumentGo}`, data, this.httpOptions);
  }
//lấy ds vb đi
  getListDocumentGo(strFilter): Observable<any> {
    console.log(`${this.restUrl}${this.getDocumentGoAPI}`  + strFilter + `&$orderby=DateCreated desc`);
    return this.http.get(`${this.restUrl}${this.getDocumentGoAPI}`  + strFilter + `&$orderby=DateCreated desc`);
  }
  //lấy ds phiếu xử lý vb đi
  getListProcessRequestGo(strFilter): Observable<any> {
    console.log(`${this.restUrl}${this.getProcessRequestGo}`  + strFilter + `&$orderby=DateCreated desc`);
    return this.http.get(`${this.restUrl}${this.getProcessRequestGo}`  + strFilter + `&$orderby=DateCreated desc`);
  }
   //lấy ds lịch sử :thông tin người nhận người gửi
  //  urlRequestGo =
  //  "/_api/web/lists/getbytitle('ListProcessRequestGo')/items?$select=*, UserRequest/Title,UserRequest/Id,UserApprover/Title,UserApprover/Id&$orderby=ID desc&$expand=UserApprover,UserRequest";
 getListRequestGoByDocID(strFilter): Observable<any> {
   return this.http.get(`${this.restUrl}${this.getProcessRequestGo}` + strFilter);
 }
 
 //lấy người dùng theo điều kiện tìm kiếm
  getUser(strFilter) {
    return this.http.get(`${this.restUrl}${this.urlGroupApprover}` + strFilter );
  }
  
//lấy ra số vb đi max 
  getNumberToMax(arr : ItemDocumentGo[]) {
    let result = Math.max.apply(Math, arr.map(function(element) {
      return element.NumberGo; 
    }))
    return result;
  }
  //get item by id in list document : lấy thông tin chi tiết vb đi theo id
  getListDocByID(id) {
    return this.http.get(`${this.restUrl}${this.urlDetailLeave}` + `'` + id + `'`);
  }
 
  // getHistoryStepItemComment(strFilter): Observable<any> {
  //   console.log(`${this.restUrl}${this.getHistoryStepAPI}`  + strFilter + `&$orderby=DateRequest desc`);
  //   console.log(this.http.get(`${this.restUrl}${this.getHistoryStepAPI}`  + strFilter + `&$orderby=DateRequest desc`));
    
  //   return this.http.get(`${this.restUrl}${this.getHistoryStepAPI}`  + strFilter + `&$orderby=DateRequest desc`);
  // }

  getAllUser() {
    return this.http.get(
      `${this.restUrl}` + `/_api/web/lists/getbytitle('ListMapEmployee')/items?$select=*,User/Name,User/Title,User/Id&$expand=User`
    );
  }
}
