import { useEffect, useRef } from 'react';
import './Hyperspeed.css';

interface HyperspeedSimpleProps {
  color1?: string;
  color2?: string;
  color3?: string;
}

const HyperspeedSimple = ({ 
  color1 = '#d856bf', 
  color2 = '#03b3c3',
  color3 = '#6750a2'
}: HyperspeedSimpleProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle system
    class Particle {
      x: number;
      y: number;
      z: number;
      color: string;
      speed: number;

      constructor(width: number, height: number, color: string) {
        this.x = Math.random() * width - width / 2;
        this.y = Math.random() * height - height / 2;
        this.z = Math.random() * 1000;
        this.color = color;
        this.speed = Math.random() * 2 + 1;
      }

      update(speed: number) {
        this.z -= speed * this.speed;
        if (this.z <= 0) {
          this.z = 1000;
          this.x = Math.random() * canvas!.width - canvas!.width / 2;
          this.y = Math.random() * canvas!.height - canvas!.height / 2;
        }
      }

      draw(ctx: CanvasRenderingContext2D, centerX: number, centerY: number) {
        const scale = 1000 / (1000 + this.z);
        const x2d = this.x * scale + centerX;
        const y2d = this.y * scale + centerY;
        const size = (1 - this.z / 1000) * 3;

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(x2d, y2d, size, 0, Math.PI * 2);
        ctx.fill();

        // Draw trail
        const prevZ = this.z + 10;
        const prevScale = 1000 / (1000 + prevZ);
        const prevX = this.x * prevScale + centerX;
        const prevY = this.y * prevScale + centerY;

        const gradient = ctx.createLinearGradient(prevX, prevY, x2d, y2d);
        gradient.addColorStop(0, this.color + '00');
        gradient.addColorStop(1, this.color);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = size;
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(x2d, y2d);
        ctx.stroke();
      }
    }

    // Create particles
    const colors = [color1, color2, color3];
    const particles: Particle[] = [];
    for (let i = 0; i < 200; i++) {
      particles.push(new Particle(
        canvas.width,
        canvas.height,
        colors[Math.floor(Math.random() * colors.length)]
      ));
    }

    // Animation loop
    let animationId: number;
    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      particles.forEach(particle => {
        particle.update(5);
        particle.draw(ctx, centerX, centerY);
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [color1, color2, color3]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none'
      }}
    />
  );
};

export default HyperspeedSimple;
