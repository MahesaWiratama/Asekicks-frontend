import { getPageWindow } from '../utils/pagination.js'

// Kontrol pagination: Sebelumnya | 1 2 3 4 5 | Berikutnya
export default function Pagination({ page, lastPage, onPageChange }) {
  if (lastPage <= 1) return null
  const pages = getPageWindow(page, lastPage)

  return (
    <nav className="pagination" aria-label="Pagination">
      <button className="page-btn" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Sebelumnya
      </button>

      {pages.map((p) => (
        <button
          key={p}
          className={`page-btn ${p === page ? 'active' : ''}`}
          aria-current={p === page ? 'page' : undefined}
          onClick={() => onPageChange(p)}
        >
          {p}
        </button>
      ))}

      <button className="page-btn" disabled={page >= lastPage} onClick={() => onPageChange(page + 1)}>
        Berikutnya
      </button>
    </nav>
  )
}
