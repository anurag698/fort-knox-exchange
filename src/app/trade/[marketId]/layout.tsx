// This layout removes the main header and container padding for a full-screen trading experience.
import React from 'react';

export default function TradePageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
