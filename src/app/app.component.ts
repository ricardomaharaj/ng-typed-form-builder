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

/* Type Helpers */

/**
 * turns `Record<string, V>` into `Record<string, FormControl<V | null>>`
 */
type MakeFormGroup<T extends Record<string, unknown>> = {
  [K in keyof T]: FormControl<T[K] | null>
}

/**
 * wrapper around common `FormArray<FormGroup>` typings
 */
type MakeFormGroupFormArray<T extends Record<string, unknown>> = FormArray<
  FormGroup<MakeFormGroup<T>>
>

// helper types to not over-type the `GroupInitArray` and individual array index types
type StateOrValue<T> = (T | null) | FormControlState<T | null>
type ValidatorsOrOpts = FormControlOptions | ValidatorFn | ValidatorFn[]
type AsyncValidators = AsyncValidatorFn | AsyncValidatorFn[]

/**
 * allowed initial arrays when making a new form group using `FormBuilder`
 * */
type GroupInitArray<T = unknown> =
  | [StateOrValue<T>]
  | [StateOrValue<T>, ValidatorsOrOpts]
  | [StateOrValue<T>, ValidatorsOrOpts, AsyncValidators]

/** turns `Record<string, V>` into `Record<string, GroupInitArray<V>>` */
type MakeFormControls<T extends Record<string, V>, V = unknown> = {
  [K in keyof T]: GroupInitArray<T[K]>
}

/**
 * turns `T[]` into `FormArray<FormControl<T | null>>`
 *
 * only used with `FormArray<FormControl>`
 *
 * not to be used with `FormArray<FormGroup>`
 */
type MakeFormArray<T extends Array<V>, V = unknown> = FormArray<FormControl<T[number] | null>>

/**
 * return type of `createTypedForm`, needed to ensure that arrays are made into `FormArray<FormControl<T | null>>`
 */
type FormShape<T extends Record<string, V>, V = unknown> = {
  [K in keyof T]: T[K] extends Array<V> ? MakeFormArray<T[K]> : T[K]
}

/* End Type Helpers */

type SomeObj = {
  name: string
}

type Form = {
  str: string
  strArr: string[]
  objArr: MakeFormGroupFormArray<SomeObj>
}

@Component({
  standalone: true,
  selector: "app-root",
  templateUrl: "./app.component.html",
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
})
export class AppComponent {
  readonly standardForm = new FormGroup({
    str: new FormControl<string | null>(null),
    strArr: new FormArray<FormControl<string | null>>([]),
    objArr: new FormArray<FormGroup<MakeFormGroup<SomeObj>>>([]),
  })

  readonly typedForm = this._formBuilder.group(
    createTypedForm<Form>({
      /* all arrays below have type-hints & auto-complete! */
      str: [null],
      strArr: [[]],
      objArr: [new FormArray<FormGroup>([])],
      //       ^ would be nice to have this handled automatically by `createTypedForm`
      //         but I've found it unfeasible to do so since plain arrays are already handled by it
    })
  )

  constructor(private readonly _formBuilder: FormBuilder) {
    /* testing that hovering type-hints match normal `FormGroup` type-hints */

    this.standardForm.value.str
    this.standardForm.controls.str

    this.typedForm.value.str
    this.typedForm.controls.str

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
    this.typedForm.controls.strArr.push(new FormControl())
  }

  addObjArrControl() {
    this.typedForm.controls.objArr.push(new FormGroup({ name: new FormControl() }))
  }
}

function createTypedForm<T extends Record<string, V>, V = unknown>(
  controls: MakeFormControls<T>,
  nullable = true
) {
  const ctrlObj: Record<string, AbstractControl> = {}

  Object.entries(controls).forEach((entry) => {
    const [key, val] = entry as [string, GroupInitArray<V>]

    const stateOrValue = val.at(0) as StateOrValue<V>
    const validatorsOrOpts = val.at(1) as ValidatorsOrOpts | undefined
    const asyncValidators = val.at(2) as AsyncValidators | undefined

    if (typeof validatorsOrOpts === "object" && !Array.isArray(validatorsOrOpts) && !nullable) {
      validatorsOrOpts.nonNullable = true
    }

    let ctrl: AbstractControl

    if (stateOrValue instanceof FormArray) {
      // for `FormArray<FormGroup>`, already a `FormArray` so just assign it
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
