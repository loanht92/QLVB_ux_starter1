import { Store, select } from '@ngrx/store';
import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewRef} from '@angular/core';
import { Observable, of as observableOf } from 'rxjs';
import { SharedService } from '../../../../shared/shared-service/shared.service';
import { State } from '../../examples.state';
import { AppComponent } from '../../../../app/app.component';
import {
  routeAnimations,
  selectIsAuthenticated
} from '../../../../core/core.module';

@Component({
  selector: 'anms-document',
  templateUrl: './document.component.html',
  styleUrls: ['./document.component.scss'],
  animations: [routeAnimations],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentComponent implements OnInit {
  public isAuthenticated$: boolean = false;
  currentUser;

  documents = [
    // { link: 'documentgo/0', label: 'Văn bản trình', display: true },
    { link: 'documentgo-waiting-process/1', label: 'P.Chờ xử lý' },
    { link: 'documentgo-processing/2', label: 'VB.Đang xử lý' },
    { link: 'documentgo-processed/3', label: 'VB.Đã hoàn thành' },
    { link: 'docGo-retrieve', label: 'P.Thu hồi' },
    { link: 'documentgo-waiting-comment/4', label: 'P.Chờ xin ý kiến' },
    { link: 'documentgo-comment/5', label: 'P.Đã cho ý kiến' },
    { link: 'reportDocGo', label: 'Báo cáo, thống kê VB' },
    { link: 'reportAdvanceDocGo', label: 'Tra cứu văn bản' }
  ];
  constructor(
    private store: Store<State>,
    private shareService: SharedService,
    private app: AppComponent,
    private ref: ChangeDetectorRef,
  ) {
  }

  ngOnInit(): void {
    this.getUserSharepoint();
    this.isAuthenticated$ = false;
  }

  getUserSharepoint() {
    this.shareService.getCurrentUser().subscribe(
      itemValue => {
        this.currentUser = {
          userId: itemValue['Id'],
          userName: itemValue['Title'],
          userEmail: itemValue['Email'],
          userLogin: itemValue['LoginName'],
          isSiteAdmin: itemValue['IsSiteAdmin']
        };
      },
      error => console.log('error: ' + error),
      () => {
        console.log('Load user infor: ' + this.currentUser);
        this.shareService.getRoleCurrentUser(this.currentUser.userId).subscribe(
          itemValue => {
            let itemUserMember = itemValue['value'] as Array<any>;
            itemUserMember.forEach(element => {
              if (element.RoleCode === 'NV' || element.RoleCode === 'TP') {
                this.isAuthenticated$ = true;
                if (!(this.ref as ViewRef).destroyed) {
                  this.ref.detectChanges();  
                } 
              }
            });
          },
          error => console.log('Get role user error: ' + error),
          () => {
            console.log('Get role user success');
          }
        );
      }
    );
  }
}
