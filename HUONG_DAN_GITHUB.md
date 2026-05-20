# Hướng Dẫn Đưa Dự Án Lên GitHub

Tài liệu này hướng dẫn bạn cách đưa thư mục dự án "DESIGN ENGINEERING HUB" lên GitHub một cách nhanh chóng và dễ dàng.

## Bước 1: Tạo Repository (Kho lưu trữ) trên GitHub
1. Đăng nhập vào tài khoản [GitHub](https://github.com/).
2. Nhấn vào nút **New** (hoặc biểu tượng dấu `+` ở góc trên bên phải -> chọn **New repository**).
3. Đặt tên cho kho chứa (ví dụ: `design-engineering-hub`).
4. (Tùy chọn) Viết mô tả ngắn về dự án của bạn.
5. Chọn **Public** (công khai) hoặc **Private** (riêng tư) tùy theo nhu cầu.
6. **LƯU Ý QUAN TRỌNG:** KHÔNG đánh dấu vào các ô "Add a README file", "Add .gitignore", hay "Choose a license". Bạn cần một kho chứa hoàn toàn trống vì code đã có sẵn trên máy tính.
7. Nhấn nút **Create repository**.

## Bước 2: Khởi tạo Git trong thư mục dự án
1. Mở thư mục dự án `DESIGN ENGINEERING HUB V2.1.26 - share - test - Copy` trên máy tính của bạn.
2. Click chuột phải vào khoảng trống trong thư mục, chọn **"Open in Terminal"** hoặc **"Open Git Bash here"** (nếu bạn đã cài Git).

Chạy lệnh sau để khởi tạo kho Git cục bộ:
```bash
git init
```

## Bước 3: Đưa file vào Git và Commit
Chạy lần lượt các lệnh sau để thêm tất cả các file hiện tại vào Git và tạo lịch sử lưu (commit) đầu tiên:

1. Thêm tất cả các file (lưu ý có dấu chấm ở cuối lệnh):
```bash
git add .
```

2. Lưu lại (commit) các file vừa thêm:
```bash
git commit -m "First commit: Khởi tạo dự án Design Engineering Hub"
```

## Bước 4: Liên kết với GitHub và Đẩy code lên (Push)
Sau khi tạo repository thành công ở Bước 1, GitHub sẽ hiển thị một đường link. Hãy sao chép đường link đó (ví dụ: `https://github.com/TenCuaBan/design-engineering-hub.git`).

Quay lại Terminal và chạy lần lượt các lệnh sau:

1. Đổi tên nhánh chính thành `main` (tiêu chuẩn mặc định hiện tại của GitHub):
```bash
git branch -M main
```

2. Thêm đường dẫn (remote) tới repository trên GitHub của bạn:
```bash
git remote add origin https://github.com/TEN_DANG_NHAP/TEN_REPO.git
```
*(Nhớ thay thế đường link trong lệnh trên bằng đường link thực tế bạn vừa copy trên GitHub)*

3. Đẩy (push) toàn bộ code của bạn lên GitHub:
```bash
git push -u origin main
```

> **Lưu ý:** Khi chạy lệnh `push`, có thể hệ thống sẽ hiển thị một cửa sổ bật lên yêu cầu bạn đăng nhập GitHub (bằng trình duyệt hoặc nhập Token) để xác thực quyền sở hữu. Hãy làm theo hướng dẫn trên màn hình.

---

## 💡 Xử lý sự cố thường gặp (Troubleshooting)

### 1. Nếu muốn cập nhật code lên GitHub những lần sau:
Mỗi khi bạn sửa đổi file và muốn lưu thay đổi đó lên GitHub, bạn chỉ cần mở Terminal tại thư mục dự án và chạy 3 lệnh quen thuộc:
```bash
git add .
git commit -m "Mô tả nội dung bạn vừa thay đổi (VD: Cập nhật giao diện bảng quạt)"
git push
```

### 2. Lỗi `fatal: remote origin already exists`:
Lỗi này xuất hiện nếu bạn đã từng thử liên kết thư mục này với một link GitHub khác trước đó. Để khắc phục, hãy chạy lệnh xóa liên kết cũ đi:
```bash
git remote remove origin
```
Sau đó làm lại thao tác ở Bước 4.
