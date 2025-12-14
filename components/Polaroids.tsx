import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeMode } from '../types';

interface PolaroidsProps {
  mode: TreeMode;
  uploadedPhotos: string[];
}

interface PhotoData {
  id: number;
  url: string;
  chaosPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  speed: number;
}

const PolaroidItem: React.FC<{ data: PhotoData; mode: TreeMode; index: number }> = ({ data, mode, index }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(
      data.url,
      (loadedTex) => {
        loadedTex.colorSpace = THREE.SRGBColorSpace;
        setTexture(loadedTex);
        setError(false);
      },
      undefined,
      (err) => {
        console.warn(`Failed to load image: ${data.url}`, err);
        setError(true);
      }
    );
  }, [data.url]);
  
  const swayOffset = useMemo(() => Math.random() * 100, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const isFormed = mode === TreeMode.FORMED;
    const time = state.clock.elapsedTime;
    
    // 1. Position Interpolation
    const targetPos = isFormed ? data.targetPos : data.chaosPos;
    const step = delta * data.speed;
    groupRef.current.position.lerp(targetPos, step);

    // 2. Rotation & Sway Logic
    if (isFormed) {
        const dummy = new THREE.Object3D();
        dummy.position.copy(groupRef.current.position);
        dummy.lookAt(0, groupRef.current.position.y, 0); 
        dummy.rotateY(Math.PI); // Flip to face out
        groupRef.current.quaternion.slerp(dummy.quaternion, step);
        
        const swayAngle = Math.sin(time * 2.0 + swayOffset) * 0.08;
        const tiltAngle = Math.cos(time * 1.5 + swayOffset) * 0.05;
        
        const currentRot = new THREE.Euler().setFromQuaternion(groupRef.current.quaternion);
        groupRef.current.rotation.z = currentRot.z + swayAngle * 0.05; 
        groupRef.current.rotation.x = currentRot.x + tiltAngle * 0.05;
        
    } else {
        const cameraPos = new THREE.Vector3(0, 9, 20);
        const dummy = new THREE.Object3D();
        dummy.position.copy(groupRef.current.position);
        dummy.lookAt(cameraPos);
        groupRef.current.quaternion.slerp(dummy.quaternion, delta * 3);
        
        const wobbleX = Math.sin(time * 1.5 + swayOffset) * 0.03;
        const wobbleZ = Math.cos(time * 1.2 + swayOffset) * 0.03;
        
        const currentRot = new THREE.Euler().setFromQuaternion(groupRef.current.quaternion);
        groupRef.current.rotation.x = currentRot.x + wobbleX;
        groupRef.current.rotation.z = currentRot.z + wobbleZ;
    }
  });

  return (
    <group ref={groupRef}>
      {/* 挂绳 (Visual only) */}
      <mesh position={[0, 1.2, -0.1]}>
        <cylinderGeometry args={[0.005, 0.005, 1.5]} />
        <meshStandardMaterial color="#D4AF37" metalness={1} roughness={0.2} transparent opacity={0.6} />
      </mesh>

      <group position={[0, 0, 0]}>
        
        {/* 1. 相框底板 (白纸) */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.2, 1.5, 0.02]} />
          <meshStandardMaterial color="#fdfdfd" roughness={0.8} />
        </mesh>

        {/* 2. 黑色衬底 (新增：防止白色论文图片和白底板融为一体) */}
        <mesh position={[0, 0.15, 0.021]}>
           <planeGeometry args={[1.02, 1.02]} />
           <meshBasicMaterial color="#000000" />
        </mesh>

        {/* 3. 照片区域 */}
        <mesh position={[0, 0.15, 0.025]}>
          <planeGeometry args={[1.0, 1.0]} />
          {texture && !error ? (
            <meshBasicMaterial map={texture} />
          ) : (
            // 红色表示真的出错了
            <meshStandardMaterial color={error ? "#550000" : "#cccccc"} />
          )}
        </mesh>
        
        {/* 金色夹子 */}
        <mesh position={[0, 0.7, 0.025]} rotation={[0,0,0]}>
           <boxGeometry args={[0.1, 0.05, 0.05]} />
           <meshStandardMaterial color="#D4AF37" metalness={1} roughness={0.2} />
        </mesh>

        {/* ❌ 我删除了这里的 <Text> 组件 */}
        {/* 这样就不会再显示 "Happy Memories" 了，画面会非常干净 */}
        
      </group>
    </group>
  );
};

export const Polaroids: React.FC<PolaroidsProps> = ({ mode, uploadedPhotos }) => {
  const photoData = useMemo(() => {
    if (uploadedPhotos.length === 0) return [];

    const data: PhotoData[] = [];
    const height = 9; 
    const maxRadius = 5.0; 
    const count = uploadedPhotos.length;

    for (let i = 0; i < count; i++) {
      const yNorm = 0.2 + (i / count) * 0.6; 
      const y = yNorm * height;
      const r = maxRadius * (1 - yNorm) + 0.8; 
      const theta = i * 2.39996; 
      
      const targetPos = new THREE.Vector3(
        r * Math.cos(theta),
        y,
        r * Math.sin(theta)
      );

      const relativeY = 5; 
      const relativeZ = 20; 
      const angle = (i / count) * Math.PI * 2; 
      const distance = 3 + Math.random() * 4; 
      const heightSpread = (Math.random() - 0.5) * 8; 
      
      const chaosPos = new THREE.Vector3(
        distance * Math.cos(angle) * 1.2, 
        relativeY + heightSpread, 
        relativeZ - 4 + distance * Math.sin(angle) * 0.5 
      );

      data.push({
        id: i,
        url: uploadedPhotos[i],
        chaosPos,
        targetPos,
        speed: 0.8 + Math.random() * 1.5 
      });
    }
    return data;
  }, [uploadedPhotos]);

  return (
    <group>
      {photoData.map((data, i) => (
        <PolaroidItem key={i} index={i} data={data} mode={mode} />
      ))}
    </group>
  );
};
