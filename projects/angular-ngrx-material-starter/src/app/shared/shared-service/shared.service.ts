import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { mergeMap } from 'rxjs/operators';
export interface FormDigestResponse {
  'odata.metadata': string;
  FormDigestTimeoutSeconds: number;
  FormDigestValue: string;
  LibraryVersion: string;
  SiteFullUrl: string;
  SupportedSchemaVersions: string[];
  WebFullUrl: string;
}
@Injectable({
  providedIn: 'root'
})
export class SharedService {
  opInsert = {
    headers: new HttpHeaders({
      'accept': 'application/json;odata=verbose',
      'dataType': 'json',
      'Content-Type': 'application/json;odata=verbose',
      "x-requestdigest": window['__frmSPDigest']
    })
  }
  opInsertFile = {
    headers: new HttpHeaders({
      'accept': 'application/json;odata=verbose',
      'Content-Type': 'application/json;odata=verbose',
      "x-requestdigest": window['__frmSPDigest']
    })
  }
  opUpdate = {
    headers: new HttpHeaders({
      'accept': 'application/json;odata=verbose',
      'dataType': 'json',
      'Content-Type': 'application/json;odata=verbose',
      "x-requestdigest": window['__frmSPDigest'],
      "X-HTTP-Method": "MERGE",
      "IF-MATCH": "*",
    })
  }
  opDelete ={
    headers: new HttpHeaders({
      'accept': 'application/json;odata=verbose',
      'dataType': 'json',
      'Content-Type': 'application/json;odata=verbose',
      "x-requestdigest": window['__frmSPDigest'],
      "X-HTTP-Method": "DELETE",
      "IF-MATCH": "*",
    })
  }
  private restUrl = environment.proxyUrl;
  private urlAPI = `/_api/web/lists/getbytitle('`;
  constructor(private http: HttpClient) {
    this.opInsert = {
      headers: new HttpHeaders({
        'accept': 'application/json;odata=verbose',
        'dataType': 'json',
        'Content-Type': 'application/json;odata=verbose',
        "x-requestdigest": window['__frmSPDigest']
      })
    }
    this.opInsertFile = {
      headers: new HttpHeaders({
        'accept': 'application/json;odata=verbose',
        'Content-Type': 'application/json;odata=verbose',
        "x-requestdigest": window['__frmSPDigest']
      })
    }
    this.opUpdate = {
      headers: new HttpHeaders({
        'accept': 'application/json;odata=verbose',
        'dataType': 'json',
        'Content-Type': 'application/json;odata=verbose',
        "x-requestdigest": window['__frmSPDigest'],
        "X-HTTP-Method": "MERGE",
        "IF-MATCH": "*",
      })
    }
    this.opDelete ={
      headers: new HttpHeaders({
        'accept': 'application/json;odata=verbose',
        'dataType': 'json',
        'Content-Type': 'application/json;odata=verbose',
        "x-requestdigest": window['__frmSPDigest'],
        "X-HTTP-Method": "DELETE",
        "IF-MATCH": "*",
      })
    }
   }

   
  getCurrentUser() {
    return this.http.get(`${this.restUrl}/_api/web/currentUser`);
  }

  getRoleCurrentUser(id) {
    return this.http.get(`${this.restUrl}/_api/web/lists/getbytitle('ListMapEmployee')/items?$select=*,User/Name,User/Title,User/Id&$expand=User&$filter=User/Id eq '` + id + `'`);
  }

  getUserInfo(loginName) {
    // loginName = 'i:0%23.f|membership|tuyen.nguyen@tsg.net.vn';
    return this.http.get(`${this.restUrl}/_api/SP.UserProfiles.PeopleManager/GetPropertiesFor(accountName=@v)?@v=` + `'` + loginName + `'`);
  }

  getUserInfoSite(loginName){
    return this.http.get(`${this.restUrl}/_api/web/siteusers(@v)?@v=` + `'` + loginName + `'`);
  }

  getItemList(listName, select) {
    return this.http.get(`${this.restUrl}${this.urlAPI}` + listName + `')/items` + select);
  }

  insertItemList(listName, data) {
    return this.http.post(`${this.restUrl}${this.urlAPI}` + listName + `')/items`, data, this.opInsert);
  }

  updateItemList(listName, id, data) {
    return this.http.post(`${this.restUrl}${this.urlAPI}` + listName + `')/items(` + id + `)`, data, this.opUpdate);
  }

  inserAttachmentFile(data, filename, listName, indexItem) {
    return this.http.post(`${this.restUrl}${this.urlAPI}` + listName + `')/items(` + indexItem + `)/AttachmentFiles/add(FileName='` + filename + `')`, data, this.opInsertFile);
  }
  updateListById(listName, data, id) {
    return this.http.post(`${this.restUrl}/_api/contextinfo`, '').pipe(
      mergeMap((xRequest: FormDigestResponse) => {
        const digest = xRequest.FormDigestValue;
        const headers = new HttpHeaders({
          accept: 'application/json;odata=verbose',
          'X-RequestDigest': digest
        });

        this.opUpdate = {
          headers: new HttpHeaders({
            'accept': 'application/json;odata=verbose',
            'dataType': 'json',
            'Content-Type': 'application/json;odata=verbose',
            "x-requestdigest": digest,
            "X-HTTP-Method": "MERGE",
            "IF-MATCH": "*",
          })
        }
        return this.http.post(`${this.restUrl}/_api/web/lists/getbytitle('` + listName + `')/items` + `(` + id + `)`, data, this.opUpdate);
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

        this.opDelete = {
          headers: new HttpHeaders({
            'accept': 'application/json;odata=verbose',
            'dataType': 'json',
            'Content-Type': 'application/json;odata=verbose',
            "x-requestdigest": digest,
            "X-HTTP-Method": "DELETE",
            "IF-MATCH": "*",
          })
        }
        return this.http.post(`${this.restUrl}/_api/web/lists/getbytitle('` + listName + `')/items` + `(` + id + `)`, data, this.opDelete);
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

        this.opDelete = {
          headers: new HttpHeaders({
            'accept': 'application/json;odata=verbose',
            'dataType': 'json',
            'Content-Type': 'application/json;odata=verbose',
            "x-requestdigest": digest,
            "X-HTTP-Method": "DELETE",
            "IF-MATCH": "*",
          })
        }
        return this.http.post(`${this.restUrl}/_api/web/lists/getbytitle('` + listName + `')/items` + `(` + id + `)/AttachmentFiles/getByFileName('` + fileName + `')`, data, this.opDelete);
      })
    );
  }

}