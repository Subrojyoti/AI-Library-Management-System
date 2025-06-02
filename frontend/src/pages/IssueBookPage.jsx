import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../services/apiClient';
import ResponsiveContainer from '../components/ResponsiveContainer';

function IssueBookPage() {
  const navigate = useNavigate();
  const [issueData, setIssueData] = useState({
    book_id: '',
    student_id: '',
    expected_return_date: '' // Default empty string
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  // Set default date to 14 days from now when component loads
  React.useEffect(() => {
    const today = new Date();
    const twoWeeksLater = new Date(today);
    twoWeeksLater.setDate(today.getDate() + 14);
    
    // Format as YYYY-MM-DD for date input
    const formattedDate = twoWeeksLater.toISOString().split('T')[0];
    
    setIssueData(prev => ({
      ...prev,
      expected_return_date: formattedDate
    }));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setIssueData(prevData => ({
      ...prevData,
      [name]: value // IDs are typically strings or numbers, backend handles parsing
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!issueData.book_id || !issueData.student_id || !issueData.expected_return_date) {
        setError("Book ID, Student ID, and Expected Return Date are required.");
        setLoading(false);
        return;
    }

    try {
      // Format the date as expected by the API (YYYY-MM-DD) - ensure it's just a date with no time component
      const dateObj = new Date(issueData.expected_return_date);
      // Format as YYYY-MM-DD manually to avoid time components
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      // Ensure IDs are numbers if backend expects them as integers
      const payload = {
        book_id: parseInt(issueData.book_id, 10),
        student_id: parseInt(issueData.student_id, 10),
        expected_return_date: formattedDate
      };

      if (isNaN(payload.book_id) || isNaN(payload.student_id)) {
        setError("Book ID and Student ID must be numbers.");
        setLoading(false);
        return;
      }

      // console.log("Sending payload:", payload);

      const response = await apiClient.post('/issues/', payload);
      setSuccess(`Book (ID: ${response.data.book_id}) issued to student (ID: ${response.data.student_id}) successfully. Issue ID: ${response.data.id}`);
      setTimeout(() => {
        // Navigate to a relevant page, e.g., student's issued books or home
        navigate(`/students/${response.data.student_id}/issued-books`); 
      }, 2000);
      setIssueData({ book_id: '', student_id: '', expected_return_date: '' });
    } catch (err) {
      console.error("Error issuing book:", err);
      if (err.response) {
        console.error("Response data:", err.response.data);
        console.error("Response status:", err.response.status);
      }
      
      // Handle validation errors which might be nested inside response.data.detail
      if (err.response?.data?.detail && Array.isArray(err.response.data.detail)) {
        // Format validation errors
        const errorMessages = err.response.data.detail.map(
          error => `${error.loc[1]}: ${error.msg}`
        ).join(', ');
        setError(`Validation error: ${errorMessages}`);
      } else if (err.response?.data?.detail && typeof err.response.data.detail === 'string') {
        // Handle string error messages
        setError(err.response.data.detail);
      } else {
        setError(err.message || 'Failed to issue book.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResponsiveContainer>
      {/* Header with decorative elements */}
      <div className="relative mb-10">
        <div className="flex flex-col">
          <h1 className="text-3xl font-playfair font-bold text-navy mb-2">Issue New Book</h1>
          <div className="h-1 w-24 bg-gold"></div>
        </div>
        
        {/* Decorative corner elements */}
        <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-gold/20 -mt-2 -mr-2"></div>
        <div className="absolute bottom-0 left-0 w-20 h-20 border-b-2 border-l-2 border-gold/20 -mb-2 -ml-2"></div>
      </div>
      
      {/* Success and error messages with premium styling */}
      {success && (
        <div className="mb-8 card-classic bg-cream/50 border-l-4 border-green-600 p-4">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-cormorant font-semibold text-lg text-navy mb-1">Success</h3>
              <p className="font-source-serif text-brown">{success}</p>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mb-8 card-classic bg-cream/50 border-l-4 border-burgundy p-4">
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
      <form onSubmit={handleSubmit} className="card-classic relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent"></div>
        
        <div className="p-8">
          <h2 className="text-xl font-playfair font-bold text-navy mb-8 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-burgundy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Issue Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-2">
              <label htmlFor="book_id" className="block text-sm font-cormorant font-semibold text-navy">Book ID</label>
              <input 
                type="number" 
                name="book_id" 
                id="book_id" 
                value={issueData.book_id} 
                onChange={handleChange} 
                required 
                className="w-full px-4 py-2 bg-cream border border-gold/30 rounded-md focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-all duration-300 font-source-serif text-brown" 
              />
              <p className="text-xs font-source-serif text-brown-light italic">Enter the numeric ID of the book you want to issue. You can find this on the Books page.</p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="student_id" className="block text-sm font-cormorant font-semibold text-navy">Student ID</label>
              <input 
                type="number" 
                name="student_id" 
                id="student_id" 
                value={issueData.student_id} 
                onChange={handleChange} 
                required 
                className="w-full px-4 py-2 bg-cream border border-gold/30 rounded-md focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-all duration-300 font-source-serif text-brown" 
              />
              <p className="text-xs font-source-serif text-brown-light italic">Enter the numeric ID of the student. You can find this on the Students page.</p>
            </div>
            
            <div className="md:col-span-2 space-y-2">
              <label htmlFor="expected_return_date" className="block text-sm font-cormorant font-semibold text-navy">Expected Return Date</label>
              <input 
                type="date" 
                name="expected_return_date" 
                id="expected_return_date" 
                value={issueData.expected_return_date} 
                onChange={handleChange} 
                required 
                min={new Date().toISOString().split('T')[0]} 
                className="w-full px-4 py-2 bg-cream border border-gold/30 rounded-md focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-all duration-300 font-source-serif text-brown" 
              />
              <p className="text-xs font-source-serif text-brown-light italic">Select the expected date when the book should be returned (default is 14 days from today).</p>
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full btn-primary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing Request
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Issue Book to Student
              </>
            )}
          </button>
        </div>
      </form>
      
      {/* Back link with premium styling */}
      <div className="mt-8 text-center">
        <Link 
          to="/" 
          className="inline-flex items-center font-cormorant text-navy hover:text-burgundy transition-colors duration-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Return to Library Home
        </Link>
      </div>
    </ResponsiveContainer>
  );
}

export default IssueBookPage;