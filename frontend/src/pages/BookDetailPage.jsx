import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import ResponsiveContainer from '../components/ResponsiveContainer';

function BookDetailPage() {
  const { bookId } = useParams(); // Get bookId from URL params
  const navigate = useNavigate(); // Initialize useNavigate
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteError, setDeleteError] = useState(null); // For delete operation errors
  const [isDeleting, setIsDeleting] = useState(false); // For delete loading state

  useEffect(() => {
    const fetchBookDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get(`/books/${bookId}`);
        setBook(response.data);
      } catch (err) {
        setError(err.message || `Failed to fetch book details for ID ${bookId}.`);
        console.error("Error fetching book details:", err);
      } finally {
        setLoading(false);
      }
    };

    if (bookId) {
      fetchBookDetails();
    }
  }, [bookId]);

  const handleDeleteBook = async () => {
    // Check if book has any issued copies
    if (book.num_copies_available < book.num_copies_total) {
      // Show error message if book has issued copies
      setDeleteError("This book cannot be deleted as some copies are issued to students.");
      return;
    }

    if (window.confirm(`Are you sure you want to delete the book "${book?.title}"? This action cannot be undone.`)) {
      setIsDeleting(true);
      setDeleteError(null);
      try {
        await apiClient.delete(`/books/${bookId}`);
        // On successful deletion, navigate back to the books list
        navigate('/books', { state: { message: `Book "${book?.title}" deleted successfully.` } });
      } catch (err) {
        console.error("Error deleting book:", err);
        setDeleteError(err.response?.data?.detail || err.message || 'Failed to delete book.');
        setIsDeleting(false);
      }
      // No finally block for setIsDeleting(false) here, as navigation occurs on success
    }
  };

  if (loading) return (
    <ResponsiveContainer className="text-center py-12">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold mb-4"></div>
      <p className="font-cormorant text-lg text-navy">Retrieving book details...</p>
    </ResponsiveContainer>
  );
  
  if (error) return (
    <ResponsiveContainer className="py-12 card-classic text-center">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-burgundy/50 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <p className="font-cormorant text-xl text-navy mb-2">Error</p>
      <p className="font-source-serif text-brown">{error}</p>
    </ResponsiveContainer>
  );
  
  if (!book) return (
    <ResponsiveContainer className="py-12 card-classic text-center">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gold/50 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
      <p className="font-cormorant text-xl text-navy mb-2">Book Not Found</p>
      <p className="font-source-serif text-brown-light">The requested book could not be located in our catalog.</p>
    </ResponsiveContainer>
  );

  return (
    <ResponsiveContainer>
      {/* Back link with premium styling */}
      <div className="mb-8">
        <Link 
          to="/books" 
          className="inline-flex items-center font-cormorant text-navy hover:text-burgundy transition-colors duration-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Return to Collection Catalog
        </Link>
      </div>
      
      {/* Book detail card with premium styling */}
      <div className="card-classic relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-gold/20 -mt-2 -mr-2"></div>
        <div className="absolute bottom-0 left-0 w-20 h-20 border-b-2 border-l-2 border-gold/20 -mb-2 -ml-2"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent"></div>
        
        <div className="p-8 relative z-10">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-playfair font-bold text-navy mb-2">{book.title}</h1>
              <div className="h-1 w-24 bg-gold"></div>
            </div>
            <span className="inline-flex items-center justify-center px-4 py-1 bg-navy/10 text-navy rounded-full font-cormorant">
              Book ID: {book.id}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="font-cormorant font-semibold text-burgundy">Author</h3>
                <p className="font-source-serif text-brown">{book.author}</p>
              </div>
              
              <div className="space-y-1">
                <h3 className="font-cormorant font-semibold text-burgundy">ISBN</h3>
                <p className="font-source-serif text-brown">{book.isbn}</p>
              </div>
              
              <div className="space-y-1">
                <h3 className="font-cormorant font-semibold text-burgundy">Category</h3>
                <p className="font-source-serif text-brown">{book.category || 'Uncategorized'}</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="card-classic bg-cream/30 p-6">
                <h3 className="font-cormorant font-semibold text-navy text-lg mb-4">Availability</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-cormorant text-burgundy">Total Copies:</span>
                    <span className="font-libre text-navy font-semibold">{book.num_copies_total}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="font-cormorant text-burgundy">Available Copies:</span>
                    <span className={`font-libre font-semibold ${book.num_copies_available > 0 ? 'text-green-700' : 'text-burgundy'}`}>
                      {book.num_copies_available}
                    </span>
                  </div>
                  
                  {/* Visual availability indicator */}
                  <div className="mt-4">
                    <div className="w-full bg-navy/10 rounded-full h-2.5">
                      <div 
                        className="bg-gold h-2.5 rounded-full" 
                        style={{ width: `${(book.num_copies_available / book.num_copies_total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-1">
                <h3 className="font-cormorant font-semibold text-burgundy">Record Information</h3>
                <p className="text-xs font-source-serif text-brown-light">Created: {new Date(book.created_at).toLocaleString()}</p>
                <p className="text-xs font-source-serif text-brown-light">Last Updated: {new Date(book.updated_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          {/* Delete error message with premium styling */}
          {deleteError && (
            <div className="mb-8 bg-cream/50 border-l-4 border-burgundy p-4 rounded-r">
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-burgundy mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h3 className="font-cormorant font-semibold text-lg text-navy mb-1">Error</h3>
                  <p className="font-source-serif text-brown">{deleteError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons with premium styling */}
          <div className="mt-8 flex flex-wrap gap-4 border-t border-gold/20 pt-6">
            <Link 
              to={`/edit-book/${book.id}`}
              className="btn-secondary flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Book Details
            </Link>
            
            <button
              onClick={handleDeleteBook}
              disabled={isDeleting}
              className="btn-outline-danger flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing Request
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Remove from Collection
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </ResponsiveContainer>
  );
}

export default BookDetailPage;