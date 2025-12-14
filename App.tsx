import React, { useState, Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import { Experience } from './components/Experience';
import { UIOverlay } from './components/UIOverlay';
import { GestureController } from './components/GestureController';
import { TreeMode } from './types';

// ------------------------------------------------------------------
// 📸 照片配置
// 路径保持 "/photos/" 不变，对应你现在的文件夹
// ------------------------------------------------------------------
const MY_PHOTOS = [
  "/photos/1.jpg",
  "/photos/2.png",
  "/photos/3.jpg",
  "/photos/4.jpg",
  "/photos/5.png",
  "/photos/6.png",
  "/photos/7.png",
  "/photos/8.png",
  "/photos/9.png",
  "/photos/10.png",
  "/photos/11.png",
  "/photos/12.png",
  "/photos/13.png",
  "/photos/14.png",
  "/photos/15.png",
  "/photos/16.png",
  "/photos/17.png",
  "/photos/18.png",
  "/photos/19.jpg", 
  "/photos/20.png"
];

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: any) { return { hasError: true }; }
  componentDidCatch(error: any, errorInfo: any) { console.error("Error loading 3D scene:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 text-[#D4AF37] font-serif p-8 text-center">
          <div>
            <h2 className="text-2xl mb-2">Something went wrong</h2>
            <button onClick={() => this.setState({ hasError: false })} className="mt-4 px-4 py-2 border border-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-colors">Try Again</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [mode, setMode] = useState<TreeMode>(TreeMode.FORMED);
  const [handPosition, setHandPosition] = useState<{ x: number; y: number; detected: boolean }>({ x: 0.5, y: 0.5, detected: false });

  // ------------------------------------------------------------------
  // ✅ 智能填充逻辑 (确保无白框)
  // ------------------------------------------------------------------
  const initialPhotos = useMemo(() => {
    const targetCount = 30; 
    let filledPhotos = [...MY_PHOTOS];
    while (filledPhotos.length < targetCount && filledPhotos.length > 0) {
      filledPhotos = [...filledPhotos, ...MY_PHOTOS];
    }
    return filledPhotos;
  }, []);

  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>(initialPhotos);

  const toggleMode = () => {
    setMode((prev) => (prev === TreeMode.FORMED ? TreeMode.CHAOS : TreeMode.FORMED));
  };

  const handleHandPosition = (x: number, y: number, detected: boolean) => {
    setHandPosition({ x, y, detected });
  };

  const handlePhotosUpload = (photos: string[]) => {
    setUploadedPhotos(photos);
  };

  return (
    <div className="w-full h-screen relative bg-gradient-to-b from-black via-[#001a0d] to-[#0a2f1e]">
      {/* 引入优雅的手写字体 Great Vibes */}
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap');`}
      </style>

      <ErrorBoundary>
        <Canvas dpr={[1, 2]} camera={{ position: [0, 4, 20], fov: 45 }} gl={{ antialias: false, stencil: false, alpha: false }} shadows>
          <Suspense fallback={null}>
            <Experience mode={mode} handPosition={handPosition} uploadedPhotos={uploadedPhotos} />
          </Suspense>
        </Canvas>
      </ErrorBoundary>
      
      <Loader 
        containerStyles={{ background: '#000' }} 
        innerStyles={{ width: '300px', height: '10px', background: '#333' }}
        barStyles={{ background: '#D4AF37', height: '10px' }}
        dataStyles={{ color: '#D4AF37', fontFamily: 'Cinzel' }}
      />
      
      <UIOverlay mode={mode} onToggle={toggleMode} onPhotosUpload={handlePhotosUpload} hasPhotos={uploadedPhotos.length > 0} />
      
      {/* ================================================================================== */}
      {/* 💌 给 Conrad 的手写体英文贺卡 (右下角) */}
      {/* ================================================================================== */}
      <div className="absolute bottom-8 right-8 md:bottom-12 md:right-16 z-40 text-right pointer-events-none select-none">
          <div 
            style={{ fontFamily: "'Great Vibes', cursive" }} 
            className="text-[#D4AF37] drop-shadow-[0_2px_4px_rgba(0,0,0,1)] opacity-90"
          >
              {/* 优雅的英文表达 */}
              <p className="text-2xl md:text-3xl leading-relaxed">
                  Thank you for your guidance and help this year.
              </p>
              <p className="text-2xl md:text-3xl leading-relaxed mt-1">
                  Your support meant a lot to me,
              </p>
              <p className="text-2xl md:text-3xl leading-relaxed mt-1">
                  especially during the visa process.
              </p>
              <p className="text-2xl md:text-3xl leading-relaxed mt-1">
                  Looking forward to working together in the new year.
              </p>

              {/* 落款 */}
              <div className="mt-6 border-t border-[#D4AF37]/40 w-full ml-auto"></div>
              <p className="text-4xl md:text-5xl mt-4 transform -rotate-2 origin-bottom-right">
                  Merry Christmas, Conrad
              </p>
          </div>
      </div>
      {/* ================================================================================== */}
      
      <GestureController currentMode={mode} onModeChange={setMode} onHandPosition={handleHandPosition} />
    </div>
  );
}
