import { useEffect, useRef } from "react"
import { Platform } from "react-native"

/**
 * ShaderAnimation — WebGL shader background for TierLog landing page.
 *
 * Renders an animated abstract light pattern using Three.js fragment shaders.
 * Colors are tuned to the TierLog indigo/violet palette.
 *
 * NOTE: This component uses WebGL and only works on web.
 * On native platforms it renders nothing.
 * Three.js is dynamically required only on web to avoid bundling on native.
 */
export function ShaderAnimation() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<any>(null)

  useEffect(() => {
    if (Platform.OS !== "web") return
    if (!containerRef.current) return

    // Dynamic require — Three.js only loads on web, never bundled for native
    const THREE = require("three")

    const container = containerRef.current

    const vertexShader = `
      void main() {
        gl_Position = vec4( position, 1.0 );
      }
    `

    const fragmentShader = `
      #define TWO_PI 6.2831853072
      #define PI 3.14159265359

      precision highp float;
      uniform vec2 resolution;
      uniform float time;

      void main(void) {
        vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
        float t = time * 0.05;
        float lineWidth = 0.002;

        vec3 color = vec3(0.0);
        for (int j = 0; j < 3; j++) {
          for (int i = 0; i < 5; i++) {
            color[j] += lineWidth * float(i * i) / abs(
              fract(t - 0.01 * float(j) + float(i) * 0.01) * 5.0
              - length(uv)
              + mod(uv.x + uv.y, 0.2)
            );
          }
        }

        color *= vec3(0.45, 0.25, 1.0);
        color *= 0.55;

        float vignette = 1.0 - smoothstep(0.4, 1.4, length(uv));
        color *= mix(0.6, 1.0, vignette);

        gl_FragColor = vec4(color, 1.0);
      }
    `

    const camera = new THREE.Camera()
    camera.position.z = 1

    const scene = new THREE.Scene()
    const geometry = new THREE.PlaneGeometry(2, 2)

    const uniforms = {
      time: { type: "f" as const, value: 1.0 },
      resolution: { type: "v2" as const, value: new THREE.Vector2() },
    }

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
    })

    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setClearColor(0x020617, 1)

    container.appendChild(renderer.domElement)

    const onWindowResize = () => {
      const width = container.clientWidth
      const height = container.clientHeight
      renderer.setSize(width, height)
      uniforms.resolution.value.x = renderer.domElement.width
      uniforms.resolution.value.y = renderer.domElement.height
    }

    onWindowResize()
    window.addEventListener("resize", onWindowResize, false)

    let animationId = 0

    const animate = () => {
      animationId = requestAnimationFrame(animate)
      uniforms.time.value += 0.05
      renderer.render(scene, camera)
    }

    sceneRef.current = { camera, scene, renderer, uniforms, animationId }
    animate()

    return () => {
      window.removeEventListener("resize", onWindowResize)
      cancelAnimationFrame(animationId)

      if (container && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement)
      }

      renderer.dispose()
      geometry.dispose()
      material.dispose()
      sceneRef.current = null
    }
  }, [])

  if (Platform.OS !== "web") return null

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0"
      style={{ background: "#020617", overflow: "hidden" }}
    />
  )
}
