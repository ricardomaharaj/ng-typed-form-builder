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

// types to avoid over-typing the `GroupInitArray` and individual array index types
type StateOrValue<T, NonNullable = false> = NonNullable extends true
  ? T | FormControlState<T>
  : (T | null) | FormControlState<T | null>
type ValidatorsOrOpts = FormControlOptions | ValidatorFn | ValidatorFn[]
type AsyncValidators = AsyncValidatorFn | AsyncValidatorFn[]

/**
 * allowed initial arrays when making a new form group using `FormBuilder`
 */
type FormGroupInitArray<T, NonNullable = false> =
  | [StateOrValue<T, NonNullable>]
  | [StateOrValue<T, NonNullable>, ValidatorsOrOpts]
  | [StateOrValue<T, NonNullable>, ValidatorsOrOpts, AsyncValidators]

type FormGroupControlsInit<T, NonNullable = false> = {
  [K in keyof T]: FormGroupInitArray<T[K], NonNullable>
}

type MakeFormGroup<T, NonNullable = false> = {
  [K in keyof T]: NonNullable extends true ? FormControl<T[K]> : FormControl<T[K] | null>
}

type FormShape<T> = {
  [K in keyof T]: T[K] extends FormArray ? T[K] : FormControl<T[K]>
}

/* End Type Helpers */

type SomeObj = {
  name: string
}

type Form = {
  str: string
  strArr: string[]
  strCtrlArr: FormArray<FormControl<string | null>>
  objGroupArr: FormArray<FormGroup<MakeFormGroup<SomeObj>>>
}

type NotNullForm<NonNullable = true> = {
  str: string
  strArr: string[]
  strCtrlArr: FormArray<FormControl<string>>
  objGroupArr: FormArray<FormGroup<MakeFormGroup<SomeObj, NonNullable>>>
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
    strArr: new FormControl<string[]>([]),
    strCtrlArr: new FormArray<FormControl<string | null>>([]),
    objGroupArr: new FormArray<FormGroup<MakeFormGroup<SomeObj>>>([]),
  })

  typedForm = this._formBuilder.group(
    createTypedForm<Form>({
      /* all arrays below have type-hints & auto-complete! */
      str: [null],
      strArr: [null],
      /* `FormArray` must be provided manually when needed */
      strCtrlArr: [new FormArray<FormControl>([])],
      objGroupArr: [new FormArray<FormGroup>([])],
    })
  )

  notNullTypedForm = this._formBuilder.group(
    createNonNullableTypedForm<NotNullForm>({
      /* values must be provided in `nonNullableTypedForm` */
      // str: [null], // <= will error
      str: [""],
      strArr: [[]],
      strCtrlArr: [new FormArray<FormControl>([])],
      objGroupArr: [new FormArray<FormGroup>([])],
    })
  )

  constructor(private _formBuilder: FormBuilder) {
    /* testing that hovering type-hints match normal `FormGroup` type-hints */

    this.standardForm.value.str
    this.standardForm.value.strArr
    this.standardForm.value.strCtrlArr
    this.standardForm.value.objGroupArr

    this.standardForm.controls.str
    this.standardForm.controls.strArr
    this.standardForm.controls.strCtrlArr
    this.standardForm.controls.objGroupArr

    this.typedForm.value.str
    this.typedForm.value.strArr
    this.typedForm.value.strCtrlArr
    this.typedForm.value.objGroupArr

    this.typedForm.controls.str
    this.typedForm.controls.strArr
    this.typedForm.controls.strCtrlArr
    this.typedForm.controls.objGroupArr

    this.notNullTypedForm.value.str
    this.notNullTypedForm.value.strArr
    this.notNullTypedForm.value.strCtrlArr
    this.notNullTypedForm.value.objGroupArr

    this.notNullTypedForm.controls.str
    this.notNullTypedForm.controls.strArr
    this.notNullTypedForm.controls.strCtrlArr
    this.notNullTypedForm.controls.objGroupArr
  }

  addStrCtrlArrControl() {
    this.typedForm.controls.strCtrlArr.push(new FormControl())
  }

  addObjArrGroup() {
    this.typedForm.controls.objGroupArr.push(new FormGroup({ name: new FormControl() }))
  }
}

function createTypedForm<T, V = unknown>(controls: FormGroupControlsInit<T>, nonNullable = false) {
  const ctrlObj: Record<string, AbstractControl> = {}

  Object.entries(controls).map((entry) => {
    const [key, val] = entry as [string, FormGroupInitArray<V>]

    const stateOrValue = val.at(0) as StateOrValue<V>
    const validatorsOrOpts = val.at(1) as ValidatorsOrOpts | undefined
    const asyncValidators = val.at(2) as AsyncValidators | undefined

    let opts: FormControlOptions = { nonNullable, asyncValidators }

    if (validatorsOrOpts) {
      if (Array.isArray(validatorsOrOpts) || typeof validatorsOrOpts === "function") {
        opts.validators = validatorsOrOpts
      } else {
        opts = validatorsOrOpts
        if (typeof opts.nonNullable === "undefined") {
          opts.nonNullable = nonNullable
        }
        if (asyncValidators) {
          console.warn(
            '@deprecated: passing "asyncValidators" with "FormControlOptions" is deprecated'
          )
        }
      }
    }

    let ctrl: AbstractControl

    if (stateOrValue instanceof FormArray) {
      ctrl = stateOrValue
    } else {
      ctrl = new FormControl(stateOrValue, opts)
    }

    ctrlObj[key] = ctrl
  })

  return ctrlObj as FormShape<T>
}

function createNonNullableTypedForm<T, NonNullable = true>(
  controls: FormGroupControlsInit<T, NonNullable>
) {
  return createTypedForm(controls, true)
}
