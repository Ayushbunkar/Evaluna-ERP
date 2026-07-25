import { Label } from "./label";
import { Input } from "./input";
/** Reusable form field wrapper: Label + Input with space-y-2 layout. */
export function FormTextField({ field, label, ...inputProps }) {
    return (<div className="space-y-2">
      <Label>{label}</Label>
      <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} {...inputProps}/>
    </div>);
}
