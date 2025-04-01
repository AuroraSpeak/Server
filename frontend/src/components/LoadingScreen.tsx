import { Loader2 } from "lucide-react";
import AuraLogo from "./AuraLogo";

export default function LoadingScreen() {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-aura-bg">
      <div className="flex flex-col items-center">
        <AuraLogo size={64} className="mb-4" />
        <Loader2 className="h-8 w-8 animate-spin text-aura-primary" />
      </div>
    </div>
  );
}
