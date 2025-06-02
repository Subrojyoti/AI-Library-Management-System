import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../services/apiClient';
import ResponsiveContainer from '../components/ResponsiveContainer';

function AddStudentPage() {
  const navigate = useNavigate();
  const [studentData, setStudentData] = useState({
    name: '',
    roll_number: '',
    department: '',
    semester: '', // Consider if this should be a number
    phone: '',
    email: ''
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    // Convert semester to number if it's the semester field
    const val = name === 'semester' && value !== '' ? parseInt(value, 10) : value;
    setStudentData(prevData => ({
      ...prevData,
      [name]: val
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Basic validation (more can be added)
    if (!studentData.name || !studentData.roll_number || !studentData.department || studentData.semester === '' || !studentData.phone || !studentData.email) {
        setError("All fields are required.");
        setLoading(false);
        return;
    }
    if (isNaN(studentData.semester) || studentData.semester <=0 ) {
        setError("Semester must be a positive number.");
        setLoading(false);
        return;
    }

    try {
      const payload = {
        ...studentData,
        semester: parseInt(studentData.semester, 10) // Ensure semester is an int
      };
      const response = await apiClient.post('/students/', payload);
      setSuccess(`Student "${response.data.name}" added successfully! ID: ${response.data.id}`);
      setTimeout(() => {
        navigate('/students'); // Redirect to students list
      }, 1500);
      setStudentData({ name: '', roll_number: '', department: '', semester: '', phone: '', email: '' });
    } catch (err) {
      console.error("Error adding student:", err.response ? err.response.data : err.message);
      setError(err.response?.data?.detail || err.message || 'Failed to add student.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResponsiveContainer>
      {/* Header with decorative elements */}
      <div className="relative mb-10">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-playfair font-bold text-navy mb-2">Add New Student</h1>
            <div className="h-1 w-24 bg-gold"></div>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Student Information
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-cormorant font-semibold text-navy">
                  Full Name <span className="text-burgundy">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={studentData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-cream border border-gold/30 rounded-md focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-all duration-300 font-source-serif text-brown"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="roll_number" className="block text-sm font-cormorant font-semibold text-navy">
                  Roll Number <span className="text-burgundy">*</span>
                </label>
                <input
                  type="text"
                  id="roll_number"
                  name="roll_number"
                  value={studentData.roll_number}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-cream border border-gold/30 rounded-md focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-all duration-300 font-source-serif text-brown"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="department" className="block text-sm font-cormorant font-semibold text-navy">
                  Department <span className="text-burgundy">*</span>
                </label>
                <input
                  type="text"
                  id="department"
                  name="department"
                  value={studentData.department}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-cream border border-gold/30 rounded-md focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-all duration-300 font-source-serif text-brown"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="semester" className="block text-sm font-cormorant font-semibold text-navy">
                  Semester <span className="text-burgundy">*</span>
                </label>
                <input
                  type="number"
                  id="semester"
                  name="semester"
                  value={studentData.semester}
                  onChange={handleChange}
                  min="1"
                  required
                  className="w-full px-4 py-2 bg-cream border border-gold/30 rounded-md focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-all duration-300 font-source-serif text-brown"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-cormorant font-semibold text-navy">
                  Phone Number <span className="text-burgundy">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={studentData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-cream border border-gold/30 rounded-md focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-all duration-300 font-source-serif text-brown"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-cormorant font-semibold text-navy">
                  Email Address <span className="text-burgundy">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={studentData.email}
                  onChange={handleChange}
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
                    Register New Student
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

export default AddStudentPage;