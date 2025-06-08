'use client';

import { useEffect, useRef, useState } from 'react';

interface CanvasOverlayProps {
  isDrawingMode: boolean;
  onDraw?: (drawingData: any) => void;
  autoSave?: boolean; // Whether to auto-save drawings
  activeDrawing?: any; // Drawing data to display from an annotation
}

export function CanvasOverlay({
  isDrawingMode,
  onDraw,
  autoSave = false,
  activeDrawing,
}: CanvasOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [drawingHistory, setDrawingHistory] = useState<ImageData[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [savedFeedback, setSavedFeedback] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setContext(ctx);

    // Set canvas size to match parent
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        // Get the exact dimensions of the parent
        const rect = parent.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        // Update canvas internal dimensions
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
      }
    };

    // Initial resize
    resizeCanvas();

    // Debounced resize handler
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resizeCanvas, 100);
    };

    window.addEventListener('resize', handleResize);

    // Also observe for layout changes (e.g., when side panels open/close)
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Update pointer events based on drawing mode
    canvas.style.pointerEvents = isDrawingMode ? 'auto' : 'none';

    // Recalculate canvas size when drawing mode changes
    // This helps fix offset issues when layout changes
    const updateCanvasSize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        const rect = parent.getBoundingClientRect();
        // Store current drawing if any
        let imageData = null;
        if (context && canvas.width > 0 && canvas.height > 0) {
          imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        }

        // Update canvas dimensions to match parent
        canvas.width = rect.width;
        canvas.height = rect.height;
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';

        // Restore drawing if there was one
        if (imageData && context) {
          context.putImageData(imageData, 0, 0);
        }
      }
    };

    // Update size immediately
    updateCanvasSize();

    // Also update on next frame to catch any layout shifts
    requestAnimationFrame(updateCanvasSize);
  }, [isDrawingMode]);

  // Display active drawing from annotation
  useEffect(() => {
    if (!context || !canvasRef.current) return;

    if (activeDrawing && activeDrawing.drawing_data?.dataUrl) {
      // Clear canvas first
      context.clearRect(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );

      // Load and display the drawing
      const img = new Image();
      img.onload = () => {
        // Scale the drawing to fit the current canvas size
        const scaleX =
          canvasRef.current!.width /
          (activeDrawing.original_canvas_width || canvasRef.current!.width);
        const scaleY =
          canvasRef.current!.height /
          (activeDrawing.original_canvas_height || canvasRef.current!.height);

        context.save();
        context.scale(scaleX, scaleY);
        context.drawImage(img, 0, 0);
        context.restore();
      };
      img.src = activeDrawing.drawing_data.dataUrl;
    } else if (!isDrawingMode) {
      // Clear canvas when no active drawing and not in drawing mode
      context.clearRect(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );
    }
  }, [activeDrawing, context, isDrawingMode]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    // Get the bounding rect which accounts for any layout shifts
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Calculate coordinates relative to the canvas element
    // This accounts for any shifts in the canvas position due to layout changes
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Scale the coordinates if the canvas internal size differs from display size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: x * scaleX,
      y: y * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingMode || !context) return;

    setIsDrawing(true);
    const { x, y } = getCoordinates(e);

    context.beginPath();
    context.moveTo(x, y);
    context.strokeStyle = '#FF0000'; // Red color for visibility
    context.lineWidth = 3;
    context.lineCap = 'round';
    context.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !isDrawingMode || !context) return;

    const { x, y } = getCoordinates(e);
    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;

    setIsDrawing(false);

    // Save current state to history
    if (context && canvasRef.current) {
      const imageData = context.getImageData(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );
      const newHistory = drawingHistory.slice(0, currentStep + 1);
      newHistory.push(imageData);
      setDrawingHistory(newHistory);
      setCurrentStep(newHistory.length - 1);

      // Only save drawing data if autoSave is enabled
      if (autoSave && onDraw && canvasRef.current) {
        // Convert canvas to data URL and save as JSON
        const dataUrl = canvasRef.current.toDataURL('image/png');
        onDraw({
          dataUrl: dataUrl,
          timestamp: new Date().toISOString(),
          dimensions: {
            width: canvasRef.current.width,
            height: canvasRef.current.height,
          },
        });
      }
    }
  };

  const saveDrawing = () => {
    if (!onDraw || !canvasRef.current || !context) return;

    // Check if canvas has any content (check if we have drawing history)
    if (currentStep < 0) {
      alert('Please draw something before saving');
      return;
    }

    // Convert canvas to data URL and save
    const dataUrl = canvasRef.current.toDataURL('image/png');
    onDraw({
      dataUrl: dataUrl,
      timestamp: new Date().toISOString(),
      dimensions: {
        width: canvasRef.current.width,
        height: canvasRef.current.height,
      },
    });

    // Provide feedback
    console.log('Drawing saved successfully');
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  const clearCanvas = () => {
    if (!context || !canvasRef.current) return;
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setDrawingHistory([]);
    setCurrentStep(-1);
  };

  const undo = () => {
    if (!context || !canvasRef.current || currentStep < 0) return;

    const newStep = currentStep - 1;
    setCurrentStep(newStep);

    if (newStep >= 0) {
      context.putImageData(drawingHistory[newStep], 0, 0);
    } else {
      context.clearRect(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );
    }
  };

  return (
    <>
      {/* Canvas for drawing - positioned to not block controls */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 ${
          isDrawingMode ? 'cursor-crosshair' : 'cursor-default'
        }`}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        style={{
          pointerEvents: isDrawingMode ? 'auto' : 'none',
          zIndex: 5, // Lower z-index than controls
          left: 0,
          top: 0,
          position: 'absolute',
        }}
      />

      {/* Drawing Controls - Higher z-index to ensure clickability */}
      {(isDrawingMode || currentStep >= 0) && (
        <div
          className="absolute top-4 right-4 flex gap-2"
          style={{ zIndex: 60 }}
        >
          {isDrawingMode && (
            <>
              {/* Only show save button when NOT in autoSave mode */}
              {!autoSave && currentStep >= 0 && (
                <button
                  onClick={saveDrawing}
                  className="bg-green-600/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-md shadow-lg hover:bg-green-700/80 transition-colors text-sm font-medium flex items-center gap-1.5"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2"
                    />
                  </svg>
                  Save Drawing
                </button>
              )}
              <button
                onClick={undo}
                className="bg-gray-800/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-md shadow-lg hover:bg-gray-700/80 transition-colors text-sm font-medium disabled:opacity-50"
                disabled={currentStep < 0}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                  />
                </svg>
              </button>
            </>
          )}
          <button
            onClick={clearCanvas}
            className="bg-gray-800/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-md shadow-lg hover:bg-gray-700/80 transition-colors text-sm font-medium flex items-center gap-1.5"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Clear
          </button>
        </div>
      )}

      {/* Saved feedback */}
      {savedFeedback && (
        <div
          className="absolute top-20 left-1/2 -translate-x-1/2 bg-green-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-lg animate-pulse"
          style={{ zIndex: 70 }}
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Drawing saved!
          </div>
        </div>
      )}
    </>
  );
}
