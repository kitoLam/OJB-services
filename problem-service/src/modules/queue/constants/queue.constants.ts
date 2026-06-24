// ============================================================
//  Tên client / queue / message pattern dùng chung
//  giữa producer (HTTP side) và consumer (worker side).
//  Để 1 chỗ tránh gõ sai chuỗi.
// ============================================================

// Token để inject ClientProxy của producer
export const TESTCASE_CLIENT = 'TESTCASE_CLIENT';

// Tên queue trên RabbitMQ mà worker lắng nghe
export const TESTCASE_UPLOAD_QUEUE = 'testcase.upload.queue';

// "pattern" của event — producer emit, consumer @EventPattern khớp đúng chuỗi này
export const TESTCASE_UPLOAD_PATTERN = 'testcase.upload.requested';
