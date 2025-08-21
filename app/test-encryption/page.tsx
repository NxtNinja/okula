"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { encryptMessage, decryptMessage, generateEncryptionKey } from "@/lib/encryption";

export default function TestEncryptionPage() {
  const [message, setMessage] = useState("");
  const [encryptedMessage, setEncryptedMessage] = useState("");
  const [decryptedMessage, setDecryptedMessage] = useState("");
  const [encryptionKey] = useState(generateEncryptionKey());

  const handleEncrypt = () => {
    try {
      const encrypted = encryptMessage(message, encryptionKey);
      setEncryptedMessage(encrypted);
      setDecryptedMessage("");
    } catch (error) {
      console.error("Encryption failed:", error);
    }
  };

  const handleDecrypt = () => {
    try {
      const decrypted = decryptMessage(encryptedMessage, encryptionKey);
      setDecryptedMessage(decrypted);
    } catch (error) {
      console.error("Decryption failed:", error);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Encryption Test Page</h1>
      
      <Card className="p-6 mb-4">
        <h2 className="text-lg font-semibold mb-4">Test Encryption/Decryption</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Original Message</label>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter a message to encrypt"
            />
          </div>

          <Button onClick={handleEncrypt}>Encrypt Message</Button>

          {encryptedMessage && (
            <div>
              <label className="block text-sm font-medium mb-2">Encrypted Message</label>
              <div className="p-3 bg-gray-100 rounded break-all">
                {encryptedMessage}
              </div>
            </div>
          )}

          {encryptedMessage && (
            <Button onClick={handleDecrypt}>Decrypt Message</Button>
          )}

          {decryptedMessage && (
            <div>
              <label className="block text-sm font-medium mb-2">Decrypted Message</label>
              <div className="p-3 bg-green-100 rounded">
                {decryptedMessage}
              </div>
            </div>
          )}

          <div className="mt-6 p-3 bg-blue-50 rounded">
            <p className="text-sm text-blue-800">
              <strong>Encryption Key:</strong> {encryptionKey.substring(0, 20)}...
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">How it works</h2>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>Messages are encrypted using AES encryption before being stored in the database</li>
          <li>Each conversation has a unique encryption key derived from conversation and participant IDs</li>
          <li>Messages are decrypted only in the UI when displayed to authorized users</li>
          <li>The encrypted content in the database is unreadable without the proper key</li>
        </ul>
      </Card>
    </div>
  );
}
