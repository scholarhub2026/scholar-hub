import { useState, useEffect } from 'react';
import { CheckCircle, Calendar, Clock, Mail, Phone, ArrowRight } from 'lucide-react';
import { contactNumber1, email } from '@/data';

const ThankYou = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Trigger entrance animations
    setTimeout(() => setIsVisible(true), 100);
    setTimeout(() => setShowConfetti(true), 800);
  }, []);

  const confettiPieces = Array.from({ length: 50 }, (_, i) => (
    <div
      key={i}
      className={`absolute w-2 h-2 opacity-0 ${showConfetti ? 'animate-ping' : ''}`}
      style={{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        backgroundColor: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'][Math.floor(Math.random() * 5)],
        animationDelay: `${Math.random() * 2}s`,
        animationDuration: `${2 + Math.random() * 2}s`
      }}
    />
  ));

  return (
    <div className="  relative overflow-hidden min-w-full">
      {/* Animated Background Elements */}
      {/* <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-200/30 to-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-200/30 to-purple-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div> */}

      {/* Confetti */}
      <div className="absolute inset-0 pointer-events-none">
        {confettiPieces}
      </div>

      <div className="relative z-10 flex items-center justify-center p-4">
        <div className={`max-w-2xl w-full transition-all duration-1000 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          
          {/* Main Card */}
          <div className="bg-white backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-12 border border-white/20">
            
            {/* Success Icon */}
            <div className="text-center mb-8">
              <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full mb-6 transition-all duration-700 transform ${
                isVisible ? 'scale-100 rotate-0' : 'scale-0 rotate-180'
              }`}>
                <CheckCircle className="w-10 h-10 text-white" strokeWidth={2.5} />
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent mb-4">
                Thank You!
              </h1>
              
              <p className="text-xl text-gray-600 leading-relaxed">
                Your appointment request has been successfully received.
                <br />
                We're excited to meet with you!
              </p>
            </div>

            {/* What Happens Next */}
            {/* <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-6 mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                <ArrowRight className="w-6 h-6 text-emerald-600 mr-3" />
                What happens next?
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <span className="text-emerald-600 font-semibold text-sm">1</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">Confirmation Email</h3>
                    <p className="text-gray-600 text-sm">You'll receive a detailed confirmation email within 5 minutes</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <span className="text-emerald-600 font-semibold text-sm">2</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">Team Review</h3>
                    <p className="text-gray-600 text-sm">Our team will review your request and confirm availability</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <span className="text-emerald-600 font-semibold text-sm">3</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">Personal Contact</h3>
                    <p className="text-gray-600 text-sm">We'll reach out within 24 hours to finalize details</p>
                  </div>
                </div>
              </div>
            </div> */}

            {/* Quick Info Cards */}
            {/* <div className="grid md:grid-cols-2 gap-4 mb-8">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="font-medium text-gray-800">Response Time</h3>
                    <p className="text-sm text-gray-600">Within 24 hours</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <div>
                    <h3 className="font-medium text-gray-800">Reschedule</h3>
                    <p className="text-sm text-gray-600">Easy & flexible</p>
                  </div>
                </div>
              </div>
            </div> */}

            {/* Contact Information */}
            <div className="bg-gray-50 rounded-2xl text-center  mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Need immediate assistance?</h3>
              <div className="flex flex-col justify-center sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <a 
                      href={`mailto:${email}`}
                      className="flex items-center justify-center space-x-2 bg-white hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg transition-colors border border-gray-200"
                >
                  <Mail className="w-4 h-4" />
                  <span>Email Us</span>
                </a>
                <a 
                  href={`tel:${contactNumber1}`}
                  className="flex items-center justify-center space-x-2 bg-white hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg transition-colors border border-gray-200"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call Us</span>
                </a>
              </div>
            </div>

            {/* Action Buttons */}
            {/* <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <button className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg">
                View Confirmation Details
              </button>
              <button className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-6 rounded-xl border border-gray-200 transition-all duration-200 hover:shadow-md">
                Return to Homepage
              </button>
            </div> */}
          </div>

          {/* Footer Message */}
          {/* <div className="text-center mt-8">
            <p className="text-gray-500 text-sm">
              Booking reference: <span className="font-mono font-medium">#APT-{Date.now().toString().slice(-6)}</span>
            </p>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default ThankYou;