import { Rocket, Github, Twitter, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-900 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Logo Section */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Rocket className="h-8 w-8 text-white" />
              <span className="text-2xl font-bold text-white font-bricolage-grotesque">
                Launchpad
              </span>
            </div>
            <p className="text-zinc-400 font-bricolage-grotesque leading-relaxed">
              Ship fast. Preview instantly. The modern deployment platform for developers.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 font-bricolage-grotesque">Product</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-zinc-400 hover:text-white transition-colors font-bricolage-grotesque">Features</a></li>
              <li><a href="#" className="text-zinc-400 hover:text-white transition-colors font-bricolage-grotesque">Pricing</a></li>
              <li><a href="#" className="text-zinc-400 hover:text-white transition-colors font-bricolage-grotesque">Documentation</a></li>
              <li><a href="#" className="text-zinc-400 hover:text-white transition-colors font-bricolage-grotesque">API Reference</a></li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 font-bricolage-grotesque">Company</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-zinc-400 hover:text-white transition-colors font-bricolage-grotesque">About</a></li>
              <li><a href="#" className="text-zinc-400 hover:text-white transition-colors font-bricolage-grotesque">Blog</a></li>
              <li><a href="#" className="text-zinc-400 hover:text-white transition-colors font-bricolage-grotesque">Careers</a></li>
              <li><a href="#" className="text-zinc-400 hover:text-white transition-colors font-bricolage-grotesque">Contact</a></li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 font-bricolage-grotesque">Legal</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-zinc-400 hover:text-white transition-colors font-bricolage-grotesque">Privacy Policy</a></li>
              <li><a href="#" className="text-zinc-400 hover:text-white transition-colors font-bricolage-grotesque">Terms of Service</a></li>
              <li><a href="#" className="text-zinc-400 hover:text-white transition-colors font-bricolage-grotesque">Security</a></li>
              <li><a href="#" className="text-zinc-400 hover:text-white transition-colors font-bricolage-grotesque">GDPR</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-zinc-900 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-zinc-400 text-sm font-bricolage-grotesque">
              © 2024 Launchpad. All rights reserved.
            </p>
            
            <div className="flex items-center gap-4">
              <a 
                href="#" 
                className="text-zinc-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-zinc-900"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="text-zinc-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-zinc-900"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="text-zinc-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-zinc-900"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}