// frontend/src/pages/StudentsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom'; // For Add Student button
import apiClient from '../services/apiClient';

function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // Or make configurable
  const [totalPages, setTotalPages] = useState(1);

  // Search and filter states
  const [searchName, setSearchName] = useState('');
  const [searchRollNumber, setSearchRollNumber] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterSemester, setFilterSemester] = useState('');

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (searchName) params.append('name', searchName);
      if (searchRollNumber) params.append('roll_number', searchRollNumber);
      if (searchPhone) params.append('phone', searchPhone);
      if (filterDepartment) params.append('department', filterDepartment);
      if (filterSemester) params.append('semester', filterSemester);

      const response = await apiClient.get(`/students/?${params.toString()}`);
      // console.log('Students API Response:', response.data); // Add this for debugging
      
      // Update to match backend structure - students should be in a field called students, not items
      setStudents(response.data.students || []);
      
      // Calculate total pages from total count and limit
      const total = response.data.total || 0;
      const calculatedPages = Math.ceil(total / limit);
      setTotalPages(calculatedPages || 1);
    } catch (err) {
      console.error("Error fetching students:", err);
      setError(err.message || "Failed to fetch students. Ensure backend is running and CORS is configured.");
      setStudents([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchName, searchRollNumber, searchPhone, filterDepartment, filterSemester]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Reset page to 1 when search/filter terms change
  useEffect(() => {
    setPage(1);
  }, [searchName, searchRollNumber, searchPhone, filterDepartment, filterSemester]);

  const handleSearchFilterChange = () => {
    // fetchStudents is called by useEffect due to dependency changes
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    fetchStudents(); // Explicitly fetch on form submit
  };

  if (error) return <p className="text-center text-red-600">Error: {error}</p>;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header with decorative elements */}
      <div className="relative mb-10">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-playfair font-bold text-navy mb-2">Student Registry</h1>
            <div className="h-1 w-24 bg-gold"></div>
          </div>
          <Link 
            to="/add-student" 
            className="btn-primary flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Register New Student
          </Link>
        </div>
        
        {/* Decorative corner elements */}
        <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-gold/20 -mt-2 -mr-2"></div>
        <div className="absolute bottom-0 left-0 w-20 h-20 border-b-2 border-l-2 border-gold/20 -mb-2 -ml-2"></div>
      </div>

      {/* Search and Filter Form with premium styling */}
      <form onSubmit={handleSubmit} className="mb-10 card-classic relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent"></div>
        <div className="p-6">
          <h2 className="text-xl font-playfair font-bold text-navy mb-6 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-burgundy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Student Search
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <div className="space-y-2">
              <label className="block text-sm font-cormorant font-semibold text-navy">Name</label>
              <input 
                type="text" 
                placeholder="Enter student name..." 
                value={searchName} 
                onChange={e => setSearchName(e.target.value)} 
                className="w-full px-4 py-2 bg-cream border border-gold/30 rounded-md focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-all duration-300 font-source-serif text-brown" 
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-cormorant font-semibold text-navy">Roll Number</label>
              <input 
                type="text" 
                placeholder="Enter roll number..." 
                value={searchRollNumber} 
                onChange={e => setSearchRollNumber(e.target.value)} 
                className="w-full px-4 py-2 bg-cream border border-gold/30 rounded-md focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-all duration-300 font-source-serif text-brown" 
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-cormorant font-semibold text-navy">Phone</label>
              <input 
                type="text" 
                placeholder="Enter phone number..." 
                value={searchPhone} 
                onChange={e => setSearchPhone(e.target.value)} 
                className="w-full px-4 py-2 bg-cream border border-gold/30 rounded-md focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-all duration-300 font-source-serif text-brown" 
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-cormorant font-semibold text-navy">Department</label>
              <input 
                type="text" 
                placeholder="Enter department..." 
                value={filterDepartment} 
                onChange={e => setFilterDepartment(e.target.value)} 
                className="w-full px-4 py-2 bg-cream border border-gold/30 rounded-md focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-all duration-300 font-source-serif text-brown" 
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-cormorant font-semibold text-navy">Semester</label>
              <input 
                type="number" 
                placeholder="Enter semester..." 
                value={filterSemester} 
                onChange={e => setFilterSemester(e.target.value)} 
                className="w-full px-4 py-2 bg-cream border border-gold/30 rounded-md focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-all duration-300 font-source-serif text-brown" 
              />
            </div>
          </div>
          
          <div className="text-right">
            <button 
              type="submit"
              className="btn-secondary flex items-center ml-auto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search Records
            </button>
          </div>
        </div>
      </form>

      {/* Loading state with premium styling */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold mb-4"></div>
          <p className="font-cormorant text-lg text-navy">Retrieving student records...</p>
        </div>
      )}

      {/* Empty state with premium styling */}
      {!loading && students && students.length === 0 && (
        <div className="text-center py-12 card-classic">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gold/50 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <p className="font-cormorant text-xl text-navy mb-2">No student records found</p>
          <p className="font-source-serif text-brown-light">Please refine your search criteria or register new students.</p>
        </div>
      )}

      {/* Student table with premium styling */}
      {!loading && students && students.length > 0 && (
        <div className="card-classic overflow-hidden mb-10">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-navy/5 border-b border-gold/20">
                  <th className="px-6 py-4 text-left text-xs font-cormorant font-semibold text-navy uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-cormorant font-semibold text-navy uppercase tracking-wider">Roll Number</th>
                  <th className="px-6 py-4 text-left text-xs font-cormorant font-semibold text-navy uppercase tracking-wider">Department</th>
                  <th className="px-6 py-4 text-left text-xs font-cormorant font-semibold text-navy uppercase tracking-wider">Semester</th>
                  <th className="px-6 py-4 text-left text-xs font-cormorant font-semibold text-navy uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-cormorant font-semibold text-navy uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-4 text-left text-xs font-cormorant font-semibold text-navy uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/10">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-cream/50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-libre font-medium text-burgundy">{student.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-source-serif text-brown">{student.roll_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-source-serif text-brown">{student.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-source-serif text-brown">{student.semester}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-source-serif text-brown">{student.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-source-serif text-brown">{student.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link 
                          to={`/students/${student.id}/issued-books`} 
                          className="inline-flex items-center justify-center px-3 py-1 border border-gold/30 rounded-md text-xs font-cormorant text-navy hover:bg-navy hover:text-gold transition-colors duration-300"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          View Issued
                        </Link>
                        <Link 
                          to={`/students/${student.id}/edit`} 
                          className="inline-flex items-center justify-center px-3 py-1 border border-burgundy/30 rounded-md text-xs font-cormorant text-burgundy hover:bg-burgundy hover:text-white transition-colors duration-300"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls with premium styling */}
      {!loading && students && totalPages > 1 && (
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
    </div>
  );
}

export default StudentsPage;