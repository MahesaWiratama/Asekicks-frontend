import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useProducts } from '../../utils/ProductContext.jsx'
import { formatRupiah } from '../../utils/format.js'
import ProductSearchBar from '../../components/ProductSearchBar.jsx'
import Pagination from '../../components/Pagination.jsx'
import { confirmDeleteToast } from '../../components/confirmDeleteToast.jsx'

const PAGE_LIMIT = 5

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { getProducts, getCategories, deleteProduct } = useProducts()

  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ category_id: '', keyword: '' })

  // Kategori untuk dropdown filter
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: getCategories })

  // Produk: query key berisi page + filter, sehingga berubah otomatis => data diambil ulang
  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['products', page, filters.category_id, filters.keyword],
    queryFn: () => getProducts({ page, limit: PAGE_LIMIT, ...filters }),
    placeholderData: keepPreviousData,
  })

  const items = data?.items ?? []
  const lastPage = data?.lastPage ?? 1

  const handleSearch = (next) => {
    setFilters(next)
    setPage(1) // pencarian baru selalu mulai dari halaman 1
  }

  const handleDelete = (product) => {
    confirmDeleteToast(product.name, () => {
      deleteProduct.mutate(product.id, {
        onSuccess: () => {
          toast.success('Produk berhasil dihapus')
          // bila yang dihapus adalah satu-satunya item di halaman terakhir, mundur satu halaman
          if (items.length === 1 && page > 1) setPage(page - 1)
        },
        onError: () => toast.error('Gagal menghapus produk'),
      })
    })
  }

  return (
    <div className="card">
      <h1 className="page-title">Dashboard Produk</h1>

      <div className="toolbar">
        <ProductSearchBar categories={categories} onSearch={handleSearch} />
        <Link to="/admin/add-product" className="btn btn-green">+ Tambah Produk</Link>
      </div>

      {isLoading && <p className="muted">Memuat data...</p>}
      {isError && <p className="error">Gagal memuat produk: {error.message}. Pastikan API berjalan.</p>}

      {!isLoading && !isError && (
        <>
          <div className={`table-wrap ${isFetching ? 'fetching' : ''}`}>
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama</th>
                  <th>Kategori</th>
                  <th>Harga</th>
                  <th>Stok</th>
                  <th>Gambar</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td colSpan="7" className="empty">Produk tidak ditemukan.</td>
                  </tr>
                )}
                {items.map((p, i) => (
                  <tr key={p.id}>
                    <td>{(page - 1) * PAGE_LIMIT + i + 1}</td>
                    <td>{p.name}</td>
                    <td>{p.category?.name ?? '-'}</td>
                    <td>{formatRupiah(p.price)}</td>
                    <td>{p.stock}</td>
                    <td>{p.img_url ? <img className="thumb" src={p.img_url} alt={p.name} /> : '-'}</td>
                    <td className="actions">
                      <button className="btn btn-yellow btn-sm" onClick={() => navigate(`/admin/edit-product/${p.id}`)}>
                        Edit
                      </button>
                      <button className="btn btn-red btn-sm" disabled={deleteProduct.isPending} onClick={() => handleDelete(p)}>
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination page={page} lastPage={lastPage} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
