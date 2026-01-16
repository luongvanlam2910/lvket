/**
 * Script để tạo Storage Buckets trong Supabase
 * 
 * Cách sử dụng:
 * 1. Lấy Service Role Key từ Supabase Dashboard:
 *    - Vào Project Settings → API
 *    - Copy "service_role" key (KHÔNG phải anon key)
 * 
 * 2. Chạy script:
 *    node scripts/create-storage-buckets.js YOUR_SERVICE_ROLE_KEY
 * 
 * HOẶC tạo file .env với:
 * SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
 * 
 * Lưu ý: Service Role Key có quyền cao, KHÔNG commit vào git!
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gjluacrkryivkjezsokt.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.argv[2];

if (!SERVICE_ROLE_KEY) {
  console.error('❌ Lỗi: Cần Service Role Key!');
  console.log('\nCách 1: Truyền key qua argument:');
  console.log('  node scripts/create-storage-buckets.js YOUR_SERVICE_ROLE_KEY');
  console.log('\nCách 2: Tạo file .env với:');
  console.log('  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  console.log('\nLấy Service Role Key từ:');
  console.log('  Supabase Dashboard → Project Settings → API → service_role key');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const buckets = [
  {
    name: 'photos',
    public: true,
    fileSizeLimit: 10485760, // 10 MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
  },
  {
    name: 'thumbnails',
    public: true,
    fileSizeLimit: 2097152, // 2 MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
  },
  {
    name: 'videos',
    public: true,
    fileSizeLimit: 52428800, // 50 MB
    allowedMimeTypes: ['video/mp4', 'video/quicktime']
  },
  {
    name: 'voices',
    public: true,
    fileSizeLimit: 10485760, // 10 MB
    allowedMimeTypes: ['audio/mpeg', 'audio/wav', 'audio/m4a']
  }
];

async function createBucket(bucketConfig) {
  try {
    // Kiểm tra bucket đã tồn tại chưa
    const { data: existing, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) throw listError;
    
    const exists = existing?.some(b => b.name === bucketConfig.name);
    
    if (exists) {
      console.log(`⏭️  Bucket "${bucketConfig.name}" đã tồn tại, bỏ qua...`);
      return { success: true, exists: true };
    }

    // Tạo bucket mới
    const { data, error } = await supabase.storage.createBucket(bucketConfig.name, {
      public: bucketConfig.public,
      fileSizeLimit: bucketConfig.fileSizeLimit,
      allowedMimeTypes: bucketConfig.allowedMimeTypes
    });

    if (error) {
      // Nếu lỗi do bucket đã tồn tại, bỏ qua
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        console.log(`⏭️  Bucket "${bucketConfig.name}" đã tồn tại, bỏ qua...`);
        return { success: true, exists: true };
      }
      throw error;
    }

    console.log(`✅ Đã tạo bucket "${bucketConfig.name}"`);
    return { success: true, exists: false, data };
  } catch (error) {
    console.error(`❌ Lỗi khi tạo bucket "${bucketConfig.name}":`, error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Bắt đầu tạo Storage Buckets...\n');
  console.log(`📦 Supabase URL: ${SUPABASE_URL}\n`);

  const results = [];
  
  for (const bucket of buckets) {
    const result = await createBucket(bucket);
    results.push({ name: bucket.name, ...result });
    // Đợi một chút giữa các requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n📊 Kết quả:');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const existing = results.filter(r => r.exists);

  console.log(`✅ Thành công: ${successful.length}/${buckets.length}`);
  if (existing.length > 0) {
    console.log(`⏭️  Đã tồn tại: ${existing.length}`);
  }
  if (failed.length > 0) {
    console.log(`❌ Thất bại: ${failed.length}`);
    failed.forEach(f => {
      console.log(`   - ${f.name}: ${f.error}`);
    });
  }

  console.log('\n📝 Bước tiếp theo:');
  console.log('1. Chạy file storage-policies.sql trong Supabase SQL Editor');
  console.log('2. Chạy file supabase-schema.sql trong Supabase SQL Editor');
  console.log('\n✨ Hoàn thành!');
}

main().catch(console.error);

