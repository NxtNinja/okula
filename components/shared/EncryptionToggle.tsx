import { Shield, ShieldOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface EncryptionToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export const EncryptionToggle = ({ enabled, onToggle }: EncryptionToggleProps) => {
  return (
    <div className="flex items-center space-x-2 p-2 border rounded-lg bg-card">
      <Switch
        id="encryption-toggle"
        checked={enabled}
        onCheckedChange={onToggle}
      />
      <Label
        htmlFor="encryption-toggle"
        className="flex items-center gap-2 cursor-pointer"
      >
        {enabled ? (
          <>
            <Shield className="h-4 w-4 text-green-600" />
            <span>Encryption Enabled</span>
          </>
        ) : (
          <>
            <ShieldOff className="h-4 w-4 text-gray-500" />
            <span>Encryption Disabled</span>
          </>
        )}
      </Label>
    </div>
  );
};
