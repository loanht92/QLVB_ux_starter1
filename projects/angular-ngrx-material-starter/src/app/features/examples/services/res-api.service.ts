import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PeoplePickerQuery, FormDigestResponse } from './people-picker'
import { mergeMap } from 'rxjs/operators';
const PEOPLE_PICKER_URL =
  '/_api/SP.UI.ApplicationPages.ClientPeoplePickerWebServiceInterface.ClientPeoplePickerSearchUser';

@Injectable({
  providedIn: 'root'
})
export class ResApiService {
  private restUrl = environment.proxyUrl;
  private restAPI = 'https://tsgvietnam.sharepoint.com/sites/dev/Ha_Document';
  private currentUserAPI = "/_api/web/currentUser";
  private urlUserInfo = "/_api/SP.UserProfiles.PeopleManager/GetPropertiesFor(accountName=@v)?@v=";

  constructor(private http: HttpClient) {
    if (environment.production) {
      this.restUrl = window.location.origin + environment.siteDBUrl;
    }
    if (environment.production) {
      http.options(this.restUrl,
        {
          headers: {
            "accept": 'application/json;odata=verbose',
          }
        });
    }
  }
  httpOptions = {
    headers: new HttpHeaders({
      'accept': 'application/json;odata=verbose',
      'dataType': 'json',
      'Content-Type': 'application/json;odata=verbose',
      "x-requestdigest": window['__frmSPDigest']
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
  httpOptionsDelete = {
    headers: new HttpHeaders({
      'accept': 'application/json;odata=verbose',
      'dataType': 'json',
      'Content-Type': 'application/json;odata=verbose',
      "x-requestdigest": window['__frmSPDigest'],
      "X-HTTP-Method": "DELETE",
      "IF-MATCH": "*",
    })
  }
  
  getCurrentUser(){
    return this. http.get(`${this.restUrl}${this.currentUserAPI}`);
  }
  getUserInfo(loginName){
    // loginName = 'i:0%23.f|membership|tuyen.nguyen@tsg.net.vn';
    return this.http.get(`${this.restUrl}${this.urlUserInfo}` + `'` + loginName + `'`);
  }
  getFieldInList(listName) : Observable<any> {
    return this.http.get(`${this.restUrl}/_api/web/lists/getbytitle('` + listName + `')/fields$filter=Hidden eq false and ReadOnlyField eq false`);
  }
  getList(listName) : Observable<any> {
    return this.http.get(`${this.restUrl}/_api/web/lists/getbytitle('` + listName + `')/items`);
  }
  getItem(listName, select) {
    return this.http.get(`${this.restUrl}/_api/web/lists/getbytitle('` + listName + `')/items` + select);
  }
  getListDepartment() : Observable<any> {
    return this.http.get(`${this.restUrl}/_api/web/lists/getbytitle('ListDepartment')/items`);
  }
  getListUrgent() : Observable<any> {
    return this.http.get(`${this.restUrl}/_api/web/lists/getbytitle('ListUrgent')/items`);
  }
  getListSecret() : Observable<any> {
    return this.http.get(`${this.restUrl}/_api/web/lists/getbytitle('ListSecret')/items`);
  }
  getListBookType() : Observable<any> {
    return this.http.get(`${this.restUrl}/_api/web/lists/getbytitle('ListBookType')/items`);
  }
  getListDocType() : Observable<any> {
    return this.http.get(`${this.restUrl}/_api/web/lists/getbytitle('ListDocType')/items`);
  }
  getListRole() : Observable<any> {
    return this.http.get(`${this.restUrl}/_api/web/lists/getbytitle('ListRole')/items`);
  }
  getListStatus() : Observable<any> {
    return this.http.get(`${this.restUrl}/_api/web/lists/getbytitle('ListStatus')/items`);
  }
  getListStatusType() : Observable<any> {
    return this.http.get(`${this.restUrl}/_api/web/lists/getbytitle('ListStatusType')/items`);
  }
  getListMethodSend() : Observable<any> {
    return this.http.get(`${this.restUrl}/_api/web/lists/getbytitle('ListMethodSend')/items`);
  }
  getListSourceAddress() : Observable<any> {
    return this.http.get(`${this.restUrl}/_api/web/lists/getbytitle('ListSourceAddress')/items`);
  }
  getListTaskType() : Observable<any> {
    return this.http.get(`${this.restUrl}/_api/web/lists/getbytitle('ListTaskType')/items`);
  }
  getListMapEmployee() : Observable<any> {
    return this.http.get(`${this.restUrl}/_api/web/lists/getbytitle('ListMapEmployee')/items`);
  }
  getListTotalStep(code) : Observable<any> {
    return this.http.get(`${this.restUrl}/_api/web/lists/getbytitle('ListTotalStep')/items?$select=*&$filter=BookTypeCode eq '` + code + `'`);
  }

  AddItemToList(listName, data){
    return this.http.post(`${this.restUrl}/_api/contextinfo`, '').pipe(
      mergeMap((xRequest: FormDigestResponse) => {
        const digest = xRequest.FormDigestValue;
        const headers = new HttpHeaders({
          accept: 'application/json;odata=verbose',
          'X-RequestDigest': digest
        });

        this.httpOptions = {
          headers: new HttpHeaders({
            'accept': 'application/json;odata=verbose',
            'dataType': 'json',
            'Content-Type': 'application/json;odata=verbose',
            "x-requestdigest": digest
          })
        }
        return this.http.post(`${this.restUrl}/_api/web/lists/getbytitle('`+ listName +`')/items`, data, this.httpOptions);
      })
    )    
  }

  //attachment file
  inserAttachmentFile(data, filename, listName, indexItem) {
    return this.http.post(`${this.restUrl}/_api/contextinfo`, '').pipe(
      mergeMap((xRequest: FormDigestResponse) => {
        const digest = xRequest.FormDigestValue;
        const headers = new HttpHeaders({
          accept: 'application/json;odata=verbose',
          'X-RequestDigest': digest
        });

        this.httpOptionsFile = {
          headers: new HttpHeaders({
            'accept': 'application/json;odata=verbose',
            'Content-Type': 'application/json;odata=verbose',
            "x-requestdigest": digest
          })
        }
        return this.http.post(`${this.restUrl}/_api/web/lists/GetByTitle('`+ listName +`')/items(`+ indexItem +`)/AttachmentFiles/add(FileName='` + filename + `')`,data, this.httpOptionsFile);    
      })
    );
  }

  urlInforApproval =
  "/_api/web/lists/getbytitle('ListConfig')/items?$select=*&$filter=BookTypeCode eq ";
  getInforApprovalByStep(typeCode, step) {
    return this.http.get(`${this.restUrl}${this.urlInforApproval}` + `'` + typeCode + `' and IndexStep eq '` + step + `'`);
  }

  getDepartmnetOfUser(userId) {
    return this.http.get(`${this.restUrl}/_api/web/lists/getbytitle('ListMapEmployee')/items?$select=*,User/Id,User/Title,User/Name&$expand=User&$filter=User/Id eq '` + userId + `'`);
  }

  getUserByRole(role) {
    return this.http.get(`${this.restUrl}/_api/web/lists/getbytitle('ListMapEmployee')/items?$select=*,User/Id,User/Title,User/Name&$expand=User&$filter=RoleCode eq '` + role + `'`);
  }

  getUserByRole2(strFilter) {
    return this.http.get(`${this.restUrl}/_api/web/lists/getbytitle('ListMapEmployee')/items?$select=*,User/Id,User/Title,User/Name&$expand=User` + strFilter);
  }

  updateListById(listName, data, id) {
    return this.http.post(`${this.restUrl}/_api/contextinfo`, '').pipe(
      mergeMap((xRequest: FormDigestResponse) => {
        const digest = xRequest.FormDigestValue;
        const headers = new HttpHeaders({
          accept: 'application/json;odata=verbose',
          'X-RequestDigest': digest
        });

        this.httpOptionsUpdate = {
          headers: new HttpHeaders({
            'accept': 'application/json;odata=verbose',
            'dataType': 'json',
            'Content-Type': 'application/json;odata=verbose',
            "x-requestdigest": digest,
            "X-HTTP-Method": "MERGE",
            "IF-MATCH": "*",
          })
        }
        return this.http.post(`${this.restUrl}/_api/web/lists/getbytitle('` + listName + `')/items` + `(` + id + `)`, data, this.httpOptionsUpdate);
      })
    );
  }

  DeleteItemById(listName, data, id) {
    return this.http.post(`${this.restUrl}/_api/contextinfo`, '').pipe(
      mergeMap((xRequest: FormDigestResponse) => {
        const digest = xRequest.FormDigestValue;
        const headers = new HttpHeaders({
          accept: 'application/json;odata=verbose',
          'X-RequestDigest': digest
        });

        this.httpOptionsDelete = {
          headers: new HttpHeaders({
            'accept': 'application/json;odata=verbose',
            'dataType': 'json',
            'Content-Type': 'application/json;odata=verbose',
            "x-requestdigest": digest,
            "X-HTTP-Method": "DELETE",
            "IF-MATCH": "*",
          })
        }
        return this.http.post(`${this.restUrl}/_api/web/lists/getbytitle('` + listName + `')/items` + `(` + id + `)`, data, this.httpOptionsDelete);
      })
    );
  }
  
  DeleteAttachmentById(listName, data, id, fileName) {
    return this.http.post(`${this.restUrl}/_api/contextinfo`, '').pipe(
      mergeMap((xRequest: FormDigestResponse) => {
        const digest = xRequest.FormDigestValue;
        const headers = new HttpHeaders({
          accept: 'application/json;odata=verbose',
          'X-RequestDigest': digest
        });

        this.httpOptionsDelete = {
          headers: new HttpHeaders({
            'accept': 'application/json;odata=verbose',
            'dataType': 'json',
            'Content-Type': 'application/json;odata=verbose',
            "x-requestdigest": digest,
            "X-HTTP-Method": "DELETE",
            "IF-MATCH": "*",
          })
        }
        return this.http.post(`${this.restUrl}/_api/web/lists/getbytitle('` + listName + `')/items` + `(` + id + `)/AttachmentFiles/getByFileName('` + fileName + `')`, data, this.httpOptionsDelete);
      })
    );
  }

  getUserFormSite(loginName){
    return this.http.get(`${this.restUrl}/_api/web/siteusers(@v)?@v=` + `'` + loginName + `'`);
  }

  public getUserSuggestions(query: PeoplePickerQuery): Observable<any> {
    return this.http.post(`${this.restUrl}/_api/contextinfo`, '').pipe(
      mergeMap((xRequest: FormDigestResponse) => {
        const digest = xRequest.FormDigestValue;
        const headers = new HttpHeaders({
          accept: 'application/json;odata=verbose',
          'X-RequestDigest': digest
        });
        const httpOptionsSP = {
          headers: headers
        };
        return this.http.post(
          `${this.restUrl}${PEOPLE_PICKER_URL}`,
          query,
          httpOptionsSP
        );
      })
    );
  }
}
