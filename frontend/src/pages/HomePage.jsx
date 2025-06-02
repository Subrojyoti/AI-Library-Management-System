// frontend/src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ResponsiveContainer from '../components/ResponsiveContainer';
import apiClient from '../services/apiClient';
function HomePage() {
  const [stats, setStats] = useState({
    total_books: 0,
    total_students: 0,
    currently_issued: 0,
    loading: true
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // console.log('Fetching statistics from API...');
        const response = await apiClient.get('/stats/collection');
        // console.log('API response status:', response.status);
        
        // With axios, the data is directly available in response.data
        setStats({
          ...response.data,
          loading: false
        });
      } catch (error) {
        console.error('Error fetching statistics:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, []);
  return (
    <ResponsiveContainer className="py-8">
      {/* Hero section with classic design */}
      <div className="relative text-center mb-16 py-12 px-6 rounded-lg overflow-hidden">
        <div className="absolute inset-0 bg-navy opacity-90 z-0"></div>
        <div className="absolute inset-0 bg-[url('/src/assets/textures/parchment.jpg')] opacity-10 mix-blend-overlay z-0"></div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-24 h-24 border-t-4 border-l-4 border-gold opacity-60 z-10"></div>
        <div className="absolute bottom-0 right-0 w-24 h-24 border-b-4 border-r-4 border-gold opacity-60 z-10"></div>
        
        <div className="relative z-20">
          <h1 className="text-4xl md:text-5xl font-playfair font-bold text-gold mb-6 tracking-wide">
            Welcome to College Library
          </h1>
          <div className="w-24 h-1 bg-gold mx-auto mb-6"></div>
          <p className="text-xl font-cormorant text-cream max-w-3xl mx-auto leading-relaxed">
            A sophisticated system for managing your library's collection, students, and lending operations with ease
          </p>
        </div>
      </div>
      
      {/* Feature cards with premium design */}
      <div className="mb-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-playfair font-bold text-navy mb-4">Library Services</h2>
          <div className="ornate-divider"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Link 
            to="/books" 
            className="card-classic group hover:shadow-lg transform transition duration-500 hover:-translate-y-1 overflow-hidden"
          >
            <div className="relative p-6 z-10">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gold/10 rounded-bl-3xl -mr-6 -mt-6 z-0 group-hover:bg-gold/20 transition-all duration-500"></div>
              
              <div className="text-burgundy mb-4 transition-all duration-300 group-hover:scale-110 transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              
              <h3 className="font-cormorant font-bold text-2xl mb-3 text-navy group-hover:text-burgundy transition-colors duration-300">Browse Collection</h3>
              <p className="font-source-serif text-brown-light">Explore our curated catalog of literary treasures</p>
              
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gold/30 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
            </div>
          </Link>
          
          <Link 
            to="/students" 
            className="card-classic group hover:shadow-lg transform transition duration-500 hover:-translate-y-1 overflow-hidden"
          >
            <div className="relative p-6 z-10">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gold/10 rounded-bl-3xl -mr-6 -mt-6 z-0 group-hover:bg-gold/20 transition-all duration-500"></div>
              
              <div className="text-burgundy mb-4 transition-all duration-300 group-hover:scale-110 transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              
              <h3 className="font-cormorant font-bold text-2xl mb-3 text-navy group-hover:text-burgundy transition-colors duration-300">Student Registry</h3>
              <p className="font-source-serif text-brown-light">Manage student information</p>
              
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gold/30 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
            </div>
          </Link>
          
          <Link 
            to="/issue-book" 
            className="card-classic group hover:shadow-lg transform transition duration-500 hover:-translate-y-1 overflow-hidden"
          >
            <div className="relative p-6 z-10">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gold/10 rounded-bl-3xl -mr-6 -mt-6 z-0 group-hover:bg-gold/20 transition-all duration-500"></div>
              
              <div className="text-burgundy mb-4 transition-all duration-300 group-hover:scale-110 transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              
              <h3 className="font-cormorant font-bold text-2xl mb-3 text-navy group-hover:text-burgundy transition-colors duration-300">Book Isssue</h3>
              <p className="font-source-serif text-brown-light">Facilitate lending and returns of books</p>
              
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gold/30 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
            </div>
          </Link>
          
          <Link 
            to="/ai-assistant" 
            className="card-classic group hover:shadow-lg transform transition duration-500 hover:-translate-y-1 overflow-hidden"
          >
            <div className="relative p-6 z-10">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gold/10 rounded-bl-3xl -mr-6 -mt-6 z-0 group-hover:bg-gold/20 transition-all duration-500"></div>
              
              <div className="text-burgundy mb-4 transition-all duration-300 group-hover:scale-110 transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              
              <h3 className="font-cormorant font-bold text-2xl mb-3 text-navy group-hover:text-burgundy transition-colors duration-300">AI Assistant</h3>
              <p className="font-source-serif text-brown-light">Retrive library's info effortlesly</p>
              
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gold/30 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
            </div>
          </Link>
        </div>
      </div>
      
      {/* Stats and Quick Links with premium design */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <div className="card-classic relative overflow-hidden">
          {/* Decorative corner elements */}
          <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-gold/30"></div>
          <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-gold/30"></div>
          
          <div className="p-8">
            <h2 className="text-2xl font-playfair font-bold text-navy mb-6 flex items-center">
              <span className="text-burgundy mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </span>
              Collection Statistics
            </h2>
            
            <ul className="space-y-6">
              <li className="flex items-center">
                <span className="w-12 h-12 rounded-full bg-navy/10 flex items-center justify-center mr-4 shadow-elegant">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </span>
                <div>
                  <span className="font-cormorant text-lg text-brown">Total Books:</span>
                  <span className="ml-2 font-libre text-xl text-burgundy font-semibold">
                    {stats.loading ? 'Loading...' : stats.total_books}
                  </span>
                </div>
              </li>
              
              <li className="flex items-center">
                <span className="w-12 h-12 rounded-full bg-navy/10 flex items-center justify-center mr-4 shadow-elegant">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </span>
                <div>
                  <span className="font-cormorant text-lg text-brown">Registered Students:</span>
                  <span className="ml-2 font-libre text-xl text-burgundy font-semibold">
                    {stats.loading ? 'Loading...' : stats.total_students}
                  </span>
                </div>
              </li>
              
              <li className="flex items-center">
                <span className="w-12 h-12 rounded-full bg-navy/10 flex items-center justify-center mr-4 shadow-elegant">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <div>
                  <span className="font-cormorant text-lg text-brown">Currently Issued:</span>
                  <span className="ml-2 font-libre text-xl text-burgundy font-semibold">
                    {stats.loading ? 'Loading...' : stats.currently_issued}
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="card-classic relative overflow-hidden">
          {/* Decorative corner elements */}
          <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-gold/30"></div>
          <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-gold/30"></div>
          
          <div className="p-8">
            <h2 className="text-2xl font-playfair font-bold text-navy mb-6 flex items-center">
              <span className="text-burgundy mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </span>
              Quick Actions
            </h2>
            
            <ul className="space-y-5">
              <li>
                <Link to="/add-book" className="group flex items-center p-3 rounded-md transition-all duration-300 hover:bg-navy/5">
                  <span className="w-10 h-10 rounded-full bg-burgundy/10 flex items-center justify-center mr-4 group-hover:bg-burgundy/20 transition-colors duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-burgundy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </span>
                  <span className="font-cormorant text-lg text-navy group-hover:text-burgundy transition-colors duration-300">Add New Book</span>
                </Link>
              </li>
              
              <li>
                <Link to="/add-student" className="group flex items-center p-3 rounded-md transition-all duration-300 hover:bg-navy/5">
                  <span className="w-10 h-10 rounded-full bg-burgundy/10 flex items-center justify-center mr-4 group-hover:bg-burgundy/20 transition-colors duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-burgundy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </span>
                  <span className="font-cormorant text-lg text-navy group-hover:text-burgundy transition-colors duration-300">Register New Student</span>
                </Link>
              </li>
              
              <li>
                <Link to="/issue-book" className="group flex items-center p-3 rounded-md transition-all duration-300 hover:bg-navy/5">
                  <span className="w-10 h-10 rounded-full bg-burgundy/10 flex items-center justify-center mr-4 group-hover:bg-burgundy/20 transition-colors duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-burgundy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </span>
                  <span className="font-cormorant text-lg text-navy group-hover:text-burgundy transition-colors duration-300">Issue a Book</span>
                </Link>
              </li>
              
              <li>
                <Link to="/books" className="group flex items-center p-3 rounded-md transition-all duration-300 hover:bg-navy/5">
                  <span className="w-10 h-10 rounded-full bg-burgundy/10 flex items-center justify-center mr-4 group-hover:bg-burgundy/20 transition-colors duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-burgundy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <span className="font-cormorant text-lg text-navy group-hover:text-burgundy transition-colors duration-300">Search Collection</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Footer quote */}
      <div className="text-center mb-8">
        <div className="relative py-6 px-8">
          <div className="text-6xl text-gold/20 absolute top-0 left-0 font-serif">"</div>
          <p className="text-xl italic font-libre text-brown mx-auto max-w-3xl px-8">
            A library is not a luxury but one of the necessities of life.
          </p>
          <p className="text-burgundy font-cormorant mt-2">— Henry Ward Beecher</p>
          <div className="text-6xl text-gold/20 absolute bottom-0 right-0 font-serif">"</div>
        </div>
      </div>
    </ResponsiveContainer>
  );
}

export default HomePage;