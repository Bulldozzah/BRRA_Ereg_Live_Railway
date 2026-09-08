import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const nav = [
  { to: "/", label: "Home" },
  { to: "/browse/licenses", label: "Browse Licenses" },
  { to: "/notices", label: "Notice & Comment" },
  { to: "/news/articles", label: "News" },
  { to: "/about", label: "About" },
  { to: "/faqs", label: "FAQs" },
  { to: "/contactus", label: "Contact" },
];

export const SiteHeader = () => {
  const [open, setOpen] = useState(false);
  return (
    <header className="border-b border-sand-200/60 bg-white backdrop-blur-md sticky top-0 z-50">
      <div className="container-page h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center shrink-0">
          <img 
            src="/images/zambia-logo.png" 
            alt="Republic of Zambia Business Licensing Portal" 
            className="h-14 w-auto"
          />
        </Link>

        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `transition-colors hover:text-primary ${isActive ? "text-primary" : "text-foreground"}`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link to="/login" className="text-sm font-medium hover:text-primary transition-colors">Log in</Link>
          <Link
            to="/register"
            className="text-sm font-medium bg-earth-900 text-sand-50 px-5 py-2.5 rounded-full hover:bg-earth-800 transition-colors shadow-soft"
          >
            Create Account
          </Link>
        </div>

        <button onClick={() => setOpen(!open)} className="lg:hidden p-2" aria-label="Toggle menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-sand-200 bg-sand-50">
          <div className="container-page py-4 flex flex-col gap-3">
            {nav.map((n) => (
              <NavLink key={n.to} to={n.to} onClick={() => setOpen(false)} className="py-1.5 text-sm font-medium">
                {n.label}
              </NavLink>
            ))}
            <div className="flex gap-3 pt-3 border-t border-sand-200">
              <Link to="/login" className="text-sm font-medium">Log in</Link>
              <Link to="/register" className="text-sm font-medium text-primary">Create Account</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
