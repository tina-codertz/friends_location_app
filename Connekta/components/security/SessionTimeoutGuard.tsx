import React from 'react';

type Props = {
  children: React.ReactNode;
};

/** Passthrough — sessions persist on device until the user signs out. */
export function SessionTimeoutGuard({ children }: Props) {
  return <>{children}</>;
}
