///
/// Copyright © 2016-2023 The Thingsboard Authors
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///     http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///

import { ChangeDetectorRef, Component, forwardRef, Input, OnInit, Renderer2, ViewContainerRef } from '@angular/core';
import { PageComponent } from '@shared/components/page.component';
import { Store } from '@ngrx/store';
import { AppState } from '@core/core.state';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { DialogService } from '@core/services/dialog.service';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { TranslateService } from '@ngx-translate/core';
import { coerceBoolean } from '@shared/decorators/coercion';
import { TbPopoverService } from '@shared/components/popover.service';
import { MaterialIconsComponent } from '@shared/components/material-icons.component';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'tb-material-icon-select',
  templateUrl: './material-icon-select.component.html',
  styleUrls: ['./material-icon-select.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MaterialIconSelectComponent),
      multi: true
    }
  ]
})
export class MaterialIconSelectComponent extends PageComponent implements OnInit, ControlValueAccessor {

  @Input()
  @coerceBoolean()
  asBoxInput = false;

  @Input()
  label = this.translate.instant('icon.icon');

  @Input()
  color: string;

  @Input()
  disabled: boolean;

  private iconClearButtonValue: boolean;
  get iconClearButton(): boolean {
    return this.iconClearButtonValue;
  }
  @Input()
  set iconClearButton(value: boolean) {
    const newVal = coerceBooleanProperty(value);
    if (this.iconClearButtonValue !== newVal) {
      this.iconClearButtonValue = newVal;
    }
  }

  private requiredValue: boolean;
  get required(): boolean {
    return this.requiredValue;
  }
  @Input()
  set required(value: boolean) {
    this.requiredValue = coerceBooleanProperty(value);
  }

  private modelValue: string;

  private propagateChange = null;

  public materialIconFormGroup: UntypedFormGroup;

  constructor(protected store: Store<AppState>,
              private dialogs: DialogService,
              private translate: TranslateService,
              private popoverService: TbPopoverService,
              private renderer: Renderer2,
              private viewContainerRef: ViewContainerRef,
              private fb: UntypedFormBuilder,
              private cd: ChangeDetectorRef) {
    super(store);
  }

  ngOnInit(): void {
    this.materialIconFormGroup = this.fb.group({
      icon: [null, []]
    });

    this.materialIconFormGroup.valueChanges.subscribe(() => {
      this.updateModel();
    });
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (isDisabled) {
      this.materialIconFormGroup.disable({emitEvent: false});
    } else {
      this.materialIconFormGroup.enable({emitEvent: false});
    }
  }

  writeValue(value: string): void {
    this.modelValue = value;
    this.materialIconFormGroup.patchValue(
      { icon: this.modelValue }, {emitEvent: false}
    );
  }

  private updateModel() {
    const icon: string = this.materialIconFormGroup.get('icon').value;
    if (this.modelValue !== icon) {
      this.modelValue = icon;
      this.propagateChange(this.modelValue);
    }
  }

  openIconDialog() {
    if (!this.disabled) {
      this.dialogs.materialIconPicker(this.materialIconFormGroup.get('icon').value).subscribe(
        (icon) => {
          if (icon) {
            this.materialIconFormGroup.patchValue(
              {icon}, {emitEvent: true}
            );
            this.cd.markForCheck();
          }
        }
      );
    }
  }

  openIconPopup($event: Event, matButton: MatButton) {
    if ($event) {
      $event.stopPropagation();
    }
    const trigger = matButton._elementRef.nativeElement;
    if (this.popoverService.hasPopover(trigger)) {
      this.popoverService.hidePopover(trigger);
    } else {
      const materialIconsPopover = this.popoverService.displayPopover(trigger, this.renderer,
        this.viewContainerRef, MaterialIconsComponent, 'left', true, null,
        {
          selectedIcon: this.materialIconFormGroup.get('icon').value
        },
        {},
        {}, {}, true);
      materialIconsPopover.tbComponentRef.instance.popover = materialIconsPopover;
      materialIconsPopover.tbComponentRef.instance.iconSelected.subscribe((icon) => {
        materialIconsPopover.hide();
        this.materialIconFormGroup.patchValue(
          {icon}, {emitEvent: true}
        );
        this.cd.markForCheck();
      });
    }
  }

  clear() {
    this.materialIconFormGroup.get('icon').patchValue(null, {emitEvent: true});
    this.cd.markForCheck();
  }
}
