import { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

export const PublicLayout = ({ children }: { children: ReactNode }) => (
  <div className="min-h-dvh flex flex-col bg-sand-50">
    <SiteHeader />
    <main className="flex-1">{children}</main>
    <SiteFooter />
  </div>
);
