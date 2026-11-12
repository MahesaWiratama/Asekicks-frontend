import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useProducts } from '../../utils/ProductContext.jsx'
import ProductFormFields from '../../components/ProductFormFields.jsx'

export default function ProductEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getProductById, updateProduct, getCategories } = useProducts()
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: getCategories })

  const [formData, setFormData] = useState({
    name: '', category_id: '', price: '', stock: '', description: '', img: null,
  })
  const [currentImageUrl, setCurrentImageUrl] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Ambil data produk lama untuk mengisi form
  useEffect(() => {
    let cancelled = false
    getProductById(id)
      .then((p) => {
        if (cancelled) return
        setFormData({
          name: p.name ?? '',
          category_id: p.category_id ?? p.category?.id ?? '',
          price: p.price ?? '',
          stock: p.stock ?? '',
          description: p.description ?? '',
          img: null,
        })
        setCurrentImageUrl(p.img_url ?? '')
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        toast.error('Produk tidak ditemukan')
        navigate('/admin/dashboard')
      })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErrors({})

    const body = new FormData()
    body.append('name', formData.name)
    body.append('category_id', formData.category_id)
    body.append('price', formData.price)
    body.append('stock', formData.stock)
    body.append('description', formData.description)
    // gambar hanya dikirim bila admin memilih file baru
    if (formData.img instanceof File) body.append('img', formData.img)

    try {
      const response = await updateProduct(id, body)
      if (response.status === 200) {
        toast.success('Produk berhasil diperbarui')
        setTimeout(() => navigate('/admin/dashboard'), 1000)
      }
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors ?? {})
        toast.error('⚠️ Periksa kembali data yang dimasukkan.')
      } else {
        toast.error('Terjadi kesalahan pada server')
      }
      setSaving(false)
    }
  }

  if (loading) return <div className="card"><p className="muted">Memuat data...</p></div>

  return (
    <div className="card narrow">
      <h1 className="page-title">Edit Produk</h1>
      <form onSubmit={handleSubmit} noValidate>
        <ProductFormFields
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          categories={categories}
          currentImageUrl={currentImageUrl}
        />
        <div className="form-actions">
          <button type="submit" className="btn btn-green" disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
          <button type="button" className="btn btn-light" onClick={() => navigate('/admin/dashboard')}>
            Batal
          </button>
        </div>
      </form>
    </div>
  )
}
