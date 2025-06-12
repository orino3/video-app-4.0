# Supabase Storage Setup Guide

## Storage Bucket Configuration

To fix the video playback issues in production, ensure your Supabase storage bucket is configured correctly:

### 1. Create the Videos Bucket

In your Supabase dashboard:
1. Go to Storage → Buckets
2. Create a new bucket named `videos`
3. Set it as a **Private** bucket (not public)

### 2. Configure CORS Policy

Add the following CORS policy to allow video streaming from your Vercel deployment:

```json
[
  {
    "origin": ["https://your-app.vercel.app", "http://localhost:3000"],
    "allowed_headers": ["authorization", "content-type", "x-client-info", "apikey", "range"],
    "allowed_methods": ["GET", "POST", "PUT", "DELETE", "HEAD"],
    "exposed_headers": ["range", "content-range", "content-length"],
    "max_age_seconds": 3600
  }
]
```

Replace `https://your-app.vercel.app` with your actual Vercel deployment URL.

### 3. Set RLS Policies

Since we're using signed URLs generated server-side, you can keep the bucket private. The RLS policies should be:

```sql
-- Allow authenticated users to upload videos
CREATE POLICY "Users can upload videos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'videos' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated users to view their team's videos
CREATE POLICY "Users can view team videos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'videos' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated users to delete their own uploads
CREATE POLICY "Users can delete own videos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'videos' AND
  auth.role() = 'authenticated' AND
  owner = auth.uid()
);
```

### 4. Environment Variables

Ensure these are set in your Vercel deployment:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 5. What Changed

The fix implemented:
1. Created a server-side API route `/api/videos/signed-url` that generates signed URLs
2. Updated `HTML5PlayerAdapter` to use this API instead of client-side URL generation
3. This prevents the DNS_HOSTNAME_RESOLVED_PRIVATE error by ensuring URLs are generated with proper server-side credentials

### 6. Testing

After deploying these changes:
1. Upload a new video
2. Try to play it
3. Check the Network tab to ensure the signed URL is being generated correctly
4. The video should now play without the 404 error

### Troubleshooting

If videos still don't play:
1. Check Vercel Function logs for the `/api/videos/signed-url` endpoint
2. Verify the storage bucket name is exactly `videos`
3. Ensure the user is properly authenticated
4. Check that the `storage_path` is being saved correctly in the database