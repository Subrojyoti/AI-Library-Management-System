// frontend/src/components/BookCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';

function BookCard({ book, onDelete }) {
  return (
    <div className="card-classic group hover:shadow-lg transition-all duration-500 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-gold/20 -mt-2 -mr-2 z-0"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-gold/20 -mb-2 -ml-2 z-0"></div>
      
      <div className="p-6 relative z-10">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-playfair text-xl font-bold text-navy group-hover:text-burgundy transition-colors duration-300 flex-1 pr-2">
            {book.title}
          </h3>
          <span className="text-xs font-cormorant bg-navy/10 text-navy px-3 py-1 rounded-full">
            {book.isbn}
          </span>
        </div>
        
        <div className="mb-4">
          <p className="text-brown mb-2 font-source-serif">
            <span className="font-cormorant text-burgundy">Author:</span> {book.author}
          </p>
          <p className="text-brown mb-2 font-source-serif">
            <span className="font-cormorant text-burgundy">Publisher:</span> {book.publisher}
          </p>
          <p className="text-brown mb-2 font-source-serif">
            <span className="font-cormorant text-burgundy">Published:</span> {book.publishedYear}
          </p>
          <p className="text-brown mb-2 font-source-serif">
            <span className="font-cormorant text-burgundy">Available:</span> 
            <span className={book.available ? 'text-green-700' : 'text-red-700'}>
              {book.available ? 'Yes' : 'No'}
            </span>
          </p>
        </div>
        
        <div className="flex justify-between items-center pt-4 border-t border-gold/20">
          <Link 
            to={`/books/${book._id}`}
            className="btn-outline text-sm py-2 px-4"
          >
            View Details
          </Link>
          
          <div className="flex space-x-2">
            <Link 
              to={`/books/${book._id}/edit`}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-navy/10 text-navy hover:bg-navy hover:text-gold transition-colors duration-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Link>
            
            <button 
              onClick={() => onDelete(book._id)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-burgundy/10 text-burgundy hover:bg-burgundy hover:text-white transition-colors duration-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookCard;