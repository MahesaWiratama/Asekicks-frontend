// Menghitung deretan nomor halaman yang ditampilkan (maksimal `size` tombol, berpusat di halaman aktif).
// Contoh: getPageWindow(1, 10) -> [1,2,3,4,5]   getPageWindow(10, 10) -> [6,7,8,9,10]
export function getPageWindow(current, last, size = 5) {
  const total = Math.max(1, last)
  const half = Math.floor(size / 2)
  let start = Math.max(1, current - half)
  const end = Math.min(total, start + size - 1)
  start = Math.max(1, end - size + 1)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}
