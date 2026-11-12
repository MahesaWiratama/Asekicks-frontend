import toast from 'react-hot-toast'

// Konfirmasi hapus memakai toast kustom (pengganti window.confirm).
export function confirmDeleteToast(name, onConfirm) {
  toast(
    (t) => (
      <div className="confirm-toast">
        <p>Hapus produk <strong>{name}</strong>?</p>
        <div className="confirm-actions">
          <button
            className="btn btn-red btn-sm"
            onClick={() => {
              toast.dismiss(t.id)
              onConfirm()
            }}
          >
            Ya, hapus
          </button>
          <button className="btn btn-light btn-sm" onClick={() => toast.dismiss(t.id)}>
            Batal
          </button>
        </div>
      </div>
    ),
    { duration: Infinity },
  )
}
