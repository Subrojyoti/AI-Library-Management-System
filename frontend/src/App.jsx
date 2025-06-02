// frontend/src/App.jsx
import { Routes, Route, Link } from 'react-router-dom'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import BooksPage from './pages/BooksPage'
import BookDetailPage from './pages/BookDetailPage'
import AddBookPage from './pages/AddBookPage'
import EditBookPage from './pages/EditBookPage'
import StudentsPage from './pages/StudentsPage'
import AddStudentPage from './pages/AddStudentPage'
import EditStudentPage from './pages/EditStudentPage'
import StudentIssuedBooksPage from './pages/StudentIssuedBooksPage'
import IssueBookPage from './pages/IssueBookPage'
import AiAssistantPage from './pages/AiAssistantPage'

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      {/* Using dynamic padding class that will adapt better to different zoom levels */}
      <main className="flex-grow" style={{ paddingTop: 'var(--navbar-height, 160px)' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/books" element={<BooksPage />} />
          <Route path="/books/:bookId" element={<BookDetailPage />} />
          <Route path="/add-book" element={<AddBookPage />} />
          <Route path="/books/:bookId/edit" element={<EditBookPage />} />
          <Route path="/edit-book/:bookId" element={<EditBookPage />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/add-student" element={<AddStudentPage />} />
          <Route path="/students/:studentId/edit" element={<EditStudentPage />} />
          <Route path="/students/:studentId/issued-books" element={<StudentIssuedBooksPage />} />
          <Route path="/issue-book" element={<IssueBookPage />} />
          <Route path="/ai-assistant" element={<AiAssistantPage />} />
        </Routes>
      </main>
      <footer className="bg-navy-light py-6 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-navy via-gold to-navy"></div>
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center">
            <div className="mb-4">
              <Link to="/" className="flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="font-playfair text-xl font-bold text-gold">College Library</span>
              </Link>
            </div>
            <p className="font-cormorant text-cream mb-2">© {new Date().getFullYear()} College Library Management System</p>
            <p className="font-source-serif text-xs text-cream/70">Preserving knowledge and fostering learning</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App;