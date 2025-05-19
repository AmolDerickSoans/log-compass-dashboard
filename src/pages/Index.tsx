
import { useState } from "react";
import { LogDashboard } from "@/components/LogDashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const Index = () => {
  const [websocketUrl, setWebsocketUrl] = useState("ws://localhost:8000/logs/ws/logs");
  const [inputUrl, setInputUrl] = useState(websocketUrl);
  const [showAlert, setShowAlert] = useState(false);

  const handleConnectClick = () => {
    if (!inputUrl.startsWith('ws://') && !inputUrl.startsWith('wss://')) {
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 5000);
      return;
    }
    
    setShowAlert(false);
    setWebsocketUrl(inputUrl);
  };

  return (
    <div className="min-h-screen bg-background dark flex flex-col p-4 md:p-6">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
          <h1 className="text-2xl font-semibold tracking-tight">Log Observability Dashboard</h1>
          <div className="flex flex-col w-full md:w-auto gap-2">
            <div className="flex items-center gap-2">
              <Input 
                value={inputUrl} 
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="WebSocket URL (ws:// or wss://)"
                className="h-9 md:w-[300px] font-mono text-xs"
              />
              <Button onClick={handleConnectClick} className="h-9">Connect</Button>
            </div>
            
            {showAlert && (
              <Alert variant="destructive" className="p-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  WebSocket URL must start with ws:// or wss://
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
        
        <div className="h-[calc(100vh-160px)]">
          <LogDashboard websocketUrl={websocketUrl} />
        </div>
      </div>
    </div>
  );
};

export default Index;
