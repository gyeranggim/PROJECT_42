'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { RotateCcw, Check, PenTool } from 'lucide-react';

interface SignaturePadProps {
  onChange: (dataUrl: string | null) => void;
  width?: number;
  height?: number;
}

export default function SignaturePad({
  onChange,
  width = 360,
  height = 140,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // 캔버스 초기화
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#1E3932'; // House Green 펜
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else if ('clientX' in e) {
      return {
        x: (e as React.MouseEvent<HTMLCanvasElement>).clientX - rect.left,
        y: (e as React.MouseEvent<HTMLCanvasElement>).clientY - rect.top,
      };
    }
    return { x: 0, y: 0 };
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();

    if (!hasDrawn) {
      setHasDrawn(true);
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (canvas && hasDrawn) {
      const dataUrl = canvas.toDataURL('image/png');
      onChange(dataUrl);
    }
  };

  const clearCanvas = () => {
    initCanvas();
    setHasDrawn(false);
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <label className="flex items-center gap-1.5 font-bold text-[#1E3932]">
          <PenTool className="h-3.5 w-3.5 text-[#00754A]" />
          <span>전자서명 (필수)</span>
        </label>
        <div className="flex items-center gap-2">
          {hasDrawn ? (
            <span className="flex items-center gap-1 text-[11px] font-bold text-[#00754A]">
              <Check className="h-3.5 w-3.5" />
              서명 완료
            </span>
          ) : (
            <span className="text-[11px] font-medium text-[#c82014]">
              * 마우스나 손가락으로 서명해 주세요
            </span>
          )}
          <button
            type="button"
            onClick={clearCanvas}
            className="flex items-center gap-1 rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-medium text-stone-600 transition hover:bg-stone-50"
            title="서명 지우기"
          >
            <RotateCcw className="h-3 w-3" />
            지우기
          </button>
        </div>
      </div>

      <div className="relative rounded-xl border border-stone-300 bg-white shadow-inner overflow-hidden">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={(e) => {
            e.preventDefault();
            startDrawing(e);
          }}
          onTouchMove={(e) => {
            e.preventDefault();
            draw(e);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            stopDrawing();
          }}
          className="w-full cursor-crosshair touch-none bg-white"
          style={{ height: `${height}px` }}
        />
        {!hasDrawn && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-stone-300">
            여기에 서명해 주세요
          </div>
        )}
      </div>
    </div>
  );
}
