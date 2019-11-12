import { Store, select } from '@ngrx/store';
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Observable, of as observableOf } from 'rxjs';
import {SharedService} from '../../../../../shared/shared-service/shared.service';
import { State } from '../../../examples.state';
import {AppComponent} from '../../../../../app/app.component';
import { PlatformLocation } from '@angular/common';
import { filter, pairwise } from 'rxjs/operators';
import { ActivatedRoute, Router, RoutesRecognized } from '@angular/router';
import {
  routeAnimations,
  selectIsAuthenticated
} from '../../../../../core/core.module';

@Component({
  selector: 'anms-document',
  templateUrl: './incoming-document.component.html',
  styleUrls: ['./incoming-document.component.scss'],
  animations: [routeAnimations],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IncomingDocumentComponent implements OnInit {
  isAuthenticated$: Observable<boolean>;
  currentUser;

  examples = [
    { link: 'documentto', label: 'Tiếp nhận văn bản', display: true },
    { link: 'docTo-list/1', label: 'Chờ xử lý' },
    { link: 'docTo-list-approving/2', label: 'Đang xử lý' },
    { link: 'docTo-list-approved/3', label: 'Đã xử lý' },
    { link: 'docTo-retrieve', label: 'Thu hồi' },
    { link: 'docTo-list-waiting-comment/4', label: 'Chờ xin ý kiến' },
    { link: 'docTo-list-response-comment/5', label: 'Đã cho ý kiến' },
    { link: 'reportDocTo', label: 'Báo cáo, thống kế' },
    { link: 'reportAdvanceDocTo', label: 'Tra cứu văn bản'},
  ];

  constructor(private store: Store<State>, private shareService: SharedService, private app: AppComponent,
    private location: PlatformLocation, private routes: Router) 
    {
      location.onPopState(() => {
        //alert(window.location);
        //window.location.reload();
        this.routes.events
      .pipe(filter((e: any) => e instanceof RoutesRecognized),
          pairwise()
      ).subscribe((e: any) => {
          let url = e[0].urlAfterRedirects;
          console.log(url);
          this.ngOnInit();
      });
    });
    this.isAuthenticated$ = app.isVanThu$;
  }

  ngOnInit(): void {
    this.getUserSharepoint();
  }

  async getUserSharepoint() {
    this.shareService.getCurrentUser().subscribe(
      itemValue => {
          this.currentUser = {
              userId: itemValue["Id"],
              userName: itemValue["Title"],
              userEmail: itemValue["Email"],
              userLogin: itemValue["LoginName"],
              isSiteAdmin: itemValue["IsSiteAdmin"],
          }
      },
      error => console.log("error: " + error),
      () => {
          console.log("Load user infor: " + this.currentUser);
          this.shareService.getRoleCurrentUser(this.currentUser.userId).subscribe(
              itemValue => {
                  let itemUserMember = itemValue['value'] as Array<any>;
                  itemUserMember.forEach(element => {
                      if(element.RoleCode === "NV") {
                        this.isAuthenticated$ = observableOf(true);
                      }
                  })
              },
              error => console.log("Get role user error: " + error),
              () => {
                  console.log("Get role user success");           
              })
      });
  }
}

