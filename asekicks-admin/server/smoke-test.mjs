// Uji cepat kontrak API tiruan. Jalankan server dulu, lalu:  npm run test:api
// Alamat lain:  BASE=http://127.0.0.1:8099/api node server/smoke-test.mjs
const BASE = process.env.BASE || 'http://127.0.0.1:8000/api'
let failed = 0
const check = (name, ok, extra = '') => {
  if (!ok) failed++
  console.log(`${ok ? 'OK   ' : 'GAGAL'} ${name}${extra ? '  ' + extra : ''}`)
}
const json = async (res) => ({ status: res.status, body: await res.json().catch(() => null) })

// 0. login (akun seeder Laravel) dan akses tanpa token
let r = await json(await fetch(`${BASE}/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  body: JSON.stringify({ email: 'test@example.com', password: 'salah' }),
}))
check('login dengan password salah -> 422 + errors.email', r.status === 422 && Array.isArray(r.body?.errors?.email))
r = await json(await fetch(`${BASE}/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
}))
check('login admin -> 200 + token Bearer + user.role admin', r.status === 200 && !!r.body?.token && r.body?.user?.role === 'admin')
const AUTH = { Authorization: `Bearer ${r.body.token}`, Accept: 'application/json' }
r = await json(await fetch(`${BASE}/products`, { method: 'POST', body: new FormData() }))
check('POST /products tanpa token -> 401', r.status === 401)

// 1. kategori
r = await json(await fetch(`${BASE}/categories`))
check('GET /categories mengembalikan array dengan category_id dan category', r.status === 200 && Array.isArray(r.body) && r.body[0].category_id && r.body[0].category, `(${r.body?.length} kategori)`)

// 2. pagination
r = await json(await fetch(`${BASE}/products?page=1&per_page=5`))
check('GET /products?page=1&per_page=5 -> 5 data + meta', r.status === 200 && r.body.data.length === 5 && r.body.meta.current_page === 1 && r.body.meta.last_page >= 2, `(total ${r.body?.meta?.total}, last_page ${r.body?.meta?.last_page})`)
const firstPageIds = r.body.data.map((p) => p.id)
r = await json(await fetch(`${BASE}/products?page=2&per_page=5`))
check('GET /products?page=2 -> data berbeda dari halaman 1', r.status === 200 && r.body.data.length > 0 && !r.body.data.some((p) => firstPageIds.includes(p.id)))

// 3. filter
r = await json(await fetch(`${BASE}/products?page=1&per_page=10&category_id=3`))
check('filter category_id=3 -> semua data berkategori 3', r.body.data.length > 0 && r.body.data.every((p) => p.category_id === 3 && p.category?.name))
r = await json(await fetch(`${BASE}/products?search=SALOMON&per_page=10`))
check('filter keyword=SALOMON (tidak peka huruf besar/kecil)', r.body.data.length > 0 && r.body.data.every((p) => /salomon/i.test(p.name)), `(${r.body.data.length} hasil)`)
r = await json(await fetch(`${BASE}/products?search=tidak-ada-produk-ini`))
check('keyword tanpa hasil -> data kosong, last_page 1', r.body.data.length === 0 && r.body.meta.last_page === 1)

// 4. gambar contoh bisa diambil
r = await fetch((await json(await fetch(`${BASE}/products/1`))).body.data.img_url)
check('img_url produk 1 dapat dibuka sebagai gambar', r.status === 200 && r.headers.get('content-type').startsWith('image/'), `(${r.headers.get('content-type')})`)

// 5. validasi 422 saat form kosong
let form = new FormData()
r = await json(await fetch(`${BASE}/products`, { method: 'POST', body: form, headers: AUTH }))
check('POST /products kosong -> 422 dengan pesan per field', r.status === 422 && ['name', 'category_id', 'price', 'stock', 'img'].every((k) => Array.isArray(r.body.errors?.[k])), JSON.stringify(Object.keys(r.body.errors || {})))

// 6. file bukan gambar ditolak
form = new FormData()
form.append('name', 'Sepatu Uji'); form.append('category_id', '1'); form.append('price', '1000'); form.append('stock', '1')
form.append('img', new File(['bukan gambar'], 'a.txt', { type: 'text/plain' }))
r = await json(await fetch(`${BASE}/products`, { method: 'POST', body: form, headers: AUTH }))
check('upload .txt ditolak -> 422 "File harus berupa gambar"', r.status === 422 && r.body.errors.img?.[0] === 'File harus berupa gambar')

// 7. create -> read -> update (POST ?_method=PUT) -> delete
const png = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='), (c) => c.charCodeAt(0))
form = new FormData()
form.append('name', 'Sepatu Uji Coba'); form.append('category_id', '2'); form.append('price', '123000'); form.append('stock', '7'); form.append('description', 'dibuat oleh smoke test')
form.append('img', new File([png], 'uji.png', { type: 'image/png' }))
r = await json(await fetch(`${BASE}/products`, { method: 'POST', body: form, headers: AUTH }))
check('POST /products valid -> 201 + data baru', r.status === 201 && r.body.data.id && r.body.data.img_url.includes('/uploads/u-'))
const id = r.body.data?.id

r = await json(await fetch(`${BASE}/products/${id}`))
check('GET /products/:id -> {data} dengan category.name', r.status === 200 && r.body.data.name === 'Sepatu Uji Coba' && r.body.data.category.name === 'Running')

form = new FormData()
form.append('name', 'Sepatu Uji Diubah'); form.append('category_id', '1'); form.append('price', '150000'); form.append('stock', '9'); form.append('description', 'diubah')
r = await json(await fetch(`${BASE}/products/${id}?_method=PUT`, { method: 'POST', body: form, headers: AUTH }))
check('POST /products/:id?_method=PUT tanpa gambar baru -> 200 (gambar lama dipertahankan)', r.status === 200 && r.body.data.name === 'Sepatu Uji Diubah' && r.body.data.stock === 9 && r.body.data.img_url)

r = await json(await fetch(`${BASE}/products/${id}`, { method: 'DELETE', headers: AUTH }))
check('DELETE /products/:id -> 200', r.status === 200)
r = await json(await fetch(`${BASE}/products/${id}`))
check('setelah dihapus, GET /products/:id -> 404', r.status === 404)

// 8. CORS preflight
const pre = await fetch(`${BASE}/products`, { method: 'OPTIONS', headers: { Origin: 'http://localhost:5173', 'Access-Control-Request-Method': 'POST' } })
check('preflight OPTIONS -> 204 dengan header CORS', pre.status === 204 && pre.headers.get('access-control-allow-origin') === '*')

console.log(failed ? `\n${failed} pengujian gagal` : '\nSemua pengujian lolos')
process.exit(failed ? 1 : 0)
