"use client";
import { ArrowRight, Zap, Shield, Globe, Code2, Users, BarChart } from "lucide-react";

export function FeaturesSection() {
  const features = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Lightning Fast",
      description: "Deploy your applications in seconds, not minutes. Experience the speed of modern deployment."
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Secure by Default",
      description: "Enterprise-grade security with Better-Auth. Your data and deployments are always protected."
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Global CDN",
      description: "Lightning-fast content delivery across the globe with edge locations worldwide."
    },
    {
      icon: <Code2 className="h-6 w-6" />,
      title: "Developer First",
      description: "Built by developers, for developers. Simple, powerful, and intuitive."
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Team Collaboration",
      description: "Work together seamlessly with your team on shared projects and deployments."
    },
    {
      icon: <BarChart className="h-6 w-6" />,
      title: "Real-time Analytics",
      description: "Monitor your deployments with comprehensive analytics and insights."
    }
  ];

  return (
    <section className="py-24 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 font-bricolage-grotesque">
            Everything you need to ship
          </h2>
          <p className="text-xl text-zinc-400 max-w-3xl mx-auto font-bricolage-grotesque">
            Launchpad provides all the tools and features you need to deploy, manage, and scale your applications with confidence.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="relative p-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm hover:border-zinc-700 transition-all duration-300 group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white group-hover:bg-white/20 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white font-bricolage-grotesque">
                  {feature.title}
                </h3>
              </div>
              <p className="text-zinc-400 leading-relaxed font-bricolage-grotesque">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CTASection() {
  return (
    <section className="py-24 bg-gradient-to-r from-zinc-900 to-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-bricolage-grotesque">
          Ready to launch your next project?
        </h2>
        <p className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto font-bricolage-grotesque">
          Join thousands of developers who trust Launchpad for their deployment needs. 
          Get started in seconds with your GitHub account.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button className="px-8 py-4 bg-white text-black hover:bg-zinc-200 font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl font-bricolage-grotesque text-lg flex items-center justify-center gap-2">
            Get Started Free
            <ArrowRight className="h-5 w-5" />
          </button>
          <button className="px-8 py-4 bg-zinc-800 text-white hover:bg-zinc-700 font-semibold rounded-lg transition-all duration-300 border border-zinc-700 font-bricolage-grotesque text-lg">
            View Documentation
          </button>
        </div>
        <p className="text-sm text-zinc-500 mt-6">
          No credit card required • Free forever for personal projects • Cancel anytime
        </p>
      </div>
    </section>
  );
}

export function StatsSection() {
  const stats = [
    { number: "100K+", label: "Deployments" },
    { number: "50K+", label: "Developers" },
    { number: "99.9%", label: "Uptime" },
    { number: "150ms", label: "Avg. Response" }
  ];

  return (
    <section className="py-20 bg-black border-t border-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2 font-bricolage-grotesque">
                {stat.number}
              </div>
              <div className="text-zinc-400 font-bricolage-grotesque">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}