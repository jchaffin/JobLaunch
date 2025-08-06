import { NextRequest, NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const key = searchParams.get('key');

    if (action === 'list') {
      // List all parsed resume files
      const listCommand = new ListObjectsV2Command({
        Bucket: process.env.AWS_S3_BUCKET || 'interview-assistant-resumes',
        Prefix: 'parsed-resumes/',
        MaxKeys: 50
      });

      const response = await s3Client.send(listCommand);
      const parsedResumes = response.Contents?.map(obj => ({
        key: obj.Key,
        lastModified: obj.LastModified,
        size: obj.Size,
        fileName: obj.Key?.split('/').pop()
      })) || [];

      return NextResponse.json({
        parsedResumes,
        total: parsedResumes.length
      });
    }

    if (action === 'get' && key) {
      // Get specific parsed resume data
      const getCommand = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET || 'interview-assistant-resumes',
        Key: key
      });

      const response = await s3Client.send(getCommand);
      const body = await response.Body?.transformToString();
      
      if (!body) {
        return NextResponse.json({ error: 'No data found' }, { status: 404 });
      }

      const parsedData = JSON.parse(body);
      return NextResponse.json(parsedData);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error accessing parsed resume data:', error);
    return NextResponse.json(
      { error: 'Failed to access parsed resume data' },
      { status: 500 }
    );
  }
}