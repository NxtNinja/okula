import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface MessageDebugProps {
  message: {
    content: string[];
    isEncrypted?: boolean;
    encryptionVersion?: string;
  };
  showDebug?: boolean;
}

export const MessageDebug = ({ message, showDebug = false }: MessageDebugProps) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!showDebug) {
    return null;
  }

  return (
    <Card className="p-2 mt-2 text-xs">
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setShowDetails(!showDetails)}
        className="h-6 text-xs"
      >
        {showDetails ? "Hide" : "Show"} Debug Info
      </Button>
      
      {showDetails && (
        <div className="mt-2 space-y-1">
          <div>
            <strong>Encrypted:</strong> {message.isEncrypted ? "Yes" : "No"}
          </div>
          {message.encryptionVersion && (
            <div>
              <strong>Version:</strong> {message.encryptionVersion}
            </div>
          )}
          <div>
            <strong>Content (first 50 chars):</strong>
            <pre className="mt-1 p-1 bg-gray-100 rounded text-xs overflow-x-auto">
              {message.content[0]?.substring(0, 50)}...
            </pre>
          </div>
          <div>
            <strong>Has checksum:</strong> {message.content[0]?.includes(':') ? 'Yes' : 'No'}
          </div>
        </div>
      )}
    </Card>
  );
};
