import { Link } from "react-router-dom";
import { MapPin, Phone, Globe, Mail } from "lucide-react";

export const SiteFooter = () => {
  return (
    <footer className="bg-earth-900 text-sand-50 mt-24">
      <div className="container-page py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        {/* Agency */}
        <div>
          <div className="flex items-center gap-2.5 mb-5">
            <div className="size-6 rounded-full bg-gradient-to-br from-copper-500 to-copper-600" />
            <span className="font-serif text-lg font-medium leading-tight">
              Business Regulatory<br />Review Agency
            </span>
          </div>
          <ul className="space-y-3 text-sm text-sand-100/80">
            <li className="flex items-start gap-2.5">
              <MapPin size={15} className="text-copper-500 shrink-0 mt-0.5" />
              <span>Plot No. 2251 Fairley Road, Ridgeway, Lusaka.<br />P.O. Box 50593, Lusaka–Zambia</span>
            </li>
            <li className="flex items-start gap-2.5">
              <Phone size={15} className="text-copper-500 shrink-0 mt-0.5" />
              <span>BRRA General Line: <span className="text-sand-50">+260 211 259165</span></span>
            </li>
            <li className="flex items-start gap-2.5">
              <Phone size={15} className="text-copper-500 shrink-0 mt-0.5" />
              <span>Call Center: <span className="text-sand-50">+260 211 259165</span></span>
            </li>
            <li className="flex items-start gap-2.5">
              <Globe size={15} className="text-copper-500 shrink-0 mt-0.5" />
              <a href="http://www.brra.org.zm" target="_blank" rel="noreferrer" className="hover:text-copper-500 transition-colors">
                www.brra.org.zm
              </a>
            </li>
          </ul>
        </div>

        {/* Newsletters */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-sand-100/50 mb-5">Newsletters</h4>
          <p className="text-sm text-sand-100/80 mb-4 leading-relaxed">
            Stay informed about regulatory updates, new licenses and consultations.
          </p>
          <form className="space-y-2.5">
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-sand-100/50" />
              <input
                type="email"
                placeholder="your@email.com"
                className="w-full bg-earth-800 border border-sand-100/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-sand-50 placeholder:text-sand-100/40 focus:outline-none focus:border-copper-500"
              />
            </div>
            <button
              type="button"
              className="w-full bg-gradient-to-b from-copper-500 to-copper-600 text-white rounded-lg py-2.5 text-sm font-medium hover:from-copper-600 transition-colors"
            >
              Sign Up for Newsletter
            </button>
            <button
              type="button"
              className="w-full text-xs text-sand-100/60 hover:text-copper-500 transition-colors py-1"
            >
              Unsubscribe to Newsletter
            </button>
          </form>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-sand-100/50 mb-5">Quick Links</h4>
          <ul className="space-y-3 text-sm text-sand-100/80">
            <li><Link to="/contactus" className="hover:text-copper-500 transition-colors">Contact Us</Link></li>
            <li><Link to="/faqs" className="hover:text-copper-500 transition-colors">FAQs</Link></li>
            <li><Link to="/about" className="hover:text-copper-500 transition-colors">About BRRA</Link></li>
            <li><Link to="/business-procedures" className="hover:text-copper-500 transition-colors">Business Procedures</Link></li>
            <li><Link to="/notices" className="hover:text-copper-500 transition-colors">Notice & Comment</Link></li>
          </ul>
        </div>

        {/* Useful Links */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-sand-100/50 mb-5">Useful Links</h4>
          <ul className="space-y-3 text-sm text-sand-100/80">
            <li><Link to="/browse/licenses" className="hover:text-copper-500 transition-colors">License Search</Link></li>
            <li><Link to="/browse/agencies" className="hover:text-copper-500 transition-colors">Government Agencies</Link></li>
            <li><Link to="/browse/jurisdictions" className="hover:text-copper-500 transition-colors">Jurisdictions</Link></li>
            <li><Link to="/browse/listindustries" className="hover:text-copper-500 transition-colors">Industries</Link></li>
            <li><Link to="/news/articles" className="hover:text-copper-500 transition-colors">News & Updates</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-sand-100/10">
        <div className="container-page py-6 text-xs text-sand-100/60 flex flex-col md:flex-row items-center justify-between gap-3">
          <p>Copyright {new Date().getFullYear()} © Business Regulatory Review Agency. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link to="/policy/privacy" className="hover:text-copper-500 transition-colors">Privacy Policy</Link>
            <Link to="/policy/terms" className="hover:text-copper-500 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
