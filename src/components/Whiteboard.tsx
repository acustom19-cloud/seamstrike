
import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Trash2, PenTool, Download, LayoutTemplate, Square } from 'lucide-react';

interface WhiteboardProps {
  sport: 'Baseball' | 'Softball';
}

const Whiteboard: React.FC<WhiteboardProps> = ({ sport }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(3);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [background, setBackground] = useState<'blank' | 'field'>('field');

  // Initialize canvas
  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [background]); // Re-draw background on change

  const handleResize = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Save current image content
    const context = canvas.getContext('2d');
    if (!context) return;
    
    // Store existing content if resizing (optional advanced feature, for now we might clear or just keep simplistic)
    // simpler to just resize and redraw background for this v1
    
    const { width, height } = container.getBoundingClientRect();
    // Handle high DPI
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    context.scale(dpr, dpr);
    context.lineCap = 'round';
    context.lineJoin = 'round';

    drawBackground(context, width, height);
  };

  const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    if (background === 'field') {
        // Draw Field Diagram
        ctx.strokeStyle = '#cbd5e1'; // slate-300
        ctx.lineWidth = 2;
        
        const cx = width / 2;
        const cy = height * 0.8;
        const scale = Math.min(width, height) / 500;

        // Infield dirt area (diamondish)
        ctx.beginPath();
        ctx.fillStyle = '#f8fafc'; // slate-50
        ctx.arc(cx, cy - (100 * scale), 200 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Foul Lines
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx - (300 * scale), cy - (300 * scale));
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + (300 * scale), cy - (300 * scale));
        ctx.stroke();

        // Diamond
        ctx.beginPath();
        ctx.moveTo(cx, cy); // Home
        ctx.lineTo(cx + (90 * scale), cy - (90 * scale)); // 1B
        ctx.lineTo(cx, cy - (180 * scale)); // 2B
        ctx.lineTo(cx - (90 * scale), cy - (90 * scale)); // 3B
        ctx.closePath();
        ctx.fillStyle = '#fff7ed'; // orange-50
        ctx.fill();
        ctx.stroke();

        // Bases
        const baseSize = 8 * scale;
        ctx.fillStyle = 'white';
        ctx.strokeStyle = '#94a3b8';
        // 2B
        ctx.strokeRect(cx - baseSize, cy - (180 * scale) - baseSize, baseSize * 2, baseSize * 2);
        // 1B
        ctx.strokeRect(cx + (90 * scale) - baseSize, cy - (90 * scale) - baseSize, baseSize * 2, baseSize * 2);
        // 3B
        ctx.strokeRect(cx - (90 * scale) - baseSize, cy - (90 * scale) - baseSize, baseSize * 2, baseSize * 2);
        // Home
        ctx.strokeRect(cx - baseSize, cy - baseSize * 2, baseSize * 2, baseSize * 2);

        // Mound
        ctx.beginPath();
        ctx.arc(cx, cy - (90 * scale), 10 * scale, 0, Math.PI * 2);
        ctx.stroke();
    }
  };

  // Input Handling
  const getPoint = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
    }

    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const { x, y } = getPoint(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth = tool === 'eraser' ? 20 : lineWidth;
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const { x, y } = getPoint(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.closePath();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { width, height } = container.getBoundingClientRect();
    drawBackground(ctx, width, height);
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Toolbar */}
      <div className="bg-slate-50 p-3 border-b border-slate-200 flex flex-wrap items-center gap-4 justify-between">
         <div className="flex items-center gap-2">
            <div className="flex bg-white rounded-lg border border-slate-200 p-1">
                <button 
                    onClick={() => setTool('pen')}
                    className={`p-2 rounded ${tool === 'pen' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
                    title="Pen"
                >
                    <PenTool className="w-5 h-5" />
                </button>
                <button 
                    onClick={() => setTool('eraser')}
                    className={`p-2 rounded ${tool === 'eraser' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
                    title="Eraser"
                >
                    <Eraser className="w-5 h-5" />
                </button>
            </div>

            <div className="h-8 w-px bg-slate-300 mx-2" />

            {/* Colors */}
            <div className="flex gap-2">
                {['#000000', '#ef4444', '#3b82f6', '#22c55e', '#eab308'].map(c => (
                    <button
                        key={c}
                        onClick={() => { setColor(c); setTool('pen'); }}
                        className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${color === c && tool === 'pen' ? 'border-indigo-500 shadow-md ring-2 ring-indigo-200' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                    />
                ))}
            </div>
         </div>

         <div className="flex items-center gap-2">
             <button 
                onClick={() => setBackground(prev => prev === 'field' ? 'blank' : 'field')}
                className="flex items-center px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50"
             >
                {background === 'field' ? <Square className="w-4 h-4 mr-1.5" /> : <LayoutTemplate className="w-4 h-4 mr-1.5" />}
                {background === 'field' ? 'Blank' : 'Field'}
             </button>
             <button 
                onClick={clearCanvas}
                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"
                title="Clear Board"
             >
                <Trash2 className="w-5 h-5" />
             </button>
             <button 
                onClick={downloadCanvas}
                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                title="Save Image"
             >
                <Download className="w-5 h-5" />
             </button>
         </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-grow bg-white relative cursor-crosshair touch-none" ref={containerRef}>
         <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
         />
      </div>
    </div>
  );
};

export default Whiteboard;
