'use client';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const delta = 2;

    for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) {
      pages.push(i);
    }

    if (currentPage - delta > 2) {
      pages.unshift('...');
      pages.unshift(1);
    } else if (currentPage - delta === 2) {
      pages.unshift(1);
    }

    if (currentPage + delta < totalPages - 1) {
      pages.push('...');
      pages.push(totalPages);
    } else if (currentPage + delta === totalPages - 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <nav aria-label="Page navigation" className="d-flex justify-content-center mt-5">
      <ul className="pagination">
        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
          <button
            className="page-link"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
        </li>

        {getPageNumbers().map((page, idx) => (
          <li
            key={idx}
            className={`page-item ${page === currentPage ? 'active' : ''} ${typeof page === 'string' ? 'disabled' : ''}`}
          >
            {typeof page === 'string' ? (
              <span className="page-link">{page}</span>
            ) : (
              <button
                className="page-link"
                onClick={() => onPageChange(page)}
                disabled={page === currentPage}
              >
                {page}
              </button>
            )}
          </li>
        ))}

        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
          <button
            className="page-link"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </li>
      </ul>
    </nav>
  );
}
