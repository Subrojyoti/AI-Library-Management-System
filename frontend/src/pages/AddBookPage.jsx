import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../services/apiClient';
import ResponsiveContainer from '../components/ResponsiveContainer';

function AddBookPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    num_copies_total: 1,
    category: ''
  });

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    // For number inputs, only parse if value is not empty
    if (type === 'number') {
      const parsed = value === '' ? '' : parseInt(value, 10);
      // Only update if it's a valid number or empty string
      if (!isNaN(parsed) || value === '') {
        setFormData({
          ...formData,
          [name]: parsed
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await apiClient.post('/books/', formData);
      navigate('/books', { state: { message: 'Book added successfully!' } });
    } catch (err) {
      console.error('Error adding book:', err);
      // Handle validation errors which might be nested inside response.data.detail
      if (err.response?.data?.detail && Array.isArray(err.response.data.detail)) {
        // Format validation errors
        const errorMessages = err.response.data.detail.map(
          err => `${err.loc[1]}: ${err.msg}`
        ).join(', ');
        setError(`Validation error: ${errorMessages}`);
      } else {
        setError(err.response?.data?.detail || err.message || 'Failed to add book.');
      }
      setLoading(false);
    }
  };

  return (
    <ResponsiveContainer>
      {/* Header with decorative elements */}
      <div className="relative mb-10">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-playfair font-bold text-navy mb-2">Add New Book</h1>
            <div className="h-1 w-24 bg-gold"></div>
          </div>
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
        
        {/* Decorative corner elements */}
        <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-gold/20 -mt-2 -mr-2"></div>
        <div className="absolute bottom-0 left-0 w-20 h-20 border-b-2 border-l-2 border-gold/20 -mb-2 -ml-2"></div>
      </div>

      {/* Error message with premium styling */}
      {error && (
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
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
                  value={formData.title}
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
                  value={formData.author}
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
                  value={formData.isbn}
                  onChange={handleChange}
                  required
                  placeholder="e.g. 978-3-16-148410-0"
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
                  value={formData.category}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Fiction, Science, History"
                  className="w-full px-4 py-2 bg-cream border border-gold/30 rounded-md focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-all duration-300 font-source-serif text-brown"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="num_copies_total" className="block text-sm font-cormorant font-semibold text-navy">
                  Number of Copies <span className="text-burgundy">*</span>
                </label>
                <input
                  type="number"
                  id="num_copies_total"
                  name="num_copies_total"
                  value={formData.num_copies_total}
                  onChange={handleChange}
                  min="1"
                  required
                  className="w-full px-4 py-2 bg-cream border border-gold/30 rounded-md focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-all duration-300 font-source-serif text-brown"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-gold/20">
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing Request
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Book to Collection
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

export default AddBookPage;