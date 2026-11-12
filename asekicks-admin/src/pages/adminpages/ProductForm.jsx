import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useProducts } from '../../utils/ProductContext.jsx'
import ProductFormFields from '../../components/ProductFormFields.jsx'

export default function ProductForm() {
  const navigate = useNavigate()
  const { addProduct, getCategories } = useProducts()
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: getCategories })

  const [formData, setFormData] = useState({
    name: '', category_id: '', price: '', stock: '', description: '', img: null,
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErrors({})

    const body = new FormData()
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== '') body.append(key, value)
    })

    try {
      await addProduct(body)
      toast.success('Produk berhasil ditambahkan')
      setTimeout(() => navigate('/admin/dashboard'), 1000)
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

  return (
    <div className="card narrow">
      <h1 className="page-title">Tambah Produk</h1>
      <form onSubmit={handleSubmit} noValidate>
        <ProductFormFields
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          categories={categories}
        />
        <div className="form-actions">
          <button type="submit" className="btn btn-green" disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
          <button type="button" className="btn btn-light" onClick={() => navigate('/admin/dashboard')}>
            Batal
          </button>
        </div>
      </form>
    </div>
  )
}
