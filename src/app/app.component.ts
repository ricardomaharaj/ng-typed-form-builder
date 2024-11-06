import { CommonModule } from "@angular/common"
import { Component } from "@angular/core"
import {
  AbstractControl,
  AsyncValidatorFn,
  FormArray,
  FormBuilder,
  FormControl,
  FormControlOptions,
  FormControlState,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidatorFn,
} from "@angular/forms"

type Item = {
  name: string
}

type ItemFormGroup = MakeFormGroup<Item>

type Form = {
  str: string
  strArr: string[]
  objArr: FormArray<FormGroup<ItemFormGroup>>
}

@Component({
  standalone: true,
  selector: "app-root",
  templateUrl: "./app.component.html",
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
})
export class AppComponent {
  standardForm = new FormGroup({
    str: new FormControl<string | null>(null),
    strArr: new FormArray<FormControl<string | null>>([]),
    objArr: new FormArray<FormGroup<ItemFormGroup>>([]),
  })

  typedForm = this._formBuilder.group(
    createTypedForm<Form>({
      str: [null],
      strArr: [[]],
      objArr: [new FormArray<FormGroup>([])],
      //      ^ arrays have type-hints & auto-complete!
    })
  )

  constructor(private readonly _formBuilder: FormBuilder) {
    /* testing that hovering type-hints match normal `FormGroup` type-hints */

    this.standardForm.value.strArr
    this.standardForm.controls.strArr

    this.typedForm.value.strArr
    this.typedForm.controls.strArr

    this.standardForm.value.objArr
    this.standardForm.controls.objArr

    this.typedForm.value.objArr
    this.typedForm.controls.objArr
  }

  addStrArrControl() {
    this.typedForm.controls.strArr.push(new FormControl(null))
  }

  addObjArrControl() {
    this.typedForm.controls.objArr.push(
      new FormGroup({
        name: new FormControl(),
      })
    )
  }
}

/**
 * turns `Record<string, V>` into `Record<string, FormControl<V | null>>`
 */
export type MakeFormGroup<T extends Record<string, V>, V = unknown> = {
  [K in keyof T]: FormControl<T[K] | null>
}

/** allowed initial arrays when making a new form group using `FormBuilder` */
type FormBuilderGroupInitArray<T = unknown> =
  | [(T | null) | FormControlState<T | null>]
  | [(T | null) | FormControlState<T | null>, FormControlOptions | ValidatorFn | ValidatorFn[]]
  // prettier-ignore
  | [(T | null) | FormControlState<T | null>, FormControlOptions | ValidatorFn | ValidatorFn[], AsyncValidatorFn | AsyncValidatorFn[]]

/** turns `Record<string, V>` into `Record<string, FormBuilderGroupInitArray<V>>` */
type MakeFormControls<T extends Record<string, V>, V = unknown> = {
  [K in keyof T]: FormBuilderGroupInitArray<T[K]>
}

/**
 * turns `T[]` into `FormArray<FormControl<T | null>>`
 *
 * only used with `FormArray<FormControl>`
 *
 * not to be used with `FormArray<FormGroup>`
 * */
type MakeFormArray<T extends Array<V>, V = unknown> = FormArray<FormControl<T[number] | null>>

/** return type of `createTypedForm`, needed to ensure that arrays are made into `FormArray<FormControl<T | null>>` */
type FormShape<T extends Record<string, V>, V = unknown> = {
  [K in keyof T]: T[K] extends Array<V> ? MakeFormArray<T[K]> : T[K]
}

function createTypedForm<T extends Record<string, V>, V = unknown>(
  controls: MakeFormControls<T>,
  nullable = true
) {
  const ctrlObj: Record<string, AbstractControl> = {}

  Object.entries(controls).forEach((entry) => {
    const [key, val] = entry as [string, FormBuilderGroupInitArray<V>]

    const stateOrValue = val.at(0) as FormBuilderGroupInitArray<V>[0]
    const validatorsOrOpts = val.at(1) as FormBuilderGroupInitArray<V>[1]
    const asyncValidators = val.at(2) as FormBuilderGroupInitArray<V>[2]

    if (typeof validatorsOrOpts === "object" && !Array.isArray(validatorsOrOpts) && !nullable) {
      validatorsOrOpts.nonNullable = true

      if (asyncValidators) {
        // might be redundant since the `FormControl | FormArray` will likely print the same warning
        console.warn("@deprecated, asyncValidators have no effect when an options object is used")
      }
    }

    let ctrl: AbstractControl

    if (stateOrValue instanceof FormArray) {
      // for `FormArray<FormGroup>`, is already a `FormArray` so just assign it
      ctrl = stateOrValue
    } else if (Array.isArray(stateOrValue)) {
      ctrl = new FormArray(stateOrValue, validatorsOrOpts, asyncValidators)
    } else {
      ctrl = new FormControl(stateOrValue, validatorsOrOpts, asyncValidators)
    }

    ctrlObj[key] = ctrl
  })

  return ctrlObj as FormShape<T>
}
