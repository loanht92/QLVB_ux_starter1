import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

import {
  ROUTE_ANIMATIONS_ELEMENTS,
  NotificationService,
  SPAPICommonService
} from '../../../../core/core.module';

@Component({
  selector: 'anms-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationsComponent implements OnInit {
  routeAnimationsElements = ROUTE_ANIMATIONS_ELEMENTS;

  constructor(private readonly notificationService: NotificationService, private readonly spAPICommonService: SPAPICommonService) {

  }

  ngOnInit() {}

  default() {
    this.spAPICommonService.getCurrentUserInService();
    console.log('2. not waiting for 1');
    this.notificationService.default('Default message');
  }

  async info() {
    await this.spAPICommonService.getCurrentUserInPromise();
    console.log('2. waiting for 1 done...');
    this.notificationService.info('Info message');
  }

  success() {
    this.notificationService.success('Success message');
  }

  warn() {
    this.notificationService.warn('Warning message');
  }

  error() {
    this.notificationService.error('Error message');
  }
}
