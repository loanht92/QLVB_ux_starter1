import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SPAPICommonService {
  private restUrl = environment.proxyUrl;
  private currentUserAPI = "/_api/web/currentUser";
  currentUserId: number;
  constructor(private http: HttpClient) { 
    if (environment.production) {
      this.restUrl = window.location.origin + environment.siteDBUrl;
    }
  }

  getCurrentUser(){
    return this.http.get(`${this.restUrl}${this.currentUserAPI}`);
  }

  async getCurrentUserInService(){
    //this.http.get(`${this.restUrl}${this.currentUserAPI}`)

    this.getCurrentUser().subscribe(
      itemValue => {
        console.log(itemValue);
        this.currentUserId = itemValue["Id"];
      },
      error => console.log("error: " + error),
      () => {
        console.log("1.Current user Id is: " + this.currentUserId);
      }
    );

    // this.getCurrentUser().subscribe(
    //   itemValue => {
    //     this.currentUserMail = itemValue["Email"];
    //     this.currentUserId = itemValue["Id"];
    //     this.currentUserName = itemValue["Title"];
    //   },
    //   error => console.log("error: " + error),
    //   () => {
    //     console.log("Current user email is: " + this.currentUserMail + "\n" + "Current user Id is: " + this.currentUserId + "\n" + "Current user name is: " + this.currentUserName);
    //   }
    // );
  }

  async getCurrentUserInPromise(){
    //this.asyncResult = await this.httpClient.get<Employee>(this.url).toPromise();
    let asyncResult = await this.getCurrentUser().toPromise();
    console.log("1. my result is");
    console.log(asyncResult);
  }

}
