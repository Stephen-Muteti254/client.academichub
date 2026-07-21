import { useState, useEffect } from "react";
import { WriterProfile } from "@/components/WriterProfile";

export default function Profile() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Auto-open the profile popup when page loads
    setIsOpen(true);
  }, []);

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <WriterProfile isOpen={isOpen} onOpenChange={setIsOpen} />
    </div>
  );
}
