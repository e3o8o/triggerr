import { HTMLAttributes } from 'react';

export interface ComponentProps extends Omit<HTMLAttributes<HTMLElement>, 'className'> {
  className?: string;
}