import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import ResponsiveContainer from '../components/ResponsiveContainer';

function StudentIssuedBooksPage() {
  const { studentId } = useParams(); // Using studentId from URL
  const navigate = useNavigate();
  const [issuedBooks, setIssuedBooks] = useState([]);
  const [studentName, setStudentName] = useState(''); // To display student's name
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [returnError, setReturnError] = useState(null);
  const [isReturning, setIsReturning] = useState(null); // Can store issue_id being returned
  const [studentExists, setStudentExists] = useState(true);

  const fetchIssuedBooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    setReturnError(null); // Clear previous return errors on fresh fetch
    try {
      // First, fetch student details to get their name (optional, but good for UX)
      // This assumes studentId is the numeric ID. If it can be other identifiers,
      // the backend endpoint GET /students/{identifier} should handle it.
      try {
          const studentRes = await apiClient.get(`/students/${studentId}`);
          setStudentName(studentRes.data.name);
          setStudentExists(true);
      } catch (nameError) {
          console.warn("Could not fetch student name:", nameError);
          if (nameError.response && nameError.response.status === 404) {
            setStudentExists(false);
            setError(`Student with ID ${studentId} does not exist. Please check the student ID.`);
            setLoading(false);
            return;
          }
          setStudentName(`ID ${studentId}`); // Fallback name
      }

      // Only fetch issued books if student exists
      if (studentExists) {
        // Then, fetch their issued books
        // The backend endpoint is GET /students/{student_identifier}/issued-books
        // We are using studentId as the identifier here.
        try {
          const response = await apiClient.get(`/students/${studentId}/issued-books`);
          setIssuedBooks(response.data || []);
        } catch (booksError) {
          console.error("Error fetching issued books:", booksError);
          if (booksError.message === 'Network Error') {
            setError("Cannot connect to the server. Please check if the backend is running.");
          } else {
            setError(booksError.response?.data?.detail || booksError.message || 'Failed to fetch issued books.');
          }
          setIssuedBooks([]);
        }
      }
    } catch (err) {
      console.error("Error in fetchIssuedBooks:", err);
      setError(err.response?.data?.detail || err.message || 'Failed to fetch issued books.');
      setIssuedBooks([]);
    } finally {
      setLoading(false);
    }
  }, [studentId, studentExists]);

  useEffect(() => {
    if (studentId) {
      fetchIssuedBooks();
    }
  }, [studentId, fetchIssuedBooks]);

  const handleReturnBook = async (issueId, bookTitle) => {
    if (window.confirm(`Are you sure you want to return "${bookTitle}"?`)) {
      setIsReturning(issueId);
      setReturnError(null);
      try {
        await apiClient.put(`/issues/${issueId}/return`);
        // Re-fetch the list of issued books to show updated status
        fetchIssuedBooks(); 
        // Could also show a temporary success message
      } catch (err) {
        console.error("Error returning book:", err);
        setReturnError(err.response?.data?.detail || err.message || 'Failed to return book.');
      } finally {
        setIsReturning(null);
      }
    }
  };

  if (loading) return (
    <ResponsiveContainer>
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center">
          <svg className="animate-spin h-8 w-8 text-gold mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          </svg>
          <div>
            <h2 className="text-2xl font-playfair font-bold text-navy mb-4">Retrieving Issued Books...</h2>
            <p className="text-brown font-source-serif mb-6">Please wait while we fetch the student's borrowing records.</p>
          </div>
        </div>
      </div>
    </ResponsiveContainer>
  );
  
  if (!studentExists) {
    return (
      <ResponsiveContainer className="py-8">
        <div className="card-classic p-8">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-amber-600 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h2 className="text-2xl font-playfair font-bold text-navy mb-4">Student Not Found</h2>
              <p className="text-brown font-source-serif mb-6">Student with ID {studentId} does not exist in our records.</p>
              <div className="flex space-x-4">
                <Link to="/students" className="btn-primary inline-flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  View Student Registry
                </Link>
              </div>
            </div>
          </div>
        </div>
      </ResponsiveContainer>
    );
  }
  
  if (error) return (
    <ResponsiveContainer>
      <div className="py-8">
        <div className="card-classic p-8">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-burgundy mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h2 className="text-2xl font-playfair font-bold text-navy mb-4">Error Retrieving Records</h2>
              <p className="text-brown font-source-serif mb-6">{error}</p>
              <div className="flex space-x-4">
                <button 
                  onClick={() => fetchIssuedBooks()} 
                  className="btn-primary inline-flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Retry
                </button>
                <Link to="/students" className="btn-secondary inline-flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Return to Student Registry
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ResponsiveContainer>
  );
  
  if (returnError) return (
    <ResponsiveContainer>
      <div className="py-8">
        <div className="card-classic p-8">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-burgundy mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h2 className="text-2xl font-playfair font-bold text-navy mb-4">Book Return Error</h2>
              <p className="text-brown font-source-serif mb-6">{returnError}</p>
              <div className="flex space-x-4">
                <button 
                  onClick={() => fetchIssuedBooks()} 
                  className="btn-primary inline-flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ResponsiveContainer>
    );
  
  if (returnError) return (
    <ResponsiveContainer className="py-8">
      <div className="card-classic p-8">
        <div className="flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-burgundy mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h2 className="text-2xl font-playfair font-bold text-navy mb-4">Book Return Error</h2>
            <p className="text-brown font-source-serif mb-6">{returnError}</p>
            <button 
              onClick={() => fetchIssuedBooks()} 
              className="btn-primary inline-flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reload List
            </button>
          </div>
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
            <h1 className="text-3xl font-playfair font-bold text-navy mb-2">Student Borrowing Record</h1>
            <div className="h-1 w-24 bg-gold"></div>
            <p className="text-brown font-cormorant text-lg mt-2">{studentName || `Student ${studentId}`}</p>
          </div>
          <Link 
            to="/students" 
            className="inline-flex items-center font-cormorant text-navy hover:text-burgundy transition-colors duration-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Return to Student Registry
          </Link>
        </div>
        
        {/* Decorative corner elements */}
        <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-gold/20 -mt-2 -mr-2"></div>
        <div className="absolute bottom-0 left-0 w-20 h-20 border-b-2 border-l-2 border-gold/20 -mb-2 -ml-2"></div>
      </div>

      {/* No books message */}
      {issuedBooks.length === 0 && (
        <div className="card-classic p-8 text-center">
          <div className="flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-navy/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h2 className="text-2xl font-playfair font-bold text-navy mb-4">No Active Borrowings</h2>
            <p className="text-brown font-source-serif mb-6">This student currently has no books checked out from the library.</p>
            <Link to="/issue-book" className="btn-primary inline-flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Issue a Book
            </Link>
          </div>
        </div>
      )}

      {/* Books table with premium styling */}
      {issuedBooks.length > 0 && (
        <div className="card-classic overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-playfair font-bold text-navy mb-6 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-burgundy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
              Borrowed Books
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gold/20 bg-cream/30">
                  <th className="px-6 py-4 text-left font-cormorant font-semibold text-navy">Book Title</th>
                  <th className="px-6 py-4 text-left font-cormorant font-semibold text-navy">ISBN</th>
                  <th className="px-6 py-4 text-left font-cormorant font-semibold text-navy">Issue Date</th>
                  <th className="px-6 py-4 text-left font-cormorant font-semibold text-navy">Expected Return</th>
                  <th className="px-6 py-4 text-left font-cormorant font-semibold text-navy">Status</th>
                  <th className="px-6 py-4 text-left font-cormorant font-semibold text-navy">Actions</th>
                </tr>
              </thead>
              <tbody>
                {issuedBooks.map((issue, index) => (
                  <tr 
                    key={issue.id} 
                    className={`border-b border-gold/10 ${index % 2 === 0 ? 'bg-white' : 'bg-cream/20'} ${issue.is_overdue ? 'bg-red-50/70' : ''}`}
                  >
                    <td className="px-6 py-4 font-source-serif text-brown">
                      {issue.book?.title || 'N/A'}
                    </td>
                    <td className="px-6 py-4 font-source-serif text-brown/80">
                      {issue.book?.isbn || 'N/A'}
                    </td>
                    <td className="px-6 py-4 font-source-serif text-brown/80">
                      {new Date(issue.issue_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-source-serif text-brown/80">
                      {new Date(issue.expected_return_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-cormorant font-semibold">
                      {issue.is_returned ? (
                        <span className="inline-flex items-center text-emerald-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Returned ({new Date(issue.actual_return_date).toLocaleDateString()})
                        </span>
                      ) : issue.is_overdue ? (
                        <span className="inline-flex items-center text-burgundy">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Overdue
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-amber-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          Issued
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {!issue.is_returned && (
                        <button
                          onClick={() => handleReturnBook(issue.id, issue.book?.title || 'this book')}
                          disabled={isReturning === issue.id}
                          className={`inline-flex items-center text-sm px-3 py-1 rounded-md ${isReturning === issue.id ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-navy/10 text-navy hover:bg-navy/20 transition-colors'}`}
                        >
                          {isReturning === issue.id ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-navy" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Processing
                            </>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                              </svg>
                              Return Book
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </ResponsiveContainer>
  );
}

export default StudentIssuedBooksPage; 