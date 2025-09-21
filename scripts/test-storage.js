const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Service key exists:', !!supabaseServiceKey);
console.log('Service key length:', supabaseServiceKey?.length);

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testStorage() {
  console.log('\n=== Testing Storage Access ===\n');

  try {
    // Test 1: List buckets
    console.log('1. Listing buckets...');
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();

    if (listError) {
      console.error('Error listing buckets:', listError);
    } else {
      console.log('Buckets found:', buckets?.length || 0);
      if (buckets && buckets.length > 0) {
        buckets.forEach(bucket => {
          console.log(`  - ${bucket.name} (public: ${bucket.public}, created: ${bucket.created_at})`);
        });
      }
    }

    // Test 2: Get specific bucket info
    console.log('\n2. Getting user-uploads bucket info...');
    const { data: userUploadsBucket, error: getUserUploadsError } = await supabaseAdmin.storage.getBucket('user-uploads');

    if (getUserUploadsError) {
      console.error('Error getting user-uploads bucket:', getUserUploadsError);
    } else {
      console.log('user-uploads bucket exists:', !!userUploadsBucket);
      if (userUploadsBucket) {
        console.log('  - public:', userUploadsBucket.public);
        console.log('  - created_at:', userUploadsBucket.created_at);
        console.log('  - file_size_limit:', userUploadsBucket.file_size_limit);
        console.log('  - allowed_mime_types:', userUploadsBucket.allowed_mime_types);
      }
    }

    // Test 3: Get images bucket info
    console.log('\n3. Getting images bucket info...');
    const { data: imagesBucket, error: getImagesError } = await supabaseAdmin.storage.getBucket('images');

    if (getImagesError) {
      console.error('Error getting images bucket:', getImagesError);
    } else {
      console.log('images bucket exists:', !!imagesBucket);
      if (imagesBucket) {
        console.log('  - public:', imagesBucket.public);
        console.log('  - created_at:', imagesBucket.created_at);
        console.log('  - file_size_limit:', imagesBucket.file_size_limit);
        console.log('  - allowed_mime_types:', imagesBucket.allowed_mime_types);
      }
    }

    // Test 4: Try to list files in user-uploads
    console.log('\n4. Listing files in user-uploads...');
    const { data: files, error: listFilesError } = await supabaseAdmin.storage
      .from('user-uploads')
      .list('', {
        limit: 5,
        offset: 0
      });

    if (listFilesError) {
      console.error('Error listing files:', listFilesError);
    } else {
      console.log('Files found:', files?.length || 0);
      if (files && files.length > 0) {
        files.forEach(file => {
          console.log(`  - ${file.name}`);
        });
      }
    }

    // Test 5: Try to create a test bucket (should fail if it exists)
    console.log('\n5. Testing bucket creation (should fail if exists)...');
    const { error: createError } = await supabaseAdmin.storage.createBucket('test-bucket-' + Date.now(), {
      public: true
    });

    if (createError) {
      console.log('Create bucket error (expected if permissions restricted):', createError.message);
    } else {
      console.log('Test bucket created successfully');
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testStorage();