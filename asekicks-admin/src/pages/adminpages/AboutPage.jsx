export default function AboutPage() {
  return (
    <div className="card">
      <h1 className="page-title">About</h1>
      <p className="muted">
        Asekicks Admin adalah halaman pengelolaan produk untuk toko sepatu Asekicks. Aplikasi ini terhubung ke
        REST API melalui Axios, mengelola data dengan React Query, menampilkan notifikasi dengan React Hot Toast,
        dan membagikan fungsi API ke seluruh halaman melalui ProductContext.
      </p>
      <ul className="about-list">
        <li>CRUD produk: tambah, lihat, ubah, dan hapus (dengan konfirmasi)</li>
        <li>Relasi kategori melalui dropdown yang datanya diambil dari API</li>
        <li>Pencarian nama produk, filter kategori, dan pagination</li>
      </ul>
    </div>
  )
}
