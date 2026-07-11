# Online Code Battle — Technical Design Document

> Real-time 1v1 coding battle: 2 người code trực tiếp trên web, viewers xem live (cursor + typing real-time), backend tự chấm bài dựa theo testcase.

---

## 1. Tổng quan kiến trúc

```
                         ┌─────────────────────────────┐
                         │      Next.js Frontend        │
                         │  (Monaco Editor + Yjs + WS)  │
                         └───────────┬─────────────────┘
                                     │
              ┌──────────────────────┼───────────────────────┐
              │ WebSocket            │ HTTP/REST              │ WebSocket (view)
              ▼                      ▼                        ▼
     ┌────────────────┐   ┌────────────────────┐   ┌────────────────────┐
     │ Collab Service │   │  Battle / API GW   │   │  Spectator Service │
     │ (Yjs / y-ws)   │   │ (Nodejs / Spring)  │   │  (fan-out updates) │
     └───────┬────────┘   └─────────┬──────────┘   └─────────┬──────────┘
             │                      │                        │
             └──────────┬───────────┴────────────┬───────────┘
                        │                         │
                        ▼                         ▼
                ┌───────────────┐         ┌──────────────────┐
                │ Redis (state, │         │  Message Queue   │
                │ pub/sub,      │◄───────►│ (RabbitMQ/Kafka/ │
                │ presence)     │         │  Redis Streams)  │
                └───────────────┘         └────────┬─────────┘
                                                    │ submit jobs
                                          ┌─────────▼──────────┐
                                          │   Judge Workers    │
                                          │ (pool, autoscale)  │
                                          │  Docker sandbox    │
                                          └─────────┬──────────┘
                                                    │
                                          ┌─────────▼──────────┐
                                          │ Postgres / Mongo   │
                                          │ (problems, results)│
                                          └────────────────────┘
```

Các service tách biệt: **Collab** (đồng bộ code), **Spectator** (fan-out cho viewers), **Judge** (chấm bài). Tách Judge ra riêng là quan trọng nhất vì nó CPU-bound và cần scale độc lập.

---

## 2. Real-time: con trỏ chuột + typing

### 2.1 Vấn đề cốt lõi
Có 2 loại dữ liệu real-time khác nhau, **không nên dùng chung cơ chế**:

| Loại | Đặc tính | Cơ chế |
|------|----------|--------|
| **Code text** | Phải nhất quán tuyệt đối, không được mất, hỗ trợ 2 người sửa đồng thời | CRDT (Yjs) |
| **Cursor / selection / mouse** | Ephemeral (tạm thời), mất 1 update không sao, tần suất cao | Awareness / throttled broadcast |

### 2.2 Chọn CRDT thay vì OT
- **OT (Operational Transformation)** như ShareDB/OT.js: mạnh nhưng phức tạp, cần server transform liên tục, khó scale.
- **CRDT (Yjs)** được khuyến nghị: merge tự động, không cần central authority để transform, hỗ trợ offline, tích hợp sẵn Monaco qua `y-monaco`.

Stack đề xuất:
- `yjs` — CRDT document
- `y-monaco` — binding với Monaco Editor
- `y-websocket` (hoặc tự viết provider) — transport
- **Yjs Awareness API** — chính là thứ xử lý cursor/selection/typing của user khác. Đây là phần ephemeral, Yjs đã build sẵn.

```ts
// Frontend (Next.js) — đồng bộ code + cursor
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { MonacoBinding } from 'y-monaco'

const ydoc = new Y.Doc()
const provider = new WebsocketProvider('wss://collab.yourapp.com', `battle-${battleId}`, ydoc)
const yText = ydoc.getText('monaco')

// Awareness = cursor, selection, user info — KHÔNG nằm trong document
provider.awareness.setLocalStateField('user', {
  name: username,
  color: userColor,
})

const binding = new MonacoBinding(
  yText,
  editorModel,
  new Set([editorInstance]),
  provider.awareness // <- cursor của người khác hiện tự động
)
```

### 2.3 Mouse cursor (con trỏ chuột thật, không phải text cursor)
Monaco awareness chỉ lo text-cursor. Nếu bạn muốn thấy **con trỏ chuột di chuyển trên màn hình** (như Figma), bạn phải tự broadcast toạ độ:

```ts
// Throttle ~30-50ms để không spam. Mouse move có thể bắn 100+ event/s
import { throttle } from 'lodash'

const sendCursor = throttle((x, y) => {
  provider.awareness.setLocalStateField('mouse', { x, y })
}, 40)

editorContainer.addEventListener('mousemove', e => {
  const rect = editorContainer.getBoundingClientRect()
  sendCursor((e.clientX - rect.left) / rect.width,  // toạ độ tương đối 0..1
             (e.clientY - rect.top) / rect.height)
})
```
> Dùng toạ độ **tương đối (0..1)** để cursor hiển thị đúng vị trí trên màn hình khác kích thước. Throttle để giảm tải.

### 2.4 Viewers (spectators) — quan trọng về scale
Viewers chỉ **đọc**, không sửa. Hai cách:

1. **Cho viewer join chung Yjs room (read-only)**: đơn giản, nhưng mỗi viewer là 1 WS connection vào collab service → 10.000 viewer = 10.000 connection nặng.
2. **Fan-out qua Spectator Service (khuyến nghị khi đông)**: 2 player sync vào Collab. Collab publish snapshot/delta + awareness lên Redis Pub/Sub. Spectator Service subscribe rồi broadcast xuống viewers. Tách connection player (cần tin cậy cao) khỏi viewer (chỉ cần xem).
   - Có thể giảm tần suất gửi cho viewer (vd 5-10 fps) vì xem không cần real-time tuyệt đối.

### 2.5 Backend transport
- **Node.js**: `ws` hoặc `socket.io`, chạy `y-websocket` server. Hệ sinh thái Yjs là JS nên Node là lựa chọn tự nhiên cho **Collab Service**.
- **Spring Boot**: dùng `spring-websocket` + STOMP. Tuy nhiên Yjs binary protocol trên JVM ít thư viện hơn → bạn sẽ phải tự xử lý binary update hoặc dùng OT thay thế. **Khuyến nghị: để Collab Service viết bằng Node.js dù backend chính là Spring**, vì lệch ngôn ngữ ở đây trả giá lớn.

---

## 3. Code Editor (frontend)

### 3.1 Chọn editor
**Monaco Editor** (lõi của VS Code) — khuyến nghị:
- Syntax highlighting + IntelliSense sẵn cho nhiều ngôn ngữ
- Paste code giữ format
- Tích hợp Yjs qua `y-monaco`

Lựa chọn nhẹ hơn: **CodeMirror 6** (bundle nhỏ hơn nhiều, có `y-codemirror.next`). Chọn CodeMirror nếu lo bundle size / mobile.

### 3.2 Gợi ý cú pháp theo ngôn ngữ
- Highlighting cơ bản: Monaco có sẵn.
- Autocomplete sâu (như IDE thật) cần **Language Server Protocol (LSP)**:
  - Chạy language server (vd `pyright`, `typescript-language-server`, `jdtls` cho Java) trong container.
  - Cầu nối qua `monaco-languageclient` + WebSocket.
  - Khá nặng nếu mỗi user 1 LSP instance. Với code battle, thường **chỉ cần highlight + basic completion** (Monaco built-in) là đủ; bỏ qua LSP đầy đủ ở MVP.

### 3.3 Next.js lưu ý
- Monaco phải load client-side: `dynamic(() => import(...), { ssr: false })` hoặc dùng `@monaco-editor/react`.
- Web Worker của Monaco cần config khi build (Next.js webpack/turbopack config).

---

## 4. Judge Service (chấm bài) — phần trọng tâm

### 4.1 Yêu cầu
- Nhận source code + language + problemId.
- Compile (nếu cần) + chạy với từng testcase (input file → so output file).
- **Cô lập (sandbox)**: code người dùng = code không tin cậy → có thể là fork bomb, đọc file hệ thống, network exfiltration, infinite loop.
- Giới hạn: time limit, memory limit, output size, processes.
- Throughput cao: nhiều request đồng thời.

### 4.2 Kiến trúc bất đồng bộ (KHÔNG chấm đồng bộ trong HTTP request)
```
Client submit → API ghi job vào Queue → trả submissionId ngay (202)
Judge Worker lấy job từ Queue → chạy sandbox → ghi kết quả vào DB
Client nhận kết quả qua WebSocket/SSE hoặc polling theo submissionId
```
Lý do: chấm bài mất từ vài trăm ms đến vài giây. Giữ HTTP connection chờ = chết server khi tải cao. Dùng queue để **decouple** và scale worker độc lập.

Queue options:
- **Redis Streams** / **BullMQ** (Node.js) — đơn giản, đủ dùng, có retry/priority sẵn.
- **RabbitMQ** — bạn đã quen (DisNote), tốt cho work-queue + ack/nack + prefetch để cân tải.
- **Kafka** — chỉ khi cần throughput cực lớn / replay; thường overkill cho chấm bài.

> Với 2 player/trận nhưng nhiều trận song song + auto-submit theo testcase, RabbitMQ work queue với prefetch=1 mỗi worker là lựa chọn cân bằng.

### 4.3 Sandbox — trái tim của Judge

Đây là phần KHÔNG được làm cẩu thả. Các cấp độ:

**Option A — Docker container per submission (khuyến nghị, dễ làm, an toàn tốt)**
- Mỗi lần chấm spawn 1 container ephemeral từ image chứa compiler/runtime.
- Giới hạn bằng flags Docker:
```bash
docker run --rm \
  --network none \                # chặn network hoàn toàn
  --memory 256m --memory-swap 256m \  # giới hạn RAM, chặn swap
  --cpus 1 \
  --pids-limit 64 \               # chống fork bomb
  --read-only \                   # filesystem read-only
  --tmpfs /tmp:rw,size=64m,noexec \
  --ulimit nofile=128:128 \
  --ulimit nproc=64:64 \
  --security-opt no-new-privileges \
  --cap-drop ALL \
  -v /sandbox/sub123:/code:ro \
  judge-python:latest \
  /bin/sh -c "timeout 5 python3 /code/main.py < /code/input.txt"
```
- Time limit: dùng `timeout` trong container + 1 timeout bao ngoài ở worker (phòng container treo).
- Đo memory thật: đọc `cgroup` memory.peak hoặc dùng `/usr/bin/time -v`.

**Option B — Reuse container / runner pool**
- Spawn container tốn ~vài trăm ms. Khi tải cao, giữ pool container "ấm", chỉ copy code vào và exec. Nhanh hơn nhưng phải reset state cẩn thận giữa các lần chạy.

**Option C — `isolate` (sandbox của IOI/Codeforces)**
- Tool C chuyên cho judge dùng namespaces + cgroups, cực nhẹ và chính xác về đo time/memory. An toàn và chuẩn nhất cho competitive judging, nhưng setup phức tạp hơn Docker. Nếu hệ thống nghiêm túc về chấm thi → nên dùng `isolate`.

**Option D — gVisor / Firecracker microVM**
- Cách ly mạnh nhất (kernel-level / VM-level). Dùng khi bạn cho chạy code hoàn toàn không tin cậy ở quy mô lớn (như các online judge công cộng). Phức tạp; cân nhắc sau.

> Lộ trình đề xuất: **MVP = Docker (Option A)**, khi cần độ chính xác đo lường → thêm **`isolate`**, khi cần cô lập cực mạnh → **gVisor**.

### 4.4 Quy trình chấm 1 submission
```
1. Validate (size code, ngôn ngữ hợp lệ, rate-limit user)
2. Ghi code ra thư mục tạm /sandbox/<subId>/
3. (Nếu cần) Compile trong sandbox — timeout compile riêng (vd 10s)
   - Lỗi compile → trả Compilation Error, dừng.
4. Với mỗi testcase:
   - Chạy binary trong sandbox với input, giới hạn time/mem.
   - Thu stdout, exit code, time, mem.
   - So sánh output (trim trailing whitespace; hoặc special judge/checker nếu nhiều đáp án đúng).
   - Phân loại: AC / WA / TLE / MLE / RE / OLE.
   - Fail-fast: WA/TLE ở testcase đầu thì có thể dừng sớm (tuỳ luật).
5. Tổng hợp verdict + điểm + chi tiết từng test → ghi DB.
6. Publish kết quả qua WS/SSE cho player & spectators.
7. Dọn thư mục tạm, kill container.
```

### 4.5 So sánh output (checker)
- **Exact / token-based**: so sánh sau khi strip whitespace thừa — đủ cho đa số bài.
- **Special judge (checker tuỳ chỉnh)**: bài có nhiều đáp án đúng (vd in ra "bất kỳ đường đi hợp lệ"). Viết checker chạy riêng nhận (input, user_output, expected) → trả AC/WA.
- **Floating point**: so sánh với epsilon.

### 4.6 Triển khai bằng Node.js vs Spring Boot

| Khía cạnh | Node.js (BullMQ) | Java Spring Boot |
|-----------|------------------|------------------|
| Đọc job từ queue | `bullmq` Worker / `amqplib` | `spring-amqp` (RabbitMQ) hoặc Kafka listener |
| Spawn sandbox | `child_process.spawn('docker', ...)` | `ProcessBuilder` / `Runtime.exec` |
| Concurrency | event loop + nhiều worker process | thread pool (`@Async`, `ExecutorService`) |
| Phù hợp | I/O-bound orchestration, nhẹ, deploy nhanh | đã có hệ Spring, cần type-safety, team Java |

**Khuyến nghị:** Bản thân việc chấm là gọi process bên ngoài (Docker/isolate) nên **ngôn ngữ worker không quá quan trọng** — cả hai đều ổn. Chọn theo team:
- Nếu phần còn lại của bạn là **Spring Boot** (giống DisNote) → viết Judge Worker bằng Spring để đồng nhất, dùng `ProcessBuilder` + `spring-amqp`.
- Nếu muốn worker nhẹ, scale nhiều instance rẻ → Node.js + BullMQ.

Mã ví dụ Node.js worker:
```ts
import { Worker } from 'bullmq'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
const run = promisify(execFile)

new Worker('judge', async job => {
  const { subId, language, testcases } = job.data
  await writeCode(subId, job.data.code)
  if (needsCompile(language)) await compileInSandbox(subId, language)

  const results = []
  for (const tc of testcases) {
    try {
      const { stdout } = await run('docker', dockerArgs(subId, language, tc.input),
        { timeout: tc.timeLimit + 1000, maxBuffer: 64 * 1024 })
      results.push(compareOutput(stdout, tc.expected) ? 'AC' : 'WA')
    } catch (e) {
      results.push(classifyError(e)) // TLE / RE / MLE
    }
  }
  await saveResult(subId, results)
  await publishToClients(subId, results) // qua Redis pub/sub → WS
}, { concurrency: 4 }) // số bài chạy song song / worker
```

Mã ví dụ Spring Boot (RabbitMQ listener):
```java
@RabbitListener(queues = "judge", concurrency = "4")
public void judge(SubmissionJob job) throws Exception {
    writeCode(job.getSubId(), job.getCode());
    if (needsCompile(job.getLanguage())) compileInSandbox(job);

    List<String> verdicts = new ArrayList<>();
    for (Testcase tc : job.getTestcases()) {
        ProcessBuilder pb = new ProcessBuilder(dockerArgs(job, tc));
        Process p = pb.start();
        feedStdin(p, tc.getInput());
        boolean finished = p.waitFor(tc.getTimeLimit() + 1000, TimeUnit.MILLISECONDS);
        if (!finished) { p.destroyForcibly(); verdicts.add("TLE"); continue; }
        String out = readStdout(p);
        verdicts.add(compare(out, tc.getExpected()) ? "AC" : "WA");
    }
    saveAndPublish(job.getSubId(), verdicts);
}
```

---

## 5. Scale Judge Service

Vì "phần chấm bài sẽ có rất nhiều req", đây là phần cần đầu tư.

### 5.1 Nguyên tắc
1. **Tách Judge khỏi API.** API trả nhanh (202 + submissionId). Judge chạy nền. → API không bị block, scale riêng.
2. **Queue làm bộ đệm (buffer).** Burst request không giết worker; chúng xếp hàng. Worker tiêu thụ theo năng lực.
3. **Stateless workers.** Mọi state ở queue + DB + filesystem tạm. Worker chết → job được re-deliver (nhờ ack sau khi xong). Thêm/bớt worker tự do.
4. **CPU-bound.** Chấm bài tốn CPU (chạy code). Scale theo số core, không phải số connection.

### 5.2 Horizontal scaling
- Đóng gói Judge Worker thành container, chạy N replica.
- **Auto-scale theo độ dài queue** (KEDA trên Kubernetes là chuẩn cho việc này): queue dài → tăng worker; rỗng → giảm.
  - Metric: số message pending trong RabbitMQ / Redis Stream.
- Mỗi worker đặt `concurrency` = số bài chạy song song, cân với CPU/RAM node (vd node 4 core → concurrency 3-4, chừa CPU cho hệ thống).

### 5.3 Cân tải & công bằng
- **Prefetch / fair dispatch (RabbitMQ `prefetch=1`)**: worker chỉ lấy job mới khi xong job cũ → không có worker ôm đồm.
- **Priority queue**: bài trong trận đang diễn ra ưu tiên hơn bài practice.
- **Per-user rate limit**: chặn spam submit (vd tối đa 1 submit / 5s / user) ở API trước khi vào queue.
- **Dedup**: nếu user submit liên tục cùng code, bỏ job cũ.

### 5.4 Bảo vệ tài nguyên
- Mỗi sandbox bị giới hạn cpu/mem/pids/time như mục 4.3.
- Đặt **global cap**: tổng số container chạy đồng thời trên 1 node, tránh OOM cả máy.
- **Timeout cứng** mọi nơi: compile timeout, run timeout, và worker-level timeout bao ngoài.
- Tách node chạy Judge ra **node pool riêng** (tainted), không chung node với API/Collab — code lạ không ảnh hưởng service khác, và dễ giới hạn blast radius.

### 5.5 Độ chính xác đo lường khi scale
- Khi nhiều bài chạy chung 1 node, CPU contention làm thời gian chạy dao động → TLE oan.
- Giải pháp: **pin CPU** (cgroup cpuset) cho mỗi sandbox, hoặc đo bằng CPU time thay vì wall-clock time (`isolate` hỗ trợ tốt), hoặc giới hạn số bài song song để không quá số core thật.

### 5.6 Quan sát hệ thống (observability)
- Metrics: queue depth, judge latency (p50/p95/p99), tỉ lệ TLE/RE, worker CPU/mem.
- Khi p95 latency tăng hoặc queue depth tăng đều → tín hiệu cần thêm worker.
- Dead-letter queue cho job lỗi/crash để điều tra.

### 5.7 Lộ trình scale
| Giai đoạn | Setup |
|-----------|-------|
| MVP | 1 API + 1 Collab + 1 Judge worker, Redis + BullMQ, Docker sandbox, 1 VPS |
| Tăng tải | Tách node pool Judge, nhiều worker replica, RabbitMQ work queue + prefetch |
| Quy mô lớn | Kubernetes + KEDA auto-scale theo queue, `isolate`/gVisor sandbox, priority queue, observability stack |

---

## 6. Tổng hợp tech stack đề xuất

| Thành phần | Lựa chọn chính | Ghi chú |
|-----------|----------------|---------|
| Frontend | **Next.js + Monaco Editor** | `ssr:false` cho editor; CodeMirror nếu cần nhẹ |
| Đồng bộ code | **Yjs (CRDT) + y-monaco** | Awareness lo cursor/selection |
| Mouse cursor | Awareness custom field + throttle ~40ms | Toạ độ tương đối 0..1 |
| Collab Service | **Node.js + y-websocket** | Để JS vì hệ Yjs là JS, kể cả khi backend chính Spring |
| Spectator fan-out | Node.js + Redis Pub/Sub | Tách connection viewer khỏi player; hạ fps cho viewer |
| API / Battle logic | **Node.js** *hoặc* **Spring Boot** | Theo team; trả 202 + submissionId |
| Queue | **RabbitMQ** (đã quen) hoặc BullMQ/Redis Streams | Work queue + prefetch + priority |
| Judge Worker | **Node.js + BullMQ** *hoặc* **Spring + spring-amqp** | Đều gọi process sandbox, chọn theo team |
| Sandbox | **Docker** → nâng cấp **isolate** → **gVisor** | Network none, mem/pids/cap limits |
| Realtime kết quả về client | WebSocket / SSE qua Redis Pub/Sub | Theo submissionId |
| DB | Postgres (results/problems) + Redis (state/presence) | Mongo cũng được nếu thích |
| Scale | Kubernetes + **KEDA** auto-scale theo queue depth | Judge ở node pool riêng |

---

## 7. Checklist bảo mật code không tin cậy
- [ ] `--network none` (trừ khi bài cần network, rất hiếm)
- [ ] Giới hạn memory + chặn swap
- [ ] `--pids-limit` chống fork bomb
- [ ] `--cap-drop ALL`, `no-new-privileges`, `--read-only` + tmpfs noexec
- [ ] Timeout compile + run + worker-level
- [ ] Giới hạn output size (chống OLE / fill disk)
- [ ] Không mount thư mục nhạy cảm; mount code read-only
- [ ] Judge chạy node pool riêng, non-root
- [ ] Rate limit submit per-user ở API
- [ ] Dọn dẹp container/file tạm sau mỗi lần chấm

---

## 8. Bước đi tiếp theo gợi ý
1. Dựng MVP editor + Yjs sync 2 người + awareness cursor.
2. Dựng Judge worker Docker chấm 1 ngôn ngữ (vd Python) end-to-end với queue.
3. Thêm spectator fan-out.
4. Thêm ngôn ngữ + special judge.
5. Đóng container hoá + auto-scale.
