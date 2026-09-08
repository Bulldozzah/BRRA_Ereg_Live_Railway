import { Link } from "react-router-dom";
import { ReactNode } from "react";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
  variant?: "public" | "admin";
}

export const AuthShell = ({ title, subtitle, children, footer, variant = "public" }: AuthShellProps) => (
  <div className="min-h-dvh grid lg:grid-cols-2 bg-sand-50">
    <div className="flex flex-col justify-center px-6 md:px-12 lg:px-20 py-12">
      <div className="max-w-md w-full mx-auto">
        <Link to="/" className="flex items-center gap-2.5 mb-12">
          <div className="size-7 rounded-full bg-gradient-to-br from-copper-500 to-copper-600" />
          <span className="font-serif text-xl font-medium">Zambia eRegistry</span>
        </Link>
        <div className="mb-8">
          <h1 className="font-serif text-3xl md:text-4xl font-medium tracking-tight mb-3">{title}</h1>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
        {children}
        <div className="mt-8 pt-6 border-t border-sand-200 text-sm text-muted-foreground">{footer}</div>
      </div>
    </div>
    <div className={`hidden lg:block relative overflow-hidden ${variant === "admin" ? "bg-earth-900" : "bg-gradient-to-br from-copper-500 via-copper-600 to-copper-900"}`}>
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.2) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.15) 0%, transparent 50%)"
      }} />
      <div className="relative h-full flex flex-col justify-end p-12 text-sand-50">
        <blockquote className="font-serif text-3xl leading-snug max-w-md mb-6">
          {variant === "admin"
            ? "Stewarding the registry that powers Zambian commerce."
            : "Every great enterprise begins with a single, well-placed permit."}
        </blockquote>
        <div className="text-sm text-sand-100/70">— Republic of Zambia, Ministry of Commerce</div>
      </div>
    </div>
  </div>
);
