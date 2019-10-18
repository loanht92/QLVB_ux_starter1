import { Store, select } from '@ngrx/store';
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Observable, of as observableOf  } from 'rxjs';
import {SharedService} from '../../../../shared/shared-service/shared.service'
import { State } from '../../examples.state';

@Component({
  selector: 'anms-document',
  templateUrl: './document.component.html',
  styleUrls: ['./document.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentComponent implements OnInit {
  isAuthenticated$: Observable<boolean>;
  currentUser;

  documents = [
    { link: 'documentgo', label: 'Văn bản trình', display: true },
    { link: 'documentgo-waiting-process/1', label: 'Chờ xử lý' },
    { link: 'documentgo-process/2', label: 'Đã xử lý' },
    { link: 'documentgo-waiting-comment/3', label: 'Chờ xin ý kiến' },
    { link: 'documentgo-comment/4', label: 'Đã cho ý kiến' },
    { link: 'reportDocGo', label: 'Báo cáo, thống kê'},
    { link: 'reportAdvanceDocGo', label: 'Tra cứu văn bản'}
  ];
  constructor(private store: Store<State>, private shareService: SharedService) {}

  ngOnInit(): void {
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

