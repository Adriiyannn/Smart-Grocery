import { useState } from 'react';
import { ShoppingCart, Clock, Leaf, AlertCircle, Zap } from 'lucide-react';
import groceryHero from '../assets/grocery-hero.svg';
import AuthModal from '../components/AuthModal';

export default function Landing() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('signin');

  const openSignIn = () => {
    setAuthModalTab('signin');
    setIsAuthModalOpen(true);
  };

  const openSignUp = () => {
    setAuthModalTab('signup');
    setIsAuthModalOpen(true);
  };

  const features = [
    {
      icon: <ShoppingCart className="w-12 h-12 text-blue-600" />,
      title: 'Auto-Generated Grocery List',
      description: 'Automatically suggests items based on purchase history, consumption patterns, or inventory tracking',
      highlight: 'Alerts when frequently used items may be running low',
      benefit: 'Saves time by avoiding manual list creation'
    },
    {
      icon: <Clock className="w-12 h-12 text-emerald-600" />,
      title: 'Meal Planning Integration',
      description: 'Users can select meals for the week and the app will generate needed ingredients',
      highlight: 'Links recipes to grocery items to prevent missing ingredients',
      benefit: 'Helps reduce impulse buying and supports healthier eating'
    },
    {
      icon: <Leaf className="w-12 h-12 text-orange-600" />,
      title: 'Food Waste Reduction + Expiration Tracker',
      description: 'Tracks what\'s currently at home and its expiration dates',
      highlight: 'Sends reminders to consume food before it expires',
      benefit: 'Suggests recipes using items that are about to spoil'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">SmartGrocery</span>
            </div>
            <div className="hidden md:flex gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium cursor-pointer">Features</a>
              <a href="#benefits" className="text-gray-600 hover:text-gray-900 font-medium cursor-pointer">Benefits</a>
              <a href="#cta" className="text-gray-600 hover:text-gray-900 font-medium cursor-pointer">Get Started</a>
            </div>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium transition cursor-pointer" onClick={openSignIn}>
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Smart Shopping Made <span className="text-blue-600">Simple</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Stop wasting time and food. Let SmartGrocery learn your habits, plan your meals, and remind you of expiring items—all in one intelligent app.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 font-semibold text-lg transition flex items-center justify-center gap-2 cursor-pointer" onClick={openSignUp}>
                <Zap className="w-5 h-5" />
                Get Started
              </button>
              <button className="border-2 border-gray-300 text-gray-900 px-8 py-4 rounded-lg hover:border-gray-400 font-semibold text-lg transition cursor-pointer">
                Learn More
              </button>
            </div>
          </div>
          <div className="flex justify-center">
            <img src={groceryHero} alt="Smart Grocery Shopping" className="w-full max-w-md drop-shadow-lg" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to shop smarter and waste less
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 border border-gray-200 hover:border-gray-300 transition shadow-sm hover:shadow-md">
                <div className="mb-6 flex justify-start">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 mb-4">{feature.description}</p>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700 font-medium">{feature.highlight}</p>
                  </div>
                  <div className="flex gap-3">
                    <Zap className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700 font-medium">{feature.benefit}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-8">
                Why Choose SmartGrocery?
              </h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <ShoppingCart className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Save Time</h3>
                    <p className="text-gray-600">No more manual list creation or endless shopping decisions</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <Leaf className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Reduce Waste</h3>
                    <p className="text-gray-600">Expiration tracking helps you use items before they spoil</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Eat Healthier</h3>
                    <p className="text-gray-600">Meal planning integration supports balanced eating habits</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                    <Zap className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Save Money</h3>
                    <p className="text-gray-600">Smart recommendations prevent impulse buys and overspending</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-blue-50 rounded-2xl p-12 border border-blue-200">
                <div className="space-y-6">
                  <div className="text-4xl font-bold text-blue-600">35%</div>
                  <p className="text-xl text-gray-900 font-semibold">Average reduction in food waste per household</p>
                  <p className="text-gray-600">Based on user data from similar smart shopping applications</p>
                </div>
              </div>
              <div className="bg-emerald-50 rounded-2xl p-8 border border-emerald-200 mt-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                    <p className="text-gray-700">Tracks items in pantry</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                    <p className="text-gray-700">Recipe suggestions updated weekly</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                    <p className="text-gray-700">Works offline</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to Shop Smarter?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of users saving time, money, and reducing waste with Smart Grocery List
          </p>
          <button className="bg-white text-blue-600 px-10 py-4 rounded-lg hover:bg-gray-100 font-bold text-lg transition inline-flex items-center gap-2 cursor-pointer" onClick={openSignUp}>
            <Zap className="w-5 h-5" />
            Get Started
          </button>
          <p className="text-blue-100 text-sm mt-4">Join Now</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <ShoppingCart className="w-6 h-6 text-blue-500" />
                <span className="text-white font-bold">SmartGrocery</span>
              </div>
              <p className="text-sm">Making grocery shopping smarter, one list at a time.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition cursor-pointer">Features</a></li>
                <li><a href="#" className="hover:text-white transition cursor-pointer">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition cursor-pointer">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition cursor-pointer">About</a></li>
                <li><a href="#" className="hover:text-white transition cursor-pointer">Blog</a></li>
                <li><a href="#" className="hover:text-white transition cursor-pointer">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition cursor-pointer">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition cursor-pointer">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm">&copy; 2025 SmartGrocery. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition cursor-pointer">Twitter</a>
              <a href="#" className="text-gray-400 hover:text-white transition cursor-pointer">Facebook</a>
              <a href="#" className="text-gray-400 hover:text-white transition cursor-pointer">Instagram</a>
            </div>
          </div>
        </div>
      </footer>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} initialTab={authModalTab} />
    </div>
  );
}
