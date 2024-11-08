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
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidatorFn,
} from "@angular/forms"

/* Type Helpers */

// types to avoid over-typing the `GroupInitArray` and individual array index types
type StateOrValue<V> = (V | null) | FormControlState<V | null>
type ValidatorsOrOpts = FormControlOptions | ValidatorFn | ValidatorFn[]
type AsyncValidators = AsyncValidatorFn | AsyncValidatorFn[]

// allowed initial arrays when making a new form group using `FormBuilder`
type FormGroupInitArray<V> =
  | [StateOrValue<V>]
  | [StateOrValue<V>, ValidatorsOrOpts]
  | [StateOrValue<V>, ValidatorsOrOpts, AsyncValidators]

type FormGroupControlsInit<T> = { [K in keyof T]: FormGroupInitArray<T[K]> }

type MakeFormGroup<T> = { [K in keyof T]: FormControl<T[K] | null> }

type FormShape<T> = { [K in keyof T]: T[K] extends FormArray ? T[K] : FormControl<T[K] | null> }

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

@Component({
  standalone: true,
  selector: "app-root",
  templateUrl: "./app.component.html",
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
})
export class AppComponent {
  standardForm = this._formBuilder.group({
    str: [null as string | null],
    strArr: [null as string[] | null],
    strCtrlArr: [new FormArray<FormControl>([])],
    objGroupArr: [new FormArray<FormGroup>([])],
  })

  typedForm = this._formBuilder.group(
    createTypedForm<Form>({
      str: [null],
      strArr: [null],
      strCtrlArr: [new FormArray<FormControl>([])],
      objGroupArr: [new FormArray<FormGroup>([])],
    })
  )

  nonNullableForm = this._nonNullableFormBuilder.group({
    str: [null as string | null],
    strArr: [null as string[] | null],
    strCtrlArr: [new FormArray<FormControl<string>>([])],
    objGroupArr: [new FormArray<FormGroup<MakeFormGroup<SomeObj>>>([])],
  })

  nonNullableTypedForm = this._formBuilder.group(
    createNonNullableTypedForm<Form>({
      str: [null],
      strArr: [null],
      strCtrlArr: [new FormArray<FormControl>([])],
      objGroupArr: [new FormArray<FormGroup>([])],
    })
  )

  constructor(
    private _formBuilder: FormBuilder,
    private _nonNullableFormBuilder: NonNullableFormBuilder
  ) {}

  addStrCtrlArrControl() {
    this.typedForm.controls.strCtrlArr.push(new FormControl())
  }

  addObjGroupArrFormGroup() {
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

function createNonNullableTypedForm<T>(controls: FormGroupControlsInit<T>) {
  return createTypedForm(controls, true)
}
