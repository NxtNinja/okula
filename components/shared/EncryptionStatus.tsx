import { Shield } from "lucide-react";

interface EncryptionStatusProps {
  isEncrypted: boolean;
  showDetails?: boolean;
}

export const EncryptionStatus = ({
  isEncrypted,
  showDetails = false,
}: EncryptionStatusProps) => {
  if (!showDetails || !isEncrypted) {
    return null;
  }

  return (
    <div className="flex items-center" title="End-to-end encrypted">
      <Shield className="h-3 w-3 opacity-40" />
    </div>
  );
};
