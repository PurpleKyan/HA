import { Component, Input } from '@angular/core';

export type AppIconName =
  | 'dashboard'
  | 'verified'
  | 'users'
  | 'booking'
  | 'clock'
  | 'location'
  | 'distance'
  | 'timer'
  | 'elevation'
  | 'group'
  | 'money'
  | 'map'
  | 'safety'
  | 'leaf'
  | 'recommend'
  | 'picture'
  | 'success'
  | 'warning'
  | 'edit'
  | 'delete'
  | 'hiking'
  | 'star';

@Component({
  selector: 'app-icon',
  standalone: true,
  template: `<img class="app-icon" [src]="name === 'safety' ? '/icon-safety.svg' : '/icon-' + name + '.png'" alt="" />`,
})
export class AppIconComponent {
  @Input({ required: true }) name!: AppIconName;
}
