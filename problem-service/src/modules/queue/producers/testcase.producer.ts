import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { TESTCASE_CLIENT, TESTCASE_UPLOAD_PATTERN } from '../constants/queue.constants';
import { TestcaseUploadRequestedMessage } from '../contracts/testcase-upload.message';

@Injectable()
export class TestcaseProducer {

  constructor(
    @Inject(TESTCASE_CLIENT) private readonly client: ClientProxy,
  ) {}

  /**
   * Đẩy job upload testcase vào queue.
   * Dùng emit() = EVENT (fire-and-forget) -> KHÔNG chờ worker xử lý xong
   * nên request tạo problem trả về gần như tức thì.
   */
  async requestUpload(msg: any): Promise<void> {
    console.log(`publish msg::${msg}`)
    // emit() trả về cold Observable -> phải subscribe (lastValueFrom) để thực sự gửi đi
    await lastValueFrom(this.client.emit(TESTCASE_UPLOAD_PATTERN, msg));
    //                                ↑ Observable chưa được subscribe → KHÔNG GỬI GÌ HẾT
    // ↑ lastValueFrom subscribe vào Observable
    //   đợi Observable complete
    //   resolve Promise khi xong
    //   Chắc chắn message đã được đẩy vào queue
  }
}
