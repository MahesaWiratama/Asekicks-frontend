import { useEffect, useState } from 'react'

// Field form yang dipakai bersama oleh halaman Tambah dan Edit produk.
export default function ProductFormFields({ formData, setFormData, errors, categories, currentImageUrl }) {
  const [preview, setPreview] = useState('')

  // Pratinjau gambar baru; dibersihkan agar tidak bocor memori
  useEffect(() => {
    if (!(formData.img instanceof File)) {
      setPreview('')
      return undefined
    }
    const url = URL.createObjectURL(formData.img)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [formData.img])

  const handleChange = (e) => {
    const { name, value, files } = e.target
    setFormData((prev) => ({ ...prev, [name]: files ? files[0] : value }))
  }

  const shownImage = preview || currentImageUrl

  return (
    <>
      <div className="field">
        <label htmlFor="name">Nama Produk</label>
        <input id="name" name="name" value={formData.name} onChange={handleChange} />
        {errors.name && <small className="error">{errors.name[0]}</small>}
      </div>

      <div className="field">
        <label htmlFor="category_id">Kategori</label>
        <select id="category_id" name="category_id" value={formData.category_id} onChange={handleChange}>
          <option value="">-- Pilih Kategori --</option>
          {categories.map((c) => (
            <option key={c.category_id} value={c.category_id}>{c.category}</option>
          ))}
        </select>
        {errors.category_id && <small className="error">{errors.category_id[0]}</small>}
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="price">Harga (Rp)</label>
          <input id="price" name="price" type="number" min="0" value={formData.price} onChange={handleChange} />
          {errors.price && <small className="error">{errors.price[0]}</small>}
        </div>
        <div className="field">
          <label htmlFor="stock">Stok</label>
          <input id="stock" name="stock" type="number" min="0" value={formData.stock} onChange={handleChange} />
          {errors.stock && <small className="error">{errors.stock[0]}</small>}
        </div>
      </div>

      <div className="field">
        <label htmlFor="description">Deskripsi</label>
        <textarea id="description" name="description" rows="3" value={formData.description} onChange={handleChange} />
        {errors.description && <small className="error">{errors.description[0]}</small>}
      </div>

      <div className="field">
        <label htmlFor="img">Gambar</label>
        <input id="img" name="img" type="file" accept="image/*" onChange={handleChange} />
        {errors.img && <small className="error">{errors.img[0]}</small>}
        {shownImage && <img className="preview" src={shownImage} alt="Pratinjau produk" />}
      </div>
    </>
  )
}
