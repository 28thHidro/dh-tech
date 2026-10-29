// Trạng thái đang tải và báo lỗi, dùng chung cho mọi trang
export function SkeletonGrid({ count = 5 }) {
  return (
    <div className="grid" aria-busy="true" aria-label="Đang tải sản phẩm">
      {Array.from({ length: count }, (_, i) => (
        <div className="card skeleton" key={i}>
          <div className="sk sk-art" />
          <div className="sk sk-line" />
          <div className="sk sk-line short" />
        </div>
      ))}
    </div>
  );
}

export function ErrorBox({ error, onRetry }) {
  return (
    <div className="errorbox" role="alert">
      <b>Chưa tải được dữ liệu</b>
      <p>{error.message}</p>
      {onRetry && <button className="btn btn-line" onClick={onRetry}>Thử lại</button>}
    </div>
  );
}
