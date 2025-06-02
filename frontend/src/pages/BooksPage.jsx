// frontend/src/pages/BooksPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom'; // Import Link and useLocation
import apiClient from '../services/apiClient'; // You'll create this
import ResponsiveContainer from '../components/ResponsiveContainer';

const BooksPage = () => {
  const location = useLocation(); // Get location object
  const [books, setBooks] = useState([]);  // Initialize with empty array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // Or make this configurable
  const [totalPages, setTotalPages] = useState(1);
  const [successMessage, setSuccessMessage] = useState(location.state?.message || null); // For messages from navigation

  // State for search filters
  const [searchType, setSearchType] = useState('title'); // Default search type
  const [searchTerm, setSearchTerm] = useState(''); // Single search term

  const fetchBooks = useCallback(async (isSearchAction = false) => {
    setLoading(true);
    setError(null);
    try {
      // Create a clean URLSearchParams object for each request
      const params = new URLSearchParams();
      
      // Always add pagination parameters
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      // Only append the search parameter if there's a search term and it's a search action
      if (searchTerm && isSearchAction) {
        // For ISBN search, ensure we're using the exact parameter name expected by the backend
        params.append(searchType, searchTerm);
        // console.log(`Search params: ${searchType}=${searchTerm}`);
        // console.log(`Full URL params: ${params.toString()}`);
      } 
      // else {
      //   console.log('No search parameters added - either not a search action or empty search term');
      // }

      const response = await apiClient.get(`/books/?${params.toString()}`);
      // console.log('API Response:', response.data); // Add this for debugging
      
      // Update to match backend structure
      setBooks(response.data.books || []);  // Changed from items to books
      
      // Calculate total pages from total count and limit
      const total = response.data.total || 0;
      const calculatedPages = Math.ceil(total / limit);
      setTotalPages(calculatedPages || 1);
    } catch (err) {
      setError(err.message || "Failed to fetch books. Ensure backend is running and CORS is configured.");
      console.error("Error fetching books:", err);
      setBooks([]); // Clear books on error
      setTotalPages(1); // Reset pages
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchType, searchTerm]);

  // Initial load of books without search filters
  useEffect(() => {
    // Only use pagination parameters for initial load and pagination changes
    // This ensures search parameters aren't accidentally applied
    fetchBooks(false);
  }, [page, limit]); // Only re-fetch when pagination changes

  // Reset page to 1 when search term changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);
  
  // Handle search button click
  const handleSearch = (e) => {
    e.preventDefault();
    // console.log(`Searching for ${searchType}: "${searchTerm}"`); // Debug search parameters
    fetchBooks(true); // Pass true to indicate this is a search action
  };

  // Clear success message after a delay or on component unmount/re-render
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        // Clear state from location to prevent message re-showing on refresh if not desired
        window.history.replaceState({}, document.title) 
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  if (error) return <p className="text-center text-red-600">Error: {error}</p>;

  return (
    <ResponsiveContainer>
      {/* Header with decorative elements */}
      <div className="relative mb-10">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-playfair font-bold text-navy mb-2">Collection Catalog</h1>
            <div className="h-1 w-24 bg-gold"></div>
          </div>
          <Link 
            to="/add-book" 
            className="btn-primary flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Book
          </Link>
        </div>
        
        {/* Decorative corner elements */}
        <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-gold/20 -mt-2 -mr-2"></div>
        <div className="absolute bottom-0 left-0 w-20 h-20 border-b-2 border-l-2 border-gold/20 -mb-2 -ml-2"></div>
      </div>
      
      {/* Success message with premium styling */}
      {successMessage && (
        <div className="mb-8 p-4 bg-cream border-l-4 border-gold rounded-r-md shadow-elegant relative overflow-hidden">
          <div className="absolute inset-0 bg-gold/5"></div>
          <div className="relative z-10 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gold mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-cormorant text-lg text-burgundy">{successMessage}</p>
          </div>
        </div>
      )}
      
      {/* Search form with premium styling */}
      <form onSubmit={handleSearch} className="mb-10 card-classic relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent"></div>
        <div className="p-6">
          <h2 className="text-xl font-playfair font-bold text-navy mb-6 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-burgundy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Advanced Search
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label htmlFor="searchType" className="block text-sm font-cormorant font-semibold text-navy">Search By</label>
              <select
                id="searchType"
                className="w-full px-4 py-2 bg-cream border border-gold/30 rounded-md focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-all duration-300 font-source-serif text-brown"
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
              >
                <option value="title">Title</option>
                <option value="author">Author</option>
                <option value="category">Category</option>
                <option value="isbn">ISBN</option>
                <option value="book_id">Book ID</option>
              </select>
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="searchTerm" className="block text-sm font-cormorant font-semibold text-navy">Search Term</label>
              <input
                type="text"
                id="searchTerm"
                className="w-full px-4 py-2 bg-cream border border-gold/30 rounded-md focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-all duration-300 font-source-serif text-brown"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Enter ${searchType === 'book_id' ? 'book ID' : searchType}...`}
              />
            </div>
          </div>
          
          <div className="mt-6 text-right">
            <button 
              type="submit"
              className="btn-secondary flex items-center ml-auto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search Catalog
            </button>
          </div>
        </div>
      </form>

      {/* Loading state with premium styling */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold mb-4"></div>
          <p className="font-cormorant text-lg text-navy">Retrieving books from the database...</p>
        </div>
      )}
      
      {/* Empty state with premium styling */}
      {!loading && books && books.length === 0 && (
        <div className="text-center py-12 card-classic">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gold/50 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p className="font-cormorant text-xl text-navy mb-2">No books found in the collection</p>
          <p className="font-source-serif text-brown-light">Please refine your search criteria or add new book to the catalog.</p>
        </div>
      )}

      {/* Book grid with premium styling */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        {!loading && books && books.map((book) => (
          <div key={book.id} className="card-classic group hover:shadow-lg transition-all duration-500 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-gold/20 -mt-2 -mr-2 z-0"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-gold/20 -mb-2 -ml-2 z-0"></div>
            
            <div className="p-6 relative z-10">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-playfair text-xl font-bold text-navy group-hover:text-burgundy transition-colors duration-300 flex-1 pr-2">
                  {book.title}
                </h3>
                <span className="text-xs font-cormorant bg-navy/10 text-navy px-3 py-1 rounded-full">
                  {book.id}
                </span>
              </div>
              
              <div className="mb-4">
                <p className="text-brown mb-2 font-source-serif">
                  <span className="font-cormorant text-burgundy">Author:</span> {book.author}
                </p>
                <p className="text-brown mb-2 font-source-serif">
                  <span className="font-cormorant text-burgundy">ISBN:</span> {book.isbn}
                </p>
                <p className="text-brown mb-2 font-source-serif">
                  <span className="font-cormorant text-burgundy">Category:</span> {book.category || 'Uncategorized'}
                </p>
                <p className="text-brown mb-2 font-source-serif">
                  <span className="font-cormorant text-burgundy">Available:</span> 
                  <span className={book.num_copies_available > 0 ? 'text-green-700' : 'text-red-700'}>
                    {book.num_copies_available} / {book.num_copies_total}
                  </span>
                </p>
              </div>
              
              <div className="flex justify-end items-center pt-4 border-t border-gold/20">
                <Link 
                  to={`/books/${book.id}`}
                  className="btn-outline text-sm py-2 px-4"
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls with premium styling */}
      {!loading && books && totalPages > 1 && (
        <div className="my-10 flex justify-center items-center space-x-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-navy text-gold disabled:bg-navy/30 disabled:text-gold/50 transition-colors duration-300 hover:bg-navy-dark disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="px-4 py-2 bg-cream border border-gold/30 rounded-md font-cormorant text-navy">
            Page <span className="font-semibold text-burgundy">{page}</span> of <span className="font-semibold text-burgundy">{totalPages}</span>
          </div>
          
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-navy text-gold disabled:bg-navy/30 disabled:text-gold/50 transition-colors duration-300 hover:bg-navy-dark disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </ResponsiveContainer>
  );
};

export default BooksPage;