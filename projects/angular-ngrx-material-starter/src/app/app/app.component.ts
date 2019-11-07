import browser from 'browser-detect';
import { Component, OnInit } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { environment as env } from '../../environments/environment';
import { Observable, of as observableOf } from 'rxjs';
import {SharedService} from './../shared/shared-service/shared.service';

import {
  authLogin,
  authLogout,
  routeAnimations,
  AppState,
  LocalStorageService,
  selectIsAuthenticated,
  selectSettingsStickyHeader,
  selectSettingsLanguage,
  selectEffectiveTheme
} from '../core/core.module';
import {
  actionSettingsChangeAnimationsPageDisabled,
  actionSettingsChangeLanguage
} from '../core/settings/settings.actions';

@Component({
  selector: 'anms-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [routeAnimations]
})
export class AppComponent implements OnInit {
  isProd = env.production;
  envName = env.envName;
  version = env.versions.app;
  year = new Date().getFullYear();
  logo = require('../../assets/logo.png');
  languages = ['en', 'de', 'sk', 'fr', 'es', 'pt-br', 'zh-cn', 'he'];
  navigation = [
    { link: 'settings', label: 'Hồ sơ' },
    { link: 'about', label: 'Danh mục' },
    { link: 'feature-list', label: 'Truyền thông nội bộ' }
  ];
  navigationSideMenu = [
    ...this.navigation,
    { link: 'settings', label: 'anms.menu.settings' }
  ];
  isPermision;

  public isVanThu$: Observable<boolean>;
  public isNhanVien$: Observable<boolean>;
  isAuthenticated$: Observable<boolean>;
  stickyHeader$: Observable<boolean>;
  language$: Observable<string>;
  theme$: Observable<string>;
  currentUser;

  constructor(
    private store: Store<AppState>,
    private storageService: LocalStorageService,
    private shareService: SharedService
  ) {}

  private static isIEorEdgeOrSafari() {
    return ['ie', 'edge', 'safari'].includes(browser().name);
  }

  ngOnInit(): void {
    this.storageService.testLocalStorage();
    this.checkPermission();
    if (AppComponent.isIEorEdgeOrSafari()) {
      this.store.dispatch(
        actionSettingsChangeAnimationsPageDisabled({
          pageAnimationsDisabled: true
        })
      );
    }

    this.isAuthenticated$ = this.store.pipe(select(selectIsAuthenticated));
    this.stickyHeader$ = this.store.pipe(select(selectSettingsStickyHeader));
    this.language$ = this.store.pipe(select(selectSettingsLanguage));
    this.theme$ = this.store.pipe(select(selectEffectiveTheme));
  }

  onLoginClick() {
    this.store.dispatch(authLogin());
  }

  onLogoutClick() {
    this.store.dispatch(authLogout());
  }

  onLanguageSelect({ value: language }) {
    this.store.dispatch(actionSettingsChangeLanguage({ language }));
  }

  async checkPermission() {
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
                  if(itemUserMember.length > 0) {
                    this.isPermision = true;
                  } else {
                    this.isPermision = undefined;
                  }
                  itemUserMember.forEach(element => {
                      if(element.RoleCode === "VT") {
                          this.isVanThu$ = observableOf(true);
                      } else if(element.RoleCode === "NV") {
                        this.isNhanVien$ = observableOf(true);
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
