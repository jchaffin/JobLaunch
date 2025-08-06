import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export async function POST(request: NextRequest) {
  try {
    const bucketName = process.env.AWS_S3_BUCKET;
    
    if (!bucketName) {
      return NextResponse.json(
        { error: "S3 bucket not configured" },
        { status: 500 }
      );
    }

    console.log("Configuring CORS for S3 bucket:", bucketName);

    const corsConfiguration = {
      CORSRules: [
        {
          AllowedHeaders: ["*"],
          AllowedMethods: ["GET", "HEAD"],
          AllowedOrigins: ["*"],
          ExposeHeaders: ["ETag"],
          MaxAgeSeconds: 3600,
        },
      ],
    };

    const command = new PutBucketCorsCommand({
      Bucket: bucketName,
      CORSConfiguration: corsConfiguration,
    });

    await s3Client.send(command);

    console.log("CORS configuration applied successfully");

    return NextResponse.json({
      message: "CORS configuration applied successfully",
      corsRules: corsConfiguration.CORSRules,
    });

  } catch (error) {
    console.error("Error configuring CORS:", error);
    return NextResponse.json(
      {
        error: "Failed to configure CORS",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}