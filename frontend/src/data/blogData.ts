import { Blog } from "@/types/blog"

export const DEVELOPER_BLOGS: Blog[] = [
  {
    id: "blog-001",
    title: "Membangun Sistem IoT Cerdas untuk Monitoring Kualitas Udara di Greenhouse",
    excerpt:
      "Bagaimana saya menggabungkan sensor MQ-135, ESP32, FastAPI, dan model Deep Learning CNN untuk memantau dan mengontrol kualitas udara secara real-time di greenhouse pembibitan kopi.",
    content: `
      <h2>Latar Belakang Proyek</h2>
      <p>Greenhouse pembibitan kopi membutuhkan kondisi udara yang optimal — kadar CO₂, kelembaban, dan suhu harus dijaga ketat. Saya membangun sistem IoT yang tidak hanya memantau, tetapi juga <strong>secara otomatis mengontrol</strong> kondisi tersebut menggunakan kecerdasan buatan.</p>
      <h2>Arsitektur Sistem</h2>
      <p>Sistem ini terdiri dari tiga lapisan utama:</p>
      <ul>
        <li><strong>Edge Layer:</strong> Mikrokontroler ESP32 + sensor MQ-135, DHT22, dan kamera OV2640</li>
        <li><strong>Backend Layer:</strong> FastAPI sebagai API server, mengelola data sensor dan trigger aktuator</li>
        <li><strong>Intelligence Layer:</strong> Model CNN TensorFlow untuk klasifikasi penyakit daun kopi dari gambar</li>
      </ul>
      <h2>Deep Learning untuk Diagnosis Penyakit</h2>
      <p>Model CNN dilatih dengan dataset 3.000+ gambar daun kopi yang dikategorikan: <em>sehat</em>, <em>karat daun</em>, dan <em>bercak daun</em>. Arsitektur yang digunakan adalah MobileNetV2 dengan transfer learning, mencapai akurasi ~94% pada validation set.</p>
      <pre><code>model = tf.keras.applications.MobileNetV2(
    input_shape=(224, 224, 3),
    include_top=False,
    weights='imagenet'
)
model.trainable = False  # freeze base layers</code></pre>
      <h2>Komunikasi Real-Time dengan MQTT</h2>
      <p>Data sensor dikirim setiap 5 detik via protokol <strong>MQTT</strong> ke broker Mosquitto yang berjalan di server. FastAPI subscribe ke topik tersebut dan langsung menyimpan ke PostgreSQL sambil mengevaluasi apakah perlu trigger aktuator (kipas, pompa, lampu UV).</p>
      <blockquote><p>"IoT bukan sekadar menghubungkan perangkat — ini tentang membuat lingkungan fisik menjadi cerdas dan responsif."</p></blockquote>
      <h2>Hasil & Pelajaran</h2>
      <p>Sistem berhasil menjaga kualitas udara dalam rentang optimal 95% waktu operasional. Respons aktuator rata-rata di bawah 2 detik sejak sensor mendeteksi anomali. Proyek ini mengajarkan saya pentingnya <strong>edge computing</strong> — tidak semua inferensi harus di cloud.</p>
    `,
    thumbnail:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    category: "Tutorial",
    author: {
      name: "Agung Kurniawan",
      email: "agung@dev.com",
      type: "developer",
    },
    publishedAt: "2025-11-20T08:00:00.000Z",
    readingTime: 9,
    tags: ["IoT", "ESP32", "Deep Learning", "FastAPI", "TensorFlow"],
  },
  {
    id: "blog-002",
    title: "Implementasi CNN untuk Klasifikasi Ekspresi Wajah dengan Flutter",
    excerpt:
      "Perjalanan membangun model Deep Learning CNN dari nol hingga deployment di Flutter — mulai dari preprocessing dataset FER2013 hingga optimasi model untuk mobile inference.",
    content: `
      <h2>Mengapa Klasifikasi Ekspresi Wajah?</h2>
      <p>Ekspresi wajah adalah salah satu kanal komunikasi manusia yang paling kaya informasi. Membangun sistem yang bisa mengenali emosi secara otomatis membuka peluang aplikasi di bidang <strong>kesehatan mental</strong>, <strong>UX research</strong>, hingga <strong>keamanan</strong>.</p>
      <h2>Dataset: FER2013</h2>
      <p>Dataset FER2013 berisi 35.887 gambar wajah 48×48 piksel grayscale dengan 7 label emosi. Distribusinya tidak seimbang — saya menggunakan kombinasi <strong>class weighting</strong> dan <strong>augmentasi data</strong> untuk mengatasinya.</p>
      <h2>Arsitektur CNN Custom</h2>
      <pre><code>model = Sequential([
    Conv2D(64, (3,3), activation='relu', input_shape=(48,48,1)),
    BatchNormalization(),
    MaxPooling2D(2,2),
    Dropout(0.25),
    Conv2D(128, (3,3), activation='relu'),
    Flatten(),
    Dense(256, activation='relu'),
    Dropout(0.5),
    Dense(7, activation='softmax')
])</code></pre>
      <h2>Optimasi untuk Mobile (TFLite)</h2>
      <p>Model ~45MB dikompres menjadi ~11MB menggunakan <strong>quantization-aware training</strong> dengan penurunan akurasi kurang dari 1%. Inferensi on-device rata-rata hanya 34ms pada midrange Android.</p>
      <blockquote><p>"Model yang akurat di Jupyter Notebook tidak berguna jika tidak bisa berjalan di perangkat pengguna."</p></blockquote>
    `,
    thumbnail:
      "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80",
    category: "Technology",
    author: {
      name: "Agung Kurniawan",
      email: "agung@dev.com",
      type: "developer",
    },
    publishedAt: "2026-01-08T09:00:00.000Z",
    readingTime: 10,
    tags: ["Deep Learning", "CNN", "TensorFlow", "Flutter", "Computer Vision"],
  },
  {
    id: "blog-003",
    title: "FastAPI + PostgreSQL: Membangun REST API Scalable untuk Aplikasi IoT",
    excerpt:
      "Panduan lengkap membangun backend API yang mampu menangani ribuan request data sensor per menit menggunakan FastAPI, async SQLAlchemy, dan PostgreSQL dengan connection pooling.",
    content: `
      <h2>Kenapa FastAPI untuk IoT Backend?</h2>
      <p>Ketika membangun backend untuk sistem IoT, ada dua tantangan utama: <strong>throughput tinggi</strong> dan <strong>latensi rendah</strong>. FastAPI dengan async/await adalah jawaban yang tepat.</p>
      <h2>Async Database dengan SQLAlchemy 2.0</h2>
      <pre><code>engine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,
)</code></pre>
      <p>Connection pooling memungkinkan handling 20 koneksi simultan tanpa membuat koneksi baru setiap request — krusial untuk performa IoT backend.</p>
      <h2>Batch Insert untuk Sensor Data</h2>
      <p>Daripada menyimpan satu data sensor per request, <strong>batch insert</strong> yang menerima array data meningkatkan throughput 5-8x lipat.</p>
      <h2>WebSocket untuk Real-Time Dashboard</h2>
      <p>Dashboard monitoring terhubung via WebSocket dan menerima update data sensor setiap kali data baru masuk — tanpa polling yang boros bandwidth.</p>
      <blockquote><p>"Batch operations untuk high-frequency data bukan premature optimization, itu fundamental."</p></blockquote>
      <h2>Hasil Benchmark</h2>
      <p>Dengan Uvicorn 4 worker + Gunicorn di VPS 2 core, sistem berhasil menangani <strong>1.200 req/s</strong> dengan rata-rata latensi 18ms.</p>
    `,
    thumbnail:
      "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&q=80",
    category: "Tutorial",
    author: {
      name: "Agung Kurniawan",
      email: "agung@dev.com",
      type: "developer",
    },
    publishedAt: "2026-02-03T10:00:00.000Z",
    readingTime: 8,
    tags: ["FastAPI", "PostgreSQL", "Backend", "IoT", "Python"],
  },
  {
    id: "blog-004",
    title: "Machine Learning di Edge: Menjalankan Model AI di Mikrokontroler ESP32",
    excerpt:
      "TensorFlow Lite Micro memungkinkan model ML berjalan di ESP32 tanpa koneksi internet. Eksplorasi menjalankan model klasifikasi suara pada mikrokontroler dengan RAM hanya 520KB.",
    content: `
      <h2>Apa itu Edge AI?</h2>
      <p>Edge AI adalah paradigma menjalankan inferensi model machine learning langsung di perangkat edge tanpa bergantung pada cloud. Manfaatnya: <strong>latensi hampir nol</strong>, <strong>privasi data terjaga</strong>, dan <strong>operasi offline</strong>.</p>
      <h2>Tantangan: Keterbatasan Hardware</h2>
      <p>ESP32 hanya punya 520KB SRAM dan 4MB flash. Pipeline kompresi yang digunakan:</p>
      <ul>
        <li><strong>Pruning:</strong> menghapus bobot mendekati nol (~40% parameter)</li>
        <li><strong>Quantization:</strong> float32 → int8 (4x ukuran lebih kecil)</li>
        <li><strong>Knowledge Distillation:</strong> melatih model kecil meniru model besar</li>
      </ul>
      <h2>TensorFlow Lite Micro</h2>
      <pre><code>constexpr int kTensorArenaSize = 50 * 1024;
uint8_t tensor_arena[kTensorArenaSize];

tflite::MicroInterpreter interpreter(
    model, resolver, tensor_arena,
    kTensorArenaSize, &error_reporter);</code></pre>
      <h2>Studi Kasus: Wake Word Detection</h2>
      <p>Model untuk mendeteksi wake word "hey kopi" di greenhouse. Model akhir berukuran <strong>18KB</strong> dan berjalan dengan akurasi 91% pada ESP32 dengan inferensi 23ms.</p>
      <blockquote><p>"AI tidak harus besar untuk berdampak. Sebuah model 18KB yang berjalan on-device bisa mengubah cara manusia berinteraksi dengan lingkungan fisiknya."</p></blockquote>
    `,
    thumbnail:
      "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80",
    category: "Technology",
    author: {
      name: "Agung Kurniawan",
      email: "agung@dev.com",
      type: "developer",
    },
    publishedAt: "2026-02-20T08:30:00.000Z",
    readingTime: 11,
    tags: ["Machine Learning", "IoT", "ESP32", "TensorFlow Lite", "Edge AI"],
  },
]
