'use client';

import { Form as AriaForm } from 'react-aria-components';
import type { FormProps } from 'react-aria-components';

interface CustomFormProps extends Omit<FormProps, 'className'> {
  className?: string;
}

export function Form({ className = '', ...props }: CustomFormProps) {
  return (
    <AriaForm
      className={`space-y-6 ${className}`}
      {...props}
    />
  );
}