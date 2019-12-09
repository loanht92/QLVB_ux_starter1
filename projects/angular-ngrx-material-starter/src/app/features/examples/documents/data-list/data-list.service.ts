import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})

export class DataListService {
  private restUrl = environment.proxyUrl;

  constructor(private http: HttpClient) { 
    http.options(this.restUrl,
      {
        headers: {
          "accept": 'application/json;odata=verbose',
        }
      })
  }

  httpOptions = {
    headers: new HttpHeaders({
      accept: 'application/json;odata=verbose',
      dataType: 'json',
      'Content-Type': 'application/json;odata=verbose',
      "x-requestdigest": window['__frmSPDigest']
    })
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

  getAllItemList(listName, strFilter) {
    return this.http.get(
      `${this.restUrl}/_api/web/lists/getbytitle('` + listName + `')/items` + strFilter
    );
  }
}
