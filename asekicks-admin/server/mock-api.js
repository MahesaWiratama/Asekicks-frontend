// API tiruan (mock) untuk Asekicks Admin. Tanpa dependensi, cukup Node 18+.
// Meniru kontrak API Laravel pada modul: /api/products (pagination + filter), /api/categories,
// upload gambar (multipart), validasi 422, dan override method POST ?_method=PUT.
//
// Jalankan:  npm run api      (default http://127.0.0.1:8000)

import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Readable } from 'node:stream'
import { randomBytes } from 'node:crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT || 8000)
const UPLOAD_DIR = path.join(__dirname, 'uploads')
const DB_FILE = process.env.DB_FILE || path.join(__dirname, 'db.json')
const MAX_IMAGE_BYTES = 2 * 1024 * 1024

fs.mkdirSync(UPLOAD_DIR, { recursive: true })

// ---------- data awal ----------
const now = () => new Date().toISOString()
const SEED = {
  nextId: 10,
  categories: [
    { category_id: 1, category: 'Sneakers' },
    { category_id: 2, category: 'Running' },
    { category_id: 3, category: 'Flatshoes' },
  ].map((c) => ({ ...c, created_at: now(), updated_at: now() })),
  products: [
    [1, 'Nike Air Max Plus SE', 1679200, 80, 1, 'nike-air-max-plus.avif', 'Sneakers Nike dengan sol berbantalan udara untuk kenyamanan sehari-hari.'],
    [2, 'Adidas Samba OG', 1899000, 8, 1, 'adidas-samba-og.avif', 'Sneakers klasik berwarna putih dengan strip hitam dan sol gum.'],
    [3, 'Puma Palermo', 1799000, 5, 1, 'puma-palermo.avif', 'Sneakers bergaya retro dengan kombinasi warna hitam, merah, dan krem.'],
    [4, 'Puma Speedcat', 1399000, 0, 1, 'puma-speedcat.webp', 'Sneakers bergaya motorsport berwarna merah dengan siluet ramping.'],
    [5, 'ASICS Gel-Kayano 14', 2150000, 4, 2, 'asics-gel-kayano-14.webp', 'Sepatu lari bergaya klasik dengan bantalan Gel untuk kenyamanan.'],
    [6, 'Salomon XT 6', 2799000, 6, 2, 'salomon-xt6.jpg', 'Sepatu trail running dengan sistem tali cepat dan cengkeraman kuat.'],
    [7, 'Salomon XT6 Goretex White Silver', 4399000, 20, 2, 'salomon-xt6-goretex-white.webp', 'Salomon XT6 versi Gore-Tex berwarna putih dan perak.'],
    [8, 'Nike Air Max Phenomena Women', 2759000, 0, 3, 'nike-air-max-phenomena.avif', 'Sepatu slip-on wanita berwarna hitam dengan sol udara.'],
    [9, 'Puma Speedcat Ballet Nova Women', 1249000, 9, 3, 'puma-speedcat-ballet-nova.avif', 'Sepatu flat wanita bergaya ballet dengan aksen metalik perak.'],
  ].map(([id, name, price, stock, category_id, img, description]) => ({
    id, name, price, stock, category_id, img, description, created_at: now(), updated_at: now(),
  })),
}

let db = fs.existsSync(DB_FILE) ? JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) : structuredClone(SEED)
const save = () => fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2))
if (!fs.existsSync(DB_FILE)) save()

// ---------- util ----------
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization, X-Requested-With',
}

function send(res, status, body) {
  if (body === null) {
    res.writeHead(status, CORS)
    return res.end()
  }
  res.writeHead(status, { ...CORS, 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
}

const MIME = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
  '.avif': 'image/avif', '.gif': 'image/gif',
}

function serveUpload(res, name) {
  const file = path.join(UPLOAD_DIR, path.basename(name)) // basename mencegah path traversal
  if (!fs.existsSync(file)) return send(res, 404, { message: 'File tidak ditemukan.' })
  res.writeHead(200, { ...CORS, 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'public, max-age=3600' })
  fs.createReadStream(file).pipe(res)
}

const toOutput = (p, host) => {
  const c = db.categories.find((x) => x.category_id === p.category_id)
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    stock: p.stock,
    description: p.description,
    category_id: p.category_id,
    category: c ? { id: c.category_id, name: c.category } : null,
    img_url: p.img ? `http://${host}/uploads/${p.img}` : null,
    created_at: p.created_at,
    updated_at: p.updated_at,
  }
}

async function readBody(req) {
  const type = req.headers['content-type'] || ''
  if (type.startsWith('multipart/form-data')) {
    // Node membawa parser multipart bawaan lewat Request.formData()
    const request = new Request(`http://${req.headers.host}${req.url}`, {
      method: 'POST',
      headers: { 'content-type': type },
      body: Readable.toWeb(req),
      duplex: 'half',
    })
    const form = await request.formData()
    const fields = {}
    const files = {}
    for (const [key, value] of form.entries()) {
      if (typeof value === 'string') fields[key] = value
      else files[key] = value
    }
    return { fields, files }
  }
  const chunks = []
  for await (const c of req) chunks.push(c)
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return { fields: {}, files: {} }
  try {
    return { fields: JSON.parse(raw), files: {} }
  } catch {
    return { fields: {}, files: {} }
  }
}

function validate(f, files, { creating }) {
  const e = {}
  const name = String(f.name ?? '').trim()
  if (!name) e.name = ['Nama produk wajib diisi']
  else if (name.length < 3) e.name = ['Nama produk minimal 3 karakter']

  if (f.category_id === undefined || f.category_id === null || f.category_id === '') e.category_id = ['Kategori wajib dipilih']
  else if (!db.categories.some((c) => String(c.category_id) === String(f.category_id))) e.category_id = ['Kategori tidak ditemukan']

  if (f.price === undefined || f.price === null || f.price === '') e.price = ['Harga produk wajib diisi']
  else if (!(Number(f.price) >= 0)) e.price = ['Harga harus berupa angka']

  if (f.stock === undefined || f.stock === null || f.stock === '') e.stock = ['Stok produk wajib diisi']
  else if (!Number.isInteger(Number(f.stock)) || Number(f.stock) < 0) e.stock = ['Stok harus berupa bilangan bulat']

  const img = files.img
  if (img && img.size > 0) {
    if (!String(img.type).startsWith('image/')) e.img = ['File harus berupa gambar']
    else if (img.size > MAX_IMAGE_BYTES) e.img = ['Ukuran gambar maksimal 2 MB']
  } else if (creating) {
    e.img = ['File harus berupa gambar']
  }
  return e
}

async function saveImage(file) {
  const ext = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/avif': '.avif', 'image/gif': '.gif' }[file.type] || '.img'
  const name = `u-${randomBytes(6).toString('hex')}${ext}`
  fs.writeFileSync(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()))
  return name
}

const removeUpload = (name) => {
  // hanya hapus file hasil unggahan (awalan "u-"), foto contoh tidak disentuh
  if (name && name.startsWith('u-')) fs.rmSync(path.join(UPLOAD_DIR, path.basename(name)), { force: true })
}

// ---------- login tiruan ----------
// Akun sama dengan seeder Laravel: test@example.com / password
const ADMIN = { email: 'test@example.com', password: 'password' }
const tokens = new Set()
const bearerToken = (req) => String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')

// ---------- server ----------
const server = http.createServer(async (req, res) => {
  const started = Date.now()
  const url = new URL(req.url, `http://${req.headers.host}`)
  const pathname = url.pathname.replace(/\/+$/, '') || '/'
  const host = req.headers.host
  const q = Object.fromEntries(url.searchParams)
  res.on('finish', () => console.log(`${req.method} ${req.url} -> ${res.statusCode} (${Date.now() - started} ms)`))

  try {
    if (req.method === 'OPTIONS') return send(res, 204, null)
    if (pathname.startsWith('/uploads/')) return serveUpload(res, pathname.slice('/uploads/'.length))
    if (!pathname.startsWith('/api')) return send(res, 404, { message: 'Tidak ditemukan. Gunakan awalan /api.' })

    const route = pathname.slice('/api'.length) || '/'

    // POST /api/login  (meniru AuthController Laravel: mengembalikan token Bearer)
    if (route === '/login' && req.method === 'POST') {
      const { fields } = await readBody(req)
      if (fields.email !== ADMIN.email || fields.password !== ADMIN.password) {
        return send(res, 422, { message: 'Invalid credentials.', errors: { email: ['Invalid credentials.'] } })
      }
      const token = `${tokens.size + 1}|${randomBytes(20).toString('hex')}`
      tokens.add(token)
      return send(res, 200, {
        message: 'Login success',
        token,
        token_type: 'Bearer',
        user: { id: 1, name: 'Admin Asekicks', email: ADMIN.email, role: 'admin' },
      })
    }

    // POST /api/logout
    if (route === '/logout' && req.method === 'POST') {
      tokens.delete(bearerToken(req))
      return send(res, 200, { message: 'Logout success' })
    }

    // GET /api/categories
    if (route === '/categories' && req.method === 'GET') return send(res, 200, db.categories)

    // Seperti Laravel: membaca produk publik, tetapi tambah/ubah/hapus wajib login (token)
    const isMutation = route.startsWith('/products') && req.method !== 'GET'
    if (isMutation && !tokens.has(bearerToken(req))) {
      return send(res, 401, { message: 'Unauthenticated.' })
    }

    // GET /api/products?page=1&per_page=10&category_id=1&search=nike  (limit/keyword juga diterima)
    if (route === '/products' && req.method === 'GET') {
      const page = Math.max(1, parseInt(q.page, 10) || 1)
      const limit = Math.min(50, Math.max(1, parseInt(q.per_page ?? q.limit, 10) || 10))
      let list = db.products
      if (q.category_id) list = list.filter((p) => String(p.category_id) === String(q.category_id))
      const term = q.search ?? q.keyword
      if (term) list = list.filter((p) => p.name.toLowerCase().includes(term.toLowerCase()))
      const total = list.length
      const lastPage = Math.max(1, Math.ceil(total / limit))
      const start = (page - 1) * limit
      const data = list.slice(start, start + limit).map((p) => toOutput(p, host))
      return send(res, 200, {
        data,
        meta: {
          current_page: page,
          last_page: lastPage,
          per_page: limit,
          total,
          from: data.length ? start + 1 : null,
          to: data.length ? start + data.length : null,
        },
      })
    }

    // POST /api/products
    if (route === '/products' && req.method === 'POST') {
      const { fields, files } = await readBody(req)
      const errors = validate(fields, files, { creating: true })
      if (Object.keys(errors).length) return send(res, 422, { message: 'The given data was invalid.', errors })
      const stamp = now()
      const product = {
        id: db.nextId++,
        name: String(fields.name).trim(),
        price: Number(fields.price),
        stock: Number(fields.stock),
        category_id: Number(fields.category_id),
        description: String(fields.description ?? ''),
        img: await saveImage(files.img),
        created_at: stamp,
        updated_at: stamp,
      }
      db.products.push(product)
      save()
      return send(res, 201, { message: 'Produk berhasil dibuat.', data: toOutput(product, host) })
    }

    const match = route.match(/^\/products\/(\d+)$/)
    if (match) {
      const id = Number(match[1])
      const index = db.products.findIndex((p) => p.id === id)
      if (index === -1) return send(res, 404, { message: 'Produk tidak ditemukan.' })

      // GET /api/products/:id
      if (req.method === 'GET') return send(res, 200, { data: toOutput(db.products[index], host) })

      // DELETE /api/products/:id
      if (req.method === 'DELETE') {
        const [removed] = db.products.splice(index, 1)
        removeUpload(removed.img)
        save()
        return send(res, 200, { message: 'Produk berhasil dihapus.' })
      }

      // PUT /api/products/:id   atau   POST /api/products/:id?_method=PUT (cara Laravel untuk multipart)
      const override = String(q._method || '').toUpperCase()
      if (req.method === 'PUT' || req.method === 'PATCH' || (req.method === 'POST' && override === 'PUT')) {
        const { fields, files } = await readBody(req)
        const errors = validate(fields, files, { creating: false })
        if (Object.keys(errors).length) return send(res, 422, { message: 'The given data was invalid.', errors })
        const product = db.products[index]
        product.name = String(fields.name).trim()
        product.price = Number(fields.price)
        product.stock = Number(fields.stock)
        product.category_id = Number(fields.category_id)
        product.description = String(fields.description ?? '')
        if (files.img && files.img.size > 0) {
          removeUpload(product.img)
          product.img = await saveImage(files.img)
        }
        product.updated_at = now()
        save()
        return send(res, 200, { message: 'Produk berhasil diperbarui.', data: toOutput(product, host) })
      }
      return send(res, 405, { message: 'Method tidak diizinkan.' })
    }

    return send(res, 404, { message: 'Endpoint tidak ditemukan.' })
  } catch (error) {
    console.error(error)
    return send(res, 500, { message: 'Terjadi kesalahan pada server.' })
  }
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Mock API berjalan di http://127.0.0.1:${PORT}/api`)
  console.log('Endpoint: GET /products, GET /products/:id, POST /products, POST /products/:id?_method=PUT, DELETE /products/:id, GET /categories')
})
