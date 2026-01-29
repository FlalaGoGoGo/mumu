import { ReactNode, useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function MobileBottomSheet({ isOpen, onClose, title, children }: MobileBottomSheetProps) {
  const [sheetHeight, setSheetHeight] = useState(50); // percentage
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startY: number; startHeight: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSheetHeight(50);
    }
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    dragRef.current = {
      startY: e.touches[0].clientY,
      startHeight: sheetHeight,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragRef.current) return;
    
    const deltaY = dragRef.current.startY - e.touches[0].clientY;
    const deltaPercent = (deltaY / window.innerHeight) * 100;
    const newHeight = Math.min(90, Math.max(20, dragRef.current.startHeight + deltaPercent));
    
    setSheetHeight(newHeight);
  };

  const handleTouchEnd = () => {
    if (!dragRef.current) return;
    
    // Snap to positions
    if (sheetHeight < 30) {
      onClose();
    } else if (sheetHeight < 60) {
      setSheetHeight(50);
    } else {
      setSheetHeight(85);
    }
    
    dragRef.current = null;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-foreground/20 z-40 md:hidden"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div
        ref={sheetRef}
        className="fixed left-0 right-0 bottom-0 z-50 md:hidden bottom-sheet slide-up"
        style={{ height: `${sheetHeight}vh` }}
      >
        {/* Drag Handle */}
        <div
          className="flex flex-col items-center pt-2 pb-1 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="bottom-sheet-handle" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 py-2 border-b border-border">
            <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4" style={{ maxHeight: `calc(${sheetHeight}vh - 80px)` }}>
          {children}
        </div>
      </div>
    </>
  );
}
