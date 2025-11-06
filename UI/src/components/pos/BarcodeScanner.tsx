import { useEffect, useRef, useState } from 'react';
import Quagga from 'quagga';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
}

export function BarcodeScanner({ onScan }: BarcodeScannerProps) {
  const [manualInput, setManualInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLDivElement>(null);

  const startScanner = () => {
    setScanning(true);
    
    if (videoRef.current) {
      Quagga.init(
        {
          inputStream: {
            name: 'Live',
            type: 'LiveStream',
            target: videoRef.current,
            constraints: {
              width: 640,
              height: 480,
              facingMode: 'environment',
            },
          },
          decoder: {
            readers: [
              'code_128_reader',
              'ean_reader',
              'ean_8_reader',
              'code_39_reader',
              'code_39_vin_reader',
              'codabar_reader',
              'upc_reader',
              'upc_e_reader',
            ],
          },
        },
        (err) => {
          if (err) {
            console.error('Error starting barcode scanner:', err);
            setScanning(false);
            return;
          }
          Quagga.start();
        }
      );

      Quagga.onDetected((data) => {
        if (data.codeResult.code) {
          onScan(data.codeResult.code);
          stopScanner();
        }
      });
    }
  };

  const stopScanner = () => {
    Quagga.stop();
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      if (scanning) {
        Quagga.stop();
      }
    };
  }, [scanning]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onScan(manualInput.trim());
      setManualInput('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Scan with Camera</Label>
        <div
          ref={videoRef}
          className="w-full h-64 bg-muted rounded-lg flex items-center justify-center overflow-hidden"
        >
          {!scanning && (
            <p className="text-muted-foreground">Camera will appear here</p>
          )}
        </div>
        <div className="flex gap-2">
          {!scanning ? (
            <Button onClick={startScanner} className="flex-1">
              Start Camera
            </Button>
          ) : (
            <Button onClick={stopScanner} variant="destructive" className="flex-1">
              Stop Camera
            </Button>
          )}
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or</span>
        </div>
      </div>

      <form onSubmit={handleManualSubmit} className="space-y-2">
        <Label>Enter Barcode Manually</Label>
        <div className="flex gap-2">
          <Input
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Enter SKU or barcode"
          />
          <Button type="submit">Submit</Button>
        </div>
      </form>
    </div>
  );
}
