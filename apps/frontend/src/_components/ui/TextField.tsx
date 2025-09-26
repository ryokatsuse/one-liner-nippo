'use client';

import { TextField as AriaTextField, Label, Input, FieldError } from 'react-aria-components';
import type { TextFieldProps } from 'react-aria-components';

interface CustomTextFieldProps extends Omit<TextFieldProps, 'className'> {
  label: string;
  placeholder?: string;
  type?: string;
  error?: string;
  className?: string;
}

export function TextField({
  label,
  placeholder,
  type = 'text',
  error,
  className = '',
  ...props
}: CustomTextFieldProps) {
  return (
    <AriaTextField className={`space-y-2 ${className}`} {...props}>
      <Label className="block text-sm font-medium text-gray-700">
        {label}
      </Label>
      <Input
        type={type}
        placeholder={placeholder}
        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black"
      />
      {error && (
        <FieldError className="text-red-600 text-sm mt-1">
          {error}
        </FieldError>
      )}
    </AriaTextField>
  );
}