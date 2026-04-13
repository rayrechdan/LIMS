import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

interface FieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export function Field({
  label,
  error,
  hint,
  required,
  children,
}: FieldProps & { children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-xs font-medium text-ink-soft">
          {label}
          {required && <span className="text-critical ml-0.5">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-[11px] text-gray">{hint}</p>}
      {error && <p className="text-[11px] text-critical">{error}</p>}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement>, FieldProps {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, required, className, ...props }, ref) => {
    if (label || error || hint) {
      return (
        <Field label={label} error={error} hint={hint} required={required}>
          <input
            ref={ref}
            className={cn(error && "border-critical focus:border-critical focus:ring-critical/10", className)}
            {...props}
          />
        </Field>
      );
    }
    return <input ref={ref} className={className} {...props} />;
  }
);
Input.displayName = "Input";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement>, FieldProps {}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, required, className, children, ...props }, ref) => {
    const select = (
      <select
        ref={ref}
        className={cn(error && "border-critical", className)}
        {...props}
      >
        {children}
      </select>
    );
    if (label || error || hint) {
      return (
        <Field label={label} error={error} hint={hint} required={required}>
          {select}
        </Field>
      );
    }
    return select;
  }
);
Select.displayName = "Select";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, FieldProps {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, required, className, ...props }, ref) => {
    const textarea = <textarea ref={ref} className={cn(error && "border-critical", className)} {...props} />;
    if (label || error || hint) {
      return (
        <Field label={label} error={error} hint={hint} required={required}>
          {textarea}
        </Field>
      );
    }
    return textarea;
  }
);
Textarea.displayName = "Textarea";
