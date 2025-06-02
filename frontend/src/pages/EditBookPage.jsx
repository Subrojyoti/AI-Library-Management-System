import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../services/apiClient';
import ResponsiveContainer from '../components/ResponsiveContainer';

function EditBookPage() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [bookData, setBookData] = useState({
    title: '',
    author: '',
    isbn: '',
    num_copies_total: 0,
    num_copies_available: 0,
    category: ''
  });
  const [initialIsbn, setInitialIsbn] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true); // For initial data fetch

  useEffect(() => {
    const fetchBook = async () => {
      setPageLoading(true);
      try {
        const response = await apiClient.get(`/books/${bookId}`);
        const { title, author, isbn, num_copies_total, num_copies_available, category } = response.data;
        setBookData({ title, author, isbn, num_copies_total, num_copies_available, category });
        setInitialIsbn(isbn); // Store initial ISBN for comparison
      } catch (err) {
        console.error("Error fetching book for edit:", err);
        setError(err.response?.data?.detail || err.message || 'Failed to fetch book details.');
        // Redirect if book not found or critical error
        // setTimeout(() => navigate('/books'), 2000);
      } finally {
        setPageLoading(false);
      }
    };
    if (bookId) {
      fetchBook();
    }
  }, [bookId, navigate]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setBookData(prevData => ({
      ...prevData,
      [name]: type === 'number' ? parseInt(value, 10) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (bookData.num_copies_available > bookData.num_copies_total) {
        setError("Available copies cannot exceed total copies.");
        setLoading(false);
        return;
    }

    // Create a payload with only the fields that are part of BookUpdate schema
    // and potentially changed. Pydantic models in backend handle partial updates.
    const payload = {
        title: bookData.title,
        author: bookData.author,
        isbn: bookData.isbn,
        num_copies_total: bookData.num_copies_total,
        num_copies_available: bookData.num_copies_available,
        category: bookData.category
    };

    // If ISBN hasn't changed, don't send it. This is optional, backend should handle it.
    // if (payload.isbn === initialIsbn) {
    //   delete payload.isbn;
    // }

    try {
      const response = await apiClient.put(`/books/${bookId}`, payload);
      setSuccess(`Book "${response.data.title}" updated successfully!`);
      setInitialIsbn(response.data.isbn); // Update initial ISBN in case of further edits
      setTimeout(() => {
        navigate(`/books/${bookId}`); // Redirect to book detail page
      }, 1500);
    } catch (err) {
      console.error("Error updating book:", err.response ? err.response.data : err.message);
      setError(err.response?.data?.detail || err.message || 'Failed to update book.');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) return (
    <ResponsiveContainer className="text-center py-12">
      <div className="inline-flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-gold mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="font-playfair text-xl text-navy">Retrieving Book Information...</span>
      </div>
    </ResponsiveContainer>
  );
  
  // if initial fetch error and no book data, show error and option to go back
  if (error && !bookData.title) return (
    <ResponsiveContainer className="py-8 text-center">
      <div className="card-classic p-8">
        <div className="flex flex-col items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-burgundy mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-2xl font-playfair font-bold text-navy mb-4">Unable to Retrieve Book</h2>
          <p className="text-brown font-source-serif mb-6">{error}</p>
          <Link to="/books" className="btn-primary inline-flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Return to Collection Catalog
          </Link>
        </div>
      </div>
    </ResponsiveContainer>
  );

  return (
    <ResponsiveContainer>
      {/* Header with decorative elements */}
      <div className="relative mb-10">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-playfair font-bold text-navy mb-2">Edit Book</h1>
            <div className="h-1 w-24 bg-gold"></div>
            <p className="text-brown font-cormorant text-lg mt-2">{bookData.title || ''}</p>
          </div>
          <Link 
            to={`/books/${bookId}`} 
            className="inline-flex items-center font-cormorant text-navy hover:text-burgundy transition-colors duration-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Return to Book Details
          </Link>
        </div>
        
        {/* Decorative corner elements */}
        <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-gold/20 -mt-2 -mr-2"></div>
        <div className="absolute bottom-0 left-0 w-20 h-20 border-b-2 border-l-2 border-gold/20 -mb-2 -ml-2"></div>
      </div>

      {/* Success message with premium styling */}
      {success && (
        <div className="mb-8 bg-cream/50 border-l-4 border-emerald-600 p-4 rounded-r">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <h3 className="font-cormorant font-semibold text-lg text-navy mb-1">Success</h3>
              <p className="font-source-serif text-brown">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error message with premium styling */}
      {error && bookData.title && (
        <div className="mb-8 bg-cream/50 border-l-4 border-burgundy p-4 rounded-r">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-burgundy mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="font-cormorant font-semibold text-lg text-navy mb-1">Error</h3>
              <p className="font-source-serif text-brown">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form with premium styling */}
      <div className="card-classic relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent"></div>
        
        <div className="p-8">
          <h2 className="text-xl font-playfair font-bold text-navy mb-8 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-burgundy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Book Information
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-2">
                <label htmlFor="title" className="block text-sm font-cormorant font-semibold text-navy">
                  Title <span className="text-burgundy">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={bookData.title}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-cream border border-gold/30 rounded-md focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-all duration-300 font-source-serif text-brown"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="author" className="block text-sm font-cormorant font-semibold text-navy">
                  Author <span className="text-burgundy">*</span>
                </label>
                <input
                  type="text"
                  id="author"
                  name="author"
                  value={bookData.author}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-cream border border-gold/30 rounded-md focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-all duration-300 font-source-serif text-brown"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="isbn" className="block text-sm font-cormorant font-semibold text-navy">
                  ISBN <span className="text-burgundy">*</span>
                </label>
                <input
                  type="text"
                  id="isbn"
                  name="isbn"
                  value={bookData.isbn}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-cream border border-gold/30 rounded-md focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-all duration-300 font-source-serif text-brown"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="category" className="block text-sm font-cormorant font-semibold text-navy">
                  Category <span className="text-burgundy">*</span>
                </label>
                <input
                  type="text"
                  id="category"
                  name="category"
                  value={bookData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-cream border border-gold/30 rounded-md focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-all duration-300 font-source-serif text-brown"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="num_copies_total" className="block text-sm font-cormorant font-semibold text-navy">
                  Total Copies <span className="text-burgundy">*</span>
                </label>
                <input
                  type="number"
                  id="num_copies_total"
                  name="num_copies_total"
                  value={bookData.num_copies_total}
                  onChange={handleChange}
                  min="0"
                  required
                  className="w-full px-4 py-2 bg-cream border border-gold/30 rounded-md focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-all duration-300 font-source-serif text-brown"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="num_copies_available" className="block text-sm font-cormorant font-semibold text-navy">
                  Available Copies <span className="text-burgundy">*</span>
                </label>
                <input
                  type="number"
                  id="num_copies_available"
                  name="num_copies_available"
                  value={bookData.num_copies_available}
                  onChange={handleChange}
                  min="0"
                  required
                  className="w-full px-4 py-2 bg-cream border border-gold/30 rounded-md focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-all duration-300 font-source-serif text-brown"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-gold/20">
              <button
                type="submit"
                disabled={loading || pageLoading}
                className="w-full btn-primary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating Book...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ResponsiveContainer>
  );
}

export default EditBookPage;