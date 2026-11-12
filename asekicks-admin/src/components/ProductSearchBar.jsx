import { useState } from 'react'

// Panel Search & Filter: pilih kategori + ketik kata kunci, lalu klik "Cari".
// Nilai input disimpan lokal dan baru dikirim ke induk saat tombol Cari ditekan.
export default function ProductSearchBar({ categories, initialCategory = '', initialKeyword = '', onSearch }) {
  const [category, setCategory] = useState(initialCategory)
  const [keyword, setKeyword] = useState(initialKeyword)

  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch({ category_id: category, keyword })
  }

  const handleReset = () => {
    setCategory('')
    setKeyword('')
    onSearch({ category_id: '', keyword: '' })
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter kategori">
        <option value="">Semua Kategori</option>
        {categories.map((c) => (
          <option key={c.category_id} value={c.category_id}>{c.category}</option>
        ))}
      </select>

      <input
        type="text"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="Cari produk..."
        aria-label="Kata kunci"
      />

      <button type="submit" className="btn btn-blue">Cari</button>
      <button type="button" className="btn btn-light" onClick={handleReset}>Reset</button>
    </form>
  )
}
