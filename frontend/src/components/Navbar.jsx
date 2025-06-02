// frontend/src/components/Navbar.jsx
import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ResponsiveContainer from './ResponsiveContainer';

function Navbar() {
  const location = useLocation();
  const navbarRef = useRef(null);
  
  // Effect to measure navbar height and set it as a CSS variable
  useEffect(() => {
    const updateNavbarHeight = () => {
      if (navbarRef.current) {
        const height = navbarRef.current.offsetHeight;
        document.documentElement.style.setProperty('--navbar-height', `${height}px`);
      }
    };
    
    // Set initial height
    updateNavbarHeight();
    
    // Update height on window resize
    window.addEventListener('resize', updateNavbarHeight);
    
    // Update on zoom (works in most browsers)
    window.addEventListener('wheel', (e) => {
      if (e.ctrlKey) {
        // This is likely a zoom event
        setTimeout(updateNavbarHeight, 100);
      }
    });
    
    return () => {
      window.removeEventListener('resize', updateNavbarHeight);
      window.removeEventListener('wheel', updateNavbarHeight);
    };
  }, []);
  
  // Function to determine if a link is active
  const isActive = (path) => location.pathname === path;
  
  // Function to format current date in classic style
  const getCurrentDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };
  
  return (
    <header ref={navbarRef} className="w-full fixed top-0 left-0 z-50">
      {/* Top header with date */}
      <div className="bg-navy text-gold py-2 text-sm font-cormorant">
        <ResponsiveContainer>
          <div className="flex justify-end items-center">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{getCurrentDate()}</span>
            </div>
          </div>
        </ResponsiveContainer>
      </div>
      
      {/* Main navigation */}
      <nav className="bg-navy-light shadow-lg py-6">
        <ResponsiveContainer>
          <div className="flex flex-col md:flex-row items-center justify-between">
            <Link to="/" className="text-3xl font-playfair font-bold text-gold hover:text-gold-light tracking-wide transition duration-300 mb-4 md:mb-0 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>College Library</span>
            </Link>
            
            <ul className="flex flex-wrap justify-center space-x-1 md:space-x-8">
              <li className="relative group px-1">
                <Link 
                  to="/" 
                  className={`font-cormorant text-lg ${isActive('/') 
                    ? 'text-gold font-semibold' 
                    : 'text-cream hover:text-gold'} transition duration-300`}
                >
                  Home
                  {isActive('/') && (
                    <span className="absolute -bottom-2 left-0 w-full h-0.5 bg-gold"></span>
                  )}
                  <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-gold group-hover:w-full transition-all duration-300"></span>
                </Link>
              </li>
              <li className="relative group px-1">
                <Link 
                  to="/books" 
                  className={`font-cormorant text-lg ${isActive('/books') 
                    ? 'text-gold font-semibold' 
                    : 'text-cream hover:text-gold'} transition duration-300`}
                >
                  Books
                  {isActive('/books') && (
                    <span className="absolute -bottom-2 left-0 w-full h-0.5 bg-gold"></span>
                  )}
                  <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-gold group-hover:w-full transition-all duration-300"></span>
                </Link>
              </li>
              <li className="relative group px-1">
                <Link 
                  to="/students" 
                  className={`font-cormorant text-lg ${isActive('/students') 
                    ? 'text-gold font-semibold' 
                    : 'text-cream hover:text-gold'} transition duration-300`}
                >
                  Students
                  {isActive('/students') && (
                    <span className="absolute -bottom-2 left-0 w-full h-0.5 bg-gold"></span>
                  )}
                  <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-gold group-hover:w-full transition-all duration-300"></span>
                </Link>
              </li>
              <li className="relative group px-1">
                <Link 
                  to="/issue-book" 
                  className={`font-cormorant text-lg ${isActive('/issue-book') 
                    ? 'text-gold font-semibold' 
                    : 'text-cream hover:text-gold'} transition duration-300`}
                >
                  Issue Book
                  {isActive('/issue-book') && (
                    <span className="absolute -bottom-2 left-0 w-full h-0.5 bg-gold"></span>
                  )}
                  <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-gold group-hover:w-full transition-all duration-300"></span>
                </Link>
              </li>
              <li className="relative group px-1">
                <Link 
                  to="/ai-assistant" 
                  className={`font-cormorant text-lg ${isActive('/ai-assistant') 
                    ? 'text-gold font-semibold' 
                    : 'text-cream hover:text-gold'} transition duration-300`}
                >
                  AI Assistant
                  {isActive('/ai-assistant') && (
                    <span className="absolute -bottom-2 left-0 w-full h-0.5 bg-gold"></span>
                  )}
                  <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-gold group-hover:w-full transition-all duration-300"></span>
                </Link>
              </li>
            </ul>
          </div>
        </ResponsiveContainer>
      </nav>
      
      {/* Decorative divider */}
      <div className="h-1 w-full bg-gradient-to-r from-navy via-gold to-navy"></div>
    </header>
  );
}

export default Navbar;